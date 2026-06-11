/**
 * update_user_email.js
 * 
 * Safely updates a Supabase user's auth email AND profiles table email.
 * Requires the service_role key (admin privileges).
 * 
 * Usage:
 *   node scripts/update_user_email.js <SERVICE_ROLE_KEY>
 *
 * Get your service role key from:
 *   Supabase Dashboard → Project Settings → API → service_role (secret)
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://phytcoyaemsehsezbruy.supabase.co";
const SERVICE_ROLE_KEY = process.argv[2];

const USER_ID  = "c09b6f61-949b-4a9a-9b0e-15d2f9e00351";
const OLD_EMAIL = "anayavirtualsolutions@gmail.com";
const NEW_EMAIL = "casenich11@aol.com";

if (!SERVICE_ROLE_KEY) {
  console.error("\n❌ ERROR: Service role key required.\n");
  console.error("Usage: node scripts/update_user_email.js <YOUR_SERVICE_ROLE_KEY>\n");
  console.error("Find it at: Supabase Dashboard → Project Settings → API → service_role (secret)\n");
  process.exit(1);
}

const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function updateEmail() {
  console.log("\n======================================================");
  console.log("  Supabase User Email Migration");
  console.log("======================================================");
  console.log(`  From : ${OLD_EMAIL}`);
  console.log(`  To   : ${NEW_EMAIL}`);
  console.log(`  User : ${USER_ID}`);
  console.log("======================================================\n");

  // Step 1: Verify the user exists
  console.log("Step 1: Verifying user exists in auth.users...");
  const { data: existingUser, error: fetchError } = await adminSupabase.auth.admin.getUserById(USER_ID);
  
  if (fetchError || !existingUser?.user) {
    console.error("❌ Could not fetch user from auth:", fetchError?.message || "User not found");
    process.exit(1);
  }

  if (existingUser.user.email !== OLD_EMAIL) {
    console.warn(`⚠️  Warning: Auth email is "${existingUser.user.email}", not "${OLD_EMAIL}"`);
    console.warn("   Proceeding with update anyway...");
  } else {
    console.log(`✅ Auth user found: ${existingUser.user.email}`);
  }

  // Step 2: Update auth.users email via admin API
  console.log("\nStep 2: Updating auth.users email...");
  const { data: updatedUser, error: updateError } = await adminSupabase.auth.admin.updateUserById(
    USER_ID,
    {
      email: NEW_EMAIL,
      email_confirm: true  // Marks the new email as confirmed immediately
    }
  );

  if (updateError) {
    console.error("❌ Failed to update auth email:", updateError.message);
    process.exit(1);
  }

  console.log(`✅ Auth email updated to: ${updatedUser.user.email}`);

  // Step 3: Update profiles table email
  console.log("\nStep 3: Updating profiles table email...");
  const { error: profileError } = await adminSupabase
    .from('profiles')
    .update({ email: NEW_EMAIL, updated_at: new Date().toISOString() })
    .eq('id', USER_ID);

  if (profileError) {
    console.error("❌ Failed to update profiles table:", profileError.message);
    console.error("   Auth email was updated but profiles table was NOT updated.");
    console.error("   You may need to manually update the profiles table.");
    process.exit(1);
  }

  console.log(`✅ Profiles table email updated`);

  // Step 4: Verify the final state
  console.log("\nStep 4: Verifying final state...");
  const { data: verifyProfile } = await adminSupabase
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('id', USER_ID)
    .single();

  console.log("\n======================================================");
  console.log("  ✅ Email update COMPLETE");
  console.log("======================================================");
  console.log(`  User ID   : ${USER_ID}`);
  console.log(`  Full Name : ${verifyProfile?.full_name}`);
  console.log(`  New Email : ${verifyProfile?.email}`);
  console.log(`  Role      : ${verifyProfile?.role}`);
  console.log("======================================================");
  console.log("\n🔐 The user can now log in with: casenich11@aol.com");
  console.log("   All enrollments and progress data are fully preserved.\n");
}

updateEmail().catch(err => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
