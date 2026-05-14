import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { Webhook } from "svix";

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET ?? "";
const webhook = new Webhook(webhookSecret);

export async function POST(request: NextRequest) {
  const signature =
    request.headers.get("Svix-Signature") || request.headers.get("svix-signature") || "";
  const payload = await request.text();

  if (!webhookSecret || !signature) {
    return NextResponse.json({ error: "Missing webhook signature or secret" }, { status: 401 });
  }

  let event: any;
  try {
    event = webhook.verify(payload, signature);
  } catch (error) {
    console.error("Clerk webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  if (event.type !== "user.created") {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const userId = event.data?.id ?? event.data?.object?.id;
  if (!userId) {
    return NextResponse.json({ error: "Missing user id in webhook payload" }, { status: 400 });
  }

  try {
    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { role: "driver" },
    });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error updating Clerk user metadata on webhook:", error);
    return NextResponse.json(
      { error: "Unable to update user role", details: String(error) },
      { status: 500 },
    );
  }
}
