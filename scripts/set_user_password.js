/**
 * set_user_password.js
 * 
 * Safely updates a Supabase user's auth password.
 * Requires the service_role key (admin privileges).
 * 
 * Usage:
 *   node scripts/set_user_password.js <SERVICE_ROLE_KEY> <EMAIL> [NEW_PASSWORD]
 *
 * Example:
 *   node scripts/set_user_password.js eyJhbGciOiJIUzI1... casenich11@aol.com TestPassword123!
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://evkkbwulppxazqgprefy.supabase.co";
const SERVICE_ROLE_KEY = process.argv[2];
const USER_EMAIL = process.argv[3];
const NEW_PASSWORD = process.argv[4] || "TestPassword123!";

if (!SERVICE_ROLE_KEY || !USER_EMAIL) {
  console.error("\n❌ ERROR: Service role key and user email are required.\n");
  console.error("Usage: node scripts/set_user_password.js <YOUR_SERVICE_ROLE_KEY> <USER_EMAIL> [NEW_PASSWORD]\n");
  process.exit(1);
}

const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setPassword() {
  console.log("\n======================================================");
  console.log("  Supabase User Password Reset Utility");
  console.log("======================================================");
  console.log(`  Target Email : ${USER_EMAIL}`);
  console.log(`  New Password : ${NEW_PASSWORD}`);
  console.log("======================================================\n");

  // Step 1: Find the user ID by email
  console.log("Step 1: Fetching user from Supabase auth.users...");
  const { data: { users }, error: listError } = await adminSupabase.auth.admin.listUsers();

  if (listError) {
    console.error("❌ Failed to list users:", listError.message);
    process.exit(1);
  }

  const targetUser = users.find(u => u.email.toLowerCase() === USER_EMAIL.toLowerCase());

  if (!targetUser) {
    console.error(`❌ User not found with email: ${USER_EMAIL}`);
    process.exit(1);
  }

  console.log(`✅ Found user ID: ${targetUser.id}`);

  // Step 2: Update password
  console.log("\nStep 2: Updating password...");
  const { data: updatedUser, error: updateError } = await adminSupabase.auth.admin.updateUserById(
    targetUser.id,
    {
      password: NEW_PASSWORD
    }
  );

  if (updateError) {
    console.error("❌ Failed to update password:", updateError.message);
    process.exit(1);
  }

  // Step 3: Set must_change_password to false in public.profiles (so they don't get blocked or prompted)
  console.log("\nStep 3: Updating must_change_password to false in profiles...");
  const { error: profileError } = await adminSupabase
    .from('profiles')
    .update({ must_change_password: false, updated_at: new Date().toISOString() })
    .eq('id', targetUser.id);

  if (profileError) {
    console.warn("⚠️ Warning: Failed to update profiles table:", profileError.message);
  } else {
    console.log("✅ public.profiles updated successfully");
  }

  console.log("\n======================================================");
  console.log("  ✅ Password reset COMPLETE");
  console.log("======================================================");
  console.log(`  User ID    : ${targetUser.id}`);
  console.log(`  Email      : ${USER_EMAIL}`);
  console.log(`  Password   : ${NEW_PASSWORD}`);
  console.log("======================================================\n");
}

setPassword().catch(err => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
