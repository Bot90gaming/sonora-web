import React, { useState } from 'react';
import { NavTab } from './components/Sidebar';
import { MobileHeader } from './components/mobile/MobileHeader';
import { MobileNavigation } from './components/mobile/MobileNavigation';
import { MobileMiniPlayer } from './components/mobile/MobileMiniPlayer';
import { MobileNowPlaying } from './components/mobile/MobileNowPlaying';
import { MobileLyricsSheet } from './components/mobile/MobileLyricsSheet';
import { MobileQueueSheet } from './components/mobile/MobileQueueSheet';
import { SettingsModal } from './components/SettingsModal';
import { DownloadModal } from './components/DownloadModal';
import { YouTubeAuthModal } from './components/YouTubeAuthModal';

import { HomeView } from './views/HomeView';
import { SearchView } from './views/SearchView';
import { DetailView } from './views/DetailView';
import { LibraryView } from './views/LibraryView';
import { PlaylistsView } from './views/PlaylistsView';
import { DownloadsView } from './views/DownloadsView';

import { usePlayer } from './context/PlayerContext';
import { Album, Playlist, Track, AuthStatus } from './types';
import { DeviceMode } from './utils/device';

interface MobileAppProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedDetail: { item: Album | Playlist; type: 'album' | 'playlist' } | null;
  onSelectDetail: (detail: { item: Album | Playlist; type: 'album' | 'playlist' } | null) => void;
  authStatus: AuthStatus;
  onCheckAuth: () => void;
  deviceMode: DeviceMode;
  onSetDeviceMode: (mode: DeviceMode) => void;
}

export const MobileApp: React.FC<MobileAppProps> = ({
  currentTab,
  onTabChange,
  searchQuery,
  onSearchChange: _onSearchChange,
  selectedDetail,
  onSelectDetail,
  authStatus,
  onCheckAuth,
  deviceMode,
  onSetDeviceMode,
}) => {
  const { currentTrack } = usePlayer();

  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(false);
  const [isLyricsSheetOpen, setIsLyricsSheetOpen] = useState(false);
  const [isQueueSheetOpen, setIsQueueSheetOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [downloadModalTrack, setDownloadModalTrack] = useState<Track | null>(null);
  const [isReloading, setIsReloading] = useState(false);

  const handleReload = () => {
    setIsReloading(true);
    setTimeout(() => {
      window.location.reload();
    }, 250);
  };

  const handleSelectAlbum = (album: Album) => {
    onSelectDetail({ item: album, type: 'album' });
  };

  const handleSelectPlaylist = (playlist: Playlist) => {
    onSelectDetail({ item: playlist, type: 'playlist' });
  };

  const toggleDeviceMode = () => {
    onSetDeviceMode('desktop');
  };

  return (
    <div className="flex flex-col min-h-screen bg-m3-surface text-m3-on-surface select-none pb-[calc(120px+env(safe-area-inset-bottom,0px))]">
      {/* Mobile Top App Bar */}
      <MobileHeader
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        authStatus={authStatus}
        onReload={handleReload}
        isReloading={isReloading}
        deviceMode={deviceMode}
        onToggleDeviceMode={toggleDeviceMode}
      />

      {/* Main Screen Content */}
      <main className="flex-1 min-h-0 overflow-y-auto">
        {selectedDetail ? (
          <DetailView
            item={selectedDetail.item}
            type={selectedDetail.type}
            onBack={() => onSelectDetail(null)}
            onOpenDownload={(track) => setDownloadModalTrack(track)}
          />
        ) : currentTab === 'home' ? (
          <HomeView
            onSelectAlbum={handleSelectAlbum}
            onSelectPlaylist={handleSelectPlaylist}
            onOpenDownload={(track) => setDownloadModalTrack(track)}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            authStatus={authStatus}
          />
        ) : currentTab === 'search' ? (
          <SearchView
            initialQuery={searchQuery}
            onSelectAlbum={handleSelectAlbum}
            onSelectPlaylist={handleSelectPlaylist}
            onOpenDownload={(track) => setDownloadModalTrack(track)}
          />
        ) : currentTab === 'library' ? (
          <LibraryView
            onOpenDownload={(track) => setDownloadModalTrack(track)}
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
      </main>

      {/* Floating Mini Player (visible when a track is loaded) */}
      {currentTrack && (
        <MobileMiniPlayer onOpenNowPlaying={() => setIsNowPlayingOpen(true)} />
      )}

      {/* Bottom Navigation Dock */}
      <MobileNavigation
        currentTab={currentTab}
        onTabChange={(tab) => {
          onSelectDetail(null);
          onTabChange(tab);
        }}
      />

      {/* Fullscreen Now Playing Sheet */}
      <MobileNowPlaying
        isOpen={isNowPlayingOpen}
        onClose={() => setIsNowPlayingOpen(false)}
        onOpenLyrics={() => setIsLyricsSheetOpen(true)}
        onOpenQueue={() => setIsQueueSheetOpen(true)}
        onOpenDownload={() => {
          if (currentTrack) setDownloadModalTrack(currentTrack);
        }}
      />

      {/* Mobile Synced Lyrics Sheet */}
      <MobileLyricsSheet
        isOpen={isLyricsSheetOpen}
        onClose={() => setIsLyricsSheetOpen(false)}
      />

      {/* Mobile Queue Sheet */}
      <MobileQueueSheet
        isOpen={isQueueSheetOpen}
        onClose={() => setIsQueueSheetOpen(false)}
      />

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
        onAuthChange={onCheckAuth}
      />
    </div>
  );
};
