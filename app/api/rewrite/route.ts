import { NextResponse } from 'next/server';
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const {
      topic,
      tool,
      userId
    } = await request.json();

    console.log("USER ID =", userId);

const profileResult = await supabaseAdmin
  .from("profiles")
  .select("*")
  .eq("id", userId)
  .single();

console.log(profileResult.data);

const profile = profileResult.data;

if (!profile) {
  console.log("PROFILE NULL");
  console.log(profileResult);

  return NextResponse.json(
    {
      hasil: JSON.stringify(profileResult)
    }
  );
}

const limit =
  profile.plan === "pro"
    ? 100
    : 5;

if (profile.daily_used >= limit) {
  return NextResponse.json(
    {
      hasil:
        "Daily limit reached. Upgrade to Pro."
    },
    {
      status: 403
    }
  );
}
    
    if (!topic || topic.trim().length === 0) {
  return NextResponse.json(
    { error: "Topic Cannot Be Empty" },
    { status: 400 }
  );
}

if (topic.length > 500) {
  return NextResponse.json(
    { error: "Maximum 500 Characters Allowed" },
    { status: 400 }
  );
}

    let prompt = '';

    if (tool === 'script') {
      prompt = `
      IMPORTANT:
Use the same language as the user's input.
Do not translate unless requested.

Create a professional Youtube script with at least 700 words about

${topic}

Format:

# VIRAL TITLE

# SEO DESCRIPTION

# 15 HASHTAGS

# FULL SCRIPT
`;
    }

    else if (tool === 'title') {
      prompt = `
      IMPORTANT:
Use the same language as the user's input.
Do not translate unless requested.

Create 20 highly clickable Youtube titles with high CTR about:

${topic}

Format number 1-20.
`;
    }

    else if (tool === 'description') {
      prompt = `
IMPORTANT:
Use the same language as the user's input.
Do not translate unless requested.

Create a professional Youtube SEO description about:

${topic}

Include the main keyword and a strong subscribe CTA.
`;
    }

    else if (tool === 'hashtags') {
      prompt = `
IMPORTANT:
Use the same language as the user's input.
Do not translate unless requested.

Create 30 highly relevant Youtube hastags about:

${topic}

Mix popular and niche hastags 
`;
    }

    else if (tool === 'shorts') {
      prompt = `
IMPORTANT:
Use the same language as the user's input.
Do not translate unless requested.

Create a viral Youtube Shorts script about:

${topic}

Format:

# 20 VIRAL TITLES

# 10 VIRAL HOOKS

# 30 SECOND SCRIPT

# 60 SECOND SCRIPT

# THUMBNAIL TEXT

# AI THUMBNAIL PROMPT

# CALL TO ACTION

# 30 HASHTAGS
`;
    }

    else if (tool === 'all') {
      prompt = `
IMPORTANT:
Use the same language as the user's input.
Do not translate unless requested.

Create a complete Youtube content package about:

${topic}

Format:

# 20 VIRAL TITLES

# 10 VIRAL HOOKS

# 30 SECOND SHORTS SCRIPT

# 60 SECOND SHORTS SCRIPT

# 5 MINUTE SCRIPT VIDEO

# THUMBNAIL TEXT

# THUMBNAIL AI PROMPT

# SEO KEYWORDS

# SEO DESCRIPTION

# CALL TO ACTION

# 30 HASHTAGS
`;
    }

    else if (tool === 'tiktok') {
      prompt = `
IMPORTANT:
Use the same language as the user's input.
Do not translate unless requested.

Create a complete TikTok content package about:

${topic}

Format:

# 10 VIRAL HOOKS

# 10 CAPTIONS

# 30 SECOND SCRIPT

# 60 SECOND SCRIPT

# CALL TO ACTION

# 30 HASHTAGS
`;
    }

    else if (tool === 'blog') {
      prompt = `
IMPORTANT:
Use the same language as the user's input.
Do not translate unless requested.

Write a professional SEO blog article with at least 1500 words about:

${topic}

Format:

# SEO TITLE

# META DESCRIPTION

# INTRODUCTION

# H2 SECTIONS

# H3 SUBSECTIONS

# FAQ

# CONCLUSION
`;
    }

    else if (tool === 'thumbnail') {
  prompt = `
  IMPORTANT:
Use the same language as the user's input.
Do not translate unless requested.

Create 10 viral YouTube thumbnail prompts for:

${topic}

Each prompt must include:
- Main subject
- Facial expression
- Background
- Lighting
- Colors
- Thumbnail text

Make them highly clickable.
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
You are a professional AI Content Creator.

CRITICAL RULE:
Always respond in the exact language used by the user.
If the user writes in English, respond entirely in English.
If the user writes in Indonesian, respond entirely in Indonesian.
Never translate unless explicitly requested.

Create high-quality, engaging, SEO-optimized content.
Avoid short answers.
Keep outputs professional and well-structured.
`,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.8,
          max_tokens: 1000,
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
        'No Results',
    });

  } catch (error: any) {
    console.error(error);

    return NextResponse.json({
      hasil: `ERROR: ${error?.message || 'Unknown Error'}`,
    });
  }
}