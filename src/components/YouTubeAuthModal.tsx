import React, { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Check,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  LogOut,
  HelpCircle,
  ShieldCheck,
  Sparkles,
  KeyRound,
  ChevronDown,
  ChevronUp,
  QrCode,
  Smartphone,
  Share2,
  Link,
  Laptop,
} from 'lucide-react';
import {
  api,
  getStoredAuth,
  setStoredAuth,
  encodeSyncToken,
  decodeSyncToken,
} from '../services/api';
import { AuthStatus } from '../types';

interface YouTubeAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthChange?: () => void;
}

export const YouTubeAuthModal: React.FC<YouTubeAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthChange,
}) => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [activeTab, setActiveTab] = useState<'pair' | 'headers' | 'oauth'>('oauth');

  const [authStatus, setAuthStatus] = useState<AuthStatus>(() => {
    const stored = getStoredAuth();
    if (stored?.authenticated) {
      return {
        authenticated: true,
        authType: stored.authType || 'headers',
        canGoogleSignIn: true,
      };
    }
    return {
      authenticated: false,
      authType: 'none',
      canGoogleSignIn: false,
    };
  });

  // ── Pairing & Cross-Device Sync State ──────────────────────────────────────
  const [pairCode, setPairCode] = useState<string>('');
  const [pairExpiresIn, setPairExpiresIn] = useState<number>(0);
  const [pairLoading, setPairLoading] = useState<boolean>(false);
  const [qrSvg, setQrSvg] = useState<string>('');
  const [syncUrl, setSyncUrl] = useState<string>('');
  const [syncLinkCopied, setSyncLinkCopied] = useState<boolean>(false);
  const [pairCodeCopied, setPairCodeCopied] = useState<boolean>(false);

  // Mobile PIN claim state
  const [pinInput, setPinInput] = useState<string>('');
  const [pinLoading, setPinLoading] = useState<boolean>(false);
  const [pinError, setPinError] = useState<string | null>(null);

  // Magic Link claim state
  const [magicLinkInput, setMagicLinkInput] = useState<string>('');
  const [magicLinkLoading, setMagicLinkLoading] = useState<boolean>(false);
  const [magicLinkError, setMagicLinkError] = useState<string | null>(null);
  const [showMagicInput, setShowMagicInput] = useState<boolean>(false);

  // Headers Tab state
  const [headersInput, setHeadersInput] = useState('');
  const [headersLoading, setHeadersLoading] = useState(false);
  const [headersError, setHeadersError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  // OAuth Tab state
  const [oauthLoading, setOauthLoading] = useState(false);
  const [oauthData, setOauthData] = useState<{
    user_code: string;
    verification_url: string;
    device_code: string;
    expires_in: number;
    interval: number;
  } | null>(null);
  const [oauthPolling, setOauthPolling] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // General feedback
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Generate pairing data (QR code + 6-digit PIN)
  const generatePairingData = useCallback(async () => {
    const stored = getStoredAuth();
    if (!stored || !stored.authenticated) return;
    setPairLoading(true);

    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://sonora-web-music.vercel.app';

    try {
      // 1. Request 6-digit PIN code from server FIRST
      const pairRes = await api.generatePairCode(stored, 600);
      if (pairRes && pairRes.code) {
        setPairCode(pairRes.code);
        setPairExpiresIn(pairRes.expires_in || 600);

        // Render QR Code pointing to ?pair=<code> (ultra-lightweight ~45 bytes, renders in ~5ms)
        const pairLink = `${origin}/?pair=${pairRes.code}`;
        const pairSvg = await QRCode.toString(pairLink, {
          type: 'svg',
          margin: 1,
          width: 220,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        });
        setQrSvg(pairSvg);
      }

      // 2. Prepare full Magic Sync Link for copy/pasting
      const token = encodeSyncToken(stored);
      if (token) {
        setSyncUrl(`${origin}/?sync=${token}`);
      }
    } catch (err: any) {
      console.error('Failed to generate pairing data:', err);

      // Fallback: Try generating QR from sync token if server request failed
      try {
        const token = encodeSyncToken(stored);
        if (token) {
          const directLink = `${origin}/?sync=${token}`;
          setSyncUrl(directLink);
          const fallbackSvg = await QRCode.toString(directLink, {
            type: 'svg',
            margin: 1,
            width: 220,
            color: { dark: '#000000', light: '#ffffff' },
          });
          setQrSvg(fallbackSvg);
        }
      } catch (qrErr) {
        console.error('Fallback QR code error:', qrErr);
      }
    } finally {
      setPairLoading(false);
    }
  }, []);

  // Countdown timer for 6-digit PIN
  useEffect(() => {
    if (!pairExpiresIn || pairExpiresIn <= 0) return;
    const timer = setInterval(() => {
      setPairExpiresIn((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [pairExpiresIn]);

  // Load status on open
  const loadStatus = useCallback(async () => {
    try {
      const status = await api.getAuthStatus();
      setAuthStatus(status);
    } catch {
      // offline
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadStatus();
      setHeadersError(null);
      setOauthError(null);
      setPinError(null);
      setMagicLinkError(null);
      setSuccessMessage(null);
      const stored = getStoredAuth();
      if (stored?.authenticated) {
        generatePairingData();
      }
    } else {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      setOauthPolling(false);
    }
  }, [isOpen, loadStatus, generatePairingData]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !headersLoading && !oauthPolling && !pinLoading) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, headersLoading, oauthPolling, pinLoading, onClose]);

  // Handle claiming 6-digit PIN
  const handleClaimPinWithCode = async (codeToClaim: string) => {
    const cleaned = codeToClaim.replace(/\D/g, '').trim();
    if (cleaned.length !== 6) {
      setPinError('Please enter a 6-digit pairing code.');
      return;
    }

    setPinLoading(true);
    setPinError(null);
    setSuccessMessage(null);

    try {
      const res = await api.claimPairCode(cleaned);
      if (res.authenticated) {
        setSuccessMessage('Successfully connected and signed in to YouTube Music!');
        setPinInput('');
        await loadStatus();
        onAuthChange?.();
      } else {
        setPinError('Failed to verify pairing code.');
      }
    } catch (err: any) {
      setPinError(err.message || 'Invalid or expired PIN code. Please generate a new code on your PC.');
    } finally {
      setPinLoading(false);
    }
  };

  // Handle importing magic sync link
  const handleImportMagicLink = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!magicLinkInput.trim()) return;

    setMagicLinkLoading(true);
    setMagicLinkError(null);
    setSuccessMessage(null);

    try {
      let raw = magicLinkInput.trim();
      if (raw.includes('?sync=')) {
        raw = raw.split('?sync=')[1].split('&')[0];
      } else if (raw.includes('?pair=')) {
        raw = raw.split('?pair=')[1].split('&')[0];
      } else if (raw.includes('?token=')) {
        raw = raw.split('?token=')[1].split('&')[0];
      }

      const payload = decodeSyncToken(raw);
      if (!payload) {
        throw new Error('Could not parse Magic Link. Please ensure the full link was copied.');
      }

      setStoredAuth({
        ...payload,
        authenticated: true,
        savedAt: Date.now(),
      });

      const res = await api.restoreAuth(payload);
      if (res.authenticated) {
        setSuccessMessage('Successfully imported session from Magic Link!');
        setMagicLinkInput('');
        setShowMagicInput(false);
        await loadStatus();
        onAuthChange?.();
      } else {
        setMagicLinkError('Could not restore session from Magic Link.');
      }
    } catch (err: any) {
      setMagicLinkError(err.message || 'Failed to import Magic Link.');
    } finally {
      setMagicLinkLoading(false);
    }
  };

  // Handle Headers Login
  const handleHeadersLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!headersInput.trim()) {
      setHeadersError('Please paste your browser request headers or cookie.');
      return;
    }

    setHeadersLoading(true);
    setHeadersError(null);
    setSuccessMessage(null);

    try {
      const res = await api.loginWithHeaders(headersInput.trim());
      if (res.authenticated) {
        setSuccessMessage('Successfully signed in to YouTube Music!');
        setHeadersInput('');
        await loadStatus();
        generatePairingData();
        onAuthChange?.();
      } else {
        setHeadersError('Authentication failed. Please verify that the pasted headers are valid.');
      }
    } catch (err: any) {
      setHeadersError(err.message || 'Failed to authenticate with headers.');
    } finally {
      setHeadersLoading(false);
    }
  };

  // Handle Start OAuth
  const handleStartOAuth = async () => {
    setOauthLoading(true);
    setOauthError(null);
    setSuccessMessage(null);

    try {
      const data = await api.startOAuth();
      setOauthData(data);
      startPolling(data.device_code, data.interval || 5);
    } catch (err: any) {
      setOauthError(err.message || 'Failed to start Google OAuth.');
    } finally {
      setOauthLoading(false);
    }
  };

  // Poll OAuth Status
  const startPolling = (deviceCode: string, intervalSeconds: number) => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    setOauthPolling(true);

    const interval = Math.max(intervalSeconds, 5) * 1000;
    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await api.pollOAuth(deviceCode);
        if (res.status === 'success') {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setOauthPolling(false);
          setOauthData(null);
          setSuccessMessage('Successfully authenticated with Google account!');
          await loadStatus();
          generatePairingData();
          onAuthChange?.();
        } else if (res.status === 'error') {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setOauthPolling(false);
          setOauthError(res.error || 'Google authorization failed or was denied.');
        }
      } catch (err: any) {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        setOauthPolling(false);
        setOauthError(err.message || 'Error checking OAuth status.');
      }
    }, interval);
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await api.logout();
      setSuccessMessage('Signed out of YouTube Music.');
      setQrSvg('');
      setPairCode('');
      setSyncUrl('');
      await loadStatus();
      onAuthChange?.();
    } catch (err: any) {
      setHeadersError(err.message || 'Failed to sign out.');
    }
  };

  const copySyncLink = () => {
    if (!syncUrl) return;
    navigator.clipboard.writeText(syncUrl);
    setSyncLinkCopied(true);
    setTimeout(() => setSyncLinkCopied(false), 2500);
  };

  const copyPairCode = () => {
    if (!pairCode) return;
    navigator.clipboard.writeText(pairCode);
    setPairCodeCopied(true);
    setTimeout(() => setPairCodeCopied(false), 2500);
  };

  const copyOAuthCode = () => {
    if (oauthData?.user_code) {
      navigator.clipboard.writeText(oauthData.user_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setHeadersInput(text);
      }
    } catch {
      // Permission denied
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Surface */}
      <div className="relative w-full max-w-2xl sm:max-w-3xl rounded-m3-xl bg-m3-surface-container-low dark:bg-[#121622] border border-white/10 shadow-2xl overflow-hidden z-10 flex flex-col my-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-m3-outline-variant/20 flex items-center justify-between bg-gradient-to-r from-red-500/10 via-transparent to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-600/20 text-red-500 flex items-center justify-center border border-red-500/30 shadow-inner flex-shrink-0">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-m3-on-surface tracking-tight flex items-center gap-2">
                YouTube Music Sign In
                {authStatus.authenticated && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <Check className="w-3 h-3 stroke-[3]" /> Connected
                  </span>
                )}
              </h2>
              <p className="text-xs text-m3-on-surface-variant mt-0.5">
                Sync your Liked Songs, private playlists, and personal library
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Success Banner */}
          {successMessage && (
            <div className="p-3.5 rounded-m3-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span className="font-medium">{successMessage}</span>
            </div>
          )}

          {/* Active Authentication View */}
          {authStatus.authenticated ? (
            <div className="space-y-5">
              {/* Connected Banner */}
              <div className="p-4 sm:p-5 rounded-m3-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-300">
                      Account Authenticated
                    </h3>
                    <p className="text-xs text-emerald-400/80">
                      Method:{' '}
                      <span className="font-mono font-medium">
                        {authStatus.authType === 'google_oauth'
                          ? 'Google OAuth'
                          : 'Session Headers'}
                      </span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-m3-full bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 text-xs font-semibold transition-colors flex-shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>

              {/* Seamless Mobile Pairing Section */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-m3-surface-container/70 to-m3-surface-container-high/40 border border-m3-outline-variant/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-m3-primary" />
                    <div>
                      <h3 className="text-sm font-bold text-m3-on-surface">
                        Connect Your Phone or Mobile Device
                      </h3>
                      <p className="text-xs text-m3-on-surface-variant">
                        Instant pairing without typing passwords or cookies on mobile
                      </p>
                    </div>
                  </div>
                  <span className="self-start sm:self-auto text-[11px] font-semibold text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    Ready to Connect
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch pt-1">
                  {/* Option 1: QR Code */}
                  <div className="flex flex-col items-center justify-between p-4 rounded-xl bg-m3-surface-container-low border border-m3-outline-variant/20 text-center space-y-3">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-m3-on-surface flex items-center justify-center gap-1.5">
                        <QrCode className="w-4 h-4 text-m3-primary" /> Option 1: Scan with Camera
                      </span>
                      <p className="text-[11px] text-m3-on-surface-variant leading-relaxed">
                        Point your phone camera at this QR code to sign in in 1 second.
                      </p>
                    </div>

                    <div className="p-2.5 bg-white rounded-2xl shadow-md border border-neutral-200">
                      {qrSvg ? (
                        <div
                          className="w-44 h-44 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                          dangerouslySetInnerHTML={{ __html: qrSvg }}
                        />
                      ) : (
                        <div className="w-44 h-44 flex items-center justify-center text-neutral-400 text-xs">
                          <RefreshCw className="w-6 h-6 animate-spin text-neutral-500" />
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={copySyncLink}
                      className="w-full py-2 px-3 rounded-full bg-m3-surface-container hover:bg-m3-surface-container-high border border-m3-outline-variant/30 text-xs font-semibold text-m3-on-surface transition-colors flex items-center justify-center gap-2"
                    >
                      {syncLinkCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Magic Link Copied!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Copy Magic Sync Link</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Option 2: 6-Digit PIN */}
                  <div className="flex flex-col justify-between p-4 rounded-xl bg-m3-surface-container-low border border-m3-outline-variant/20 space-y-4">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-m3-on-surface flex items-center gap-1.5">
                        <KeyRound className="w-4 h-4 text-m3-primary" /> Option 2: 6-Digit PIN
                      </span>
                      <p className="text-[11px] text-m3-on-surface-variant leading-relaxed">
                        Open Sonora on your phone, tap Sign In, and enter this code:
                      </p>
                    </div>

                    <div className="py-5 px-3 bg-m3-surface-container rounded-xl border border-m3-outline-variant/30 text-center space-y-2">
                      <div className="flex items-center justify-center">
                        {pairCode ? (
                          <span className="text-3xl sm:text-4xl font-mono font-black tracking-[0.25em] text-m3-primary select-all">
                            {pairCode.slice(0, 3)} {pairCode.slice(3, 6)}
                          </span>
                        ) : (
                          <RefreshCw className="w-6 h-6 animate-spin text-m3-primary mx-auto" />
                        )}
                      </div>

                      {pairExpiresIn > 0 && (
                        <p className="text-[11px] text-m3-on-surface-variant">
                          Code expires in{' '}
                          <span className="font-mono font-bold text-m3-on-surface">
                            {Math.floor(pairExpiresIn / 60)}:
                            {(pairExpiresIn % 60).toString().padStart(2, '0')}
                          </span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={copyPairCode}
                        disabled={!pairCode}
                        className="flex-1 py-2 px-3 rounded-full bg-m3-surface-container hover:bg-m3-surface-container-high border border-m3-outline-variant/30 text-xs font-semibold text-m3-on-surface transition-colors flex items-center justify-center gap-1.5"
                      >
                        {pairCodeCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{pairCodeCopied ? 'Code Copied' : 'Copy PIN'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={generatePairingData}
                        disabled={pairLoading}
                        title="Generate new PIN"
                        className="p-2 rounded-full bg-m3-surface-container hover:bg-m3-surface-container-high border border-m3-outline-variant/30 text-m3-on-surface-variant hover:text-m3-on-surface transition-colors"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${pairLoading ? 'animate-spin' : ''}`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Tab Selector */}
              <div className="flex items-center gap-1 sm:gap-2 p-1 rounded-m3-lg bg-m3-surface-container border border-m3-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setActiveTab('pair')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-m3-md text-xs font-bold transition-all ${
                    activeTab === 'pair'
                      ? 'bg-m3-primary text-m3-on-primary shadow-sm'
                      : 'text-m3-on-surface-variant hover:text-m3-on-surface'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Connect from PC</span>
                  {isMobile && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-normal">
                      Mobile
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('oauth')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-m3-md text-xs font-bold transition-all ${
                    activeTab === 'oauth'
                      ? 'bg-m3-primary text-m3-on-primary shadow-sm'
                      : 'text-m3-on-surface-variant hover:text-m3-on-surface'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Google OAuth</span>
                </button>
              </div>

              {/* ──────────────── TAB 1: Mobile Pair / Connect from PC ──────────────── */}
              {activeTab === 'pair' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-m3-surface-container/60 border border-m3-outline-variant/20 space-y-1">
                    <h3 className="text-sm font-bold text-m3-on-surface flex items-center gap-2">
                      <Laptop className="w-4 h-4 text-m3-primary" />
                      Sign in using your Computer
                    </h3>
                    <p className="text-xs text-m3-on-surface-variant leading-relaxed">
                      No complex dev tools or cURL commands on mobile! Open Sonora on your laptop or PC, sign in with your YouTube account, then enter the 6-digit code or scan the QR code.
                    </p>
                  </div>

                  {pinError && (
                    <div className="p-3.5 rounded-m3-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                      <span>{pinError}</span>
                    </div>
                  )}

                  {/* 6-Digit PIN Entry */}
                  <div className="p-5 rounded-2xl bg-m3-surface-container-low border border-m3-outline-variant/30 text-center space-y-4">
                    <label className="text-xs font-bold text-m3-on-surface block">
                      Enter 6-Digit PIN shown on your PC screen:
                    </label>

                    <div className="relative inline-block max-w-xs mx-auto">
                      <div className="flex justify-center gap-2">
                        {[0, 1, 2, 3, 4, 5].map((idx) => {
                          const char = pinInput[idx] || '';
                          const isFocused = pinInput.length === idx;
                          return (
                            <div
                              key={idx}
                              className={`w-10 h-13 sm:w-12 sm:h-16 rounded-xl flex items-center justify-center text-xl sm:text-2xl font-mono font-black transition-all ${
                                char
                                  ? 'bg-m3-primary/15 border-2 border-m3-primary text-m3-primary'
                                  : isFocused
                                  ? 'bg-m3-surface-container-high border-2 border-m3-primary/60 text-m3-on-surface animate-pulse'
                                  : 'bg-m3-surface-container border border-m3-outline-variant/30 text-m3-on-surface-variant/40'
                              }`}
                            >
                              {char || '•'}
                            </div>
                          );
                        })}
                      </div>

                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        value={pinInput}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setPinInput(val);
                          setPinError(null);
                          if (val.length === 6) {
                            handleClaimPinWithCode(val);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        aria-label="6-digit pairing code"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleClaimPinWithCode(pinInput)}
                      disabled={pinLoading || pinInput.length !== 6}
                      className="w-full py-3 px-4 rounded-full bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary font-bold text-xs sm:text-sm transition-all shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {pinLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Connecting to PC...</span>
                        </>
                      ) : (
                        <>
                          <Smartphone className="w-4 h-4" />
                          <span>Connect & Sign In</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* QR Instructions */}
                  <div className="p-4 rounded-xl bg-m3-surface-container-low border border-m3-outline-variant/20 space-y-2">
                    <span className="text-xs font-bold text-m3-on-surface flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-m3-primary" /> Or Scan QR Code with Phone Camera
                    </span>
                    <ol className="text-xs text-m3-on-surface-variant space-y-1 list-decimal list-inside leading-relaxed">
                      <li>Open <strong className="text-m3-on-surface">sonora-web-music.vercel.app</strong> on your computer.</li>
                      <li>Sign in, then click "Connected" or open YouTube Sign In.</li>
                      <li>Scan the QR code displayed on PC with your camera to sign in immediately.</li>
                    </ol>
                  </div>

                  {/* Magic Link Collapsible */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowMagicInput(!showMagicInput)}
                      className="text-xs font-semibold text-m3-primary flex items-center gap-1 hover:underline"
                    >
                      <Link className="w-3.5 h-3.5" />
                      {showMagicInput
                        ? 'Hide Magic Link option'
                        : 'Have a Magic Sync Link from Telegram or WhatsApp?'}
                    </button>

                    {showMagicInput && (
                      <form
                        onSubmit={handleImportMagicLink}
                        className="mt-3 space-y-2 p-3 rounded-xl bg-m3-surface-container border border-m3-outline-variant/20"
                      >
                        <label className="text-[11px] font-semibold text-m3-on-surface">
                          Paste Magic Link or Token
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={magicLinkInput}
                            onChange={(e) => setMagicLinkInput(e.target.value)}
                            placeholder="https://sonora-web-music.vercel.app/?sync=..."
                            className="flex-1 px-3 py-2 rounded-lg bg-m3-surface-container-high border border-m3-outline-variant/30 text-xs font-mono text-m3-on-surface focus:outline-none focus:border-m3-primary"
                          />
                          <button
                            type="submit"
                            disabled={magicLinkLoading || !magicLinkInput.trim()}
                            className="px-4 py-2 rounded-lg bg-m3-primary text-m3-on-primary text-xs font-bold disabled:opacity-50"
                          >
                            {magicLinkLoading ? 'Importing...' : 'Import'}
                          </button>
                        </div>
                        {magicLinkError && (
                          <p className="text-[11px] text-red-400">{magicLinkError}</p>
                        )}
                      </form>
                    )}
                  </div>
                </div>
              )}

              {/* ──────────────── TAB 2: Headers / Cookies ──────────────── */}
              {activeTab === 'headers' && (
                <div className="space-y-4">
                  {/* Collapsible How-To Guide */}
                  <div className="rounded-m3-lg bg-m3-surface-container/40 border border-m3-outline-variant/20 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowGuide(!showGuide)}
                      className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-m3-on-surface hover:bg-m3-surface-container transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-m3-primary" />
                        <span>How to get request headers from YouTube Music</span>
                      </span>
                      {showGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {showGuide && (
                      <div className="px-4 pb-4 pt-1 text-xs text-m3-on-surface-variant space-y-2 border-t border-m3-outline-variant/15 leading-relaxed">
                        <p>1. Open <a href="https://music.youtube.com" target="_blank" rel="noreferrer" className="text-m3-primary underline font-medium inline-flex items-center gap-1">music.youtube.com <ExternalLink className="w-3 h-3" /></a> and sign in.</p>
                        <p>2. Open Developer Tools (<kbd className="px-1.5 py-0.5 rounded bg-m3-surface-container-high border border-m3-outline-variant/30 text-[10px] font-mono">F12</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-m3-surface-container-high border border-m3-outline-variant/30 text-[10px] font-mono">Ctrl+Shift+I</kbd>), and select the <strong>Network</strong> tab.</p>
                        <p>3. Refresh the page or click any song, filter, or page (e.g. <code>browse</code> or <code>player</code>).</p>
                        <p>4. Click the request, look for <strong>Request Headers</strong> in the Headers section, right-click and select <strong>Copy Request Headers</strong> (or copy the <code>Cookie: ...</code> value or select <strong>Copy as cURL</strong>).</p>
                        <p>5. Paste it in the field below and click <strong>Connect YouTube Account</strong>.</p>
                      </div>
                    )}
                  </div>

                  {headersError && (
                    <div className="p-3.5 rounded-m3-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                      <span>{headersError}</span>
                    </div>
                  )}

                  <form onSubmit={handleHeadersLogin} className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-m3-on-surface">
                          Paste Request Headers or Cookie
                        </label>
                        <button
                          type="button"
                          onClick={handlePasteClipboard}
                          className="text-[11px] font-medium text-m3-primary hover:underline flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" /> Paste from Clipboard
                        </button>
                      </div>

                      <textarea
                        rows={6}
                        value={headersInput}
                        onChange={(e) => setHeadersInput(e.target.value)}
                        placeholder="accept: */*&#10;authorization: SAPISIDHASH ...&#10;cookie: SID=...; SAPISID=...&#10;user-agent: Mozilla/5.0 ...&#10;x-goog-authuser: 0"
                        className="w-full px-3.5 py-2.5 rounded-m3-lg bg-m3-surface-container-high border border-m3-outline-variant/30 text-xs font-mono text-m3-on-surface placeholder:text-m3-on-surface-variant/40 focus:outline-none focus:border-m3-primary focus:ring-1 focus:ring-m3-primary resize-y"
                      />
                      <p className="text-[11px] text-m3-on-surface-variant/70">
                        Accepts raw request headers, cURL command, or <code>cookie: ...</code> line. Stored securely on your device.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={headersLoading || !headersInput.trim()}
                      className="w-full py-2.5 px-4 rounded-m3-full bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {headersLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Verifying Headers...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Connect YouTube Account</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* ──────────────── TAB 3: Google OAuth Device Code ──────────────── */}
              {activeTab === 'oauth' && (
                <div className="space-y-4">
                  {oauthError && (
                    <div className="p-3.5 rounded-m3-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                      <span>{oauthError}</span>
                    </div>
                  )}

                  {!oauthData ? (
                    <div className="space-y-4">
                      {!authStatus.canGoogleSignIn && (
                        <div className="p-3.5 rounded-m3-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs leading-relaxed">
                          YouTube Google sign-in needs server credentials. Set <code>SONORA_GOOGLE_CLIENT_ID</code> and <code>SONORA_GOOGLE_CLIENT_SECRET</code> in the backend environment, then restart it. For local development, use the project-root <code>.env</code>; for Vercel, add them as server environment variables. Do not use <code>VITE_</code> names.
                        </div>
                      )}
                      <div className="p-4 rounded-m3-lg bg-m3-surface-container/40 border border-m3-outline-variant/20 text-xs text-m3-on-surface-variant space-y-2 leading-relaxed">
                        <p className="font-semibold text-m3-on-surface flex items-center gap-1.5">
                          <KeyRound className="w-4 h-4 text-m3-primary" /> Google Device Authorization
                        </p>
                        <p>
                          Sign in to YouTube Music on your TV or browser by entering a short authorization code at <strong>google.com/device</strong>.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleStartOAuth}
                        disabled={oauthLoading || !authStatus.canGoogleSignIn}
                        className="w-full py-2.5 px-4 rounded-m3-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {oauthLoading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Requesting Device Code...</span>
                          </>
                        ) : (
                          <>
                            <KeyRound className="w-4 h-4" />
                            <span>Generate Device Sign-In Code</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    /* Active Device Code Waiting UI */
                    <div className="p-6 rounded-m3-lg bg-m3-surface-container/60 border border-m3-outline-variant/30 text-center space-y-5">
                      <div className="space-y-1">
                        <span className="text-xs text-m3-on-surface-variant uppercase tracking-wider font-semibold">
                          Your Device Code
                        </span>
                        <div className="flex items-center justify-center gap-3">
                          <span className="text-3xl sm:text-4xl font-mono font-extrabold tracking-widest text-m3-primary bg-m3-surface-container px-6 py-2.5 rounded-m3-lg border border-m3-primary/30 shadow-inner select-all">
                            {oauthData.user_code}
                          </span>
                          <button
                            type="button"
                            onClick={copyOAuthCode}
                            title="Copy code"
                            className="p-3 rounded-m3-lg bg-m3-surface-container hover:bg-m3-surface-container-high border border-m3-outline-variant/30 text-m3-on-surface transition-colors"
                          >
                            {copiedCode ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="text-xs text-m3-on-surface-variant max-w-sm mx-auto">
                          Click below to open Google Device Login, log in with your YouTube account, and enter the code.
                        </p>

                        <a
                          href={oauthData.verification_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-m3-full bg-m3-primary text-m3-on-primary text-xs font-bold hover:bg-m3-primary/90 shadow-md transition-all"
                        >
                          <span>Open {oauthData.verification_url}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      <div className="flex items-center justify-center gap-2 text-xs text-m3-primary font-medium pt-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Waiting for authorization in browser...</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 bg-m3-surface-container-high/40 border-t border-m3-outline-variant/20 flex items-center justify-between text-xs text-m3-on-surface-variant">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Encrypted local credential store</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-m3-full hover:bg-m3-surface-container text-m3-on-surface font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};