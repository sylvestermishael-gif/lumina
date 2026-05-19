import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User 
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import rawConfig from '../../firebase-applet-config.json';
import { toast } from 'react-hot-toast';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  isAuthenticating: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        
        const fetchProfile = async (retryCount = 0) => {
          try {
            const userSnap = await getDoc(userRef);
            
            if (!userSnap.exists()) {
              const newProfile = {
                id: user.uid,
                displayName: user.displayName,
                username: user.email?.split('@')[0] || `user_${user.uid.slice(0, 5)}`,
                email: user.email,
                photoURL: user.photoURL,
                coverURL: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop',
                createdAt: serverTimestamp(),
                bio: '',
                location: '',
                website: '',
                twitter: '',
                github: '',
                interests: [],
                isPremium: false,
                followersCount: 0,
                followingCount: 0
              };
              await setDoc(userRef, newProfile);
              setProfile(newProfile);
            } else {
              setProfile(userSnap.data());
            }
          } catch (error: any) {
            console.error(`Failed to fetch user profile (attempt ${retryCount + 1}):`, error);
            
            if (retryCount < 1 && (error.message?.includes('offline') || error.code === 'unavailable')) {
              // Quick retry in case of transient network glitch
              setTimeout(() => fetchProfile(retryCount + 1), 2000);
              return;
            }

            if (error.message?.includes('offline') || error.code === 'unavailable') {
               toast.error('Syncing error: The neural link is offline. If you just created your database, wait a moment for it to sync.', {
                 duration: 8000,
                 id: 'firestore-offline-error',
                 icon: '📡'
               });
            }
          }
        };

        fetchProfile();
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
  }, []);

  const login = async () => {
    if (isAuthenticating) return;
    
    setIsAuthenticating(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
      toast.success('Neural link established.');
    } catch (error: any) {
      console.error('Authentication Error:', error);
      
      if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        const domain = window.location.hostname;
        toast.error('Uplink cancelled or blocked. Ensure popups are allowed and authorized.', { duration: 6000 });
        console.error(`Popup closed. To fix this:
1. Go to Firebase Console > Authentication > Settings > Authorized Domains
2. Add these domains:
   - ${domain}
   - ais-dev-p5mnit4kjormulu6xg73tt-443608093980.europe-west2.run.app
   - ais-pre-p5mnit4kjormulu6xg73tt-443608093980.europe-west2.run.app
3. If it still fails, click the 'Open in new tab' icon in the top right of this preview.`);
      } else if (error.code === 'auth/unauthorized-domain') {
        const domain = window.location.hostname;
        toast.error(`Domain "${domain}" is not authorized!`, { duration: 8000 });
        console.error(`Add "${domain}" to Authorized Domains in Firebase Console.`);
      } else {
        toast.error(`Authentication Failed: ${error.message}`);
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateProfile = async (data: any) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    try {
      await setDoc(userRef, { ...profile, ...data }, { merge: true });
      setProfile((prev: any) => ({ ...prev, ...data }));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAuthenticating, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
