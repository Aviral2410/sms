export function hasFeature(featureCodes: string[] | undefined, requiredFeature?: string): boolean {
  if (!requiredFeature) return true;
  const codes = featureCodes || [];
  return codes.includes('*') || codes.includes(requiredFeature);
}

