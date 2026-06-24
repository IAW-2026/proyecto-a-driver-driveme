import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { Webhook } from "svix";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ error: "Missing webhook secret" }, { status: 401 });
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no Svix headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: "Error occurred -- no svix headers" }, { status: 400 });
  }

  const payload = await request.text();

  const webhook = new Webhook(webhookSecret);
  let event: any;

  try {
    event = webhook.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (error) {
    console.error("Clerk webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  if (event.type !== "user.created") {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const userId = event.data?.id;
  if (!userId) {
    return NextResponse.json({ error: "Missing user id in webhook payload" }, { status: 400 });
  }

  try {
    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { role: "driver" },
    });
    console.log(`[Webhook] Role 'driver' successfully assigned to user ${userId}`);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error updating Clerk user metadata on webhook:", error);
    return NextResponse.json(
      { error: "Unable to update user role", details: String(error) },
      { status: 500 },
    );
  }
}
