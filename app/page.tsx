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
  tool: string;
  topic: string;
  result: string;
  createdAt: string;
};

export default function HomePage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [plan, setPlan] = useState('free')
  const [tool, setTool] = useState('all');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
const [darkMode, setDarkMode] = useState(true);
const [search, setSearch] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [controller, setController] = useState<AbortController | null>(null);
  const [dailyLimit, setDailyLimit] = useState(5);
  const [usedToday, setUsedToday] = useState(0);
  const [expiresAt, setExpiresAt] = useState("")

  useEffect(() => {
  supabase.auth.getSession().then(async ({ data }) => {
    setIsLoggedIn(!!data.session);

    if (data.session?.user) {
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

        if (profile.plan === 'pro') {
          setDailyLimit(100);
        } else {
          setDailyLimit(5);
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
  const used = Number(localStorage.getItem("usedToday") || 0);
  setUsedToday(used);
}, []);

useEffect(() => {
  const today = new Date().toDateString();
  const lastDate = localStorage.getItem("lastDate");

  if (lastDate !== today) {
    localStorage.setItem("lastDate", today);
    localStorage.setItem("usedToday", "0");
    setUsedToday(0);
  }
}, []);

  useEffect(() => {
    localStorage.setItem(
      'history',
      JSON.stringify(history)
    );
  }, [history]);

  useEffect(() => {
  const savedOutput =
    localStorage.getItem('lastOutput');

  if (savedOutput) {
    setOutput(savedOutput);
  }
}, []);

useEffect(() => {
  localStorage.setItem(
    'lastOutput',
    output
  );
}, [output]);

  useEffect(() => {
  const savedInput =
    localStorage.getItem('lastInput');

  if (savedInput) {
    setInput(savedInput);
  }
}, []);

useEffect(() => {
  localStorage.setItem(
    'lastInput',
    input
  );
}, [input]);

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

    const usedToday = Number(
  localStorage.getItem("usedToday") || 0
);

if (plan !== "PRO" && usedToday >= dailyLimit) {
  alert("Daily Limit Reached. Upgrade to Pro...");
  router.push("/pricing");
  return;
}

    setLoading(true);
    setOutput('Generating AI Content...');

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
    tool,
    userId: session.data.session?.user.id
  }),
});

      const data = await response.json();
console.log(data);

      const results =
  data?.hasil || 'No Results';

      setOutput(results);

      const usedToday = Number(
  localStorage.getItem("usedToday") || 0
);

const newCount = usedToday + 1;

localStorage.setItem(
  "usedToday",
  String(newCount)
);

setUsedToday(newCount);

if (
  plan !== "PRO" &&
  newCount >= dailyLimit
) {
  setTimeout(() => {
    alert(
      "🎉 You've used all 5 free generations today.\n\nUpgrade to Pro for up to 100 generations per day."
    );

    router.push("/pricing");
  }, 500);
}

      setHistory((prev) => [
        {
          tool,
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
  setOutput("An error occurred");
}

    setLoading(false);
  };

  const copyResult = async () => {
    await navigator.clipboard.writeText(output);
    alert('Success copied');
  };

  const downloadPdf = () => {
  if (!output) return;

  const pdf = new jsPDF();

  pdf.setFontSize(16);
  pdf.text('AI Shorts Factory', 10, 10);

  pdf.setFontSize(11);

  const lines = pdf.splitTextToSize(
    output,
    180
  );

  pdf.text(lines, 10, 20);

  pdf.save('hasil-ai.pdf');
};
  
const downloadTxt = () => {
    const blob = new Blob([output], {
      type: 'text/plain;charset=utf-8',
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'hasil-ai.txt';
    a.click();

    URL.revokeObjectURL(url);
  };

  const downloadDocx = async () => {
  if (!output) return;

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph('AI Shorts Factory'),
          new Paragraph(''),
          new Paragraph(output),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);

  saveAs(blob, 'hasil-ai.docx');
};

const clearInput = () => {
  setInput('');
};

const clearOutput = () => {
  setOutput('');
  localStorage.removeItem('lastOutput');
};

  const clearHistory = () => {
    if (!confirm('Delete All History?')) return;

    setHistory([]);
    localStorage.removeItem('history');
  };

const deleteHistoryItem = (
  indexToDelete: number
) => {
  setHistory(
    history.filter(
      (_, index) =>
        index !== indexToDelete
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
    AI Shorts Factory
  </h1>

  {plan?.toUpperCase() === "PRO" ? (
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
) : (
  <div className="text-gray-400 font-bold">
    FREE
  </div>
)}

  {isLoggedIn ? (
    <button
      onClick={async () => {
        console.log('LOGOUT CLICKED')
        await supabase.auth.signOut();
        setIsLoggedIn(false);
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
  Create Viral Content for Youtube,Shorts,& TikTok in Seconds.
</p>


 <div className="flex items-center gap-3 mb-4">

  <h2 className="text-lg text-red-500 font-bold">
    Active Tool: {tool.toUpperCase()}
  </h2>

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
    🚀 Upgrade
  </button>
)}

</div>
        <div className="flex flex-wrap gap-3 mb-6">

          <button
  onClick={() => setTool('all')}
  className={`px-4 py-2 rounded-xl text-white transition-all ${
  tool === 'all'
    ? 'bg-red-500 scale-110 shadow-lg shadow-red-500/50'
    : 'bg-red-600'
}`}
>
  Generate All
</button>

<button
  onClick={() => setTool('script')}
  className={`px-4 py-2 rounded-xl text-white transition-all ${
  tool === 'script'
  ? 'bg-blue-500 scale-110 shadow-lg shadow-blue-500/50'
  : 'bg-blue-600'
}`}
>
  Script
</button>

<button
  onClick={() => setTool('title')}
  className={`px-4 py-2 rounded-xl text-white transition-all ${
    tool === 'title'
      ? 'bg-green-500 scale-110 shadow-lg shadow-green-500/50'
      : 'bg-green-600'
  }`}
>
  Title
</button>

          <button
            onClick={() => setTool('description')}
            className={`px-4 py-2 rounded-xl text-white transition-all ${
  tool === 'description'
    ? 'bg-purple-500 scale-110 shadow-lg shadow-purple-500/50'
    : 'bg-purple-600'
}`}
          >
            Description
          </button>

          <button
            onClick={() => setTool('hashtags')}
            className={`px-4 py-2 rounded-xl text-white transition-all ${
  tool === 'hashtags'
    ? 'bg-orange-500 scale-110 shadow-lg shadow-orange-500/50'
    : 'bg-orange-600'
}`}
          >
            Hashtags
          </button>

          <button
  onClick={() => setTool('shorts')}
  className={`px-4 py-2 rounded-xl text-white transition-all ${
  tool === 'shorts'
    ? 'bg-indigo-500 scale-110 shadow-lg shadow-indigo-500/50'
    : 'bg-indigo-600'
}`}
>
  Shorts
</button>

<button
  onClick={() => setTool('tiktok')}
  className={`px-4 py-2 rounded-xl text-white transition-all ${
  tool === 'tiktok'
    ? 'bg-pink-500 scale-110 shadow-lg shadow-pink-500/50'
    : 'bg-pink-600'
}`}
>
  TikTok
</button>

<button
  onClick={() => setTool('blog')}
  className={`px-4 py-2 rounded-xl text-white transition-all ${
  tool === 'blog'
    ? 'bg-cyan-500 scale-110 shadow-lg shadow-cyan-500/50'
    : 'bg-cyan-600'
}`}
>
  Blog
</button>

<button
  onClick={() => setTool('thumbnail')}
  className={`px-4 py-2 rounded-xl text-white transition-all ${
  tool === 'thumbnail'
    ? 'bg-yellow-500 scale-110 shadow-lg shadow-yellow-500/50'
    : 'bg-yellow-600'
}`}
>
    Thumbnail AI
</button>

        </div>

        <div className="grid lg:grid-cols-3 gap-4">
<div>

  <div className="flex flex-wrap gap-2 mb-3">
    <button
      onClick={() => setInput("10 Cute And Surprising Cat And Dog Facts")}
      className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-lg"
    >
      🐱🐶 Cat & Dog Facts
    </button>

    <button
      onClick={() => setInput("Best AI Tools 2026")}
      className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-lg"
    >
      🤖 AI Tools
    </button>

    <button
      onClick={() => setInput("Top Side Hustles")}
      className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-lg"
    >
      💰 Side Hustles
    </button>

    <button
      onClick={() => setInput("Strange Facts About Space")}
      className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-lg"
    >
      🚀 Space Facts
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
            placeholder="Enter Topic..."
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

          <div className="mt-20">
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
    ? 'border border-gray-700 rounded-xl p-4 bg-gray-800'
    : 'border-2 border-gray-300 rounded-xl p-4 bg-gray-50'
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
                    setTool(item.tool);
                  }}
                  className="bg-white border rounded-lg p-2 text-black text-sm cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex justify-between">
  <div className="font-bold">
    {item.tool.toUpperCase()}
  </div>

  <button
    onClick={(e) => {
      e.stopPropagation();
      deleteHistoryItem(index);
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
  onClick={generate}
  disabled={!isLoggedIn || usedToday >= dailyLimit || loading}
  className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold"
>
  {
    !isLoggedIn
    ? "Login Required"
    : loading
    ? "Generating..."
    : usedToday >= dailyLimit
    ? "Daily Limit Reached"
    : "Generate"
  }
</button>

{loading && (
  <button
    onClick={stopGenerating}
    className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold"
  >
    Stop
  </button>
)}

          <button
  onClick={clearInput}
  className="bg-yellow-600 text-white px-6 py-3 rounded-xl font-bold"
>
  Clear Input
</button>

          <button
            onClick={copyResult}
            className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold"
          >
            Copy Result
          </button>

<button
  onClick={clearOutput}
  className="bg-gray-600 text-white px-6 py-3 rounded-xl font-bold"
>
  Clear Output
</button>

          <button
            onClick={downloadTxt}
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