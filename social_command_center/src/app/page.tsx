'use client';

import React, { useState, useEffect } from 'react';
import { Post, PostStatus } from '@/lib/db';
import { Plus, Loader2, Copy, Trash2, Edit3, Send } from 'lucide-react';

export default function CommandDashboard() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [topicInput, setTopicInput] = useState('');
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
        body: JSON.stringify({ topic: topicInput })
      });
      const data = await res.json();
      if (data.post) {
        setPosts([data.post, ...posts]);
        setTopicInput('');
      }
    } catch (err) {
      alert("Failed to generate draft");
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

  const copyForFacebook = (post: Post) => {
    const text = `${post.content}\n\n${post.hashtags.join(' ')}\n\n🔗 ${post.ctaLink}\n\n⚠️ ${post.disclaimer}`;
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard! Ready to paste into Facebook.");
  };

  const autoPostToFacebook = async (post: Post) => {
    try {
      const res = await fetch('/api/facebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post)
      });
      const data = await res.json();
      
      if (res.ok) {
        alert("Successfully posted to Facebook!");
        updatePost(post, { status: 'Posted' });
      } else {
        alert(`Failed to post to Facebook: ${data.error}`);
      }
    } catch (err) {
      alert("Error connecting to Facebook API");
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Loader2 className="animate-spin" size={48} color="#3b82f6" />
    </div>;
  }

  return (
    <main style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '32px', marginBottom: '8px', background: 'linear-gradient(to right, #3b82f6, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Social Media Command Center
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manual Publishing & Approval Workflow</p>
        </div>
      </header>

      <section className="glass-panel" style={{ marginBottom: '40px' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '20px' }}>Generate New Draft</h2>
        <form onSubmit={handleGenerate} style={{ display: 'flex', gap: '16px' }}>
          <input 
            type="text" 
            placeholder="e.g. The importance of trailing stop losses in volatile markets" 
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            disabled={isGenerating}
          />
          <button type="submit" className="button" disabled={isGenerating} style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '160px', justifyContent: 'center' }}>
            {isGenerating ? <Loader2 size={18} className="animate-spin"/> : <Plus size={18} />}
            {isGenerating ? 'Generating...' : 'Create Draft'}
          </button>
        </form>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        {statuses.map(status => (
          <div key={status} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--panel-border)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>{status}</h3>
              <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>
                {posts.filter(p => p.status === status).length}
              </span>
            </div>
            
            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '8px' }}>
              {posts.filter(p => p.status === status).map(post => (
                <div key={post.id} style={{ background: 'rgba(15,23,42,0.4)', border: '1px solid var(--panel-border)', padding: '16px', borderRadius: '12px' }}>
                  <h4 style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--accent-color)' }}>{post.title}</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {post.content}
                  </p>
                  
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    {post.hashtags.map(tag => (
                      <span key={tag} style={{ fontSize: '11px', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 6px', borderRadius: '4px' }}>{tag}</span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {post.status === 'Draft' && <button onClick={() => updatePost(post, { status: 'Needs Review' })} className="button secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>Send to Review</button>}
                    {post.status === 'Needs Review' && <button onClick={() => updatePost(post, { status: 'Approved' })} className="button" style={{ padding: '6px 12px', fontSize: '12px', background: 'var(--success-color)' }}>Approve</button>}
                    
                    {post.status === 'Approved' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => copyForFacebook(post)} className="button" style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Copy size={14} /> Copy
                        </button>
                        <button onClick={() => autoPostToFacebook(post)} className="button" style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', background: '#1877F2' }}>
                          <Send size={14} /> Auto Post
                        </button>
                      </div>
                    )}

                    {post.status === 'Approved' && (
                      <div style={{ display: 'flex', gap: '4px', width: '100%', marginTop: '8px' }}>
                        <input 
                          type="datetime-local" 
                          style={{ padding: '6px', fontSize: '12px' }}
                          value={scheduleDates[post.id] || ''}
                          onChange={(e) => setScheduleDates({...scheduleDates, [post.id]: e.target.value})}
                        />
                        <button 
                          onClick={() => scheduleDates[post.id] && updatePost(post, { status: 'Planned', plannedDate: scheduleDates[post.id] })} 
                          className="button secondary" 
                          style={{ padding: '6px 12px', fontSize: '12px', whiteSpace: 'nowrap' }}
                        >
                          Schedule
                        </button>
                      </div>
                    )}
                    
                    {post.status === 'Planned' && (
                      <div style={{ width: '100%', fontSize: '12px', color: 'var(--accent-color)', marginBottom: '8px', background: 'rgba(59, 130, 246, 0.1)', padding: '8px', borderRadius: '4px' }}>
                        📅 Scheduled for: {new Date(post.plannedDate!).toLocaleString()}
                      </div>
                    )}

                    {(post.status === 'Approved' || post.status === 'Planned') && (
                      <button onClick={() => updatePost(post, { status: 'Posted' })} className="button secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>Mark Posted</button>
                    )}

                    {post.status !== 'Cancelled' && post.status !== 'Posted' && post.status !== 'Failed' && (
                      <button onClick={() => updatePost(post, { status: 'Cancelled' })} className="button secondary" style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--danger-color)' }}>Cancel</button>
                    )}
                  </div>
                </div>
              ))}
              {posts.filter(p => p.status === status).length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', marginTop: '40px' }}>
                  No posts
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
