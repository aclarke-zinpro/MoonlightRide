import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

/** Renders Markdown safely: raw HTML is never rendered and output is sanitized (research.md R6). */
export function Prose({ markdown, className = "" }: { markdown: string; className?: string }) {
  return (
    <div className={`prose-night ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]} skipHtml>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
