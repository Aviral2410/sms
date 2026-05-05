import { describe, expect, it } from 'vitest';
import { filterVisibleFeatures, hasVisibleFeature, hiddenFeatures, isFeatureReleased } from './features';

describe('feature visibility helpers', () => {
  it('treats wildcard released features as fully visible', () => {
    expect(filterVisibleFeatures(['SCHOOL_OPS', 'ATTENDANCE'], ['*'])).toEqual(['SCHOOL_OPS', 'ATTENDANCE']);
    expect(isFeatureReleased(['*'], 'ATTENDANCE')).toBe(true);
  });

  it('filters out unreleased plan features', () => {
    expect(filterVisibleFeatures(['SCHOOL_OPS', 'ATTENDANCE', 'TRANSPORT_BASE'], ['SCHOOL_OPS', 'ATTENDANCE']))
      .toEqual(['SCHOOL_OPS', 'ATTENDANCE']);
    expect(hiddenFeatures(['SCHOOL_OPS', 'ATTENDANCE', 'TRANSPORT_BASE'], ['SCHOOL_OPS', 'ATTENDANCE']))
      .toEqual(['TRANSPORT_BASE']);
  });

  it('requires both entitlement and platform release for visible access', () => {
    expect(hasVisibleFeature(['ATTENDANCE'], ['ATTENDANCE'], 'ATTENDANCE')).toBe(true);
    expect(hasVisibleFeature(['ATTENDANCE'], ['SCHOOL_OPS'], 'ATTENDANCE')).toBe(false);
    expect(hasVisibleFeature(['SCHOOL_OPS'], ['ATTENDANCE'], 'ATTENDANCE')).toBe(false);
  });
});
