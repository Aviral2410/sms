import React from 'react';
import { MermaidDiagram } from './MermaidDiagram';

interface AiRichTextProps {
  content?: string | null;
  className?: string;
}

type Block =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string; level: number }
  | { type: 'list'; items: string[]; ordered: boolean }
  | { type: 'code'; code: string; language: string };

function parseBlocks(content: string): Block[] {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let index = 0;

  const flushParagraph = (buffer: string[]) => {
    if (buffer.length === 0) return;
    const text = buffer.join(' ').trim();
    if (text) {
      blocks.push({ type: 'paragraph', text });
    }
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
      if (index < lines.length) {
        index += 1;
      }
      blocks.push({ type: 'code', code: codeLines.join('\n').trim(), language });
      continue;
    }

    if (line.startsWith('#')) {
      flushParagraph(paragraphBuffer);
      const level = Math.min(6, Math.max(1, (line.match(/^#+/)?.[0].length ?? 1)));
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
      if (items.length > 0) {
        blocks.push({ type: 'list', items, ordered });
      }
      continue;
    }

    paragraphBuffer.push(line);
    index += 1;
  }

  flushParagraph(paragraphBuffer);
  return blocks;
}

export const AiRichText: React.FC<AiRichTextProps> = ({ content, className }) => {
  if (!content?.trim()) {
    return null;
  }

  const blocks = parseBlocks(content);

  return (
    <div className={['ai-richtext', className].filter(Boolean).join(' ')}>
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          const HeadingTag = `h${block.level}` as any;
          return <HeadingTag key={index}>{block.text}</HeadingTag>;
        }

        if (block.type === 'list') {
          const ListTag = block.ordered ? 'ol' : 'ul';
          return (
            <ListTag key={index}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{item}</li>
              ))}
            </ListTag>
          );
        }

        if (block.type === 'code') {
          if (block.language === 'mermaid') {
            return <MermaidDiagram key={index} definition={block.code} />;
          }

          return (
            <pre key={index}>
              <code>{block.code}</code>
            </pre>
          );
        }

        return <p key={index}>{block.text}</p>;
      })}
    </div>
  );
};
