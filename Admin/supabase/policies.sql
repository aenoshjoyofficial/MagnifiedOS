-- MAGNIFIED EXISTENCE OS - RLS POLICIES
-- Run this in your Supabase SQL Editor

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;

-- Helper Function: Check if user is Admin
-- Note: Using SECURITY DEFINER to bypass RLS recursion
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'admin'
    FROM profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 1. PROFILES POLICIES
-- ==========================================

-- Allow users to see their own profile (Critical for AuthGuard)
CREATE POLICY "Profiles are viewable by owner"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow admins to see all profiles
-- We use a direct check here to avoid is_admin() recursion on the same table
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'role') = 'admin'
    )
  );

-- Admins can do everything else
CREATE POLICY "Admins can manage all profiles"
  ON profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'role') = 'admin'
    )
  );

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);


-- ==========================================
-- 2. PROGRAMS POLICIES
-- ==========================================

CREATE POLICY "Admins have full access to programs"
  ON programs FOR ALL
  TO authenticated
  USING (is_admin());

CREATE POLICY "Users can view published programs"
  ON programs FOR SELECT
  TO authenticated
  USING (is_published = true);


-- ==========================================
-- 3. CONTENT POLICIES (Modules, Lessons, Tasks)
-- ==========================================

-- Modules
CREATE POLICY "Admins have full access to modules" ON modules FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Users can view modules of published programs" 
  ON modules FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM programs WHERE id = modules.program_id AND is_published = true));

-- Lessons
CREATE POLICY "Admins have full access to lessons" ON lessons FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Users can view lessons of published programs" 
  ON lessons FOR SELECT TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM modules 
    JOIN programs ON programs.id = modules.program_id 
    WHERE modules.id = lessons.module_id AND programs.is_published = true
  ));

-- Tasks
CREATE POLICY "Admins have full access to tasks" ON tasks FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Users can view tasks of published programs" 
  ON tasks FOR SELECT TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM lessons
    JOIN modules ON modules.id = lessons.module_id
    JOIN programs ON programs.id = modules.program_id
    WHERE lessons.id = tasks.lesson_id AND programs.is_published = true
  ));


-- ==========================================
-- 4. ENROLLMENTS POLICIES
-- ==========================================

CREATE POLICY "Admins have full access to enrollments"
  ON enrollments FOR ALL
  TO authenticated
  USING (is_admin());

CREATE POLICY "Users can view own enrollments"
  ON enrollments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());


-- ==========================================
-- 5. TASK COMPLETIONS POLICIES
-- ==========================================

CREATE POLICY "Admins have full access to task_completions"
  ON task_completions FOR ALL
  TO authenticated
  USING (is_admin());

CREATE POLICY "Users can view own task_completions"
  ON task_completions FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM enrollments 
    WHERE enrollments.id = task_completions.enrollment_id AND enrollments.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own task_completions"
  ON task_completions FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM enrollments 
    WHERE enrollments.id = enrollment_id AND enrollments.user_id = auth.uid()
  ));
