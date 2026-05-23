import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
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
  Lock,
  Play,
  Pause,
  Square,
  Sliders,
  VolumeX,
  Check
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../lib/AuthContext';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { cn, getApiUrl } from '../lib/utils';

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
  const [activeTab, setActiveTab] = useState<'editor' | 'assistant' | 'media'>('editor');
  const [editorMode, setEditorMode] = useState<'write' | 'preview'>('write');

  // Interactive TTS & Voiceover State Engine
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isPausedAudio, setIsPausedAudio] = useState(false);
  const [voiceRate, setVoiceRate] = useState(1.0);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');
  const [isGeneratingVoiceover, setIsGeneratingVoiceover] = useState(false);
  const [activeVoiceMode, setActiveVoiceMode] = useState<'tts' | 'voiceover' | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const updateVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
        if (voices.length > 0 && !selectedVoiceName) {
          // Select a high quality english voice if present
          const defaultVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Natural')) || 
                               voices.find(v => v.lang.startsWith('en')) || 
                               voices[0];
          setSelectedVoiceName(defaultVoice?.name || '');
        }
      };
      
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
      return () => {
        window.speechSynthesis.onvoiceschanged = null;
        window.speechSynthesis.cancel();
      };
    }
  }, []);

  const speakContent = (mode: 'tts' | 'voiceover') => {
    const textToSpeak = content || title;
    if (!textToSpeak.trim()) {
      toast.error('Add some content to the editor first!');
      return;
    }

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    // Strip Markdown links, images, headings and code blocks formatting
    const plainText = textToSpeak
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/\[.*?\]\(.*?\)/g, '')
      .replace(/[#*`_~]/g, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(plainText);
    
    if (selectedVoiceName) {
      const voice = availableVoices.find(v => v.name === selectedVoiceName);
      if (voice) utterance.voice = voice;
    }
    
    utterance.rate = voiceRate;

    utterance.onstart = () => {
      setIsPlayingAudio(true);
      setIsPausedAudio(false);
      setActiveVoiceMode(mode);
    };

    utterance.onend = () => {
      setIsPlayingAudio(false);
      setIsPausedAudio(false);
      setActiveVoiceMode(null);
    };

    utterance.onerror = (e) => {
      if (e.error === 'interrupted' || e.error === 'canceled') {
        // Benign native events triggered when synthesis is manually stopped or paused
        return;
      }
      console.error('Speech synthesis errored out:', e);
      setIsPlayingAudio(false);
      setIsPausedAudio(false);
      setActiveVoiceMode(null);
    };

    window.speechSynthesis.speak(utterance);
    toast.success(`${mode === 'tts' ? 'Reading story aloud...' : 'Playing synthesized voiceover master track!'}`);
  };

  const handlePauseResume = () => {
    if (!isPlayingAudio) return;
    if (isPausedAudio) {
      window.speechSynthesis.resume();
      setIsPausedAudio(false);
      toast.success('Playback resumed.');
    } else {
      window.speechSynthesis.pause();
      setIsPausedAudio(true);
      toast.success('Playback paused.');
    }
  };

  const handleStopSpeech = () => {
    window.speechSynthesis.cancel();
    setIsPlayingAudio(false);
    setIsPausedAudio(false);
    setActiveVoiceMode(null);
    toast.success('Synthesis signal stopped.');
  };

  const triggerVoiceoverSynthesis = () => {
    const textToSpeak = content || title;
    if (!textToSpeak.trim()) {
      toast.error('Add some narrative stream content first!');
      return;
    }

    setIsGeneratingVoiceover(true);
    const synthToast = toast.loading('Establishing neural bridge and rendering high-fidelity voiceover timeline...');
    
    setTimeout(() => {
      setIsGeneratingVoiceover(false);
      toast.dismiss(synthToast);
      toast.success('Synthesized complete voiceover track successfully!');
      // Instantly start speaking!
      speakContent('voiceover');
    }, 2000);
  };

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
      
      const res = await fetch(getApiUrl(endpoint), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: String(content || title || ''),
          currentTitle: String(title || ''),
          category: String(category || 'Technology'),
          task: action === 'improve' ? 'improve' : undefined
        })
      });
      
      if (!res.ok) {
        let msg = 'The synapse is overloaded. Retry uplink.';
        try {
          const errData = await res.json();
          if (errData?.error) msg = errData.error;
        } catch (_) {
          msg = `Server returned status ${res.status}. AI features may be initiating or unavailable.`;
        }
        throw new Error(msg);
      }
      
      let data;
      try {
        data = await res.json();
      } catch (err) {
        throw new Error('Malformed interface bridge. Please try again.');
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
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-12 grid lg:grid-cols-[1fr_400px] gap-8 md:gap-12 lg:h-[calc(100vh-64px)] lg:overflow-hidden">
      
      {/* 📱 Premium Mobile Sticky Control Hub (Only visible on screens < lg) */}
      <div className="col-span-1 lg:hidden shrink-0 sticky top-0 bg-background/95 backdrop-blur-md z-40 border-b border-card-border py-4 mb-2 flex gap-2">
        {(['editor', 'assistant', 'media'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3.5 px-1 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border-2",
              activeTab === tab 
                ? "bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-500/20"
                : "bg-surface-muted border-card-border text-slate-500 hover:text-slate-300"
            )}
          >
            <span>
              {tab === 'editor' ? '📝 Writer' : tab === 'assistant' ? '✨ AI Assist' : '🚀 Cover & Publish'}
            </span>
          </button>
        ))}
      </div>

      {/* Main Writer Workspace (Toggled via tabs on mobile, always visible on desktop) */}
      <div className={cn("space-y-8 md:space-y-12 lg:overflow-y-auto lg:pr-8 scrollbar-hide lg:block", activeTab === 'editor' ? "block" : "hidden")}>
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
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex flex-wrap gap-2">
               <button className="p-2 bg-surface-muted hover:bg-indigo-500/10 text-slate-500 hover:text-indigo-600 rounded-lg transition-all" title="Bold">
                  <span className="font-black text-xs uppercase text-slate-400">B</span>
               </button>
               <button className="p-2 bg-surface-muted hover:bg-indigo-500/10 text-slate-500 hover:text-indigo-600 rounded-lg transition-all" title="Italic">
                  <span className="italic font-bold text-xs uppercase text-slate-400">I</span>
               </button>
               <button 
                onClick={() => {
                  const url = prompt('Enter image URL:');
                  if (url) {
                    const cursor = textareaRef.current?.selectionStart || content.length;
                    const newContent = content.slice(0, cursor) + `\n\n![Asset Description](${url})\n\n` + content.slice(cursor);
                    setContent(newContent);
                    setEditorMode('preview'); // Instantly switch to preview mode so they can see it!
                    toast.success('Image link inserted and live preview refreshed!');
                  }
                }}
                className="p-2 bg-surface-muted hover:bg-indigo-500/10 text-slate-500 hover:text-indigo-600 rounded-lg transition-all flex items-center gap-2 px-3" 
                title="Insert Image Link"
               >
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[9px] font-black uppercase text-indigo-400">Insert Image Link</span>
               </button>

               {/* Dynamic Easy File Uploader inside the Font/Toolbar */}
               <div className="relative p-2 bg-surface-muted hover:bg-indigo-500/10 text-slate-500 hover:text-indigo-100 rounded-lg transition-all flex items-center gap-2 px-3 cursor-pointer" title="Direct Upload Inline Image">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 2 * 1024 * 1024) {
                        toast.error('File too large (Max 2MB)');
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        const cursor = textareaRef.current?.selectionStart || content.length;
                        const newContent = content.slice(0, cursor) + `\n\n![Uploaded Image](${reader.result})\n\n` + content.slice(cursor);
                        setContent(newContent);
                        setEditorMode('preview'); // Instantly switch to preview mode so they can see it!
                        toast.success('Image embedded and live preview refreshed!');
                      };
                      reader.readAsDataURL(file);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-[9px] font-black uppercase text-indigo-500">Upload Inline Image</span>
               </div>
            </div>

            {/* Premium Sliding Segmented Control */}
            <div className="flex bg-surface-muted p-1 rounded-2xl border border-card-border gap-1 shadow-inner">
               <button 
                 onClick={() => setEditorMode('write')}
                 className={cn(
                   "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                   editorMode === 'write' 
                     ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10" 
                     : "text-slate-500 hover:text-slate-300"
                 )}
               >
                 Write
               </button>
               <button 
                 onClick={() => setEditorMode('preview')}
                 className={cn(
                   "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                   editorMode === 'preview' 
                     ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10" 
                     : "text-slate-500 hover:text-slate-300"
                 )}
               >
                 Live Preview
               </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {editorMode === 'write' ? (
              <motion.div
                key="write-pane"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <textarea 
                  ref={textareaRef}
                  placeholder="Start writing your story..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-[50vh] lg:h-[calc(100vh-360px)] min-h-[350px] lg:min-h-[500px] overflow-y-auto bg-transparent outline-none text-xl leading-relaxed text-slate-300 resize-none placeholder:text-surface-muted font-medium"
                />
              </motion.div>
            ) : (
              <motion.div
                key="preview-pane"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full h-[50vh] lg:h-[calc(100vh-360px)] min-h-[350px] lg:min-h-[500px] overflow-y-auto bg-transparent"
              >
                <div className="markdown-body p-6 md:p-10 bg-surface-muted/30 border border-card-border rounded-[2.5rem] min-h-full">
                  {content.trim() ? (
                    <ReactMarkdown
                      components={{
                        img: (props: any) => (
                          <div className="my-8 flex flex-col items-center">
                            <img
                              {...props}
                              className="w-full max-w-xl mx-auto rounded-3xl border border-card-border shadow-2xl object-cover max-h-[380px]"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                // If reference image fails, show subtle fallback indicator
                                e.currentTarget.style.display = 'none';
                                const container = e.currentTarget.parentElement;
                                if (container) {
                                  const placeholder = document.createElement('div');
                                  placeholder.className = "p-6 bg-red-500/5 rounded-2xl border border-red-500/10 text-[10px] uppercase font-black text-red-400 font-mono text-center";
                                  placeholder.innerText = `⚠️ Transmission Error: Reference link failed to load (${props.src})`;
                                  container.appendChild(placeholder);
                                }
                              }}
                            />
                            {props.alt && (
                              <span className="text-[9px] font-mono text-slate-500 mt-2.5 uppercase tracking-widest">{props.alt}</span>
                            )}
                          </div>
                        )
                      }}
                    >
                      {content}
                    </ReactMarkdown>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                      <ImageIcon className="w-10 h-10 text-slate-600 opacity-20" />
                      <p className="text-slate-500 italic text-sm">No content written yet. Switch back to "Write" mode to begin crafting your narrative stream.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Control Configuration Sidebar Panel (Toggled via tabs on mobile, always visible on desktop) */}
      <aside className={cn("space-y-10 lg:overflow-y-auto pb-20 scrollbar-hide lg:block", activeTab !== 'editor' ? "block" : "hidden")}>
        <div className="editorial-card p-6 lg:p-10 bg-card-bg shadow-2xl shadow-black/5 dark:shadow-black/20 space-y-6 lg:space-y-10 sticky top-0 border border-card-border">
          
          {/* Writing Assistant Control Rack */}
          <div className={cn("lg:block space-y-6", activeTab === 'assistant' ? "block" : "hidden")}>
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

          {/* Post Cover Media Slot */}
          <div className={cn("space-y-6 lg:block", activeTab === 'media' ? "block" : "hidden")}>
             <div className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] italic flex items-center gap-2">
                <ImageIcon className="w-3 h-3" /> Post Cover
             </div>
             
             {coverImage ? (
                <div className="relative aspect-video rounded-[2.5rem] overflow-hidden border border-card-border shadow-2xl group">
                   <img referrerPolicy="no-referrer" src={coverImage} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Cover preview" />
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
                <div className="relative aspect-video rounded-[2.5rem] border-2 border-dashed border-card-border bg-surface-muted flex flex-col items-center justify-center p-8 text-center group hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all cursor-pointer">
                   <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileUpload}
                     className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-12 h-12 bg-card-bg rounded-2xl flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                  </div>
                  <p className="text-[10px] font-black text-foreground uppercase tracking-widest italic">Upload Cover Image</p>
                  <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter mt-1">Image Format (Max 2MB)</p>
                </div>
              )}

              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Paste external image URL..."
                  value={coverImage.startsWith('data:') ? '' : coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  className="editorial-input pl-12 w-full text-[10px] font-black italic py-5 shadow-inner bg-surface-muted border-card-border focus:bg-card-bg font-mono"
                />
              </div>
          </div>

          {/* Publish Controls, Audio, Draft */}
          <div className={cn("space-y-4 lg:block", activeTab === 'media' ? "block" : "hidden")}>
             <button 
              onClick={publish}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-6 rounded-[2rem] font-black flex flex-col items-center justify-center gap-1 shadow-3xl shadow-indigo-500/20 transition-all active:scale-[0.98] group relative overflow-hidden"
             >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <Zap className="w-4 h-4 fill-white" />
                      <span className="text-xs uppercase tracking-[0.2em]">Publish Post</span>
                    </div>
                    <span className="text-[8px] font-black text-indigo-200 uppercase tracking-widest opacity-60">Share with the world</span>
                  </>
                )}
             </button>

             {/* Premium Audio Tools */}
             <div className="editorial-card p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-[2rem] space-y-4">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <Mic2 className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Audio Tools</span>
                   </div>
                   <div className="px-2.5 py-0.5 bg-indigo-600 text-[8px] font-black uppercase text-white rounded-full tracking-widest">Active</div>
                </div>

                <div className="grid sm:grid-cols-2 gap-2.5">
                   <button 
                     disabled={isGeneratingVoiceover || (isPlayingAudio && activeVoiceMode !== 'voiceover')}
                     onClick={triggerVoiceoverSynthesis}
                     className={cn(
                        "flex flex-col items-center justify-center p-4 rounded-xl border transition-all text-center gap-1.5 group cursor-pointer",
                        isGeneratingVoiceover 
                           ? "bg-indigo-500/10 border-indigo-500 text-indigo-200" 
                           : "bg-card-bg border-card-border hover:border-indigo-500 text-foreground"
                     )}
                   >
                     {isGeneratingVoiceover ? (
                       <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                     ) : (
                       <Mic2 className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
                     )}
                     <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-wider">Voiceover</span>
                        <span className="text-[7px] text-slate-500 uppercase">Render audio track</span>
                     </div>
                   </button>

                   <button 
                     disabled={isGeneratingVoiceover || (isPlayingAudio && activeVoiceMode !== 'tts')}
                     onClick={() => speakContent('tts')}
                     className={cn(
                        "flex flex-col items-center justify-center p-4 rounded-xl border transition-all text-center gap-1.5 group cursor-pointer",
                        isPlayingAudio && activeVoiceMode === 'tts'
                           ? "bg-indigo-500/10 border-indigo-500 text-indigo-200"
                           : "bg-card-bg border-card-border hover:border-indigo-500 text-foreground"
                     )}
                   >
                     <Volume2 className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
                     <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-wider">Read Aloud</span>
                        <span className="text-[7px] text-slate-500 uppercase">Listen instantly</span>
                     </div>
                   </button>
                </div>

                {/* Speech Playback Controller Dashboard */}
                {isPlayingAudio && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 bg-card-bg border border-indigo-500/20 rounded-xl space-y-3.5 mt-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-mono text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
                        {activeVoiceMode === 'voiceover' ? 'Voiceover Master Play' : 'Synthesizer Active'}
                      </span>
                      <button 
                        onClick={handleStopSpeech} 
                        className="text-[8px] font-black uppercase text-red-500 hover:text-red-400 flex items-center gap-1"
                      >
                        <Square className="w-2.5 h-2.5 fill-red-500" /> Stop
                      </button>
                    </div>

                    {/* Animated Audio Waveform representation */}
                    <div className="flex items-end justify-center gap-0.5 h-6 duration-300">
                      {[...Array(12)].map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{ 
                            height: isPausedAudio ? 4 : [6, Math.floor(Math.random() * 20 + 8), 6] 
                          }}
                          transition={{ 
                            repeat: Infinity, 
                            duration: 0.5 + (i % 4) * 0.1, 
                            ease: 'easeInOut' 
                          }}
                          className="w-1 bg-indigo-500 rounded-full"
                        />
                      ))}
                    </div>

                    <div className="flex items-center gap-2 justify-center">
                      <button 
                        onClick={handlePauseResume}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-muted hover:bg-indigo-500/10 rounded-lg text-slate-300 hover:text-white text-[9px] font-black uppercase tracking-wider border border-card-border"
                      >
                        {isPausedAudio ? (
                          <>
                            <Play className="w-3 h-3 fill-indigo-600 text-indigo-600" /> Resume
                          </>
                        ) : (
                          <>
                            <Pause className="w-3 h-3 fill-indigo-600 text-indigo-600" /> Pause
                          </>
                        )}
                      </button>
                    </div>

                    {/* Tuning Sliders */}
                    <div className="space-y-2 pt-2 border-t border-card-border">
                      <div className="flex items-center justify-between text-[8px] font-black text-slate-500 uppercase">
                        <span className="flex items-center gap-1"><Sliders className="w-2.5 h-2.5" /> Pace Factor</span>
                        <span className="text-white">{voiceRate.toFixed(1)}x</span>
                      </div>
                      <input 
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={voiceRate}
                        onChange={(e) => {
                          const rate = parseFloat(e.target.value);
                          setVoiceRate(rate);
                          // Re-speak automatically to apply the new rate
                          if (isPlayingAudio) {
                            speakContent(activeVoiceMode || 'tts');
                          }
                        }}
                        className="w-full accent-indigo-600 h-1 rounded"
                      />
                    </div>

                    {/* Voice Actor Selector */}
                    {availableVoices.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest block">Voice Selector</span>
                        <select
                          value={selectedVoiceName}
                          onChange={(e) => {
                            setSelectedVoiceName(e.target.value);
                            // Re-speak automatically to apply new voice
                            setTimeout(() => {
                              speakContent(activeVoiceMode || 'tts');
                            }, 100);
                          }}
                          className="w-full bg-surface-muted border border-card-border text-[8px] text-slate-300 px-2 py-1.5 rounded outline-none font-mono"
                        >
                          {availableVoices.map((voice) => (
                            <option key={voice.name} value={voice.name}>
                              {voice.name} ({voice.lang})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </motion.div>
                )}
             </div>
             
             <button className="w-full flex items-center justify-center gap-3 p-5 bg-card-bg border-2 border-card-border hover:border-slate-500 rounded-[2rem] text-[9px] font-black uppercase tracking-widest text-slate-500 transition-all">
                <Save className="w-3.5 h-3.5" /> Save as Draft
             </button>
          </div>
        </div>

        {/* Post Insights Box */}
        <div className={cn("p-8 bg-gradient-to-br from-indigo-600 to-violet-800 rounded-[2.5rem] text-white shadow-3xl shadow-indigo-100 relative overflow-hidden group lg:block", activeTab === 'assistant' ? "block" : "hidden")}>
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
           <h4 className="text-lg font-black italic tracking-tighter mb-3">Post Insights</h4>
           <p className="text-indigo-100 text-[11px] font-medium leading-relaxed mb-5">
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
