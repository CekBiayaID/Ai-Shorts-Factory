"use client";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-5xl font-bold text-center mb-4">
        Choose Your Plan
      </h1>

      <p className="text-center text-gray-400 mb-12">
        Create viral content faster with AI-powered tools.
      </p>

      <div className="grid md:grid-cols-3 gap-6">

        {/* Free */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h2 className="text-2xl font-bold">Free</h2>

          <p className="text-5xl font-bold mt-4">
            $0
          </p>

          <p className="text-gray-400 mt-2">
            Forever Free
          </p>

          <ul className="mt-6 space-y-3">
            <li>✓ 5 Generations / Day</li>
            <li>✓ Basic AI Tools</li>
          </ul>

          <button className="w-full mt-8 bg-gray-700 hover:bg-gray-600 py-3 rounded-lg font-semibold">
            Get Started
          </button>
        </div>

        {/* Pro */}
        <div className="bg-blue-600 p-6 rounded-xl border border-blue-400">
          <h2 className="text-2xl font-bold">Pro</h2>

          <p className="text-5xl font-bold mt-4">
            $4.99
          </p>

          <p className="mt-2">
            per month
          </p>

          <ul className="mt-6 space-y-3">
            <li>✓ 100 Generations / Day</li>
            <li>✓ PDF Export</li>
            <li>✓ DOCX Export</li>
            <li>✓ Priority Support</li>
          </ul>

          <button className="w-full mt-8 bg-white text-blue-700 hover:bg-gray-200 py-3 rounded-lg font-semibold">
            Upgrade to Pro
          </button>
        </div>

        {/* Unlimited */}
        <div className="bg-yellow-400 text-black p-6 rounded-xl border border-yellow-300">
          <h2 className="text-2xl font-bold">Unlimited</h2>

          <p className="text-5xl font-bold mt-4">
            $9.99
          </p>

          <p className="mt-2">
            per month
          </p>

          <ul className="mt-6 space-y-3">
            <li>✓ Unlimited Generations</li>
            <li>✓ All Premium Features</li>
            <li>✓ PDF Export</li>
            <li>✓ DOCX Export</li>
            <li>✓ Priority Support</li>
          </ul>

          <button className="w-full mt-8 bg-black text-white hover:bg-gray-800 py-3 rounded-lg font-semibold">
            Go Unlimited
          </button>
        </div>

      </div>
    </div>
  );
}