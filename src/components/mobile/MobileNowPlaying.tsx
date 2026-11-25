import React from 'react';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  Music,
  ListMusic,
  Download,
} from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { handleImageError } from '../../services/api';
import { useThumbnailColors } from '../../utils/colorExtractor';

const formatTime = (secs: number) => {
  if (isNaN(secs) || secs < 0) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

interface MobileNowPlayingProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenQueue: () => void;
  onOpenDownload: () => void;
}

export const MobileNowPlaying: React.FC<MobileNowPlayingProps> = ({
  isOpen,
  onClose,
  onOpenQueue,
  onOpenDownload,
}) => {
  const {
    currentTrack,
    isPlaying,
    togglePlay,
    currentTime,
    duration,
    seekTo,
    prevTrack,
    nextTrack,
    isShuffle,
    toggleShuffle,
    repeatMode,
    cycleRepeat,
    isLiked,
    toggleLike,
  } = usePlayer();

  const thumbnail = currentTrack?.thumbnail || (currentTrack?.id ? `https://i.ytimg.com/vi/${currentTrack.id}/hqdefault.jpg` : '');
  const colors = useThumbnailColors(thumbnail, currentTrack?.id);

  if (!isOpen || !currentTrack) return null;

  const isCurrentLiked = isLiked(currentTrack.id);

  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    seekTo(val);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-between overflow-y-auto select-none bg-slate-950 text-white animate-in slide-in-from-bottom duration-300"
      style={{
        background: `radial-gradient(ellipse 90% 80% at 50% 20%, ${colors.primary}33 0%, #07090e 85%)`,
      }}
    >
      {/* Top Bar with Dismiss */}
      <header className="flex items-center justify-between px-6 pt-[max(1rem,env(safe-area-inset-top))] pb-3 shrink-0">
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white/80 active:scale-90 transition-transform"
          title="Collapse player"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        <div className="text-center px-4">
          <p className="text-[10px] font-bold tracking-widest uppercase text-white/45">
            Playing From
          </p>
          <p className="text-xs font-extrabold text-white truncate max-w-[200px]">
            {currentTrack.album || 'Sonora Stream'}
          </p>
        </div>

        <button
          onClick={onOpenDownload}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white/80 active:scale-90 transition-transform"
          title="Download Track"
        >
          <Download className="w-4 h-4" />
        </button>
      </header>

      {/* Center Artwork & Main Details */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-4 space-y-6 max-w-sm mx-auto w-full">
        {/* Album Artwork with Soft Dynamic Shadow */}
        <div className="relative aspect-square w-full max-w-[320px] rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/15 shrink-0">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={currentTrack.title}
              onError={(e) => handleImageError(e, currentTrack.id)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-white/10 text-white/40">
              <Music className="w-16 h-16" />
            </div>
          )}
        </div>

        {/* Title, Artist, and Like Heart */}
        <div className="w-full flex items-center justify-between gap-3 pt-2">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-extrabold text-white truncate tracking-tight">
              {currentTrack.title}
            </h2>
            <p className="text-sm font-medium text-white/65 truncate mt-0.5">
              {currentTrack.artist || 'Unknown Artist'}
            </p>
          </div>

          <button
            onClick={() => toggleLike(currentTrack)}
            className={`w-11 h-11 flex items-center justify-center rounded-full transition-transform active:scale-80 shrink-0 ${
              isCurrentLiked
                ? 'text-rose-500 bg-rose-500/10'
                : 'text-white/60 hover:text-white bg-white/5'
            }`}
            title={isCurrentLiked ? 'Remove from Liked' : 'Add to Liked'}
          >
            <Heart className={`w-5 h-5 ${isCurrentLiked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Full Scrubber Slider with Big Thumb */}
        <div className="w-full space-y-2 pt-1">
          <input
            type="range"
            min={0}
            max={duration || 1}
            value={currentTime}
            onChange={handleScrubberChange}
            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-sky-400 touch-none"
          />
          <div className="flex items-center justify-between text-xs font-mono text-white/50 px-0.5">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Big Touch Playback Controls */}
        <div className="w-full flex items-center justify-between pt-1 px-2">
          <button
            onClick={toggleShuffle}
            className={`p-3 rounded-full transition-transform active:scale-85 ${
              isShuffle ? 'text-sky-400 bg-sky-500/20' : 'text-white/50'
            }`}
            title="Shuffle"
          >
            <Shuffle className="w-5 h-5" />
          </button>

          <button
            onClick={prevTrack}
            className="p-3 rounded-full text-white/80 active:scale-85 transition-transform"
            title="Previous Track"
          >
            <SkipBack className="w-7 h-7 fill-current" />
          </button>

          <button
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-white text-slate-950 flex items-center justify-center shadow-2xl active:scale-90 transition-transform"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 fill-current" />
            ) : (
              <Play className="w-8 h-8 fill-current ml-1" />
            )}
          </button>

          <button
            onClick={nextTrack}
            className="p-3 rounded-full text-white/80 active:scale-85 transition-transform"
            title="Next Track"
          >
            <SkipForward className="w-7 h-7 fill-current" />
          </button>

          <button
            onClick={cycleRepeat}
            className={`p-3 rounded-full transition-transform active:scale-85 ${
              repeatMode !== 'off' ? 'text-sky-400 bg-sky-500/20' : 'text-white/50'
            }`}
            title="Repeat"
          >
            {repeatMode === 'one' ? (
              <Repeat1 className="w-5 h-5" />
            ) : (
              <Repeat className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Bottom Action Footer (Queue Quick Button) */}
      <footer className="px-8 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2 flex items-center justify-center border-t border-white/10 shrink-0">
        <button
          onClick={onOpenQueue}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white/90 text-xs font-bold active:scale-95 transition-all shadow-sm"
        >
          <ListMusic className="w-4 h-4 text-indigo-400" />
          <span>Up Next Queue</span>
        </button>
      </footer>
    </div>
  );
};
