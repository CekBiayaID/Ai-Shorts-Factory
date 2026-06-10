import { NextResponse } from 'next/server';
import { supabaseAdmin } from "@/lib/supabase-admin";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function POST(request: Request) {
  try {
    const {
      topic,
      userId,
      tool
    } = await request.json();

    console.log("USER ID =", userId);

const profileResult = await supabaseAdmin
  .from("profiles")
  .select("*")
  .eq("id", userId)
  .single();

console.log(profileResult.data);

const profile = profileResult.data;

const today = new Date()
  .toISOString()
  .split("T")[0];

if (
  profile &&
  profile.last_reset !== today
) {
  await supabaseAdmin
    .from("profiles")
    .update({
      daily_used: 0,
      last_reset: today
    })
    .eq("id", userId);

  profile.daily_used = 0;
}

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
    ? 50
    : 3;

if (profile.daily_used >= limit) {
  return NextResponse.json(
    {
      error: true,
      message: "Daily limit reached. Upgrade to Pro."
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

if (topic.length > 5000) {
  return NextResponse.json(
    { error: "Maximum 5000 Characters Allowed" },
    { status: 400 }
  );
}

let prompt = "";

const shortInput = topic.trim().length < 100;

if (shortInput) {
  prompt = `
IMPORTANT:
Use the same language as the user's input.

Topic:
${topic}

Format exactly:

# VIRAL TITLES
Create 5 highly clickable titles.

# VIRAL HOOKS
Create 5 attention-grabbing hooks.

# INSTAGRAM CAPTION
Create 1 caption.

# X THREAD
Create a thread with maximum 5 tweets.

# HASHTAGS
Create 15 hashtags.

Keep total output under 500 words.
`;
} else {
  prompt = `
IMPORTANT:
Use the same language as the user's input.

You are a Repurpose Content Expert.

Repurpose the following content:

${topic}

Format exactly:

# VIRAL TITLES
Create 5 highly clickable YouTube titles.

# VIRAL HOOKS
Create 5 attention-grabbing hooks.

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
Create 5 thumbnail ideas.

# CALL TO ACTION
Create 3 strong CTAs.

# HASHTAGS
Create 15 relevant hashtags.

# CONTENT IDEAS
Create 5 additional content ideas.
`;
}

   let result: any = null;

for (let i = 0; i < 3; i++) {
  try {
    result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    console.log(result);

    break;
  } catch (err: any) {
    console.log(`Retry ${i + 1}/3`);

    if (i === 2) throw err;

    await new Promise((r) => setTimeout(r, 3000));
  }
}

    const output = result.text;

    const updateResult = await supabaseAdmin
  .from("profiles")
  .update({
    daily_used: Number(profile.daily_used || 0) + 1,
    last_reset: new Date()
      .toISOString()
      .split("T")[0]
  })
  .eq("id", userId)
  .select();

  const check = await supabaseAdmin
  .from("profiles")
  .select("daily_used")
  .eq("id", userId)
  .single();

    return NextResponse.json({
  hasil: output,
})

} catch (error: any) {
  console.error("FULL ERROR:", error)

  return NextResponse.json(
    {
      error: true,
      message: error?.message || String(error),
    },
    {
      status: 500,
    }
  )
}
}