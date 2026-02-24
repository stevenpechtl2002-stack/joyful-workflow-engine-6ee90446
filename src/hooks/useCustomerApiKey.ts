import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface CustomerApiKey {
  id: string;
  customer_id: string;
  api_key: string;
  created_at: string;
  updated_at: string;
}

export function useCustomerApiKey() {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState<CustomerApiKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchApiKey = useCallback(async () => {
    if (!user) { setApiKey(null); setLoading(false); return; }
    try {
      const { data, error: e } = await supabase
        .from('customer_api_keys' as any)
        .select('*')
        .eq('customer_id', user.id)
        .maybeSingle();
      if (e) throw e;
      setApiKey(data as any);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchApiKey(); }, [fetchApiKey]);

  const regenerateKey = useCallback(async () => {
    if (!user || !apiKey) throw new Error('No API key found');
    const newKey = crypto.randomUUID();
    const { error: e } = await supabase
      .from('customer_api_keys' as any)
      .update({ api_key: newKey } as any)
      .eq('id', apiKey.id);
    if (e) throw e;
    await fetchApiKey();
    return newKey;
  }, [user, apiKey, fetchApiKey]);

  return { apiKey, loading, error, refetch: fetchApiKey, regenerateKey };
}