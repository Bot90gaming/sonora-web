import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { PlayerBar } from './components/PlayerBar';
import { LyricsView } from './components/LyricsView';
import { QueueDrawer } from './components/QueueDrawer';
import { SettingsModal } from './components/SettingsModal';
import { DownloadModal } from './components/DownloadModal';
import { OpeningAnimation } from './components/OpeningAnimation';

import { HomeView } from './views/HomeView';
import { SearchView } from './views/SearchView';
import { DetailView } from './views/DetailView';
import { LibraryView } from './views/LibraryView';
import { DownloadsView } from './views/DownloadsView';

import { usePlayer } from './context/PlayerContext';
import { Album, Playlist, Track } from './types';
import { SAMPLE_PLAYLISTS, handleImageError } from './services/api';

export const App: React.FC = () => {
  const { isLyricsOpen, isQueueOpen, currentTrack } = usePlayer();
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const initialTab = (urlParams?.get('tab') as NavTab) || 'home';
  const initialQuery = urlParams?.get('q') || '';
  const initialSettings = urlParams?.get('settings') === 'true';

  const [currentTab, setCurrentTab] = useState<NavTab>(initialTab);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedDetail, setSelectedDetail] = useState<{
    item: Album | Playlist;
    type: 'album' | 'playlist';
  } | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(initialSettings);
  const [downloadModalTrack, setDownloadModalTrack] = useState<Track | null>(null);

  // Cinematic opening animation control
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('opening') === 'freeze' || params.get('freeze') === 'true') return true;
      if (
        params.get('nointro') === 'true' ||
        params.get('tab') ||
        params.get('lyrics') ||
        params.get('queue') ||
        params.get('settings') ||
        params.get('theme')
      ) {
        return false;
      }
    }
    return true;
  });

  // Global handle for developer/automated screenshot testing to replay intro anytime
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as unknown as { __replayIntro: () => void }).__replayIntro = () => setShowIntro(true);
    }
  }, []);

  const handleSelectTab = (tab: NavTab) => {
    setSelectedDetail(null);
    setCurrentTab(tab);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSelectedDetail(null);
    setCurrentTab('search');
  };

  const handleSelectAlbum = (album: Album) => {
    setSelectedDetail({ item: album, type: 'album' });
  };

  const handleSelectPlaylist = (playlist: Playlist) => {
    setSelectedDetail({ item: playlist, type: 'playlist' });
  };

  const handleOpenDownload = (track: Track) => {
    setDownloadModalTrack(track);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-m3-surface text-m3-on-surface relative">
      {/* Cinematic Opening Animation on Launch */}
      {showIntro && (
        <OpeningAnimation onComplete={() => setShowIntro(false)} />
      )}

      {/* Sidebar NavRail */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {/* Header Bar */}
        <Header
          onSearch={handleSearch}
          onOpenSettings={() => setIsSettingsOpen(true)}
          searchQuery={searchQuery}
        />

        {/* View Router with Smooth Page Transitions */}
        <main className="flex-1 overflow-y-auto relative scrollbar-thin">
          <div
            key={selectedDetail ? `${selectedDetail.type}-${selectedDetail.item.id}` : currentTab}
            className="animate-view-fade-in min-h-full"
          >
            {selectedDetail ? (
              <DetailView
                item={selectedDetail.item}
                type={selectedDetail.type}
                onBack={() => setSelectedDetail(null)}
                onOpenDownload={handleOpenDownload}
              />
            ) : currentTab === 'home' ? (
              <HomeView
                onSelectAlbum={handleSelectAlbum}
                onSelectPlaylist={handleSelectPlaylist}
                onOpenDownload={handleOpenDownload}
              />
            ) : currentTab === 'search' ? (
              <SearchView
                initialQuery={searchQuery}
                onSelectAlbum={handleSelectAlbum}
                onSelectPlaylist={handleSelectPlaylist}
                onOpenDownload={handleOpenDownload}
              />
            ) : currentTab === 'library' || currentTab === 'liked' ? (
              <LibraryView
                onSelectAlbum={handleSelectAlbum}
                onSelectPlaylist={handleSelectPlaylist}
                onOpenDownload={handleOpenDownload}
              />
            ) : currentTab === 'playlists' ? (
              <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto pb-16">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-m3-on-surface tracking-tight">
                  Playlists & Mixes
                </h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {SAMPLE_PLAYLISTS.map((playlist) => (
                    <div
                      key={playlist.id}
                      onClick={() => handleSelectPlaylist(playlist)}
                      className="group p-4 rounded-m3-lg bg-m3-surface-container/60 hover:bg-m3-surface-container border border-m3-outline-variant/20 hover:border-m3-primary/30 card-hover-elevate cursor-pointer flex flex-col space-y-3"
                    >
                      <div className="relative aspect-square w-full rounded-m3-md overflow-hidden bg-m3-surface-container-high shadow-md">
                        <img
                          src={playlist.thumbnail}
                          alt={playlist.title}
                          onError={(e) => handleImageError(e, playlist.tracks?.[0]?.id)}
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
              </div>
            ) : currentTab === 'downloads' ? (
              <DownloadsView />
            ) : null}
          </div>
        </main>

        {/* Persistent Bottom Player Bar */}
        <PlayerBar
          onOpenDownloadModal={() => {
            if (currentTrack) setDownloadModalTrack(currentTrack);
          }}
        />
      </div>

      {/* Synchronized Lyrics Overlay View with smooth transition */}
      {isLyricsOpen && <LyricsView />}

      {/* Playback Queue Drawer with smooth slide transition */}
      {isQueueOpen && <QueueDrawer />}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Download Audio Modal */}
      <DownloadModal
        track={downloadModalTrack}
        isOpen={!!downloadModalTrack}
        onClose={() => setDownloadModalTrack(null)}
      />
    </div>
  );
};
