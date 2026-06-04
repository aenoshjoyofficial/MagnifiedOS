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

  const programId = "7b229e65-375b-44ed-bcff-0e7bbd7ccecb";
  console.log(`Fetching program details for ${programId}...`);
  
  const start = Date.now();
  const res = await fetch(`${url}/rest/v1/programs?id=eq.${programId}&select=*,modules(*,lessons(*,tasks(*)))`, {
    headers
  });

  if (res.ok) {
    const data = await res.json();
    console.log(`SUCCESS in ${Date.now() - start}ms`);
    console.log(`Modules count: ${data[0]?.modules?.length || 0}`);
    let lessonCount = 0;
    let taskCount = 0;
    data[0]?.modules?.forEach(m => {
      lessonCount += m.lessons?.length || 0;
      m.lessons?.forEach(l => {
        taskCount += l.tasks?.length || 0;
      });
    });
    console.log(`Lessons count: ${lessonCount}`);
    console.log(`Tasks count: ${taskCount}`);
  } else {
    console.error(`FAILED: status ${res.status}`);
    console.error(await res.text());
  }
}

run().catch(console.error);
