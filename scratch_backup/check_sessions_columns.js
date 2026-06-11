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

  console.log("Inserting session with title and scheduled_at...");
  const insertRes = await fetch(`${url}/rest/v1/sessions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      title: "Test Session",
      scheduled_at: "2026-06-09T12:00:00Z"
    })
  });

  const insertData = await insertRes.json();
  console.log("Insert Response Status:", insertRes.status);
  console.log("Insert Response Data:", JSON.stringify(insertData, null, 2));

  // Clean up
  if (insertRes.ok && insertData && insertData.length > 0) {
    const createdId = insertData[0].id;
    console.log(`Cleaning up session: ${createdId}`);
    await fetch(`${url}/rest/v1/sessions?id=eq.${createdId}`, {
      method: "DELETE",
      headers
    });
    console.log("Cleanup done.");
  }
}

run().catch(console.error);
