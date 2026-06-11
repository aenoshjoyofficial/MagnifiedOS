const url = "https://evkkbwulppxazqgprefy.supabase.co/rest/v1";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2a2tid3VscHB4YXpxZ3ByZWZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NDIyNTEsImV4cCI6MjA5NjExODI1MX0.9Q3PIv4T-SLG9LtLreMjjJUW0T9jBaBzYMzWH0HGNpo";

const headers = {
  "apikey": anonKey,
  "Authorization": `Bearer ${anonKey}`,
  "Content-Type": "application/json"
};

async function run() {
  console.log("================= ALL USER PROGRESS RECORDS =================");
  const res = await fetch(`${url}/user_progress?select=*`, { headers });
  const progress = await res.json();
  if (progress.message) {
    console.log(`Error: ${progress.message}`);
  } else {
    console.log(`Total user_progress records in database: ${progress.length}`);
  }
}

run().catch(console.error);
