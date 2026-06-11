const url = "https://evkkbwulppxazqgprefy.supabase.co/rest/v1";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2a2tid3VscHB4YXpxZ3ByZWZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NDIyNTEsImV4cCI6MjA5NjExODI1MX0.9Q3PIv4T-SLG9LtLreMjjJUW0T9jBaBzYMzWH0HGNpo";

const headers = {
  "apikey": anonKey,
  "Authorization": `Bearer ${anonKey}`,
  "Content-Type": "application/json",
  "Prefer": "return=representation"
};

async function run() {
  const taskId = "ef28859f-df4e-44a0-b7f9-c6708263adf1";
  const updatedContent = {
    url: "https://evkkbwulppxazqgprefy.supabase.co/storage/v1/object/public/program-assets/tasks/chamber-task-mock.mp4",
    text: "Test description text",
    format: "video",
    resource_url: "",
    duration: "15 min",
    steps: []
  };

  console.log(`Attempting to update task ${taskId}...`);
  
  const res = await fetch(`${url}/tasks?id=eq.${taskId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      id: taskId,
      title: "The Frequency Field – Day 5 - (15-20 mins) MODIFIED WITH ID",
      description: "Test description text",
      type: "video",
      content: updatedContent
    })
  });

  console.log("Response status:", res.status);
  const data = await res.json();
  console.log("Response data:", data);
}

run().catch(console.error);
