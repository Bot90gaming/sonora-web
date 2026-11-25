import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  HardDrive,
  Sparkles,
  Check,
  CheckCircle2,
  Music2,
  FileAudio,
  RefreshCw,
  Volume2,
} from 'lucide-react';
import { Track } from '../types';
import { usePlayer } from '../context/PlayerContext';
import { handleImageError } from '../services/api';

interface DownloadModalProps {
  track: Track | null;
  isOpen: boolean;
  onClose: () => void;
}

type AudioFormatId = 'mp3' | 'm4a' | 'opus' | 'flac' | 'wav';

interface FormatOption {
  id: AudioFormatId;
  name: string;
  badge: string;
  bitrate: string;
  type: string;
  approxSize: string;
  desc: string;
  color: string;
  badgeBg: string;
  recommended?: boolean;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({ track, isOpen, onClose }) => {
  const { addDownload, playTrack } = usePlayer();
  const [selectedFormat, setSelectedFormat] = useState<AudioFormatId>('opus');
  const [filterCategory, setFilterCategory] = useState<'all' | 'popular' | 'audiophile'>('all');
  const [embedLyrics, setEmbedLyrics] = useState(true);
  const [embedCoverArt, setEmbedCoverArt] = useState(true);

  // In-modal live download simulation state
  const [isDownloadingInModal, setIsDownloadingInModal] = useState(false);
  const [downloadStep, setDownloadStep] = useState(0);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadFinished, setDownloadFinished] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDownloadingInModal) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isDownloadingInModal]);

  // Reset modal state when opening with a new track
  useEffect(() => {
    if (isOpen) {
      setIsDownloadingInModal(false);
      setDownloadProgress(0);
      setDownloadStep(0);
      setDownloadFinished(false);
    }
  }, [isOpen, track?.id]);

  if (!isOpen || !track) return null;

  const formats: FormatOption[] = [
    {
      id: 'opus',
      name: 'Opus Audio',
      badge: 'OPUS',
      bitrate: '192 kbps VBR',
      type: 'Modern Next-Gen',
      approxSize: '~4.6 MB',
      desc: 'Transparent music & voice fidelity with minimal file size',
      color: 'text-cyan-400 border-cyan-500/30',
      badgeBg: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
      recommended: true,
    },
    {
      id: 'mp3',
      name: 'MP3 Audio',
      badge: 'MP3',
      bitrate: '320 kbps CBR',
      type: 'Universal Standard',
      approxSize: '~7.8 MB',
      desc: 'Flawless compatibility across car stereos, iPods, and legacy players',
      color: 'text-amber-400 border-amber-500/30',
      badgeBg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    },
    {
      id: 'flac',
      name: 'FLAC Lossless',
      badge: 'FLAC',
      bitrate: 'Lossless 24-bit',
      type: 'Audiophile Studio',
      approxSize: '~34.2 MB',
      desc: 'Bit-perfect studio fidelity with zero compression loss',
      color: 'text-emerald-400 border-emerald-500/30',
      badgeBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    },
    {
      id: 'm4a',
      name: 'M4A (AAC)',
      badge: 'M4A',
      bitrate: '256 kbps AAC',
      type: 'Apple High-Fidelity',
      approxSize: '~6.2 MB',
      desc: 'Apple Music native container with superior high-frequency clarity',
      color: 'text-indigo-400 border-indigo-500/30',
      badgeBg: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    },
    {
      id: 'wav',
      name: 'WAV Master',
      badge: 'WAV',
      bitrate: '1411 kbps PCM',
      type: 'Linear PCM Master',
      approxSize: '~42.5 MB',
      desc: 'Uncompressed raw audio wave stream for studio DAWs and archiving',
      color: 'text-rose-400 border-rose-500/30',
      badgeBg: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    },
  ];

  const filteredFormats = formats.filter((fmt) => {
    if (filterCategory === 'popular') return fmt.id === 'opus' || fmt.id === 'mp3' || fmt.id === 'm4a';
    if (filterCategory === 'audiophile') return fmt.id === 'flac' || fmt.id === 'wav';
    return true;
  });

  const handleStartDownload = () => {
    // Add to global player queue
    addDownload(track, selectedFormat);

    // Also run smooth animated progress in the modal
    setIsDownloadingInModal(true);
    setDownloadStep(1);
    setDownloadProgress(15);

    setTimeout(() => {
      setDownloadStep(2);
      setDownloadProgress(48);
    }, 700);

    setTimeout(() => {
      setDownloadStep(3);
      setDownloadProgress(82);
    }, 1500);

    setTimeout(() => {
      setDownloadStep(4);
      setDownloadProgress(100);
      setDownloadFinished(true);
    }, 2300);
  };

  const stepsDescriptions = [
    '',
    'Connecting to YouTube Music high-bitrate stream...',
    `Demuxing audio with yt-dlp & encoding ${selectedFormat.toUpperCase()}...`,
    'Embedding ID3 tags, synced LRC lyrics & HD album art...',
    'Download finished! Saved to offline storage.',
  ];

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDownloadingInModal) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/65 backdrop-blur-md animate-modal-backdrop"
    >
      <div className="relative w-full max-w-lg rounded-m3-xl bg-gradient-to-b from-m3-surface-container via-m3-surface-container/95 to-m3-surface-container-high/90 border border-m3-outline-variant/30 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.7),0_0_50px_rgba(45,99,187,0.15)] overflow-hidden flex flex-col max-h-[90vh] animate-modal-pop before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-m3-primary/50 before:to-transparent">
        {/* Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-m3-outline-variant/20 shrink-0 bg-m3-surface-container/60 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-m3-md bg-m3-primary/15 flex items-center justify-center text-m3-primary border border-m3-primary/25 shadow-sm">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-m3-on-surface tracking-tight">
                Download Audio
              </h2>
              <p className="text-[11px] text-m3-on-surface-variant">
                Direct offline media extractor powered by yt-dlp
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isDownloadingInModal && !downloadFinished}
            className="p-2 rounded-full text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container-highest transition-all duration-200 active:scale-95 group disabled:opacity-40"
            title="Close (Esc)"
          >
            <X className="w-5 h-5 transition-transform duration-200 group-hover:rotate-90" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 min-h-0">
          {/* Track Summary Card */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-m3-lg bg-m3-surface-container-high/60 border border-m3-outline-variant/20 shadow-sm relative overflow-hidden group">
            <div className="relative w-14 h-14 rounded-m3-md overflow-hidden shrink-0 shadow-md">
              <img
                src={track.thumbnail || (track.id ? `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg` : '')}
                alt={track.title}
                onError={(e) => handleImageError(e, track?.id)}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-m3-on-surface truncate">
                  {track.title}
                </p>
              </div>
              <p className="text-xs text-m3-on-surface-variant truncate mt-0.5">
                {track.artist}
              </p>
              <div className="flex items-center gap-2 mt-1.5 text-[11px] text-m3-on-surface-variant/80 font-mono">
                <span className="px-1.5 py-0.2 rounded bg-m3-surface-container-highest">
                  {track.durationFormatted || '3:30'}
                </span>
                <span>•</span>
                <span>YouTube Music High-Quality</span>
              </div>
            </div>
          </div>

          {/* ACTIVE DOWNLOADING IN-MODAL VIEW */}
          {isDownloadingInModal ? (
            <div className="p-5 rounded-m3-lg bg-m3-surface-container-high/40 border border-m3-outline-variant/30 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {downloadFinished ? (
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-m3-primary/20 text-m3-primary flex items-center justify-center">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-bold text-m3-on-surface">
                      {downloadFinished
                        ? 'Download Ready!'
                        : `Downloading ${selectedFormat.toUpperCase()} Audio`}
                    </p>
                    <p className="text-xs text-m3-on-surface-variant">
                      {stepsDescriptions[downloadStep]}
                    </p>
                  </div>
                </div>

                <span className="text-sm font-mono font-bold text-m3-primary">
                  {downloadProgress}%
                </span>
              </div>

              {/* Progress Bar with Shimmer Animation */}
              <div className="relative w-full h-3 rounded-full bg-m3-surface-container-highest overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-m3-primary via-cyan-400 to-m3-primary rounded-full transition-all duration-500 relative overflow-hidden"
                  style={{ width: `${downloadProgress}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer-sweep" />
                </div>
              </div>

              {/* Download Speed and Metadata Details */}
              <div className="flex items-center justify-between text-xs font-mono text-m3-on-surface-variant">
                <span>Speed: {downloadFinished ? 'Completed' : '4.2 MB/s'}</span>
                <span>
                  Estimated Size:{' '}
                  {formats.find((f) => f.id === selectedFormat)?.approxSize || '~8 MB'}
                </span>
              </div>

              {downloadFinished && (
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => {
                      playTrack(track);
                      onClose();
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-m3-full bg-m3-surface-container-highest hover:bg-m3-surface-variant text-xs font-semibold text-m3-on-surface transition-colors"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-m3-primary" />
                    <span>Play Offline</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsDownloadingInModal(false);
                      setDownloadFinished(false);
                      setDownloadProgress(0);
                    }}
                    className="py-2 px-3 rounded-m3-full bg-m3-surface-container-highest hover:bg-m3-surface-variant text-xs font-semibold text-m3-on-surface-variant transition-colors"
                  >
                    Download Another Format
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Segmented Filter Pills */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant flex items-center gap-1.5">
                    <FileAudio className="w-3.5 h-3.5 text-m3-primary" />
                    Select Audio Quality & Codec
                  </label>

                  {/* Segmented control tabs */}
                  <div className="flex p-0.5 rounded-m3-full bg-m3-surface-container-highest/80 border border-m3-outline-variant/20 text-[11px] font-semibold">
                    <button
                      onClick={() => setFilterCategory('all')}
                      className={`px-2.5 py-0.5 rounded-m3-full transition-all ${
                        filterCategory === 'all'
                          ? 'bg-m3-primary text-m3-on-primary shadow-sm'
                          : 'text-m3-on-surface-variant hover:text-m3-on-surface'
                      }`}
                    >
                      All (5)
                    </button>
                    <button
                      onClick={() => setFilterCategory('popular')}
                      className={`px-2.5 py-0.5 rounded-m3-full transition-all ${
                        filterCategory === 'popular'
                          ? 'bg-m3-primary text-m3-on-primary shadow-sm'
                          : 'text-m3-on-surface-variant hover:text-m3-on-surface'
                      }`}
                    >
                      Popular
                    </button>
                    <button
                      onClick={() => setFilterCategory('audiophile')}
                      className={`px-2.5 py-0.5 rounded-m3-full transition-all ${
                        filterCategory === 'audiophile'
                          ? 'bg-m3-primary text-m3-on-primary shadow-sm'
                          : 'text-m3-on-surface-variant hover:text-m3-on-surface'
                      }`}
                    >
                      Hi-Res
                    </button>
                  </div>
                </div>

                {/* Formats list */}
                <div className="space-y-2">
                  {filteredFormats.map((fmt) => {
                    const isSelected = selectedFormat === fmt.id;
                    return (
                      <div
                        key={fmt.id}
                        onClick={() => setSelectedFormat(fmt.id)}
                        className={`flex items-center justify-between p-3.5 rounded-m3-lg border cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'border-m3-primary bg-m3-primary-container/35 shadow-[0_0_15px_rgba(102,158,248,0.2)] text-m3-on-surface ring-1 ring-m3-primary'
                            : 'border-m3-outline-variant/30 bg-m3-surface-container-high/30 hover:bg-m3-surface-container-high/70 text-m3-on-surface-variant'
                        }`}
                      >
                        <div className="min-w-0 pr-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[11px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-full border ${fmt.badgeBg}`}
                            >
                              {fmt.badge}
                            </span>
                            <span className="text-sm font-bold text-m3-on-surface">
                              {fmt.name}
                            </span>
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-m3-surface-container-highest text-m3-on-surface-variant font-semibold">
                              {fmt.bitrate}
                            </span>
                            {fmt.recommended && (
                              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                                Recommended
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-m3-on-surface-variant/85 mt-1 leading-relaxed">
                            {fmt.desc}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs font-mono font-bold text-m3-on-surface-variant/90">
                            {fmt.approxSize}
                          </span>
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                              isSelected
                                ? 'border-m3-primary bg-m3-primary text-white shadow-sm'
                                : 'border-m3-outline/60'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Toggles for Tagging & Lyrics */}
              <div className="space-y-2 pt-2 border-t border-m3-outline-variant/20">
                <div
                  onClick={() => setEmbedLyrics(!embedLyrics)}
                  className="flex items-center justify-between p-2.5 rounded-m3-md hover:bg-m3-surface-container-high/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Music2 className="w-4 h-4 text-m3-primary" />
                    <div>
                      <span className="text-xs font-semibold text-m3-on-surface">
                        Embed Synced Lyrics (LRC)
                      </span>
                      <p className="text-[11px] text-m3-on-surface-variant">
                        Includes timed lyrics inside the audio tag
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-10 h-5 rounded-full transition-all duration-300 relative ${
                      embedLyrics ? 'bg-m3-primary glow-toggle-active' : 'bg-m3-surface-variant/80'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${
                        embedLyrics ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>

                <div
                  onClick={() => setEmbedCoverArt(!embedCoverArt)}
                  className="flex items-center justify-between p-2.5 rounded-m3-md hover:bg-m3-surface-container-high/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-m3-primary" />
                    <div>
                      <span className="text-xs font-semibold text-m3-on-surface">
                        Embed High-Resolution Album Art
                      </span>
                      <p className="text-[11px] text-m3-on-surface-variant">
                        1000x1000 front cover image embedded into file
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-10 h-5 rounded-full transition-all duration-300 relative ${
                      embedCoverArt ? 'bg-m3-primary glow-toggle-active' : 'bg-m3-surface-variant/80'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${
                        embedCoverArt ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="h-16 px-6 border-t border-m3-outline-variant/20 flex items-center justify-between shrink-0 bg-m3-surface-container/70 backdrop-blur-sm">
          <div className="text-xs text-m3-on-surface-variant flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-m3-primary" />
            <span>Folder: ~/Music/Sonora</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              disabled={isDownloadingInModal && !downloadFinished}
              className="px-4 py-2 rounded-m3-full text-xs sm:text-sm font-semibold text-m3-on-surface-variant hover:bg-m3-surface-container-highest transition-colors disabled:opacity-40"
            >
              {downloadFinished ? 'Close' : 'Cancel'}
            </button>

            {!isDownloadingInModal ? (
              <button
                onClick={handleStartDownload}
                className="flex items-center gap-2 px-5 py-2 rounded-m3-full bg-m3-primary text-m3-on-primary text-xs sm:text-sm font-semibold hover:bg-m3-primary/90 shadow-md shadow-m3-primary/25 active:scale-95 transition-all duration-200"
              >
                <Download className="w-4 h-4" />
                <span>Download {selectedFormat.toUpperCase()}</span>
              </button>
            ) : (
              downloadFinished && (
                <button
                  onClick={onClose}
                  className="px-5 py-2 rounded-m3-full bg-m3-primary text-m3-on-primary text-xs sm:text-sm font-semibold hover:bg-m3-primary/90 shadow-md shadow-m3-primary/25 active:scale-95 transition-all duration-200"
                >
                  Done
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
