'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const masuk = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Palsu dulu biar langsung masuk
    localStorage.setItem('user', email);
    router.push('/dashboard');
    setLoading(false);
  };

  const daftar = async () => {
    if (!email || !password) return alert('Isi Email & Sandi dulu!');
    setLoading(true);
    // Palsu dulu biar langsung sukses
    alert('✅ Berhasil Daftar! Silakan Masuk.');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Masuk / Daftar Akun</h2>
        <form onSubmit={masuk} className="space-y-4">
          <div>
            <label className="block text-gray-800 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
              required
            />
          </div>
          <div>
            <label className="block text-gray-800 mb-1">Kata Sandi</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            {loading ? 'Memproses...' : 'Masuk Sekarang'}
          </button>
        </form>
        <div className="text-center mt-4">
          <p className="text-gray-800 text-sm">
            Belum punya akun?{' '}
            <button onClick={daftar} disabled={loading} className="text-indigo-600 hover:underline font-medium">
              Daftar Baru
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}