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

if (error) {
  setLoading(false);
  setErrorMsg("Incorrect email or password");
  return;
}

const {
  data: { session },
} = await supabase.auth.getSession();

if (!session?.user) {
  setLoading(false);
  setErrorMsg("Session not found.");
  return;
}

console.log('SESSION:', session);

const { data: profile } = await supabase
  .from("profiles")
  .select("device_id")
  .eq("id", session.user.id)
  .single();

const deviceId = getDeviceId();

if (profile?.device_id) {
  if (profile.device_id !== deviceId) {
    await supabase.auth.signOut();
setLoading(false);
    setErrorMsg(
      "This account is already being used on another device."
    );

    return;
  }
} else {
  await supabase
    .from("profiles")
    .update({
      device_id: deviceId,
    })
    .eq("id", session.user.id);
}
setLoading(false);
router.push('/');

};

const getDeviceId = () => {
let deviceId = localStorage.getItem("device_id");

if (!deviceId) {
deviceId = crypto.randomUUID();
localStorage.setItem("device_id", deviceId);
}

return deviceId;
};

const signUp = async () => {
if (!email || !password) {
setErrorMsg('Please enter your email and password.');
return;
}

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
];

const domain = email.split("@")[1]?.toLowerCase();

if (blockedDomains.includes(domain)) {
setErrorMsg("Temporary email addresses are not allowed.");
return;
}

setLoading(true);

const { error } = await supabase.auth.signUp({
email,
password,
});

if (error) {
  setLoading(false);
  setErrorMsg('❌ Unable to create account');
  console.error(error);
  return;
}
setLoading(false);
setErrorMsg('✅ Account created successfully! Please check your email.');

};

const forgotPassword = async () => {
  if (!email) {
    setErrorMsg("Please enter your email address first.");
    return;
  }

  setLoading(true);

  const { error } =
    await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo:
          `${window.location.origin}/reset-password`,
      }
    );

  setLoading(false);

  if (error) {
    setErrorMsg(error.message);
    return;
  }

  setErrorMsg(
    "✅ Password reset link has been sent to your email."
  );
};

return (
<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
<div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
<h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
Repurposer Content
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
      <button
    type="button"
    onClick={forgotPassword}
    className="mt-3 text-sm text-indigo-600 hover:underline"
  >
    Forgot Password?
  </button>
    </div>
  </div>
</div>

);
}