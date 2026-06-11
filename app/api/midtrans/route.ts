import { NextResponse } from "next/server";
import midtransClient from "midtrans-client";

export async function GET() {
  return NextResponse.json({
    status: "OK",
    message: "Midtrans API hidup",
    serverKeyExists: !!process.env.MIDTRANS_SERVER_KEY,
    serverKeyLength:
      process.env.MIDTRANS_SERVER_KEY?.length || 0,
  });
}

    export async function POST(request: Request) {
    try {

    const { userId, email } = await request.json();

    console.log(
      "MIDTRANS KEY:",
      process.env.MIDTRANS_SERVER_KEY
        ? "EXISTS"
        : "MISSING"
    );

    const snap = new midtransClient.Snap({
      isProduction: true,
      serverKey: process.env.MIDTRANS_SERVER_KEY!,
    });

    const transaction =
  await snap.createTransaction({
    transaction_details: {
      order_id: `PRO|${userId}|${Date.now()}`,
      gross_amount: 75000,
    },
    customer_details: {
      email,
    },
  });

    return NextResponse.json({
      token: transaction.token,
      redirect_url:
        transaction.redirect_url,
    });
  } catch (error: any) {
    console.error(
      "MIDTRANS FULL ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: true,
        message:
          error?.message ||
          "Unknown Error",
        details:
          error?.ApiResponse ||
          error,
      },
      {
        status: 500,
      }
    );
  }
}