import { useChainType } from "@/aiParams";
import { ChainType } from "@/chainFactory";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardContent, CardHeader } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { VAULT_VECTOR_STORE_STRATEGY } from "@/constants";
import { useSettingsValue } from "@/settings/model";
import { PlusCircle, TriangleAlert } from "lucide-react";
import React, { useMemo } from "react";

interface NotePrompt {
  title: string;
  prompts: string[];
}
const SUGGESTED_PROMPTS: Record<string, NotePrompt> = {
  activeNote: {
    title: "当前笔记洞察",
    prompts: [
      `根据{activeNote}，提供三个后续问题，就好像我在问你一样？`,
      `{activeNote}回答了哪些关键问题？`,
      `用两句话快速概括{activeNote}的内容。`,
    ],
  },
  quoteNote: {
    title: "笔记链接对话",
    prompts: [
      `基于[[<note>]]，我们下一步应该关注哪些改进？`,
      `总结[[<note>]]中的要点。`,
      `总结[[<note>]]中的最新更新。`,
      `批评我在[[<note>]]中的写作，并给出具体可行的反馈`,
    ],
  },
  fun: {
    title: "测试人工智能",
    prompts: [
      `9.11和9.8，哪个更大？`,
      `世界上最长的河流是什么？`,
      `如果同时从同一高度落下一个铅球和一根羽毛，哪个会先着地？`,
    ],
  },
  qaVault: {
    title: "知识库问答",
    prompts: [
      `从我的笔记中可以获得关于<topic>的哪些见解？`,
      `根据我存储的笔记解释<concept>。`,
      `从我的笔记中突出<topic>的重要细节。`,
      `基于我关于<topic>的笔记，我应该问但没有问的问题是什么？`,
    ],
  },
  copilotPlus: {
    title: "智能助手增强版",
    prompts: [
      `给我一个上周的回顾 @vault`,
      `我关于<topic>的笔记有哪些关键要点 @vault`,
      `用不超过10个要点总结<url>`,
      `@youtube <video_url>`,
      `@web 人工智能行业最近有哪些更新`,
      `这篇论文<arxiv_url>的主要见解是什么`,
      `这篇论文[[<note_with_embedded_pdf>]]提出了哪些新方法`,
    ],
  },
};

const PROMPT_KEYS: Record<ChainType, Array<keyof typeof SUGGESTED_PROMPTS>> = {
  [ChainType.LLM_CHAIN]: ["activeNote", "quoteNote", "fun"],
  [ChainType.VAULT_QA_CHAIN]: ["qaVault", "qaVault", "quoteNote"],
  [ChainType.COPILOT_PLUS_CHAIN]: ["copilotPlus", "copilotPlus", "copilotPlus"],
};

function getRandomPrompt(chainType: ChainType = ChainType.LLM_CHAIN) {
  const keys = PROMPT_KEYS[chainType] || PROMPT_KEYS[ChainType.LLM_CHAIN];

  // For repeated keys, shuffle once and take multiple items
  const shuffledPrompts: Record<string, string[]> = {};

  return keys.map((key) => {
    if (!shuffledPrompts[key]) {
      shuffledPrompts[key] = [...SUGGESTED_PROMPTS[key].prompts].sort(() => Math.random() - 0.5);
    }
    return {
      title: SUGGESTED_PROMPTS[key].title,
      text: shuffledPrompts[key].pop() || SUGGESTED_PROMPTS[key].prompts[0],
    };
  });
}

interface SuggestedPromptsProps {
  onClick: (text: string) => void;
}

export const SuggestedPrompts: React.FC<SuggestedPromptsProps> = ({ onClick }) => {
  const [chainType] = useChainType();
  const prompts = useMemo(() => getRandomPrompt(chainType), [chainType]);
  const settings = useSettingsValue();
  const indexVaultToVectorStore = settings.indexVaultToVectorStore as VAULT_VECTOR_STORE_STRATEGY;

  return (
    <div className="flex flex-col gap-4">
      <Card className="w-full bg-transparent">
        <CardHeader className="px-2">
          <CardTitle>Suggested Prompts</CardTitle>
        </CardHeader>
        <CardContent className="p-2 pt-0">
          <div className="flex flex-col gap-2">
            {prompts.map((prompt, i) => (
              <div
                key={i}
                className="flex gap-2 p-2 justify-between text-sm rounded-md border border-border border-solid"
              >
                <div className="flex flex-col gap-1">
                  <div className="text-muted">{prompt.title}</div>
                  <div>{prompt.text}</div>
                </div>
                <div className="flex items-start h-full">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost2"
                        size="fit"
                        className="text-muted"
                        onClick={() => onClick(prompt.text)}
                      >
                        <PlusCircle className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Add to Chat</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {chainType === ChainType.VAULT_QA_CHAIN && (
        <div className="text-sm border border-border border-solid p-2 rounded-md">
          Please note that this is a retrieval-based QA. Questions should contain keywords and
          concepts that exist literally in your vault
        </div>
      )}
      {chainType === ChainType.VAULT_QA_CHAIN &&
        indexVaultToVectorStore === VAULT_VECTOR_STORE_STRATEGY.NEVER && (
          <div className="text-sm border border-border border-solid p-2 rounded-md">
            <div>
              <TriangleAlert className="size-4" /> Your auto-index strategy is set to <b>NEVER</b>.
              Before proceeding, click the <span className="text-accent">Refresh Index</span> button
              below or run the{" "}
              <span className="text-accent">Copilot command: Index (refresh) vault for QA</span> to
              update the index.
            </div>
          </div>
        )}
    </div>
  );
};
