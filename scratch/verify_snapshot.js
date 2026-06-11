const url = "https://phytcoyaemsehsezbruy.supabase.co";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoeXRjb3lhZW1zZWhzZXpicnV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MDA5NDAsImV4cCI6MjA5MzM3Njk0MH0.fTPenRdec6P_JK5Q1SpyzUUypdr0D6W4v-aH7bw_HU8";

async function run() {
  const email = "tempadmin_1780539018032@gmail.com";
  const password = "tempAdminPassword123!";
  const enrollmentId = "b5561f62-801a-4966-9ee6-75e25116f70c";

  console.log(`🔑 Logging in as ${email}...`);
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
  console.log(`✅ Logged in successfully. User ID: ${userId}`);

  const headers = {
    "apikey": anonKey,
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  };

  // 1. Fetch enrollment details to get started_at, program_id, cycle_number
  console.log("\n🔍 Fetching enrollment details...");
  const enrollRes = await fetch(`${url}/rest/v1/enrollments?id=eq.${enrollmentId}`, {
    headers: { ...headers, "Prefer": "return=representation" }
  });
  const enrollments = await enrollRes.json();
  if (enrollments.length === 0) {
    console.error("Enrollment not found.");
    return;
  }
  const enrollment = enrollments[0];
  console.log(`📌 Active Enrollment: ${enrollment.id}, Program: ${enrollment.program_id}, Cycle: ${enrollment.cycle_number}`);

  // 2. Ensure clean starting state for cycle_history
  console.log("\n🧼 Cleaning existing cycle_history for this enrollment...");
  await fetch(`${url}/rest/v1/cycle_history?enrollment_id=eq.${enrollmentId}`, {
    method: "DELETE",
    headers
  });

  // Reset enrollment status to active if needed
  console.log("Setting enrollment status to active...");
  await fetch(`${url}/rest/v1/enrollments?id=eq.${enrollmentId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ status: "active" })
  });

  // 3. Perform Snapshot insert (simulate query.ts useCompleteEnrollment workflow)
  console.log("\n⚡ Simulating useCompleteEnrollment logic...");
  
  // A. Calculate snapshot metrics
  const cycleNumber = enrollment.cycle_number || 1;
  const totalTasks = 60;
  const tasksCompleted = 45;
  const completionPercentage = Math.round((tasksCompleted / totalTasks) * 100) || 75; // Let's use 75%
  const startedAt = enrollment.started_at || new Date().toISOString();
  const completedAt = new Date().toISOString();

  // B. Step 1: Insert into cycle_history BEFORE status update
  console.log("👉 Step 1: Inserting into cycle_history...");
  const historyInsertRes = await fetch(`${url}/rest/v1/cycle_history`, {
    method: "POST",
    headers: {
      ...headers,
      "Prefer": "return=representation"
    },
    body: JSON.stringify({
      enrollment_id: enrollmentId,
      user_id: userId,
      program_id: enrollment.program_id,
      cycle_number: cycleNumber,
      tasks_completed: tasksCompleted,
      total_tasks: totalTasks,
      completion_percentage: completionPercentage,
      started_at: startedAt,
      completed_at: completedAt
    })
  });

  const historyInsertData = await historyInsertRes.json();
  if (!historyInsertRes.ok) {
    console.error("❌ Failed to insert cycle_history snapshot:", historyInsertData);
    return;
  }
  console.log("✅ cycle_history snapshot inserted successfully.");

  // C. Step 2: Mark enrollment as completed
  console.log("👉 Step 2: Updating enrollment status to completed...");
  const enrollUpdateRes = await fetch(`${url}/rest/v1/enrollments?id=eq.${enrollmentId}`, {
    method: "PATCH",
    headers: {
      ...headers,
      "Prefer": "return=representation"
    },
    body: JSON.stringify({
      status: "completed"
    })
  });

  const enrollUpdateData = await enrollUpdateRes.json();
  if (!enrollUpdateRes.ok) {
    console.error("❌ Failed to update enrollment status:", enrollUpdateData);
    return;
  }
  console.log("✅ Enrollment status updated to completed.");

  // 4. Retrieve cycle_history record and verify
  console.log("\n📊 Querying cycle_history table for verification...");
  const verifyRes = await fetch(`${url}/rest/v1/cycle_history?enrollment_id=eq.${enrollmentId}`, {
    headers: { ...headers, "Prefer": "return=representation" }
  });
  const historyRecords = await verifyRes.json();
  console.log("Results in cycle_history:");
  console.log(JSON.stringify(historyRecords, null, 2));

  // 5. Restore enrollment status back to active for standard use
  console.log("\n🧼 Restoring enrollment status to active...");
  await fetch(`${url}/rest/v1/enrollments?id=eq.${enrollmentId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ status: "active" })
  });

  // Clean up test cycle_history row
  await fetch(`${url}/rest/v1/cycle_history?enrollment_id=eq.${enrollmentId}`, {
    method: "DELETE",
    headers
  });

  console.log("✅ Cleanup complete.");
}

run().catch(console.error);
