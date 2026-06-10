import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content, hashtags, ctaLink, disclaimer, imageUrl } = body;

    if (!content) {
      return NextResponse.json({ error: 'Post content is required' }, { status: 400 });
    }

    const FACEBOOK_PAGE_ID = process.env.FACEBOOK_PAGE_ID;
    const FACEBOOK_PAGE_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

    if (!FACEBOOK_PAGE_ID || !FACEBOOK_PAGE_ACCESS_TOKEN) {
      return NextResponse.json({ error: 'Facebook credentials are not configured in the environment' }, { status: 500 });
    }

    // Format the final message exactly as it would be copied
    const tags = hashtags ? hashtags.join(' ') : '';
    const link = ctaLink ? `🔗 ${ctaLink}` : '';
    const disc = disclaimer ? `⚠️ ${disclaimer}` : '';
    
    // Combine them with newlines
    const message = [content, tags, link, disc].filter(Boolean).join('\n\n');

    const url = `https://graph.facebook.com/v19.0/${FACEBOOK_PAGE_ID}/feed`;
    
    const bodyPayload: any = {
      message: message,
      access_token: FACEBOOK_PAGE_ACCESS_TOKEN
    };
    
    if (ctaLink) {
      bodyPayload.link = ctaLink;
    } else if (imageUrl) {
      bodyPayload.link = imageUrl;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyPayload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[FACEBOOK API ERROR]', data);
      return NextResponse.json({ error: data.error?.message || 'Failed to post to Facebook' }, { status: response.status });
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (error: any) {
    console.error('[FACEBOOK API CATCH ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
