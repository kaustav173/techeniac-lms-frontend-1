'use client';

import React, { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Span } from '@/components/ui/Typography';

interface MarkdownViewerProps {
  content: string;
  className?: string | undefined;
}

interface Block {
  type:
    | 'h1'
    | 'h2'
    | 'h3'
    | 'h4'
    | 'h5'
    | 'h6'
    | 'code'
    | 'hr'
    | 'blockquote'
    | 'ul'
    | 'ol'
    | 'table'
    | 'p';
  text?: string | undefined;
  items?: string[] | undefined;
  tableHeader?: string[] | undefined;
  tableRows?: string[][] | undefined;
  lang?: string | undefined;
  code?: string | undefined;
}

function isSafeMarkdownUrl(urlString: string): boolean {
  try {
    const trimmed = urlString.trim();
    if (!trimmed) return false;
    const parsed = new URL(trimmed);
    return ['http:', 'https:', 'mailto:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function renderInline(text: string): React.ReactNode {
  const tokenRegex =
    /(!\[[^\]]*\]\([^)]+\)|\[[^\]]+\]\([^)]+\)|`[^`]+`|\*\*[^*]+\*\*|__[^\n_]+__|~~[^~]+~~|\*[^*]+\*|_[^\n_]+_)/g;
  const tokens = text.split(tokenRegex);

  return tokens.map((token, i) => {
    if (!token) return null;

    // Image: ![alt](url)
    const imgMatch = /^!\[([^\]]*)\]\(([^)]+)\)$/.exec(token);
    if (imgMatch) {
      const [, alt, url] = imgMatch;
      if (url && isSafeMarkdownUrl(url)) {
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={url}
            alt={alt || 'Image'}
            className="my-3 max-h-96 rounded-xl border border-slate-200 object-contain shadow-xs"
          />
        );
      }
      return null;
    }

    // Link: [label](url)
    const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
    if (linkMatch) {
      const [, label, url] = linkMatch;
      if (url && isSafeMarkdownUrl(url)) {
        return (
          <a
            key={i}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[#0044D3] underline hover:text-[#0039B3]"
          >
            {label}
          </a>
        );
      }
      return (
        <span key={i} className="font-medium text-slate-700">
          {label}
        </span>
      );
    }

    // Inline code: `code`
    if (token.startsWith('`') && token.endsWith('`') && token.length >= 2) {
      return (
        <code
          key={i}
          className="rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[12px] font-semibold text-rose-600"
        >
          {token.slice(1, -1)}
        </code>
      );
    }

    // Bold: **text** or __text__
    if (
      (token.startsWith('**') && token.endsWith('**') && token.length >= 4) ||
      (token.startsWith('__') && token.endsWith('__') && token.length >= 4)
    ) {
      return (
        <strong key={i} className="font-bold text-slate-900">
          {renderInline(token.slice(2, -2))}
        </strong>
      );
    }

    // Strikethrough: ~~text~~
    if (token.startsWith('~~') && token.endsWith('~~') && token.length >= 4) {
      return (
        <del key={i} className="text-slate-400">
          {renderInline(token.slice(2, -2))}
        </del>
      );
    }

    // Italic: *text* or _text_
    if (
      (token.startsWith('*') && token.endsWith('*') && token.length >= 2) ||
      (token.startsWith('_') && token.endsWith('_') && token.length >= 2)
    ) {
      return (
        <em key={i} className="text-slate-800 italic">
          {renderInline(token.slice(1, -1))}
        </em>
      );
    }

    return <React.Fragment key={i}>{token}</React.Fragment>;
  });
}

function CodeBlock({ lang, code = '' }: { lang?: string | undefined; code?: string | undefined }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (code) {
      void navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative my-3.5 overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-md">
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-3.5 py-1.5 text-[11px] font-medium text-slate-400">
        <Span className="font-mono text-[10px] font-bold tracking-wider text-slate-300 uppercase">
          {lang || 'CODE'}
        </Span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-6 rounded px-2 text-[10px] font-semibold text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
        >
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-slate-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function BlockRenderer({ block }: { block: Block }) {
  switch (block.type) {
    case 'h1':
      return (
        <h1 className="mt-5 mb-3 border-b border-slate-200 pb-2 text-2xl font-bold tracking-tight text-slate-900">
          {renderInline(block.text || '')}
        </h1>
      );
    case 'h2':
      return (
        <h2 className="mt-4 mb-2 border-b border-slate-100 pb-1.5 text-xl font-bold tracking-tight text-slate-900">
          {renderInline(block.text || '')}
        </h2>
      );
    case 'h3':
      return (
        <h3 className="mt-3.5 mb-1.5 text-lg font-bold text-slate-800">
          {renderInline(block.text || '')}
        </h3>
      );
    case 'h4':
      return (
        <h4 className="mt-3 mb-1 text-base font-semibold text-slate-800">
          {renderInline(block.text || '')}
        </h4>
      );
    case 'h5':
      return (
        <h5 className="mt-2.5 mb-1 text-sm font-semibold text-slate-800 uppercase">
          {renderInline(block.text || '')}
        </h5>
      );
    case 'h6':
      return (
        <h6 className="mt-2 mb-1 text-xs font-semibold text-slate-700 uppercase">
          {renderInline(block.text || '')}
        </h6>
      );
    case 'hr':
      return <hr className="my-5 border-t border-slate-200" />;
    case 'code':
      return <CodeBlock lang={block.lang} code={block.code} />;
    case 'blockquote':
      return (
        <blockquote className="my-3.5 rounded-r-xl border-l-4 border-[#0044D3] bg-blue-50/60 p-3.5 text-sm text-slate-700 italic">
          {(block.text || '').split('\n').map((line, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <br />}
              {renderInline(line)}
            </React.Fragment>
          ))}
        </blockquote>
      );
    case 'table':
      return (
        <div className="my-3.5 overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
          <table className="w-full min-w-full divide-y divide-slate-200 text-left text-sm">
            {block.tableHeader && block.tableHeader.length > 0 && (
              <thead className="bg-slate-50 text-xs font-bold text-slate-700 uppercase">
                <tr>
                  {block.tableHeader.map((th, idx) => (
                    <th key={idx} className="px-4 py-2.5 font-semibold text-slate-900">
                      {renderInline(th)}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-slate-100 bg-white">
              {(block.tableRows || []).map((row, rIdx) => (
                <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-4 py-2.5 text-xs text-slate-700">
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'ul':
      return (
        <ul className="my-2 list-disc space-y-1.5 pl-6 text-sm text-slate-700">
          {(block.items || []).map((item, idx) => {
            const taskMatch = /^\[([ xX])\]\s*(.*)$/.exec(item.trim());
            if (taskMatch) {
              const isChecked = taskMatch[1]?.toLowerCase() === 'x';
              const label = taskMatch[2] || '';
              return (
                <li key={idx} className="-ml-4 flex list-none items-center gap-2 leading-relaxed">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    readOnly
                    className="h-4 w-4 rounded border-slate-300 text-[#0044D3]"
                  />
                  <span className={isChecked ? 'text-slate-400 line-through' : ''}>
                    {renderInline(label)}
                  </span>
                </li>
              );
            }
            return (
              <li key={idx} className="leading-relaxed">
                {renderInline(item)}
              </li>
            );
          })}
        </ul>
      );
    case 'ol':
      return (
        <ol className="my-2 list-decimal space-y-1.5 pl-6 text-sm text-slate-700">
          {(block.items || []).map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {renderInline(item)}
            </li>
          ))}
        </ol>
      );
    case 'p':
      return (
        <p className="my-2 text-sm leading-relaxed text-slate-700">
          {(block.text || '').split('\n').map((lineText, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <br />}
              {renderInline(lineText)}
            </React.Fragment>
          ))}
        </p>
      );
    default:
      return null;
  }
}

export function MarkdownViewer({ content, className = '' }: MarkdownViewerProps) {
  if (!content) return null;

  const blocks: Block[] = [];
  const lines = content.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line === undefined) {
      i++;
      continue;
    }

    // Fenced Code Block
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length) {
        const nextLine = lines[i];
        if (nextLine === undefined || nextLine.trim().startsWith('```')) {
          break;
        }
        codeLines.push(nextLine);
        i++;
      }
      blocks.push({
        type: 'code',
        lang: lang || 'code',
        code: codeLines.join('\n'),
      });
      i++;
      continue;
    }

    // Table
    if (
      line.includes('|') &&
      i + 1 < lines.length &&
      /^\s*\|?\s*[-:]+[-| :]*\|?\s*$/.test(lines[i + 1] ?? '')
    ) {
      const parseRow = (rowStr: string) =>
        rowStr
          .trim()
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .split('|')
          .map((c) => c.trim());

      const tableHeader = parseRow(line);
      i += 2; // skip header and separator
      const tableRows: string[][] = [];

      while (i < lines.length) {
        const nextLine = lines[i];
        if (nextLine === undefined || !nextLine.trim() || !nextLine.includes('|')) {
          break;
        }
        tableRows.push(parseRow(nextLine));
        i++;
      }

      blocks.push({ type: 'table', tableHeader, tableRows });
      continue;
    }

    // Horizontal Rule (---, ***, ___)
    if (/^(\s*[-*_]\s*){3,}$/.test(line)) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    // Headings
    const headingMatch = /^(#{1,6})\s+(.*)$/.exec(line.trim());
    if (headingMatch && headingMatch[1] && headingMatch[2]) {
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      const type = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
      blocks.push({ type, text });
      i++;
      continue;
    }

    // Blockquote
    if (line.trim().startsWith('>')) {
      const quoteLines: string[] = [line.trim().replace(/^>\s?/, '')];
      i++;
      while (i < lines.length) {
        const nextLine = lines[i];
        if (nextLine === undefined || !nextLine.trim().startsWith('>')) {
          break;
        }
        quoteLines.push(nextLine.trim().replace(/^>\s?/, ''));
        i++;
      }
      blocks.push({ type: 'blockquote', text: quoteLines.join('\n') });
      continue;
    }

    // Unordered List
    if (/^\s*[*+-]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length) {
        const nextLine = lines[i];
        if (nextLine === undefined || !/^\s*[*+-]\s+/.test(nextLine)) {
          break;
        }
        items.push(nextLine.replace(/^\s*[*+-]\s+/, ''));
        i++;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    // Ordered List
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length) {
        const nextLine = lines[i];
        if (nextLine === undefined || !/^\s*\d+\.\s+/.test(nextLine)) {
          break;
        }
        items.push(nextLine.replace(/^\s*\d+\.\s+/, ''));
        i++;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    // Empty lines
    if (!line.trim()) {
      i++;
      continue;
    }

    // Regular paragraph
    const pLines: string[] = [line];
    i++;
    while (i < lines.length) {
      const nextLine = lines[i];
      if (
        nextLine === undefined ||
        !nextLine.trim() ||
        nextLine.trim().startsWith('```') ||
        /^(#{1,6})\s+/.test(nextLine.trim()) ||
        nextLine.trim().startsWith('>') ||
        /^\s*[*+-]\s+/.test(nextLine) ||
        /^\s*\d+\.\s+/.test(nextLine) ||
        /^(\s*[-*_]\s*){3,}$/.test(nextLine) ||
        (nextLine.includes('|') &&
          i + 1 < lines.length &&
          /^\s*\|?\s*[-:]+[-| :]*\|?\s*$/.test(lines[i + 1] ?? ''))
      ) {
        break;
      }
      pLines.push(nextLine);
      i++;
    }
    blocks.push({ type: 'p', text: pLines.join('\n') });
  }

  return (
    <div className={`space-y-3 leading-relaxed text-slate-800 ${className}`}>
      {blocks.map((block, idx) => (
        <BlockRenderer key={idx} block={block} />
      ))}
    </div>
  );
}
