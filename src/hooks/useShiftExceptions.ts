import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ShiftException {
  id: string;
  user_id: string;
  staff_member_id: string;
  exception_date: string;
  start_time: string;
  end_time: string;
  reason?: string;
  created_at: string;
  updated_at: string;
}

export interface ShiftExceptionInput {
  staff_member_id: string;
  exception_date: string;
  start_time: string;
  end_time: string;
  reason?: string;
}

export const useShiftExceptions = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: exceptions = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['shift-exceptions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shift_exceptions')
        .select('*')
        .eq('user_id', user!.id)
        .order('exception_date')
        .order('start_time');

      if (error) throw error;
      return data as ShiftException[];
    },
    enabled: !!user?.id
  });

  const createException = useMutation({
    mutationFn: async (input: ShiftExceptionInput) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('shift_exceptions')
        .insert({
          user_id: user.id,
          staff_member_id: input.staff_member_id,
          exception_date: input.exception_date,
          start_time: input.start_time,
          end_time: input.end_time,
          reason: input.reason
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-exceptions'] });
      toast.success('Freistellung gespeichert');
    },
    onError: (error) => {
      console.error('Error creating exception:', error);
      toast.error('Fehler beim Speichern der Freistellung');
    }
  });

  const deleteException = useMutation({
    mutationFn: async (exceptionId: string) => {
      const { error } = await supabase
        .from('shift_exceptions')
        .delete()
        .eq('id', exceptionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-exceptions'] });
      toast.success('Freistellung gelöscht');
    },
    onError: (error) => {
      console.error('Error deleting exception:', error);
      toast.error('Fehler beim Löschen der Freistellung');
    }
  });

  // Check if a staff member has an exception at a specific time on a specific date
  const hasExceptionAt = (staffId: string, date: string, hour: number, minutes: number): boolean => {
    const timeInMinutes = hour * 60 + minutes;
    
    return exceptions.some(exc => {
      if (exc.staff_member_id !== staffId || exc.exception_date !== date) return false;
      
      const [startH, startM] = exc.start_time.split(':').map(Number);
      const [endH, endM] = exc.end_time.split(':').map(Number);
      const excStartMinutes = startH * 60 + startM;
      const excEndMinutes = endH * 60 + endM;
      
      return timeInMinutes >= excStartMinutes && timeInMinutes < excEndMinutes;
    });
  };

  // Get exceptions for a specific staff member on a specific date
  const getExceptionsForStaffAndDate = (staffId: string, date: string): ShiftException[] => {
    return exceptions.filter(exc => exc.staff_member_id === staffId && exc.exception_date === date);
  };

  return {
    exceptions,
    isLoading,
    error,
    createException,
    deleteException,
    hasExceptionAt,
    getExceptionsForStaffAndDate,
    isCreating: createException.isPending,
    isDeleting: deleteException.isPending
  };
};
