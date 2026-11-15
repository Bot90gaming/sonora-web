import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { Track, RepeatMode, DownloadItem, LyricLine } from '../types';
import { api } from '../services/api';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode: RepeatMode;
  isShuffle: boolean;
  queue: Track[];
  queueIndex: number;
  isStationMode: boolean;
  isLyricsOpen: boolean;
  isQueueOpen: boolean;
  lyrics: { syncedLyrics?: string; plainLyrics?: string; lines: LyricLine[] };
  lyricsLoading: boolean;
  likedTracks: Track[];
  downloads: DownloadItem[];
  isLiked: (trackId: string) => boolean;

  // Actions
  playTrack: (track: Track, newQueue?: Track[]) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seekTo: (seconds: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  toggleLike: (track?: Track) => void;
  syncLikedTracks: (tracks: Track[]) => void;
  addToQueue: (track: Track) => void;
  playNextInQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  clearQueue: () => void;
  toggleStationMode: () => void;
  toggleLyrics: (open?: boolean) => void;
  toggleQueue: (open?: boolean) => void;
  addDownload: (track: Track, format?: 'mp3' | 'm4a' | 'opus' | 'flac' | 'wav') => void;
  removeDownload: (id: string) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const initialLyricsOpen = urlParams ? urlParams.get('lyrics') === 'true' : false;
  const initialQueueOpen = urlParams ? urlParams.get('queue') === 'true' : false;
  const initialTime = urlParams && urlParams.get('time') ? parseFloat(urlParams.get('time')!) : (initialLyricsOpen ? 8.5 : 0);
  const initialPlaying = urlParams ? urlParams.get('playing') === 'true' : false;

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(initialPlaying);
  const [currentTime, setCurrentTime] = useState<number>(initialTime);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(0);
  const [isStationMode, setIsStationMode] = useState<boolean>(true);
  const [isLyricsOpen, setIsLyricsOpen] = useState<boolean>(initialLyricsOpen);
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(initialQueueOpen);
  const [lyricsLoading, setLyricsLoading] = useState<boolean>(false);
  const [lyrics, setLyrics] = useState<{ syncedLyrics?: string; plainLyrics?: string; lines: LyricLine[] }>(() => ({
    lines: []
  }));

  // Clean old sample liked IDs on initialization
  const OLD_SAMPLE_LIKED_IDS = new Set(['fJ9rUzIMcZQ', '4NRXx6U8ABQ', 'YQHsXMglC9A', '2Vv-BfVoq4g']);

  // LocalStorage persistence for likes
  const [likedTracks, setLikedTracks] = useState<Track[]>(() => {
    try {
      const saved = localStorage.getItem('sonora_liked_tracks');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((t: Track) => t && t.id && !OLD_SAMPLE_LIKED_IDS.has(t.id));
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  // Downloads persistence
  const [downloads, setDownloads] = useState<DownloadItem[]>(() => {
    try {
      const saved = localStorage.getItem('sonora_downloads');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Player Engine References
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ytPlayerRef = useRef<any>(null);
  const isYtReadyRef = useRef<boolean>(false);
  const pendingVideoIdRef = useRef<string | null>(null);
  const activePlayerRef = useRef<'audio' | 'youtube' | 'simulation'>('simulation');
  const simulationIntervalRef = useRef<number | null>(null);

  // Playback simulation fallback
  const startPlaybackSimulation = useCallback(() => {
    if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);

    simulationIntervalRef.current = window.setInterval(() => {
      setCurrentTime((prev) => {
        const nextTime = prev + 0.05;
        if (duration > 0 && nextTime >= duration) {
          handleTrackEndedRef.current();
          return 0;
        }
        return nextTime;
      });
    }, 50);
  }, [duration]);

  const stopPlaybackSimulation = useCallback(() => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
  }, []);

  const startSimRef = useRef(startPlaybackSimulation);
  const stopSimRef = useRef(stopPlaybackSimulation);
  useEffect(() => {
    startSimRef.current = startPlaybackSimulation;
    stopSimRef.current = stopPlaybackSimulation;
  }, [startPlaybackSimulation, stopPlaybackSimulation]);

  // Forward ref for track ended handler
  const handleTrackEndedRef = useRef<() => void>(() => {});

  // Initialize HTML5 Audio instance for SoundCloud / local streams
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audioRef.current = audio;

    const onPlay = () => {
      if (activePlayerRef.current === 'audio') {
        setIsPlaying(true);
        stopSimRef.current();
      }
    };
    const onPause = () => {
      if (activePlayerRef.current === 'audio') {
        setIsPlaying(false);
      }
    };
    const onTimeUpdate = () => {
      if (activePlayerRef.current === 'audio' && audio.currentTime !== undefined && !isNaN(audio.currentTime)) {
        setCurrentTime(audio.currentTime);
      }
    };
    const onLoadedMetadata = () => {
      if (activePlayerRef.current === 'audio' && audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const onEnded = () => {
      if (activePlayerRef.current === 'audio') {
        handleTrackEndedRef.current();
      }
    };
    const onError = () => {
      if (activePlayerRef.current === 'audio') {
        startSimRef.current();
      }
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.pause();
    };
  }, []);

  // Initialize YouTube IFrame Player
  useEffect(() => {
    let checkInterval: number | null = null;

    const initYT = () => {
      if (!window.YT || !window.YT.Player) return false;
      const iframeTarget = document.getElementById('sonora-yt-iframe');
      if (!iframeTarget) return false;
      if (ytPlayerRef.current) return true;

      try {
        ytPlayerRef.current = new window.YT.Player('sonora-yt-iframe', {
          height: '1',
          width: '1',
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            rel: 0,
            playsinline: 1,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: any) => {
              isYtReadyRef.current = true;
              event.target.setVolume(Math.round(volume * 100));
              if (isMuted) event.target.mute();

              if (pendingVideoIdRef.current) {
                const vid = pendingVideoIdRef.current;
                pendingVideoIdRef.current = null;
                try {
                  event.target.loadVideoById(vid);
                  event.target.playVideo();
                  setIsPlaying(true);
                  stopSimRef.current();
                } catch (e) {
                  console.warn('Deferred YT play failed:', e);
                }
              }
            },
            onStateChange: (event: any) => {
              if (!window.YT) return;
              if (activePlayerRef.current !== 'youtube') return;

              if (event.data === window.YT.PlayerState.PLAYING) {
                setIsPlaying(true);
                stopSimRef.current();
              } else if (event.data === window.YT.PlayerState.PAUSED) {
                setIsPlaying(false);
              } else if (event.data === window.YT.PlayerState.ENDED) {
                handleTrackEndedRef.current();
              }
            },
            onError: (err: any) => {
              console.warn('YouTube Player error code:', err.data);
              // Video restricted / embed blocked -> fallback to simulation
              startSimRef.current();
            },
          },
        });
        return true;
      } catch (err) {
        console.warn('Failed to construct YT.Player:', err);
        return false;
      }
    };

    if (window.YT && window.YT.Player) {
      initYT();
    } else {
      if (!document.getElementById('yt-iframe-api-script')) {
        const tag = document.createElement('script');
        tag.id = 'yt-iframe-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScript = document.getElementsByTagName('script')[0];
        firstScript?.parentNode?.insertBefore(tag, firstScript);
      }

      const prevReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevReady) prevReady();
        initYT();
      };

      checkInterval = window.setInterval(() => {
        if (window.YT && window.YT.Player) {
          if (initYT() && checkInterval) {
            clearInterval(checkInterval);
            checkInterval = null;
          }
        }
      }, 300);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [volume, isMuted]);

  // Save liked tracks
  useEffect(() => {
    try {
      localStorage.setItem('sonora_liked_tracks', JSON.stringify(likedTracks));
    } catch {
      // ignore
    }
  }, [likedTracks]);

  // Save downloads
  useEffect(() => {
    try {
      localStorage.setItem('sonora_downloads', JSON.stringify(downloads));
    } catch {
      // ignore
    }
  }, [downloads]);

  // Load lyrics whenever current track changes
  useEffect(() => {
    if (!currentTrack) return;
    let isCancelled = false;

    const loadLyrics = async () => {
      setLyricsLoading(true);
      try {
        const result = await api.getLyrics(
          currentTrack.title || '',
          currentTrack.artist || '',
          currentTrack.duration,
          currentTrack.id
        );
        if (!isCancelled) {
          setLyrics(result);
        }
      } catch (err) {
        console.error('Error fetching lyrics:', err);
      } finally {
        if (!isCancelled) {
          setLyricsLoading(false);
        }
      }
    };

    loadLyrics();
    return () => {
      isCancelled = true;
    };
  }, [currentTrack]);

  // High-frequency animation frame / timer sync for smooth continuous lyric & progress tracking
  useEffect(() => {
    if (!isPlaying) return;

    let animId: number;
    let timerId: number | null = null;

    const syncTime = () => {
      if (activePlayerRef.current === 'youtube' && ytPlayerRef.current && isYtReadyRef.current) {
        try {
          const cur = ytPlayerRef.current.getCurrentTime();
          if (typeof cur === 'number' && !isNaN(cur) && cur >= 0) {
            setCurrentTime(cur);
          }
          const dur = ytPlayerRef.current.getDuration();
          if (typeof dur === 'number' && !isNaN(dur) && isFinite(dur) && dur > 0) {
            setDuration(dur);
          }
        } catch {
          // ignore
        }
      } else if (activePlayerRef.current === 'audio' && audioRef.current && !audioRef.current.paused) {
        const cur = audioRef.current.currentTime;
        if (cur !== undefined && !isNaN(cur)) {
          setCurrentTime(cur);
        }
      }
      animId = requestAnimationFrame(syncTime);
    };

    animId = requestAnimationFrame(syncTime);

    // Fallback high-frequency interval for backgrounded / blurred tab
    timerId = window.setInterval(() => {
      if (activePlayerRef.current === 'youtube' && ytPlayerRef.current && isYtReadyRef.current) {
        try {
          const cur = ytPlayerRef.current.getCurrentTime();
          if (typeof cur === 'number' && !isNaN(cur) && cur >= 0) {
            setCurrentTime(cur);
          }
        } catch {
          // ignore
        }
      } else if (activePlayerRef.current === 'audio' && audioRef.current && !audioRef.current.paused) {
        const cur = audioRef.current.currentTime;
        if (cur !== undefined && !isNaN(cur)) {
          setCurrentTime(cur);
        }
      }
    }, 50);

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (timerId) clearInterval(timerId);
    };
  }, [isPlaying]);

  // Volume & mute synchronization across both audio engines
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
    if (ytPlayerRef.current && isYtReadyRef.current) {
      try {
        if (isMuted || volume === 0) {
          ytPlayerRef.current.mute();
        } else {
          ytPlayerRef.current.unMute();
          ytPlayerRef.current.setVolume(Math.round(volume * 100));
        }
      } catch {
        // ignore
      }
    }
  }, [volume, isMuted]);

  // Unified Play Track implementation
  const playTrack = useCallback((track: Track, newQueue?: Track[]) => {
    setCurrentTrack(track);
    setCurrentTime(0);
    setDuration(track.duration || 210);

    if (newQueue) {
      setQueue(newQueue);
      const index = newQueue.findIndex((t) => t.id === track.id);
      setQueueIndex(index !== -1 ? index : 0);
    } else {
      setQueue((prevQueue) => {
        const existsIndex = prevQueue.findIndex((t) => t.id === track.id);
        if (existsIndex !== -1) {
          setQueueIndex(existsIndex);
          return prevQueue;
        }
        setQueueIndex(prevQueue.length);
        return [...prevQueue, track];
      });
    }

    const isSoundCloud = track.source === 'soundcloud' || track.id.startsWith('sc_');

    if (isSoundCloud) {
      activePlayerRef.current = 'audio';
      stopPlaybackSimulation();

      // Pause YouTube player if running
      if (ytPlayerRef.current && isYtReadyRef.current) {
        try {
          ytPlayerRef.current.pauseVideo();
        } catch {
          // ignore
        }
      }

      if (audioRef.current) {
        audioRef.current.src = api.getStreamUrl(track.id);
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch((err) => {
          console.warn('Audio play error:', err);
          setIsPlaying(true);
          startPlaybackSimulation();
        });
      } else {
        setIsPlaying(true);
        startPlaybackSimulation();
      }
    } else {
      // YouTube / YouTube Music Track -> Embedded YouTube IFrame Engine
      activePlayerRef.current = 'youtube';
      stopPlaybackSimulation();

      // Pause HTML5 audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }

      if (ytPlayerRef.current && isYtReadyRef.current) {
        try {
          ytPlayerRef.current.loadVideoById(track.id);
          ytPlayerRef.current.playVideo();
          setIsPlaying(true);
        } catch (err) {
          console.warn('YouTube load error:', err);
          setIsPlaying(true);
          startPlaybackSimulation();
        }
      } else {
        pendingVideoIdRef.current = track.id;
        setIsPlaying(true);
      }
    }
  }, [startPlaybackSimulation, stopPlaybackSimulation]);

  const togglePlay = useCallback(() => {
    if (!currentTrack && queue.length > 0) {
      playTrack(queue[0]);
      return;
    }
    if (!currentTrack) return;

    if (isPlaying) {
      if (activePlayerRef.current === 'youtube' && ytPlayerRef.current && isYtReadyRef.current) {
        try {
          ytPlayerRef.current.pauseVideo();
        } catch {
          // ignore
        }
      } else if (audioRef.current) {
        audioRef.current.pause();
      }
      stopPlaybackSimulation();
      setIsPlaying(false);
    } else {
      if (activePlayerRef.current === 'youtube' && ytPlayerRef.current && isYtReadyRef.current) {
        try {
          ytPlayerRef.current.playVideo();
          setIsPlaying(true);
          stopPlaybackSimulation();
        } catch {
          setIsPlaying(true);
          startPlaybackSimulation();
        }
      } else if (audioRef.current && audioRef.current.src) {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
          stopPlaybackSimulation();
        }).catch(() => {
          setIsPlaying(true);
          startPlaybackSimulation();
        });
      } else {
        setIsPlaying(true);
        startPlaybackSimulation();
      }
    }
  }, [currentTrack, queue, isPlaying, playTrack, startPlaybackSimulation, stopPlaybackSimulation]);

  const seekTo = useCallback((seconds: number) => {
    setCurrentTime(seconds);
    if (activePlayerRef.current === 'youtube' && ytPlayerRef.current && isYtReadyRef.current) {
      try {
        ytPlayerRef.current.seekTo(seconds, true);
      } catch {
        // ignore
      }
    } else if (audioRef.current) {
      try {
        audioRef.current.currentTime = seconds;
      } catch {
        // ignore
      }
    }
  }, []);

  const nextTrack = useCallback(() => {
    if (queue.length === 0) return;

    if (repeatMode === 'one') {
      seekTo(0);
      if (activePlayerRef.current === 'youtube' && ytPlayerRef.current && isYtReadyRef.current) {
        try {
          ytPlayerRef.current.playVideo();
        } catch {
          // ignore
        }
      } else if (audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
      setIsPlaying(true);
      return;
    }

    let nextIndex: number;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else {
      nextIndex = queueIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeatMode === 'all') {
          nextIndex = 0;
        } else {
          setIsPlaying(false);
          stopPlaybackSimulation();
          return;
        }
      }
    }

    setQueueIndex(nextIndex);
    playTrack(queue[nextIndex]);

    // Check if station mode needs to auto-fetch next tracks
    if (isStationMode && nextIndex >= queue.length - 2 && queue[nextIndex]) {
      api.getStation(queue[nextIndex].id).then((moreTracks) => {
        if (moreTracks.length > 0) {
          setQueue((q) => {
            const existingIds = new Set(q.map((t) => t.id));
            const newTracks = moreTracks.filter((t) => !existingIds.has(t.id));
            return [...q, ...newTracks];
          });
        }
      });
    }
  }, [queue, queueIndex, repeatMode, isShuffle, isStationMode, playTrack, seekTo, stopPlaybackSimulation]);

  const prevTrack = useCallback(() => {
    if (currentTime > 3) {
      seekTo(0);
      return;
    }

    if (queue.length === 0) return;
    const prevIndex = queueIndex > 0 ? queueIndex - 1 : queue.length - 1;
    setQueueIndex(prevIndex);
    playTrack(queue[prevIndex]);
  }, [currentTime, queue, queueIndex, playTrack, seekTo]);

  const handleTrackEnded = useCallback(() => {
    if (repeatMode === 'one') {
      seekTo(0);
      if (activePlayerRef.current === 'youtube' && ytPlayerRef.current && isYtReadyRef.current) {
        try {
          ytPlayerRef.current.playVideo();
        } catch {
          // ignore
        }
      } else if (audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
      setIsPlaying(true);
    } else {
      nextTrack();
    }
  }, [repeatMode, nextTrack, seekTo]);

  useEffect(() => {
    handleTrackEndedRef.current = handleTrackEnded;
  }, [handleTrackEnded]);

  const setVolume = useCallback((val: number) => {
    setVolumeState(Math.max(0, Math.min(1, val)));
    if (val > 0) setIsMuted(false);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffle((prev) => !prev);
  }, []);

  const cycleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  const isLiked = useCallback((trackId: string) => {
    return likedTracks.some((t) => t.id === trackId);
  }, [likedTracks]);

  const toggleLike = useCallback((track?: Track) => {
    const target = track || currentTrack;
    if (!target) return;

    setLikedTracks((prev) => {
      const exists = prev.some((t) => t.id === target.id);
      if (exists) {
        return prev.filter((t) => t.id !== target.id);
      } else {
        return [...prev, { ...target, isLiked: true }];
      }
    });
  }, [currentTrack]);

  const syncLikedTracks = useCallback((incoming: Track[]) => {
    setLikedTracks((prev) => {
      const existingIds = new Set(prev.map((t) => t.id));
      const newItems = incoming.filter((t) => !existingIds.has(t.id));
      return [...prev, ...newItems];
    });
  }, []);

  const addToQueue = useCallback((track: Track) => {
    setQueue((prev) => [...prev, track]);
  }, []);

  const playNextInQueue = useCallback((track: Track) => {
    setQueue((prev) => {
      const copy = [...prev];
      copy.splice(queueIndex + 1, 0, track);
      return copy;
    });
  }, [queueIndex]);

  const removeFromQueue = useCallback((index: number) => {
    setQueue((prev) => {
      const copy = prev.filter((_, i) => i !== index);
      if (index === queueIndex && copy.length > 0) {
        playTrack(copy[Math.min(index, copy.length - 1)]);
      } else if (index < queueIndex) {
        setQueueIndex((i) => i - 1);
      }
      return copy;
    });
  }, [queueIndex, playTrack]);

  const reorderQueue = useCallback((fromIndex: number, toIndex: number) => {
    setQueue((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);
      return copy;
    });
  }, []);

  const clearQueue = useCallback(() => {
    if (currentTrack) {
      setQueue([currentTrack]);
      setQueueIndex(0);
    } else {
      setQueue([]);
      setQueueIndex(0);
    }
  }, [currentTrack]);

  const toggleStationMode = useCallback(() => {
    setIsStationMode((prev) => !prev);
  }, []);

  const toggleLyrics = useCallback((open?: boolean) => {
    setIsLyricsOpen((prev) => (open !== undefined ? open : !prev));
  }, []);

  const toggleQueue = useCallback((open?: boolean) => {
    setIsQueueOpen((prev) => (open !== undefined ? open : !prev));
  }, []);

  const addDownload = useCallback((track: Track, format: 'mp3' | 'm4a' | 'opus' | 'flac' | 'wav' = 'mp3') => {
    const newDownload: DownloadItem = {
      id: `${track.id}-${Date.now()}`,
      track,
      format,
      status: 'downloading',
      progress: 10,
      timestamp: Date.now(),
      fileSize: '7.8 MB',
      speed: '3.2 MB/s'
    };

    setDownloads((prev) => [newDownload, ...prev]);

    // Request to backend
    api.requestDownload(track, format).catch(console.error);

    // Simulate progress updates
    let currentProg = 10;
    const interval = setInterval(() => {
      currentProg += Math.floor(Math.random() * 25) + 15;
      if (currentProg >= 100) {
        clearInterval(interval);
        setDownloads((prev) =>
          prev.map((item) =>
            item.id === newDownload.id
              ? { ...item, status: 'completed', progress: 100, downloadUrl: `/api/stream/${track.id}` }
              : item
          )
        );
      } else {
        setDownloads((prev) =>
          prev.map((item) =>
            item.id === newDownload.id ? { ...item, progress: currentProg } : item
          )
        );
      }
    }, 600);
  }, []);

  const removeDownload = useCallback((id: string) => {
    setDownloads((prev) => prev.filter((d) => d.id !== id));
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        repeatMode,
        isShuffle,
        queue,
        queueIndex,
        isStationMode,
        isLyricsOpen,
        isQueueOpen,
        lyrics,
        lyricsLoading,
        likedTracks,
        downloads,
        isLiked,
        playTrack,
        togglePlay,
        nextTrack,
        prevTrack,
        seekTo,
        setVolume,
        toggleMute,
        toggleShuffle,
        cycleRepeat,
        toggleLike,
        syncLikedTracks,
        addToQueue,
        playNextInQueue,
        removeFromQueue,
        reorderQueue,
        clearQueue,
        toggleStationMode,
        toggleLyrics,
        toggleQueue,
        addDownload,
        removeDownload,
      }}
    >
      {children}
      {/* Invisible YouTube IFrame Player Container (renders off-screen without interfering with layout) */}
      <div
        id="sonora-yt-player-host"
        aria-hidden="true"
        style={{
          position: 'fixed',
          bottom: 0,
          right: 0,
          width: 1,
          height: 1,
          opacity: 0.001,
          pointerEvents: 'none',
          zIndex: -9999,
          overflow: 'hidden',
        }}
        dangerouslySetInnerHTML={{ __html: '<div id="sonora-yt-iframe"></div>' }}
      />
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
