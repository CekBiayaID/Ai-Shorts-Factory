import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { topic, tool } = await request.json();

    let prompt = '';

    if (tool === 'script') {
      prompt = `
Buat script YouTube profesional minimal 700 kata tentang:

${topic}

Format:

# JUDUL VIRAL

# DESKRIPSI SEO

# 15 HASHTAGS

# SCRIPT LENGKAP
`;
    }

    else if (tool === 'title') {
      prompt = `
Buat 20 judul YouTube viral dengan CTR tinggi tentang:

${topic}

Format nomor 1-20.
`;
    }

    else if (tool === 'description') {
      prompt = `
Buat deskripsi SEO YouTube profesional tentang:

${topic}

Sertakan keyword utama dan CTA subscribe.
`;
    }

    else if (tool === 'hashtags') {
      prompt = `
Buat 30 hashtag YouTube terbaik tentang:

${topic}

Gabungkan hashtag populer dan niche.
`;
    }

    else if (tool === 'shorts') {
      prompt = `
Buat paket YouTube Shorts lengkap tentang:

${topic}

Format:

# 20 JUDUL VIRAL

# 10 HOOK VIRAL

# SCRIPT 30 DETIK

# SCRIPT 60 DETIK

# THUMBNAIL TEXT

# THUMBNAIL AI PROMPT

# CTA

# 30 HASHTAGS
`;
    }

    else if (tool === 'all') {
      prompt = `
Buat paket konten YouTube lengkap tentang:

${topic}

Format:

# 20 JUDUL VIRAL

# 10 HOOK VIRAL

# SCRIPT SHORTS 30 DETIK

# SCRIPT SHORTS 60 DETIK

# SCRIPT VIDEO 5 MENIT

# THUMBNAIL TEXT

# THUMBNAIL AI PROMPT

# SEO KEYWORDS

# DESKRIPSI SEO

# CTA

# 30 HASHTAGS
`;
    }

    else if (tool === 'tiktok') {
      prompt = `
Buat paket konten TikTok lengkap tentang:

${topic}

Format:

# 10 HOOK VIRAL

# 10 CAPTION

# SCRIPT 30 DETIK

# SCRIPT 60 DETIK

# CTA

# 30 HASHTAGS
`;
    }

    else if (tool === 'blog') {
      prompt = `
Tulis artikel SEO profesional minimal 1500 kata tentang:

${topic}

Format:

# JUDUL SEO

# META DESCRIPTION

# PENDAHULUAN

# H2

# H3

# FAQ

# KESIMPULAN
`;
    }

    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-chat',
          messages: [
            {
              role: 'system',
              content: `
Kamu adalah AI Content Creator Professional.

Tugas:
- Buat konten berkualitas tinggi.
- Hindari jawaban pendek.
- Gunakan bahasa yang natural.
- Fokus pada engagement dan SEO.
- Berikan output yang rapi.
`,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.8,
          max_tokens: 4000,
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      return NextResponse.json({
        hasil: `ERROR: ${data.error.message}`,
      });
    }

    return NextResponse.json({
      hasil:
        data.choices?.[0]?.message?.content ||
        'Tidak ada hasil',
    });

  } catch (error: any) {
    console.error(error);

    return NextResponse.json({
      hasil: `ERROR: ${error?.message || 'Unknown Error'}`,
    });
  }
}