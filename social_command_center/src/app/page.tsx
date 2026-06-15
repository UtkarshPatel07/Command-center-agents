'use client';

import React, { useState, useEffect } from 'react';
import { Post, PostStatus } from '@/lib/db';
import { Plus, Loader2, Copy, Trash2, Edit3, Send, CheckCircle2 } from 'lucide-react';

export default function CommandDashboard() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [topicInput, setTopicInput] = useState('');
  const [language, setLanguage] = useState('English');
  const [isGenerating, setIsGenerating] = useState(false);
  const [scheduleDates, setScheduleDates] = useState<Record<string, string>>({});

  const statuses: PostStatus[] = ['Draft', 'Needs Review', 'Approved', 'Planned', 'Posted'];

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/drafts');
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicInput.trim()) return;
    
    setIsGenerating(true);
    try {
      const res = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topicInput, language })
      });
      const data = await res.json();
      if (res.ok && data.post) {
        setPosts([data.post, ...posts]);
        setTopicInput('');
      } else {
        alert(`Failed to generate draft: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      alert(`Network error: Failed to generate draft`);
    } finally {
      setIsGenerating(false);
    }
  };

  const updatePost = async (post: Post, updates: Partial<Post>) => {
    const updated = { ...post, ...updates };
    setPosts(posts.map(p => p.id === post.id ? updated : p));
    
    try {
      await fetch('/api/drafts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (err) {
      console.error("Failed to update post");
    }
  };

  const copyForManual = (post: Post) => {
    const text = `${post.content}\n\n${post.hashtags.join(' ')}\n\n🔗 ${post.ctaLink}\n\n⚠️ ${post.disclaimer}`;
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard! Ready for manual posting.");
  };

  const autoPostToFacebook = async (post: Post) => {
    try {
      const res = await fetch('/api/facebook', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(post) });
      if (res.ok) { alert("Successfully posted to Facebook!"); updatePost(post, { status: 'Posted' }); }
      else { alert(`Failed to post to Facebook: ${(await res.json()).error}`); }
    } catch (err) { alert("Error connecting to Facebook API"); }
  };

  const autoPostToLinkedIn = async (post: Post) => {
    try {
      const res = await fetch('/api/linkedin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(post) });
      if (res.ok) { alert("Successfully posted to LinkedIn!"); updatePost(post, { status: 'Posted' }); }
      else { alert(`Failed to post to LinkedIn: ${(await res.json()).error}`); }
    } catch (err) { alert("Error connecting to LinkedIn API"); }
  };

  const autoPostToTelegram = async (post: Post) => {
    try {
      const res = await fetch('/api/telegram', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(post) });
      if (res.ok) { alert("Successfully posted to Telegram!"); updatePost(post, { status: 'Posted' }); }
      else { alert(`Failed to post to Telegram: ${(await res.json()).error}`); }
    } catch (err) { alert("Error connecting to Telegram API"); }
  };

  const autoPostToReddit = async (post: Post) => {
    try {
      const res = await fetch('/api/reddit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(post) });
      if (res.ok) { alert("Successfully posted to Reddit!"); updatePost(post, { status: 'Posted' }); }
      else { alert(`Failed to post to Reddit: ${(await res.json()).error}`); }
    } catch (err) { alert("Error connecting to Reddit API"); }
  };

  const autoPostToInstagram = async (post: Post) => {
    if (!post.imageUrl) {
      alert("Instagram requires an image! Please attach an Image URL to this draft before posting.");
      return;
    }
    try {
      const res = await fetch('/api/instagram', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(post) });
      if (res.ok) { alert("Successfully posted to Instagram!"); updatePost(post, { status: 'Posted' }); }
      else { alert(`Failed to post to Instagram: ${(await res.json()).error}`); }
    } catch (err) { alert("Error connecting to Instagram API"); }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Loader2 className="animate-spin" size={48} color="var(--accent-color)" />
    </div>;
  }

  return (
    <main style={{ padding: '40px', maxWidth: '1600px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '38px', fontWeight: 700, marginBottom: '8px', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px' }}>
            Social Command Center
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>Multi-Platform Automated Publishing & Approval Workflow</p>
        </div>
      </header>

      <section className="glass-panel" style={{ marginBottom: '40px' }}>
        <h2 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: 600 }}>Generate AI Draft</h2>
        <form onSubmit={handleGenerate} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder="What should we post about? (e.g. Benefits of AI in Trading)" 
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            disabled={isGenerating}
            style={{ flex: '1 1 400px' }}
          />
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)} 
            disabled={isGenerating}
            style={{ flex: '0 0 160px' }}
          >
            <option value="English">🇬🇧 English</option>
            <option value="French">🇫🇷 French</option>
            <option value="Spanish">🇪🇸 Spanish</option>
            <option value="Mandarin">🇨🇳 Mandarin</option>
          </select>
          <button type="submit" className="button" disabled={isGenerating} style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '180px', justifyContent: 'center' }}>
            {isGenerating ? <Loader2 size={18} className="animate-spin"/> : <Plus size={18} />}
            {isGenerating ? 'Generating...' : 'Create Draft'}
          </button>
        </form>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {statuses.map(status => (
          <div key={status} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '650px', background: 'rgba(15, 23, 42, 0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--panel-border)', paddingBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: status === 'Approved' ? 'var(--success-color)' : status === 'Needs Review' ? 'var(--warning-color)' : 'var(--accent-color)' }}></div>
                <h3 style={{ fontSize: '18px', fontWeight: 600 }}>{status}</h3>
              </div>
              <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 600 }}>
                {posts.filter(p => p.status === status).length}
              </span>
            </div>
            
            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', paddingRight: '8px' }}>
              {posts.filter(p => p.status === status).map(post => (
                <div key={post.id} className="post-card" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '20px', borderRadius: '16px', boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)', lineHeight: 1.4 }}>{post.title}</h4>
                  
                  {post.imageUrl && (
                    <img src={post.imageUrl} alt="Post attachment" style={{ width: '100%', borderRadius: '8px', marginBottom: '12px', objectFit: 'cover', maxHeight: '200px' }} />
                  )}
                  
                  <div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
                    <input
                      type="url"
                      placeholder="Image URL (optional)"
                      value={post.imageUrl || ''}
                      onChange={(e) => updatePost(post, { imageUrl: e.target.value })}
                      style={{ flex: 1, fontSize: '13px', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                    />
                  </div>

                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {post.content}
                  </p>
                  
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
                    {post.hashtags.map(tag => (
                      <span key={tag} style={{ fontSize: '12px', color: 'var(--accent-color)', background: 'rgba(59, 130, 246, 0.1)', padding: '4px 10px', borderRadius: '6px', fontWeight: 500 }}>{tag}</span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                    {post.status === 'Draft' && <button onClick={() => updatePost(post, { status: 'Needs Review' })} className="button secondary" style={{ width: '100%' }}>Send to Review</button>}
                    {post.status === 'Needs Review' && <button onClick={() => updatePost(post, { status: 'Approved' })} className="button" style={{ width: '100%', background: 'var(--success-color)' }}><CheckCircle2 size={16} style={{display:'inline', marginRight:'6px', verticalAlign:'text-bottom'}}/>Approve Post</button>}
                    
                    {post.status === 'Approved' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%' }}>
                        <button onClick={() => autoPostToFacebook(post)} className="button" style={{ fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'var(--fb-color)' }}>
                          <Send size={14} /> FB Post
                        </button>
                        <button onClick={() => autoPostToLinkedIn(post)} className="button" style={{ fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'var(--li-color)' }}>
                          <Send size={14} /> LI Post
                        </button>
                        <button onClick={() => autoPostToTelegram(post)} className="button" style={{ fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'var(--tg-color)' }}>
                          <Send size={14} /> TG Post
                        </button>
                        <button onClick={() => autoPostToReddit(post)} className="button" style={{ fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#FF4500' }}>
                          <Send size={14} /> Reddit
                        </button>
                        <button onClick={() => autoPostToInstagram(post)} className="button" style={{ fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' }}>
                          <Send size={14} /> IG Post
                        </button>
                        <button onClick={() => copyForManual(post)} className="button secondary" style={{ fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', gridColumn: 'span 2' }}>
                          <Copy size={14} /> Copy for Manual Post
                        </button>
                      </div>
                    )}

                    {post.status === 'Approved' && (
                      <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '8px', flexWrap: 'wrap' }}>
                        <input 
                          type="datetime-local" 
                          value={scheduleDates[post.id] || ''}
                          onChange={(e) => setScheduleDates({...scheduleDates, [post.id]: e.target.value})}
                          style={{ flex: '1 1 140px', minWidth: 0 }}
                        />
                        <button 
                          onClick={() => scheduleDates[post.id] && updatePost(post, { status: 'Planned', plannedDate: scheduleDates[post.id] })} 
                          className="button secondary" 
                          style={{ flex: '0 0 auto' }}
                        >
                          Schedule
                        </button>
                      </div>
                    )}
                    
                    {post.status === 'Planned' && (
                      <div style={{ width: '100%', fontSize: '13px', color: 'var(--accent-color)', marginBottom: '8px', background: 'rgba(59, 130, 246, 0.1)', padding: '12px', borderRadius: '8px', textAlign: 'center', fontWeight: 500 }}>
                        📅 Scheduled for: {new Date(post.plannedDate!).toLocaleString()}
                      </div>
                    )}

                    {(post.status === 'Approved' || post.status === 'Planned') && (
                      <button onClick={() => updatePost(post, { status: 'Posted' })} className="button secondary" style={{ width: '100%' }}>Mark as Manually Posted</button>
                    )}

                    {post.status !== 'Cancelled' && post.status !== 'Posted' && (
                      <button onClick={() => updatePost(post, { status: 'Cancelled' })} className="button secondary" style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--danger-color)', border: 'none', background: 'transparent' }}>
                        Cancel Post
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {posts.filter(p => p.status === status).length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px', marginTop: '60px', opacity: 0.5 }}>
                  No posts found
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
