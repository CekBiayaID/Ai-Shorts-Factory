import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  const secret = req.headers.get(
  "x-webhook-secret"
);

if (
  secret !==
  process.env.LEMON_WEBHOOK_SECRET
) {
  return NextResponse.json(
    { error: "Unauthorized" },
    { status: 401 }
  );
}

  try {
    const body = await req.json();

    console.log("LEMON WEBHOOK:", body);

    const event = body.meta?.event_name;
    const email = body.data?.attributes?.user_email;

    if (
      event === "subscription_created" &&
      email
    ) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const { error } = await supabaseAdmin
        .from("profiles")
        .update({
          plan: "pro",
          expires_at: expiresAt.toISOString(),
        })
        .eq("email", email);

      if (error) {
        console.error(error);
      } else {
        console.log(
          "USER UPGRADED TO PRO:",
          email
        );
      }
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: true },
      { status: 500 }
    );
  }
}