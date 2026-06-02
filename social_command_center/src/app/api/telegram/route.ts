import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content, hashtags, ctaLink, disclaimer } = body;

    if (!content) {
      return NextResponse.json({ error: 'Post content is required' }, { status: 400 });
    }

    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      return NextResponse.json({ error: 'Telegram credentials are not configured in the environment' }, { status: 500 });
    }

    // Format the final message
    const tags = hashtags ? hashtags.join(' ') : '';
    const link = ctaLink ? `🔗 ${ctaLink}` : '';
    const disc = disclaimer ? `⚠️ ${disclaimer}` : '';
    
    // Combine them with newlines
    const text = [content, tags, link, disc].filter(Boolean).join('\n\n');

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: text,
        parse_mode: 'HTML'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[TELEGRAM API ERROR]', data);
      return NextResponse.json({ error: data.description || 'Failed to post to Telegram' }, { status: response.status });
    }

    return NextResponse.json({ success: true, message_id: data.result.message_id });
  } catch (error: any) {
    console.error('[TELEGRAM API CATCH ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
