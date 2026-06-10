import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content, hashtags, ctaLink, disclaimer, imageUrl } = body;

    if (!content) {
      return NextResponse.json({ error: 'Post content is required' }, { status: 400 });
    }

    const LINKEDIN_ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN;
    const LINKEDIN_AUTHOR_URN = process.env.LINKEDIN_AUTHOR_URN;

    if (!LINKEDIN_ACCESS_TOKEN || !LINKEDIN_AUTHOR_URN) {
      return NextResponse.json({ error: 'LinkedIn credentials are not configured in the environment' }, { status: 500 });
    }

    // Format the final message exactly as it would be copied
    const tags = hashtags ? hashtags.join(' ') : '';
    const link = ctaLink ? `🔗 ${ctaLink}` : '';
    const disc = disclaimer ? `⚠️ ${disclaimer}` : '';
    
    // Combine them with newlines
    const message = [content, tags, link, disc].filter(Boolean).join('\n\n');

    const url = "https://api.linkedin.com/v2/ugcPosts";
    
    const payload: any = {
        author: LINKEDIN_AUTHOR_URN,
        lifecycleState: "PUBLISHED",
        specificContent: {
            "com.linkedin.ugc.ShareContent": {
                shareCommentary: {
                    text: message
                },
                shareMediaCategory: (ctaLink || imageUrl) ? "ARTICLE" : "NONE"
            }
        },
        visibility: {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
        }
    };

    if (ctaLink || imageUrl) {
        payload.specificContent["com.linkedin.ugc.ShareContent"].media = [
            {
                status: "READY",
                originalUrl: imageUrl || ctaLink
            }
        ];
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
        'X-Restli-Protocol-Version': '2.0.0',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[LINKEDIN API ERROR]', data);
      return NextResponse.json({ error: data.message || 'Failed to post to LinkedIn' }, { status: response.status });
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (error: any) {
    console.error('[LINKEDIN API CATCH ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
