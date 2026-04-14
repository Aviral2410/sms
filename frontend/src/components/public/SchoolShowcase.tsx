import React, { useEffect, useMemo, useState } from 'react';
import { Building2, RefreshCcw, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SchoolMark, type SchoolMarkData } from './SchoolMark';

function visibleCountForWidth(width: number) {
  if (width >= 1380) return 6;
  if (width >= 1160) return 5;
  if (width >= 920) return 4;
  if (width >= 680) return 3;
  return 2;
}

function wrapSlice<T>(items: T[], startIndex: number, count: number) {
  if (items.length <= count) {
    return items;
  }

  return Array.from({ length: count }, (_, offset) => items[(startIndex + offset) % items.length]);
}

export function SchoolShowcase({
  schools,
  payingInstitutions,
}: {
  schools: SchoolMarkData[];
  payingInstitutions: number;
}) {
  const [viewportWidth, setViewportWidth] = useState(() => (typeof window === 'undefined' ? 1280 : window.innerWidth));
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const visibleCount = visibleCountForWidth(viewportWidth);
  const shouldRotate = schools.length > visibleCount;
  const pageCount = shouldRotate ? Math.ceil(schools.length / visibleCount) : 1;

  useEffect(() => {
    if (!shouldRotate) {
      setPageIndex(0);
      return;
    }

    const timer = window.setInterval(() => {
      setPageIndex((current) => (current + 1) % pageCount);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [pageCount, shouldRotate]);

  const visibleSchools = useMemo(
    () => wrapSlice(schools, pageIndex * visibleCount, visibleCount),
    [pageIndex, schools, visibleCount],
  );

  if (!schools.length) {
    return null;
  }

  return (
    <div className="public-overview-showcase public-panel">
      <div className="public-overview-showcase__header">
        <div>
          <div className="public-overview-showcase__eyebrow">Active school surface</div>
          <h3>Institutions already shaping the shared network</h3>
        </div>
        <div className="public-overview-showcase__meta">
          <span className="public-status-chip">
            <Building2 size={14} />
            {payingInstitutions.toLocaleString()} paying institutions
          </span>
          {shouldRotate ? (
            <span className="public-status-chip public-overview-showcase__rotate-chip">
              <RefreshCcw size={14} />
              Refreshes every 5 seconds
            </span>
          ) : (
            <span className="public-status-chip public-overview-showcase__rotate-chip">
              <Sparkles size={14} />
              All visible at once
            </span>
          )}
        </div>
      </div>

      <div className={`public-overview-showcase__grid public-overview-showcase__grid--${Math.min(visibleCount, 6)}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${pageIndex}-${visibleCount}-${visibleSchools.map((school) => school.schoolCode || school.schoolName).join('|')}`}
            className="public-overview-showcase__page"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          >
            {visibleSchools.map((school) => (
              <article key={`${school.schoolCode || school.schoolName}`} className="public-overview-school-card">
                <SchoolMark school={school} size="md" />
                <div className="public-overview-school-card__body">
                  <strong>{school.schoolName}</strong>
                  <span>{school.schoolCode || 'School identity pending branding'}</span>
                </div>
              </article>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {shouldRotate ? (
        <div className="public-overview-showcase__dots" aria-label="School showcase pages">
          {Array.from({ length: pageCount }, (_, index) => (
            <button
              key={index}
              type="button"
              className={`public-overview-showcase__dot${index === pageIndex ? ' is-active' : ''}`}
              onClick={() => setPageIndex(index)}
              aria-label={`Show school group ${index + 1}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
