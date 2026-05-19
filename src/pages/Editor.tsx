import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Save, 
  Send, 
  Type, 
  ChevronRight, 
  Loader2,
  Trash2,
  Zap,
  LayoutDashboard,
  Globe,
  Image as ImageIcon,
  Mic2,
  Radio,
  Volume2,
  Lock
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../lib/AuthContext';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export function Editor() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Technology');
  const [coverImage, setCoverImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [pendingTask, setPendingTask] = useState<'summarize' | 'improve' | 'titles' | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (id) {
       // Load existing post for editing
       const loadPost = async () => {
         const snap = await getDoc(doc(db, 'posts', id));
         if (snap.exists() && snap.data().authorId === user?.uid) {
           const data = snap.data();
           setTitle(data.title);
           setContent(data.content);
           setCategory(data.category);
           setCoverImage(data.coverImage);
         }
       };
       loadPost();
    }
  }, [id, user]);

  const handleAIAction = async (action: 'summarize' | 'improve' | 'titles') => {
    if (!content && action !== 'titles') {
      toast.error('Add some content first!');
      return;
    }
    
    setAiLoading(true);
    setPendingTask(action);
    const loadingToast = action === 'improve' ? toast.loading('Optimizing narrative flow...') : undefined;

    try {
      const endpoint = action === 'titles' ? '/api/ai/titles' : 
                      action === 'summarize' ? '/api/ai/summarize' : 
                      '/api/ai/writing-assistant';
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: content || title,
          currentTitle: title,
          task: action === 'improve' ? 'improve' : undefined
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'The synapse is overloaded. Retry uplink.');
      }
      
      if (action === 'titles') {
        setAiSuggestions(data.titles || []);
        toast.success('New titles synthesized.');
      } else if (action === 'summarize') {
        toast.success(`Summary: ${data.summary}`, {
          duration: 8000,
          icon: '📝'
        });
      } else {
        setContent(data.result);
        toast.success('Narrative flow optimized.', { id: loadingToast });
      }
    } catch (error: any) {
      if (loadingToast) toast.error(error.message || 'Uplink failed.', { id: loadingToast });
      else toast.error(error.message || 'The synapse is overloaded.');
    } finally {
      setAiLoading(false);
      setPendingTask(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File too large (Max 2MB)');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverImage(reader.result as string);
      toast.success('Cover image uploaded');
    };
    reader.readAsDataURL(file);
  };

  const publish = async () => {
    if (!title || !content) {
      toast.error('Missing title or content');
      return;
    }

    setLoading(true);
    try {
      const postData = {
        title,
        content,
        category,
        coverImage: coverImage || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=1200',
        authorId: user?.uid,
        authorName: profile?.displayName || user?.displayName || 'User',
        authorPhoto: profile?.photoURL || user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`,
        likesCount: 0,
        viewsCount: 0,
        commentsCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (id) {
        await updateDoc(doc(db, 'posts', id), { ...postData, updatedAt: serverTimestamp() });
      } else {
        await addDoc(collection(db, 'posts'), postData);
      }
      
      toast.success('Published successfully!');
      navigate('/');
    } catch (error) {
      console.error(error);
      toast.error('Failed to publish');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-12 grid lg:grid-cols-[1fr_400px] gap-8 md:gap-12 lg:h-[calc(100vh-64px)] lg:overflow-hidden">
      <div className="space-y-8 md:space-y-12 lg:overflow-y-auto lg:pr-8 scrollbar-hide">
        <div className="flex items-center gap-3">
          <div className="w-6 md:w-8 h-px bg-slate-200"></div>
          <span className="text-slate-400 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em]">Editor Mode Active</span>
        </div>

        <textarea 
          placeholder="New Post Title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-transparent text-4xl md:text-6xl font-black outline-none placeholder:text-surface-muted text-foreground tracking-tighter italic leading-tight resize-none h-32 md:h-48"
        />

        <div className="flex flex-wrap gap-2 md:gap-3">
          {['Deep Tech', 'Design', 'Strategy', 'AI Lab', 'Philosophy'].map(cat => (
            <button 
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                "px-4 md:px-6 py-2 md:py-2.5 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] transition-all border-2",
                category === cat 
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-xl md:shadow-2xl shadow-indigo-500/20" 
                  : "bg-card-bg border-card-border text-slate-500 hover:border-slate-400"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative pt-8 border-t border-card-border">
          <div className="flex gap-2 mb-4">
             <button className="p-2 bg-surface-muted hover:bg-indigo-500/10 text-slate-500 hover:text-indigo-600 rounded-lg transition-all" title="Bold">
                <span className="font-black text-xs uppercase">B</span>
             </button>
             <button className="p-2 bg-surface-muted hover:bg-indigo-500/10 text-slate-500 hover:text-indigo-600 rounded-lg transition-all" title="Italic">
                <span className="italic font-bold text-xs uppercase">I</span>
             </button>
             <button 
              onClick={() => {
                const url = prompt('Enter image URL:');
                if (url) {
                  const cursor = textareaRef.current?.selectionStart || content.length;
                  const newContent = content.slice(0, cursor) + `\n\n![Asset Description](${url})\n\n` + content.slice(cursor);
                  setContent(newContent);
                }
              }}
              className="p-2 bg-surface-muted hover:bg-indigo-500/10 text-slate-500 hover:text-indigo-600 rounded-lg transition-all flex items-center gap-2 px-3" 
              title="Insert Image Link"
             >
                <ImageIcon className="w-3.5 h-3.5" />
                <span className="text-[9px] font-black uppercase">Insert Image Link</span>
             </button>
          </div>
          <textarea 
            ref={textareaRef}
            placeholder="Start writing your story..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full bg-transparent outline-none text-xl leading-relaxed text-slate-400 resize-none placeholder:text-surface-muted min-h-[800px] font-medium"
          />
        </div>
      </div>

      <aside className="space-y-10 overflow-y-auto pb-20 scrollbar-hide">
        <div className="editorial-card p-10 bg-card-bg shadow-2xl shadow-black/5 dark:shadow-black/20 space-y-10 sticky top-0 border border-card-border">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex gap-1">
                 <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
                 <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse delay-75"></div>
              </div>
              <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 italic">Writing Assistant</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={() => handleAIAction('titles')}
                disabled={aiLoading}
                className="w-full flex items-center justify-between p-5 bg-surface-muted hover:bg-indigo-500/5 border border-card-border rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all group"
              >
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 bg-card-bg rounded-xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                      <Zap className="w-4 h-4" />
                   </div>
                   <span className="text-foreground">Generate Titles</span>
                </div>
                {aiLoading && pendingTask === 'titles' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                )}
              </button>

              {aiSuggestions.length > 0 && (
                <div className="p-6 bg-indigo-500/5 rounded-3xl border border-indigo-500/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 italic">Suggested Titles</h4>
                    <button 
                      onClick={() => setAiSuggestions([])}
                      className="text-[8px] font-black uppercase tracking-tighter text-slate-400 hover:text-red-500 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="space-y-2">
                    {aiSuggestions.map((s, i) => (
                      <button 
                        key={i}
                        onClick={() => {
                          setTitle(s);
                          setAiSuggestions([]);
                        }}
                        className="w-full text-left p-3 bg-card-bg border border-card-border rounded-xl text-[10px] font-bold text-foreground hover:border-indigo-500 transition-all line-clamp-2"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <button 
                onClick={() => handleAIAction('improve')}
                disabled={aiLoading}
                className="w-full flex items-center justify-between p-5 bg-surface-muted hover:bg-indigo-500/5 border border-card-border rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all group"
              >
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 bg-card-bg rounded-xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                      <LayoutDashboard className="w-4 h-4" />
                   </div>
                   <span className="text-foreground">Optimize Flow</span>
                </div>
                {aiLoading && pendingTask === 'improve' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                )}
              </button>

              <button 
                onClick={() => handleAIAction('summarize')}
                disabled={aiLoading}
                className="w-full flex items-center justify-between p-5 bg-surface-muted hover:bg-indigo-500/5 border border-card-border rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all group"
              >
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 bg-card-bg rounded-xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                      <Globe className="w-4 h-4" />
                   </div>
                   <span className="text-foreground">Synthesis Summary</span>
                </div>
                {aiLoading && pendingTask === 'summarize' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-6 pt-10 border-t border-card-border">
             <div className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] italic flex items-center gap-2">
                <ImageIcon className="w-3 h-3" /> Post Cover
             </div>
             
             {coverImage ? (
                <div className="relative aspect-video rounded-[2.5rem] overflow-hidden border border-card-border shadow-2xl group">
                   <img src={coverImage} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Cover preview" />
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                      <button 
                        onClick={() => setCoverImage('')}
                        className="p-5 bg-red-500 text-white rounded-2xl shadow-xl hover:bg-red-600 transition-all flex items-center gap-3 text-[10px] font-black uppercase tracking-widest"
                      >
                        <Trash2 className="w-4 h-4" /> Remove Image
                      </button>
                   </div>
                </div>
             ) : (
                <div className="relative aspect-video rounded-[2.5rem] border-2 border-dashed border-card-border bg-surface-muted flex flex-col items-center justify-center p-10 text-center group hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all cursor-pointer">
                   <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-16 h-16 bg-card-bg rounded-3xl flex items-center justify-center mb-5 shadow-sm group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-8 h-8 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                  </div>
                  <p className="text-xs font-black text-foreground uppercase tracking-widest italic">Upload Cover Image</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter mt-3">Image Format (Max 2MB)</p>
                </div>
              )}

              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Paste external image URL..."
                  value={coverImage.startsWith('data:') ? '' : coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  className="editorial-input pl-12 w-full text-[10px] font-black italic py-5 shadow-inner bg-surface-muted border-card-border focus:bg-card-bg"
                />
              </div>
          </div>

          <div className="pt-10 border-t border-card-border space-y-4">
             <button 
              onClick={publish}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-8 rounded-[2.5rem] font-black flex flex-col items-center justify-center gap-1 shadow-3xl shadow-indigo-500/20 transition-all active:scale-[0.98] group relative overflow-hidden"
             >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 fill-white" />
                      <span className="text-sm uppercase tracking-[0.3em]">Publish Post</span>
                    </div>
                    <span className="text-[9px] font-black text-indigo-200 uppercase tracking-widest opacity-60">Share with the world</span>
                  </>
                )}
             </button>

             {/* Premium Audio Tools */}
             <div className="editorial-card p-10 bg-indigo-500/5 border border-indigo-500/10 rounded-[3rem] space-y-6">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <Mic2 className="w-4 h-4 text-indigo-600" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Audio Tools</span>
                   </div>
                   {!profile?.isPremium && (
                      <div className="px-3 py-1 bg-indigo-600 text-[8px] font-black uppercase text-white rounded-full tracking-widest">Premium</div>
                   )}
                </div>

                <div className="grid grid-cols-1 gap-3">
                   {[
                      { icon: Mic2, label: 'Generate Voiceover', active: profile?.isPremium },
                      { icon: Volume2, label: 'Text-to-Speech', active: profile?.isPremium },
                   ].map((tool, i) => (
                      <button 
                        key={i}
                        disabled={!tool.active}
                        onClick={() => tool.active && toast.success(`${tool.label} neural sequence initiated...`)}
                        className={cn(
                           "flex items-center justify-between p-5 rounded-2xl border transition-all text-left group",
                           tool.active 
                              ? "bg-card-bg border-card-border hover:border-indigo-500" 
                              : "bg-surface-muted border-transparent opacity-50 cursor-not-allowed"
                        )}
                      >
                         <div className="flex items-center gap-4">
                            <tool.icon className={cn("w-4 h-4", tool.active ? "text-indigo-600" : "text-slate-400")} />
                            <span className="text-[9px] font-black uppercase tracking-widest text-foreground">{tool.label}</span>
                         </div>
                         {!tool.active && <Lock className="w-3 h-3 text-slate-400" />}
                      </button>
                   ))}
                </div>
             </div>
             
             <button className="w-full flex items-center justify-center gap-3 p-6 bg-card-bg border-2 border-card-border hover:border-slate-500 rounded-[2rem] text-[10px] font-black uppercase tracking-widest text-slate-500 transition-all">
                <Save className="w-4 h-4" /> Save as Draft
             </button>
          </div>
        </div>

        <div className="p-8 bg-gradient-to-br from-indigo-600 to-violet-800 rounded-[3rem] text-white shadow-3xl shadow-indigo-100 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
           <h4 className="text-xl font-black italic tracking-tighter mb-4">Post Insights</h4>
           <p className="text-indigo-100 text-xs font-medium leading-relaxed mb-6">
             Your current post quality score is <span className="text-white font-bold">8.4/10</span>. High engagement predicted in this category.
           </p>
           <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: '84%' }} transition={{ duration: 1.5 }} className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,1)]" />
           </div>
        </div>
      </aside>
    </div>
  );
}
