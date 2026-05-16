import { createClient } from "@/lib/supabase/client";

export async function signInAnonymously() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return data;
}

export async function signInWithMagicLink(email: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) throw error;
  return data;
}

export async function linkEmailToAnonymousUser(email: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.updateUser({
    email,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const supabase = createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

export async function getUser() {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}
