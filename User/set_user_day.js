/**
 * set_user_day.js
 * 
 * Sets a user's active enrollment start date back by N days to simulate being on Day N+1.
 * Runs inside User folder to leverage local dependency resolution.
 * 
 * Usage:
 *   node User/set_user_day.js <SERVICE_ROLE_KEY> [DAYS_BACK]
 *
 * Example:
 *   node User/set_user_day.js <SERVICE_ROLE_KEY> 2   # Sets started_at back by 2 days, unlocking Day 3
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://evkkbwulppxazqgprefy.supabase.co";
const SERVICE_ROLE_KEY = process.argv[2];
const DAYS_BACK = process.argv[3] ? parseInt(process.argv[3], 10) : 2; // Default to 2 days back (unlocks Day 3)
const EMAIL = "casenich11@aol.com";

if (!SERVICE_ROLE_KEY) {
  console.error("\n❌ ERROR: Service role key required.\n");
  console.error("Usage: node User/set_user_day.js <SERVICE_ROLE_KEY> [DAYS_BACK]\n");
  console.error("Find it at: Supabase Dashboard → Project Settings → API → service_role (secret)\n");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function run() {
  console.log("\n======================================================");
  console.log("  Adjusting User Enrollment Day");
  console.log("======================================================");
  console.log(`  Target Email : ${EMAIL}`);
  console.log(`  Days Back    : ${DAYS_BACK} (Sets progress to Day ${DAYS_BACK + 1})`);
  console.log("======================================================\n");

  // Step 1: Find the profile from email
  console.log("Step 1: Fetching profile from profiles table...");
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('email', EMAIL)
    .single();

  if (profileError || !profile) {
    console.error("❌ User not found:", profileError?.message || "User profile record not found.");
    process.exit(1);
  }

  console.log(`✅ Profile found: ${profile.full_name} (${profile.id})`);

  // Step 2: Find active enrollment
  console.log("\nStep 2: Fetching active enrollment...");
  const { data: enrollments, error: enrollError } = await supabase
    .from('enrollments')
    .select('*')
    .eq('user_id', profile.id)
    .eq('status', 'active');

  if (enrollError || !enrollments || enrollments.length === 0) {
    console.error("❌ No active enrollment found for this user.");
    process.exit(1);
  }

  const enrollment = enrollments[0];
  console.log(`✅ Active enrollment found: ${enrollment.id}`);
  console.log(`   Current started_at: ${enrollment.started_at}`);

  // Step 3: Calculate target date
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - DAYS_BACK);
  console.log(`\nStep 3: Calculating target started_at...`);
  console.log(`   Target Date: ${targetDate.toISOString()}`);

  // Step 4: Update date
  console.log("\nStep 4: Updating enrollment started_at in database...");
  const { data: updated, error: updateError } = await supabase
    .from('enrollments')
    .update({ started_at: targetDate.toISOString() })
    .eq('id', enrollment.id)
    .select();

  if (updateError || !updated || updated.length === 0) {
    console.error("❌ Failed to update started_at:", updateError?.message || "No records returned.");
    process.exit(1);
  }

  console.log("\n======================================================");
  console.log("  ✅ Enrollment start date adjusted successfully!");
  console.log("======================================================");
  console.log(`  User      : ${profile.full_name}`);
  console.log(`  Program   : Casey June Protocol`);
  console.log(`  New Day   : Day ${DAYS_BACK + 1}`);
  console.log(`  StartedAt : ${updated[0].started_at}`);
  console.log("======================================================\n");
}

run().catch(err => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
