'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  const [teksAsal, setTeksAsal] = useState('');
  const [teksHasil, setTeksHasil] = useState('');
  const [gaya, setGaya] = useState('formal');
  const [loading, setLoading] = useState(false);
  const [sisaKata, setSisaKata] = useState(5000);

  useEffect(() => {
    const user = localStorage.getItem('user');

    if (!user) {
      router.push('/login');
    }
  }, [router]);

  const ubahTeks = async () => {
    if (!teksAsal.trim()) {
      alert('Isi teks dulu!');
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
          text: teksAsal,
          gaya,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal memproses teks');
      }

      setTeksHasil(data.hasil || '');
      setSisaKata((prev) => Math.max(0, prev - teksAsal.length));
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
      await navigator.clipboard.writeText(teksHasil);
      alert('✅ Hasil berhasil disalin');
    } catch {
      alert('❌ Gagal menyalin teks');
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
              Sisa Kata: {sisaKata}
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
            Teks Asal
          </label>

          <textarea
            value={teksAsal}
            onChange={(e) => setTeksAsal(e.target.value)}
            placeholder="Tempel tulisan yang ingin diubah..."
            className="w-full h-48 border border-gray-300 rounded-xl p-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <div className="mt-5">
            <label className="block text-gray-700 font-semibold mb-2">
              Pilih Gaya
            </label>

            <select
              value={gaya}
              onChange={(e) => setGaya(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-3 text-gray-800"
            >
              <option value="formal">Formal / Resmi</option>
              <option value="santai">Santai / Akrab</option>
              <option value="ringkas">Ringkas / Padat</option>
              <option value="kreatif">Kreatif / Menarik</option>
            </select>
          </div>

          <button
            onClick={ubahTeks}
            disabled={loading}
            className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl disabled:bg-gray-400"
          >
            {loading ? 'Sedang Memproses...' : '✨ Ubah Teks Sekarang'}
          </button>
        </div>

        {teksHasil && (
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
              {teksHasil}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}