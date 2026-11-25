import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as signOutFirebase,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { firebaseAuth, firestore, isFirebaseConfigured } from '../services/firebase';

interface FirebaseAuthContextValue {
  user: User | null;
  loading: boolean;
  configured: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextValue | null>(null);

export const FirebaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseAuth || !firestore) {
      setLoading(false);
      return;
    }

    return onAuthStateChanged(firebaseAuth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (!currentUser || !firestore) return;

      try {
        const profile = doc(firestore, 'users', currentUser.uid);
        const existing = await getDoc(profile);
        if (!existing.exists()) {
          await setDoc(profile, {
            uid: currentUser.uid,
            displayName: currentUser.displayName || '',
            email: currentUser.email || '',
            photoURL: currentUser.photoURL || '',
            createdAt: serverTimestamp(),
          });
        }
      } catch (error) {
        console.error('Could not save the Sonora account profile:', error);
      }
    });
  }, []);

  const signInWithGoogle = async () => {
    if (!firebaseAuth) throw new Error('Firebase is not configured for this deployment.');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    await signInWithPopup(firebaseAuth, provider);
  };

  const signOut = async () => {
    if (!firebaseAuth) return;
    await signOutFirebase(firebaseAuth);
  };

  return (
    <FirebaseAuthContext.Provider value={{ user, loading, configured: isFirebaseConfigured, signInWithGoogle, signOut }}>
      {children}
    </FirebaseAuthContext.Provider>
  );
};

export function useFirebaseAuth(): FirebaseAuthContextValue {
  const context = useContext(FirebaseAuthContext);
  if (!context) throw new Error('useFirebaseAuth must be used within FirebaseAuthProvider');
  return context;
}
