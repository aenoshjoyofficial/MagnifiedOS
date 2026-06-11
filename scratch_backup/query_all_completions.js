const url = "https://evkkbwulppxazqgprefy.supabase.co/rest/v1";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2a2tid3VscHB4YXpxZ3ByZWZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NDIyNTEsImV4cCI6MjA5NjExODI1MX0.9Q3PIv4T-SLG9LtLreMjjJUW0T9jBaBzYMzWH0HGNpo";

const headers = {
  "apikey": anonKey,
  "Authorization": `Bearer ${anonKey}`,
  "Content-Type": "application/json"
};

async function run() {
  console.log("================= ALL TASK COMPLETIONS =================");
  const res = await fetch(`${url}/task_completions?select=*,enrollments(user_id,profiles(email,full_name))`, { headers });
  const completions = await res.json();
  console.log(`Total completions in database: ${completions.length}`);
  if (completions.length > 0) {
    completions.forEach(c => {
      console.log(`- EnrollmentID: ${c.enrollment_id} | User: ${c.enrollments?.profiles?.email || 'Unknown'} | TaskID: ${c.task_id} | CompletedAt: ${c.completed_at}`);
    });
  }
}

run().catch(console.error);
