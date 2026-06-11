const url = "https://phytcoyaemsehsezbruy.supabase.co/rest/v1";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoeXRjb3lhZW1zZWhzZXpicnV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MDA5NDAsImV4cCI6MjA5MzM3Njk0MH0.fTPenRdec6P_JK5Q1SpyzUUypdr0D6W4v-aH7bw_HU8";

async function run() {
  const email = "tempadmin_1780539018032@gmail.com";
  const password = "tempAdminPassword123!";

  console.log(`Logging in as ${email}...`);
  const loginRes = await fetch("https://phytcoyaemsehsezbruy.supabase.co/auth/v1/token?grant_type=password", {
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
    "Content-Type": "application/json"
  };

  console.log("Fetching own profile...");
  const res = await fetch(`${url}/profiles?id=eq.${userId}`, {
    method: "GET",
    headers
  });

  if (res.ok) {
    const data = await res.json();
    console.log("Profile row returned:", data);
  } else {
    console.error("Profile fetch failed:", res.status);
    console.error(await res.text());
  }
}

run().catch(console.error);
