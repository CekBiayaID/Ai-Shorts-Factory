'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function DashboardPage() {
  
  const router = useRouter();

  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [style, setStyle] = useState('formal');
  const [loading, setLoading] = useState(false);
  const [remainingWords, setRemainingWords] = useState(5000);

  const [plan, setPlan] = useState('FREE');
  const [expiresAt, setExpiresAt] = useState('');

  useEffect(() => {
    const cekUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      console.log('PROFILE RESULT:', profile);
      console.log('PROFILE ERROR:', error);

      if (!profile) return;

      if (
        profile.plan === 'pro' &&
        profile.expires_at &&
        new Date(profile.expires_at) < new Date()
      ) {
        await supabase
          .from('profiles')
          .update({
            plan: 'free',
            expires_at: null,
          })
          .eq('id', session.user.id);

        setPlan('FREE');
        setExpiresAt('');
      } else {
        setPlan(profile.plan?.toUpperCase() || 'FREE');
        setExpiresAt(profile.expires_at || '');
      }
    };

    cekUser();
  }, [router]);

  const rewriteText = async () => {
    if (!inputText.trim()) {
      alert('Please Enter Text First!');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/rewrite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText,
          style,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Cannot Process');
      }

      setOutputText(data.hasil || '');

      setRemainingWords((prev) =>
        Math.max(0, prev - inputText.length)
      );
    } catch (error: any) {
      alert('❌ ' + error.message);
    }

    setLoading(false);
  };

  const keluar = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const salinHasil = async () => {
    try {
      await navigator.clipboard.writeText(outputText);
      alert('✅ Text Copied Successfully');
    } catch {
      alert('❌ Failed To Copy Text');
    }
  };

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <nav className="border-b border-gray-800 bg-[#050816]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">
            AI Content Repurposer
          </h1>

          <div className="flex items-center gap-4">
            {plan === 'PRO' ? (
              <div className="bg-green-500/10 border border-green-500 rounded-xl px-3 py-1">
                <div className="text-green-500 font-bold">
                  ⭐ PRO ACTIVE
                </div>

                {expiresAt && (
                  <div className="text-yellow-600 text-xs font-semibold">
                    {Math.max(
                      0,
                      Math.ceil(
                        (new Date(expiresAt).getTime() - Date.now()) /
                          (1000 * 60 * 60 * 24)
                      )
                    )}{' '}
                    Days Left
                  </div>
                )}
              </div>
            ) : (
              <span className="font-bold text-gray-500">
                FREE
              </span>
            )}

            <span className="text-sm font-semibold text-gray-700">
              Remaining Words: {remainingWords}
            </span>

            <button
              onClick={keluar}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6">

  <div className="mb-8">
    <h1 className="text-5xl font-bold text-white">
      Repurpose Any Content Into
      <span className="text-purple-500">
        {' '}Viral Posts
      </span>
      {' '}Instantly
    </h1>

    <p className="text-gray-400 mt-4 text-lg">
      Paste your content once. Get multiple platform-ready content in seconds.
    </p>
  </div>

  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">

    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
      YouTube Shorts
    </div>

    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
      TikTok Scripts
    </div>

    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
      Instagram
    </div>

    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
      X Threads
    </div>

    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
      LinkedIn
    </div>

    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
      Hashtags
    </div>

    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
      Calendar
    </div>

  </div>

  <div className="grid lg:grid-cols-3 gap-6">

    <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-3xl p-6">

      <h2 className="text-xl font-bold mb-4 text-white">
        Paste Your Content
      </h2>

      <textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Paste any content here..."
        className="w-full h-[350px] bg-gray-950 border border-gray-700 rounded-2xl p-4 text-white"
      />

      <div className="grid md:grid-cols-2 gap-4 mt-5">

        <select
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          className="bg-gray-950 border border-gray-700 rounded-xl p-3 text-white"
        >
          <option value="formal">Formal</option>
          <option value="santai">Casual</option>
          <option value="ringkas">Short</option>
          <option value="kreatif">Creative</option>
        </select>

        <button
          onClick={rewriteText}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-xl font-bold"
        >
          {loading ? 'Loading...' : 'Generate Content'}
        </button>

      </div>

    </div>

    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6">

      <h2 className="text-xl font-bold text-white mb-4">
        Account
      </h2>

      <div className="space-y-3">

        <div className="bg-gray-950 border border-gray-700 rounded-xl p-3">
          Plan: {plan}
        </div>

        <div className="bg-gray-950 border border-gray-700 rounded-xl p-3">
          Remaining Words: {remainingWords}
        </div>

        {expiresAt && (
          <div className="bg-gray-950 border border-gray-700 rounded-xl p-3">
            Expires: {expiresAt}
          </div>
        )}

      </div>

    </div>

  </div>

  {outputText && (
    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 mt-6">

      <button
        onClick={salinHasil}
        className="bg-green-600 text-white px-4 py-2 rounded-xl mb-4"
      >
        Copy Result
      </button>

      <div className="bg-gray-950 border border-gray-700 rounded-2xl p-4 whitespace-pre-wrap text-white">
        {outputText}
      </div>

    </div>
  )}

</main>
    </div>
  );
}