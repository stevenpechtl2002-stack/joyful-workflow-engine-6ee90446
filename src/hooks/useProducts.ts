import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Product {
  id: string;
  user_id: string;
  category: string;
  name: string;
  duration_minutes: number;
  price: number;
  price_type: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function useProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProducts = useCallback(async () => {
    if (!user) {
      setProducts([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .order('category', { ascending: true })
        .order('sort_order', { ascending: true });

      if (fetchError) throw fetchError;
      setProducts((data as Product[]) || []);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const createProduct = useCallback(async (
    data: Pick<Product, 'category' | 'name' | 'duration_minutes' | 'price'> & 
    Partial<Pick<Product, 'price_type' | 'is_active' | 'sort_order' | 'description'>>
  ) => {
    if (!user) throw new Error('Not authenticated');

    const { data: newProduct, error } = await supabase
      .from('products')
      .insert({ ...data, user_id: user.id })
      .select()
      .single();

    if (error) throw error;
    await fetchProducts();
    return newProduct as Product;
  }, [user, fetchProducts]);

  const updateProduct = useCallback(async (
    id: string,
    data: Partial<Pick<Product, 'category' | 'name' | 'duration_minutes' | 'price' | 'price_type' | 'is_active' | 'sort_order' | 'description'>>
  ) => {
    const { data: updated, error } = await supabase
      .from('products')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    await fetchProducts();
    return updated as Product;
  }, [fetchProducts]);

  const deleteProduct = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await fetchProducts();
  }, [fetchProducts]);

  const productsByCategory = products.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  return {
    products,
    activeProducts: products.filter(p => p.is_active),
    productsByCategory,
    loading,
    error,
    refetch: fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  };
}