import React from 'react';
import { Play, Heart, Plus, Sparkles, Disc, Download } from 'lucide-react';
import { Track, Album, Playlist } from '../types';
import { SAMPLE_TRACKS, SAMPLE_ALBUMS, SAMPLE_PLAYLISTS, handleImageError } from '../services/api';
import { usePlayer } from '../context/PlayerContext';

interface HomeViewProps {
  onSelectAlbum: (album: Album) => void;
  onSelectPlaylist: (playlist: Playlist) => void;
  onOpenDownload: (track: Track) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onSelectAlbum,
  onSelectPlaylist,
  onOpenDownload,
}) => {
  const { playTrack, currentTrack, toggleLike, isLiked, addToQueue } = usePlayer();

  const heroTrack = SAMPLE_TRACKS[0];

  return (
    <div className="p-6 lg:p-8 space-y-10 max-w-7xl mx-auto pb-16">
      {/* ──────────────── Featured Hero Banner / Carousel ──────────────── */}
      <section className="relative rounded-m3-xl overflow-hidden p-8 sm:p-12 shadow-2xl border border-m3-outline-variant/30 bg-gradient-to-r from-blue-900/80 via-indigo-900/80 to-purple-950/90 flex flex-col md:flex-row items-center justify-between gap-8 group">
        <div 
          className="absolute inset-0 opacity-20 bg-cover bg-center filter blur-2xl group-hover:scale-105 transition-transform duration-700 pointer-events-none -z-10"
          style={{ backgroundImage: `url(${heroTrack.thumbnail})` }}
        />

        <div className="flex-1 space-y-4 z-10 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-wider border border-blue-400/30">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Featured Release
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            {heroTrack.title}
          </h1>
          <p className="text-base sm:text-lg text-blue-100/80 font-medium">
            {heroTrack.artist} • {heroTrack.album}
          </p>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
            <button
              onClick={() => playTrack(heroTrack, SAMPLE_TRACKS)}
              className="flex items-center gap-2 px-7 py-3 rounded-m3-full bg-white text-blue-900 font-bold shadow-xl hover:bg-blue-50 active:scale-95 transition-all"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Listen Now</span>
            </button>
            <button
              onClick={() => onSelectAlbum(SAMPLE_ALBUMS[1])}
              className="flex items-center gap-2 px-6 py-3 rounded-m3-full bg-white/10 hover:bg-white/20 text-white font-semibold backdrop-blur-md border border-white/20 transition-all"
            >
              <Disc className="w-4 h-4" />
              <span>View Album</span>
            </button>
          </div>
        </div>

        <div className="relative w-48 h-48 sm:w-64 sm:h-64 rounded-m3-xl overflow-hidden shadow-2xl shrink-0 border-2 border-white/10 group-hover:rotate-1 transition-transform duration-500">
          <img
            src={heroTrack.thumbnail || (heroTrack.id ? `https://i.ytimg.com/vi/${heroTrack.id}/hqdefault.jpg` : '')}
            alt={heroTrack.title}
            onError={(e) => handleImageError(e, heroTrack?.id)}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>
      </section>

      {/* ──────────────── Quick Picks (Grid of top tracks) ──────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-m3-on-surface tracking-tight">
              Quick Picks
            </h2>
            <p className="text-xs sm:text-sm text-m3-on-surface-variant">
              Start listening to songs picked just for you
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {SAMPLE_TRACKS.map((track) => {
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
                    onClick={() => playTrack(track, SAMPLE_TRACKS)}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  >
                    <Play className="w-5 h-5 text-white fill-white" />
                  </button>
                </div>

                {/* Track Details */}
                <div className="flex-1 min-w-0">
                  <p
                    onClick={() => playTrack(track, SAMPLE_TRACKS)}
                    className="text-sm font-bold text-m3-on-surface truncate cursor-pointer hover:underline"
                  >
                    {track.title}
                  </p>
                  <p className="text-xs text-m3-on-surface-variant truncate">
                    {track.artist}
                  </p>
                  <span className="text-[10px] text-m3-on-surface-variant/70 font-mono">
                    {track.durationFormatted}
                  </span>
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
      </section>

      {/* ──────────────── Trending Albums ──────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-m3-on-surface tracking-tight">
              Trending Albums
            </h2>
            <p className="text-xs sm:text-sm text-m3-on-surface-variant">
              Top global releases and timeless masterpieces
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {SAMPLE_ALBUMS.map((album) => (
            <div
              key={album.id}
              onClick={() => onSelectAlbum(album)}
              className="group p-4 rounded-m3-lg bg-m3-surface-container/60 hover:bg-m3-surface-container border border-m3-outline-variant/20 hover:border-m3-primary/30 transition-all duration-200 cursor-pointer flex flex-col space-y-3"
            >
              <div className="relative aspect-square w-full rounded-m3-md overflow-hidden bg-m3-surface-container-high shadow-md">
                <img
                  src={album.thumbnail}
                  alt={album.title}
                  onError={(e) => handleImageError(e, album.tracks?.[0]?.id)}
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
                  {album.artist} • {album.year}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ──────────────── Recommended Playlists ──────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-m3-on-surface tracking-tight">
              Curated Playlists
            </h2>
            <p className="text-xs sm:text-sm text-m3-on-surface-variant">
              Hand-picked selections for mood, energy, and inspiration
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {SAMPLE_PLAYLISTS.map((playlist) => (
            <div
              key={playlist.id}
              onClick={() => onSelectPlaylist(playlist)}
              className="group p-4 rounded-m3-lg bg-m3-surface-container/60 hover:bg-m3-surface-container border border-m3-outline-variant/20 hover:border-m3-primary/30 transition-all duration-200 cursor-pointer flex flex-col space-y-3"
            >
              <div className="relative aspect-square w-full rounded-m3-md overflow-hidden bg-m3-surface-container-high shadow-md">
                <img
                  src={playlist.thumbnail}
                  alt={playlist.title}
                  onError={(e) => handleImageError(e, playlist.tracks?.[0]?.id)}
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
                  {playlist.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
