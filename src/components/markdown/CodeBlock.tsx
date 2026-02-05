"use client";
import {
  ComponentPropsWithoutRef,
  createContext,
  ReactNode,
  useContext,
} from "react";
import DOMPurify from "dompurify";
import "katex/dist/katex.min.css";
import ForceDiagram from "./diagram/ForceDiagram";
import MathPlotDiagram from "./diagram/MathPlotDiagram";
import { TextShimmer } from "../ui/text-shimmer";
import { useTranslation } from "react-i18next";
import MermaidDiagram from "./diagram/MermaidDiagram";
import DiagramRenderer from "./diagram/DiagramRenderer";
import CodeRenderer from "./CodeRenderer";
import { cn } from "@/lib/utils";
import JSXGraphDiagram from "./diagram/JSXGraphDiagram";

type UnistPoint = {
  line: number;
  column: number;
  offset?: number;
};

type UnistPosition = {
  start: UnistPoint;
  end: UnistPoint;
};

type HastNode = {
  type: string;
  tagName?: string;
  position?: UnistPosition;
  children?: HastNode[];
  properties?: Record<string, unknown>;
};

export const SourceContext = createContext<string>("");

export type MarkdownCodeProps = ComponentPropsWithoutRef<"code"> & {
  node?: HastNode;
};

export default function CodeBlock({
  className,
  children,
  node,
  ...props
}: MarkdownCodeProps) {
  const { t } = useTranslation("commons", { keyPrefix: "md" });
  const source = useContext(SourceContext);

  const match = /language-([\w-]+)/.exec(className || "");
  const lang = match ? match[1] : "";
  const content = String(children).replace(/\n$/, "");

  // Check if the code block fence is closed (useful for streaming content)
  const isBlockComplete = (() => {
    if (!node?.position?.end) return false;
    const { end } = node.position;
    if (end.offset === undefined) return true;
    if (end.offset > source.length) return false;

    const endingFence = source.slice(end.offset - 3, end.offset);
    return endingFence === "```" || endingFence === "~~~";
  })();

  const isPlot = lang.startsWith("plot-");
  const isSvg =
    (lang === "svg" || lang === "xml") && content.startsWith("<svg");
  const isJessecode = lang === "jessecode" || lang === "jsxgraph";

  // Handle incomplete blocks early to reduce nesting
  if ((isPlot || isSvg || isJessecode) && !isBlockComplete) {
    return (
      <TextShimmer className="font-mono text-sm" duration={1}>
        {t("generating-diagram")}
      </TextShimmer>
    );
  }

  // Handle Diagram Rendering
  if (isPlot) {
    let diagramContent: ReactNode;
    let realLanguage = "json";

    switch (lang) {
      case "plot-function":
        diagramContent = (
          <div className="h-80 w-80 lg:h-100 lg:w-100">
            <MathPlotDiagram code={content} />
          </div>
        );
        break;
      case "plot-force":
        // deprecated, we'll introduce a new approach for physics plotting
        diagramContent = <ForceDiagram code={content} />;
        break;
      case "plot-mermaid":
        diagramContent = <MermaidDiagram code={content} />;
        realLanguage = "mermaid";
        break;
      default:
        diagramContent = null;
    }

    return (
      <DiagramRenderer language={realLanguage} content={content}>
        {diagramContent}
      </DiagramRenderer>
    );
  }

  // Handle SVG Rendering
  if (isSvg) {
    const cleanSvg = DOMPurify.sanitize(content);
    return (
      <DiagramRenderer language="xml" content={content}>
        <div dangerouslySetInnerHTML={{ __html: cleanSvg }} />
      </DiagramRenderer>
    );
  } else if (isJessecode) {
    return (
      <DiagramRenderer language="js" content={content}>
        <div className="w-80 lg:w-100">
          <JSXGraphDiagram jesseScript={content} />
        </div>
      </DiagramRenderer>
    );
  }

  // Standard Code Block
  if (match) {
    return <CodeRenderer language={lang} content={content} />;
  }

  // Inline Code
  return (
    <code className={cn(className, "bg-accent p-0.5 rounded")} {...props}>
      {children}
    </code>
  );
}
