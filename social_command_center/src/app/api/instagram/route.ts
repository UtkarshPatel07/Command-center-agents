import { NextResponse } from 'next/server';
import { generateInstagramCaption } from '@/lib/ai';

export async function POST(req: Request) {
  try {
    const post = await req.json();
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const igUserId = process.env.INSTAGRAM_ACCOUNT_ID;

    if (!accessToken || !igUserId) {
      return NextResponse.json({ error: "Missing Instagram credentials in .env" }, { status: 500 });
    }

    if (!post.imageUrl) {
      return NextResponse.json({ error: "Instagram strictly requires an image to post. Please attach an Image URL." }, { status: 400 });
    }

    const caption = await generateInstagramCaption(
      post.content,
      post.hashtags || [],
      post.ctaLink,
      post.disclaimer
    );

    // Step 1: Create media container
    const containerUrl = `https://graph.facebook.com/v23.0/${igUserId}/media`;
    const containerRes = await fetch(containerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        image_url: post.imageUrl,
        caption: caption,
        access_token: accessToken
      })
    });
    
    const containerData = await containerRes.json();

    if (!containerRes.ok || !containerData.id) {
      return NextResponse.json({ error: "Failed to create Instagram media container: " + JSON.stringify(containerData) }, { status: 400 });
    }

    const creationId = containerData.id;

    // Step 2: Publish media container
    const publishUrl = `https://graph.facebook.com/v23.0/${igUserId}/media_publish`;
    const publishRes = await fetch(publishUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        creation_id: creationId,
        access_token: accessToken
      })
    });
    
    const publishData = await publishRes.json();

    if (!publishRes.ok || !publishData.id) {
      return NextResponse.json({ error: "Failed to publish Instagram media: " + JSON.stringify(publishData) }, { status: 400 });
    }

    return NextResponse.json({ success: true, id: publishData.id });
  } catch (error: any) {
    console.error("Instagram API Error:", error);
    return NextResponse.json({ error: "Internal Server Error: " + error.message }, { status: 500 });
  }
}
