import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Appointment {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  status: string;
}

export interface DashboardStats {
  upcomingAppointments: number;
  documents: number;
  unreadNotifications: number;
  completedAppointments: number;
}

export const useDashboardStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: async (): Promise<DashboardStats> => {
      if (!user) throw new Error('Not authenticated');

      const now = new Date().toISOString();

      // Fetch counts in parallel
      const [appointmentsResult, documentsResult, notificationsResult, completedResult] = await Promise.all([
        supabase
          .from('appointments')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('start_time', now)
          .in('status', ['pending', 'confirmed']),
        supabase
          .from('documents')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('read', false),
        supabase
          .from('appointments')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'completed'),
      ]);

      return {
        upcomingAppointments: appointmentsResult.count || 0,
        documents: documentsResult.count || 0,
        unreadNotifications: notificationsResult.count || 0,
        completedAppointments: completedResult.count || 0,
      };
    },
    enabled: !!user,
    staleTime: 30000,
  });
};

export const useUpcomingAppointments = (limit = 5) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['upcoming-appointments', user?.id, limit],
    queryFn: async (): Promise<Appointment[]> => {
      if (!user) throw new Error('Not authenticated');

      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('appointments')
        .select('id, title, description, start_time, end_time, location, status')
        .eq('user_id', user.id)
        .gte('start_time', now)
        .in('status', ['pending', 'confirmed'])
        .order('start_time', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    staleTime: 30000,
  });
};

export const useRecentActivity = (limit = 5) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recent-activity', user?.id, limit],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');

      // Fetch recent notifications as activity
      const { data, error } = await supabase
        .from('notifications')
        .select('id, title, message, type, created_at, read')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    staleTime: 30000,
  });
};

export const useAppointmentStatusStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['appointment-status-stats', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('appointments')
        .select('status')
        .eq('user_id', user.id);

      if (error) throw error;

      const statusCounts = (data || []).reduce((acc, apt) => {
        acc[apt.status] = (acc[apt.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return [
        { name: 'Ausstehend', value: statusCounts['pending'] || 0, color: 'hsl(var(--primary))' },
        { name: 'Bestätigt', value: statusCounts['confirmed'] || 0, color: 'hsl(var(--accent))' },
        { name: 'Abgeschlossen', value: statusCounts['completed'] || 0, color: '#22c55e' },
        { name: 'Abgesagt', value: statusCounts['cancelled'] || 0, color: '#ef4444' },
      ].filter(item => item.value > 0);
    },
    enabled: !!user,
    staleTime: 60000,
  });
};
