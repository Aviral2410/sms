import React, { useState } from 'react';
import { MermaidDiagram } from './MermaidDiagram';
import { Check, Copy } from 'lucide-react';

interface AiRichTextProps {
  content?: string | null;
  className?: string;
  isStreaming?: boolean;
}

type Block =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string; level: number }
  | { type: 'list'; items: string[]; ordered: boolean }
  | { type: 'quote'; text: string }
  | { type: 'code'; code: string; language: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'callout'; text: string; kind: 'info' | 'warning' | 'success' | 'note' };

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

    if (line.startsWith(':::')) {
      flushParagraph(paragraphBuffer);
      const kindMatch = line.match(/^:::\s*(\w+)/);
      const kind = (kindMatch?.[1] || 'note') as 'info' | 'warning' | 'success' | 'note';
      index += 1;
      const calloutLines: string[] = [];
      while (index < lines.length && !lines[index].trim().startsWith(':::')) {
        calloutLines.push(lines[index].trim());
        index += 1;
      }
      if (index < lines.length) index += 1;
      blocks.push({ type: 'callout', text: calloutLines.join(' '), kind });
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
    <div className="my-5 rounded-xl overflow-hidden border border-white/10 bg-[#0a0f18]/80 backdrop-blur-sm shadow-2xl group/code">
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.03] border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-rose-500/50" />
          <div className="w-2 h-2 rounded-full bg-amber-500/50" />
          <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
          <span className="ml-2 text-[10px] font-black uppercase tracking-widest text-white/30">{language || 'Code'}</span>
        </div>
        <button 
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[10px] font-black text-white/40 hover:text-white transition-all bg-white/5 hover:bg-white/10 px-2 py-1 rounded-md"
        >
          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          {copied ? 'COPIED' : 'COPY'}
        </button>
      </div>
      <div className="p-5 overflow-x-auto text-[13px] leading-relaxed font-mono text-emerald-50/90 custom-scrollbar bg-gradient-to-b from-transparent to-white/[0.01]">
        <pre><code className="block">{code}</code></pre>
      </div>
    </div>
  );
};

export const AiRichText: React.FC<AiRichTextProps> = ({ content, className, isStreaming }) => {
  if (!content?.trim() && !isStreaming) return null;

  const blocks = parseBlocks(content || '');

  return (
    <div className={['ai-richtext flex flex-col gap-4 text-white/80 text-[15px] leading-[1.65]', className].filter(Boolean).join(' ')}>
      {blocks.map((block, index) => {
        const isLastBlock = index === blocks.length - 1;
        
        // Render content normally
        let renderedBlock;
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
          renderedBlock = <HeadingTag key={index} className={styles[block.level as keyof typeof styles]}>{renderInline(block.text)}</HeadingTag>;
        } else if (block.type === 'list') {
          const ListTag = block.ordered ? 'ol' : 'ul';
          const listClass = block.ordered 
            ? "list-decimal list-outside ml-5 space-y-1.5 marker:text-emerald-500/50 marker:font-bold" 
            : "list-disc list-outside ml-5 space-y-1.5 marker:text-emerald-500/50";
          renderedBlock = (
            <ListTag key={index} className={listClass}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="pl-1.5">{renderInline(item)}</li>
              ))}
            </ListTag>
          );
        } else if (block.type === 'code') {
          if (block.language === 'mermaid') {
            renderedBlock = <MermaidDiagram key={index} definition={block.code} />;
          } else {
            renderedBlock = <CodeBlock key={index} code={block.code} language={block.language} />;
          }
        } else if (block.type === 'callout') {
          const styles = {
            info: "bg-blue-500/10 border-blue-500/20 text-blue-100",
            warning: "bg-amber-500/10 border-amber-500/20 text-amber-100",
            success: "bg-emerald-500/10 border-emerald-500/20 text-emerald-100",
            note: "bg-white/5 border-white/10 text-white/80"
          };
          renderedBlock = (
            <div key={index} className={`p-4 my-2 rounded-xl border ${styles[block.kind]} flex gap-3`}>
              <div className="mt-1">
                {block.kind === 'warning' ? '⚠️' : block.kind === 'success' ? '✅' : '💡'}
              </div>
              <div>{renderInline(block.text)}</div>
            </div>
          );
        } else if (block.type === 'table') {
          renderedBlock = (
            <div key={index} className="overflow-x-auto my-6 rounded-2xl border border-white/10 bg-white/[0.01] backdrop-blur-sm shadow-xl">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-white/[0.03] text-white/40 font-black uppercase tracking-widest text-[10px]">
                  <tr>
                    {block.headers.map((h, i) => (
                      <th key={i} className="px-5 py-4 border-b border-white/5 first:rounded-tl-2xl last:rounded-tr-2xl">
                        <div className="flex items-center gap-2">{renderInline(h)}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {block.rows.map((row, i) => (
                    <tr key={i} className="group/row hover:bg-emerald-500/[0.02] transition-colors">
                      {row.map((cell, j) => (
                        <td key={j} className="px-5 py-4 text-white/60 group-hover/row:text-white/90 transition-colors font-medium">
                          {renderInline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        } else if (block.type === 'quote') {
          renderedBlock = (
            <blockquote key={index} className="pl-4 py-1 my-2 border-l-2 border-emerald-500/40 text-emerald-100/70 italic bg-gradient-to-r from-emerald-500/5 to-transparent rounded-r-lg">
              {renderInline(block.text)}
            </blockquote>
          );
        } else {
          renderedBlock = <p key={index} className="text-white/80">{renderInline(block.text)}</p>;
        }

        // Add cursor to the last block if streaming
        if (isLastBlock && isStreaming) {
          if (block.type === 'paragraph' || block.type === 'heading') {
             // For text blocks, we can append it directly
             return (
               <div key={index} className="relative inline">
                 {renderedBlock}
                 <span className="inline-block w-1.5 h-4 ml-1 bg-emerald-400 animate-pulse translate-y-0.5" />
               </div>
             );
          }
          // For other blocks, append it after
          return (
            <React.Fragment key={index}>
              {renderedBlock}
              <span className="inline-block w-1.5 h-4 ml-1 bg-emerald-400 animate-pulse" />
            </React.Fragment>
          );
        }

        return renderedBlock;
      })}
    </div>
  );
};
