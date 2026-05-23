import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { ThemeProvider } from './lib/ThemeContext';
import { Navbar, PostCard, Footer } from './components/Navigation';
import { Toaster, toast } from 'react-hot-toast';
import { cn, getApiUrl } from './lib/utils';
import { 
  TrendingUp, 
  Users, 
  Bookmark, 
  MessageCircle,
  LayoutDashboard, 
  PlusCircle, 
  ArrowRight,
  Zap,
  Star,
  Globe,
  PenSquare,
  Home as HomeIcon,
  TrendingUp as TrendingIcon,
  BookMarked,
  Settings as SettingsIcon,
  Trash2
} from 'lucide-react';
import { motion } from 'motion/react';

import { Editor } from './pages/Editor';
import { PostDetail } from './pages/PostDetail';
import Library from './pages/Library';
import Settings from './pages/Settings';
import { db } from './lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, where, addDoc, serverTimestamp, getDocs, deleteDoc } from 'firebase/firestore';

// Subcomponents for the Editorial layout
function LeftSidebar() {
  const location = useLocation();
  const { user, profile } = useAuth();

  return (
    <aside className="hidden lg:flex w-20 border-r border-card-border bg-card-bg flex-col items-center py-8 gap-10 shrink-0 sticky top-16 h-[calc(100vh-64px)]">
      <Link to="/" className={cn("sidebar-icon-btn group", location.pathname === '/' && "bg-indigo-500/10 text-indigo-500")}>
        <HomeIcon className="w-6 h-6" />
      </Link>
      <Link to="/communities" className={cn("sidebar-icon-btn group", location.pathname === '/communities' && "bg-indigo-500/10 text-indigo-500")}>
        <Users className="w-6 h-6" />
      </Link>
      <Link to="/trending" className={cn("sidebar-icon-btn group", location.pathname === '/trending' && "bg-indigo-500/10 text-indigo-500")}>
        <TrendingIcon className="w-6 h-6" />
      </Link>
      <Link to="/library" className={cn("sidebar-icon-btn group", location.pathname === '/library' && "bg-indigo-500/10 text-indigo-500")}>
        <BookMarked className="w-6 h-6" />
      </Link>
      <div className="mt-auto mb-4 flex flex-col gap-6 items-center">
        {user && (
          <Link to="/library" className="group relative">
            <img 
              src={profile?.photoURL || user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
              className="w-10 h-10 rounded-full border-2 border-background shadow-md group-hover:scale-110 transition-transform" 
              alt="Profile" 
            />
            <div className="absolute inset-0 rounded-full bg-indigo-500/10 scale-0 group-hover:scale-125 transition-transform" />
          </Link>
        )}
        <Link to="/settings" className={cn("sidebar-icon-btn group", location.pathname === '/settings' && "bg-indigo-500/10 text-indigo-500")}>
          <SettingsIcon className="w-6 h-6" />
        </Link>
      </div>
    </aside>
  );
}

function RightSidebar() {
  const [trending, setTrending] = React.useState<any[]>([]);

  React.useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('likesCount', 'desc'), limit(5));
    const unsub = onSnapshot(q, (snap) => {
      setTrending(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      console.warn("Index or query error on likesCount, falling back to createdAt:", err);
      const fallbackQ = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(5));
      onSnapshot(fallbackQ, (snap) => {
        setTrending(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    });
    return () => unsub();
  }, []);

  return (
    <aside className="hidden xl:flex w-80 border-l border-card-border bg-card-bg p-6 shrink-0 flex-col gap-10 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto scrollbar-hide">
      <div className="relative p-6 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 rounded-[2rem] text-white shadow-2xl shadow-indigo-500/20 group overflow-hidden">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-700"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-indigo-200" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-100">PLATFORM STATS</span>
          </div>
          <div className="space-y-4">
             <div className="flex justify-between items-end">
                <div className="text-2xl font-black italic">12.8k</div>
                <div className="text-[10px] font-bold text-indigo-200 uppercase mb-1">Weekly Readers</div>
             </div>
             <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: '75%' }} transition={{ duration: 2 }} className="h-full bg-indigo-300" />
             </div>
             <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                   <div className="text-sm font-bold">2.4k</div>
                   <div className="text-[10px] text-indigo-200 uppercase font-black">Deep Insights</div>
                </div>
                <div>
                   <div className="text-sm font-bold">842</div>
                   <div className="text-[10px] text-indigo-200 uppercase font-black">Active Hubs</div>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Trending Insights</h5>
          <TrendingIcon className="w-4 h-4 text-slate-500" />
        </div>
        <div className="space-y-6">
          {trending.map((post, i) => (
            <Link key={post.id} to={`/post/${post.id}`} className="flex gap-4 group">
              <span className="text-2xl font-black text-indigo-500/20 group-hover:text-indigo-600 transition-colors duration-300">0{i+1}</span>
              <div className="space-y-1">
                <h6 className="text-sm font-black text-foreground line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors uppercase tracking-tight italic">{post.title}</h6>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-slate-500 font-bold uppercase">{post.authorName}</span>
                  <div className="w-1 h-1 bg-card-border rounded-full"></div>
                  <span className="text-[9px] text-indigo-500 font-bold uppercase">{post.category || 'Opinion'}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="space-y-6 pt-4 border-t border-card-border">
        <div className="flex justify-between items-center">
          <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Neural News</h5>
          <div className="flex gap-1 items-center">
             <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
             <span className="text-[9px] font-black text-red-500 uppercase tracking-tighter">Live Transmission</span>
          </div>
        </div>
        <div className="space-y-4">
           {[
             { title: 'OpenAI unveils GPT-4o Realtime API for latency-free voice', source: 'Verge', time: '5m' },
             { title: 'Nvidia H200 chips start shipping to cloud providers', source: 'Reuters', time: '22m' },
             { title: 'Mistral Large 2 sets new open-weights benchmark', source: 'AI Hub', time: '41m' }
           ].map((news, i) => (
             <div key={i} className="group cursor-pointer hover:bg-surface-muted p-2 -mx-2 rounded-xl transition-all">
                <h6 className="text-[11px] font-black text-foreground leading-snug mb-1 group-hover:text-indigo-600 transition-colors uppercase tracking-tight italic">{news.title}</h6>
                <div className="flex items-center gap-2 text-[8px] font-black text-slate-500 uppercase tracking-widest">
                   <span className="text-indigo-500">{news.source}</span>
                   <div className="w-0.5 h-0.5 bg-card-border rounded-full"></div>
                   <span>{news.time} ago</span>
                </div>
             </div>
           ))}
        </div>
      </div>

      <div className="space-y-6 pt-4 border-t border-card-border">
        <div className="flex justify-between items-center">
          <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Trending Discussions</h5>
          <MessageCircle className="w-3 h-3 text-slate-500" />
        </div>
        <div className="space-y-4">
           {[
             { topic: 'The Ethics of AGI', posts: 124, growth: '+12%' },
             { topic: 'Neuro-Symbolic UI', posts: 82, growth: '+25%' },
             { topic: 'Post-Desktop Era', posts: 56, growth: '+5%' }
           ].map((disc, i) => (
             <Link key={i} to={`/?q=${encodeURIComponent(disc.topic)}`} className="group block">
                <div className="flex items-center justify-between mb-1">
                   <span className="text-xs font-black text-foreground group-hover:text-indigo-600 transition-colors uppercase italic">#{disc.topic}</span>
                   <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">{disc.growth}</span>
                </div>
                <div className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">{disc.posts} active contributions</div>
             </Link>
           ))}
        </div>
      </div>

      <div className="space-y-6 pt-4 border-t border-card-border">
        <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Activity Feed</h5>
        <div className="space-y-5">
           {[
             { user: 'Satoshi N.', action: 'loved', target: 'Evolution of LLMs', time: '2m' },
             { user: 'Elena Rey', action: 'joined', target: 'Neural Design Hub', time: '12m' },
             { user: 'Marcus K.', action: 'published', target: 'Ethical Silicon', time: '45m' }
           ].map((act, i) => (
             <div key={i} className="flex gap-3 items-start p-3 hover:bg-surface-muted rounded-2xl transition-colors">
                <div className="w-8 h-8 rounded-full bg-input-bg flex items-center justify-center font-bold text-slate-400 text-[10px]">
                  {act.user[0]}
                </div>
                <div>
                   <p className="text-xs text-slate-400 font-medium leading-normal italic">
                     <span className="font-black text-foreground">{act.user}</span> {act.action} <span className="text-indigo-500 font-black">"{act.target}"</span>
                   </p>
                   <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{act.time} ago</span>
                </div>
             </div>
           ))}
        </div>
      </div>

      <div className="mt-auto border-t border-card-border pt-6">
        <div className="flex justify-between items-center mb-4">
          <h5 className="text-[10px] font-black text-foreground uppercase tracking-widest">Top Curators</h5>
          <Link to="/creators" className="text-[10px] font-black text-indigo-600 hover:premium-gradient-text transition-all uppercase tracking-widest">View All</Link>
        </div>
        <div className="flex -space-x-3">
          {[1,2,3,4].map(i => (
             <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-slate-200 overflow-hidden shadow-sm">
               <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=user${i+5}`} alt="avatar" />
             </div>
          ))}
          <div className="w-10 h-10 rounded-full border-2 border-background bg-indigo-600 flex items-center justify-center text-[10px] text-white font-black shadow-sm">+12</div>
        </div>
      </div>
    </aside>
  );
}

// Pages
function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [livePosts, setLivePosts] = React.useState<any[]>([]);
  const [trendingPosts, setTrendingPosts] = React.useState<any[]>([]);
  const [topCreators, setTopCreators] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [newsletterEmail, setNewsletterEmail] = React.useState('');
  const [newsletterLoading, setNewsletterLoading] = React.useState(false);
  const [followingIds, setFollowingIds] = React.useState<Set<string>>(new Set());
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const searchQuery = searchParams.get('q')?.toLowerCase();

  React.useEffect(() => {
    // Main Feed
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(20));
    const unsubFeed = onSnapshot(q, (snap) => {
      let posts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      if (searchQuery) {
        posts = posts.filter(p => 
          p.title?.toLowerCase().includes(searchQuery) || 
          p.content?.toLowerCase().includes(searchQuery) ||
          p.category?.toLowerCase() === searchQuery ||
          p.category?.toLowerCase().includes(searchQuery)
        );
      }
      setLivePosts(posts);
      setLoading(false);
    });

    // Trending Section - using viewsCount or likesCount
    const trendingQ = query(collection(db, 'posts'), orderBy('likesCount', 'desc'), limit(3));
    const unsubTrending = onSnapshot(trendingQ, (snap) => {
      if (snap.empty) {
        // Fallback to latest posts if no liked posts exist
        const fallbackQ = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(3));
        onSnapshot(fallbackQ, (fallbackSnap) => {
          setTrendingPosts(fallbackSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
        });
      } else {
        setTrendingPosts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
      }
    }, (err) => {
      console.warn("Index or query error on likesCount, falling back to createdAt:", err);
      const fallbackQ = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(3));
      onSnapshot(fallbackQ, (fallbackSnap) => {
        setTrendingPosts(fallbackSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
      });
    });

    // Creators Smarter
    const creatorsQ = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(30));
    const unsubCreators = onSnapshot(creatorsQ, (snap) => {
      const posts = snap.docs.map(doc => doc.data());
      const authorMap = new Map();
      posts.forEach(post => {
        if (!authorMap.has(post.authorId)) {
          authorMap.set(post.authorId, {
            id: post.authorId,
            name: post.authorName,
            photo: post.authorPhoto,
            likes: post.likesCount || 0
          });
        } else {
          authorMap.get(post.authorId).likes += (post.likesCount || 0);
        }
      });
      setTopCreators(Array.from(authorMap.values()).sort((a,b) => b.likes - a.likes).slice(0, 3));
    });

    return () => {
      unsubFeed();
      unsubTrending();
      unsubCreators();
    };
  }, [searchQuery]);

  React.useEffect(() => {
    if (!user) {
      setFollowingIds(new Set());
      return;
    }

    const q = query(collection(db, 'follows'), where('followerId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const ids = new Set(snap.docs.map(doc => doc.data().followingId));
      setFollowingIds(ids);
    });

    return () => unsub();
  }, [user]);

  const toggleFollow = async (creatorId: string) => {
    if (!user) {
      toast.error('Identify required. Sign in to follow.', {
        style: { borderRadius: '16px', background: '#0f172a', color: '#fff', border: '1px solid rgba(79, 70, 229, 0.2)' }
      });
      return;
    }

    if (creatorId === user.uid) return;

    try {
      const isFollowing = followingIds.has(creatorId);
      const followId = `${user.uid}_${creatorId}`;
      
      if (isFollowing) {
        // Unfollow
        const q = query(collection(db, 'follows'), where('followerId', '==', user.uid), where('followingId', '==', creatorId));
        const snap = await getDocs(q);
        const deletePromises = snap.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        toast.success('Frequency detached.', {
          style: { borderRadius: '16px', background: '#0f172a', color: '#fff' }
        });
      } else {
        // Follow
        await addDoc(collection(db, 'follows'), {
          followerId: user.uid,
          followingId: creatorId,
          createdAt: serverTimestamp()
        });
        toast.success('Neural link established.', {
          style: { borderRadius: '16px', background: '#0f172a', color: '#fff', border: '1px solid #4f46e5' }
        });
      }
    } catch (error) {
      console.error('Follow error:', error);
      toast.error('Protocol failed.');
    }
  };

  const featuredPost = livePosts[0];
  const otherPosts = livePosts.slice(featuredPost ? 1 : 0);

  const handleNewsletterSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    
    setNewsletterLoading(true);
    try {
      // 1. Save to local database (Firestore)
      await addDoc(collection(db, 'subscribers'), {
        email: newsletterEmail.toLowerCase().trim(),
        subscribedAt: serverTimestamp()
      });

      // 2. Trigger email confirmation via backend
      await fetch(getApiUrl('/api/newsletter/subscribe'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail.toLowerCase().trim() })
      });

      toast.success('Transmission link secured. Welcome onboard.', {
        icon: '🚀',
        style: {
          borderRadius: '16px',
          background: '#0f172a',
          color: '#fff',
          border: '1px solid rgba(79, 70, 229, 0.2)'
        }
      });
      setNewsletterEmail('');
    } catch (error) {
      console.error('Newsletter error:', error);
      toast.error('Neural uplink failed. Please try again.');
    } finally {
      setNewsletterLoading(false);
    }
  };

  return (
    <div className="flex flex-1 lg:overflow-hidden lg:h-full">
      <LeftSidebar />
      <main className="flex-1 lg:overflow-y-auto lg:h-[calc(100vh-64px)] scroll-smooth scrollbar-hide">
        
        {/* 1. HERO SECTION */}
        {!searchQuery && (
          <section className="px-4 sm:px-8 pt-4 md:pt-8">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative py-12 md:py-24 px-6 md:px-20 bg-card-bg border border-card-border rounded-[2.5rem] md:rounded-[4rem] overflow-hidden text-foreground group"
            >
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 dark:opacity-20 pointer-events-none"></div>
              <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-600/10 via-transparent to-transparent pointer-events-none"></div>
              <div className="relative z-10 flex flex-col items-start gap-6 md:gap-8 max-w-3xl">
                <div className="px-4 md:px-6 py-2 bg-indigo-600 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] shadow-2xl shadow-indigo-900/20 text-white">
                  ESTABLISHED 2026 • LUMINA v4.0
                </div>
                <h1 className="text-4xl sm:text-6xl lg:text-8xl font-black tracking-tighter leading-[0.9] italic">
                  Discover ideas, <br /><span className="premium-gradient-text">stories & community discussions.</span>
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-lg md:text-xl leading-relaxed font-bold max-w-xl italic">
                  The definitive platform for thought leaders. Engage with curated stories and modern design.
                </p>
                <div className="flex flex-wrap items-center gap-6 md:gap-8 mt-4">
                  <Link to="/trending" className="btn-primary w-full sm:w-auto px-12 py-5 text-xs tracking-widest uppercase shadow-[0_0_40px_rgba(79,70,229,0.3)] text-center">Explore Stories</Link>
                  <div className="flex items-center gap-4">
                     <div className="flex -space-x-3">
                        {[1,2,3,4].map(i => (
                          <img key={i} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=hero${i+50}`} className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-background shadow-xl" alt="user" />
                        ))}
                     </div>
                     <span className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">12.4k Active Readers</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </section>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 md:py-20 space-y-20 md:space-y-32">
          
          {/* LIVE TRANSMISSION TICKER */}
          {!searchQuery && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 bg-card-bg border border-card-border p-2 pl-6 rounded-2xl shadow-sm overflow-hidden whitespace-nowrap"
            >
               <div className="flex items-center gap-3 shrink-0">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-black text-foreground uppercase tracking-widest italic">Live Content Feed</span>
               </div>
               <div className="w-px h-6 bg-card-border"></div>
               <div className="flex gap-12 whitespace-nowrap overflow-hidden">
                  <div className="flex gap-12 animate-float whitespace-nowrap">
                    {[
                      "RESEARCH: AGI development accelerated by 18% in Q1 2026",
                      "CYBER: New quantum-resistant encryption models deployed across Lumina",
                      "SILICON: Global Summit: Neural hardware breakthrough in Tokyo",
                      "SYNTHESIS: Meta releases 'Horizon 5' sentient environment"
                    ].map((text, i) => (
                      <span key={i} className="text-[11px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-3">
                        <span className="text-indigo-500 italic">#{i+1}</span> {text}
                      </span>
                    ))}
                  </div>
               </div>
            </motion.div>
          )}
          
          {/* 2. TRENDING POSTS */}
          {!searchQuery && (
            <section className="space-y-12">
               <div className="flex items-baseline justify-between mb-8">
                  <div className="space-y-1">
                    <h2 className="text-2xl md:text-4xl font-black tracking-tighter text-foreground uppercase italic">Trending <span className="text-indigo-600">Stories</span></h2>
                    <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-widest">Popular Discussions</p>
                  </div>
                  <Link to="/trending" className="text-[9px] md:text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b-2 border-indigo-500/20 hover:border-indigo-600 transition-all pb-1">View Full</Link>
               </div>
               <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {loading ? (
                    [1,2,3].map(i => <div key={i} className="editorial-card aspect-[4/5] animate-pulse bg-surface-muted" />)
                  ) : trendingPosts.length > 0 ? trendingPosts.map((post, i) => (
                    <Link key={post.id} to={`/post/${post.id}`} className="group relative aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl border border-card-border block">
                        {post.coverImage && <img src={post.coverImage} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="cover" />}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-8 text-white w-full">
                           <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-3">0{i+1} • {post.category || 'POST'}</div>
                           <h3 className="text-xl font-black leading-tight tracking-tight group-hover:text-indigo-200 transition-colors uppercase italic">{post.title}</h3>
                        </div>
                    </Link>
                  )) : (
                    [1,2,3].map(i => (
                      <div key={i} className="editorial-card aspect-[4/5] bg-background border-dashed flex flex-col items-center justify-center text-center p-8 opacity-50">
                        <Zap className="w-8 h-8 text-slate-400 mb-4" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Posts Found</p>
                        <p className="text-[8px] font-bold mt-2">Create a post to start sharing with the world.</p>
                      </div>
                    ))
                  )}
               </div>
            </section>
          )}

          {/* 3. TOP WRITERS */}
          {!searchQuery && (
            <section className="space-y-12">
               <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl md:text-4xl font-black tracking-tighter text-foreground uppercase italic">Top <span className="premium-gradient-text">Writers</span></h2>
                    <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-widest text">The best storytellers on the platform</p>
                  </div>
                  <Link to="/creators" className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">View All</Link>
               </div>
               <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
                  {topCreators.map((creator, i) => (
                    <div key={creator.id} className="editorial-card p-8 flex flex-col items-center text-center group hover:-translate-y-2 transition-all duration-500">
                        <div className="relative mb-6">
                           <img 
                            src={creator.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.id}`} 
                            className="w-20 h-20 rounded-full border-4 border-card-bg shadow-2xl relative z-10" 
                            alt="avatar" 
                           />
                           <div className="absolute -bottom-2 -right-1 w-6 h-6 bg-slate-950 text-white flex items-center justify-center rounded-full text-[9px] font-black z-20 shadow-lg">#{i+1}</div>
                        </div>
                        <h4 className="text-lg font-black text-foreground tracking-tight italic">{creator.name}</h4>
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1">Featured Writer</p>
                        <div className="mt-6 flex gap-6 text-[10px] font-black text-slate-400 border-t border-card-border pt-6 w-full justify-center uppercase tracking-widest">
                           <div><span className="text-foreground">{Math.floor(creator.likes/10)}k</span> Karma</div>
                           <div><span className="text-foreground">Ver. 2.0</span> Profile</div>
                        </div>
                        {user?.uid !== creator.id && (
                          <button 
                            onClick={() => toggleFollow(creator.id)}
                            className={cn(
                              "mt-6 w-full py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                              followingIds.has(creator.id) 
                                ? "bg-card-bg border border-card-border text-slate-400 hover:text-red-500 hover:border-red-500/50" 
                                : "bg-indigo-600 text-white hover:bg-white hover:text-indigo-600 shadow-lg shadow-indigo-600/20"
                            )}
                          >
                            {followingIds.has(creator.id) ? 'Uplinked' : 'Follow Link'}
                          </button>
                        )}
                    </div>
                  ))}
               </div>
            </section>
          )}

          {/* 4. POPULAR CATEGORIES */}
          <section className="py-12 md:py-20 border-y border-card-border overflow-hidden">
             <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-12 md:mb-16 gap-4">
                <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-foreground uppercase italic">Topic <span className="text-indigo-600">Hubs</span></h2>
                <p className="text-slate-400 text-xs md:text-sm font-medium leading-relaxed px-4">Explore diverse categories and specialized communities from writers across the globe.</p>
             </div>
             <div className="flex flex-wrap justify-center gap-3 md:gap-4 px-4 overflow-x-auto scrollbar-hide pb-2">
                {[
                  { name: 'Philosophy', icon: <Globe className="w-4 h-4"/>, color: 'indigo' },
                  { name: 'Strategy', icon: <TrendingUp className="w-4 h-4"/>, color: 'emerald' },
                  { name: 'AI Lab', icon: <Zap className="w-4 h-4"/>, color: 'violet' },
                  { name: 'Design', icon: <Users className="w-4 h-4"/>, color: 'slate' },
                  { name: 'Deep Tech', icon: <LayoutDashboard className="w-4 h-4"/>, color: 'blue' }
                ].map(hub => (
                  <button 
                    key={hub.name} 
                    onClick={() => {
                      navigate(`/?q=${hub.name}`);
                    }}
                    className={cn(
                      "px-10 py-5 bg-card-bg border-2 border-card-border rounded-3xl flex items-center gap-4 hover:border-indigo-600 hover:shadow-xl transition-all group active:scale-95",
                      searchQuery === hub.name.toLowerCase() && "border-indigo-600 shadow-xl bg-indigo-500/5"
                    )}
                  >
                     <div className="p-3 bg-surface-muted rounded-2xl group-hover:bg-indigo-500/10 group-hover:text-indigo-600 transition-colors scale-90 group-hover:scale-100 text-slate-400">
                        {hub.icon}
                     </div>
                     <span className="text-xs font-black text-foreground uppercase tracking-[0.2em]">{hub.name}</span>
                  </button>
                ))}
             </div>
          </section>

          {/* 5. COMMUNITY DISCUSSIONS / Pulse */}
          {!searchQuery && (
            <section className="grid lg:grid-cols-[1fr_400px] gap-12 lg:gap-20">
               <div className="space-y-10 md:space-y-12">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-600 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-xl shadow-indigo-500/20">
                        <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-white" />
                     </div>
                     <div>
                        <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-foreground uppercase italic leading-none md:leading-tight">Digital <span className="premium-gradient-text">Agoras</span></h2>
                        <p className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Active Community Transmissions</p>
                     </div>
                  </div>
                  <div className="space-y-4 md:space-y-6">
                     {[
                       { user: 'Satoshi N.', text: 'The structural integrity of this thesis is unparalleled...', topic: 'Ethical AGI', time: '2m' },
                       { user: 'Elena V.', text: 'Have we considered the quantum hardware constraints here?', topic: 'Neural Design', time: '14m' },
                       { user: 'Marcus K.', text: 'Decentralized intelligence is no longer a theory, it is a protocol.', topic: 'Silicon Economics', time: '41m' }
                     ].map((cmt, i) => (
                       <div key={i} className="editorial-card p-8 hover:bg-surface-muted transition-colors group">
                          <div className="flex items-start justify-between mb-4">
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[10px] font-black text-indigo-500 tracking-widest">{cmt.user[0]}</div>
                                <span className="text-xs font-black text-foreground uppercase tracking-tight">{cmt.user}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">In #{cmt.topic}</span>
                             </div>
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{cmt.time}</span>
                          </div>
                          <p className="text-slate-400 text-sm font-medium leading-relaxed italic border-l-2 border-indigo-500/20 pl-4">"{cmt.text}"</p>
                       </div>
                     ))}
                  </div>
               </div>
               <div className="editorial-card p-10 bg-slate-950 text-white relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/30 rounded-full blur-[80px]"></div>
                  <div className="relative z-10 flex flex-col gap-6">
                     <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-indigo-400">
                        <TrendingUp className="w-6 h-6" />
                     </div>
                     <h3 className="text-3xl font-black italic tracking-tighter leading-tight">Neural Market Intelligence</h3>
                     <p className="text-indigo-200 text-xs font-medium leading-relaxed">Platform-wide engagement up by <span className="text-emerald-400 font-black">+24%</span> this cycle. High density observed in <span className="text-white font-bold">"Design Philosophy"</span> layer.</p>
                  </div>
                  <div className="pt-8 mt-8 border-t border-white/10 space-y-4">
                     <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                        <span className="text-indigo-200/50">Engagement Quotient</span>
                        <span className="text-indigo-400">0.82</span>
                     </div>
                     <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: '82%' }} transition={{ duration: 1.5 }} className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 shadow-[0_0_10px_rgba(129,140,248,1)]" />
                     </div>
                  </div>
               </div>
            </section>
          )}

          {/* 6. NEURAL DISCOVERY (THE FEED) */}
          <section className="space-y-16">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-8 py-8 border-b-2 border-card-border">
              <div className="space-y-2 text-center sm:text-left">
                <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase italic">
                  {searchQuery ? (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <span>Refining: "{searchQuery}"</span>
                      <button 
                        onClick={() => navigate('/')}
                        className="text-[10px] font-black text-indigo-600 bg-indigo-500/10 px-4 py-2 rounded-full hover:bg-indigo-600 hover:text-white transition-all cursor-pointer inline-flex items-center gap-2"
                      >
                         <Trash2 className="w-3 h-3" /> Clear Filter
                      </button>
                    </div>
                  ) : (
                    <>Neural <span className="text-indigo-600">Discovery</span></>
                  )}
                </h2>
                <div className="flex items-center gap-4 justify-center sm:justify-start">
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Intelligence Flow Active</span>
                   </div>
                   <div className="w-8 h-px bg-card-border"></div>
                   <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">Optimized For You</p>
                </div>
              </div>
              <div className="flex bg-input-bg border border-card-border rounded-3xl p-1.5 shadow-inner">
                <button className="px-10 py-3.5 bg-card-bg text-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-black/5 dark:shadow-black/20">Recents</button>
                <button className="px-10 py-3.5 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-foreground transition-colors">High Delta</button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-x-16 gap-y-24">
              {loading ? (
                [1, 2, 3, 4].map(i => (
                  <div key={i} className="space-y-8 animate-pulse">
                    <div className="aspect-[4/3] bg-surface-muted rounded-[3rem]" />
                    <div className="h-8 w-3/4 bg-surface-muted rounded-full" />
                    <div className="h-4 w-1/2 bg-surface-muted rounded-full" />
                  </div>
                ))
              ) : (
                (searchQuery ? livePosts : otherPosts).map(post => (
                  <Link key={post.id} to={`/post/${post.id}`}>
                    <PostCard post={post} />
                  </Link>
                ))
              )}
            </div>
            
            {/* 7. NEWSLETTER SECTION */}
            {!searchQuery && (
              <section className="editorial-card p-16 bg-slate-950 text-white flex flex-col lg:flex-row items-center justify-between gap-16 group overflow-hidden relative shadow-3xl shadow-indigo-200/20">
                <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none group-hover:bg-indigo-600/25 transition-all duration-1000"></div>
                <div className="max-w-xl relative z-10 space-y-8">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center rotate-12 group-hover:rotate-0 transition-transform duration-500 shadow-2xl">
                     <Zap className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-5xl font-black tracking-tighter leading-[0.95] italic">The Architect's <br /><span className="premium-gradient-text">Neural Transmission</span></h3>
                  <p className="text-slate-400 text-xl leading-relaxed font-medium">
                    Join 12,000+ pioneers receiving the definitive synthesis of AI, design philosophy, and digital craftsmanship. 
                  </p>
                  <form onSubmit={handleNewsletterSubscribe} className="flex flex-col sm:flex-row gap-4 p-2 bg-white/5 rounded-3xl border border-white/10 shadow-inner group-focus-within:border-indigo-500/50 transition-all">
                    <input 
                      type="email" 
                      required
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder="synapse@architect.hq" 
                      className="flex-1 bg-transparent border-none px-6 py-4 text-white outline-none placeholder:text-slate-700 font-bold uppercase tracking-widest text-[10px]" 
                    />
                    <button 
                      type="submit"
                      disabled={newsletterLoading}
                      className="bg-indigo-600 hover:bg-white hover:text-indigo-600 px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-500 shadow-xl shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {newsletterLoading ? 'Securing...' : 'Secure Link'}
                    </button>
                  </form>
                </div>
                <div className="relative hidden lg:block group-hover:scale-105 transition-transform duration-1000">
                  <div className="w-80 h-80 bg-gradient-to-br from-indigo-500 to-violet-700 rounded-[5rem] rotate-12 flex items-center justify-center p-14 group-hover:rotate-6 transition-all duration-700 shadow-3xl shadow-indigo-500/30">
                    <PenSquare className="w-32 h-32 text-white" />
                  </div>
                  <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-slate-900 shadow-3xl border-2 border-white/5 rounded-[4rem] -rotate-6 group-hover:rotate-0 transition-all duration-700 flex items-center justify-center backdrop-blur-xl">
                     <div className="text-center">
                        <div className="text-5xl font-black tracking-tighter italic">98.4%</div>
                        <div className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.2em] mt-2">Precision Rate</div>
                     </div>
                  </div>
                </div>
              </section>
            )}
          </section>
        </div>
        <Footer />
      </main>
      <RightSidebar />
    </div>
  );
}

function Communities() {
  const cats = [
    { name: 'Machine Learning', icon: <Zap className="w-5 h-5"/>, members: '4.5k' },
    { name: 'Philosophy', icon: <Globe className="w-5 h-5"/>, members: '12k' },
    { name: 'Startups', icon: <Star className="w-5 h-5"/>, members: '8.2k' },
    { name: 'Creative Writing', icon: <PenSquare className="w-5 h-5"/>, members: '15k' }
  ]
  return (
    <div className="flex flex-1 lg:overflow-hidden lg:h-full">
      <LeftSidebar />
      <main className="flex-1 lg:overflow-y-auto px-4 sm:px-8 py-12 lg:h-[calc(100vh-64px)] scrollbar-hide">
        <h1 className="text-4xl font-black tracking-tighter text-foreground mb-12 uppercase italic">Universal <span className="text-indigo-600">Hubs</span></h1>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {cats.map((cat, i) => (
            <div key={i} className="editorial-card p-10 text-center hover:border-indigo-500/50 cursor-pointer transition-all group flex flex-col items-center">
              <div className="w-14 h-14 bg-surface-muted border border-card-border rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-indigo-500/10 transition-all text-slate-400 group-hover:text-indigo-600">
                {cat.icon}
              </div>
              <h3 className="text-xl font-black mb-3 text-foreground tracking-tight italic">{cat.name}</h3>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{cat.members} contributors</p>
            </div>
          ))}
        </div>
        <div className="mt-20 -mx-8">
          <Footer />
        </div>
      </main>
    </div>
  );
}

function Trending() {
  const [livePosts, setLivePosts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('likesCount', 'desc'), limit(20));
    const unsub = onSnapshot(q, (snap) => {
      if (snap.empty) {
        const fallbackQ = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(20));
        const unsubFallback = onSnapshot(fallbackQ, (fallbackSnap) => {
          setLivePosts(fallbackSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
          setLoading(false);
        });
        return () => unsubFallback();
      } else {
        setLivePosts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
        setLoading(false);
      }
    }, (err) => {
      console.warn("Index or query error on likesCount, falling back to createdAt:", err);
      const fallbackQ = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(20));
      const unsubFallback = onSnapshot(fallbackQ, (fallbackSnap) => {
        setLivePosts(fallbackSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
        setLoading(false);
      });
      return () => unsubFallback();
    });
    return () => unsub();
  }, []);

  return (
    <div className="flex flex-1 lg:overflow-hidden lg:h-full">
      <LeftSidebar />
      <main className="flex-1 lg:overflow-y-auto px-4 sm:px-8 py-8 lg:h-[calc(100vh-64px)] scroll-smooth scrollbar-hide">
        <div className="max-w-5xl mx-auto space-y-12 pb-20">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-3xl font-black tracking-tighter text-foreground uppercase italic">Trending Insights</h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">High engagement transmissions.</p>
            </div>
          </div>

          <section>
            {loading ? (
              <div className="grid md:grid-cols-2 gap-8">
                {[1, 2, 4].map(i => (
                  <div key={i} className="editorial-card aspect-[4/3] animate-pulse bg-surface-muted" />
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-8">
                {livePosts.length > 0 ? (
                  livePosts.map(post => (
                    <Link key={post.id} to={`/post/${post.id}`}>
                      <PostCard post={post} />
                    </Link>
                  ))
                ) : (
                  <div className="col-span-full py-20 editorial-card text-center text-slate-400">
                     <TrendingIcon className="w-12 h-12 mx-auto mb-4 opacity-10" />
                     <p className="font-bold uppercase tracking-widest text-[10px]">Transmission Pending...</p>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
        <Footer />
      </main>
      <RightSidebar />
    </div>
  );
}

function Creators() {
  const { user } = useAuth();
  const [creators, setCreators] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [followingIds, setFollowingIds] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    if (!user) {
      setFollowingIds(new Set());
      return;
    }

    const q = query(collection(db, 'follows'), where('followerId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const ids = new Set(snap.docs.map(doc => doc.data().followingId));
      setFollowingIds(ids);
    });

    return () => unsub();
  }, [user]);

  const toggleFollow = async (creatorId: string) => {
    if (!user) {
      toast.error('Identify required. Sign in to follow.');
      return;
    }
    if (creatorId === user.uid) return;

    try {
      if (followingIds.has(creatorId)) {
        const q = query(collection(db, 'follows'), where('followerId', '==', user.uid), where('followingId', '==', creatorId));
        const snap = await getDocs(q);
        await Promise.all(snap.docs.map(doc => deleteDoc(doc.ref)));
        toast.success('Frequency detached.');
      } else {
        await addDoc(collection(db, 'follows'), {
          followerId: user.uid,
          followingId: creatorId,
          createdAt: serverTimestamp()
        });
        toast.success('Neural link established.');
      }
    } catch (error) {
      console.error('Follow error:', error);
      toast.error('Protocol failed.');
    }
  };

  React.useEffect(() => {
    // In a real app, we'd have a users collection. 
    // Here we derive top creators from recent posts for the demo.
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(50));
    return onSnapshot(q, (snap) => {
      const posts = snap.docs.map(doc => doc.data());
      const authorMap = new Map();
      
      posts.forEach(post => {
        if (!authorMap.has(post.authorId)) {
          authorMap.set(post.authorId, {
            id: post.authorId,
            name: post.authorName,
            photo: post.authorPhoto,
            postsCount: 1,
            totalLikes: post.likesCount || 0
          });
        } else {
          const auth = authorMap.get(post.authorId);
          auth.postsCount++;
          auth.totalLikes += (post.likesCount || 0);
        }
      });

      setCreators(Array.from(authorMap.values()).sort((a, b) => b.totalLikes - a.totalLikes));
      setLoading(false);
    });
  }, []);

  return (
    <div className="flex flex-1 lg:overflow-hidden lg:h-full">
      <LeftSidebar />
      <main className="flex-1 lg:overflow-y-auto px-4 sm:px-8 py-8 lg:h-[calc(100vh-64px)] scroll-smooth scrollbar-hide">
        <div className="max-w-5xl mx-auto space-y-12 pb-20">
          <div className="space-y-1">
            <h2 className="text-3xl font-black tracking-tighter text-foreground uppercase italic">Top Curators</h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Collective intelligence architects.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
               [1,2,3].map(i => <div key={i} className="editorial-card h-48 animate-pulse bg-surface-muted" />)
            ) : creators.map((creator, i) => (
              <div key={creator.id} className="editorial-card p-10 flex flex-col items-center text-center group hover:border-indigo-500/50 transition-all">
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-indigo-500 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity"></div>
                  <img 
                    src={creator.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.id}`} 
                    className="w-24 h-24 rounded-full border-4 border-card-bg shadow-2xl relative z-10"
                    alt={creator.name} 
                  />
                  <div className="absolute -bottom-2 -right-1 bg-slate-950 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-xl z-20 border-2 border-background">
                    RANK #{i + 1}
                  </div>
                </div>
                <h3 className="font-black text-foreground text-xl mb-2 italic tracking-tighter">{creator.name}</h3>
                <p className="text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Neural Architect</p>
                <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8 px-4 h-12 line-clamp-2 italic">
                  Building the future of human-computer synthesis through decentralized intelligence and high-fidelity design systems.
                </p>
                <div className="grid grid-cols-2 w-full border-t border-card-border pt-8 gap-4">
                  <div className="text-left bg-surface-muted p-4 rounded-2xl">
                    <div className="text-lg font-black text-foreground tracking-tighter">{creator.postsCount}</div>
                    <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Theses</div>
                  </div>
                  <div className="text-left bg-surface-muted p-4 rounded-2xl">
                    <div className="text-lg font-black text-foreground tracking-tighter">{creator.totalLikes}</div>
                    <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Karma</div>
                  </div>
                </div>
                {user?.uid !== creator.id && (
                  <button 
                    onClick={() => toggleFollow(creator.id)}
                    className={cn(
                      "w-full mt-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                      followingIds.has(creator.id)
                        ? "bg-card-bg border border-card-border text-slate-400 hover:text-red-500 hover:border-red-500/50"
                        : "bg-indigo-600 text-white hover:bg-white hover:text-indigo-600 shadow-lg shadow-indigo-600/20"
                    )}
                  >
                    {followingIds.has(creator.id) ? 'Uplinked' : 'Follow Link'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        <Footer />
      </main>
      <RightSidebar />
    </div>
  );
}

function Bookmarks() {
  const [bookmarks, setBookmarks] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // For demo, we show the same highly liked posts as bookmarks
    const q = query(collection(db, 'posts'), orderBy('likesCount', 'desc'), limit(5));
    const unsub = onSnapshot(q, (snap) => {
      setBookmarks(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
      setLoading(false);
    }, (err) => {
      console.warn("Index or query error on likesCount, falling back to createdAt:", err);
      const fallbackQ = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(5));
      onSnapshot(fallbackQ, (snap) => {
        setBookmarks(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
        setLoading(false);
      });
    });
    return () => unsub();
  }, []);

  return (
    <div className="flex flex-1 lg:overflow-hidden lg:h-full">
      <LeftSidebar />
      <main className="flex-1 lg:overflow-y-auto px-4 sm:px-8 py-8 lg:h-[calc(100vh-64px)] scroll-smooth scrollbar-hide">
        <div className="max-w-5xl mx-auto space-y-12 pb-20">
          <div className="space-y-4">
             <div className="flex items-center gap-3">
                <Bookmark className="w-8 h-8 text-indigo-600" />
                <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase italic">Saved Theses</h2>
             </div>
             <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Your curated laboratory of intelligence.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {loading ? (
               [1,2].map(i => <div key={i} className="editorial-card h-64 animate-pulse bg-surface-muted" />)
            ) : bookmarks.length > 0 ? (
              bookmarks.map(post => (
                <Link key={post.id} to={`/post/${post.id}`}>
                  <PostCard post={post} />
                </Link>
              ))
            ) : (
              <div className="col-span-full py-32 editorial-card text-center text-slate-400 border-dashed bg-surface-muted/50">
                 <Bookmark className="w-16 h-16 mx-auto mb-6 opacity-10" />
                 <p className="text-lg font-black uppercase tracking-widest italic">Laboratory Empty</p>
                 <p className="text-xs font-bold mt-2">Start curating insights from the main feed.</p>
                 <Link to="/" className="btn-primary mt-8 inline-block">Explore Feed</Link>
              </div>
            )}
          </div>
        </div>
        <Footer />
      </main>
      <RightSidebar />
    </div>
  );
}

export default function App() {
  React.useEffect(() => {
    const seedDatabaseIfEmpty = async () => {
      try {
        const postsCol = collection(db, 'posts');
        const snap = await getDocs(query(postsCol, limit(1)));
        if (snap.empty) {
          console.log("Seeding Firestore with premium curated starter essays...");
          const seedPosts = [
            {
              title: "The Ethics of AGI: Aligning Sentience with Human Flourishing",
              category: "Ethics",
              coverImage: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=1200",
              authorId: "system_curator_1",
              authorName: "Lumina Research",
              authorPhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=lumina_system",
              likesCount: 124,
              viewsCount: 1240,
              commentsCount: 12,
              content: `
The acceleration of computing power has brought us to a profound crossroad. As deep learning models transition from narrow task execution into broader cognitive agents, we are forced to redefine the boundaries of artificial intelligence. It is no longer a question of *when* these models will influence our lives, but *to what degree* we can align their development with fundamental human values.

> "The true metric of technology is not its absolute power, but the refinement of its alignment with human thriving." 
> — Synapse Editorial Board

## Core Architectures and Modern Paradigms

Synthesizing human intent is not merely a technical challenge of fine-tuning weights. It requires a fundamental paradigm shift in how we structure our systems:

1. **Neuro-Symbolic Integration**: Fusing deep neural learning with rule-based symbolic reasoning to establish deterministic guardrails.
2. **Dynamic Constitutional Training**: Training models in multi-agent environments where reward mechanisms are tied to robust ethical frameworks.
3. **Decentralized Verification Arrays**: Running independent validation nodes to monitor model boundaries in real-time.

## The Human-Machine Synthesis

As we build these systems, our goal must not be substitution, but amplification. Designing interfaces that facilitate bidirectional understanding allows humans and machines to operate as high-bandwidth cognitive collectives. This symbiotic union holds the key to solving our most complex scientific, social, and philosophical frontiers.
              `.trim(),
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            },
            {
              title: "Neuro-Symbolic UI & The Architecture of Conversational Spatial Canvas",
              category: "Design",
              coverImage: "https://images.unsplash.com/photo-1541462608143-67571c6738dd?auto=format&fit=crop&q=80&w=1200",
              authorId: "system_curator_2",
              authorName: "Curator's Lounge",
              authorPhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=curators_lounge",
              likesCount: 82,
              viewsCount: 980,
              commentsCount: 7,
              content: `
The classical computer interface has remained practically unchanged for over three decades. Folders, windows, and pointer cursors are desktop abstractions built for another century. Today, as context-aware computing and spatial technologies reach maturity, we are witnessing the dawn of a new design ecosystem.

> "The screen is no longer a canvas; it is an active conversational partner."
> — Curator's Lounge, v4.0

## Principles of Fluid Spatial Design

Creating interfaces for this new paradigm requires departing from static layouts. Instead, we must embrace three core pillars of responsive spatial architecture:

* **Intent-Driven Contextuality**: Interfaces that dynamically reconstruct themselves based on user gaze, biometric rhythms, and historical tasks.
* **Low-Latency Kinetic Feedback**: Multi-modal physical response structures that synchronize virtual actions with high-fidelity haptic feedback.
* **Cross-Reality Semantic Interoperability**: Seamlessly translating digital assets from 2D viewports into spatial environments.

## The Next Interface Shift

We are moving away from traditional app boundaries toward dynamic, agentic interactions. In this near future, you will not open an application; you will orchestrate streams of intelligence that manifest contextually, precisely when and where your cognitive focus demands them.
              `.trim(),
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            },
            {
              title: "Beyond the Vector: Navigating Cryptographic Autonomy in a Quantum World",
              category: "Quantum",
              coverImage: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=1200",
              authorId: "system_curator_3",
              authorName: "Satoshi Legacy",
              authorPhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=legacy",
              likesCount: 95,
              viewsCount: 1120,
              commentsCount: 15,
              content: `
In a fully connected digital ecosystem, security is not just a feature—it is the bedrock of sovereignty. As quantum processing capabilities advance toward cryptographic viability, our current secure standards risk obsolescence. The race is on to deploy encryption architectures that remain impenetrable to quantum attacks.

> "Security is a continuous movement of adaptive resistance, not a final state of perfection."
> — Cyber-Security Network Bulletin

## Pillars of Quantum-Resistant Sovereignty
To secure cyber corridors, we coordinate a multi-layered cryptographic paradigm across all intelligence nodes:

1. **Lattice-Based Encryption Protocols**: Standardizing complex mathematical lattices that are theoretically impossible for quantum computers to solve.
2. **Ephemeral Quantum Key Distribution (QKD)**: Utilizing fiber-optic networks to send keys encoded in single light photons, ensuring immediate detection of any eavesdropping.
3. **Multi-Signature Peer Authentication**: Distributing trust across diverse, independent verification nodes to eliminate single failure routes.

## Securing the Neural Streams

As high-speed cognitive networks expand, safeguarding the sanity of data transfers becomes paramount. We are building the next generation of transport architectures to guarantee that human and machine transmissions remain absolutely private, verified, and safe from observation.
              `.trim(),
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            }
          ];

          for (const post of seedPosts) {
            await addDoc(postsCol, post);
          }
        }
      } catch (err) {
        console.error("Auto-seeding error:", err);
      }
    };
    seedDatabaseIfEmpty();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen lg:h-screen flex flex-col lg:overflow-hidden bg-background text-foreground transition-colors duration-300">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/create" element={<Editor />} />
              <Route path="/edit/:id" element={<Editor />} />
              <Route path="/library" element={<Library />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/post/:id" element={<PostDetail />} />
              <Route path="/communities" element={<Communities />} />
              <Route path="/trending" element={<Trending />} />
              <Route path="/creators" element={<Creators />} />
              <Route path="/bookmarks" element={<Bookmarks />} />
            </Routes>
            <Toaster position="bottom-right" />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
