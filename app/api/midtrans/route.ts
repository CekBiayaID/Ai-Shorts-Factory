import { NextResponse } from "next/server";
import midtransClient from "midtrans-client";

export async function GET() {
  return NextResponse.json({
    status: "OK",
    message: "Midtrans API hidup",
  });
}

export async function POST() {
  try {
    console.log(
      "SERVER KEY:",
      process.env.MIDTRANS_SERVER_KEY
    );

    const snap = new midtransClient.Snap({
      isProduction: true,
      serverKey: process.env.MIDTRANS_SERVER_KEY!,
    });

    const parameter = {
      transaction_details: {
        order_id: "ORDER-" + Date.now(),
        gross_amount: 75000,
      },
      customer_details: {
        first_name: "Customer",
        email: "customer@example.com",
      },
    };

    const transaction =
      await snap.createTransaction(parameter);

    return NextResponse.json({
      token: transaction.token,
      redirect_url: transaction.redirect_url,
    });
  } catch (error: any) {
    console.log(
      "MIDTRANS ERROR:",
      JSON.stringify(error, null, 2)
    );

    return NextResponse.json(
      {
        error: "Failed to create transaction",
        details:
          error?.ApiResponse?.error_messages ||
          error?.message ||
          error,
      },
      {
        status: 500,
      }
    );
  }
}