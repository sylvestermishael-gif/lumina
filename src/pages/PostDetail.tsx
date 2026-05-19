import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { formatDate, cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';
import { Heart, MessageCircle, Share2, Bookmark, ArrowLeft, Zap, Copy, Twitter, Linkedin, X } from 'lucide-react';
import { Navbar, PostCard, Footer } from '../components/Navigation';
import { motion, AnimatePresence } from 'motion/react';

import { useAuth } from '../lib/AuthContext';
import { toast } from 'react-hot-toast';

export function PostDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLiking, setIsLiking] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      const snap = await getDoc(doc(db, 'posts', id));
      if (snap.exists()) {
        setPost({ id: snap.id, ...snap.data() });
      }
      setLoading(false);
    };
    fetchPost();
  }, [id]);

  const handleLike = async () => {
    if (!user) {
      toast.error('Sign in to like posts');
      return;
    }
    if (!id || isLiking) return;

    setIsLiking(true);
    try {
      const postRef = doc(db, 'posts', id);
      await updateDoc(postRef, {
        likesCount: increment(1)
      });
      setPost(prev => ({ ...prev, likesCount: (prev.likesCount || 0) + 1 }));
      toast.success('Insight appreciated!');
    } catch (e) {
      toast.error('Failed to like');
    } finally {
      setIsLiking(false);
    }
  };

  const handleReaction = (emoji: string) => {
    if (!user) {
       toast.error('Sign in to react');
       return;
    }
    toast.success(`Reacted with ${emoji}`, {
      icon: emoji,
      className: "premium-toast"
    });
  };

  const handleShare = async () => {
    const shareData = {
      title: post?.title,
      text: `Check out this thesis on Lumina: ${post?.title}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      setIsShareModalOpen(true);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link captured to neural buffer', {
      className: "premium-toast"
    });
    setIsShareModalOpen(false);
  };

  const shareSocial = (platform: 'x' | 'linkedin') => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Intelligence transmission: ${post.title}`);
    const platforms = {
      x: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`
    };
    window.open(platforms[platform], '_blank');
    setIsShareModalOpen(false);
  };

  if (loading) return <div className="flex items-center justify-center h-[80vh]">
    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
  </div>;
  
  if (!post) return <div className="text-center py-20 text-slate-500">Post not found</div>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 pb-32">
      <div className="flex items-center justify-between mb-12">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-foreground transition-colors group font-black text-[10px] tracking-widest uppercase">
          <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" /> BACK TO INTELLIGENCE FEED
        </Link>
        <div className="flex items-center gap-6">
           <div className="text-right">
              <div className="text-[10px] font-black text-foreground uppercase tracking-widest">Post Engagement</div>
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">{post.views || 1240} Views • 8 Min Read</div>
           </div>
           <div className="w-px h-8 bg-card-border"></div>
           <div className="flex -space-x-2">
              {[1,2,3].map(i => (
                <img key={i} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=eng${i+40}`} className="w-8 h-8 rounded-full border-2 border-background shadow-sm" alt="engaged" />
              ))}
           </div>
        </div>
      </div>
      
      <header className="mb-14">
        <div className="flex items-center gap-4 mb-10">
          <img 
            src={post.authorPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorId}`} 
            className="w-14 h-14 rounded-full border-2 border-card-border shadow-xl" 
            alt="author" 
          />
          <div>
            <h4 className="font-black text-foreground text-lg italic tracking-tight">{post.authorName}</h4>
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-3">
              <span>{formatDate(post.createdAt)}</span>
              <div className="w-1 h-1 bg-card-border rounded-full"></div>
              <span className="text-indigo-600 underline underline-offset-4">{post.category || 'INSIGHT'}</span>
              <div className="w-1 h-1 bg-card-border rounded-full"></div>
              <span className="flex items-center gap-1.5"><MessageCircle className="w-3 h-3" /> 1 pace-setting discussion</span>
            </div>
          </div>
        </div>
        
        <h1 className="text-5xl sm:text-7xl font-black tracking-tighter leading-[0.95] mb-12 text-foreground italic">
          {post.title}
        </h1>

        {post.coverImage && (
          <div className="aspect-[21/10] w-full rounded-[3.5rem] overflow-hidden border border-card-border mb-16 shadow-3xl shadow-indigo-500/5 relative group">
            <img src={post.coverImage} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="cover" />
            <div className="absolute inset-0 bg-indigo-900/5 mix-blend-overlay"></div>
            <div className="absolute top-8 right-8 flex gap-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
               <button 
                onClick={handleShare}
                className="p-3 bg-card-bg/90 backdrop-blur-md rounded-2xl shadow-xl hover:bg-card-bg transition-colors border border-card-border"
               >
                  <Share2 className="w-4 h-4 text-foreground" />
               </button>
               <button 
                onClick={() => {
                  toast.success('Added to Synapse Bookmarks', {
                    className: "premium-toast"
                  });
                }}
                className="p-3 bg-card-bg/90 backdrop-blur-md rounded-2xl shadow-xl hover:bg-card-bg transition-colors border border-card-border"
               >
                  <Bookmark className="w-4 h-4 text-foreground" />
               </button>
            </div>
          </div>
        )}
      </header>

      <article className="prose prose-slate dark:prose-invert max-w-none text-slate-500 dark:text-slate-400 text-xl leading-[1.6] mb-24 prose-headings:text-foreground prose-headings:font-black prose-headings:tracking-tighter prose-strong:text-foreground prose-blockquote:border-l-4 prose-blockquote:border-indigo-600 prose-blockquote:bg-surface-muted prose-blockquote:px-8 prose-blockquote:py-6 prose-blockquote:rounded-r-3xl prose-blockquote:not-italic prose-blockquote:font-medium font-medium italic">
        <div className="markdown-body">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </div>
      </article>

      <footer className="pt-12 border-t-2 border-card-border mb-24">
        <div className="flex flex-col gap-10">
          <div className="flex flex-wrap gap-3">
             {['🤯', '🔥', '👏', '🧠', '💡', '💯'].map(emoji => (
               <button 
                 key={emoji}
                 onClick={() => handleReaction(emoji)}
                 className="w-12 h-12 bg-surface-muted hover:bg-indigo-500/10 hover:border-indigo-500/30 border border-card-border rounded-2xl flex items-center justify-center text-xl transition-all hover:-translate-y-1 active:scale-95"
               >
                  {emoji}
               </button>
             ))}
             <div className="w-px h-12 bg-card-border mx-2"></div>
             <button 
                onClick={handleLike}
                disabled={isLiking}
                className="px-8 bg-foreground text-background rounded-2xl flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50"
             >
                <Heart className={cn("w-5 h-5", isLiking ? "fill-red-500 stroke-red-500" : "fill-none")} />
                <span className="text-[10px] font-black uppercase tracking-widest">{post.likesCount || 0} Appreciations</span>
             </button>
             <button 
                onClick={handleShare}
                className="px-8 bg-card-bg border border-card-border hover:border-indigo-600 text-foreground rounded-2xl flex items-center gap-3 transition-all active:scale-95 group"
             >
                <Share2 className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                <span className="text-[10px] font-black uppercase tracking-widest">Share Thesis</span>
             </button>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-8 py-8 px-10 bg-surface-muted rounded-[2.5rem] border border-card-border">
             <div className="flex items-center gap-4">
                <div className="relative">
                   <img 
                    src={post.authorPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorId}`} 
                    className="w-16 h-16 rounded-full border-2 border-background shadow-lg" 
                    alt="author" 
                   />
                   <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center border-2 border-background">
                      <Zap className="w-3 h-3 text-white fill-white" />
                   </div>
                </div>
                <div>
                   <div className="text-lg font-black text-foreground tracking-tighter italic">Follow {post.authorName}</div>
                   <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Ranking #24 • Top 1% Curator</div>
                </div>
             </div>
             <button className="px-10 py-4 bg-card-bg border-2 border-card-border text-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-xl shadow-black/5 dark:shadow-black/20">
                Sync Connection
             </button>
          </div>
        </div>
      </footer>

      <div className="section-divider"></div>

      <section className="mb-32">
        <div className="flex items-center justify-between mb-12">
           <h3 className="text-3xl font-black tracking-tighter uppercase italic text-foreground">Neural <span className="premium-gradient-text">Recommendations</span></h3>
           <Link to="/" className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:underline">Return to Feed</Link>
        </div>
        <div className="grid md:grid-cols-2 gap-12">
           {[1, 2].map(i => (
             <div key={i} className="editorial-card h-40 animate-pulse bg-surface-muted border-dashed" />
           ))}
        </div>
      </section>

      {/* Share Modal */}
      <AnimatePresence>
        {isShareModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsShareModalOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-card-bg rounded-[3rem] p-10 shadow-3xl z-[101] border border-card-border"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black tracking-tighter uppercase italic text-foreground">Share <span className="text-indigo-600">Thesis</span></h3>
                <button onClick={() => setIsShareModalOpen(false)} className="p-2 hover:bg-surface-muted rounded-xl">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={copyLink}
                  className="w-full flex items-center justify-between p-5 bg-surface-muted hover:bg-indigo-500/10 border border-card-border hover:border-indigo-500/30 rounded-2xl transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-card-bg rounded-xl flex items-center justify-center shadow-sm">
                      <Copy className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground group-hover:text-indigo-600">Copy Link</span>
                  </div>
                </button>

                <button 
                  onClick={() => shareSocial('x')}
                  className="w-full flex items-center justify-between p-5 bg-surface-muted hover:bg-indigo-500/10 border border-card-border hover:border-indigo-500/30 rounded-2xl transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-card-bg rounded-xl flex items-center justify-center shadow-sm">
                      <Twitter className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground group-hover:text-indigo-600">Share to X</span>
                  </div>
                </button>

                <button 
                  onClick={() => shareSocial('linkedin')}
                  className="w-full flex items-center justify-between p-5 bg-surface-muted hover:bg-indigo-500/10 border border-card-border hover:border-indigo-500/30 rounded-2xl transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-card-bg rounded-xl flex items-center justify-center shadow-sm">
                      <Linkedin className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground group-hover:text-indigo-600">Share to LinkedIn</span>
                  </div>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="mt-20 -mx-6">
        <Footer />
      </div>
    </div>
  );
}
