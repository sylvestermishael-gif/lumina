import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, PenSquare, LogOut, User as UserIcon, Menu, Heart, Bookmark, Globe, MessageCircle, Zap, Sparkles } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { cn, formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { ThemeToggle } from './ThemeToggle';
import { toast } from 'react-hot-toast';

export function Navbar() {
  const { user, profile, login, logout, isAuthenticating } = useAuth();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav className={cn(
        "h-16 flex items-center justify-between px-4 md:px-8 sticky top-0 z-50 transition-all duration-300",
        isScrolled ? "bg-background/80 backdrop-blur-xl border-b border-card-border shadow-sm" : "bg-background border-b border-card-border"
      )}>
        <div className="flex items-center gap-4 md:gap-10">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 md:w-9 md:h-9 bg-foreground rounded-xl flex items-center justify-center transition-transform group-hover:rotate-12 duration-500 shadow-lg shadow-black/5">
               <Zap className="w-4 h-4 md:w-5 md:h-5 text-indigo-400 fill-indigo-400" />
            </div>
            <span className="text-lg md:text-xl font-black tracking-tighter text-foreground uppercase italic">Lumina</span>
          </Link>

          <div className="hidden md:flex items-center bg-input-bg rounded-2xl px-4 py-2 w-64 lg:w-96 group focus-within:bg-card-bg focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all shadow-inner border border-transparent dark:focus-within:border-indigo-500/50">
            <Search className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Ask neural search..." 
              className="bg-transparent border-none outline-none text-sm px-3 w-full font-medium placeholder:text-slate-400 placeholder:italic text-foreground"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  navigate(`/?q=${encodeURIComponent((e.target as HTMLInputElement).value)}`);
                }
              }}
            />
            <div className="hidden lg:flex items-center gap-1 bg-card-bg px-2 py-0.5 rounded-lg border border-card-border shadow-sm">
               <span className="text-[10px] font-black text-slate-400 tracking-tighter">⌘</span>
               <span className="text-[10px] font-black text-slate-400 tracking-tighter uppercase">K</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <ThemeToggle />
          
          <button 
            className="md:hidden p-2 text-slate-500 hover:bg-surface-muted rounded-xl transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="w-5 h-5" />
          </button>

          {user ? (
            <>
              <div className="hidden lg:flex items-center gap-8 mr-4">
                 <Link to="/communities" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">Hubs</Link>
                 <Link to="/trending" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">Trending</Link>
                 <Link to="/library" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">My Library</Link>
              </div>
              
              <Link to="/create" className="btn-primary hidden sm:flex items-center gap-2 py-2.5 px-4 md:px-6 shadow-indigo-100">
                <PenSquare className="w-4 h-4" />
                <span className="text-xs uppercase tracking-widest">Architect</span>
              </Link>

              <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-4 border-l border-card-border ml-2 md:ml-4 group cursor-pointer relative">
                 <div className="text-right hidden sm:block">
                    <div className="text-xs font-black text-foreground uppercase tracking-tight">{profile?.displayName || user?.displayName || 'User'}</div>
                    <div className="flex items-center gap-2 justify-end mt-1">
                      <Link to="/settings" className="text-[9px] font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-widest">Settings</Link>
                      <span className="text-[8px] text-slate-600">•</span>
                      <button onClick={logout} className="text-[9px] font-bold text-slate-400 hover:text-red-500 uppercase tracking-widest">Sign Out</button>
                    </div>
                 </div>
                 <Link to="/settings">
                    <img src={profile?.photoURL || user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-background shadow-md group-hover:scale-105 transition-transform" alt="profile" />
                 </Link>
              </div>
            </>
          ) : (
            <button 
              onClick={login} 
              disabled={isAuthenticating}
              className={cn(
                "btn-primary px-4 md:px-8 shadow-indigo-100 flex items-center gap-2 text-xs",
                isAuthenticating && "opacity-70 cursor-not-allowed"
              )}
            >
              {isAuthenticating ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="hidden sm:inline uppercase tracking-widest">Joining...</span>
                </>
              ) : (
                <span className="uppercase tracking-widest">Join</span>
              )}
            </button>
          )}
        </div>
      </nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-16 bg-background border-b border-card-border z-40 p-6 md:hidden shadow-xl"
          >
            <div className="flex flex-col gap-6">
              <div className="flex items-center bg-input-bg rounded-2xl px-4 py-3 group focus-within:bg-card-bg transition-all">
                <Search className="w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Neural Search..." 
                  className="bg-transparent border-none outline-none text-sm px-3 w-full font-medium"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setIsMobileMenuOpen(false);
                      navigate(`/?q=${encodeURIComponent((e.target as HTMLInputElement).value)}`);
                    }
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Link to="/trending" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-4 bg-surface-muted rounded-2xl">
                   <Zap className="w-4 h-4 text-indigo-600" />
                   <span className="text-xs font-black uppercase tracking-widest">Trending</span>
                </Link>
                <Link to="/communities" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-4 bg-surface-muted rounded-2xl">
                   <Globe className="w-4 h-4 text-indigo-600" />
                   <span className="text-xs font-black uppercase tracking-widest">Hubs</span>
                </Link>
                <Link to="/library" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-4 bg-surface-muted rounded-2xl">
                   <Bookmark className="w-4 h-4 text-indigo-600" />
                   <span className="text-xs font-black uppercase tracking-widest">Library</span>
                </Link>
                <Link to="/create" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-4 bg-indigo-600 text-white rounded-2xl">
                   <PenSquare className="w-4 h-4" />
                   <span className="text-xs font-black uppercase tracking-widest">Create</span>
                </Link>
              </div>

              {user && (
                <div className="pt-6 border-t border-card-border flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <img src={profile?.photoURL || user?.photoURL} className="w-10 h-10 rounded-full" alt="profile" />
                      <div>
                        <div className="text-sm font-black uppercase">{profile?.displayName || user?.displayName}</div>
                        <Link to="/settings" onClick={() => setIsMobileMenuOpen(false)} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account Settings</Link>
                      </div>
                   </div>
                   <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                      <LogOut className="w-5 h-5" />
                   </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function PostCard({ post }: { post: any }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="editorial-card group flex flex-col h-full overflow-hidden"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
         <img 
           src={post.coverImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80'} 
           onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80'; }}
           referrerPolicy="no-referrer"
           className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
           alt={post.title}
         />
         <div className="absolute top-4 left-4 flex gap-2">
            <span className="glass-tag text-white px-4 py-1.5">{post.category || 'Opinion'}</span>
            <span className="glass-tag text-indigo-300 border border-indigo-500/30 px-3 py-1.5 flex items-center gap-1.5 backdrop-blur-md text-[9px] font-black uppercase tracking-widest">
               <Sparkles className="w-2.5 h-2.5 text-indigo-400 fill-indigo-400/20" /> AI CORE
            </span>
         </div>
      </div>

      <div className="p-8 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <img 
              src={post.authorPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorId}`} 
              className="w-10 h-10 rounded-full border-2 border-background shadow-sm" 
              alt="author" 
            />
            <div className="flex flex-col">
              <span className="text-xs font-black text-foreground uppercase tracking-widest">{post.authorName}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">{formatDate(post.createdAt)}</span>
            </div>
          </div>
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toast.success('Added to Synapse Bookmarks', {
                className: "premium-toast"
              });
            }}
            className="text-slate-300 hover:text-indigo-600 transition-colors p-2 relative z-30"
          >
            <Bookmark className="w-5 h-5" />
          </button>
        </div>

        <h3 className="text-2xl font-black leading-[1.15] mb-4 text-foreground group-hover:premium-gradient-text transition-all duration-300 tracking-tighter italic">
          {post.title}
        </h3>
        
        <p className="text-slate-400 text-sm line-clamp-2 mb-8 font-medium leading-relaxed italic">
          {post.summary || 'A deep dive into the architectures powering real-time UI generation based on user intent and neural feedback systems...'}
        </p>

        <div className="mt-auto flex items-center justify-between pt-6 border-t border-card-border">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5 group/stat">
              <Heart className="w-4 h-4 text-slate-300 group-hover/stat:text-indigo-600 transition-colors" />
              <span className="text-[10px] font-black text-slate-500">{(post.likesCount || 0)}</span>
            </div>
            <div className="flex items-center gap-1.5 group/stat">
              <MessageCircle className="w-4 h-4 text-slate-300 group-hover/stat:text-indigo-600 transition-colors" />
              <span className="text-[10px] font-black text-slate-500">{(post.commentsCount || 0)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 bg-indigo-500/30 rounded-full"></div>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">8 MIN READ</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function Footer() {
  return (
    <footer className="bg-card-bg border-t border-card-border pt-20 pb-12 px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12">
        <div className="max-w-xs">
          <Link to="/" className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-sm rotate-45"></div>
            </div>
            <span className="font-bold text-xl tracking-tight text-foreground">LUMINA LABS</span>
          </Link>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            The premium destination for technical insights, design philosophy, and community-driven AI exploration.
          </p>
          <div className="flex gap-4">
             {['twitter', 'github', 'linkedin'].map(social => (
                <button key={social} className="sidebar-icon-btn">
                  <Globe className="w-4 h-4" />
                </button>
             ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-12 md:gap-24">
          <div>
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Platform</h5>
            <ul className="space-y-4 text-sm font-medium text-slate-400">
              <li><Link to="/" className="hover:text-indigo-600 transition-colors">Feed</Link></li>
              <li><Link to="/trending" className="hover:text-indigo-600 transition-colors">Trending</Link></li>
              <li><Link to="/communities" className="hover:text-indigo-600 transition-colors">Hubs</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Account</h5>
            <ul className="space-y-4 text-sm font-medium text-slate-400">
              <li><button className="hover:text-indigo-600 transition-colors">Profile</button></li>
              <li><button className="hover:text-indigo-600 transition-colors">Settings</button></li>
              <li><button className="hover:text-indigo-600 transition-colors">Premium</button></li>
            </ul>
          </div>
          <div>
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Resources</h5>
            <ul className="space-y-4 text-sm font-medium text-slate-400">
              <li><button className="hover:text-indigo-600 transition-colors">AI Lab</button></li>
              <li><button className="hover:text-indigo-600 transition-colors">API Keys</button></li>
              <li><button className="hover:text-indigo-600 transition-colors">Ethics</button></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-card-border flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
        <span>© 2026 LUMINA LABS</span>
        <div className="flex gap-8">
          <button className="hover:text-foreground transition-colors">Privacy</button>
          <button className="hover:text-foreground transition-colors">Terms</button>
        </div>
      </div>
    </footer>
  );
}
