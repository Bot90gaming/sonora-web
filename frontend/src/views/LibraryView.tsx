import React, { useState, useEffect } from 'react';
import {
  Heart,
  Play,
  Download,
  Disc,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { Track, Album, Playlist, AuthStatus } from '../types';
import { api, handleImageError } from '../services/api';

interface LibraryViewProps {
  onOpenDownload: (track: Track) => void;
  onSelectAlbum?: (album: Album) => void;
  onSelectPlaylist?: (playlist: Playlist) => void;
  onOpenAuth?: () => void;
  authStatus?: AuthStatus;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  onOpenDownload,
  onSelectAlbum,
  onSelectPlaylist: _onSelectPlaylist,
  onOpenAuth,
  authStatus,
}) => {
  const { likedTracks, playTrack, currentTrack, toggleLike, addToQueue, syncLikedTracks } = usePlayer();
  const [activeTab, setActiveTab] = useState<'liked' | 'albums'>('liked');

  // Sync / Fetch states
  const [isSyncingLikes, setIsSyncingLikes] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const [libraryAlbums, setLibraryAlbums] = useState<Album[]>([]);
  const [loadingAlbums, setLoadingAlbums] = useState(false);

  // Fetch albums when tab changes or auth status updates
  useEffect(() => {
    if (authStatus?.authenticated) {
      if (activeTab === 'albums') {
        loadUserAlbums();
      }
    }
  }, [activeTab, authStatus?.authenticated]);

  const loadUserAlbums = async () => {
    setLoadingAlbums(true);
    try {
      const items = await api.getLibraryAlbums();
      setLibraryAlbums(items);
    } catch {
      setLibraryAlbums([]);
    } finally {
      setLoadingAlbums(false);
    }
  };

  const handleSyncLikedSongs = async () => {
    setIsSyncingLikes(true);
    setSyncFeedback(null);
    try {
      const tracks = await api.getLibraryLikedSongs(100);
      if (tracks.length > 0) {
        syncLikedTracks(tracks);
        setSyncFeedback(`Synced ${tracks.length} tracks from YouTube Music!`);
      } else {
        setSyncFeedback('No liked tracks found on your YouTube Music account.');
      }
    } catch (err: any) {
      setSyncFeedback(err.message || 'Failed to sync liked songs.');
    } finally {
      setIsSyncingLikes(false);
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  const handlePlayLikedAll = () => {
    if (likedTracks.length > 0) {
      playTrack(likedTracks[0], likedTracks);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto pb-16">
      {/* ──────────────── Header & Sub-Tabs ──────────────── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-m3-on-surface tracking-tight">
              Your Library
            </h1>
            <p className="text-xs text-m3-on-surface-variant mt-1">
              Personal music collection, liked songs, and synced YouTube library
            </p>
          </div>

          {/* YouTube Sync / Connection Status Badge */}
          {authStatus?.authenticated ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSyncLikedSongs}
                disabled={isSyncingLikes}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-m3-full bg-m3-primary/15 hover:bg-m3-primary/25 text-m3-primary border border-m3-primary/30 text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingLikes ? 'animate-spin' : ''}`} />
                <span>Sync YouTube Likes</span>
              </button>
            </div>
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

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-m3-outline-variant/20 pb-3">
          <button
            onClick={() => setActiveTab('liked')}
            className={`flex items-center gap-2 px-4 py-2 rounded-m3-full text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'liked'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container'
            }`}
          >
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>Liked Songs ({likedTracks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('albums')}
            className={`flex items-center gap-2 px-4 py-2 rounded-m3-full text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'albums'
                ? 'bg-m3-primary/20 text-m3-primary border border-m3-primary/30'
                : 'text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container'
            }`}
          >
            <Disc className="w-3.5 h-3.5" />
            <span>Albums {authStatus?.authenticated && libraryAlbums.length > 0 ? `(${libraryAlbums.length})` : ''}</span>
          </button>
        </div>
      </div>

      {/* ──────────────── TAB 1: Liked Songs ──────────────── */}
      {activeTab === 'liked' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-m3-on-surface-variant">
              All songs you marked with a heart across Sonora
            </p>
            {likedTracks.length > 0 && (
              <button
                onClick={handlePlayLikedAll}
                className="flex items-center gap-2 px-4 py-1.5 rounded-m3-full bg-m3-primary text-m3-on-primary text-xs font-bold shadow-md hover:bg-m3-primary/90 transition-all active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                <span>Play All</span>
              </button>
            )}
          </div>

          {likedTracks.length === 0 ? (
            <div className="p-16 text-center rounded-m3-xl bg-m3-surface-container/30 border border-m3-outline-variant/20 flex flex-col items-center justify-center gap-3 text-m3-on-surface-variant">
              <Heart className="w-12 h-12 opacity-30 text-rose-500" />
              <p className="text-base font-bold text-m3-on-surface">No liked songs yet</p>
              <p className="text-xs opacity-70 max-w-sm">
                Click the heart icon on any track while browsing or playing to save it here.
              </p>
              {authStatus?.authenticated ? (
                <button
                  onClick={handleSyncLikedSongs}
                  disabled={isSyncingLikes}
                  className="mt-2 flex items-center gap-2 px-5 py-2 rounded-m3-full bg-m3-primary text-m3-on-primary text-xs font-bold shadow-md hover:bg-m3-primary/90 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingLikes ? 'animate-spin' : ''}`} />
                  <span>Sync YouTube Liked Songs</span>
                </button>
              ) : (
                onOpenAuth && (
                  <button
                    onClick={onOpenAuth}
                    className="mt-2 flex items-center gap-2 px-5 py-2 rounded-m3-full bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md transition-all"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                    <span>Sign In to Import YouTube Likes</span>
                  </button>
                )
              )}
            </div>
          ) : (
            <div className="divide-y divide-m3-outline-variant/15 rounded-m3-lg bg-m3-surface-container/40 border border-m3-outline-variant/20 overflow-hidden">
              {likedTracks.map((song, idx) => {
                const isCurrent = currentTrack?.id === song.id;
                return (
                  <div
                    key={song.id}
                    className={`group flex items-center gap-4 p-3 hover:bg-m3-surface-container-high transition-colors ${
                      isCurrent ? 'bg-m3-primary-container/20' : ''
                    }`}
                  >
                    <span className="w-6 text-center text-xs font-mono text-m3-on-surface-variant/60">
                      {idx + 1}
                    </span>

                    <div
                      onClick={() => playTrack(song, likedTracks)}
                      className="relative w-11 h-11 rounded-m3-xs overflow-hidden shrink-0 cursor-pointer bg-m3-surface-container-highest"
                    >
                      <img
                        src={song.thumbnail || (song.id ? `https://i.ytimg.com/vi/${song.id}/hqdefault.jpg` : '')}
                        alt={song.title}
                        onError={(e) => handleImageError(e, song.id)}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                      </div>
                    </div>

                    <div
                      onClick={() => playTrack(song, likedTracks)}
                      className="flex-1 min-w-0 cursor-pointer"
                    >
                      <p className={`text-sm font-bold truncate ${isCurrent ? 'text-m3-primary' : 'text-m3-on-surface'}`}>
                        {song.title}
                      </p>
                      <p className="text-xs text-m3-on-surface-variant truncate">
                        {song.artist}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                      <button
                        onClick={() => toggleLike(song)}
                        title="Remove from Liked"
                        className="p-2 rounded-full text-rose-500 hover:bg-m3-surface-container transition-colors"
                      >
                        <Heart className="w-4 h-4 fill-current" />
                      </button>
                      <button
                        onClick={() => addToQueue(song)}
                        title="Add to queue"
                        className="p-2 rounded-full text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onOpenDownload(song)}
                        title="Download"
                        className="p-2 rounded-full text-m3-on-surface-variant hover:text-m3-primary hover:bg-m3-surface-container transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ──────────────── TAB 2: Albums ──────────────── */}
      {activeTab === 'albums' && (
        <div className="space-y-6">
          {!authStatus?.authenticated ? (
            <div className="p-16 text-center rounded-m3-xl bg-m3-surface-container/30 border border-m3-outline-variant/20 flex flex-col items-center justify-center gap-4 text-m3-on-surface-variant">
              <Disc className="w-12 h-12 opacity-30 text-m3-primary" />
              <div>
                <p className="text-base font-bold text-m3-on-surface">YouTube Music Albums</p>
                <p className="text-xs opacity-70 max-w-sm mt-1">
                  Connect your YouTube account to view all saved and uploaded albums in your library.
                </p>
              </div>
              {onOpenAuth && (
                <button
                  onClick={onOpenAuth}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-m3-full bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  <span>Sign In to Sync Albums</span>
                </button>
              )}
            </div>
          ) : loadingAlbums ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3 text-m3-on-surface-variant">
              <RefreshCw className="w-8 h-8 animate-spin text-m3-primary" />
              <p className="text-xs font-semibold">Loading albums from YouTube Music...</p>
            </div>
          ) : libraryAlbums.length === 0 ? (
            <div className="p-16 text-center rounded-m3-xl bg-m3-surface-container/30 border border-m3-outline-variant/20 flex flex-col items-center justify-center gap-3 text-m3-on-surface-variant">
              <Disc className="w-12 h-12 opacity-30 text-m3-primary" />
              <p className="text-base font-bold text-m3-on-surface">No albums in your YouTube library</p>
              <p className="text-xs opacity-70 max-w-sm">
                Add albums in YouTube Music or browse featured albums on the Home page.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {libraryAlbums.map((album) => (
                <div
                  key={album.id}
                  onClick={() => onSelectAlbum?.(album)}
                  className="group p-4 rounded-m3-lg bg-m3-surface-container/60 hover:bg-m3-surface-container border border-m3-outline-variant/20 hover:border-m3-primary/30 transition-all cursor-pointer flex flex-col space-y-3"
                >
                  <div className="relative aspect-square w-full rounded-m3-md overflow-hidden bg-m3-surface-container-high shadow-md">
                    <img
                      src={album.thumbnail}
                      alt={album.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-m3-on-surface truncate group-hover:text-m3-primary transition-colors">
                      {album.title}
                    </p>
                    <p className="text-xs text-m3-on-surface-variant truncate">
                      {album.artist} {album.year ? `• ${album.year}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
