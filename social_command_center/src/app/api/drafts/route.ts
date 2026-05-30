import { NextResponse } from 'next/server';
import { generateDraft, CTA_LINK, DISCLAIMER } from '@/lib/ai';
import { getPosts, savePost, deletePost, Post } from '@/lib/db';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

// Configure the email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

export async function GET() {
  const posts = await getPosts();
  return NextResponse.json({ posts });
}

export async function POST(request: Request) {
  try {
    const { topic } = await request.json();
    
    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const aiResult = await generateDraft(topic);

    const newPost: Post = {
      id: crypto.randomUUID(),
      title: topic,
      content: aiResult.content,
      hashtags: aiResult.hashtags,
      status: 'Draft',
      createdAt: new Date().toISOString(),
      ctaLink: CTA_LINK,
      disclaimer: DISCLAIMER
    };

    await savePost(newPost);

    return NextResponse.json({ post: newPost });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const postData = await request.json();
    
    if (!postData.id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    await savePost(postData);

    // Send Real Email Notification for status changes
    if (postData.status === 'Needs Review' || postData.status === 'Approved') {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: process.env.SMTP_USER, // Sending to yourself so you can see it instantly!
          subject: `Facebook Draft Update: ${postData.title}`,
          html: `
            <h2>Post Status Updated</h2>
            <p>The post <strong>"${postData.title}"</strong> has been updated to: <strong>${postData.status}</strong></p>
            <hr />
            <h3>Post Content:</h3>
            <p style="white-space: pre-wrap;">${postData.content}</p>
            <p>${postData.hashtags.join(' ')}</p>
            <p>Log in to the Social Command Center to review.</p>
          `
        });
        console.log(`[EMAIL SENT] Notification sent for post "${postData.title}"`);
      } catch (emailError) {
        console.error('[EMAIL ERROR] Failed to send email:', emailError);
      }
    }

    return NextResponse.json({ success: true, post: postData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
