-- =========================================================================
-- Phase 3B - Atomic Enrollment Completion (Hardened & Idempotent)
-- =========================================================================

CREATE OR REPLACE FUNCTION complete_enrollment_transaction(
  p_enrollment_id UUID,
  p_user_id UUID,
  p_program_id UUID,
  p_cycle_number INTEGER,
  p_tasks_completed INTEGER,
  p_total_tasks INTEGER,
  p_completion_percentage INTEGER,
  p_started_at TIMESTAMPTZ
) RETURNS JSONB AS $$
DECLARE
  v_completed_at TIMESTAMPTZ := NOW();
  v_status TEXT;
  v_history_exists BOOLEAN;
BEGIN
  -- 1. Security Checks: Ensure the user matches the auth.uid() or is an admin
  IF auth.uid() <> p_user_id AND NOT is_admin() THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Unauthorized: User ID mismatch'
    );
  END IF;

  -- 2. Row Locking: Lock the enrollment row to prevent race conditions/double completions
  SELECT status INTO v_status 
  FROM enrollments 
  WHERE id = p_enrollment_id 
  FOR UPDATE;

  -- 3. Idempotency Check & Validation: Verify existence and status
  IF v_status IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Enrollment not found'
    );
  ELSIF v_status = 'completed' THEN
    -- If already completed, make the RPC call idempotent and return success
    RETURN jsonb_build_object(
      'success', TRUE,
      'error', NULL,
      'info', 'Enrollment already completed'
    );
  ELSIF v_status <> 'active' THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Enrollment is not active. Current status: ' || v_status
    );
  END IF;

  -- Verify the enrollment belongs to the user (unless the caller is an admin)
  IF NOT is_admin() AND NOT EXISTS (
    SELECT 1 FROM enrollments
    WHERE id = p_enrollment_id AND user_id = p_user_id
  ) THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Unauthorized: Enrollment does not belong to this user'
    );
  END IF;

  -- 4. Check if cycle_history record already exists to prevent duplicate writes
  SELECT EXISTS (
    SELECT 1 FROM cycle_history WHERE enrollment_id = p_enrollment_id
  ) INTO v_history_exists;

  IF NOT v_history_exists THEN
    -- Insert into cycle_history
    INSERT INTO cycle_history (
      enrollment_id,
      user_id,
      program_id,
      cycle_number,
      tasks_completed,
      total_tasks,
      completion_percentage,
      started_at,
      completed_at
    ) VALUES (
      p_enrollment_id,
      p_user_id,
      p_program_id,
      p_cycle_number,
      p_tasks_completed,
      p_total_tasks,
      p_completion_percentage,
      p_started_at,
      v_completed_at
    );
  END IF;

  -- 5. Update active enrollment status to completed
  UPDATE enrollments
  SET status = 'completed'
  WHERE id = p_enrollment_id;

 
  -- 7. Return success response
  RETURN jsonb_build_object(
    'success', TRUE,
    'error', NULL
  );

EXCEPTION WHEN OTHERS THEN
  -- Automatically rolls back all queries executed inside the subtransaction
  RETURN jsonb_build_object(
    'success', FALSE,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
