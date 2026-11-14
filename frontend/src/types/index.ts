export interface Track {
  id: string; // YouTube video_id or unique track id
  title: string;
  artist: string;
  album?: string;
  duration?: number; // duration in seconds
  durationFormatted?: string; // e.g. "3:45"
  thumbnail?: string;
  isLiked?: boolean;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  year?: string;
  thumbnail?: string;
  trackCount?: number;
  tracks?: Track[];
}

export interface Playlist {
  id: string;
  title: string;
  description?: string;
  author?: string;
  thumbnail?: string;
  trackCount?: number;
  tracks?: Track[];
}

export interface Artist {
  id: string;
  name: string;
  thumbnail?: string;
  subscribers?: string;
  topSongs?: Track[];
  albums?: Album[];
}

export interface SearchResults {
  query: string;
  songs: Track[];
  albums: Album[];
  artists: Artist[];
  playlists: Playlist[];
}

export type SearchFilter = 'all' | 'songs' | 'albums' | 'artists' | 'playlists';

export interface LyricLine {
  time: number; // time in seconds
  text: string;
}

export type RepeatMode = 'off' | 'all' | 'one';

export interface DownloadItem {
  id: string;
  track: Track;
  format: 'mp3' | 'm4a' | 'opus' | 'flac' | 'wav';
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  progress: number; // 0-100
  downloadUrl?: string;
  fileSize?: string;
  speed?: string;
  timestamp: number;
}

export interface AppSettings {
  theme: 'dark' | 'light';
  audioQuality: 'high' | 'medium' | 'low';
  preferredFormat: 'mp3' | 'm4a' | 'opus' | 'flac' | 'wav';
  stationModeAutoFill: boolean;
  normalizeVolume: boolean;
  enableSyncedLyricsGlow: boolean;
  backendUrl: string;
}
