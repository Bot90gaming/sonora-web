import React, { useState, useEffect } from 'react';
import { ListMusic, RefreshCw, Play, Sparkles } from 'lucide-react';
import { Playlist, AuthStatus } from '../types';
import { api } from '../services/api';

interface PlaylistsViewProps {
  onSelectPlaylist?: (playlist: Playlist) => void;
  onOpenAuth?: () => void;
  authStatus?: AuthStatus;
}

export const PlaylistsView: React.FC<PlaylistsViewProps> = ({
  onSelectPlaylist,
  onOpenAuth,
  authStatus,
}) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const loadPlaylists = async () => {
    setLoading(true);
    setSyncFeedback(null);
    try {
      const items = await api.getLibraryPlaylists();
      setPlaylists(items);
      if (items.length > 0) {
        setSyncFeedback(`Loaded ${items.length} playlists from YouTube Music`);
        setTimeout(() => setSyncFeedback(null), 3500);
      }
    } catch {
      setPlaylists([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authStatus?.authenticated) {
      loadPlaylists();
    } else {
      setPlaylists([]);
    }
  }, [authStatus?.authenticated]);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-m3-outline-variant/20 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <ListMusic className="w-6 h-6 text-m3-primary" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-m3-on-surface tracking-tight">
              Playlists & Mixes
            </h1>
            {playlists.length > 0 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-m3-primary/15 text-m3-primary font-mono font-bold">
                {playlists.length}
              </span>
            )}
          </div>
          <p className="text-xs text-m3-on-surface-variant mt-1">
            Your synced YouTube Music playlists, custom mixes, and saved collections
          </p>
        </div>

        {/* Sync or Sign In Actions */}
        {authStatus?.authenticated ? (
          <button
            onClick={loadPlaylists}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-m3-full bg-m3-primary/15 hover:bg-m3-primary/25 text-m3-primary border border-m3-primary/30 text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Playlists</span>
          </button>
        ) : (
          onOpenAuth && (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-4 py-2 rounded-m3-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white text-xs font-bold shadow-md transition-all active:scale-95 group"
            >
              <svg className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              <span>Sign in with YouTube</span>
            </button>
          )
        )}
      </div>

      {/* Sync Toast Feedback */}
      {syncFeedback && (
        <div className="p-3 rounded-m3-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <Sparkles className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* Content Area */}
      {!authStatus?.authenticated ? (
        <div className="p-16 text-center rounded-m3-xl bg-m3-surface-container/30 border border-m3-outline-variant/20 flex flex-col items-center justify-center gap-4 text-m3-on-surface-variant">
          <div className="w-16 h-16 rounded-full bg-m3-primary/10 flex items-center justify-center text-m3-primary">
            <ListMusic className="w-8 h-8 opacity-60" />
          </div>
          <div>
            <p className="text-base font-bold text-m3-on-surface">Connect YouTube to View Playlists</p>
            <p className="text-xs opacity-70 max-w-sm mt-1">
              Sign in with your YouTube account to automatically synchronize your private playlists, mixes, and liked albums.
            </p>
          </div>
          {onOpenAuth && (
            <button
              onClick={onOpenAuth}
              className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-m3-full bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <span>Connect YouTube Account</span>
            </button>
          )}
        </div>
      ) : loading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3 text-m3-on-surface-variant">
          <RefreshCw className="w-8 h-8 animate-spin text-m3-primary" />
          <p className="text-xs font-semibold">Loading playlists from YouTube Music...</p>
        </div>
      ) : playlists.length === 0 ? (
        <div className="p-16 text-center rounded-m3-xl bg-m3-surface-container/30 border border-m3-outline-variant/20 flex flex-col items-center justify-center gap-3 text-m3-on-surface-variant">
          <ListMusic className="w-12 h-12 opacity-30 text-m3-primary" />
          <p className="text-base font-bold text-m3-on-surface">No playlists found in your YouTube library</p>
          <p className="text-xs opacity-70 max-w-sm">
            Create playlists in YouTube Music or discover featured mixes on the Home page.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              onClick={() => onSelectPlaylist?.(playlist)}
              className="group p-4 rounded-m3-lg bg-m3-surface-container/60 hover:bg-m3-surface-container border border-m3-outline-variant/20 hover:border-m3-primary/30 transition-all cursor-pointer flex flex-col space-y-3"
            >
              <div className="relative aspect-square w-full rounded-m3-md overflow-hidden bg-m3-surface-container-high shadow-md">
                {playlist.thumbnail ? (
                  <img
                    src={playlist.thumbnail}
                    alt={playlist.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-m3-surface-container-highest text-m3-on-surface-variant/40">
                    <ListMusic className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <div className="w-12 h-12 rounded-full bg-m3-primary text-m3-on-primary flex items-center justify-center shadow-lg transform group-hover:scale-105 active:scale-95 transition-transform">
                    <Play className="w-6 h-6 fill-current ml-0.5" />
                  </div>
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-m3-on-surface truncate group-hover:text-m3-primary transition-colors">
                  {playlist.title}
                </p>
                <p className="text-xs text-m3-on-surface-variant line-clamp-2 mt-0.5">
                  {playlist.description || playlist.author || 'YouTube Playlist'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
