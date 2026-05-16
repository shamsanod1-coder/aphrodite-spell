import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createPortalSession } from "@/services/billing";
import { getSubscriptionForUser } from "@/db/queries/subscriptions";

export async function POST() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await getSubscriptionForUser(session.user.id);

  if (!subscription?.stripeCustomerId) {
    return Response.json(
      { error: "No subscription found" },
      { status: 404 }
    );
  }

  try {
    const url = await createPortalSession(subscription.stripeCustomerId);
    return Response.json({ url });
  } catch {
    return Response.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  }
}
