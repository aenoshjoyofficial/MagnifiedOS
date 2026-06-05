-- MAGNIFIED EXISTENCE OS - ADMIN USER CREATION RPC
-- Run this in your Supabase SQL Editor

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION admin_create_user(
  target_email TEXT,
  target_password TEXT,
  target_full_name TEXT,
  target_role TEXT DEFAULT 'member'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges
AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- 1. Generate a new UUID
  new_user_id := uuid_generate_v4();

  -- 2. Insert into auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    target_email,
    crypt(target_password, gen_salt('bf')), -- SECURELY HASH THE PASSWORD
    now(), -- AUTO-CONFIRM EMAIL
    '{"provider": "email", "providers": ["email"]}',
    jsonb_build_object('full_name', target_full_name, 'role', target_role),
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  -- 3. Insert into identities
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id, -- ADDED THIS FIELD
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    new_user_id,
    new_user_id,
    format('{"sub": "%s", "email": "%s"}', new_user_id, target_email)::jsonb,
    'email',
    target_email, -- USE EMAIL AS PROVIDER_ID
    now(),
    now(),
    now()
  );

  -- 4. Note: The profile creation is handled by your existing DB trigger 
  -- if you have one. If not, we can manually insert it here too.
  -- To be safe, let's ensure the profile has the correct role.
  UPDATE profiles 
  SET role = target_role, 
      full_name = target_full_name 
  WHERE id = new_user_id;

  RETURN new_user_id;
END;
$$;
