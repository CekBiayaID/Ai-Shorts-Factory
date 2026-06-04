"use client";

export default function PaymentSuccess() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold">
          Payment Received
        </h1>

        <p className="mt-4 text-gray-400">
          Your payment is being verified.
        </p>

        <p className="mt-2 text-green-400">
          Pro access will be activated automatically.
        </p>
      </div>
    </div>
  );
}