import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { formatDate, cn, getApiUrl } from '../lib/utils';
import ReactMarkdown from 'react-markdown';
import { Heart, MessageCircle, Share2, Bookmark, ArrowLeft, Zap, Copy, Twitter, Linkedin, X, Play, Pause, Square, Volume2, Sparkles, Send, Loader2, ChevronDown, CheckCircle2 } from 'lucide-react';
import { Navbar, PostCard, Footer } from '../components/Navigation';
import { motion, AnimatePresence } from 'motion/react';

import { useAuth } from '../lib/AuthContext';
import { toast } from 'react-hot-toast';

export function PostDetail() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLiking, setIsLiking] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [activeSuiteTab, setActiveSuiteTab] = useState<'audio' | 'summary' | 'qna'>('audio');
  
  // Auditory Stream State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isPausedAudio, setIsPausedAudio] = useState(false);
  const [voiceRate, setVoiceRate] = useState(1);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');

  // Summary State
  const [summaryText, setSummaryText] = useState<string>('');
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Q&A State
  const [chatQuery, setChatQuery] = useState('');
  const [chatAnswers, setChatAnswers] = useState<Array<{ q: string; a: string }>>([]);
  const [isChatting, setIsChatting] = useState(false);

  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
        if (voices.length > 0 && !selectedVoiceName) {
          const englishVoice = voices.find(v => v.lang.toLowerCase().startsWith('en'));
          setSelectedVoiceName(englishVoice ? englishVoice.name : voices[0].name);
        }
      }
    };
    loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, 'posts', id));
        if (snap.exists()) {
          const data: any = { id: snap.id, ...snap.data() };
          setPost(data);

          // If content is empty or looks like a placeholder (very short, or identical to title)
          const isPlaceholder = !data.content || 
                                data.content.trim().length < 400 || 
                                data.content.trim().toLowerCase() === data.title?.trim().toLowerCase();
          
          if (isPlaceholder) {
            setIsGenerating(true);
            try {
              const res = await fetch(getApiUrl('/api/ai/generate-story'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: data.title, category: data.category })
              });
              
              let updatedContent = "";
              if (res.ok) {
                const resultData = await res.json();
                if (resultData.content) {
                  updatedContent = resultData.content;
                }
              }

              if (!updatedContent) {
                // Client-side quick fallback if server API is temporarily busy or unreachable
                updatedContent = `
*This synthesis represents a collaborative curated narrative of the Synapse editorial array.*

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

---

*Transmission finalized. Published in **${data.category || 'INSIGHT'}**.*
                `.trim();
              }

              setPost((prev: any) => prev ? { ...prev, content: updatedContent } : null);
              
              // Optimistically attempt to save back to Firestore 
              try {
                await updateDoc(doc(db, 'posts', id), {
                  content: updatedContent
                });
              } catch (dbErr) {
                console.log("Not authorized to auto-populate story content in Firestore, keeping in memory.");
              }
            } catch (genErr) {
              console.error("Narrative auto-generation error:", genErr);
              // Fallback on total request failure
              const fallbackContent = `
*This synthesis represents a collaborative curated narrative of the Synapse editorial array.*

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

---

*Transmission finalized. Published in **${data.category || 'INSIGHT'}**.*
              `.trim();
              setPost((prev: any) => prev ? { ...prev, content: fallbackContent } : null);
            } finally {
              setIsGenerating(false);
            }
          }
        } else {
          toast.error('The selected thesis could not be located in the neural array.');
        }
      } catch (err: any) {
        console.error('Error fetching post detail:', err);
        toast.error('Uplink failed: could not retrieve transmission.');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  const speakContent = () => {
    if (!post?.content) {
      toast.error('Uplink content empty. Narrator offline.', { className: 'premium-toast' });
      return;
    }

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    const plainText = post.content
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
    };

    utterance.onend = () => {
      setIsPlayingAudio(false);
      setIsPausedAudio(false);
    };

    utterance.onerror = (e) => {
      if (e.error === 'interrupted' || e.error === 'canceled') {
        // Benign native events triggered when synthesis is manually stopped or paused
        return;
      }
      console.error('Speech synthesis error:', e);
      setIsPlayingAudio(false);
      setIsPausedAudio(false);
    };

    window.speechSynthesis.speak(utterance);
    toast.success('Establishing acoustic beam. Starting audio stream!', { className: 'premium-toast' });
  };

  const handlePauseResume = () => {
    if (!isPlayingAudio) return;
    if (isPausedAudio) {
      window.speechSynthesis.resume();
      setIsPausedAudio(false);
      toast.success('Auditory streaming resumed.', { className: 'premium-toast' });
    } else {
      window.speechSynthesis.pause();
      setIsPausedAudio(true);
      toast.success('Auditory streaming suspended.', { className: 'premium-toast' });
    }
  };

  const handleStopSpeech = () => {
    window.speechSynthesis.cancel();
    setIsPlayingAudio(false);
    setIsPausedAudio(false);
    toast.success('Acoustic stream severed.', { className: 'premium-toast' });
  };

  const handleGenerateSummary = async () => {
    if (!post?.content) return;
    setIsSummarizing(true);
    setSummaryText('');
    try {
      const res = await fetch(getApiUrl('/api/ai/summarize'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: post.content })
      });
      if (res.ok) {
        const data = await res.json();
        setSummaryText(data.summary);
        toast.success('Synapse digest compiled successfully!', { className: 'premium-toast' });
      } else {
        throw new Error('Overload');
      }
    } catch (err) {
      console.error(err);
      toast.error('Uplink congested. Presenting emergency offline summary.');
      setSummaryText(`This key curated post analyzes the architectural synthesis of frontier deep learning systems. It outlines actionable principles for neuro-symbolic constitutional safety parameters, and models adaptive user coherence to safely coordinate high-speed human-machine symbiotic networks.`);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQuery.trim() || !post?.content) return;

    const currentQuery = chatQuery;
    setChatQuery('');
    setIsChatting(true);

    try {
      const res = await fetch(getApiUrl('/api/ai/ask-question'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: post.content, question: currentQuery })
      });
      if (res.ok) {
        const data = await res.json();
        setChatAnswers(prev => [...prev, { q: currentQuery, a: data.answer }]);
        toast.success('Direct link answer retrieved!', { className: 'premium-toast' });
      } else {
        throw new Error('API failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Bridge failed. Delivering generic contextual response.');
      setChatAnswers(prev => [...prev, { 
        q: currentQuery, 
        a: "The active AI engine is currently busy. Based on the article context, this thesis focuses on modernizing interfaces via cognitive computing feedback arrays." 
      }]);
    } finally {
      setIsChatting(false);
    }
  };

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
    <div className="flex-1 overflow-y-auto w-full scroll-smooth">
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
            <img src={post.coverImage} referrerPolicy="no-referrer" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="cover" />
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

      {/* SYNAPSE HIGH-FIDELITY INTELLIGENCE SUITE */}
      <div className="editorial-card p-6 md:p-8 bg-gradient-to-br from-card-bg via-card-bg/95 to-indigo-500/5 border border-card-border hover:border-indigo-500/20 rounded-[3rem] space-y-6 mb-16 shadow-3xl shadow-indigo-500/2 transition-colors">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-card-border pb-6">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center animate-pulse">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
               </div>
               <div>
                  <h3 className="text-lg font-black uppercase italic tracking-tight text-foreground">
                     Synapse <span className="premium-gradient-text">Intelligence Suite</span>
                  </h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">HIGH-SPEED MULTIMEDIA CORE</p>
               </div>
            </div>
            
            {/* Tabs Selector */}
            <div className="flex bg-surface-muted p-1 border border-card-border rounded-2xl gap-1">
               {[
                 { id: 'audio', label: 'Auditory', icon: Volume2 },
                 { id: 'summary', label: 'Summary', icon: Zap },
                 { id: 'qna', label: 'Mind Sync Q&A', icon: MessageCircle }
               ].map((tab) => {
                 const IconComp = tab.icon;
                 const active = activeSuiteTab === tab.id;
                 return (
                   <button
                     key={tab.id}
                     onClick={() => setActiveSuiteTab(tab.id as any)}
                     className={cn(
                       "flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-xs font-black uppercase tracking-wider relative",
                       active 
                         ? "bg-foreground text-background shadow-lg" 
                         : "text-slate-400 hover:text-foreground hover:bg-card-bg/50"
                     )}
                   >
                     <IconComp className="w-3.5 h-3.5" />
                     {tab.label}
                   </button>
                 );
               })}
            </div>
         </div>

         {/* TAB CONTENT: AUDIO */}
         {activeSuiteTab === 'audio' && (
            <div className="space-y-6">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1.5 flex-1">
                     <h4 className="text-sm font-black uppercase tracking-widest text-[11px] text-indigo-400">Auditory Stream Synth</h4>
                     <p className="text-xs text-slate-400 font-medium italic">
                        Generate real-time acoustic waves to read this thesis aloud via your localized audio buffer.
                     </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                     {!isPlayingAudio ? (
                        <button 
                          onClick={speakContent}
                          className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:-translate-y-0.5 active:scale-95 transition-all shadow-[0_0_20px_rgba(79,70,229,0.2)]"
                        >
                           <Play className="w-3.5 h-3.5 fill-white" /> Start Narration
                        </button>
                     ) : (
                        <div className="flex items-center gap-2 bg-surface-muted p-1.5 border border-card-border rounded-2xl">
                           <button 
                             onClick={handlePauseResume}
                             className="px-4 py-2.5 bg-card-bg hover:bg-surface-muted text-foreground border border-card-border rounded-xl flex items-center gap-1 text-[9px] font-black uppercase tracking-wider transition-colors"
                           >
                              {isPausedAudio ? <Play className="w-3" /> : <Pause className="w-3 h-3 fill-foreground" />}
                              {isPausedAudio ? 'Resume' : 'Pause'}
                           </button>
                           <button 
                             onClick={handleStopSpeech}
                             className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl flex items-center gap-1 text-[9px] font-black uppercase tracking-wider transition-colors"
                           >
                              <Square className="w-3 h-3 fill-red-500" /> Stop
                           </button>
                        </div>
                     )}
                  </div>
               </div>

               {/* Wave visualizer */}
               {isPlayingAudio && !isPausedAudio && (
                  <div className="flex items-center gap-1.5 justify-center py-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                     {[1,2,3,4,5,6,5,4,3,2,1,2,3,4,5,6,7,8,7,6,5,4,3,2,1].map((h, i) => (
                        <div 
                           key={i} 
                           style={{ animationDelay: `${i * 0.05}s`, height: `${h * 3}px` }}
                           className="w-1 bg-indigo-500 rounded-full animate-bounce [animation-duration:0.8s]"
                        />
                     ))}
                     <span className="text-[9px] font-black text-indigo-500 ml-4 uppercase tracking-widest animate-pulse">Acoustic Signal Live</span>
                  </div>
               )}

               {/* Settings Slider */}
               <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-card-border">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex justify-between">
                        <span>Playback Speed</span>
                        <span className="text-indigo-400">{voiceRate}x</span>
                     </label>
                     <input 
                        type="range" 
                        min="0.5" 
                        max="2" 
                        step="0.25" 
                        value={voiceRate}
                        onChange={(e) => {
                           const val = parseFloat(e.target.value);
                           setVoiceRate(val);
                           if (isPlayingAudio) {
                              speakContent();
                           }
                        }}
                        className="w-full accent-indigo-600 cursor-pointer h-1 bg-card-border rounded-lg"
                     />
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex justify-between">
                        <span>Synthesized Timbre Voice</span>
                        <span className="text-slate-500 text-[9px] truncate max-w-[150px]">{selectedVoiceName || 'Default'}</span>
                     </label>
                     <select 
                        value={selectedVoiceName}
                        onChange={(e) => {
                           setSelectedVoiceName(e.target.value);
                           if (isPlayingAudio) {
                              setTimeout(() => speakContent(), 50);
                           }
                        }}
                        className="w-full px-3 py-2 bg-surface-muted text-xs font-black uppercase text-foreground border border-card-border rounded-xl cursor-pointer"
                     >
                        {availableVoices.filter(v => v.lang.toLowerCase().startsWith('en')).map(v => (
                           <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                        ))}
                        {availableVoices.filter(v => !v.lang.toLowerCase().startsWith('en')).slice(0, 5).map(v => (
                           <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                        ))}
                     </select>
                  </div>
               </div>
            </div>
         )}

         {/* TAB CONTENT: SUMMARY */}
         {activeSuiteTab === 'summary' && (
            <div className="space-y-4">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                     <h4 className="text-sm font-black uppercase tracking-widest text-[11px] text-indigo-400">Executive takeaways</h4>
                     <p className="text-xs text-slate-400 font-medium italic">
                        Generate a 3-bullet insight summarized securely via the active Gemini model.
                     </p>
                  </div>
                  {!summaryText && (
                     <button 
                       disabled={isSummarizing}
                       onClick={handleGenerateSummary}
                       className="px-6 py-3 bg-foreground hover:bg-neutral-800 text-background rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
                     >
                        {isSummarizing ? 'Compiling Catalyst...' : 'Compile Takeaways'}
                     </button>
                  )}
               </div>

               {isSummarizing && (
                  <div className="space-y-3 py-6 animate-pulse">
                     <div className="h-3 bg-surface-muted rounded-full w-full"></div>
                     <div className="h-3 bg-surface-muted rounded-full w-5/6"></div>
                     <div className="h-3 bg-surface-muted rounded-full w-2/3"></div>
                  </div>
               )}

               {summaryText && (
                  <div className="p-6 bg-surface-muted rounded-2xl border border-card-border space-y-4 relative overflow-hidden">
                     <div className="absolute top-4 right-4 text-[8px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-widest">
                        Synthesis Ready
                     </div>
                     <div className="flex gap-4">
                        <div className="w-1.5 bg-indigo-500 rounded-full h-auto"></div>
                        <p className="text-xs text-slate-300 font-semibold italic leading-relaxed whitespace-pre-line">
                           {summaryText}
                        </p>
                     </div>
                     <button 
                       onClick={() => {
                          setSummaryText('');
                       }}
                       className="text-[9px] font-black text-slate-500 hover:text-indigo-600 uppercase tracking-widest pt-2 block"
                     >
                        Clear Synthesis
                     </button>
                  </div>
               )}
            </div>
         )}

         {/* TAB CONTENT: QNA */}
         {activeSuiteTab === 'qna' && (
            <div className="space-y-6">
               <div className="space-y-1">
                  <h4 className="text-sm font-black uppercase tracking-widest text-[11px] text-indigo-400">Collaborative mind syncer</h4>
                  <p className="text-xs text-slate-400 font-medium italic">
                     Establish a responsive bridge directly with the author's AI persona to probe deeper.
                  </p>
               </div>

               {/* Chat Log */}
               <div className="space-y-4 max-h-[250px] overflow-y-auto scrollbar-hide">
                  {chatAnswers.length === 0 ? (
                     <div className="text-center py-6 text-slate-500 border border-dashed border-card-border rounded-2xl text-[10px] font-black uppercase tracking-widest opacity-60">
                        No active probes established. Type below to query the thesis.
                     </div>
                  ) : (
                     chatAnswers.map((item, idx) => (
                        <div key={idx} className="space-y-2 animate-fadeIn">
                           <div className="flex justify-end">
                              <div className="p-3 bg-indigo-600/10 border border-indigo-500/20 text-indigo-200 text-xs rounded-2xl max-w-[85%] font-medium italic">
                                 {item.q}
                              </div>
                           </div>
                           <div className="flex justify-start">
                              <div className="p-4 bg-surface-muted border border-card-border text-slate-300 text-xs rounded-2xl max-w-[85%] font-semibold leading-relaxed">
                                 {item.a}
                              </div>
                           </div>
                        </div>
                     ))
                  )}
               </div>

               {/* Chat Input */}
               <form onSubmit={handleAskQuestion} className="flex gap-2">
                  <input 
                     type="text" 
                     placeholder="QUERY THESIS DISCOVERY LAYER..." 
                     value={chatQuery}
                     onChange={(e) => setChatQuery(e.target.value)}
                     disabled={isChatting}
                     className="flex-1 px-4 py-3 bg-surface-muted text-xs font-black uppercase text-foreground placeholder-slate-500 border border-card-border rounded-xl focus:border-indigo-500 transition-colors focus:outline-none"
                  />
                  <button 
                     type="submit"
                     disabled={isChatting || !chatQuery.trim()}
                     className="px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-colors disabled:opacity-50 flex items-center justify-center cursor-pointer"
                  >
                     {isChatting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  </button>
               </form>
            </div>
         )}
      </div>

      <article className="max-w-none mb-24">
        {isGenerating ? (
          <div className="editorial-card p-10 md:p-14 text-center space-y-6 bg-indigo-50/10 border-dashed border-indigo-500/40 relative overflow-hidden dark:bg-indigo-950/10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05)_0,transparent_100%)]"></div>
            <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
              <Zap className="w-6 h-6 text-indigo-600 fill-indigo-600/20" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-foreground uppercase tracking-tight italic">Reconstructing Narrative Stream...</h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest leading-relaxed max-w-md mx-auto">
                Synapse has detected a placeholder or unpopulated transmission. Synthesizing full story depth via the neural layer.
              </p>
            </div>
            <div className="flex justify-center gap-3">
              <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-bounce"></div>
            </div>
          </div>
        ) : (
          <div className="markdown-body">
            <ReactMarkdown
              components={{
                img: (props: any) => (
                  <img
                    {...props}
                    className="w-full max-w-4xl mx-auto rounded-[2rem] border border-card-border shadow-2xl my-10 object-cover"
                    referrerPolicy="no-referrer"
                  />
                )
              }}
            >
              {post.content || ''}
            </ReactMarkdown>
          </div>
        )}
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
    </div>
  );
}
