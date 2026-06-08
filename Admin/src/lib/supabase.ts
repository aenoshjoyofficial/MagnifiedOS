import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('CRITICAL WARNING: Supabase credentials missing or invalid! Using dummy placeholders to prevent runtime crashes. Check your .env file.');
}

let lockPromise = Promise.resolve();

const memoryLock = async (name: string, acquireTimeout: number, fn: () => Promise<any>) => {
  const currentLock = lockPromise;
  let resolveLock: () => void;
  lockPromise = new Promise((resolve) => {
    resolveLock = resolve;
  });
  try {
    await currentLock;
    return await fn();
  } finally {
    resolveLock!();
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    lock: memoryLock
  }
});


