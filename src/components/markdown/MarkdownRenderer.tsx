"use client";
import Markdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";
import CodeBlock, { SourceContext } from "./CodeBlock";
import { memo } from "react";

const components = {
  code: CodeBlock,
};

const MarkdownRenderer = ({ source }: { source: string }) => {
  return (
    <SourceContext.Provider value={source}>
      <Markdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { output: "html" }]]}
        components={components}
      >
        {source}
      </Markdown>
    </SourceContext.Provider>
  );
};

export const MemoizedMarkdown = memo(MarkdownRenderer);
