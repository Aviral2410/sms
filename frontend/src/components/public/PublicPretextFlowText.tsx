import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useElementTextLayout } from '../../hooks/useElementTextLayout';

type PublicPretextFlowTextProps = {
  readonly text: string;
  readonly as?: 'div' | 'p' | 'h1' | 'h3' | 'strong' | 'span';
  readonly variant?: 'display' | 'heading' | 'body' | 'quote' | 'label' | 'stat' | 'immersive';
  readonly className?: string;
  readonly accentColor?: string;
  readonly delayStep?: number;
  readonly layoutKey?: string;
};

export function PublicPretextFlowText({
  text,
  as = 'p',
  variant = 'body',
  className = '',
  accentColor,
  delayStep = 0.08,
  layoutKey,
}: PublicPretextFlowTextProps) {
  const [element, setElement] = useState<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [animationCycle, setAnimationCycle] = useState(0);
  const wasVisibleRef = useRef(false);
  const layout = useElementTextLayout(element, {
    text,
    layoutKey: layoutKey || `flow-${variant}`,
  });
  const renderedLines = useMemo(
    () => (layout.lines && layout.lines.length ? layout.lines : [text]),
    [layout.lines, text],
  );

  useEffect(() => {
    if (!element || typeof window === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const nextVisible = entries.some((entry) => entry.isIntersecting);
        setIsVisible(nextVisible);
        if (nextVisible && !wasVisibleRef.current) {
          setAnimationCycle((value) => value + 1);
        }
        wasVisibleRef.current = nextVisible;
        if (!nextVisible) {
          setIsVisible(false);
        }
      },
      { threshold: 0.16, rootMargin: '0px 0px -6% 0px' },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  useEffect(() => {
    if (!element || typeof window === 'undefined') {
      return;
    }

    const handlePageShow = () => {
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const inView = rect.top < window.innerHeight * 0.94 && rect.bottom > window.innerHeight * 0.08;
      if (inView) {
        setAnimationCycle((value) => value + 1);
        setIsVisible(true);
        wasVisibleRef.current = true;
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('focus', handlePageShow);
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('focus', handlePageShow);
    };
  }, [element]);

  const Tag = as;

  return (
    <Tag
      ref={setElement as never}
      className={`public-pretext-flow public-pretext-flow--${variant}${isVisible ? ' is-visible' : ''} ${className}`.trim()}
      data-line-count={layout.lineCount || undefined}
      style={accentColor ? ({ ['--pretext-flow-accent' as string]: accentColor } as React.CSSProperties) : undefined}
    >
      {renderedLines.map((line, index) => (
        <span
          key={`${line}-${index}-${animationCycle}`}
          className="public-pretext-flow__line"
          style={
            {
              ['--pretext-flow-line-index' as string]: index,
              ['--pretext-flow-delay-step' as string]: `${delayStep}s`,
            } as React.CSSProperties
          }
        >
          <span className="public-pretext-flow__line-base">{line}</span>
          <span className="public-pretext-flow__line-fill">{line}</span>
        </span>
      ))}
    </Tag>
  );
}
