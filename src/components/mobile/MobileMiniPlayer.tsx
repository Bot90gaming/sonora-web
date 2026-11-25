import React from 'react';
import { Play, Pause, Heart, Music, SkipForward } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { handleImageError } from '../../services/api';

interface MobileMiniPlayerProps {
  onOpenNowPlaying: () => void;
}

export const MobileMiniPlayer: React.FC<MobileMiniPlayerProps> = ({ onOpenNowPlaying }) => {
  const {
    currentTrack,
    isPlaying,
    togglePlay,
    currentTime,
    duration,
    isLiked,
    toggleLike,
    nextTrack,
  } = usePlayer();

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const isCurrentLiked = isLiked(currentTrack.id);
  const thumbnail = currentTrack.thumbnail || (currentTrack.id ? `https://i.ytimg.com/vi/${currentTrack.id}/hqdefault.jpg` : '');

  return (
    <div
      onClick={onOpenNowPlaying}
      className="fixed bottom-[calc(64px+env(safe-area-inset-bottom,0px))] inset-x-2 z-35 max-w-lg mx-auto bg-m3-surface-container-high/95 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.6)] cursor-pointer active:scale-[0.99] transition-transform overflow-hidden select-none"
    >
      {/* Top 2px Micro Scrubber Line */}
      <div className="absolute top-0 inset-x-0 h-[2.5px] bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 transition-all duration-150 ease-linear"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex items-center justify-between p-2.5 gap-3">
        {/* Track Artwork */}
        <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-m3-surface-container shrink-0 shadow-sm border border-white/10">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={currentTrack.title}
              onError={(e) => handleImageError(e, currentTrack.id)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/40">
              <Music className="w-5 h-5" />
            </div>
          )}
        </div>

        {/* Title & Artist */}
        <div className="flex-1 min-w-0 pr-1">
          <p className="text-xs font-bold text-white truncate leading-tight">
            {currentTrack.title}
          </p>
          <p className="text-[11px] text-white/60 truncate mt-0.5">
            {currentTrack.artist || 'Unknown Artist'}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* Like Heart */}
          <button
            onClick={() => toggleLike(currentTrack)}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-transform active:scale-80 ${
              isCurrentLiked ? 'text-rose-500' : 'text-white/60 hover:text-white'
            }`}
            title={isCurrentLiked ? 'Unlike' : 'Like'}
          >
            <Heart className={`w-4 h-4 ${isCurrentLiked ? 'fill-current' : ''}`} />
          </button>

          {/* Play/Pause Button */}
          <button
            onClick={togglePlay}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-slate-950 shadow-md active:scale-90 transition-transform"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          {/* Next Button */}
          <button
            onClick={nextTrack}
            className="w-10 h-10 flex items-center justify-center rounded-full text-white/70 hover:text-white active:scale-90 transition-transform"
            title="Next Track"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
};
