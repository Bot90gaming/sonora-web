import React from 'react';
import { Download, CheckCircle2, Play, Trash2, HardDrive, RefreshCw } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { handleImageError } from '../services/api';

export const DownloadsView: React.FC = () => {
  const { downloads, removeDownload, playTrack } = usePlayer();

  const activeDownloads = downloads.filter((d) => d.status === 'downloading' || d.status === 'pending');
  const completedDownloads = downloads.filter((d) => d.status === 'completed');

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-m3-outline-variant/20 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-m3-on-surface tracking-tight flex items-center gap-3">
            <Download className="w-7 h-7 text-m3-primary" />
            <span>Download Manager</span>
          </h1>
          <p className="text-xs sm:text-sm text-m3-on-surface-variant mt-1">
            Offline media library powered by yt-dlp & FFmpeg engine
          </p>
        </div>
      </div>

      {/* Active In-Progress Downloads */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-m3-on-surface flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 text-m3-primary ${activeDownloads.length > 0 ? 'animate-spin' : ''}`} />
          <span>Active Downloads ({activeDownloads.length})</span>
        </h2>

        {activeDownloads.length === 0 ? (
          <div className="p-6 rounded-m3-lg bg-m3-surface-container/30 border border-m3-outline-variant/20 text-xs text-m3-on-surface-variant text-center">
            No active downloads in progress. Click the download icon on any track to download offline audio.
          </div>
        ) : (
          <div className="space-y-3">
            {activeDownloads.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-m3-lg bg-m3-surface-container border border-m3-outline-variant/30 space-y-3 shadow-sm"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.track.thumbnail || (item.track.id ? `https://i.ytimg.com/vi/${item.track.id}/hqdefault.jpg` : '')}
                      alt={item.track.title}
                      onError={(e) => handleImageError(e, item.track?.id)}
                      className="w-10 h-10 rounded-m3-xs object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-m3-on-surface truncate">{item.track.title}</p>
                      <p className="text-xs text-m3-on-surface-variant truncate">
                        {item.track.artist} • <span className="font-mono uppercase">{item.format}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-mono font-bold text-m3-primary">
                      {item.progress}%
                    </span>
                    <button
                      onClick={() => removeDownload(item.id)}
                      className="p-1.5 rounded-full text-m3-on-surface-variant hover:text-rose-500 hover:bg-m3-surface-container-high"
                      title="Cancel download"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-m3-surface-container-highest overflow-hidden">
                  <div
                    className="h-full bg-m3-primary transition-all duration-300 rounded-full"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-m3-on-surface-variant font-mono">
                  <span>Speed: {item.speed || '2.4 MB/s'}</span>
                  <span>Size: {item.fileSize || '8.2 MB'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Completed Downloads */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-m3-on-surface flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Completed ({completedDownloads.length})</span>
        </h2>

        {completedDownloads.length === 0 ? (
          <div className="p-12 text-center rounded-m3-xl bg-m3-surface-container/20 border border-m3-outline-variant/15 flex flex-col items-center justify-center gap-2 text-m3-on-surface-variant">
            <HardDrive className="w-10 h-10 opacity-30" />
            <p className="text-sm font-semibold">No downloaded songs yet</p>
            <p className="text-xs opacity-70">Downloaded tracks can be played without an active internet connection</p>
          </div>
        ) : (
          <div className="divide-y divide-m3-outline-variant/15 rounded-m3-lg bg-m3-surface-container/40 border border-m3-outline-variant/20 overflow-hidden">
            {completedDownloads.map((item) => (
              <div
                key={item.id}
                className="group flex items-center justify-between p-3.5 hover:bg-m3-surface-container-high transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    onClick={() => playTrack(item.track)}
                    className="relative w-11 h-11 rounded-m3-xs overflow-hidden shrink-0 cursor-pointer bg-m3-surface-container-highest"
                  >
                    <img
                      src={item.track.thumbnail || (item.track.id ? `https://i.ytimg.com/vi/${item.track.id}/hqdefault.jpg` : '')}
                      alt={item.track.title}
                      onError={(e) => handleImageError(e, item.track?.id)}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                    </div>
                  </div>

                  <div
                    onClick={() => playTrack(item.track)}
                    className="min-w-0 cursor-pointer"
                  >
                    <p className="text-sm font-bold text-m3-on-surface truncate group-hover:text-m3-primary transition-colors">
                      {item.track.title}
                    </p>
                    <p className="text-xs text-m3-on-surface-variant truncate">
                      {item.track.artist} • <span className="font-mono uppercase font-bold text-emerald-500">{item.format}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-m3-on-surface-variant/70 mr-2">
                    {item.fileSize || '7.5 MB'}
                  </span>
                  <button
                    onClick={() => playTrack(item.track)}
                    className="p-2 rounded-full text-m3-primary hover:bg-m3-surface-container transition-colors"
                    title="Play downloaded audio"
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </button>
                  <button
                    onClick={() => removeDownload(item.id)}
                    className="p-2 rounded-full text-m3-on-surface-variant hover:text-rose-500 hover:bg-m3-surface-container transition-colors"
                    title="Delete downloaded file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
