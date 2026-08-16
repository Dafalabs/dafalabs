import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function PostBody({ children }: { children: string }) {
  return (
    <div className="flex max-w-[68ch] flex-col gap-6 leading-relaxed text-ash">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => (
            <h2 className="mt-6 font-display text-2xl tracking-tight text-bone">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-4 font-display text-xl tracking-tight text-bone">
              {children}
            </h3>
          ),
          p: ({ children }) => <p>{children}</p>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brass underline underline-offset-4 hover:text-bone"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => (
            <ul className="flex list-disc flex-col gap-2 pl-5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="flex list-decimal flex-col gap-2 pl-5">{children}</ol>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-bone">{children}</strong>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-brass pl-5 text-bone">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="border border-line bg-ink-deep px-1.5 py-0.5 font-mono text-sm text-bone">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="overflow-x-auto border border-line bg-ink-deep p-5 font-mono text-sm text-bone">
              {children}
            </pre>
          ),
          hr: () => <hr className="border-line" />,
          img: ({ src, alt }) => (
            <img src={typeof src === "string" ? src : ""} alt={alt ?? ""} className="w-full border border-line" />
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
