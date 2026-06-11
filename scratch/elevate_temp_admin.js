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
  console.log("Login success.");

  console.log("Updating user metadata to set role as admin...");
  const updateRes = await fetch(`${url}/auth/v1/user`, {
    method: "PUT",
    headers: {
      "apikey": anonKey,
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      data: {
        role: "admin",
        full_name: "Temp Seeding Admin"
      }
    })
  });

  const updateData = await updateRes.json();
  if (updateRes.ok) {
    console.log("SUCCESS! User metadata updated:", JSON.stringify(updateData.user_metadata, null, 2));
  } else {
    console.error("FAILED to update user metadata:", updateData);
  }
}

run().catch(console.error);
