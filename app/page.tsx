'use client';

import { jsPDF } from 'jspdf';
import {
  Document,
  Packer,
  Paragraph
} from 'docx';
import { saveAs } from 'file-saver';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase'

type HistoryItem = {
  id: number;
  topic: string;
  result: string;
  createdAt: string;
};

export default function HomePage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [plan, setPlan] = useState('free')
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
const [darkMode, setDarkMode] = useState(true);
const [search, setSearch] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [controller, setController] = useState<AbortController | null>(null);
  const [dailyLimit, setDailyLimit] = useState(3);
  const [usedToday, setUsedToday] = useState(0);
  const [expiresAt, setExpiresAt] = useState("")

  useEffect(() => {
  supabase.auth.getSession().then(async ({ data }) => {
    setIsLoggedIn(!!data.session);

    if (data.session?.user) {
      await loadHistory(data.session.user.id)
      console.log("LOGIN EMAIL:", data.session.user.email);
      console.log("LOGIN USER:", data.session.user);

     const result = await supabase
  .from("profiles")
  .select("*")
  .eq("email", data.session.user.email)
  
  console.log(result.data);

const profile = result.data?.[0];
console.log("SESSION ID:", data.session.user.id);
console.log("QUERY RESULTS:", result.data);
console.log("PROFILE ERROR:", result.error);

      if (profile) {
        setPlan(profile.plan?.toUpperCase() || 'FREE');
        setExpiresAt(profile.expires_at || "")
        setUsedToday(profile.daily_used || 0);

        if (profile.plan === 'pro') {
          setDailyLimit(100);
        } else {
          setDailyLimit(3);
        }
      }
    }
  });
}, []);

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('history');

      if (!savedHistory) return;

      const parsed = JSON.parse(savedHistory);

      if (
        Array.isArray(parsed) &&
        parsed.length > 0 &&
        typeof parsed[0] === 'object'
      ) {
        setHistory(parsed);
      } else {
        localStorage.removeItem('history');
      }
    } catch {
      localStorage.removeItem('history');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      'history',
      JSON.stringify(history)
    );
  }, [history]);

const loadHistory = async (userId: string) => {
  const { data } = await supabase
    .from("history")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (data) {
    setHistory(
  data.map(item => ({
    id: item.id,
    topic: item.topic,
    result: item.result,
    createdAt: new Date(
      item.created_at
    ).toLocaleString()
  }))
);
  }
};

const stopGenerating = () => {
  controller?.abort();
  setLoading(false);
  setOutput("Generation stopped.");
}

  const generate = async () => {
    if (!isLoggedIn) {
    alert("Please login first");
    router.push("/login");
    return;
  }

    if (loading) return;
    if (!input.trim()) return;

if (plan !== "PRO" && usedToday >= dailyLimit) {
  alert("Daily Limit Reached. Upgrade to Pro...");
  router.push("/pricing");
  return;
}

    setLoading(true);
    setOutput('Repurposing Content...');

    try {
      const abortController = new AbortController();
setController(abortController);
      const session = await supabase.auth.getSession();

      console.log(
  "USER ID:",
  session.data.session?.user.id
);

const response = await fetch("/api/rewrite", {
  signal: abortController.signal,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    topic: input,
    userId: session.data.session?.user.id
  }),
});

      const data = await response.json();
console.log(data);

if (data?.error) {
  throw new Error(data.message);
}

const results =
  data?.hasil || 'No Results';

setOutput(results);

const { data: profileData } = await supabase
  .from("profiles")
  .select("daily_used")
  .eq(
    "email",
    session.data.session?.user.email
  )
  .single();

if (profileData) {
  setUsedToday(profileData.daily_used);
}

if (
  plan !== "PRO" &&
  profileData &&
  profileData.daily_used >= dailyLimit
) {
  setTimeout(() => {
    alert(
      "🎉 You've used all 3 free generations today.\n\nUpgrade to Pro for up to 100 generations per day."
    );

    router.push("/pricing");
  }, 500);
}

await supabase
  .from("history")
  .insert({
    user_id: session.data.session?.user.id,
    topic: input,
    result: results
  });

      setHistory((prev) => [
  {
    id: Date.now(),
    topic: input,
    result: results,
    createdAt: new Date().toLocaleString(),
  },
  ...prev,
]);
   } catch (error: any) {

  if (error?.name === "AbortError") {
    setOutput("Generation stopped.");
    return;
  }

  console.error(error);

  setOutput(
    "Service temporarily unavailable. Please try again in a few minutes."
  );
}

    setLoading(false);
  };

  const downloadPdf = () => {
  if (!output) return;

  const pdf = new jsPDF();

  pdf.setFontSize(16);
  pdf.text('AI Content Repurposer', 10, 10);

  pdf.setFontSize(11);

  const lines = pdf.splitTextToSize(
    output,
    180
  );

  pdf.text(lines, 10, 20);

  pdf.save('ai-content-output.pdf');
};
  
const downloadTxt = () => {
    const blob = new Blob([output], {
      type: 'text/plain;charset=utf-8',
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-content-output.txt';
    a.click();

    URL.revokeObjectURL(url);
  };

  const downloadDocx = async () => {
  if (!output) return;

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph('AI Content Repurposer'),
          new Paragraph(''),
          new Paragraph(output),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);

  saveAs(blob, 'ai-content-output.docx');
};

const clearInput = () => {
  setInput('');
};

const clearOutput = () => {
  setOutput('');
  localStorage.removeItem('lastOutput');
};

  const clearHistory = async () => {
  if (!confirm('Delete All History?')) return;

  const session =
    await supabase.auth.getSession();

  await supabase
    .from("history")
    .delete()
    .eq(
      "user_id",
      session.data.session?.user.id
    );

  setHistory([]);
  localStorage.removeItem("history");
};

const deleteHistoryItem = async (
  id: number
) => {

  await supabase
    .from("history")
    .delete()
    .eq("id", id);

  setHistory(
    history.filter(
      item => item.id !== id
    )
  );
};

  const charCount = output.length;

const wordCount =
  output.trim() === ''
    ? 0
    : output.trim().split(/\s+/).length;

    const estimatedMinutes = Math.floor(wordCount / 150);

const estimatedSeconds = Math.floor(
  ((wordCount % 150) / 150) * 60
);

const filteredHistory = history.filter(
  (item) =>
    item.topic
      .toLowerCase()
      .includes(search.toLowerCase())
);

  return (
    <main
  className={
    darkMode
      ? 'min-h-screen bg-gray-950 p-6'
      : 'min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6'
  }
>
      <div
  className={
    darkMode
      ? 'max-w-7xl mx-auto bg-gray-900 rounded-3xl shadow-xl p-6 text-white'
      : 'max-w-7xl mx-auto bg-white rounded-3xl shadow-xl p-6'
  }
>
       <div className="flex justify-between items-center mb-3">
  <h1 className="text-4xl font-bold text-indigo-400">
    AI Content Repurposer
  </h1>

  {plan?.toUpperCase() === "PRO" && (
  <div className="bg-green-500/10 border border-green-500 rounded-xl px-3 py-1">
    <div className="text-green-400 font-bold">
      ⭐ PRO ACTIVE
    </div>

    {expiresAt && (
      <div className="text-yellow-300 text-xs">
        {Math.ceil(
          (new Date(expiresAt).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
        )} Days Left
      </div>
    )}
  </div>
  )}

  {isLoggedIn ? (
    <button
      onClick={async () => {
        console.log('LOGOUT CLICKED')
        await supabase.auth.signOut();

setIsLoggedIn(false);

setInput('');
setOutput('');
setHistory([]);

setPlan('free');
setUsedToday(0);
setExpiresAt('');

localStorage.removeItem('lastInput');
localStorage.removeItem('lastOutput');
localStorage.removeItem('history');

router.push('/');
      }}
      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-bold"
    >
      Logout
    </button>
  ) : (
    <div className="flex gap-3">
      <button
        onClick={() => router.push('/login')}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-bold"
      >
        Login
      </button>

      <button
        onClick={() => router.push('/login')}
        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-bold"
      >
        Sign Up
      </button>
    </div>
  )}
</div>

<p
  className={
    darkMode
      ? 'text-gray-400 mb-4'
      : 'text-gray-600 mb-4'
  }
>
  Paste a video transcript, blog article, podcast, social post, or idea.
  Get YouTube Shorts, TikTok scripts, Instagram captions, X threads,
  LinkedIn posts, hashtags, and content ideas instantly.
</p>

<div className="mb-5 text-sm text-gray-300">
  ✓ YouTube Shorts • TikTok Scripts • Instagram Captions •
  X Threads • LinkedIn Posts • Hashtags • Content Ideas
</div>

<div className="flex items-center gap-3 mb-4">

  <button
    onClick={() => setDarkMode(!darkMode)}
    className="bg-gray-700 text-white px-4 py-2 rounded-xl"
  >
    {darkMode ? "☀ Light Mode" : "🌙 Dark Mode"}
  </button>

  {plan !== 'PRO' && (
  <button
    onClick={() => router.push('/pricing')}
    className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-xl font-bold"
  >
    🚀 Upgrade To PRO
  </button>
)}

</div>

        <div className="grid lg:grid-cols-3 gap-4 items-start">
<div>

  <div className="flex flex-wrap gap-2 mb-3">

      <button
  onClick={() => setInput("YouTube video transcript about AI productivity tools")}
  className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-lg"
>
  🎥 YouTube Video
</button>

<button
  onClick={() => setInput("Blog article about personal finance and saving money")}
  className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-lg"
>
  📝 Blog Article
</button>

<button
  onClick={() => setInput("Podcast episode discussing startup growth strategies")}
  className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-lg"
>
  🎙 Podcast
</button>

<button
  onClick={() => setInput("Twitter thread about passive income ideas")}
  className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-lg"
>
  🐦 Social Post
</button>
  </div>

          <textarea
            value={input}
            maxLength={500}
            onChange={(e) => {
  if (e.target.value.length <= 500) {
    setInput(e.target.value);
  }
}}
            placeholder="Paste any content here..."
            className={
  darkMode
    ? 'w-full h-[320px] bg-gray-800 border border-gray-700 rounded-xl p-4 text-white'
    : 'w-full h-[320px] border-2 border-gray-300 rounded-xl p-4 text-black'
}
          />

<div
  className={
    darkMode
      ? 'text-gray-400 text-sm mt-2'
      : 'text-gray-600 text-sm mt-2'
  }
>
  {input.length}/500 karakter

  <br />

  Generations Left: {Math.max(0, dailyLimit - usedToday)}
</div>

</div>

          <div>

  <div className="flex gap-2 justify-center mb-3 mt-[33px]">

{!loading && (
    <button
      onClick={generate}
      disabled={!isLoggedIn || usedToday >= dailyLimit}
      className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold"
    >
      {
        !isLoggedIn
        ? "Login Required"
        : usedToday >= dailyLimit
        ? "Daily Limit Reached"
        : "Repurpose Content"
      }
    </button>
)}

    {loading && (
      <button
        onClick={stopGenerating}
        className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold"
      >
        Stop
      </button>
    )}

  </div>

  {loading ? (
  <div className="w-full h-[320px] flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="animate-spin h-10 w-10 rounded-full border-4 border-blue-500 border-t-transparent"></div>
      <span>Generating AI Content...</span>
    </div>
  </div>
) : (
  <textarea
    value={output}
    readOnly
    className={
      darkMode
        ? 'w-full h-[320px] bg-gray-800 border border-gray-700 rounded-xl p-4 text-white'
        : 'w-full h-[320px] border-2 border-gray-300 rounded-xl p-4 text-black'
    }
  />
)}
          <div
  className={
    darkMode
      ? 'text-gray-300 text-sm mt-2'
      : 'text-gray-600 text-sm mt-2'
  }
>
  Words: {wordCount}
{' | '}
Character: {charCount}
{' | '}
Read Time: {estimatedMinutes}m {estimatedSeconds}s
</div>
</div>
    <div className={
  darkMode
    ? 'border border-gray-700 rounded-xl p-4 bg-gray-800 h-[320px] mt-[85px]'
    : 'border-2 border-gray-300 rounded-xl p-4 bg-gray-50 h-[320px] mt-[85px]'
}>

            <div className="flex justify-between items-center mb-3">

               <h3
  className={
    darkMode
      ? 'font-bold text-white'
      : 'font-bold text-black'
  }
>
  History ({history.length})
</h3>

              <button
                onClick={clearHistory}
                className="bg-red-500 text-white px-3 py-1 rounded"
              >
                Erase
              </button>

            </div>

<input
  type="text"
  placeholder="Search History..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  className={
    darkMode
      ? 'w-full mb-3 bg-gray-700 text-white p-2 rounded'
      : 'w-full mb-3 border p-2 rounded text-black placeholder-gray-500'
  }
/>

            <div className="space-y-2 max-h-[260px] overflow-auto">

              {filteredHistory.length === 0 && (
                <p className="text-gray-500">
                  No History Yet
                </p>
              )}

              {filteredHistory.map((item, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setOutput(item.result);
                    setInput(item.topic);
                  }}
                  className="bg-white border rounded-lg p-2 text-black text-sm cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex justify-between">
  <div className="font-bold">
  REPURPOSE
</div>

  <button
    onClick={(e) => {
      e.stopPropagation();
      deleteHistoryItem(item.id);
    }}
    className="text-red-500 font-bold"
  >
    ❌
  </button>
</div>

                  <div className="truncate">
                    {item.topic}
                  </div>

                  <div className="text-xs text-gray-500">
                    {item.createdAt}
                  </div>
                </div>
              ))}

            </div>

          </div>

        </div>

        <div className="flex flex-wrap gap-4 mt-6">

          <button
  onClick={clearInput}
  className="bg-yellow-600 text-white px-6 py-3 rounded-xl font-bold"
>
  Clear Input
</button>

          <button
  onClick={clearOutput}
  className="bg-gray-600 text-white px-6 py-3 rounded-xl font-bold"
>
  Clear Output
</button>

          <button
  onClick={downloadTxt}
  disabled={!output.trim()}
  className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold"
>
  Download TXT
</button>

<button
  onClick={() => {
    if (plan !== "PRO") {
      router.push("/pricing");
      return;
    }

    downloadDocx();
  }}
  className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold"
>
  {plan === "PRO"
    ? "Download DOCX"
    : "🔒 Download DOCX"}
</button>

<button
  onClick={() => {
    if (plan !== "PRO") {
      router.push("/pricing");
      return;
    }

    downloadPdf();
  }}
  className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold"
>
  {plan === "PRO"
    ? "Download PDF"
    : "🔒 Download PDF"}
</button>

      </div>

        <div className="text-center mt-10 text-gray-500">
          <a href="/privacy">Privacy</a>
          {" | "}
          <a href="/terms">Terms</a>
          {" | "}
          <a href="/faq">FAQ</a>
          {" | "}
          <a href="/contact">Contact</a>
        </div>

      </div>
    </main>
  );
}