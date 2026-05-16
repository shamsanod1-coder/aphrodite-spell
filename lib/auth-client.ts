import { createAuthClient } from "better-auth/react";
import { anonymousClient } from "better-auth/client/plugins";
import { magicLinkClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [anonymousClient(), magicLinkClient()],
});

export const {
  signIn,
  signOut,
  useSession,
} = authClient;
