'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [Style, setStyle] = useState('formal');
  const [loading, setLoading] = useState(false);
  const [RemainingWords, setRemainingWords] = useState(5000);

  useEffect(() => {
    const user = localStorage.getItem('user');

    if (!user) {
      router.push('/login');
    }
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
          Style,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Cannot Process');
      }

      setOutputText(data.hasil || '');
      setRemainingWords((prev) => Math.max(0, prev - inputText.length));
    } catch (error: any) {
      alert('❌ ' + error.message);
    }

    setLoading(false);
  };

  const keluar = () => {
    localStorage.removeItem('user');
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
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">
            TextRewrite AI
          </h1>

          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-gray-700">
              Remaining Words: {RemainingWords}
            </span>

            <button
              onClick={keluar}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
            >
              Keluar
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Ubah Gaya Tulisan Dengan AI
          </h2>

          <label className="block text-gray-700 font-semibold mb-2">
            input Text
          </label>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Tempel tulisan yang ingin diubah..."
            className="w-full h-48 border border-gray-300 rounded-xl p-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <div className="mt-5">
            <label className="block text-gray-700 font-semibold mb-2">
              Pilih Gaya
            </label>

            <select
              value={Style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-3 text-gray-800"
            >
              <option value="formal">Formal / Resmi</option>
              <option value="santai">Santai / Akrab</option>
              <option value="ringkas">Ringkas / Padat</option>
              <option value="kreatif">Kreatif / Menarik</option>
            </select>
          </div>

          <button
            onClick={rewriteText}
            disabled={loading}
            className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl disabled:bg-gray-400"
          >
            {loading ? 'Loading...' : '✨ Change Text Now'}
          </button>
        </div>

        {outputText && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                Hasil Perubahan
              </h3>

              <button
                onClick={salinHasil}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              >
                Salin
              </button>
            </div>

            <div className="bg-gray-50 border rounded-xl p-4 whitespace-pre-wrap text-gray-800">
              {outputText}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}