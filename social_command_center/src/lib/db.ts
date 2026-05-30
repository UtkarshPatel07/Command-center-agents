import { MongoClient, ServerApiVersion } from 'mongodb';

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
}

const uri = process.env.MONGODB_URI as string;
const options = {
  tlsAllowInvalidCertificates: true,
  family: 4, // Force IPv4 to bypass Windows TLS/IPv6 bugs
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

async function connectToDb() {
  const connectedClient = await clientPromise;
  return connectedClient.db("SocialMediaPost");
}

export async function getPosts(): Promise<Post[]> {
  try {
    const db = await connectToDb();
    const posts = await db.collection('posts').find({}).sort({ createdAt: -1 }).toArray();
    return posts.map(p => ({
      id: p.id,
      title: p.title,
      content: p.content,
      status: p.status,
      createdAt: p.createdAt,
      plannedDate: p.plannedDate,
      hashtags: p.hashtags,
      ctaLink: p.ctaLink,
      disclaimer: p.disclaimer,
    })) as Post[];
  } catch (error) {
    console.error("Error getting posts from MongoDB", error);
    return [];
  }
}

export async function savePost(post: Post): Promise<void> {
  try {
    const db = await connectToDb();
    await db.collection('posts').updateOne(
      { id: post.id },
      { $set: post },
      { upsert: true }
    );
  } catch (error) {
    console.error("Error saving post to MongoDB", error);
  }
}

export async function deletePost(id: string): Promise<void> {
  try {
    const db = await connectToDb();
    await db.collection('posts').deleteOne({ id });
  } catch (error) {
    console.error("Error deleting post from MongoDB", error);
  }
}
