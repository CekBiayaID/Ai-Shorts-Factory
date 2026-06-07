'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
const router = useRouter();

const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [showPassword, setShowPassword] = useState(false);
const [loading, setLoading] = useState(false);
const [errorMsg, setErrorMsg] = useState("");

const signIn = async (e: React.FormEvent) => {
e.preventDefault();

if (!email || !password) {
  setErrorMsg("Please enter your email and password.");
  return;
}

setLoading(true);

const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

console.log("LOGIN DATA:", data);
console.log("LOGIN ERROR:", error);

setLoading(false);

if (error) {
  setErrorMsg("Incorrect email or password");
  return;
}

const {
  data: { session },
} = await supabase.auth.getSession();

console.log('SESSION:', session);

router.push('/');

};

const signUp = async () => {
if (!email || !password) {
setErrorMsg('Please enter your email and password.');
return;
}

setLoading(true);

const { error } = await supabase.auth.signUp({
  email,
  password,
});

const blockedDomains = [
  "mailinator.com",
  "10minutemail.com",
  "guerrillamail.com",
  "tempmail.com",
  "temp-mail.org",
  "yopmail.com",
  "sharklasers.com",
  "maildrop.cc",
  "dispostable.com",
  "fakeinbox.com",
  "trashmail.com",
  "getnada.com",
  "moakt.com",
  "throwawaymail.com",
  "tempail.com",
  "tixpad.com"
  "snocv.com"
];

const domain = email.split("@")[1]?.toLowerCase();

if (blockedDomains.includes(domain)) {
  setErrorMsg("Temporary email addresses are not allowed.");
  return;
}

setLoading(false);

if (error) {
  setErrorMsg('❌ Unable to create account');
  console.error(error);
  return;
}

setErrorMsg('✅ Account created successfully! Please check your email.');

};

return (
<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
<div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
<h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
AI Content Repurposer
</h2>

    <p className="text-center text-gray-500 mb-6">
      Sign In or Create an Account
    </p>

    {errorMsg && (
  <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
    {errorMsg}
  </div>
)}

    <form onSubmit={signIn} className="space-y-4">
      <div>
        <label className="block text-gray-800 mb-1">
          Email Address
        </label>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
          required
        />
      </div>

      <div>
        <label className="block text-gray-800 mb-1">
          Password
        </label>

        <input
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
          required
        />
        <button
  type="button"
  onClick={() => setShowPassword(!showPassword)}
  className="text-gray-800 font-medium mt-1"
>
  {showPassword ? "👁️‍🗨️ Hide Password" : "👁️ Show Password"}
</button>

      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
      >
        {loading ? 'Please Wait...' : 'Sign In'}
      </button>
    </form>

    <div className="text-center mt-5">
      <p className="text-gray-800 text-sm">
        Don't have an account?{' '}
        <button
          onClick={signUp}
          disabled={loading}
          className="text-indigo-600 hover:underline font-medium"
        >
          Sign Up
        </button>
      </p>
    </div>
  </div>
</div>

);
}