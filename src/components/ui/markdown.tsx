"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { cn } from "@/lib/utils";

/**
 * Renders LLM/markdown text safely. rehype-sanitize strips any HTML the model
 * might emit (defense against injected markup — SEC-018), so only formatting
 * (bold, lists, tables, code, links) is rendered.
 */
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div
      className={cn(
        "text-sm leading-relaxed break-words",
        // compact, theme-aware typography for chat/answer bubbles
        "[&_p]:my-1.5 first:[&_p]:mt-0 last:[&_p]:mb-0",
        "[&_strong]:font-semibold [&_em]:italic",
        "[&_ul]:my-1.5 [&_ul]:pl-4 [&_ul]:list-disc [&_ol]:my-1.5 [&_ol]:pl-4 [&_ol]:list-decimal [&_li]:my-0.5",
        "[&_h1]:text-base [&_h1]:font-semibold [&_h1]:mt-2 [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:mt-2 [&_h3]:font-semibold",
        "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2",
        "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em] [&_code]:font-mono",
        "[&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0",
        "[&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground",
        "[&_table]:my-2 [&_table]:w-full [&_table]:text-xs [&_th]:border [&_th]:border-border/50 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_td]:border [&_td]:border-border/40 [&_td]:px-2 [&_td]:py-1",
        "[&_hr]:my-3 [&_hr]:border-border/50",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
