import { AppState } from "react-native";
import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

// Masukkan URL dan Anon Key Supabase kamu di sini (Bukan Service Role Key!)
const SUPABASE_URL = "https://jhaabnhsgsqdfnexzoxs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoYWFibmhzZ3NxZGZuZXh6b3hzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzg5NzcyMCwiZXhwIjoyMDczNDczNzIwfQ.Q9M9HpOOxxcnxVXPZYMMo5DSZUoDY8K-bTXDPbqxwQA";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Helper agar auth state sinkron dengan status aplikasi
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});