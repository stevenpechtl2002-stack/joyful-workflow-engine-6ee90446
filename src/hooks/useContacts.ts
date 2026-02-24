import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Contact {
  id: string;
  user_id: string;
  name: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  birthdate: string | null;
  birth_day: number | null;
  birth_month: number | null;
  gender: string | null;
  language: string | null;
  info: string | null;
  consent_status: string | null;
  booking_count: number | null;
  original_created_at: string | null;
  created_at: string;
  updated_at: string;
  // Aliases for backward compat
  birthday?: string | null;
  notes?: string | null;
  last_visit?: string | null;
}

export function useContacts() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchContacts = useCallback(async () => {
    if (!user) {
      setContacts([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('contacts')
        .select('*')
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;
      setContacts((data as Contact[]) || []);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const createContact = useCallback(async (
    data: Pick<Contact, 'name'> & Partial<Pick<Contact, 'phone' | 'email' | 'birthday' | 'notes'>>
  ) => {
    if (!user) throw new Error('Not authenticated');

    const { data: newContact, error } = await supabase
      .from('contacts')
      .insert({ ...data, user_id: user.id })
      .select()
      .single();

    if (error) throw error;
    await fetchContacts();
    return newContact as Contact;
  }, [user, fetchContacts]);

  const updateContact = useCallback(async (
    id: string,
    data: Partial<Pick<Contact, 'name' | 'phone' | 'email' | 'birthday' | 'notes'>>
  ) => {
    const { data: updated, error } = await supabase
      .from('contacts')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    await fetchContacts();
    return updated as Contact;
  }, [fetchContacts]);

  const deleteContact = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await fetchContacts();
  }, [fetchContacts]);

  return {
    contacts,
    loading,
    error,
    refetch: fetchContacts,
    createContact,
    updateContact,
    deleteContact,
  };
}