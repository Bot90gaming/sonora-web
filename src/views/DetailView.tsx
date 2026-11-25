import React, { useEffect, useState } from 'react';
import { ArrowLeft, Play, Shuffle, Download, Heart, Disc, ListMusic, Plus } from 'lucide-react';
import { Album, Playlist, Track } from '../types';
import { usePlayer } from '../context/PlayerContext';
import { api, handleImageError } from '../services/api';

interface DetailViewProps {
  item: Album | Playlist;
  type: 'album' | 'playlist';
  onBack: () => void;
  onOpenDownload: (track: Track) => void;
}

export const DetailView: React.FC<DetailViewProps> = ({
  item,
  type,
  onBack,
  onOpenDownload,
}) => {
  const { playTrack, currentTrack, toggleLike, isLiked, addToQueue, addDownload } = usePlayer();
  const [loadedPlaylist, setLoadedPlaylist] = useState<Playlist | null>(null);
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [playlistError, setPlaylistError] = useState<string | null>(null);

  useEffect(() => {
    if (type !== 'playlist' || item.tracks?.length) {
      setLoadedPlaylist(null);
      setPlaylistError(null);
      return;
    }

    let cancelled = false;
    setPlaylistLoading(true);
    setPlaylistError(null);
    api.getPlaylist(item.id)
      .then((playlist) => {
        if (!cancelled) {
          if (!playlist) throw new Error('Playlist data was empty.');
          setLoadedPlaylist(playlist);
        }
      })
      .catch((error) => {
        if (!cancelled) setPlaylistError(error instanceof Error ? error.message : 'Could not load playlist.');
      })
      .finally(() => {
        if (!cancelled) setPlaylistLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [item.id, item.tracks?.length, type]);

  const detailItem = loadedPlaylist || item;
  const tracks: Track[] = detailItem.tracks || [];
  const artistName = 'artist' in detailItem ? detailItem.artist : ('author' in detailItem ? detailItem.author : 'Sonora Curator');
  const yearInfo = 'year' in detailItem ? detailItem.year : '';
  const desc = 'description' in detailItem ? detailItem.description : '';

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      playTrack(tracks[0], tracks);
    }
  };

  const handleShufflePlay = () => {
    if (tracks.length > 0) {
      const shuffled = [...tracks].sort(() => Math.random() - 0.5);
      playTrack(shuffled[0], shuffled);
    }
  };

  const handleDownloadAll = () => {
    tracks.forEach((track) => {
      addDownload(track, 'mp3');
    });
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto pb-16">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-m3-full bg-m3-surface-container text-xs font-semibold text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container-high transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-center md:items-end gap-6 sm:gap-8 pb-6 border-b border-m3-outline-variant/20">
        <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-m3-xl overflow-hidden shadow-2xl bg-m3-surface-container-high shrink-0 border border-m3-outline-variant/30">
          <img
            src={detailItem.thumbnail || (detailItem.tracks && detailItem.tracks[0]?.id ? `https://i.ytimg.com/vi/${detailItem.tracks[0].id}/hqdefault.jpg` : '')}
            alt={detailItem.title}
            onError={(e) => handleImageError(e, item.tracks?.[0]?.id)}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 space-y-3 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-m3-primary/10 text-m3-primary text-xs font-bold uppercase tracking-wider">
            {type === 'album' ? <Disc className="w-3.5 h-3.5" /> : <ListMusic className="w-3.5 h-3.5" />}
            <span>{type.toUpperCase()}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-m3-on-surface tracking-tight leading-tight">
            {detailItem.title}
          </h1>

          <p className="text-sm sm:text-base text-m3-on-surface-variant font-medium">
            {artistName} {yearInfo ? `• ${yearInfo}` : ''} • {tracks.length} songs
          </p>

          {desc && (
            <p className="text-xs sm:text-sm text-m3-on-surface-variant/80 max-w-2xl line-clamp-2">
              {desc}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
            <button
              onClick={handlePlayAll}
              disabled={tracks.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 rounded-m3-full bg-m3-primary text-m3-on-primary font-bold shadow-lg shadow-m3-primary/25 hover:bg-m3-primary/90 active:scale-95 transition-all disabled:opacity-40"
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
              <span>Play All</span>
            </button>

            <button
              onClick={handleShufflePlay}
              disabled={tracks.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-m3-full bg-m3-surface-container-high hover:bg-m3-surface-container-highest text-m3-on-surface font-semibold border border-m3-outline-variant/30 transition-all disabled:opacity-40"
            >
              <Shuffle className="w-4 h-4" />
              <span>Shuffle</span>
            </button>

            <button
              onClick={handleDownloadAll}
              disabled={tracks.length === 0}
              title="Download all tracks in this release"
              className="p-2.5 rounded-full bg-m3-surface-container-high hover:bg-m3-surface-container-highest text-m3-on-surface-variant hover:text-m3-primary border border-m3-outline-variant/30 transition-colors disabled:opacity-40"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Track list */}
      <div className="space-y-2">
        <h2 className="text-lg font-bold text-m3-on-surface">Tracklist</h2>

        <div className="divide-y divide-m3-outline-variant/15 rounded-m3-lg bg-m3-surface-container/40 border border-m3-outline-variant/20 overflow-hidden">
          {playlistLoading ? (
            <div className="p-8 text-center text-sm text-m3-on-surface-variant">Loading playlist...</div>
          ) : playlistError ? (
            <div className="p-8 text-center text-sm text-red-400">{playlistError}</div>
          ) : tracks.length === 0 ? (
            <div className="p-8 text-center text-sm text-m3-on-surface-variant">
              No tracks available in this collection.
            </div>
          ) : (
            tracks.map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id;
              const liked = isLiked(track.id);

              return (
                <div
                  key={`${track.id}-${idx}`}
                  className={`group flex items-center gap-4 p-3 hover:bg-m3-surface-container-high transition-colors ${
                    isCurrent ? 'bg-m3-primary-container/30' : ''
                  }`}
                >
                  <span className="w-6 text-center text-xs font-mono text-m3-on-surface-variant/60">
                    {idx + 1}
                  </span>

                  <div
                    onClick={() => playTrack(track, tracks)}
                    className="relative w-11 h-11 rounded-m3-xs overflow-hidden shrink-0 cursor-pointer bg-m3-surface-container-highest"
                  >
                    <img
                      src={track.thumbnail || (track.id ? `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg` : item.thumbnail)}
                      alt={track.title}
                      onError={(e) => handleImageError(e, track.id)}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                    </div>
                  </div>

                  <div
                    onClick={() => playTrack(track, tracks)}
                    className="flex-1 min-w-0 cursor-pointer"
                  >
                    <p className={`text-sm font-bold truncate ${isCurrent ? 'text-m3-primary' : 'text-m3-on-surface'}`}>
                      {track.title}
                    </p>
                    <p className="text-xs text-m3-on-surface-variant truncate">
                      {track.artist}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                    <button
                      onClick={() => toggleLike(track)}
                      title={liked ? 'Unlike' : 'Like'}
                      className="p-2 rounded-full text-m3-on-surface-variant hover:text-rose-500 hover:bg-m3-surface-container transition-colors"
                    >
                      <Heart className={`w-4 h-4 ${liked ? 'text-rose-500 fill-rose-500' : ''}`} />
                    </button>
                    <button
                      onClick={() => addToQueue(track)}
                      title="Add to queue"
                      className="p-2 rounded-full text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onOpenDownload(track)}
                      title="Download song"
                      className="p-2 rounded-full text-m3-on-surface-variant hover:text-m3-primary hover:bg-m3-surface-container transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-mono text-m3-on-surface-variant/70 w-12 text-right">
                      {track.durationFormatted || '3:30'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
