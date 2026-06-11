const url = "https://phytcoyaemsehsezbruy.supabase.co";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoeXRjb3lhZW1zZWhzZXpicnV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MDA5NDAsImV4cCI6MjA5MzM3Njk0MH0.fTPenRdec6P_JK5Q1SpyzUUypdr0D6W4v-aH7bw_HU8";

async function run() {
  const email = "tempadmin_1780539018032@gmail.com";
  const password = "tempAdminPassword123!";

  console.log(`Logging in as ${email}...`);
  const loginRes = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "apikey": anonKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  const loginData = await loginRes.json();
  if (!loginRes.ok) {
    console.error("Login failed:", loginData);
    return;
  }
  const token = loginData.access_token;
  const userId = loginData.user.id;
  console.log(`Login success. User ID: ${userId}`);

  const headers = {
    "apikey": anonKey,
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation"
  };

  const programId = "7b229e65-375b-44ed-bcff-0e7bbd7ccecb"; // Casey June Protocol
  console.log(`Creating active enrollment for ${email} in program ${programId}...`);

  const enrollRes = await fetch(`${url}/rest/v1/enrollments`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      user_id: userId,
      program_id: programId,
      status: "active",
      started_at: new Date().toISOString()
    })
  });

  const enrollData = await enrollRes.json();
  if (enrollRes.ok) {
    console.log("SUCCESS! Created active enrollment:", JSON.stringify(enrollData, null, 2));
  } else {
    console.error(`FAILED to create enrollment: status ${enrollRes.status}`);
    console.error(JSON.stringify(enrollData, null, 2));
  }
}

run().catch(console.error);
