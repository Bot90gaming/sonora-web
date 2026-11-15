import React from 'react';
import { X, Play, Trash2, Music, ListMusic } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { handleImageError } from '../../services/api';

interface MobileQueueSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileQueueSheet: React.FC<MobileQueueSheetProps> = ({ isOpen, onClose }) => {
  const {
    currentTrack,
    queue,
    playTrack,
    removeFromQueue,
    clearQueue,
    isPlaying,
  } = usePlayer();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-55 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop touch area to dismiss */}
      <div className="flex-1" onClick={onClose} />

      {/* Sheet Container */}
      <div className="bg-m3-surface-container-high border-t border-m3-outline-variant/30 rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Drag Handle */}
        <div className="w-12 h-1.5 bg-m3-outline-variant/40 rounded-full mx-auto my-3 shrink-0" />

        {/* Header */}
        <div className="px-6 pb-3 flex items-center justify-between border-b border-m3-outline-variant/20 shrink-0">
          <div className="flex items-center gap-2">
            <ListMusic className="w-5 h-5 text-m3-primary" />
            <h2 className="text-base font-extrabold text-m3-on-surface">Up Next Queue</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-m3-primary/10 text-m3-primary font-bold">
              {queue.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {queue.length > 0 && (
              <button
                onClick={clearQueue}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container active:scale-95 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Queue List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-[max(2rem,env(safe-area-inset-bottom))]">
          {/* Now Playing Row */}
          {currentTrack && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-m3-primary px-1">
                Now Playing
              </p>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-m3-primary/10 border border-m3-primary/20">
                <img
                  src={currentTrack.thumbnail || `https://i.ytimg.com/vi/${currentTrack.id}/hqdefault.jpg`}
                  alt={currentTrack.title}
                  onError={(e) => handleImageError(e, currentTrack.id)}
                  className="w-12 h-12 rounded-xl object-cover shrink-0 shadow-sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-m3-on-surface truncate">
                    {currentTrack.title}
                  </p>
                  <p className="text-xs text-m3-on-surface-variant truncate mt-0.5">
                    {currentTrack.artist || 'Unknown Artist'}
                  </p>
                </div>
                {isPlaying && (
                  <div className="flex items-end gap-0.5 h-4 px-1 shrink-0">
                    <span className="w-1 h-3 bg-m3-primary rounded-full animate-bounce" />
                    <span className="w-1 h-4 bg-m3-primary rounded-full animate-bounce [animation-delay:0.15s]" />
                    <span className="w-1 h-2 bg-m3-primary rounded-full animate-bounce [animation-delay:0.3s]" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Up Next Rows */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-m3-on-surface-variant/80 px-1">
              Next in Queue
            </p>
            {queue.length === 0 ? (
              <div className="p-10 text-center text-m3-on-surface-variant/60 rounded-2xl border border-dashed border-m3-outline-variant/30">
                <Music className="w-8 h-8 mx-auto mb-2 opacity-40 text-m3-primary" />
                <p className="text-xs font-semibold">Queue is empty</p>
                <p className="text-[11px] opacity-70 mt-0.5">
                  Play songs from Home, Search, or Playlists to add more.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {queue.map((track, idx) => (
                  <div
                    key={`${track.id}-${idx}`}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-m3-surface-container active:bg-m3-surface-container transition-colors group"
                  >
                    <div
                      onClick={() => playTrack(track)}
                      className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                    >
                      <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-m3-surface-container shrink-0">
                        <img
                          src={track.thumbnail || `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`}
                          alt={track.title}
                          onError={(e) => handleImageError(e, track.id)}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="text-xs font-bold text-m3-on-surface truncate">
                          {track.title}
                        </p>
                        <p className="text-[11px] text-m3-on-surface-variant truncate mt-0.5">
                          {track.artist || 'Unknown Artist'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => playTrack(track)}
                        className="p-2 text-m3-on-surface-variant hover:text-m3-primary transition-colors"
                        title="Play Now"
                      >
                        <Play className="w-4 h-4 fill-current" />
                      </button>
                      <button
                        onClick={() => removeFromQueue(idx)}
                        className="p-2 text-m3-on-surface-variant hover:text-rose-400 transition-colors"
                        title="Remove from queue"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
