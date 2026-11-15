import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  Trash2,
  Radio,
  Play,
  Pause,
  ArrowUp,
  ArrowDown,
  Music2,
  Sparkles,
  GripVertical,
  ListMusic,
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { handleImageError } from '../services/api';

export const QueueDrawer: React.FC = () => {
  const {
    queue,
    queueIndex,
    currentTrack,
    isPlaying,
    isStationMode,
    toggleStationMode,
    toggleQueue,
    playTrack,
    togglePlay,
    removeFromQueue,
    reorderQueue,
    clearQueue,
  } = usePlayer();

  // Animation & transition states
  const [isOpen, setIsOpen] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [removingIndex, setRemovingIndex] = useState<number | null>(null);
  const dragItemNode = useRef<HTMLDivElement | null>(null);

  // Trigger smooth entrance animation on mount
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setIsOpen(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  // Handle smooth closing transition
  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      toggleQueue(false);
    }, 280);
  }, [toggleQueue]);

  // Keyboard shortcut (Escape to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  // Reordering handlers
  const handleMoveUp = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (index > 0) {
      reorderQueue(index, index - 1);
    }
  };

  const handleMoveDown = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (index < queue.length - 1) {
      reorderQueue(index, index + 1);
    }
  };

  // Smooth removal animation
  const handleRemove = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setRemovingIndex(index);
    setTimeout(() => {
      removeFromQueue(index);
      setRemovingIndex(null);
    }, 220);
  };

  // HTML5 Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggingIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    dragItemNode.current = e.currentTarget;
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault();
    if (draggingIndex !== null && draggingIndex !== targetIndex) {
      reorderQueue(draggingIndex, targetIndex);
    }
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  const formatDuration = (seconds?: number, formatted?: string) => {
    if (formatted) return formatted;
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop overlay blur */}
      <div
        onClick={handleClose}
        className={`fixed inset-0 z-40 bg-black/55 backdrop-blur-sm transition-opacity duration-300 ease-out ${
          isOpen && !isClosing ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      {/* Slide-over Queue Drawer */}
      <aside
        className={`fixed inset-y-0 right-0 w-full sm:w-[420px] max-w-[100vw] z-50 flex flex-col bg-m3-surface-container/85 dark:bg-[#0c101a]/90 backdrop-blur-2xl border-l border-white/10 dark:border-white/5 shadow-[-16px_0_48px_rgba(0,0,0,0.45)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen && !isClosing ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Playback Queue"
      >
        {/* Drawer Header with Glass Surface */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-m3-outline-variant/20 shrink-0 bg-m3-surface-container-high/30 dark:bg-white/[0.02] backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-m3-sm bg-m3-primary/10 text-m3-primary">
              <ListMusic className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base text-m3-on-surface tracking-tight">
                  Play Queue
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-m3-primary/10 text-m3-primary border border-m3-primary/25 font-mono font-bold shadow-xs">
                  {queue.length} {queue.length === 1 ? 'track' : 'tracks'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {queue.length > 1 && (
              <button
                onClick={clearQueue}
                title="Clear entire queue"
                className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-m3-full text-xs font-medium text-m3-on-surface-variant hover:text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all duration-150 active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}

            <button
              onClick={handleClose}
              title="Close Queue (Esc)"
              className="p-2 rounded-full text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container-high/80 transition-all duration-200 active:scale-90 hover:rotate-90"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sonora Station Mode Toggle Strip with Pulsing Radar Effect */}
        <div className="px-5 py-3.5 border-b border-m3-outline-variant/15 bg-gradient-to-r from-m3-surface-container-low/90 via-m3-surface-container/50 to-m3-surface-container-low/90 backdrop-blur-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Animated Radio Beacon */}
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-m3-primary/10 text-m3-primary shrink-0">
              <Radio
                className={`w-4 h-4 transition-transform duration-300 ${
                  isStationMode ? 'text-m3-primary scale-110' : 'text-m3-on-surface-variant'
                }`}
              />
              {isStationMode && (
                <>
                  <span className="absolute inset-0 rounded-full bg-m3-primary/25 animate-ping" />
                  <span className="absolute -inset-1 rounded-full border border-m3-primary/40 animate-pulse" />
                </>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-m3-on-surface tracking-wide">
                  Sonora Station
                </span>
                {isStationMode && (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded-full bg-m3-primary/15 text-m3-primary border border-m3-primary/30 shadow-[0_0_8px_rgba(59,130,246,0.25)]">
                    <Sparkles className="w-2.5 h-2.5 animate-spin" style={{ animationDuration: '4s' }} /> Live
                  </span>
                )}
              </div>
              <p className="text-[11px] text-m3-on-surface-variant/80 truncate">
                {isStationMode
                  ? 'Auto-recommending similar tracks'
                  : 'Plays through queue once'}
              </p>
            </div>
          </div>

          {/* Sleek Toggle Switch */}
          <button
            onClick={toggleStationMode}
            role="switch"
            aria-checked={isStationMode}
            title={isStationMode ? 'Disable Sonora Station' : 'Enable Sonora Station'}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-m3-primary ${
              isStationMode
                ? 'bg-m3-primary shadow-[0_0_14px_rgba(59,130,246,0.55)]'
                : 'bg-m3-surface-variant/80 hover:bg-m3-surface-variant'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                isStationMode ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Queue Track List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 scrollbar-thin">
          {queue.length === 0 ? (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 text-m3-on-surface-variant">
              <div className="relative mb-4">
                <div className="w-16 h-16 rounded-full bg-m3-primary/10 flex items-center justify-center text-m3-primary">
                  <Music2 className="w-8 h-8 opacity-70" />
                </div>
                <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-m3-surface-container-high border border-m3-outline-variant/30 flex items-center justify-center">
                  <ListMusic className="w-3.5 h-3.5 text-m3-on-surface-variant" />
                </span>
              </div>
              <p className="text-sm font-bold text-m3-on-surface">Queue is empty</p>
              <p className="text-xs text-m3-on-surface-variant/80 mt-1 max-w-[220px]">
                Search for songs or play an album to fill up your queue.
              </p>
            </div>
          ) : (
            queue.map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id || idx === queueIndex;
              const isDragging = draggingIndex === idx;
              const isOver = dragOverIndex === idx;
              const isRemoving = removingIndex === idx;

              return (
                <div
                  key={`${track.id}-${idx}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                  className={`group relative flex items-center gap-2.5 p-2.5 rounded-m3-lg transition-all duration-200 select-none ${
                    isRemoving
                      ? 'opacity-0 -translate-x-8 scale-95 duration-200 pointer-events-none'
                      : ''
                  } ${
                    isDragging
                      ? 'opacity-40 scale-[0.98] border border-dashed border-m3-primary/60 bg-m3-primary/5'
                      : ''
                  } ${
                    isOver && !isDragging
                      ? 'border-t-2 border-t-m3-primary shadow-[0_-2px_12px_rgba(59,130,246,0.35)]'
                      : ''
                  } ${
                    isCurrent
                      ? 'bg-gradient-to-r from-m3-primary/20 via-m3-primary-container/35 to-m3-surface-container-high/90 border border-m3-primary/45 shadow-lg shadow-m3-primary/10 text-m3-on-surface'
                      : 'bg-m3-surface-container/45 hover:bg-m3-surface-container-high/80 border border-white/5 hover:border-white/10 text-m3-on-surface hover:shadow-sm'
                  }`}
                >
                  {/* Drag Handle */}
                  <div
                    title="Drag to reorder"
                    className="shrink-0 text-m3-on-surface-variant/30 hover:text-m3-primary active:text-m3-primary cursor-grab active:cursor-grabbing p-0.5 rounded transition-colors"
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                  </div>

                  {/* Track Thumbnail & Play Overlay */}
                  <div
                    onClick={() => {
                      if (isCurrent) {
                        togglePlay();
                      } else {
                        playTrack(track);
                      }
                    }}
                    className={`relative w-11 h-11 rounded-m3-md overflow-hidden shrink-0 cursor-pointer bg-m3-surface-container-highest shadow-sm transition-transform duration-200 group-hover:scale-105 ${
                      isCurrent
                        ? 'ring-2 ring-m3-primary/70 shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                        : ''
                    }`}
                  >
                    <img
                      src={
                        track.thumbnail ||
                        (track.id ? `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg` : '')
                      }
                      alt={track.title}
                      onError={(e) => handleImageError(e, track.id)}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />

                    {/* Hover Play/Pause Overlay */}
                    <div
                      className={`absolute inset-0 bg-black/45 flex items-center justify-center transition-opacity duration-150 ${
                        isCurrent ? 'opacity-0 group-hover:opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {isCurrent && isPlaying ? (
                        <Pause className="w-4 h-4 text-white fill-white" />
                      ) : (
                        <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                      )}
                    </div>
                  </div>

                  {/* Title & Artist & Badges */}
                  <div
                    onClick={() => {
                      if (isCurrent) {
                        togglePlay();
                      } else {
                        playTrack(track);
                      }
                    }}
                    className="flex-1 min-w-0 cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p
                        className={`text-xs font-bold truncate leading-snug ${
                          isCurrent
                            ? 'text-m3-primary dark:text-[#80AEF9]'
                            : 'text-m3-on-surface group-hover:text-m3-primary transition-colors'
                        }`}
                      >
                        {track.title}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-m3-on-surface-variant/80">
                      <span className="truncate max-w-[140px]">{track.artist}</span>
                      <span className="inline-block w-1 h-1 rounded-full bg-m3-on-surface-variant/40 shrink-0" />
                      <span className="font-mono text-[10px] shrink-0 opacity-80">
                        {formatDuration(track.duration, track.durationFormatted)}
                      </span>
                    </div>

                    {/* Glowing Now Playing Badge */}
                    {isCurrent && (
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-m3-primary/15 text-m3-primary border border-m3-primary/35 shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                          <Sparkles className={`w-2.5 h-2.5 ${isPlaying ? 'animate-pulse text-m3-primary' : ''}`} />
                          Now Playing
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Reorder and Remove Controls */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
                    <button
                      onClick={(e) => handleMoveUp(e, idx)}
                      disabled={idx === 0}
                      title="Move up in queue"
                      className="p-1 rounded text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container-highest/80 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={(e) => handleMoveDown(e, idx)}
                      disabled={idx === queue.length - 1}
                      title="Move down in queue"
                      className="p-1 rounded text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container-highest/80 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={(e) => handleRemove(e, idx)}
                      title="Remove from queue"
                      className="p-1 rounded text-m3-on-surface-variant hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Info / Station Status Strip */}
        {queue.length > 0 && (
          <div className="px-5 py-2.5 border-t border-m3-outline-variant/15 bg-m3-surface-container-high/20 dark:bg-white/[0.01] backdrop-blur-md flex items-center justify-between text-[11px] text-m3-on-surface-variant shrink-0">
            <span className="font-mono">
              Position: {Math.min(queueIndex + 1, queue.length)} of {queue.length}
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isStationMode ? 'bg-emerald-400 animate-pulse' : 'bg-m3-outline-variant'
                }`}
              />
              {isStationMode ? 'Station Active' : 'Station Off'}
            </span>
          </div>
        )}
      </aside>
    </div>
  );
};
