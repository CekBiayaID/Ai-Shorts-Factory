"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function PricingPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState("");

  async function bayar() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.push("/login");
      return;
    }

    try {
      setErrorMsg("");

      const res = await fetch("/api/midtrans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: session.user.email,
        }),
      });

      const data = await res.json();

      if (data.redirect_url) {
        window.open(data.redirect_url, "_blank");
        return;
      }

      setErrorMsg(
        data.details ||
          data.error ||
          "Failed to create transaction"
      );
    } catch (err) {
      console.error("PAYMENT ERROR:", err);
      setErrorMsg("An error occurred");
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <button
        onClick={() => history.back()}
        className="mb-6 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg"
      >
        ← Back
      </button>

      <h1 className="text-5xl font-bold text-center mb-4">
        Choose Your Plan
      </h1>

      <p className="text-center text-gray-400 mb-12">
        Unlock more AI generations and premium features.
      </p>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h2 className="text-2xl font-bold">
            Free
          </h2>

          <p className="text-5xl font-bold mt-4">
            $0
          </p>

          <p className="text-gray-400 mt-2">
            Forever Free
          </p>

          <ul className="mt-6 space-y-3">
            <li>✓ 3 Generations Per Day</li>
            <li>✓ No PDF</li>
            <li>✓ No DOCX</li>
          </ul>

          <button className="w-full mt-8 bg-gray-700 hover:bg-gray-600 py-3 rounded-lg font-semibold">
            Current Plan
          </button>
        </div>

        <div className="bg-blue-600 p-6 rounded-xl border border-blue-400">
          <h2 className="text-2xl font-bold">
            Pro
          </h2>

          <p className="text-5xl font-bold mt-4">
            $5
          </p>

          <p className="mt-2">
            Per Month
          </p>

          <div className="mt-4 text-sm">
            <p>
              AI Content Repurposer Pro helps creators transform:
            </p>

            <ul className="mt-2 space-y-1">
              <li>✓ YouTube Video → Shorts</li>
              <li>✓ Blog → Social Content</li>
              <li>✓ Podcast → Viral Posts</li>
              <li>✓ TikTok Repurposing</li>
              <li>✓ Viral Titles & Hashtags</li>
              <li>✓ Content Ideas Generator</li>
            </ul>
          </div>

          <ul className="mt-6 space-y-3">
            <li>✓ 100 Generations Per Day</li>
            <li>✓ PDF Export</li>
            <li>✓ DOCX Export</li>
            <li>✓ Priority Support</li>
            <li>✓ Monthly Subscription</li>
          </ul>

          {errorMsg && (
            <div className="mt-4 mb-2 bg-red-500/20 border border-red-300 text-white p-3 rounded-lg text-sm">
              {errorMsg}
            </div>
          )}

          <button
            onClick={async () => {
              const {
                data: { session },
              } = await supabase.auth.getSession();

              if (!session) {
                router.push("/login");
                return;
              }

              window.open(
                "https://indopanjayautama.lemonsqueezy.com/checkout/buy/f90ccb6a-a556-41b0-97f0-1ce21ae19984"
              );
            }}
            className="w-full mt-3 bg-white text-blue-700 hover:bg-gray-200 py-3 rounded-lg font-semibold"
          >
            Pay with Card/PayPal
          </button>

          <button
            onClick={bayar}
            className="w-full mt-3 bg-green-600 hover:bg-green-700 py-3 rounded-lg font-semibold"
          >
            Pay with QRIS/E-Wallet
          </button>
        </div>

      </div>
    </div>
  );
}