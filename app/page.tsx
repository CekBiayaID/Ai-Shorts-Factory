'use client';

import { jsPDF } from 'jspdf';
import {
  Document,
  Packer,
  Paragraph
} from 'docx';
import { saveAs } from 'file-saver';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase'
import Image from "next/image";

type HistoryItem = {
  id: number;
  topic: string;
  result: string;
  createdAt: string;
};

export default function HomePage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [plan, setPlan] = useState('FREE')
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [controller, setController] = useState<AbortController | null>(null);
  const [dailyLimit, setDailyLimit] = useState(3);
  const [usedToday, setUsedToday] = useState(0);
  const [expiresAt, setExpiresAt] = useState("")
  const [resetTimeLeft, setResetTimeLeft] = useState("00:00:00")
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // --- DAILY LIMIT & TIMER SYSTEM ---
  const getNextResetTime = useCallback(() => {
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    return nextMidnight.getTime();
  }, []);

  const resetDailyLimit = useCallback(async (userId: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          daily_used: 0,
          last_reset: new Date().toISOString().split("T")[0]
        })
        .eq("id", userId);

      if (!error) {
        setUsedToday(0); 
      } else {
      }

    } catch (err) {
    }
  }, []);

  const updateTimerDisplay = useCallback(() => {
    const resetTime = getNextResetTime();
    const now = new Date().getTime();
    const diffMs = resetTime - now;

    if (diffMs <= 0) {
      setResetTimeLeft("00:00:00");
      return;
    }

    const h = Math.floor(diffMs / (1000 * 60 * 60));
    const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diffMs % (1000 * 60)) / 1000);

    setResetTimeLeft(
      `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`
    );
  }, [getNextResetTime]);

  const checkAndInitLimit = useCallback(async () => {
    if (!isLoggedIn) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("daily_used, last_reset, plan")
      .eq("id", session.user.id)
      .single();

    if (error || !profile) {
      console.error("❌ Profile not found:", error);
      return;
    }

   const today = new Date().toISOString().split("T")[0];

if (profile.last_reset !== today) {
  await resetDailyLimit(session.user.id);
} else {
  setUsedToday(profile.daily_used || 0);
}

    updateTimerDisplay();
  }, [isLoggedIn, resetDailyLimit, updateTimerDisplay]);

  useEffect(() => {
    if (!isLoggedIn) return;
    checkAndInitLimit();
    const timerInterval = setInterval(updateTimerDisplay, 1000);
    return () => clearInterval(timerInterval);
  }, [isLoggedIn, checkAndInitLimit, updateTimerDisplay]);


  // --- USER INITIALIZATION ---
  useEffect(() => {
    const initUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);

      if (!session?.user) return;

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("daily_used, plan, expires_at, last_reset")
        .eq("id", session.user.id)
        .single();

      if (error || !profile) {
        console.error("❌ Failed to load profile:", error);
        return;
      }

      const now = new Date();
      const today = new Date().toISOString().split("T")[0];

      setUsedToday(profile.daily_used || 0);

const currentPlan =
  profile.plan?.toLowerCase();

setPlan(
  currentPlan === "pro"
    ? "PRO"
    : "FREE"
);

setExpiresAt(profile.expires_at || "");

setDailyLimit(
  currentPlan === "pro"
    ? 50
    : 3
);

await loadHistory(session.user.id);
    };

   initUser();

const interval = setInterval(() => {
  initUser();
}, 10000);

return () => clearInterval(interval);

}, []);


  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('history');
      if (!savedHistory) return;
      const parsed = JSON.parse(savedHistory);
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
        setHistory(parsed);
      } else {
        localStorage.removeItem('history');
      }
    } catch {
      localStorage.removeItem('history');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
  const handler = (e: any) => {
    e.preventDefault();
    setDeferredPrompt(e);
  };

  window.addEventListener("beforeinstallprompt", handler);

  return () => {
    window.removeEventListener("beforeinstallprompt", handler);
  };
}, []);

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
          createdAt: new Date(item.created_at).toLocaleString()
        }))
      );
    }
  };

  const stopGenerating = () => {
    controller?.abort();
    setLoading(false);
    setOutput("Generation stopped.");
  }

  const installApp = async () => {
  if (!deferredPrompt) {
    alert("Install app not available yet.");
    return;
  }

  deferredPrompt.prompt();

  const result = await deferredPrompt.userChoice;

  if (result.outcome === "accepted") {
    console.log("PWA Installed");
  }

  setDeferredPrompt(null);
};

  // --- GENERATE FUNCTION (FIXED DATABASE UPDATE) ---
  const generate = async () => {
    if (!isLoggedIn) {
      alert("Please login first");
      router.push("/login");
      return;
    }

    if (loading) return;
    if (!input.trim()) return;

    if (usedToday >= dailyLimit) {
  if (plan === "PRO") {
    alert("You've reached your daily limit of 50 generations.");
  } else {
    alert("Daily Limit Reached. Upgrade to Pro to get more generations.");
    router.push("/pricing");
  }
    return;
  }

    setLoading(true);
    setOutput('ReContent...');

    try {
      const abortController = new AbortController();
      setController(abortController);
      const session = await supabase.auth.getSession();
      const userId = session.data.session?.user.id;

      if (!userId) throw new Error("User not found");

      const response = await fetch("/api/rewrite", {
        signal: abortController.signal,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: input, userId }),
      });

      const data = await response.json();
      if (data?.error) throw new Error(data.message);

      const results = data?.hasil || 'No Results';
      setOutput(results);
      setUsedToday(prev => prev + 1);

      if (
  plan !== "PRO" &&
  usedToday + 1 >= dailyLimit
) {
  setTimeout(() => {
    alert(
      "🎉 You've used all 3 free generations today.\n\nUpgrade to Pro for up to 50 generations per day."
    );
    router.push("/pricing");
  }, 500);
}

      await supabase
        .from("history")
        .insert({
          user_id: userId,
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
      console.error("❌ Generation error:", error);
      setOutput("Service temporarily unavailable. Please try again in a few minutes.");
    }

    setLoading(false);
  };


  const downloadPdf = () => {
    if (!output) return;
    const pdf = new jsPDF();
    pdf.setFontSize(16);
    pdf.text('ReContent', 10, 10);
    pdf.setFontSize(11);
    const lines = pdf.splitTextToSize(output, 180);
    pdf.text(lines, 10, 20);
    pdf.save('re-content-output.pdf');
  };
  
  const downloadTxt = () => {
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 're-content-output.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadDocx = async () => {
    if (!output) return;
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph('ReContent'),
            new Paragraph(''),
            new Paragraph(output),
          ],
        },
      ],
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, 're-content-output.docx');
  };

  const clearInput = () => setInput('');
  const clearOutput = () => {
    setOutput('');
    localStorage.removeItem('lastOutput');
  };

  const clearHistory = async () => {
    if (!confirm('Delete All History?')) return;
    const session = await supabase.auth.getSession();
    await supabase.from("history").delete().eq("user_id", session.data.session?.user.id);
    setHistory([]);
    localStorage.removeItem("history");
  };

  const deleteHistoryItem = async (id: number) => {
    await supabase.from("history").delete().eq("id", id);
    setHistory(history.filter(item => item.id !== id));
  };

  const filteredHistory = history.filter(item => item.topic.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex h-screen overflow-hidden bg-[#0B101E] text-gray-100 font-sans">
      {sidebarOpen && (
       <div
        className="fixed inset-0 bg-black/50"
         onClick={() => setSidebarOpen(false)}
         />
          )}
          <button
           onClick={() => setSidebarOpen(true)}
            className="fixed top-6 left-6 z-50"
            >
              ☰
            </button>            
      {/* Sidebar Navigation */}
      <aside
  className={`
    fixed left-0 top-0 h-full w-64
    bg-[#121829]
    z-50
    transition-transform duration-300
    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
  `}
>

        <div className="p-5 border-b border-[#1E293B]">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
               alt="ReContent"
                 width={40}
                   height={40}
                className="rounded-lg"
              />
            <span className="text-base font-bold">ReContent</span>
            <span className="bg-[#4F46E5]/20 text-[#4F46E5] px-2 py-0.5 rounded text-xs font-semibold">
              {plan === "PRO" ? "PRO" : "FREE"}
            </span>
          </div>
        </div>

        <nav className="p-4 flex-1">
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#4F46E5]/15 text-[#4F46E5] mb-2">
            <i className="fa fa-home w-5 text-center"></i>
            <span>Dashboard</span>
          </a>
          <button
  onClick={() => {
    setInput("YouTube video transcript about Content marketing strategies");

    setOutput(`🐦 X Thread

1/ Content marketing is not about creating more content.

It's about repurposing content smarter.

🧵

2/ One YouTube video can become:
• X Threads
• LinkedIn Posts
• Instagram Captions

3/ Work once.
Distribute everywhere.

#ContentMarketing #CreatorEconomy`);
  }}
  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 mb-2 text-gray-300 text-left"
>
  <i className="fa fa-youtube-play w-5 text-center"></i>
  <span>X Thread</span>
</button>

<button
  onClick={() => {
    setInput("Blog article about personal finance and saving money");

    setOutput(`💼 LinkedIn Post

Most people struggle with money not because they earn too little.

They struggle because they don't have a system.

3 simple habits:

✅ Track expenses
✅ Save automatically
✅ Invest consistently

Small habits create long-term wealth.

#PersonalFinance #Investing`);
  }}
  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 mb-2 text-gray-300 text-left"
>
  <i className="fa fa-file-text-o w-5 text-center"></i>
  <span>LinkedIn Post</span>
</button>

<button
  onClick={() => {
    setInput("Podcast episode discussing startup growth strategies");

    setOutput(`📸 Instagram Caption

Startup growth doesn't happen by accident.

Focus on:

🚀 Product-Market Fit
🚀 Customer Feedback
🚀 Consistent Execution

Success comes from solving real problems.

#Startup #Business #Growth`);
  }}
  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 mb-2 text-gray-300 text-left"
>
  <i className="fa fa-microphone w-5 text-center"></i>
  <span>Instagram Captions</span>
</button>

<button
  onClick={() => {
    setInput("Twitter thread about passive income ideas");

    setOutput(`🏷️ Viral Hashtags

#PassiveIncome
#OnlineBusiness
#Entrepreneur
#ContentCreator
#FinancialFreedom
#SideHustle

Suggested Title:

7 Passive Income Ideas You Can Start This Year`);
  }}
  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 mb-2 text-gray-300 text-left"
>
  <i className="fa fa-share-alt w-5 text-center"></i>
  <span>Viral Hastags</span>
</button>

<button
  onClick={() => {
    setInput("The weather today is very nice and suitable for outdoor activities.");

    setOutput(`✍️ Content Rewrite

Original:

AI helps businesses automate repetitive tasks.

Rewritten:

Artificial Intelligence enables organizations to streamline repetitive workflows, improve productivity, and focus resources on strategic growth initiatives.

Tone:
✅ Professional
✅ Clear
✅ Publish Ready`);
}}
  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 mb-2 text-gray-300 text-left"
>
  <i className="fa fa-pencil w-5 text-center"></i>
  <span>Content Rewriter</span>
</button>

          <div className="mb-6">
            <p className="text-xs text-gray-500 uppercase mb-2 px-4">ACCOUNT</p>
            {plan !== "PRO" && (
              <button 
                onClick={() => router.push("/pricing")}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 mb-2 text-[#FBBF24] text-left"
              >
                <i className="fa fa-crown w-5 text-center"></i>
                <span>Upgrade to PRO</span>
                <span className="ml-auto bg-[#FBBF24]/20 text-[#FBBF24] px-2 py-0.5 rounded text-xs">PRO</span>
              </button>
            )}
          </div>

          {/* <div className="bg-gray-800/40 rounded-lg p-4">
            <p className="text-xs text-gray-400 uppercase mb-3">USAGE</p>
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-gray-200">Daily Limit</span>
              <span className="text-blue-400 text-sm font-semibold">
                {usedToday >= dailyLimit ? "Reached" : `${usedToday}/${dailyLimit}`}
              </span>
            </div>
            <p className="text-sm text-gray-400 mb-2">
              {usedToday >= dailyLimit 
                ? "You've used all your daily limit." 
                : `${dailyLimit - usedToday} generations remaining today.`
              }
            </p>
            <p className="text-xs text-gray-500">Resets in: {resetTimeLeft}</p>
          </div> */}

          <div className="bg-gray-800/40 rounded-lg p-4">
  <p className="text-xs text-gray-400 uppercase mb-3">USAGE</p>

  {plan === "PRO" ? (
    <>
      <p className="font-medium text-gray-200">PRO Plan</p>

      <p className="text-sm text-green-400 mt-2">
        ✓ High Daily Usage
      </p>

      <p className="text-xs text-gray-500 mt-3">
        Resets in: {resetTimeLeft}
      </p>
    </>
  ) : (
    <>
      <div className="flex justify-between items-center mb-2">
        <span className="font-medium text-gray-200">
          Daily Usage
        </span>

        <span className="text-blue-400 text-sm font-semibold">
          {usedToday}/{dailyLimit}
        </span>
      </div>

      <p className="text-sm text-gray-400 mb-2">
        {dailyLimit - usedToday} generations remaining today.
      </p>

      <p className="text-xs text-gray-500">
        Resets in: {resetTimeLeft}
      </p>
    </>
  )}
</div>

        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          
          <div className="flex items-center gap-4 ml-10">

<button
  onClick={installApp}
  className="px-5 py-1 rounded-full text-green-400 text-sm hover:bg-green-500/10"
>
  📱 Install App
</button>

            {plan === "PRO" && expiresAt && (
              <div className="bg-green-500/10 border border-green-500 rounded-xl px-3 py-1">
                <div className="text-green-400 font-bold text-sm">⭐ PRO ACTIVE</div>
                <div className="text-yellow-300 text-xs">
                  {Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} Days Left
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {usedToday >= dailyLimit && (
              <span className="flex items-center gap-2 text-blue-400 bg-blue-400/10 px-3 py-1.5 rounded-lg text-sm">
                <i className="fa fa-check-circle"></i>
                Daily Limit Reached
              </span>
            )}

            {isLoggedIn ? (
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  setIsLoggedIn(false);
                  setInput('');
                  setOutput('');
                  setHistory([]);
                  setPlan('FREE');
                  setUsedToday(0);
                  setExpiresAt('');
                  localStorage.removeItem('lastInput');
                  localStorage.removeItem('lastOutput');
                  localStorage.removeItem('history');
                  router.push('/');
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold transition"
              >
                Logout
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => router.push('/login')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold transition"
                >
                  Login
                </button>
                <button
                  onClick={() => router.push('/login')}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold transition"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-r from-[#1E1B4B] to-[#121829] rounded-xl p-6 mb-8 border border-[#1E293B]">
          <div className="flex items-center gap-4">
            <Image
             src="/logo.png"
              alt="ReContent"
               width={48}
                height={48}
             className="rounded-xl"
            />
            <div>
              
              <h2 className="text-2xl font-bold">Welcome to RepurposeContent</h2>
              <p className="text-gray-300">Create Viral Content For Every Platform With One Click.
               </p>
             <p className="text-gray-300">
              Convert videos, blogs and podcasts into X threads,
              LinkedIn posts, captions and hashtags in seconds.
               </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-[#121829] rounded-xl p-6 border border-[#1E293B]">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-8 rounded-full bg-[#4F46E5]/20 text-[#4F46E5] flex items-center justify-center font-bold">1</span>
              <h3 className="text-lg font-semibold">Input Content</h3>
            </div>
            <textarea 
              value={input}
              maxLength={5000}
              onChange={(e) => {
                if (e.target.value.length <= 5000) setInput(e.target.value);
              }}
              placeholder="Paste any content here..." 
              className="w-full h-64 bg-[#0B101E] border border-[#1E293B] rounded-lg p-4 text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#4F46E5]/50 resize-none"
            ></textarea>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={clearInput}
                className="flex-1 bg-gray-800 hover:bg-gray-700 px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition text-gray-300"
              >
                <i className="fa fa-trash"></i> Clear Input
              </button>
              <button 
                onClick={clearOutput}
                className="flex-1 bg-gray-800 hover:bg-gray-700 px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition text-gray-300"
              >
                <i className="fa fa-times"></i> Clear Output
              </button>
            </div>
          </div>

          <div className="bg-[#121829] rounded-xl p-6 border border-[#1E293B]">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-8 rounded-full bg-[#7C3AED]/20 text-[#7C3AED] flex items-center justify-center font-bold">2</span>
              <h3 className="text-lg font-semibold">Output</h3>
            </div>
            {loading ? (
              <div className="w-full h-64 bg-[#0B101E] border border-[#1E293B] rounded-lg p-4 flex flex-col items-center justify-center text-center">
                <div className="animate-spin h-10 w-10 rounded-full border-4 border-[#7C3AED] border-t-transparent mb-3"></div>
                <span>Generating Content...</span>
                <button
                  onClick={stopGenerating}
                  className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                >
                  Stop
                </button>
              </div>
          ) : !output ? (
  <div className="w-full h-64 bg-[#0B101E] border border-[#1E293B] rounded-lg p-4 text-gray-400">
    <div className="font-semibold mb-3">
      Example Output
    </div>

    <div>🐦 X Thread</div>
    <div>💼 LinkedIn Post</div>
    <div>📸 Instagram Caption</div>
    <div>🏷️ Viral Hashtags</div>

    <div className="mt-4 text-xm">
      ✨ Your result appear here...
    </div>
  </div>
) : (
  <textarea
    value={output}
    readOnly
    className="w-full h-64 bg-[#0B101E] border border-[#1E293B] rounded-lg p-4 text-gray-200 focus:outline-none resize-none"
  />
)}
            <div className="grid grid-cols-3 gap-3 mt-6">
              <button 
                onClick={downloadTxt}
                disabled={!output.trim()}
                className="bg-gradient-to-r from-[#6D28D9] to-[#4F46E5] hover:opacity-90 disabled:opacity-40 px-3 py-2.5 rounded-lg flex items-center justify-center gap-2 transition font-medium text-white"
              >
                <i className="fa fa-download"></i> TXT
              </button>
              <button 
                onClick={() => {
                  if (plan !== "PRO") {
                    router.push("/pricing");
                    return;
                  }
                  downloadDocx();
                }}
                className="bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:opacity-90 disabled:opacity-40 px-3 py-2.5 rounded-lg flex items-center justify-center gap-2 transition font-medium text-white"
              >
                <i className="fa fa-download"></i> {plan === "PRO" ? "DOCX" : "🔒 DOCX"}
              </button>
              <button 
                onClick={() => {
                  if (plan !== "PRO") {
                    router.push("/pricing");
                    return;
                  }
                  downloadPdf();
                }}
                className="bg-gradient-to-r from-[#BE185D] to-[#9D174D] hover:opacity-90 disabled:opacity-40 px-3 py-2.5 rounded-lg flex items-center justify-center gap-2 transition font-medium text-white"
              >
                <i className="fa fa-download"></i> {plan === "PRO" ? "PDF" : "🔒 PDF"}
              </button>
            </div>
            <div className="mt-4">
              {!loading && (
                <button
                  onClick={generate}
                  disabled={usedToday >= dailyLimit || !input.trim()}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg transition"
                >
                  {usedToday >= dailyLimit ? "Daily Limit Reached" : "Repurpose Content"}
                </button>
              )}
            </div>
          </div>

          <div className="bg-[#121829] rounded-xl p-6 border border-[#1E293B]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-[#DB2777]/20 text-[#DB2777] flex items-center justify-center font-bold">3</span>
                <h3 className="text-lg font-semibold">History ({history.length})</h3>
              </div>
              <button 
                onClick={clearHistory}
                className="bg-red-900/30 text-red-400 px-3 py-1.5 rounded hover:bg-red-900/50 transition text-sm"
              >
                Clear
              </button>
            </div>
            <div className="relative mb-4">
              <input 
                type="text" 
                placeholder="Search history..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#0B101E] border border-[#1E293B] rounded-lg p-3 pl-10 text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#DB2777]/50"
              />
              <i className="fa fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"></i>
            </div>
            <div className="w-full h-52 bg-[#0B101E] border border-[#1E293B] rounded-lg p-3 overflow-y-auto">
              {filteredHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-3">
                    <i className="fa fa-clock-o text-gray-500 text-xl"></i>
                  </div>
                  <p className="text-gray-300 font-medium">No history yet</p>
                  <p className="text-sm text-gray-400 mt-1">Your generated content will appear here.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredHistory.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => {
                        setInput(item.topic);
                        setOutput(item.result);
                      }}
                      className="bg-gray-800 rounded-lg p-3 cursor-pointer hover:bg-gray-750 transition"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-sm truncate max-w-[180px]">{item.topic}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteHistoryItem(item.id);
                          }}
                          className="text-red-400 hover:text-red-300 text-xs"
                        >
                          ❌
                        </button>
                      </div>
                      <p className="text-xs text-gray-400">{item.createdAt}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <footer className="mt-10 pt-6 border-t border-[#1E293B] text-sm text-gray-500">
          <div className="flex justify-between items-center">
            <p>&copy; 2026 ReContent. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="/privacy" className="hover:text-gray-300">Privacy</a>
              <a href="/terms" className="hover:text-gray-300">Terms</a>
              <a href="/refund" className="hover:text-gray-300">Refund</a>
              <a href="/faq" className="hover:text-gray-300">FAQ</a>
              <a href="/contact" className="hover:text-gray-300">Contact</a>  
            </div>
            <div className="flex items-center gap-2">
              <span>English</span>
              <i className="fa fa-globe"></i>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
