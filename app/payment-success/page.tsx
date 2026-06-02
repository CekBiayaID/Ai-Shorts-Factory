"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function PaymentSuccess() {
  const router = useRouter();

  useEffect(() => {
    async function activatePro() {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        console.log("SESSION:", session);
        console.log("SESSION ERROR:", sessionError);

        if (!session?.user) {
          console.log("USER NOT FOUND");
          return;
        }

        console.log("USER ID:", session.user.id);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        const result = await supabase
          .from("profiles")
          .update({
            plan: "pro",
            expires_at: expiresAt.toISOString(),
          })
          .eq("id", session.user.id)
          .select();

        console.log("UPDATE DATA:", result.data);
        console.log("UPDATE ERROR:", result.error);
        console.log("FULL UPDATE RESULT:", result);

        if (!result.error) {
          console.log("PRO PLAN ACTIVATED");
        }

        setTimeout(() => {
          router.push("/");
        }, 3000);
      } catch (error) {
        console.error("ACTIVATE PRO ERROR:", error);
      }
    }

    activatePro();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold">
          Payment Successful
        </h1>

        <p className="mt-4 text-gray-400">
          Activating your Pro plan...
        </p>

        <p className="mt-2 text-green-400">
          Redirecting to homepage...
        </p>
      </div>
    </div>
  );
}