import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createCheckoutSession } from "@/services/billing";
import { getSubscriptionForUser } from "@/db/queries/subscriptions";

export async function POST() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.isAnonymous) {
    return Response.json(
      { error: "Account required", redirect: "/auth" },
      { status: 403 }
    );
  }

  const subscription = await getSubscriptionForUser(session.user.id);

  if (subscription?.tier === "premium" && subscription.status === "active") {
    return Response.json(
      { error: "Already subscribed" },
      { status: 400 }
    );
  }

  try {
    const url = await createCheckoutSession(
      session.user.id,
      session.user.email,
      subscription?.stripeCustomerId
    );
    return Response.json({ url });
  } catch {
    return Response.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
