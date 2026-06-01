'use client';

import { jsPDF } from 'jspdf';
import {
  Document,
  Packer,
  Paragraph
} from 'docx';
import { saveAs } from 'file-saver';
import { useEffect, useState } from 'react';

type HistoryItem = {
  tool: string;
  topic: string;
  result: string;
  createdAt: string;
};

export default function HomePage() {
  const [tool, setTool] = useState('all');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
const [darkMode, setDarkMode] = useState(true);
const [search, setSearch] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [dailyLimit, setDailyLimit] = useState(5);
  const [usedToday, setUsedToday] = useState(0);

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

  const generate = async () => {
    if (loading) return;
    if (!input.trim()) return;

    const usedToday = Number(
  localStorage.getItem("usedToday") || 0
);

if (usedToday >= 5) {
  alert("Limit harian tercapai");
  return;
}

    setLoading(true);
    setOutput('Generating AI Content...');

    try {
      const response = await fetch('/api/rewrite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: input,
          tool,
        }),
      });

      const data = await response.json();

      const hasil =
        data?.hasil || 'Tidak ada hasil';

      setOutput(hasil);

      const usedToday = Number(
  localStorage.getItem("usedToday") || 0
);

localStorage.setItem(
  "usedToday",
  String(usedToday + 1)
);

setUsedToday(usedToday + 1);

      setHistory((prev) => [
        {
          tool,
          topic: input,
          result: hasil,
          createdAt: new Date().toLocaleString(),
        },
        ...prev,
      ]);
    } catch (error) {
      console.error(error);
      setOutput('Terjadi error');
    }

    setLoading(false);
  };

  const copyResult = async () => {
    await navigator.clipboard.writeText(output);
    alert('Berhasil dicopy');
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
    if (!confirm('Hapus semua history?')) return;

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
        <h1 className="text-4xl font-bold text-indigo-400 mb-3">
          AI Shorts Factory
        </h1>

<p
  className={
    darkMode
      ? 'text-gray-400 mb-4'
      : 'text-gray-600 mb-4'
  }
>
  Create Viral Content for Youtube,Shorts,& TikTok in Seconds.
</p>


        <h2 className="text-lg text-red-500 font-bold mb-4">
          Active Tool: {tool.toUpperCase()}
          <button
  onClick={() => setDarkMode(!darkMode)}
  className="ml-4 mb-4 bg-gray-700 text-white px-4 py-2 rounded-xl"
>
  {darkMode ? '☀ Light Mode' : '🌙 Dark Mode'}
</button>
        </h2>

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
  ? 'bg-white text-blue-600 scale-125 ring-4 ring-blue-400 font-bold'
  : 'bg-blue-600 text-white'
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

        </div>

        <div className="grid lg:grid-cols-3 gap-4">
<div>
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

          <div>
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
      : 'w-full mb-3 border p-2 rounded'
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
  disabled={usedToday >= dailyLimit || loading}
  className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold"
>
  {loading ? "Generating..." : "Generate"}
</button>

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
  onClick={downloadDocx}
  className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold"
>
  Download DOCX
</button>

<button
  onClick={downloadPdf}
  className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold"
>
  Download PDF
</button>

        </div>

      </div>
    </main>
  );
}