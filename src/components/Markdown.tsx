import { memo, useMemo } from 'react';
import { Marked } from 'marked';
import { highlight } from '@/lib/highlight';

// Renders TRUSTED authored content only. User-entered notes are rendered as plain text elsewhere.
const marked = new Marked({
  gfm: true,
  breaks: false,
  renderer: {
    code({ text, lang }) {
      const l = (lang || 'text').trim();
      return `<pre><code class="hljs language-${l}">${highlight(text, l)}</code></pre>`;
    },
    link({ href, text }) {
      const external = /^https?:\/\//.test(href);
      return `<a href="${href}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${text}</a>`;
    },
  },
});

export const Markdown = memo(function Markdown({ md, className = 'prose', inline = false }: { md: string; className?: string; inline?: boolean }) {
  const html = useMemo(() => (inline ? (marked.parseInline(md) as string) : (marked.parse(md) as string)), [md, inline]);
  if (inline) return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
});
