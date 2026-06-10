import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, content, hashtags, ctaLink, disclaimer, imageUrl } = body;

    if (!content) {
      return NextResponse.json({ error: 'Post content is required' }, { status: 400 });
    }

    const REDDIT_CLIENT_ID = process.env.REDDIT_CLIENT_ID;
    const REDDIT_CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET;
    const REDDIT_USERNAME = process.env.REDDIT_USERNAME;
    const REDDIT_PASSWORD = process.env.REDDIT_PASSWORD;
    const REDDIT_SUBREDDIT = process.env.REDDIT_SUBREDDIT || 'test'; // Default to a test subreddit if not set

    if (!REDDIT_CLIENT_ID || !REDDIT_CLIENT_SECRET || !REDDIT_USERNAME || !REDDIT_PASSWORD) {
      return NextResponse.json({ error: 'Reddit credentials are not configured in the environment' }, { status: 500 });
    }

    // 1. Get Access Token
    const authString = Buffer.from(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`).toString('base64');
    const tokenRes = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'SocialCommandCenterBot/1.0'
      },
      body: new URLSearchParams({
        grant_type: 'password',
        username: REDDIT_USERNAME,
        password: REDDIT_PASSWORD
      })
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('[REDDIT AUTH ERROR]', tokenData);
      return NextResponse.json({ error: 'Failed to authenticate with Reddit' }, { status: 401 });
    }
    const accessToken = tokenData.access_token;

    // 2. Format the Message
    const tags = hashtags ? hashtags.join(' ') : '';
    const link = ctaLink ? `🔗 ${ctaLink}` : '';
    const disc = disclaimer ? `⚠️ ${disclaimer}` : '';
    
    const messageBody = [content, tags, link, disc].filter(Boolean).join('\n\n');
    // If an image is provided, append it to the text post so it renders inline on Reddit
    const finalMessage = imageUrl ? `[Image Attachment](${imageUrl})\n\n${messageBody}` : messageBody;

    // 3. Post to Subreddit
    const postRes = await fetch('https://oauth.reddit.com/api/submit', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'SocialCommandCenterBot/1.0'
      },
      body: new URLSearchParams({
        sr: REDDIT_SUBREDDIT,
        kind: 'self',
        title: title || content.substring(0, 50) + '...',
        text: finalMessage
      })
    });

    const postData = await postRes.json();

    if (!postRes.ok || !postData.success) {
      console.error('[REDDIT POST ERROR]', postData);
      return NextResponse.json({ error: postData?.message || 'Failed to post to Reddit' }, { status: postRes.status || 500 });
    }

    return NextResponse.json({ success: true, id: postData.jquery[10][3][0] || 'success' });
  } catch (error: any) {
    console.error('[REDDIT API CATCH ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
