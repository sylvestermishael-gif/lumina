import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { Link } from 'react-router-dom';
import { Edit, Trash2, BookOpen, Clock, Zap, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { formatDate } from '../lib/utils';

export default function Library() {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchPosts = async () => {
      try {
        const q = query(
          collection(db, 'posts'),
          where('authorId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const items = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPosts(items);
      } catch (error: any) {
        console.warn("Index or query error on authorId + createdAt, falling back to client-side sorting:", error);
        try {
          const fallbackQ = query(
            collection(db, 'posts'),
            where('authorId', '==', user.uid)
          );
          const querySnapshot = await getDocs(fallbackQ);
          const items = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as any));
          // Robust client-side sort by createdAt desc
          items.sort((a, b) => {
            const getMs = (val: any) => {
              if (!val) return 0;
              if (typeof val.toMillis === 'function') return val.toMillis();
              if (val.seconds) return val.seconds * 1000;
              if (val instanceof Date) return val.getTime();
              return new Date(val).getTime() || 0;
            };
            return getMs(b.createdAt) - getMs(a.createdAt);
          });
          setPosts(items);
        } catch (fallbackErr) {
          console.error("Critical error fetching library after fallback:", fallbackErr);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this thesis? This action is irreversible.')) return;

    try {
      await deleteDoc(doc(db, 'posts', id));
      setPosts(prev => prev.filter(p => p.id !== id));
      toast.success('Thesis archived (deleted)');
    } catch (error) {
      toast.error('Failed to archive thesis');
    }
  };

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background">
        <Zap className="w-16 h-16 text-indigo-500 mb-6 opacity-20" />
        <h2 className="text-2xl font-black text-foreground uppercase italic tracking-tighter">Access Denied</h2>
        <p className="text-slate-500 text-sm mt-2 font-bold uppercase tracking-widest">Unauthorized Neural Connection</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background overflow-y-auto scrollbar-hide">
      <div className="max-w-6xl mx-auto px-8 py-16">
        
        {/* Profile Header */}
        <div className="editorial-card mb-16 overflow-hidden bg-card-bg border border-card-border rounded-[3rem] shadow-2xl shadow-black/5">
           <div className="h-40 relative overflow-hidden">
              {profile?.coverURL && <img src={profile.coverURL} className="w-full h-full object-cover" alt="Banner" />}
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"></div>
           </div>
           <div className="px-10 pb-10 -mt-12 relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="flex items-end gap-6">
                 <img 
                   src={profile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                   className="w-24 h-24 rounded-[2rem] border-4 border-background shadow-2xl object-cover" 
                   alt="Avatar" 
                 />
                 <div className="mb-2">
                    <h2 className="text-3xl font-black tracking-tighter text-foreground uppercase italic leading-none">{profile?.displayName || user.displayName || 'Architect'}</h2>
                    <p className="text-indigo-600 font-black text-xs uppercase tracking-widest mt-1">@{profile?.username || 'user_alias'}</p>
                 </div>
              </div>
              <div className="flex items-center gap-8 mb-2">
                 <div className="text-center">
                    <div className="text-xl font-black text-foreground">{profile?.followersCount || 0}</div>
                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Followers</div>
                 </div>
                 <div className="text-center">
                    <div className="text-xl font-black text-foreground">{profile?.followingCount || 0}</div>
                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Following</div>
                 </div>
                 <Link to="/settings" className="px-6 py-3 bg-surface-muted border border-card-border rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-foreground hover:text-background transition-all">Edit Profile</Link>
              </div>
           </div>
        </div>

        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-indigo-600" />
              <h1 className="text-5xl font-black tracking-tighter text-foreground uppercase italic">My <span className="premium-gradient-text">Library</span></h1>
            </div>
            <p className="text-slate-500 text-xs font-black uppercase tracking-widest">Personal Neural Archive • {posts.length} Transmissions</p>
          </div>
          <Link 
            to="/create" 
            className="group flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4" /> Start New Thesis
          </Link>
        </header>

        {loading ? (
          <div className="grid md:grid-cols-2 gap-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="editorial-card h-64 animate-pulse bg-surface-muted" />
            ))}
          </div>
        ) : posts.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-8">
            <AnimatePresence mode="popLayout">
              {posts.map((post) => (
                <motion.div
                  key={post.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="editorial-card flex flex-col group"
                >
                  {post.coverImage && (
                    <div className="aspect-[21/9] w-full relative overflow-hidden rounded-t-[2rem]">
                      <img src={post.coverImage} onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80'; }} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105" alt="cover" />
                      <div className="absolute inset-0 bg-indigo-900/10 mix-blend-multiply"></div>
                    </div>
                  )}
                  <div className="p-8 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em]">{post.category || 'THESIS'}</span>
                      <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        <Clock className="w-3 h-3" /> {formatDate(post.createdAt)}
                      </div>
                    </div>
                    <h3 className="text-xl font-black text-foreground mb-4 line-clamp-2 tracking-tight italic uppercase group-hover:text-indigo-600 transition-colors">
                      {post.title}
                    </h3>
                    <div className="mt-auto pt-6 border-t border-card-border flex items-center justify-between">
                      <div className="flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        <span>{post.likesCount || 0} Likes</span>
                        <span>{post.viewsCount || 0} Views</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link 
                          to={`/edit/${post.id}`}
                          className="p-3 bg-surface-muted hover:bg-indigo-500/10 text-slate-500 hover:text-indigo-600 rounded-xl transition-all"
                          title="Edit Thesis"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => handleDelete(post.id)}
                          className="p-3 bg-surface-muted hover:bg-red-500/10 text-slate-500 hover:text-red-500 rounded-xl transition-all"
                          title="Archive Thesis"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="py-32 text-center editorial-card border-dashed bg-surface-muted/30">
            <Zap className="w-16 h-16 text-indigo-500 mx-auto mb-6 opacity-10" />
            <h3 className="text-2xl font-black text-slate-400 uppercase italic tracking-tighter">Your archive is empty</h3>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-4">No published transmissions detected in this frequency.</p>
            <Link 
              to="/create" 
              className="inline-block mt-10 px-10 py-4 bg-foreground text-background rounded-2xl font-black text-[10px] uppercase tracking-widest"
            >
              Initialize First Transmission
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
