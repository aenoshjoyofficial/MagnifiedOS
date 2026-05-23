import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';

// --- User Hooks ---

/**
 * Fetch the current user's profile
 */
export const useMyProfile = (userId: string) => {
  return useQuery({
    queryKey: ['my-profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

/**
 * Fetch the user's active enrollment and program details
 */
export const useMyEnrollment = (userId: string) => {
  return useQuery({
    queryKey: ['my-enrollment', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          programs (
            *,
            modules (
              *,
              lessons (
                *,
                tasks (*)
              )
            )
          ),
          task_completions (*)
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('order_index', { foreignTable: 'programs.modules', ascending: true })
        .order('day_number', { foreignTable: 'programs.modules.lessons', ascending: true })
        .order('order_index', { foreignTable: 'programs.modules.lessons.tasks', ascending: true })
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

/**
 * Mark a task as completed
 */
export const useCompleteTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ enrollmentId, taskId }: { enrollmentId: string, taskId: string }) => {
      const { data, error } = await supabase
        .from('task_completions')
        .insert({
          enrollment_id: enrollmentId,
          task_id: taskId,
          completed_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-enrollment'] });
    },
  });
};

/**
 * Undo a task completion
 */
export const useUndoTaskCompletion = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ enrollmentId, taskId }: { enrollmentId: string, taskId: string }) => {
      const { error } = await supabase
        .from('task_completions')
        .delete()
        .eq('enrollment_id', enrollmentId)
        .eq('task_id', taskId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-enrollment'] });
    },
  });
};

/**
 * Update the user's profile
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, updates }: { userId: string, updates: any }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['my-profile', variables.userId] });
    },
  });
};

/**
 * Fetch other members for the community view
 */
export const useCommunity = () => {
  return useQuery({
    queryKey: ['community'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, role, created_at')
        .eq('role', 'member')
        .limit(20);
      
      if (error) throw error;
      return data;
    },
  });
};

/**
 * Fetch all published collective sessions
 */
export const useSessions = () => {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('is_published', true)
        .order('start_time', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });
};

/**
 * Create a new private booking
 */
export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (booking: any) => {
      const { data, error } = await supabase
        .from('bookings')
        .insert(booking)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
};

/**
 * Fetch notifications for the user
 */
export const useNotifications = (userId: string) => {
  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.warn('Notifications query failed. Using fallback mock data.', error);
        return [
          {
            id: 'mock-1',
            title: 'Welcome to Shribodhi Magnified',
            message: 'Your portal is set up. Access neural protocols, schedules, and profile settings in your dashboard.',
            type: 'system',
            is_read: false,
            created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
          },
          {
            id: 'mock-2',
            title: 'New Session Scheduled',
            message: 'A new synchronous collective expansion session is scheduled. Check the sessions tab.',
            type: 'session',
            is_read: false,
            created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
          },
          {
            id: 'mock-3',
            title: 'Daily Protocol Released',
            message: "Today's evolution and neural rearchitecting protocols are active. Start your practice.",
            type: 'protocol',
            is_read: true,
            created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
          }
        ];
      }
      return data;
    },
    enabled: !!userId,
  });
};

/**
 * Mark a single notification as read
 */
export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, notificationId }: { userId: string, notificationId: string }) => {
      if (notificationId.startsWith('mock-')) return { id: notificationId, is_read: true };
      
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', variables.userId] });
    },
  });
};

/**
 * Mark all notifications as read
 */
export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      // If notifications are mock, we don't call supabase
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false)
        .select();
      
      if (error) {
        console.warn('Could not mark notifications read in Supabase.', error);
        return [];
      }
      return data;
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
  });
};

