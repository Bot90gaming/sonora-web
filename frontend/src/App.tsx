import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { PlayerBar } from './components/PlayerBar';
import { LyricsView } from './components/LyricsView';
import { QueueDrawer } from './components/QueueDrawer';
import { SettingsModal } from './components/SettingsModal';
import { DownloadModal } from './components/DownloadModal';
import { YouTubeAuthModal } from './components/YouTubeAuthModal';
import { OpeningAnimation } from './components/OpeningAnimation';

import { HomeView } from './views/HomeView';
import { SearchView } from './views/SearchView';
import { DetailView } from './views/DetailView';
import { LibraryView } from './views/LibraryView';
import { PlaylistsView } from './views/PlaylistsView';
import { DownloadsView } from './views/DownloadsView';

import { usePlayer } from './context/PlayerContext';
import { Album, Playlist, Track, AuthStatus } from './types';
import { api } from './services/api';
import { useDeviceDetect } from './utils/device';
import { MobileApp } from './MobileApp';

export const App: React.FC = () => {
  const { isLyricsOpen, isQueueOpen, currentTrack } = usePlayer();
  const { isMobile, preference, setMode } = useDeviceDetect();
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
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    authenticated: false,
    authType: 'none',
    canGoogleSignIn: false,
  });

  const checkAuth = useCallback(async () => {
    try {
      const status = await api.getAuthStatus();
      setAuthStatus(status);
    } catch {
      // offline
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

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

  if (isMobile) {
    return (
      <div className="min-h-screen w-screen overflow-x-hidden bg-m3-surface text-m3-on-surface relative">
        {/* Cinematic Opening Animation on Launch */}
        {showIntro && (
          <OpeningAnimation onComplete={() => setShowIntro(false)} />
        )}
        <MobileApp
          currentTab={currentTab}
          onTabChange={handleSelectTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedDetail={selectedDetail}
          onSelectDetail={setSelectedDetail}
          authStatus={authStatus}
          onCheckAuth={checkAuth}
          deviceMode={preference}
          onSetDeviceMode={setMode}
        />
      </div>
    );
  }

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
        onOpenAuth={() => setIsAuthModalOpen(true)}
        authStatus={authStatus}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {/* Header Bar */}
        <Header
          onSearch={handleSearch}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onReload={() => window.location.reload()}
          authStatus={authStatus}
          searchQuery={searchQuery}
          onToggleMobileMode={() => setMode('mobile')}
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
                onOpenAuth={() => setIsAuthModalOpen(true)}
                authStatus={authStatus}
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
                onOpenDownload={handleOpenDownload}
                onSelectAlbum={handleSelectAlbum}
                onSelectPlaylist={handleSelectPlaylist}
                onOpenAuth={() => setIsAuthModalOpen(true)}
                authStatus={authStatus}
              />
            ) : currentTab === 'playlists' ? (
              <PlaylistsView
                onSelectPlaylist={handleSelectPlaylist}
                onOpenAuth={() => setIsAuthModalOpen(true)}
                authStatus={authStatus}
              />
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
        onOpenAuth={() => {
          setIsSettingsOpen(false);
          setIsAuthModalOpen(true);
        }}
        authStatus={authStatus}
      />

      {/* Download Audio Modal */}
      <DownloadModal
        track={downloadModalTrack}
        isOpen={!!downloadModalTrack}
        onClose={() => setDownloadModalTrack(null)}
      />

      {/* YouTube Music Authentication Modal */}
      <YouTubeAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthChange={checkAuth}
      />
    </div>
  );
};
