import React, { useMemo, useState } from 'react';
import { PublicPretextFlowText } from './PublicPretextFlowText';
import { useElementTextLayout } from '../../hooks/useElementTextLayout';

interface PublicPretextHeadingProps {
  readonly eyebrow: string;
  readonly title: string;
  readonly description?: string;
  readonly pretext?: string;
  readonly align?: 'left' | 'center';
  readonly compact?: boolean;
  readonly className?: string;
  readonly titleClassName?: string;
  readonly effect?: 'none' | 'flow';
  readonly accentColor?: string;
  readonly whiteSpace?: 'normal' | 'nowrap' | 'pre-wrap';
}

export function PublicPretextHeading({
  eyebrow,
  title,
  description,
  pretext,
  align = 'left',
  compact = false,
  className = '',
  titleClassName = '',
  effect = 'none',
  accentColor,
  whiteSpace = 'normal',
}: PublicPretextHeadingProps) {
  const [titleElement, setTitleElement] = useState<HTMLHeadingElement | null>(null);
  const layout = useElementTextLayout(titleElement, {
    text: title,
    whiteSpace,
    layoutKey: compact ? 'compact' : 'default',
  });
  const renderedLines = useMemo(
    () => (layout.lines && layout.lines.length ? layout.lines : [title]),
    [layout.lines, title],
  );

  return (
    <div
      className={`public-pretext-heading public-pretext-heading--${align}${compact ? ' public-pretext-heading--compact' : ''} ${className}`.trim()}
    >
      <div className="public-pretext-heading__eyebrow">{eyebrow}</div>
      <div className="public-pretext-heading__title-wrap" data-pretext={pretext || eyebrow}>
        {effect === 'flow' ? (
          <PublicPretextFlowText
            as="h1"
            text={title}
            variant={compact ? 'heading' : 'display'}
            className={`public-pretext-heading__title public-pretext-heading__title--flow ${titleClassName}`.trim()}
            accentColor={accentColor}
            whiteSpace={whiteSpace}
            layoutKey={`heading-${compact ? 'compact' : 'default'}-${whiteSpace}`}
          />
        ) : (
          <h1
            ref={setTitleElement}
            className={`public-pretext-heading__title ${titleClassName}`.trim()}
            data-line-count={layout.lineCount || undefined}
            data-overflow={layout.isOverflowing ? 'true' : 'false'}
          >
            {renderedLines.map((line, index) => (
              <span key={`${line}-${index}`} className="public-pretext-heading__line">
                {line}
              </span>
            ))}
          </h1>
        )}
      </div>
      {description ? (
        effect === 'flow' ? (
          <PublicPretextFlowText
            as="p"
            text={description}
            variant="body"
            className="public-pretext-heading__description public-pretext-heading__description--flow"
            accentColor={accentColor}
            whiteSpace={whiteSpace}
            delayStep={0.06}
            layoutKey={`heading-description-${compact ? 'compact' : 'default'}-${whiteSpace}`}
          />
        ) : (
          <p className="public-pretext-heading__description">{description}</p>
        )
      ) : null}
    </div>
  );
}
