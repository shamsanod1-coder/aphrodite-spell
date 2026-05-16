import { authClient, signIn, signOut as authSignOut } from "@/lib/auth-client";

export async function signInAnonymously() {
  const result = await signIn.anonymous();
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

export async function signInWithMagicLink(email: string) {
  const result = await signIn.magicLink({ email });
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

export async function linkEmailToAnonymousUser(email: string) {
  const result = await signIn.magicLink({
    email,
    callbackURL: "/chat",
  });
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

export async function signOut() {
  const result = await authSignOut();
  if (result.error) throw new Error(result.error.message);
}

export async function getSession() {
  const result = await authClient.getSession();
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

export async function getUser() {
  const result = await authClient.getSession();
  if (result.error) throw new Error(result.error.message);
  return result.data?.user ?? null;
}
