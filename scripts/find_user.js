// Script to look up user data for anayavirtualsolutions@gmail.com
// Uses anon key (read-only safe operations)

const url = "https://phytcoyaemsehsezbruy.supabase.co/rest/v1";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoeXRjb3lhZW1zZWhzZXpicnV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MDA5NDAsImV4cCI6MjA5MzM3Njk0MH0.fTPenRdec6P_JK5Q1SpyzUUypdr0D6W4v-aH7bw_HU8";

const headers = {
  "apikey": anonKey,
  "Authorization": `Bearer ${anonKey}`,
  "Content-Type": "application/json"
};

const OLD_EMAIL = "anayavirtualsolutions@gmail.com";

async function findUser() {
  console.log(`\n🔍 Looking up user: ${OLD_EMAIL}\n`);

  // 1. Find profile by email
  const profileRes = await fetch(
    `${url}/profiles?email=eq.${encodeURIComponent(OLD_EMAIL)}&select=*`,
    { headers }
  );
  const profiles = await profileRes.json();
  console.log("=== Profile record(s) found ===");
  console.log(JSON.stringify(profiles, null, 2));

  if (!profiles || profiles.length === 0) {
    console.log("❌ No profile found with that email.");
    return;
  }

  const userId = profiles[0].id;
  console.log(`\n✅ User ID: ${userId}`);

  // 2. Find enrollments
  const enrollRes = await fetch(
    `${url}/enrollments?user_id=eq.${userId}&select=*`,
    { headers }
  );
  const enrollments = await enrollRes.json();
  console.log("\n=== Enrollments ===");
  console.log(JSON.stringify(enrollments, null, 2));

  // 3. Count task completions
  const compRes = await fetch(
    `${url}/task_completions?enrollment_id=in.(${enrollments.map(e => e.id).join(',')})&select=id`,
    { headers }
  );
  const completions = await compRes.json();
  console.log(`\n=== Task Completions: ${completions.length} records ===`);

  console.log(`\n📋 Summary:`);
  console.log(`   User ID       : ${userId}`);
  console.log(`   Email (current): ${OLD_EMAIL}`);
  console.log(`   Enrollments   : ${enrollments.length}`);
  console.log(`   Completions   : ${completions.length}`);
  console.log(`\n✅ All data confirmed. Ready to update email safely.`);
}

findUser().catch(console.error);
