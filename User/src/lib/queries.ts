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
