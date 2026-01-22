import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Product {
  id: string;
  category: string;
  name: string;
  duration_minutes: number;
  price: number;
  price_type: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
}

export const useProducts = (onlyActive: boolean = false) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['products', user?.id, onlyActive],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('category', { ascending: true })
        .order('sort_order', { ascending: true });
      
      if (onlyActive) {
        query = query.eq('is_active', true);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!user?.id
  });
};
