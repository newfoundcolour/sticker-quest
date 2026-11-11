import ReactMarkdown, { type Components } from "react-markdown";

/**
 * A blog post body. react-markdown never renders raw HTML from the text (it's
 * shown as plain text) and strips unsafe link targets such as `javascript:`,
 * so posts can't inject markup or scripts. Images aren't allowed in the body
 * (each post has one cover image instead).
 */
const COMPONENTS: Components = {
  // The post title is the page's h1, so a # heading in the body becomes a section heading.
  h1: ({ children }) => <h2 className="mt-10 font-headline text-[28px] font-bold leading-tight text-sand">{children}</h2>,
  h2: ({ children }) => <h2 className="mt-10 font-headline text-[28px] font-bold leading-tight text-sand">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-8 text-xl font-black text-sand">{children}</h3>,
  h4: ({ children }) => <h4 className="mt-6 text-lg font-black text-sand">{children}</h4>,
  p: ({ children }) => <p className="mt-5 text-[17px] leading-[1.75] text-white/80">{children}</p>,
  strong: ({ children }) => <strong className="font-bold text-sand">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ href, children }) => {
    const external = !!href && /^https?:\/\//.test(href);
    return (
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer nofollow" } : {})}
        className="font-semibold text-zap underline decoration-zap/40 underline-offset-4 hover:decoration-zap"
      >
        {children}
      </a>
    );
  },
  ul: ({ children }) => <ul className="mt-5 list-disc space-y-2 pl-6 text-[17px] leading-[1.7] text-white/80 marker:text-zap">{children}</ul>,
  ol: ({ children }) => <ol className="mt-5 list-decimal space-y-2 pl-6 text-[17px] leading-[1.7] text-white/80 marker:font-bold marker:text-zap">{children}</ol>,
  li: ({ children }) => <li className="pl-1">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="mt-6 rounded-r-2xl border-l-4 border-zap bg-white/[0.04] px-5 py-1 [&>p]:mt-3 [&>p:last-child]:mb-3">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-10 border-white/10" />,
  code: ({ children }) => <code className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-[0.9em] text-sand">{children}</code>,
  pre: ({ children }) => (
    <pre className="mt-5 overflow-x-auto rounded-2xl bg-well p-4 text-sm leading-relaxed [&>code]:bg-transparent [&>code]:p-0">
      {children}
    </pre>
  ),
};

export function Markdown({ children }: { children: string }) {
  return (
    <div className="[&>*:first-child]:mt-0">
      <ReactMarkdown components={COMPONENTS} disallowedElements={["img"]} unwrapDisallowed={false} skipHtml>
        {children}
      </ReactMarkdown>
    </div>
  );
}
