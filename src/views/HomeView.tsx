import React, { useState, useEffect, useCallback } from 'react';
import {
  Play,
  Heart,
  Plus,
  Sparkles,
  Download,
  RefreshCw,
} from 'lucide-react';
import { Track, Album, Playlist, HomeSection, AuthStatus } from '../types';
import { api, handleImageError, SAMPLE_TRACKS, SAMPLE_ALBUMS, SAMPLE_PLAYLISTS } from '../services/api';
import { usePlayer } from '../context/PlayerContext';

interface HomeViewProps {
  onSelectAlbum: (album: Album) => void;
  onSelectPlaylist: (playlist: Playlist) => void;
  onOpenDownload: (track: Track) => void;
  onOpenAuth?: () => void;
  authStatus?: AuthStatus;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onSelectAlbum,
  onSelectPlaylist,
  onOpenDownload,
  onOpenAuth,
  authStatus,
}) => {
  const { playTrack, currentTrack, toggleLike, isLiked, addToQueue } = usePlayer();

  const [sections, setSections] = useState<HomeSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadHomeFeed = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    else setLoading(true);

    try {
      const feed = await api.getHome(12);
      if (feed && feed.length > 0) {
        setSections(feed);
      } else {
        // Fallback sections if backend unreachable
        setSections([
          { title: 'Quick Picks', contents: SAMPLE_TRACKS },
          { title: 'Trending Albums', contents: SAMPLE_ALBUMS },
          { title: 'Curated Playlists', contents: SAMPLE_PLAYLISTS },
        ]);
      }
    } catch {
      setSections([
        { title: 'Quick Picks', contents: SAMPLE_TRACKS },
        { title: 'Trending Albums', contents: SAMPLE_ALBUMS },
        { title: 'Curated Playlists', contents: SAMPLE_PLAYLISTS },
      ]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadHomeFeed();
  }, [loadHomeFeed, authStatus?.authenticated]);

  // Find a suitable Hero Track from the first section that contains tracks
  const heroTrack: Track = (() => {
    for (const sec of sections) {
      for (const item of sec.contents) {
        if ('artist' in item && item.id) {
          return item as Track;
        }
      }
    }
    return SAMPLE_TRACKS[0];
  })();

  // Filter tracks in the hero track's section for queueing
  const heroSectionTracks: Track[] = (() => {
    for (const sec of sections) {
      const tracks = sec.contents.filter((i): i is Track => 'artist' in i && !!i.id);
      if (tracks.some((t) => t.id === heroTrack.id)) {
        return tracks;
      }
    }
    return [heroTrack];
  })();

  const isTrackItem = (item: any): item is Track => {
    return 'artist' in item && !!item.id && !('trackCount' in item) && !('year' in item);
  };

  const isPlaylistItem = (item: any): item is Playlist => {
    return 'description' in item || 'trackCount' in item || (!('artist' in item) && 'title' in item);
  };

  const isAlbumItem = (item: any): item is Album => {
    return 'year' in item && 'artist' in item;
  };

  return (
    <div className="p-6 lg:p-8 space-y-10 max-w-7xl mx-auto pb-16">
      {/* ──────────────── Top Feed Status & Quick Refresh ──────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-m3-on-surface tracking-tight flex items-center gap-3">
            <span>Discover</span>
            {authStatus?.authenticated ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-red-600/15 text-red-400 border border-red-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                YouTube Personalized Feed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                Trending on YouTube Music
              </span>
            )}
          </h1>
          <p className="text-xs text-m3-on-surface-variant mt-1">
            {authStatus?.authenticated
              ? 'Real-time recommendations, quick picks, and recent listens from your YouTube account'
              : 'Global top charts and recommendations. Sign in to personalize.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!authStatus?.authenticated && onOpenAuth && (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-m3-full bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-sm active:scale-95 group"
            >
              <svg className="w-3.5 h-3.5 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              <span>Personalize with YouTube</span>
            </button>
          )}

          <button
            onClick={() => loadHomeFeed(true)}
            disabled={isRefreshing}
            title="Refresh home feed"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-m3-full bg-m3-surface-container-high/60 hover:bg-m3-surface-container-highest border border-m3-outline-variant/30 text-xs font-semibold text-m3-on-surface transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-m3-primary' : ''}`} />
            <span>Refresh Feed</span>
          </button>
        </div>
      </div>

      {/* ──────────────── Featured Hero Banner ──────────────── */}
      {heroTrack && (
        <section className="relative rounded-m3-xl overflow-hidden p-8 sm:p-12 shadow-2xl border border-m3-outline-variant/30 bg-gradient-to-r from-blue-900/80 via-indigo-900/80 to-purple-950/90 flex flex-col md:flex-row items-center justify-between gap-8 group">
          <div 
            className="absolute inset-0 opacity-25 bg-cover bg-center filter blur-2xl group-hover:scale-105 transition-transform duration-700 pointer-events-none -z-10"
            style={{ backgroundImage: `url(${heroTrack.thumbnail})` }}
          />

          <div className="flex-1 space-y-4 z-10 text-center md:text-left min-w-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-wider border border-blue-400/30">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Featured Pick for You
            </div>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight line-clamp-2">
              {heroTrack.title}
            </h2>
            <p className="text-base sm:text-lg text-blue-100/80 font-medium truncate">
              {heroTrack.artist} {heroTrack.album ? `• ${heroTrack.album}` : ''}
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
              <button
                onClick={() => playTrack(heroTrack, heroSectionTracks)}
                className="flex items-center gap-2 px-7 py-3 rounded-m3-full bg-white text-blue-900 font-bold shadow-xl hover:bg-blue-50 active:scale-95 transition-all"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Listen Now</span>
              </button>
              <button
                onClick={() => addToQueue(heroTrack)}
                className="flex items-center gap-2 px-6 py-3 rounded-m3-full bg-white/10 hover:bg-white/20 text-white font-semibold backdrop-blur-md border border-white/20 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add to Queue</span>
              </button>
            </div>
          </div>

          <div className="relative w-44 h-44 sm:w-60 sm:h-60 rounded-m3-xl overflow-hidden shadow-2xl shrink-0 border-2 border-white/10 group-hover:rotate-1 transition-transform duration-500 bg-m3-surface-container-highest">
            <img
              src={heroTrack.thumbnail || (heroTrack.id ? `https://i.ytimg.com/vi/${heroTrack.id}/hqdefault.jpg` : '')}
              alt={heroTrack.title}
              onError={(e) => handleImageError(e, heroTrack?.id)}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </div>
        </section>
      )}

      {/* ──────────────── Loading State ──────────────── */}
      {loading ? (
        <div className="p-20 flex flex-col items-center justify-center gap-3 text-m3-on-surface-variant">
          <RefreshCw className="w-8 h-8 animate-spin text-m3-primary" />
          <p className="text-sm font-semibold">Fetching your YouTube Music home feed...</p>
        </div>
      ) : (
        /* ──────────────── Dynamic Home Feed Sections ──────────────── */
        sections.map((section, sIdx) => {
          const contents = section.contents || [];
          if (contents.length === 0) return null;

          const isPlaylistSection = contents.some((item) => isPlaylistItem(item) && !isTrackItem(item));
          const isAlbumSection = contents.some((item) => isAlbumItem(item));
          const sectionTracks = contents.filter(isTrackItem);

          return (
            <section key={`${section.title}-${sIdx}`} className="space-y-4">
              {/* Section Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-m3-on-surface tracking-tight">
                    {section.title}
                  </h2>
                  <p className="text-xs text-m3-on-surface-variant mt-0.5">
                    {sectionTracks.length > 0
                      ? `${sectionTracks.length} tracks ready to play`
                      : `${contents.length} items`}
                  </p>
                </div>

                {sectionTracks.length > 1 && (
                  <button
                    onClick={() => playTrack(sectionTracks[0], sectionTracks)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-m3-full bg-m3-primary/10 hover:bg-m3-primary/20 text-m3-primary border border-m3-primary/25 text-xs font-semibold transition-all active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    <span>Play Section</span>
                  </button>
                )}
              </div>

              {/* ──────────────── Playlist Section Grid ──────────────── */}
              {isPlaylistSection ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {contents.map((item, pIdx) => {
                    const playlist = item as Playlist;
                    return (
                      <div
                        key={playlist.id || pIdx}
                        onClick={() => onSelectPlaylist(playlist)}
                        className="group p-4 rounded-m3-lg bg-m3-surface-container/60 hover:bg-m3-surface-container border border-m3-outline-variant/20 hover:border-m3-primary/30 transition-all duration-200 cursor-pointer flex flex-col space-y-3"
                      >
                        <div className="relative aspect-square w-full rounded-m3-md overflow-hidden bg-m3-surface-container-high shadow-md">
                          <img
                            src={playlist.thumbnail}
                            alt={playlist.title}
                            onError={(e) => handleImageError(e)}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute right-3 bottom-3 w-10 h-10 rounded-full bg-m3-primary text-m3-on-primary shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all">
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-bold text-m3-on-surface truncate group-hover:text-m3-primary transition-colors">
                            {playlist.title}
                          </p>
                          <p className="text-xs text-m3-on-surface-variant line-clamp-2 mt-0.5">
                            {playlist.description || 'YouTube Playlist'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : isAlbumSection ? (
                /* ──────────────── Album Section Grid ──────────────── */
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                  {contents.map((item, aIdx) => {
                    const album = item as Album;
                    return (
                      <div
                        key={album.id || aIdx}
                        onClick={() => onSelectAlbum(album)}
                        className="group p-4 rounded-m3-lg bg-m3-surface-container/60 hover:bg-m3-surface-container border border-m3-outline-variant/20 hover:border-m3-primary/30 transition-all duration-200 cursor-pointer flex flex-col space-y-3"
                      >
                        <div className="relative aspect-square w-full rounded-m3-md overflow-hidden bg-m3-surface-container-high shadow-md">
                          <img
                            src={album.thumbnail}
                            alt={album.title}
                            onError={(e) => handleImageError(e)}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute right-3 bottom-3 w-10 h-10 rounded-full bg-m3-primary text-m3-on-primary shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all">
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          </div>
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
                    );
                  })}
                </div>
              ) : (
                /* ──────────────── Tracks Section Grid ──────────────── */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {sectionTracks.map((track) => {
                    const isCurrent = currentTrack?.id === track.id;
                    const liked = isLiked(track.id);

                    return (
                      <div
                        key={track.id}
                        className={`group relative flex items-center gap-3.5 p-3 rounded-m3-lg transition-all duration-200 border ${
                          isCurrent
                            ? 'bg-m3-primary-container/70 border-m3-primary/40 shadow-sm'
                            : 'bg-m3-surface-container/60 hover:bg-m3-surface-container-high border-m3-outline-variant/20 hover:border-m3-outline-variant/40'
                        }`}
                      >
                        {/* Thumbnail with overlay play */}
                        <div className="relative w-14 h-14 rounded-m3-md overflow-hidden shrink-0 bg-m3-surface-container-highest shadow-sm">
                          <img
                            src={track.thumbnail || (track.id ? `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg` : '')}
                            alt={track.title}
                            onError={(e) => handleImageError(e, track?.id)}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <button
                            onClick={() => playTrack(track, sectionTracks)}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                            aria-label={`Play ${track.title}`}
                          >
                            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                          </button>
                        </div>

                        {/* Track Details */}
                        <div className="flex-1 min-w-0">
                          <p
                            onClick={() => playTrack(track, sectionTracks)}
                            className="text-sm font-bold text-m3-on-surface truncate cursor-pointer hover:underline"
                            title={track.title}
                          >
                            {track.title}
                          </p>
                          <p className="text-xs text-m3-on-surface-variant truncate" title={track.artist}>
                            {track.artist}
                          </p>
                          {track.durationFormatted && (
                            <span className="text-[10px] text-m3-on-surface-variant/70 font-mono">
                              {track.durationFormatted}
                            </span>
                          )}
                        </div>

                        {/* Action buttons (Like, Add to queue, Download) */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => toggleLike(track)}
                            title={liked ? 'Unlike' : 'Like'}
                            className="p-1.5 rounded-full text-m3-on-surface-variant hover:text-rose-500 hover:bg-m3-surface-container-highest transition-colors"
                          >
                            <Heart className={`w-4 h-4 ${liked ? 'text-rose-500 fill-rose-500' : ''}`} />
                          </button>
                          <button
                            onClick={() => addToQueue(track)}
                            title="Add to queue"
                            className="p-1.5 rounded-full text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container-highest transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenDownload(track)}
                            title="Download"
                            className="p-1.5 rounded-full text-m3-on-surface-variant hover:text-m3-primary hover:bg-m3-surface-container-highest transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })
      )}
    </div>
  );
};
