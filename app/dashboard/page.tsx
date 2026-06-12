'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from "react-hot-toast"

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
      toast.error('Please Enter Text First!');
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
      toast.error('❌ ' + error.message);
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
      toast.success('✅ Text Copied Successfully');
    } catch {
      toast.error('❌ Failed To Copy Text');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">
            TextRewrite AI
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

      <main className="max-w-5xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Rewrite Text With AI
          </h2>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your text here..."
            className="w-full h-48 border border-gray-300 rounded-xl p-4 text-gray-800"
          />

          <div className="mt-5">
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-3 text-gray-800"
            >
              <option value="formal">Formal</option>
              <option value="santai">Casual</option>
              <option value="ringkas">Short</option>
              <option value="kreatif">Creative</option>
            </select>
          </div>

          <button
            onClick={rewriteText}
            disabled={loading}
            className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-xl"
          >
            {loading ? 'Loading...' : '✨ Rewrite Text'}
          </button>
        </div>

        {outputText && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mt-8">
            <button
              onClick={salinHasil}
              className="bg-green-600 text-white px-4 py-2 rounded-lg mb-4"
            >
              Copy Result
            </button>

            <div className="bg-gray-50 border rounded-xl p-4 whitespace-pre-wrap text-gray-800">
              {outputText}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}