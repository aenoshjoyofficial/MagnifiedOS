/**
 * fix_auth_email.js
 * 
 * Fixes the auth login email for user Casey Nicholaw.
 * Reads SERVICE_ROLE_KEY from command line or SUPABASE_SERVICE_KEY env var.
 *
 * Usage:
 *   SUPABASE_SERVICE_KEY=eyJ... node scripts/fix_auth_email.js
 *   -- OR --
 *   node scripts/fix_auth_email.js eyJ...your_service_role_key...
 */

const SUPABASE_URL = "https://phytcoyaemsehsezbruy.supabase.co";
const SERVICE_ROLE_KEY = process.argv[2] || process.env.SUPABASE_SERVICE_KEY;

const USER_ID  = "c09b6f61-949b-4a9a-9b0e-15d2f9e00351";
const NEW_EMAIL = "casenich11@aol.com";

if (!SERVICE_ROLE_KEY) {
  console.error("\n❌  Service Role Key is required.\n");
  console.error("Run as:");
  console.error("  SUPABASE_SERVICE_KEY=eyJ... node scripts/fix_auth_email.js\n");
  console.error("Or:");
  console.error("  node scripts/fix_auth_email.js eyJ...YOUR_KEY_HERE...\n");
  console.error("Find it: Supabase Dashboard → Project Settings → API → service_role (secret)\n");
  process.exit(1);
}

async function fixEmail() {
  console.log(`\n🔧 Updating auth login email to: ${NEW_EMAIL}`);
  console.log(`   User ID: ${USER_ID}\n`);

  // Update auth.users email via Supabase Admin REST API
  const authRes = await fetch(
    `${SUPABASE_URL}/auth/v1/admin/users/${USER_ID}`,
    {
      method: 'PUT',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: NEW_EMAIL,
        email_confirm: true   // skip email verification
      })
    }
  );

  const authData = await authRes.json();

  if (!authRes.ok) {
    console.error("❌ Auth update failed:", JSON.stringify(authData, null, 2));
    process.exit(1);
  }

  console.log(`✅ Auth email updated: ${authData.email}`);

  // Also sync profiles table
  const profileRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${USER_ID}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        email: NEW_EMAIL,
        updated_at: new Date().toISOString()
      })
    }
  );

  const profileData = await profileRes.json();

  if (!profileRes.ok) {
    console.error("⚠️  Profile table update failed:", JSON.stringify(profileData, null, 2));
    console.error("   Auth email was updated but profile display email was NOT synced.");
  } else {
    console.log(`✅ Profile email synced: ${profileData[0]?.email}`);
  }

  console.log("\n======================================================");
  console.log("  ✅ DONE — Login is now fixed");
  console.log("======================================================");
  console.log(`  Login email  : casenich11@aol.com`);
  console.log(`  User ID      : ${USER_ID}`);
  console.log(`  Enrollments  : PRESERVED (linked by User ID, not email)`);
  console.log("======================================================\n");
}

fixEmail().catch(err => {
  console.error("Unexpected error:", err.message);
  process.exit(1);
});
