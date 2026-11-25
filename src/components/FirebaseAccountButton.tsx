import React, { useState } from 'react';
import { LogIn, LogOut } from 'lucide-react';
import { useFirebaseAuth } from '../context/FirebaseAuthContext';

export const FirebaseAccountButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { user, loading, configured, signInWithGoogle, signOut } = useFirebaseAuth();
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setError(null);
    try {
      if (user) await signOut();
      else await signInWithGoogle();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Google sign-in failed.';
      setError(message);
    }
  };

  const label = user ? 'Sign out' : 'Sign in with Google';
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading || (!configured && !user)}
      aria-label={label}
      title={error || (configured ? label : 'Firebase is not configured for this deployment')}
      className={`flex items-center gap-2 rounded-full border border-m3-outline-variant/30 bg-m3-surface-container-high/70 px-3 py-1.5 text-xs font-semibold text-m3-on-surface hover:bg-m3-surface-container-highest disabled:cursor-not-allowed disabled:opacity-50 ${compact ? 'px-2.5' : ''}`}
    >
      {user?.photoURL ? (
        <img src={user.photoURL} alt="" className="h-5 w-5 rounded-full" />
      ) : user ? (
        <LogOut className="h-4 w-4" />
      ) : (
        <LogIn className="h-4 w-4" />
      )}
      {!compact && <span className="max-w-28 truncate">{user?.displayName || (user ? 'Account' : 'Google')}</span>}
    </button>
  );
};
