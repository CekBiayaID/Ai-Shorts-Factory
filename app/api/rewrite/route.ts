import { NextResponse } from 'next/server';
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const {
      topic,
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

let prompt = `
IMPORTANT:
Use the same language as the user's input.
Do not translate unless requested.

You are an AI Content Repurposing Expert.

Repurpose the following content/topic into a complete short-form content package:

${topic}

Format exactly:

# VIRAL TITLES

Create 10 highly clickable YouTube titles.

# VIRAL HOOKS

Create 10 attention-grabbing hooks.

# SEO DESCRIPTION

Create 1 SEO optimized description.

# YOUTUBE SHORTS SCRIPT

Create a complete 30-60 second YouTube Shorts script.

# TIKTOK SCRIPT

Create a complete viral TikTok version.

# INSTAGRAM CAPTION

Create an engaging Instagram caption.

# X THREAD

Create a Twitter/X thread.

# LINKEDIN POST

Create a professional LinkedIn post.

# THUMBNAIL IDEAS

Create 10 thumbnail ideas.

# CALL TO ACTION

Create 5 strong CTAs.

# HASHTAGS

Create 30 relevant hashtags.

# CONTENT IDEAS

Create 10 additional content ideas based on this topic.
`;

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
          max_tokens: 2000,
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