import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { 
  User, 
  MapPin, 
  Globe, 
  Twitter, 
  Github, 
  Camera, 
  Save, 
  Zap, 
  Loader2,
  Check,
  ChevronRight,
  Monitor,
  Shield,
  ShieldCheck,
  CreditCard,
  Lock,
  Mic2,
  Radio,
  Volume2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { cn, getApiUrl } from '../lib/utils';

type Tab = 'profile' | 'account' | 'privacy' | 'billing';

export default function Settings() {
  const { profile, updateProfile, user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [loading, setLoading] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Paystack Script Loader
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleUpgrade = (e: React.FormEvent) => {
    e.preventDefault();
    const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
    
    if (!publicKey) {
      toast.error('Paystack Configuration Missing');
      return;
    }

    setLoading(true);

    // @ts-ignore
    const handler = window.PaystackPop.setup({
      key: publicKey,
      email: user?.email || '',
      amount: 18000 * 100,
      currency: 'NGN',
      ref: (new Date()).getTime().toString(),
      metadata: {
        userId: user?.uid,
        custom_fields: [
          {
            display_name: "Plan",
            variable_name: "plan",
            value: "Nexus Premium"
          }
        ]
      },
      callback: async (response: any) => {
        setLoading(true);
        try {
          const verifyResponse = await fetch(getApiUrl(`/api/paystack/verify/${response.reference}`));
          const verifyData = await verifyResponse.json();
          
          if (verifyData.data.status === 'success') {
            await updateProfile({ isPremium: true });
            setIsCheckoutOpen(false);
            toast.success('Neural frequency elevated to Premium status');
          } else {
            throw new Error('Payment verification failed');
          }
        } catch (error) {
           toast.error('Failed to verify premium status');
        } finally {
          setLoading(false);
        }
      },
      onClose: () => {
        setLoading(false);
        toast.error('Secure payment tunnel closed');
      }
    });

    handler.openIframe();
  };

  const [formData, setFormData] = useState({
    displayName: '',
    username: '',
    bio: '',
    location: '',
    website: '',
    twitter: '',
    github: '',
    photoURL: null as string | null,
    coverURL: null as string | null,
    interests: [] as string[]
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        username: profile.username || '',
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
        twitter: profile.twitter || '',
        github: profile.github || '',
        photoURL: profile.photoURL || null,
        coverURL: profile.coverURL || null,
        interests: profile.interests || []
      });
    }
  }, [profile]);

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin" />
            <Zap className="absolute inset-0 m-auto w-6 h-6 text-indigo-600 animate-pulse" />
          </div>
          <div className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 italic">Syncing Neural Core...</div>
        </div>
      </div>
    );
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) { // 1MB limit for Firestore base64
      toast.error('Image too large. Max 1MB for neural sync.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setFormData(prev => ({
        ...prev,
        [type === 'photo' ? 'photoURL' : 'coverURL']: base64String
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(formData);
      toast.success('Neural identity updated successfully');
    } catch (error) {
      toast.error('Failed to sync changes with neural core');
    } finally {
      setLoading(false);
    }
  };

  const handleDowngrade = async () => {
    setLoading(true);
    try {
      await updateProfile({ isPremium: false });
      toast.success('Subscription cancelled. Account set to free tier.');
    } catch (error) {
      toast.error('Failed to update subscription status');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Identity', icon: User },
    { id: 'account', label: 'Systems', icon: Monitor },
    { id: 'privacy', label: 'Security', icon: Shield },
    { id: 'billing', label: 'Credits', icon: CreditCard },
  ];

  return (
    <div className="flex-1 bg-background overflow-y-auto scrollbar-hide">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-16">
        <header className="mb-8 md:mb-16">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-1 md:w-1.5 h-6 md:h-8 bg-indigo-600 rounded-full"></div>
             <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-foreground uppercase italic">Account <span className="premium-gradient-text">Settings</span></h1>
          </div>
          <p className="text-slate-500 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] md:tracking-[0.3em] ml-4 md:ml-5">Manage your digital profile and system preferences</p>
        </header>

        <div className="grid lg:grid-cols-[280px_1fr] gap-8 md:gap-12 items-start">
          {/* Settings Sidebar */}
          <aside className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-2 md:gap-4 pb-4 lg:pb-0 scrollbar-hide snap-x">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={cn(
                  "flex-shrink-0 lg:w-full flex items-center justify-between p-4 lg:p-5 rounded-2xl lg:rounded-[1.5rem] transition-all group snap-start",
                  activeTab === tab.id 
                    ? "bg-foreground text-background shadow-xl lg:shadow-2xl" 
                    : "bg-surface-muted text-slate-500 hover:bg-card-border"
                )}
              >
                <div className="flex items-center gap-3 md:gap-4">
                   <tab.icon className={cn("w-4 h-4 md:w-5 md:h-5", activeTab === tab.id ? "text-indigo-400" : "text-slate-400")} />
                   <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                     {tab.id === 'profile' ? 'Profile' : 
                      tab.id === 'account' ? 'Account' : 
                      tab.id === 'privacy' ? 'Privacy' : 'Billing'}
                   </span>
                </div>
                <ChevronRight className={cn("hidden lg:block w-4 h-4 transition-transform", activeTab === tab.id ? "rotate-90 text-indigo-400" : "text-slate-300 group-hover:translate-x-1")} />
              </button>
            ))}

            <div className="hidden lg:block mt-12 p-8 editorial-card bg-indigo-600 rounded-[2.5rem] text-white space-y-6 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
               <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-indigo-200" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Your Plan</span>
               </div>
               <div className="space-y-2">
                  <div className="text-3xl font-black tracking-tighter uppercase italic leading-none">{profile?.isPremium ? 'Premium' : 'Free Plan'}</div>
                  <p className="text-[9px] font-bold text-indigo-200 uppercase tracking-widest opacity-80 italic">Member ID: {profile?.id?.slice(0, 8)}</p>
               </div>
               {!profile?.isPremium && (
                 <button 
                   onClick={() => setIsCheckoutOpen(true)}
                   className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 shadow-xl transition-all"
                 >
                    Upgrade Now
                 </button>
               )}
               {profile?.isPremium && (
                 <div className="w-full py-4 flex items-center justify-center gap-2 bg-white/20 rounded-2xl font-black text-[10px] uppercase tracking-widest">
                    <ShieldCheck className="w-4 h-4" /> Verified Profile
                 </div>
               )}
            </div>
          </aside>

          {/* Settings Content */}
          <main className="space-y-12">
            <AnimatePresence mode="wait">
              {activeTab === 'profile' && (
                <motion.form 
                  key="profile"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleSubmit}
                  className="space-y-12"
                >
                  {/* Identity Preview Card */}
                  <div className="editorial-card overflow-hidden bg-card-bg border border-card-border rounded-[3rem] shadow-2xl shadow-black/5">
                     <div className="h-48 relative overflow-hidden">
                        {formData.coverURL && <img src={formData.coverURL} className="w-full h-full object-cover" alt="Banner" />}
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"></div>
                        <div className="absolute top-6 right-6 flex gap-2">
                           <label className="p-4 bg-black/50 backdrop-blur-xl text-white rounded-2xl hover:bg-black/70 transition-all border border-white/10 cursor-pointer">
                              <Camera className="w-5 h-5" />
                              <input 
                                 type="file" 
                                 className="hidden" 
                                 accept="image/*"
                                 onChange={(e) => handleImageUpload(e, 'cover')}
                              />
                           </label>
                           <button 
                             type="button" 
                             onClick={() => {
                               const url = prompt('Enter Banner URL');
                               if (url) setFormData(p => ({ ...p, coverURL: url }));
                             }}
                             className="p-4 bg-black/50 backdrop-blur-xl text-white rounded-2xl hover:bg-black/70 transition-all border border-white/10"
                           >
                              <Globe className="w-5 h-5" />
                           </button>
                        </div>
                     </div>
                     <div className="px-10 pb-10 -mt-16 relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div className="flex items-end gap-6">
                           <div className="relative group">
                              {formData.photoURL && <img src={formData.photoURL} className="w-32 h-32 rounded-[2.5rem] border-4 border-background shadow-2xl object-cover" alt="Avatar" />}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem] flex items-center justify-center gap-2">
                                 <label className="p-2 cursor-pointer hover:scale-110 transition-transform">
                                    <Camera className="w-6 h-6 text-white" />
                                    <input 
                                       type="file" 
                                       className="hidden" 
                                       accept="image/*"
                                       onChange={(e) => handleImageUpload(e, 'photo')}
                                    />
                                 </label>
                                 <button 
                                   type="button" 
                                   onClick={() => {
                                     const url = prompt('Enter Avatar URL');
                                     if (url) setFormData(p => ({ ...p, photoURL: url }));
                                   }}
                                   className="p-2 hover:scale-110 transition-transform"
                                 >
                                    <Globe className="w-6 h-6 text-white" />
                                 </button>
                              </div>
                           </div>
                           <div className="mb-4">
                              <h2 className="text-3xl font-black tracking-tighter text-foreground uppercase italic">{formData.displayName || 'Unnamed Architect'}</h2>
                              <p className="text-indigo-600 font-black text-xs uppercase tracking-widest mt-1">@{formData.username || 'neural_alias'}</p>
                              
                              <div className="flex gap-2 mt-4">
                                 {['bottts', 'avataaars', 'pixel-art', 'lorelei'].map(style => (
                                    <button
                                       key={style}
                                       type="button"
                                       onClick={() => setFormData(p => ({ ...p, photoURL: `https://api.dicebear.com/7.x/${style}/svg?seed=${profile?.id}` }))}
                                       className="w-8 h-8 rounded-full border border-card-border overflow-hidden bg-surface-muted hover:border-indigo-500 transition-all"
                                       title={`Use ${style} avatar`}
                                    >
                                       <img src={`https://api.dicebear.com/7.x/${style}/svg?seed=${profile?.id}`} alt={style} />
                                    </button>
                                 ))}
                              </div>
                           </div>
                        </div>
                        <div className="flex items-center gap-8 mb-4">
                           <div className="text-center">
                              <div className="text-xl font-black text-foreground">{profile?.followersCount || 0}</div>
                              <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Followers</div>
                           </div>
                           <div className="text-center">
                              <div className="text-xl font-black text-foreground">{profile?.followingCount || 0}</div>
                              <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Following</div>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Forms sections */}
                  <div className="grid md:grid-cols-2 gap-8">
                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic ml-5">Display Name</label>
                        <div className="relative">
                           <User className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                           <input 
                              type="text" 
                              value={formData.displayName}
                              onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                              className="editorial-input pl-14 w-full py-5 text-sm font-bold bg-surface-muted focus:bg-card-bg"
                              placeholder="Your full name"
                           />
                        </div>
                     </div>
                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic ml-5">Username</label>
                        <div className="relative">
                           <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold">@</span>
                           <input 
                              type="text" 
                              value={formData.username}
                              onChange={e => setFormData({ ...formData, username: e.target.value })}
                              className="editorial-input pl-12 w-full py-5 text-sm font-bold bg-surface-muted focus:bg-card-bg"
                              placeholder="username"
                           />
                        </div>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic ml-5">About You (Bio)</label>
                     <textarea 
                        value={formData.bio}
                        onChange={e => setFormData({ ...formData, bio: e.target.value })}
                        className="editorial-input w-full p-8 text-sm font-bold bg-surface-muted focus:bg-card-bg min-h-[150px] resize-none"
                        placeholder="Tell the world about yourself..."
                     />
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic ml-5">Location</label>
                        <div className="relative">
                           <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                           <input 
                              type="text" 
                              value={formData.location}
                              onChange={e => setFormData({ ...formData, location: e.target.value })}
                              className="editorial-input pl-14 w-full py-5 text-sm font-bold bg-surface-muted focus:bg-card-bg"
                              placeholder="City, Country"
                           />
                        </div>
                     </div>
                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic ml-5">Website</label>
                        <div className="relative">
                           <Globe className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                           <input 
                              type="text" 
                              value={formData.website}
                              onChange={e => setFormData({ ...formData, website: e.target.value })}
                              className="editorial-input pl-14 w-full py-5 text-sm font-bold bg-surface-muted focus:bg-card-bg"
                              placeholder="https://example.com"
                           />
                        </div>
                     </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8 pt-8 border-t border-card-border">
                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic ml-5">Twitter Profile</label>
                        <div className="relative">
                           <Twitter className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                           <input 
                              type="text" 
                              value={formData.twitter}
                              onChange={e => setFormData({ ...formData, twitter: e.target.value })}
                              className="editorial-input pl-14 w-full py-5 text-sm font-bold bg-surface-muted focus:bg-card-bg"
                              placeholder="@handle"
                           />
                        </div>
                     </div>
                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic ml-5">GitHub Profile</label>
                        <div className="relative">
                           <Github className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                           <input 
                              type="text" 
                              value={formData.github}
                              onChange={e => setFormData({ ...formData, github: e.target.value })}
                              className="editorial-input pl-14 w-full py-5 text-sm font-bold bg-surface-muted focus:bg-card-bg"
                              placeholder="github_user"
                           />
                        </div>
                     </div>
                  </div>

                  <div className="space-y-6 pt-8 border-t border-card-border">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic ml-5">Your Interests & Topics</label>
                     <div className="flex flex-wrap gap-4 p-8 bg-surface-muted rounded-[2.5rem] border border-card-border">
                        {formData.interests.map((interest, i) => (
                           <div 
                              key={i} 
                              className="px-5 py-2 bg-foreground text-background rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-in fade-in zoom-in duration-300"
                           >
                              {interest}
                              <button 
                                 type="button"
                                 onClick={() => setFormData(p => ({ ...p, interests: p.interests.filter((_, idx) => idx !== i) }))}
                                 className="hover:text-red-500 transition-colors"
                              >
                                 <Zap className="w-3 h-3 fill-current" />
                              </button>
                           </div>
                        ))}
                        <button 
                           type="button"
                           onClick={() => {
                              const tag = prompt('Enter Interest/Topic:');
                              if (tag) setFormData(p => ({ ...p, interests: [...p.interests, tag] }));
                           }}
                           className="px-5 py-2 border-2 border-dashed border-slate-300 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest hover:border-indigo-500 hover:text-indigo-600 transition-all"
                        >
                           + Add Focus
                        </button>
                     </div>
                  </div>

                  <div className="pt-12 flex justify-end">
                     <button 
                        type="submit"
                        disabled={loading}
                        className="group flex items-center gap-4 px-12 py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] transition-all shadow-3xl shadow-indigo-500/20 active:scale-[0.98]"
                     >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Sync Neural Core</>}
                     </button>
                  </div>
                </motion.form>
              )}

              {activeTab === 'account' && (
                <motion.div 
                  key="account"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-12"
                >
                  <div className="editorial-card p-12 bg-card-bg border border-card-border rounded-[3rem] space-y-10 shadow-2xl shadow-black/5">
                    <div className="space-y-4">
                       <h3 className="text-2xl font-black text-foreground uppercase italic tracking-tighter">Login & Security</h3>
                       <p className="text-slate-500 text-xs font-black uppercase tracking-widest">Manage your email and authentication settings</p>
                    </div>

                    <div className="space-y-8">
                       <div className="flex items-center justify-between p-8 bg-surface-muted rounded-[2rem] border border-card-border group">
                          <div className="space-y-1">
                             <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email Address</div>
                             <div className="text-sm font-bold text-foreground">{profile?.email}</div>
                          </div>
                          <button className="px-6 py-3 bg-card-bg border border-card-border rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-foreground hover:text-background transition-all">Change Email</button>
                       </div>

                       <div className="flex items-center justify-between p-8 bg-surface-muted rounded-[2rem] border border-card-border group">
                          <div className="space-y-1">
                             <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Password</div>
                             <div className="text-sm font-bold text-foreground">••••••••••••</div>
                          </div>
                          <button className="px-6 py-3 bg-card-bg border border-card-border rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-foreground hover:text-background transition-all">Reset Password</button>
                       </div>
                    </div>
                  </div>

                  <div className="editorial-card p-12 bg-red-500/5 border border-red-500/20 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-8">
                     <div className="space-y-2 text-center md:text-left">
                        <h4 className="text-xl font-black text-red-500 uppercase italic tracking-tighter">Delete Account</h4>
                        <p className="text-[9px] font-bold text-red-400 uppercase tracking-widest">Permanently remove your profile and all posts</p>
                     </div>
                     <button className="px-8 py-4 bg-red-500 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-red-600 shadow-xl shadow-red-500/20 active:scale-95 transition-all">Delete Forever</button>
                  </div>
                </motion.div>
              )}

              {activeTab === 'privacy' && (
                <motion.div 
                  key="privacy"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-12"
                >
                  <div className="editorial-card p-12 bg-card-bg border border-card-border rounded-[3rem] space-y-10 shadow-2xl shadow-black/5">
                    <div className="space-y-4">
                       <h3 className="text-2xl font-black text-foreground uppercase italic tracking-tighter">Privacy Settings</h3>
                       <p className="text-slate-500 text-xs font-black uppercase tracking-widest">Control how you appear on the platform</p>
                    </div>

                    <div className="space-y-6">
                       {[
                         { title: 'Public Profile', desc: 'Allow others to find and follow your profile', enabled: true },
                         { title: 'Share Usage Data', desc: 'Help us improve the app by sharing anonymous statistics', enabled: false },
                         { title: 'Search Engine Indexing', desc: 'Allow Google and other search engines to find your posts', enabled: true },
                       ].map((item, i) => (
                         <div key={i} className="flex items-center justify-between p-6 hover:bg-surface-muted rounded-2xl transition-colors group">
                            <div className="space-y-1">
                               <div className="text-xs font-black text-foreground uppercase tracking-tight italic">{item.title}</div>
                               <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{item.desc}</p>
                            </div>
                            <button className={cn(
                              "w-12 h-6 rounded-full transition-all relative flex items-center px-1",
                              item.enabled ? "bg-indigo-600" : "bg-slate-300"
                            )}>
                               <div className={cn("w-4 h-4 bg-white rounded-full shadow-sm transition-all", item.enabled ? "translate-x-6" : "translate-x-0")}></div>
                            </button>
                         </div>
                       ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'billing' && (
                <motion.div 
                  key="billing"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-12"
                >
                  <div className="grid md:grid-cols-2 gap-8">
                     <div className="editorial-card p-10 bg-foreground text-background rounded-[3rem] space-y-8 shadow-3xl shadow-indigo-500/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
                        <div className="flex items-center gap-3">
                           <Zap className="w-6 h-6 text-indigo-400 fill-indigo-400" />
                           <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Wallet Balance</span>
                        </div>
                        <div className="space-y-1">
                           <div className="text-6xl font-black tracking-tighter italic">2,400</div>
                           <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-60">Available Credits</p>
                        </div>
                        <button className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500 shadow-xl transition-all active:scale-95">Add Credits</button>
                     </div>

                     <div className="editorial-card p-10 bg-card-bg border border-card-border rounded-[3rem] space-y-8 flex flex-col justify-center">
                        <div className="flex items-center gap-3">
                           <div className={cn("w-2 h-2 rounded-full", profile?.isPremium ? "bg-indigo-500 animate-pulse" : "bg-green-500")}></div>
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Current Plan</span>
                        </div>
                        <div>
                           <h4 className="text-3xl font-black tracking-tighter text-foreground uppercase italic leading-none">
                              {profile?.isPremium ? 'Premium Plan' : 'Free Plan'}
                           </h4>
                           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2 italic">Renews on June 18, 2026</p>
                        </div>
                        <div className="pt-6 border-t border-card-border">
                           {!profile?.isPremium ? (
                             <button 
                               onClick={() => setIsCheckoutOpen(true)}
                               className="flex items-center gap-3 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:gap-5 transition-all"
                             >
                                Upgrade to Premium <ChevronRight className="w-4 h-4" />
                             </button>
                           ) : (
                             <button 
                               onClick={handleDowngrade}
                               disabled={loading}
                               className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors disabled:opacity-50"
                             >
                                {loading ? 'Processing...' : 'Cancel Subscription'}
                             </button>
                           )}
                        </div>
                     </div>
                  </div>

                  <div className="editorial-card bg-card-bg border border-card-border rounded-[3rem] overflow-hidden">
                     <div className="p-10 border-b border-card-border flex items-center justify-between">
                        <h3 className="text-xl font-black text-foreground uppercase italic tracking-tighter">
                           Payment History
                        </h3>
                        <CreditCard className="w-5 h-5 text-slate-400" />
                     </div>
                     
                     <div className="divide-y divide-card-border">
                        {[
                          { date: 'May 16, 2026', type: 'Add Credits', amount: '+500', status: 'Success' },
                          { date: 'May 12, 2026', type: 'Monthly Plan', amount: '$0.00', status: 'Free' },
                          { date: 'Apr 18, 2026', type: 'Welcome Bonus', amount: '+2000', status: 'Success' },
                        ].map((tx, i) => (
                          <div key={i} className="p-8 flex items-center justify-between hover:bg-surface-muted transition-colors">
                             <div className="space-y-1">
                                <div className="text-xs font-black text-foreground uppercase tracking-tight">{tx.type}</div>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{tx.date}</p>
                             </div>
                             <div className="text-right space-y-1">
                                <div className="text-sm font-black text-foreground">{tx.amount}</div>
                                <div className="text-[8px] font-black text-green-500 uppercase tracking-widest px-2 py-0.5 bg-green-500/10 rounded-full inline-block">{tx.status}</div>
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Checkout Modal */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-3xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-card-bg border border-card-border rounded-[3.5rem] shadow-4xl overflow-hidden"
            >
               <div className="p-12 space-y-10">
                  <header className="space-y-4">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
                              <Zap className="w-5 h-5 fill-current" />
                           </div>
                           <h2 className="text-3xl font-black tracking-tighter text-foreground uppercase italic leading-none">Go <span className="premium-gradient-text">Premium</span></h2>
                        </div>
                        <div className="text-right">
                           <div className="text-2xl font-black text-foreground">₦18,000</div>
                           <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Approx. $12.00 / Monthly</div>
                        </div>
                     </div>
                     <p className="text-slate-500 text-xs font-black uppercase tracking-widest">Upgrade to unlock specialized neural capabilities:</p>
                     
                     <div className="grid grid-cols-1 gap-4 py-4">
                        {[
                          { icon: Mic2, text: 'Generate AI Voiceovers' },
                          { icon: Radio, text: 'Convert Blogs to Podcasts' },
                          { icon: Volume2, text: 'Text-to-Speech Enabled' },
                        ].map((feature, i) => (
                           <div key={i} className="flex items-center gap-3 p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                              <feature.icon className="w-4 h-4 text-indigo-600" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">{feature.text}</span>
                           </div>
                        ))}
                     </div>
                  </header>

                  <form onSubmit={handleUpgrade} className="space-y-6">
                     <div className="pt-8 space-y-6">
                        <button 
                           type="submit"
                           disabled={loading}
                           className="w-full py-6 bg-foreground text-background rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-slate-800 transition-all shadow-3xl flex items-center justify-center gap-4 disabled:opacity-50"
                        >
                           {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShieldCheck className="w-5 h-5" /> Activate Premium</>}
                        </button>
                        <div className="flex items-center justify-center gap-3 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                           <Lock className="w-3 h-3" /> Secure Payment Protocol
                        </div>
                     </div>
                  </form>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
