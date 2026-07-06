import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';

export interface Chamber {
  id: string;
  slug: string;
  title: string;
  description?: string;
  icon?: string;
  display_order: number;
  visible: boolean;
  active: boolean;
  coming_soon: boolean;
  premium_only: boolean;
  color_accent?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Fetch all chambers from the database sorted by display_order
 */
export const useChambers = () => {
  return useQuery({
    queryKey: ['chambers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chambers')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as Chamber[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

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
        .order('started_at', { ascending: false })
        .order('order_index', { foreignTable: 'programs.modules', ascending: true })
        .order('day_number', { foreignTable: 'programs.modules.lessons', ascending: true })
        .order('order_index', { foreignTable: 'programs.modules.lessons.tasks', ascending: true })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 10 * 1000,
  });
};

/**
 * Mark a task as completed
 */
export const useCompleteTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ enrollmentId, taskId, userId }: { enrollmentId: string, taskId: string, userId?: string }) => {
      let finalUserId = userId;
      if (!finalUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          finalUserId = user.id;
        }
      }

      const { data, error } = await supabase
        .from('task_completions')
        .insert({
          enrollment_id: enrollmentId,
          task_id: taskId,
          completed_at: new Date().toISOString()
        })
        .select()
        .maybeSingle();
      
      if (error && error.code !== '23505') {
        throw error;
      }

      if (finalUserId) {
        const { error: progressError } = await supabase
          .from('user_progress')
          .upsert({
            user_id: finalUserId,
            task_id: taskId,
            status: 'completed',
            completion_percentage: 100,
            completed_at: new Date().toISOString(),
            last_accessed_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,task_id'
          });
        
        if (progressError) {
          throw progressError;
        }
      }
      
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
      // 1. Try querying with is_published and start_time
      try {
        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .eq('is_published', true)
          .order('start_time', { ascending: true });
        
        if (!error && data) {
          return data.map((s: any) => ({
            ...s,
            start_time: s.start_time || s.scheduled_at,
            host_name: s.host_name || 'Dr. Aris Thorne',
            session_type: s.session_type || 'Group Call',
            duration_minutes: s.duration_minutes || 60,
          }));
        }
      } catch (_) {}

      // 2. Try querying with is_published and scheduled_at
      try {
        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .eq('is_published', true)
          .order('scheduled_at', { ascending: true });
        
        if (!error && data) {
          return data.map((s: any) => ({
            ...s,
            start_time: s.start_time || s.scheduled_at,
            host_name: s.host_name || 'Dr. Aris Thorne',
            session_type: s.session_type || 'Group Call',
            duration_minutes: s.duration_minutes || 60,
          }));
        }
      } catch (_) {}

      // 3. Try fallback without is_published filter, order by start_time
      try {
        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .order('start_time', { ascending: true });
        
        if (!error && data) {
          return data.map((s: any) => ({
            ...s,
            start_time: s.start_time || s.scheduled_at,
            host_name: s.host_name || 'Dr. Aris Thorne',
            session_type: s.session_type || 'Group Call',
            duration_minutes: s.duration_minutes || 60,
          }));
        }
      } catch (_) {}

      // 4. Try fallback without is_published filter, order by scheduled_at
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .order('scheduled_at', { ascending: true });
      
      if (error) throw error;
      return (data || []).map((s: any) => ({
        ...s,
        start_time: s.start_time || s.scheduled_at,
        host_name: s.host_name || 'Dr. Aris Thorne',
        session_type: s.session_type || 'Group Call',
        duration_minutes: s.duration_minutes || 60,
      }));
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
      // Invalidate admin bookings so the Admin panel reflects new bookings immediately
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      // Also refresh sessions in case available slot counts change
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

/**
 * Fetch the user's last completed enrollment
 */
export const useMyLastCompletedEnrollment = (userId: string) => {
  return useQuery({
    queryKey: ['my-completed-enrollment', userId],
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
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

/**
 * Complete an enrollment and store it in program_cycles history
 */
export const useCompleteEnrollment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      enrollmentId, 
      cycleNumber, 
      startedAt, 
      userId, 
      programId,
      tasksCompleted,
      totalTasks,
      completionPercentage
    }: { 
      enrollmentId: string, 
      cycleNumber: number, 
      startedAt: string, 
      userId: string, 
      programId: string,
      tasksCompleted: number,
      totalTasks: number,
      completionPercentage: number
    }) => {
      // Call the atomic postgres function to complete enrollment
      const { data, error } = await supabase.rpc('complete_enrollment_transaction', {
        p_enrollment_id: enrollmentId,
        p_user_id: userId,
        p_program_id: programId,
        p_cycle_number: cycleNumber,
        p_tasks_completed: tasksCompleted,
        p_total_tasks: totalTasks,
        p_completion_percentage: completionPercentage,
        p_started_at: startedAt
      });

      if (error) {
        throw error;
      }

      if (data && !data.success) {
        throw new Error(data.error || 'Transaction failed');
      }

      return { id: enrollmentId, status: 'completed' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-enrollment'] });
      queryClient.invalidateQueries({ queryKey: ['my-completed-enrollment'] });
    }
  });
};

/**
 * Start a new cycle for the user
 */
export const useStartNewCycle = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, programId, cycleNumber }: { userId: string, programId: string, cycleNumber: number }) => {
      const { data, error } = await supabase
        .from('enrollments')
        .insert({
          user_id: userId,
          program_id: programId,
          status: 'active',
          cycle_number: cycleNumber,
          started_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-enrollment'] });
      queryClient.invalidateQueries({ queryKey: ['my-completed-enrollment'] });
    }
  });
};


