import { useEffect, useState } from 'react';
import { resolveBeanLabelPhotoUri } from '@/services/beanLabelStorage';

export function useResolvedImageUri(uri: string | null | undefined) {
  const [resolvedUri, setResolvedUri] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void resolveBeanLabelPhotoUri(uri).then((value) => { if (active) setResolvedUri(value); });
    return () => { active = false; };
  }, [uri]);

  return resolvedUri;
}
