import React, { useState } from 'react';
import { MermaidDiagram } from './MermaidDiagram';
import { Check, Copy } from 'lucide-react';

interface AiRichTextProps {
  content?: string | null;
  className?: string;
}

type Block =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string; level: number }
  | { type: 'list'; items: string[]; ordered: boolean }
  | { type: 'quote'; text: string }
  | { type: 'code'; code: string; language: string }
  | { type: 'table'; headers: string[]; rows: string[][] };

function renderInline(text: string) {
  const parts: React.ReactNode[] = [];
  const tokenRegex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  const segments = text.split(tokenRegex);
  
  segments.forEach((segment, i) => {
    if (segment.startsWith('**') && segment.endsWith('**')) {
      parts.push(<strong key={i} className="font-bold text-white/95">{segment.slice(2, -2)}</strong>);
    } else if (segment.startsWith('*') && segment.endsWith('*')) {
      parts.push(<em key={i} className="italic text-emerald-400/90">{segment.slice(1, -1)}</em>);
    } else if (segment.startsWith('`') && segment.endsWith('`')) {
      parts.push(<code key={i} className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-300 rounded-[4px] text-[0.8em] font-mono border border-emerald-500/20">{segment.slice(1, -1)}</code>);
    } else if (segment.startsWith('[') && segment.includes('](') && segment.endsWith(')')) {
      const match = segment.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (match) {
        parts.push(<a key={i} href={match[2]} target="_blank" rel="noreferrer" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 decoration-emerald-500/30 transition-colors">{match[1]}</a>);
      } else {
        parts.push(segment);
      }
    } else {
      parts.push(segment);
    }
  });
  
  return parts;
}

function parseBlocks(content: string): Block[] {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let index = 0;

  const flushParagraph = (buffer: string[]) => {
    if (buffer.length === 0) return;
    const text = buffer.join(' ').trim();
    if (text) blocks.push({ type: 'paragraph', text });
    buffer.length = 0;
  };

  const paragraphBuffer: string[] = [];

  while (index < lines.length) {
    const rawLine = lines[index];
    const line = rawLine.trim();

    if (!line) {
      flushParagraph(paragraphBuffer);
      index += 1;
      continue;
    }

    if (line.startsWith('```')) {
      flushParagraph(paragraphBuffer);
      const language = line.slice(3).trim().toLowerCase();
      index += 1;
      const codeLines: string[] = [];
      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      blocks.push({ type: 'code', code: codeLines.join('\n'), language });
      continue;
    }

    if (line.startsWith('|') && line.endsWith('|')) {
      flushParagraph(paragraphBuffer);
      const tableLines: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith('|')) {
        tableLines.push(lines[index].trim());
        index += 1;
      }
      if (tableLines.length >= 2) {
        const parseRow = (r: string) => r.split('|').slice(1, -1).map(c => c.trim());
        const headers = parseRow(tableLines[0]);
        const rows = tableLines.slice(2).map(parseRow);
        blocks.push({ type: 'table', headers, rows });
      }
      continue;
    }

    if (line.startsWith('>')) {
      flushParagraph(paragraphBuffer);
      const quoteLines: string[] = [];
      while (index < lines.length) {
        const candidate = lines[index].trim();
        if (!candidate.startsWith('>')) break;
        quoteLines.push(candidate.replace(/^>\s?/, '').trim());
        index += 1;
      }
      if (quoteLines.length > 0) blocks.push({ type: 'quote', text: quoteLines.join(' ') });
      continue;
    }

    if (line.startsWith('#')) {
      flushParagraph(paragraphBuffer);
      const match = line.match(/^#+/);
      const level = Math.min(6, Math.max(1, match?.[0].length ?? 1));
      blocks.push({ type: 'heading', text: line.replace(/^#+\s*/, '').trim(), level });
      index += 1;
      continue;
    }

    if (/^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
      flushParagraph(paragraphBuffer);
      const ordered = /^\d+\.\s+/.test(line);
      const items: string[] = [];
      while (index < lines.length) {
        const candidate = lines[index].trim();
        const matches = ordered ? /^\d+\.\s+/.test(candidate) : /^[-*]\s+/.test(candidate);
        if (!matches) break;
        items.push(candidate.replace(ordered ? /^\d+\.\s+/ : /^[-*]\s+/, '').trim());
        index += 1;
      }
      if (items.length > 0) blocks.push({ type: 'list', items, ordered });
      continue;
    }

    paragraphBuffer.push(rawLine);
    index += 1;
  }

  flushParagraph(paragraphBuffer);
  return blocks;
}

const CodeBlock: React.FC<{ code: string; language: string }> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-5 rounded-xl overflow-hidden border border-white/10 bg-[#0a0f18] shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 bg-white/[0.03] border-b border-white/5">
        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{language || 'Code'}</span>
        <button 
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[10px] font-bold text-white/40 hover:text-white transition-colors"
        >
          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          {copied ? 'COPIED' : 'COPY'}
        </button>
      </div>
      <div className="p-4 overflow-x-auto text-[13px] leading-relaxed font-mono text-emerald-50/80 custom-scrollbar">
        <pre><code>{code}</code></pre>
      </div>
    </div>
  );
};

export const AiRichText: React.FC<AiRichTextProps> = ({ content, className }) => {
  if (!content?.trim()) return null;

  const blocks = parseBlocks(content);

  return (
    <div className={['ai-richtext flex flex-col gap-4 text-white/80 text-[15px] leading-[1.65]', className].filter(Boolean).join(' ')}>
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          const HeadingTag = `h${block.level}` as any;
          const styles = {
            1: "text-2xl font-black text-white mt-4 mb-2 tracking-tight",
            2: "text-xl font-black text-white mt-4 mb-2 tracking-tight",
            3: "text-lg font-bold text-emerald-50 mt-3 mb-1",
            4: "text-base font-bold text-emerald-100 mt-2",
            5: "text-sm font-bold text-emerald-200 uppercase tracking-wider",
            6: "text-xs font-bold text-emerald-300 uppercase tracking-widest"
          };
          return <HeadingTag key={index} className={styles[block.level as keyof typeof styles]}>{renderInline(block.text)}</HeadingTag>;
        }

        if (block.type === 'list') {
          const ListTag = block.ordered ? 'ol' : 'ul';
          const listClass = block.ordered 
            ? "list-decimal list-outside ml-5 space-y-1.5 marker:text-emerald-500/50 marker:font-bold" 
            : "list-disc list-outside ml-5 space-y-1.5 marker:text-emerald-500/50";
          return (
            <ListTag key={index} className={listClass}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="pl-1.5">{renderInline(item)}</li>
              ))}
            </ListTag>
          );
        }

        if (block.type === 'code') {
          if (block.language === 'mermaid') {
            return <MermaidDiagram key={index} definition={block.code} />;
          }
          return <CodeBlock key={index} code={block.code} language={block.language} />;
        }

        if (block.type === 'table') {
          return (
            <div key={index} className="overflow-x-auto my-4 rounded-xl border border-white/10 bg-white/[0.02]">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-white/[0.03] text-white/40 font-black uppercase tracking-widest text-[10px]">
                  <tr>
                    {block.headers.map((h, i) => <th key={i} className="px-4 py-3 border-b border-white/5">{renderInline(h)}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {block.rows.map((row, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                      {row.map((cell, j) => <td key={j} className="px-4 py-3 text-white/70">{renderInline(cell)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        if (block.type === 'quote') {
          return (
            <blockquote key={index} className="pl-4 py-1 my-2 border-l-2 border-emerald-500/40 text-emerald-100/70 italic bg-gradient-to-r from-emerald-500/5 to-transparent rounded-r-lg">
              {renderInline(block.text)}
            </blockquote>
          );
        }

        return <p key={index} className="text-white/80">{renderInline(block.text)}</p>;
      })}
    </div>
  );
};
