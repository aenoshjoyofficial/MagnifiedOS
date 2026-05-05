-- Function to Save/Update a complete program structure in one transaction
-- This handles Program Settings, Modules, and Lessons (including deletions)
CREATE OR REPLACE FUNCTION publish_complete_program(
    p_program_id UUID,
    p_program_data JSONB,
    p_modules_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges to bypass RLS if needed, but we check role below
AS $$
DECLARE
    v_user_role TEXT;
    v_module RECORD;
    v_lesson RECORD;
    v_existing_module_ids UUID[];
    v_existing_lesson_ids UUID[];
    v_incoming_module_ids UUID[] := '{}';
    v_incoming_lesson_ids UUID[] := '{}';
    v_result JSONB;
BEGIN
    -- 1. Security Check: Only admins can publish
    SELECT role INTO v_user_role FROM profiles WHERE id = auth.uid();
    IF v_user_role != 'admin' THEN
        RAISE EXCEPTION 'Unauthorized: Only administrators can publish programs.';
    END IF;

    -- 2. Upsert Program Settings
    INSERT INTO programs (
        id, 
        title, 
        description, 
        duration_days, 
        cover_image, 
        is_published,
        updated_at
    )
    VALUES (
        p_program_id,
        p_program_data->>'title',
        p_program_data->>'description',
        (p_program_data->>'duration_days')::INTEGER,
        p_program_data->>'cover_image',
        (p_program_data->>'is_published')::BOOLEAN,
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        duration_days = EXCLUDED.duration_days,
        cover_image = EXCLUDED.cover_image,
        is_published = EXCLUDED.is_published,
        updated_at = NOW();

    -- 3. Process Modules
    FOR v_module IN SELECT * FROM jsonb_to_recordset(p_modules_data) AS x(id UUID, title TEXT, order_index INTEGER, lessons JSONB)
    LOOP
        -- Track incoming IDs for cleanup
        v_incoming_module_ids := array_append(v_incoming_module_ids, v_module.id);

        INSERT INTO modules (id, program_id, title, order_index)
        VALUES (v_module.id, p_program_id, v_module.title, v_module.order_index)
        ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            order_index = EXCLUDED.order_index;

        -- 4. Process Lessons for this module
        FOR v_lesson IN SELECT * FROM jsonb_to_recordset(v_module.lessons) AS y(id UUID, title TEXT, day_number INTEGER, unlock_day INTEGER)
        LOOP
            v_incoming_lesson_ids := array_append(v_incoming_lesson_ids, v_lesson.id);

            INSERT INTO lessons (id, module_id, title, day_number, unlock_day)
            VALUES (v_lesson.id, v_module.id, v_lesson.title, v_lesson.day_number, v_lesson.unlock_day)
            ON CONFLICT (id) DO UPDATE SET
                title = EXCLUDED.title,
                day_number = EXCLUDED.day_number,
                unlock_day = EXCLUDED.unlock_day;
        END LOOP;
    END LOOP;

    -- 5. Cleanup: Delete modules/lessons that were removed in the UI
    -- Delete lessons not in the incoming list for the current program's modules
    DELETE FROM lessons 
    WHERE module_id IN (SELECT id FROM modules WHERE program_id = p_program_id)
    AND id != ALL(v_incoming_lesson_ids);

    -- Delete modules not in the incoming list for the current program
    DELETE FROM modules 
    WHERE program_id = p_program_id 
    AND id != ALL(v_incoming_module_ids);

    RETURN jsonb_build_object('status', 'success', 'program_id', p_program_id);
END;
$$;
