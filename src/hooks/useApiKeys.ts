import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ApiKey {
  id: string;
  user_id: string;
  key_prefix: string;
  name: string;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

interface GeneratedApiKey extends ApiKey {
  api_key: string;
}

export function useApiKeys() {
  const { user, session } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchApiKeys = useCallback(async () => {
    if (!user) {
      setApiKeys([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('api_keys')
        .select('id, user_id, key_prefix, name, is_active, last_used_at, created_at')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setApiKeys((data as ApiKey[]) || []);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  const generateApiKey = useCallback(async (name?: string): Promise<GeneratedApiKey> => {
    if (!session?.access_token) throw new Error('Not authenticated');

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-api-key`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name || 'Voice Agent' }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate API key');
    }

    const data = await response.json();
    await fetchApiKeys();

    return {
      id: data.id,
      user_id: user!.id,
      key_prefix: data.prefix,
      name: data.name,
      is_active: true,
      last_used_at: null,
      created_at: data.created_at,
      api_key: data.api_key,
    };
  }, [session, user, fetchApiKeys]);

  const updateApiKey = useCallback(async (
    id: string,
    data: Partial<Pick<ApiKey, 'name' | 'is_active'>>
  ) => {
    const { data: updated, error } = await supabase
      .from('api_keys')
      .update(data)
      .eq('id', id)
      .select('id, user_id, key_prefix, name, is_active, last_used_at, created_at')
      .single();

    if (error) throw error;
    await fetchApiKeys();
    return updated as ApiKey;
  }, [fetchApiKeys]);

  const deleteApiKey = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await fetchApiKeys();
  }, [fetchApiKeys]);

  const deactivateApiKey = useCallback(async (id: string) => {
    return updateApiKey(id, { is_active: false });
  }, [updateApiKey]);

  const activateApiKey = useCallback(async (id: string) => {
    return updateApiKey(id, { is_active: true });
  }, [updateApiKey]);

  return {
    apiKeys,
    activeApiKeys: apiKeys.filter(k => k.is_active),
    loading,
    error,
    refetch: fetchApiKeys,
    generateApiKey,
    updateApiKey,
    deleteApiKey,
    deactivateApiKey,
    activateApiKey,
  };
}