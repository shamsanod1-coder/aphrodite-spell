import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { anonymous } from "better-auth/plugins/anonymous";
import { magicLink } from "better-auth/plugins/magic-link";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { transferConversations } from "@/db/queries";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  plugins: [
    anonymous({
      onLinkAccount: async ({ anonymousUser, newUser }) => {
        await transferConversations(
          anonymousUser.user.id,
          newUser.user.id
        );
        const { eq } = await import("drizzle-orm");
        await db
          .update(schema.profiles)
          .set({
            isAnonymous: false,
            updatedAt: new Date(),
          })
          .where(eq(schema.profiles.id, anonymousUser.user.id));
      },
    }),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        // TODO: integrate email provider (Resend, SendGrid, etc.)
        console.log(`[DEV] Magic link for ${email}: ${url}`);
      },
    }),
  ],
  user: {
    additionalFields: {
      isAnonymous: {
        type: "boolean",
        defaultValue: false,
        input: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Auto-create profile on user signup
          await db.insert(schema.profiles).values({
            id: user.id,
            isAnonymous: user.isAnonymous === true,
          });
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
