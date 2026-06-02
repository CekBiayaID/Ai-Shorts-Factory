import { NextResponse } from "next/server";
import midtransClient from "midtrans-client";

export async function GET() {
  return NextResponse.json({
    status: "OK",
    message: "Midtrans API hidup",
    serverKeyExists: !!process.env.MIDTRANS_SERVER_KEY,
  });
}

export async function POST() {
  try {
    // Debug env
    if (!process.env.MIDTRANS_SERVER_KEY) {
      return NextResponse.json(
        {
          error: "MIDTRANS_SERVER_KEY not found",
        },
        {
          status: 500,
        }
      );
    }

    const snap = new midtransClient.Snap({
      isProduction: false, // Sandbox dulu untuk testing
      serverKey: process.env.MIDTRANS_SERVER_KEY,
    });

    const parameter = {
      transaction_details: {
        order_id: `ORDER-${Date.now()}`,
        gross_amount: 75000,
      },
      customer_details: {
        first_name: "Customer",
        email: "customer@example.com",
      },
    };

    const transaction = await snap.createTransaction(parameter);

    return NextResponse.json({
      success: true,
      token: transaction.token,
      redirect_url: transaction.redirect_url,
    });
  } catch (error: any) {
    console.error("MIDTRANS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Unknown error",
        raw: error,
      },
      {
        status: 500,
      }
    );
  }
}