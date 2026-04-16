import React, { useEffect, useMemo, useState } from 'react';

type TourStep = {
  id: string;
  selector: string;
  title: string;
  body: string;
};

const STORAGE_KEY = 'publicGuidedTour:v1';

const STEPS: TourStep[] = [
  {
    id: 'nav',
    selector: '[data-tour="nav"]',
    title: 'Navigate the platform story',
    body: 'Use the top navigation to jump to pricing, support, contact, and the vision story.',
  },
  {
    id: 'pricing',
    selector: '[data-tour="nav-pricing"]',
    title: 'Explore pricing',
    body: 'See the commercial plans and the feature matrix that maps what each subscription unlocks.',
  },
  {
    id: 'onboarding',
    selector: '[data-tour="primary-cta"]',
    title: 'Start onboarding',
    body: 'Begin the guided onboarding flow when you are ready to activate an institution.',
  },
  {
    id: 'chat',
    selector: '[data-tour="public-chat-launcher"]',
    title: 'Ask questions anytime',
    body: 'Open the AI chat on any page to ask about onboarding, features, pricing, or support.',
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function computeHighlight(selector: string) {
  const el = document.querySelector(selector) as HTMLElement | null;
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  const pad = 8;
  return {
    x: rect.left - pad,
    y: rect.top - pad,
    w: rect.width + pad * 2,
    h: rect.height + pad * 2,
  };
}

export function PublicGuidedTour() {
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const step = useMemo(() => STEPS[stepIndex] ?? null, [stepIndex]);
  const [highlight, setHighlight] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'active') {
      setActive(true);
    }
  }, []);

  useEffect(() => {
    const handler = () => {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      setActive(stored === 'active');
      if (stored === 'active') setStepIndex(0);
    };
    window.addEventListener('public-guided-tour', handler as EventListener);
    return () => window.removeEventListener('public-guided-tour', handler as EventListener);
  }, []);

  useEffect(() => {
    if (!active || !step) return;

    const update = () => {
      const next = computeHighlight(step.selector);
      setHighlight(next);
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    const interval = window.setInterval(update, 350);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      window.clearInterval(interval);
    };
  }, [active, step]);

  const stop = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    setActive(false);
    setStepIndex(0);
  };

  if (!active || !step || !highlight) return null;

  const tooltipW = 340;
  const nextX = clamp(highlight.x + highlight.w + 18, 16, window.innerWidth - tooltipW - 16);
  const nextY = clamp(highlight.y, 16, window.innerHeight - 180);

  return (
    <div className="public-tour" role="dialog" aria-label="Guided tour">
      <div className="public-tour__backdrop" onClick={stop} />
      <div
        className="public-tour__highlight"
        style={{
          left: highlight.x,
          top: highlight.y,
          width: highlight.w,
          height: highlight.h,
        }}
      />
      <div className="public-tour__tooltip" style={{ left: nextX, top: nextY, width: tooltipW }}>
        <div className="public-tour__step">Step {stepIndex + 1} of {STEPS.length}</div>
        <div className="public-tour__title">{step.title}</div>
        <div className="public-tour__body">{step.body}</div>
        <div className="public-tour__actions">
          <button type="button" className="public-tour__button public-tour__button--ghost" onClick={stop}>Exit</button>
          <div style={{ flex: 1 }} />
          <button
            type="button"
            className="public-tour__button public-tour__button--secondary"
            onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
            disabled={stepIndex === 0}
          >
            Back
          </button>
          <button
            type="button"
            className="public-tour__button public-tour__button--primary"
            onClick={() => {
              if (stepIndex >= STEPS.length - 1) stop();
              else setStepIndex((i) => i + 1);
            }}
          >
            {stepIndex >= STEPS.length - 1 ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function startPublicGuidedTour() {
  try {
    window.localStorage.setItem(STORAGE_KEY, 'active');
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event('public-guided-tour'));
}

