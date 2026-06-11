const url = "https://evkkbwulppxazqgprefy.supabase.co/rest/v1";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2a2tid3VscHB4YXpxZ3ByZWZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NDIyNTEsImV4cCI6MjA5NjExODI1MX0.9Q3PIv4T-SLG9LtLreMjjJUW0T9jBaBzYMzWH0HGNpo";

const headers = {
  "apikey": anonKey,
  "Authorization": `Bearer ${anonKey}`,
  "Content-Type": "application/json"
};

async function run() {
  console.log("================= PROD READ-ONLY DIAGNOSTIC REPORT =================");

  const caseyId = "c09b6f61-949b-4a9a-9b0e-15d2f9e00351";
  console.log(`\n1. Fetching profile for Casey by ID ${caseyId}...`);
  const profileRes = await fetch(`${url}/profiles?id=eq.${caseyId}&select=*`, { headers });
  const profiles = await profileRes.json();
  console.log("Profile found:", JSON.stringify(profiles, null, 2));

  if (profiles.length === 0) {
    console.log("No profile found with that ID.");
    return;
  }

  const profile = profiles[0];
  const userId = profile.id;

  // 2. Fetch all enrollments for this profile
  console.log(`\nFetching enrollments...`);
  const enrollRes = await fetch(`${url}/enrollments?user_id=eq.${userId}&select=*&order=started_at.desc`, { headers });
  const enrollments = await enrollRes.json();
  console.log(`Found ${enrollments.length} enrollments:`);
  
  const enrollIds = enrollments.map(e => e.id);
  if (enrollIds.length > 0) {
    console.log(`\nFetching task completions for all enrollments...`);
    const completionsRes = await fetch(`${url}/task_completions?enrollment_id=in.(${enrollIds.join(',')})&select=*`, { headers });
    const completions = await completionsRes.json();
    console.log("Completions Response raw:", JSON.stringify(completions, null, 2));
  }
}

run().catch(console.error);
