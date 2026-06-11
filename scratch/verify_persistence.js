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

  // 1. Fetch a task ID from Casey June Protocol program
  console.log("\n🔍 Fetching a task from the program...");
  const taskRes = await fetch(`${url}/rest/v1/tasks?limit=1`, { 
    headers: { ...headers, "Prefer": "return=representation" } 
  });
  const tasks = await taskRes.json();
  if (tasks.length === 0) {
    console.error("No tasks found in database.");
    return;
  }
  const taskId = tasks[0].id;
  const taskTitle = tasks[0].title;
  console.log(`📌 Selected Task: "${taskTitle}" (ID: ${taskId})`);

  // Helper to query row counts
  async function getCounts() {
    const compRes = await fetch(`${url}/rest/v1/task_completions?enrollment_id=eq.${enrollmentId}`, { 
      headers: { ...headers, "Prefer": "return=representation" } 
    });
    const completions = await compRes.json();
    
    const progressRes = await fetch(`${url}/rest/v1/user_progress?user_id=eq.${userId}`, { 
      headers: { ...headers, "Prefer": "return=representation" } 
    });
    const progress = await progressRes.json();
    
    return {
      completionsCount: completions.length,
      progressCount: progress.length,
      completionsList: completions,
      progressList: progress
    };
  }

  // Ensure clean starting state
  await fetch(`${url}/rest/v1/task_completions?enrollment_id=eq.${enrollmentId}`, {
    method: "DELETE",
    headers
  });
  await fetch(`${url}/rest/v1/user_progress?user_id=eq.${userId}`, {
    method: "DELETE",
    headers
  });

  // 2. Query initial counts (should be 0)
  console.log("\n📊 Querying initial database state...");
  let state = await getCounts();
  console.log(`- task_completions rows for this enrollment: ${state.completionsCount}`);
  console.log(`- user_progress rows for this user: ${state.progressCount}`);

  // 3. Complete the task once (simulate useCompleteTask)
  console.log("\n⚡ Completing task (First click/insertion)...");
  
  // Insert completion
  const compInsert = await fetch(`${url}/rest/v1/task_completions`, {
    method: "POST",
    headers: {
      ...headers,
      "Prefer": "return=representation"
    },
    body: JSON.stringify({
      enrollment_id: enrollmentId,
      task_id: taskId,
      completed_at: new Date().toISOString()
    })
  });
  
  const compInsertData = await compInsert.json();
  if (!compInsert.ok && compInsertData.code !== '23505') {
    console.error("Failed to insert completion:", compInsertData);
  } else {
    console.log("✅ Completion insert completed successfully.");
  }

  // Upsert progress (using on_conflict parameter)
  const progressUpsert = await fetch(`${url}/rest/v1/user_progress?on_conflict=user_id,task_id`, {
    method: "POST",
    headers: {
      ...headers,
      "Prefer": "return=representation,resolution=merge-duplicates"
    },
    body: JSON.stringify({
      user_id: userId,
      task_id: taskId,
      status: "completed",
      completion_percentage: 100,
      completed_at: new Date().toISOString(),
      last_accessed_at: new Date().toISOString()
    })
  });
  
  const progressUpsertData = await progressUpsert.json();
  if (!progressUpsert.ok) {
    console.error("Failed to upsert progress:", progressUpsertData);
  } else {
    console.log("✅ Progress upsert completed successfully.");
  }

  // Verify counts after first click
  console.log("\n📊 Querying database state after first click...");
  state = await getCounts();
  console.log(`- task_completions rows: ${state.completionsCount}`);
  console.log(`- user_progress rows: ${state.progressCount}`);

  // 4. Try duplicate completion (simulate double-click)
  console.log("\n⚡ Simulating duplicate completion (Second click/insertion)...");
  
  // Insert completion duplicate
  const compInsert2 = await fetch(`${url}/rest/v1/task_completions`, {
    method: "POST",
    headers: {
      ...headers,
      "Prefer": "return=representation"
    },
    body: JSON.stringify({
      enrollment_id: enrollmentId,
      task_id: taskId,
      completed_at: new Date().toISOString()
    })
  });
  
  const compInsertData2 = await compInsert2.json();
  if (!compInsert2.ok) {
    if (compInsertData2.code === '23505') {
      console.log("✅ Caught duplicate constraint error 23505 successfully.");
    } else {
      console.error("Failed to insert duplicate completion with unexpected error:", compInsertData2);
    }
  } else {
    console.log("Warning: Duplicate insert succeeded without throwing (PostgREST resolution rules).");
  }

  // Upsert progress duplicate
  const progressUpsert2 = await fetch(`${url}/rest/v1/user_progress?on_conflict=user_id,task_id`, {
    method: "POST",
    headers: {
      ...headers,
      "Prefer": "return=representation,resolution=merge-duplicates"
    },
    body: JSON.stringify({
      user_id: userId,
      task_id: taskId,
      status: "completed",
      completion_percentage: 100,
      completed_at: new Date().toISOString(),
      last_accessed_at: new Date().toISOString()
    })
  });
  
  const progressUpsertData2 = await progressUpsert2.json();
  if (!progressUpsert2.ok) {
    console.error("Failed to upsert duplicate progress:", progressUpsertData2);
  } else {
    console.log("✅ Progress duplicate upsert completed successfully.");
  }

  // Verify counts after duplicate click
  console.log("\n📊 Querying database state after duplicate click...");
  state = await getCounts();
  console.log(`- task_completions rows: ${state.completionsCount}`);
  console.log(`- user_progress rows: ${state.progressCount}`);

  // CLEANUP
  console.log("\n🧼 Cleaning up test records from database...");
  await fetch(`${url}/rest/v1/task_completions?enrollment_id=eq.${enrollmentId}`, {
    method: "DELETE",
    headers
  });
  await fetch(`${url}/rest/v1/user_progress?user_id=eq.${userId}`, {
    method: "DELETE",
    headers
  });
  console.log("✅ Cleanup complete.");
}

run().catch(console.error);
