import fs from 'fs/promises';
import path from 'path';

export type PostStatus = 'Draft' | 'Needs Review' | 'Approved' | 'Planned' | 'Posted' | 'Failed' | 'Cancelled';

export interface Post {
  id: string;
  title: string;
  content: string;
  status: PostStatus;
  createdAt: string;
  plannedDate?: string;
  hashtags: string[];
  ctaLink: string;
  disclaimer: string;
  imageUrl?: string;
}

const DB_PATH = path.join(process.cwd(), 'mock_db.json');

async function readDb(): Promise<{ posts: Post[] }> {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return { posts: [] };
  }
}

async function writeDb(data: { posts: Post[] }): Promise<void> {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export async function getPosts(): Promise<Post[]> {
  try {
    const db = await readDb();
    return db.posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error("Error getting posts from local DB", error);
    return [];
  }
}

export async function savePost(post: Post): Promise<void> {
  try {
    const db = await readDb();
    const existingIndex = db.posts.findIndex(p => p.id === post.id);
    
    if (existingIndex >= 0) {
      db.posts[existingIndex] = post;
    } else {
      db.posts.push(post);
    }
    
    await writeDb(db);
  } catch (error) {
    console.error("Error saving post to local DB", error);
  }
}

export async function deletePost(id: string): Promise<void> {
  try {
    const db = await readDb();
    db.posts = db.posts.filter(p => p.id !== id);
    await writeDb(db);
  } catch (error) {
    console.error("Error deleting post from local DB", error);
  }
}
