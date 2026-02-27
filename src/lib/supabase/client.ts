import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    // We handle magic-link sessions manually in useAuth to avoid race conditions
    detectSessionInUrl: false,
  },
});

/**
 * Call check_email_has_account via REST with a hard timeout (AbortController).
 * Use this instead of supabase.rpc() when the client's request may hang (e.g. PostgREST/schema cache).
 */
export async function checkEmailHasAccountWithTimeout(
  email: string,
  timeoutMs: number
): Promise<{ data: boolean | null; error: { message: string } | null }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/check_email_has_account`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ check_email: email.trim() }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      const errBody = await res.text();
      let msg = res.statusText;
      try {
        const j = JSON.parse(errBody);
        if (j.message) msg = j.message;
      } catch {
        // ignore
      }
      return { data: null, error: { message: msg } };
    }
    const data = await res.json();
    const value =
      data === true || data === false
        ? data
        : Array.isArray(data) && data.length === 1 && (data[0] === true || data[0] === false)
          ? data[0]
          : null;
    return { data: value, error: null };
  } catch (e) {
    clearTimeout(timeoutId);
    if (e instanceof Error && e.name === "AbortError") {
      return { data: null, error: { message: "Verification timed out." } };
    }
    return {
      data: null,
      error: { message: e instanceof Error ? e.message : "Network error" },
    };
  }
}
