import React, { useState } from 'react';
import { Heart, Play, Plus, Download, Disc, ListMusic } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { Track, Album, Playlist } from '../types';
import { SAMPLE_ALBUMS, SAMPLE_PLAYLISTS, handleImageError } from '../services/api';

interface LibraryViewProps {
  onSelectAlbum: (album: Album) => void;
  onSelectPlaylist: (playlist: Playlist) => void;
  onOpenDownload: (track: Track) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  onSelectAlbum,
  onSelectPlaylist,
  onOpenDownload,
}) => {
  const { likedTracks, playTrack, currentTrack, toggleLike, addToQueue } = usePlayer();
  const [activeTab, setActiveTab] = useState<'liked' | 'albums' | 'playlists'>('liked');

  const handlePlayLikedAll = () => {
    if (likedTracks.length > 0) {
      playTrack(likedTracks[0], likedTracks);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header & Sub-Tabs */}
      <div className="space-y-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-m3-on-surface tracking-tight">
          Your Library
        </h1>

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
            <span>Albums</span>
          </button>

          <button
            onClick={() => setActiveTab('playlists')}
            className={`flex items-center gap-2 px-4 py-2 rounded-m3-full text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'playlists'
                ? 'bg-m3-primary/20 text-m3-primary border border-m3-primary/30'
                : 'text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5" />
            <span>Playlists</span>
          </button>
        </div>
      </div>

      {/* Tab: Liked Songs */}
      {activeTab === 'liked' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-m3-on-surface-variant">
              All songs you marked with a heart across Sonora
            </p>
            {likedTracks.length > 0 && (
              <button
                onClick={handlePlayLikedAll}
                className="flex items-center gap-2 px-4 py-1.5 rounded-m3-full bg-m3-primary text-m3-on-primary text-xs font-bold shadow-md hover:bg-m3-primary/90 transition-all"
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
                Click the heart icon on any track while browsing or playing to save it here for instant offline access.
              </p>
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

      {/* Tab: Albums */}
      {activeTab === 'albums' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {SAMPLE_ALBUMS.map((album) => (
            <div
              key={album.id}
              onClick={() => onSelectAlbum(album)}
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
                  {album.artist} • {album.year}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Playlists */}
      {activeTab === 'playlists' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {SAMPLE_PLAYLISTS.map((playlist) => (
            <div
              key={playlist.id}
              onClick={() => onSelectPlaylist(playlist)}
              className="group p-4 rounded-m3-lg bg-m3-surface-container/60 hover:bg-m3-surface-container border border-m3-outline-variant/20 hover:border-m3-primary/30 transition-all cursor-pointer flex flex-col space-y-3"
            >
              <div className="relative aspect-square w-full rounded-m3-md overflow-hidden bg-m3-surface-container-high shadow-md">
                <img
                  src={playlist.thumbnail}
                  alt={playlist.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div>
                <p className="text-sm font-bold text-m3-on-surface truncate group-hover:text-m3-primary transition-colors">
                  {playlist.title}
                </p>
                <p className="text-xs text-m3-on-surface-variant line-clamp-2">
                  {playlist.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
