import React, { useState, useEffect, useRef } from 'react';
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
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { api } from '../services/api';
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
  const [activeTab, setActiveTab] = useState<'headers' | 'oauth'>('headers');
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    authenticated: false,
    authType: 'none',
    canGoogleSignIn: false,
  });

  // Headers Tab state
  const [headersInput, setHeadersInput] = useState('');
  const [headersLoading, setHeadersLoading] = useState(false);
  const [headersError, setHeadersError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  // OAuth Tab state
  const [customClientId, setCustomClientId] = useState('');
  const [customClientSecret, setCustomClientSecret] = useState('');
  const [showCustomCreds, setShowCustomCreds] = useState(false);
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

  // Fetch status on open
  useEffect(() => {
    if (isOpen) {
      loadStatus();
      setHeadersError(null);
      setOauthError(null);
      setSuccessMessage(null);
    } else {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      setOauthPolling(false);
    }
  }, [isOpen]);

  const loadStatus = async () => {
    try {
      const status = await api.getAuthStatus();
      setAuthStatus(status);
    } catch {
      // offline
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !headersLoading && !oauthPolling) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, headersLoading, oauthPolling, onClose]);

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
      const data = await api.startOAuth(
        customClientId.trim() || undefined,
        customClientSecret.trim() || undefined
      );
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
      await loadStatus();
      onAuthChange?.();
    } catch (err: any) {
      setHeadersError(err.message || 'Failed to sign out.');
    }
  };

  const copyCodeToClipboard = () => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Surface */}
      <div className="relative w-full max-w-2xl rounded-m3-xl bg-m3-surface-container-low dark:bg-[#121622] border border-white/10 shadow-2xl overflow-hidden z-10 flex flex-col my-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-m3-outline-variant/20 flex items-center justify-between bg-gradient-to-r from-red-500/10 via-transparent to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-600/20 text-red-500 flex items-center justify-center border border-red-500/30 shadow-inner">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-m3-on-surface tracking-tight flex items-center gap-2">
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
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Success Banner */}
          {successMessage && (
            <div className="p-3.5 rounded-m3-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span className="font-medium">{successMessage}</span>
            </div>
          )}

          {/* Active Authentication Status Card */}
          {authStatus.authenticated ? (
            <div className="p-5 rounded-m3-lg bg-emerald-500/10 border border-emerald-500/25 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-300">
                      Account Authenticated
                    </h3>
                    <p className="text-xs text-emerald-400/80">
                      Method:{' '}
                      <span className="font-mono font-medium">
                        {authStatus.authType === 'google_oauth' ? 'Google OAuth' : 'Browser Session Headers'}
                      </span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-m3-full bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 text-xs font-semibold transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>

              <div className="pt-2 border-t border-emerald-500/20 text-xs text-emerald-300/80 leading-relaxed">
                Your YouTube Music account is active. Sonora can now query your Liked Songs, personal playlists, and library albums in high quality.
              </div>
            </div>
          ) : (
            <>
              {/* Tab Selector */}
              <div className="flex items-center gap-2 p-1 rounded-m3-lg bg-m3-surface-container border border-m3-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setActiveTab('headers')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-m3-md text-xs font-bold transition-all ${
                    activeTab === 'headers'
                      ? 'bg-m3-primary text-m3-on-primary shadow-sm'
                      : 'text-m3-on-surface-variant hover:text-m3-on-surface'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Browser Headers (Instant)</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 uppercase">
                    Recommended
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('oauth')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-m3-md text-xs font-bold transition-all ${
                    activeTab === 'oauth'
                      ? 'bg-m3-primary text-m3-on-primary shadow-sm'
                      : 'text-m3-on-surface-variant hover:text-m3-on-surface'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Google Device Code (OAuth)</span>
                </button>
              </div>

              {/* ──────────────── TAB 1: Headers / Cookies ──────────────── */}
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
                        Accepts raw request headers, cURL command, or <code>cookie: ...</code> line. Stored securely on your local machine.
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

              {/* ──────────────── TAB 2: Google OAuth Device Code ──────────────── */}
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
                      <div className="p-4 rounded-m3-lg bg-m3-surface-container/40 border border-m3-outline-variant/20 text-xs text-m3-on-surface-variant space-y-2 leading-relaxed">
                        <p className="font-semibold text-m3-on-surface flex items-center gap-1.5">
                          <KeyRound className="w-4 h-4 text-m3-primary" /> Google Device Authorization
                        </p>
                        <p>
                          Sign in to YouTube Music on your TV or browser by entering a short authorization code at <strong>google.com/device</strong>.
                        </p>
                      </div>

                      {/* Custom Credentials Toggle */}
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => setShowCustomCreds(!showCustomCreds)}
                          className="text-xs text-m3-primary font-semibold flex items-center gap-1 hover:underline"
                        >
                          {showCustomCreds ? 'Hide custom Google Cloud credentials' : 'Configure custom Google Cloud credentials (optional)'}
                        </button>

                        {showCustomCreds && (
                          <div className="mt-3 p-4 rounded-m3-lg bg-m3-surface-container-high/40 border border-m3-outline-variant/20 space-y-3">
                            <div>
                              <label className="text-[11px] font-semibold text-m3-on-surface">Client ID</label>
                              <input
                                type="text"
                                value={customClientId}
                                onChange={(e) => setCustomClientId(e.target.value)}
                                placeholder="xxxxxx.apps.googleusercontent.com"
                                className="w-full mt-1 px-3 py-2 rounded-m3-md bg-m3-surface-container border border-m3-outline-variant/30 text-xs text-m3-on-surface focus:outline-none focus:border-m3-primary"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-semibold text-m3-on-surface">Client Secret</label>
                              <input
                                type="password"
                                value={customClientSecret}
                                onChange={(e) => setCustomClientSecret(e.target.value)}
                                placeholder="GOCSPX-..."
                                className="w-full mt-1 px-3 py-2 rounded-m3-md bg-m3-surface-container border border-m3-outline-variant/30 text-xs text-m3-on-surface focus:outline-none focus:border-m3-primary"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handleStartOAuth}
                        disabled={oauthLoading}
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
                            onClick={copyCodeToClipboard}
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
        <div className="px-6 py-4 bg-m3-surface-container-high/40 border-t border-m3-outline-variant/20 flex items-center justify-between text-xs text-m3-on-surface-variant">
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
