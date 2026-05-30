import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';

// --- Types ---

export interface Program {
  id: string;
  title: string;
  description: string;
  duration_days: number;
  cover_image: string;
  is_published: boolean;
  created_at?: string;
  modules?: Module[];
}

export interface Module {
  id: string;
  program_id: string;
  title: string;
  order_index: number;
  created_at?: string;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  day_number: number;
  unlock_day: number;
  description?: string;
  created_at?: string;
  tasks?: Task[];
}

export interface Task {
  id: string;
  lesson_id: string;
  title: string;
  description?: string;
  type: 'audio' | 'video' | 'text' | 'checklist';
  content?: any;
  order_index: number;
  created_at?: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  role: string;
  created_at: string;
  must_change_password?: boolean;
  enrollments?: Enrollment[];
}

export interface Enrollment {
  id: string;
  user_id: string;
  program_id: string;
  status: 'active' | 'paused' | 'completed';
  started_at: string;
  programs?: Program;
  task_completions?: { id: string }[];
}

export interface CollectiveSession {
  id: string;
  title: string;
  host_name: string;
  host_avatar_url?: string;
  description?: string;
  session_type: string;
  start_time: string;
  duration_minutes: number;
  meeting_link?: string;
  max_attendees?: number;
  is_published: boolean;
  created_at?: string;
}

// --- Admin Hooks ---

/**
 * Fetch all users with their active enrollments and progress
 */
export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          enrollments (
            id,
            status,
            programs (id, title),
            task_completions (id)
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as UserProfile[];
    },
  });
};

/**
 * Fetch all available programs
 */
export const usePrograms = () => {
  return useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Program[];
    },
  });
};

/**
 * Fetch detailed progress for a single user
 */
export const useUserProgress = (userId: string) => {
  return useQuery({
    queryKey: ['user-progress', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          enrollments (
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
          )
        `)
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

/**
 * Create or Update a Program
 */
export const useSaveProgram = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (program: Partial<Program>) => {
      console.log("START SAVE");
      console.log("BEFORE INSERT");
      const { data, error } = await supabase
        .from('programs')
        .upsert(program)
        .select()
        .single();
      
      console.log("AFTER INSERT");
      console.log("data:", data);
      console.log("error:", error);
      
      if (error) {
        // Mock toast error fallback
        const errMsg = error.message || 'Unknown database error';
        console.error("TOAST ERROR:", errMsg);
        if (typeof window !== 'undefined') {
          alert(`Error: ${errMsg}`);
        }
        throw error;
      }
      return data;
    },
    onSuccess: (data) => {
      console.log("REFRESH PROGRAMS");
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['program-details', data.id] });
      console.log("DONE");
    },
  });
};

/**
 * Delete a Program
 */
export const useDeleteProgram = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (programId: string) => {
      const { error } = await supabase
        .from('programs')
        .delete()
        .eq('id', programId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
    },
  });
};

/**
 * Enroll a user in a program
 */
export const useEnrollUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, programId }: { userId: string, programId: string }) => {
      const { data, error } = await supabase
        .from('enrollments')
        .insert({
          user_id: userId,
          program_id: programId,
          status: 'active',
          started_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

/**
 * Admin creates a new user account
 */
export const useCreateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ email, password, fullName, programId }: any) => {
      // 1. Create the User via RPC (Bypasses Rate Limits & Sign-up Restrictions)
      const { data: newUserId, error: authError } = await supabase.rpc('admin_create_user', {
        target_email: email,
        target_password: password,
        target_full_name: fullName,
        target_role: 'member'
      });

      if (authError) {
        console.error('RPC Creation Error:', authError);
        throw authError;
      }
      
      if (!newUserId) throw new Error('Failed to create user ID via RPC');

      // 2. Update the profile (the trigger handles creation, we just ensure settings)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ must_change_password: true })
        .eq('id', newUserId);

      if (profileError) throw profileError;

      // 3. Enroll in program if provided
      if (programId) {
        const { error: enrollError } = await supabase
          .from('enrollments')
          .insert({
            user_id: newUserId,
            program_id: programId,
            status: 'active',
            started_at: new Date().toISOString()
          });
        
        if (enrollError) throw enrollError;
      }

      return { id: newUserId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

/**
 * Save (Create or Update) a Module
 */
export const useSaveModule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (module: Partial<Module>) => {
      let query;
      if (module.id) {
        query = supabase
          .from('modules')
          .update(module)
          .eq('id', module.id);
      } else {
        query = supabase
          .from('modules')
          .upsert(module);
      }
      const { data, error } = await query.select().single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['program-details', data.program_id] });
    },
  });
};

/**
 * Delete a Module
 */
export const useDeleteModule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (moduleId: string) => {
      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', moduleId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program-details'] });
    },
  });
};

/**
 * Save (Create or Update) a Lesson
 */
export const useSaveLesson = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (lesson: Partial<Lesson>) => {
      let query;
      if (lesson.id) {
        query = supabase
          .from('lessons')
          .update(lesson)
          .eq('id', lesson.id);
      } else {
        query = supabase
          .from('lessons')
          .upsert(lesson);
      }
      const { data, error } = await query.select().single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program-details'] });
    },
  });
};

/**
 * Delete a Lesson
 */
export const useDeleteLesson = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (lessonId: string) => {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program-details'] });
    },
  });
};

/**
 * Save (Create or Update) a Task
 */
export const useSaveTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (task: Partial<Task>) => {
      let query;
      if (task.id) {
        query = supabase
          .from('tasks')
          .update(task)
          .eq('id', task.id);
      } else {
        query = supabase
          .from('tasks')
          .upsert(task);
      }
      const { data, error } = await query.select().single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program-details'] });
    },
  });
};

/**
 * Delete a Task
 */
export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program-details'] });
    },
  });
};

/**
 * Fetch program details including modules, lessons and tasks
 */
export const useProgramDetails = (programId: string) => {
  return useQuery({
    queryKey: ['program-details', programId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs')
        .select(`
          *,
          modules (
            *,
            lessons (
              *,
              tasks (*)
            )
          )
        `)
        .eq('id', programId)
        .order('order_index', { foreignTable: 'modules', ascending: true })
        .order('day_number', { foreignTable: 'modules.lessons', ascending: true })
        .order('order_index', { foreignTable: 'modules.lessons.tasks', ascending: true })
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!programId,
  });
};

/**
 * Fetch high-level admin dashboard stats
 */
export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [users, enrollments, completions] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('enrollments').select('id', { count: 'exact', head: true }),
        supabase.from('task_completions').select('id', { count: 'exact', head: true }),
      ]);

      return {
        totalMembers: users.count || 0,
        activeEnrollments: enrollments.count || 0,
        totalCompletions: completions.count || 0,
      };
    },
  });
};

/**
 * Upload an asset (Audio/Video/Image) to Supabase Storage
 */
export const useUploadAsset = () => {
  return useMutation({
    mutationFn: async ({ file, bucket, path }: { file: File, bucket: string, path: string }) => {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          upsert: true,
          cacheControl: '3600'
        });
      
      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);
      
      return publicUrl;
    }
  });
};

/**
 * Admin updates an existing user profile
 */
export const useUpdateUser = () => {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-progress'] });
    },
  });
};

/**
 * Fetch all collective sessions
 */
export const useAdminSessions = () => {
  return useQuery({
    queryKey: ['admin-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .order('start_time', { ascending: true });
      
      if (error) throw error;
      return data as CollectiveSession[];
    },
  });
};

/**
 * Save (Create or Update) a Collective Session
 */
export const useSaveAdminSession = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (session: Partial<CollectiveSession>) => {
      const { data, error } = await supabase
        .from('sessions')
        .upsert(session)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sessions'] });
    },
  });
};

/**
 * Delete a Collective Session
 */
export const useDeleteAdminSession = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sessions'] });
    },
  });
};

/**
 * Fetch all member bookings for admin
 */
export const useAdminBookings = () => {
  return useQuery({
    queryKey: ['admin-bookings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          profiles:user_id (full_name, avatar_url, email)
        `)
        .order('start_time', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });
};

/**
 * Update a booking status
 */
export const useUpdateBookingStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const { data, error } = await supabase
        .from('bookings')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
    },
  });
};
