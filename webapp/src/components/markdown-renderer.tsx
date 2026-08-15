import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

type MarkdownRendererProps = {
  content: string;
  variant?: "recipe" | "chat";
};

function isSafetyHeading(children: ReactNode) {
  return String(children).includes("Sicurezza Alimentare");
}

export function MarkdownRenderer({ content, variant = "recipe" }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        h1: ({ children }) => variant === "recipe" ? <h2>{children}</h2> : <h3>{children}</h3>,
        h2: ({ children }) => (
          variant === "recipe"
            ? (
              <h2 className={isSafetyHeading(children) ? "safety-heading" : undefined}>
                {children}
              </h2>
            )
            : <h3>{children}</h3>
        ),
        h3: ({ children }) => variant === "chat" ? <h4>{children}</h4> : <h3>{children}</h3>,
        table: ({ children }) => (
          <div className="table-scroll" tabIndex={0}>
            <table>{children}</table>
          </div>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
