import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";

import "highlight.js/styles/github.css";

export function ArticleBody({ markdown }: { markdown: string }) {
  return (
    <div className="prose prose-neutral max-w-none dark:prose-invert prose-headings:font-display prose-headings:font-semibold prose-p:leading-relaxed prose-pre:bg-muted prose-pre:text-foreground prose-code:text-sm prose-code:before:content-none prose-code:after:content-none prose-a:text-accent-foreground prose-a:underline">
      <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{markdown}</ReactMarkdown>
    </div>
  );
}
