import { useEffect, useState } from 'react';
import { ApiError } from '../lib/api';
import { publicSiteApi, type PublicSiteContentResponse } from '../lib/publicSiteApi';

export function usePublicSiteContent() {
  const [content, setContent] = useState<PublicSiteContentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    publicSiteApi.getSiteContent()
      .then((response) => {
        if (!active) return;
        setContent(response);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        const message = err instanceof ApiError ? err.message : 'Failed to load public site content.';
        setError(message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { content, loading, error };
}
