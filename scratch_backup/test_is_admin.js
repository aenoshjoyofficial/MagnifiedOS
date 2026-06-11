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
  const token = loginData.access_token;
  console.log("Login success.");

  const headers = {
    "apikey": anonKey,
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  };

  console.log("Calling rpc is_admin...");
  const res = await fetch(`${url}/rest/v1/rpc/is_admin`, {
    method: "POST",
    headers
  });

  if (res.ok) {
    const data = await res.json();
    console.log("is_admin() returned:", data);
  } else {
    console.error("is_admin() RPC call failed:", res.status);
    console.error(await res.text());
  }
}

run().catch(console.error);
