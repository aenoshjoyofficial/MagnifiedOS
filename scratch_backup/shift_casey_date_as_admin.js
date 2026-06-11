const url = "https://evkkbwulppxazqgprefy.supabase.co";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2a2tid3VscHB4YXpxZ3ByZWZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NDIyNTEsImV4cCI6MjA5NjExODI1MX0.9Q3PIv4T-SLG9LtLreMjjJUW0T9jBaBzYMzWH0HGNpo";

async function run() {
  const email = "diagnostic_admin@example.com";
  const password = "diagnosticAdminPassword123!";

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
  console.log("Login success.");

  const headers = {
    "apikey": anonKey,
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation"
  };

  const caseyUserId = "c09b6f61-949b-4a9a-9b0e-15d2f9e00351";
  console.log(`Fetching active enrollment for Casey (${caseyUserId})...`);
  const enrollRes = await fetch(`${url}/rest/v1/enrollments?user_id=eq.${caseyUserId}&status=eq.active`, { headers });
  const enrollments = await enrollRes.json();
  
  if (enrollments.length === 0) {
    console.error("No active enrollment found for Casey.");
    return;
  }

  const enrollment = enrollments[0];
  console.log(`Active enrollment found: ${enrollment.id}, current started_at: ${enrollment.started_at}`);

  const targetDate = "2026-06-01T09:19:53.043+00:00";
  console.log(`Updating started_at to ${targetDate}...`);

  const updateRes = await fetch(`${url}/rest/v1/enrollments?id=eq.${enrollment.id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      started_at: targetDate
    })
  });

  if (updateRes.ok) {
    const updated = await updateRes.json();
    console.log("SUCCESS! Updated enrollment:", JSON.stringify(updated, null, 2));
  } else {
    console.error(`FAILED to update: status ${updateRes.status}`);
    console.error(await updateRes.text());
  }
}

run().catch(console.error);
