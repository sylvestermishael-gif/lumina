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
    } catch (error: any) {
      console.error('Authentication Error:', error);
      // Handle "cancelled-popup-request" gracefully
      if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        console.log('Authentication popup was closed or cancelled.');
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
    await setDoc(userRef, { ...profile, ...data }, { merge: true });
    setProfile((prev: any) => ({ ...prev, ...data }));
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
