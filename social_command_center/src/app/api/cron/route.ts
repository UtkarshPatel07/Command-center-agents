import { NextResponse } from 'next/server';
import { getPosts, savePost } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const posts = await getPosts();
    const now = new Date();
    
    // Find posts that are Planned and their plannedDate has passed
    const duePosts = posts.filter(p => 
      p.status === 'Planned' && 
      p.plannedDate && 
      new Date(p.plannedDate) <= now
    );

    for (const post of duePosts) {
      // In a full production environment, this is where we would call the Facebook/LinkedIn APIs.
      // For this implementation, we will update the status to 'Posted'.
      post.status = 'Posted';
      await savePost(post);
      console.log(`[CRON] Automatically published post: ${post.title}`);
    }

    return NextResponse.json({ 
      success: true, 
      publishedCount: duePosts.length,
      message: `Processed ${duePosts.length} scheduled posts.`
    });
  } catch (error: any) {
    console.error('[CRON ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
