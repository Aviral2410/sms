export function hasFeature(featureCodes: string[] | undefined, requiredFeature?: string): boolean {
  if (!requiredFeature) return true;
  const codes = featureCodes || [];
  return codes.includes('*') || codes.includes(requiredFeature);
}

export function isFeatureReleased(releasedFeatureCodes: string[] | undefined, featureCode?: string): boolean {
  if (!featureCode) return true;
  const released = releasedFeatureCodes || [];
  if (released.length === 0 || released.includes('*')) {
    return true;
  }
  return released.includes(featureCode);
}

export function hasVisibleFeature(
  featureCodes: string[] | undefined,
  releasedFeatureCodes: string[] | undefined,
  requiredFeature?: string,
): boolean {
  return hasFeature(featureCodes, requiredFeature) && isFeatureReleased(releasedFeatureCodes, requiredFeature);
}

export function filterVisibleFeatures(featureCodes: string[] | undefined, releasedFeatureCodes: string[] | undefined): string[] {
  const source = featureCodes || [];
  const released = releasedFeatureCodes || [];
  if (released.length === 0 || released.includes('*')) {
    return source;
  }
  return source.filter((feature) => released.includes(feature));
}

export function hiddenFeatures(featureCodes: string[] | undefined, releasedFeatureCodes: string[] | undefined): string[] {
  const source = featureCodes || [];
  const visible = new Set(filterVisibleFeatures(source, releasedFeatureCodes));
  return source.filter((feature) => !visible.has(feature));
}
