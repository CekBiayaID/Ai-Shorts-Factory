import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log("MIDTRANS WEBHOOK:", body);

    const transactionStatus =
      body.transaction_status;

    const fraudStatus =
      body.fraud_status;

    const orderId =
      body.order_id || "";

    if (
      transactionStatus !== "settlement" &&
      transactionStatus !== "capture"
    ) {
      return NextResponse.json({
        success: true,
        ignored: true,
      });
    }

    if (
      transactionStatus === "capture" &&
      fraudStatus !== "accept"
    ) {
      return NextResponse.json({
        success: true,
        ignored: true,
      });
    }

    const parts = orderId.split("|");

    if (parts.length < 2) {
      return NextResponse.json(
        {
          error: true,
          message: "Invalid order id",
        },
        {
          status: 400,
        }
      );
    }

    const userId = parts[1];

    const expiresAt = new Date();
    expiresAt.setDate(
      expiresAt.getDate() + 30
    );

    const { error } =
      await supabaseAdmin
        .from("profiles")
        .update({
          plan: "pro",
          expires_at:
            expiresAt.toISOString(),
        })
        .eq("id", userId);

    if (error) {
      console.error(error);

      return NextResponse.json(
        {
          error: true,
          message: error.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      userId,
    });
  } catch (error: any) {
    console.error(
      "WEBHOOK ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: true,
        message:
          error?.message ||
          "Unknown Error",
      },
      {
        status: 500,
      }
    );
  }
}