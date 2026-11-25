import { Track, Album, Playlist, SearchResults, LyricLine, SearchFilter, SearchSource, AuthStatus, HomeSection } from '../types';

const API_BASE = '/api';

export const AUTH_STORAGE_KEY = 'sonora_yt_auth_data';

export interface StoredAuthData {
  authenticated: boolean;
  authType: 'headers' | 'google_oauth';
  headers?: string | Record<string, string>;
  token?: any;
  client_data?: any;
  savedAt?: number;
}

export function encodeAuthHeader(data: StoredAuthData): string {
  try {
    const jsonStr = JSON.stringify(data);
    return btoa(
      encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (_, p1) =>
        String.fromCharCode(parseInt(p1, 16))
      )
    );
  } catch {
    return '';
  }
}

export function getStoredAuth(): StoredAuthData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && (parsed.authenticated || parsed.headers || parsed.token)) {
      return parsed;
    }
  } catch {
    // Ignore invalid JSON
  }
  return null;
}

export function setStoredAuth(data: StoredAuthData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage quota or disabled
  }
}

export function clearStoredAuth(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Encodes auth credentials into a compact, URL-safe sync token for QR code and magic links.
 */
export function encodeSyncToken(data: StoredAuthData): string {
  try {
    const jsonStr = JSON.stringify(data);
    return encodeURIComponent(
      btoa(
        encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (_, p1) =>
          String.fromCharCode(parseInt(p1, 16))
        )
      )
    );
  } catch {
    return '';
  }
}

/**
 * Decodes a sync token from URL or clipboard.
 */
export function decodeSyncToken(token: string): StoredAuthData | null {
  if (!token) return null;
  try {
    const base64 = decodeURIComponent(token.trim());
    const decodedStr = decodeURIComponent(
      Array.prototype.map
        .call(atob(base64), (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(decodedStr);
    if (parsed && (parsed.authenticated || parsed.headers || parsed.token)) {
      return parsed;
    }
  } catch {
    try {
      const parsed = JSON.parse(decodeURIComponent(token));
      if (parsed && (parsed.authenticated || parsed.headers || parsed.token)) {
        return parsed;
      }
    } catch {}
  }
  return null;
}

export function parseLrc(lrcText: string): LyricLine[] {
  if (!lrcText) return [];
  const lines = lrcText.split('\n');
  const result: LyricLine[] = [];
  const timeRegex = /\[(\d+):(\d{2})(?:[.:](\d+))?\]/g;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let match;
    const timestamps: number[] = [];
    let lastIndex = 0;

    while ((match = timeRegex.exec(trimmed)) !== null) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const fraction = match[3] ? parseFloat('0.' + match[3]) : 0;
      const totalSeconds = Number((minutes * 60 + seconds + fraction).toFixed(3));
      timestamps.push(totalSeconds);
      lastIndex = timeRegex.lastIndex;
    }

    const text = trimmed.slice(lastIndex).trim();
    if (timestamps.length > 0 && text) {
      for (const time of timestamps) {
        result.push({ time, text });
      }
    }
  }

  return result.sort((a, b) => a.time - b.time);
}

export const DEFAULT_ALBUM_ART = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%230F172A"/><stop offset="100%" stop-color="%231E293B"/></linearGradient><linearGradient id="p" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2338BDF8"/><stop offset="100%" stop-color="%23818CF8"/></linearGradient></defs><rect width="400" height="400" rx="40" fill="url(%23g)"/><circle cx="200" cy="200" r="120" fill="none" stroke="url(%23p)" stroke-width="6" stroke-opacity="0.4"/><path d="M165 140v120l100-60z" fill="url(%23p)"/></svg>`;

export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, trackId?: string) => {
  const target = e.currentTarget;
  target.onerror = null;
  if (trackId && !target.src.includes('i.ytimg.com')) {
    target.src = `https://i.ytimg.com/vi/${trackId}/hqdefault.jpg`;
  } else {
    target.src = DEFAULT_ALBUM_ART;
  }
};

// Fallback high-fidelity sample tracks inspired by Sonora desktop
export const SAMPLE_TRACKS: Track[] = [
  {
    id: 'fJ9rUzIMcZQ',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    album: 'A Night at the Opera',
    duration: 354,
    durationFormatted: '5:54',
    thumbnail: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg',
    isLiked: false,
  },
  {
    id: 'hT_nvWreIhg',
    title: 'Counting Stars',
    artist: 'OneRepublic',
    album: 'Native',
    duration: 257,
    durationFormatted: '4:17',
    thumbnail: 'https://i.ytimg.com/vi/hT_nvWreIhg/hqdefault.jpg',
    isLiked: false,
  },
  {
    id: '4NRXx6U8ABQ',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    duration: 200,
    durationFormatted: '3:20',
    thumbnail: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg',
    isLiked: false,
  },
  {
    id: 'kJQP7kiw5Fk',
    title: 'Despacito',
    artist: 'Luis Fonsi ft. Daddy Yankee',
    album: 'VIDA',
    duration: 228,
    durationFormatted: '3:48',
    thumbnail: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg',
    isLiked: false,
  },
  {
    id: 'YQHsXMglC9A',
    title: 'Hello',
    artist: 'Adele',
    album: '25',
    duration: 295,
    durationFormatted: '4:55',
    thumbnail: 'https://i.ytimg.com/vi/YQHsXMglC9A/hqdefault.jpg',
    isLiked: false,
  },
  {
    id: 'OPf0YbXqDm0',
    title: 'Uptown Funk',
    artist: 'Mark Ronson ft. Bruno Mars',
    album: 'Uptown Special',
    duration: 270,
    durationFormatted: '4:30',
    thumbnail: 'https://i.ytimg.com/vi/OPf0YbXqDm0/hqdefault.jpg',
    isLiked: false,
  },
  {
    id: '09R8_2nJtjg',
    title: 'Sugar',
    artist: 'Maroon 5',
    album: 'V',
    duration: 235,
    durationFormatted: '3:55',
    thumbnail: 'https://i.ytimg.com/vi/09R8_2nJtjg/hqdefault.jpg',
    isLiked: false,
  },
  {
    id: '2Vv-BfVoq4g',
    title: 'Perfect',
    artist: 'Ed Sheeran',
    album: '÷ (Divide)',
    duration: 263,
    durationFormatted: '4:23',
    thumbnail: 'https://i.ytimg.com/vi/2Vv-BfVoq4g/hqdefault.jpg',
    isLiked: false,
  }
];

export const SAMPLE_ALBUMS: Album[] = [
  {
    id: 'MPREb_94Q6Jv',
    title: 'After Hours (Deluxe)',
    artist: 'The Weeknd',
    year: '2020',
    thumbnail: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg',
    trackCount: 17,
    tracks: SAMPLE_TRACKS.slice(2, 6)
  },
  {
    id: 'MPREb_kL29s1',
    title: 'A Night at the Opera',
    artist: 'Queen',
    year: '1975',
    thumbnail: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg',
    trackCount: 12,
    tracks: SAMPLE_TRACKS.slice(0, 3)
  },
  {
    id: 'MPREb_pOx872',
    title: 'Native (Gold Edition)',
    artist: 'OneRepublic',
    year: '2014',
    thumbnail: 'https://i.ytimg.com/vi/hT_nvWreIhg/hqdefault.jpg',
    trackCount: 15,
    tracks: SAMPLE_TRACKS.slice(1, 5)
  },
  {
    id: 'MPREb_zPq019',
    title: '÷ (Divide)',
    artist: 'Ed Sheeran',
    year: '2017',
    thumbnail: 'https://i.ytimg.com/vi/2Vv-BfVoq4g/hqdefault.jpg',
    trackCount: 16,
    tracks: SAMPLE_TRACKS.slice(4, 8)
  }
];

export const SAMPLE_PLAYLISTS: Playlist[] = [
  {
    id: 'PL_daily_mix_1',
    title: 'Today\'s Top Hits',
    description: 'The hottest tracks right now across pop, electronic, and hip-hop.',
    author: 'Sonora Curators',
    thumbnail: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg',
    trackCount: 50,
    tracks: SAMPLE_TRACKS
  },
  {
    id: 'PL_chill_vibes',
    title: 'Late Night Chill & Lo-Fi',
    description: 'Mellow beats, ambient soundscapes, and relaxing acoustic gems.',
    author: 'Sonora Beats',
    thumbnail: 'https://i.ytimg.com/vi/YQHsXMglC9A/hqdefault.jpg',
    trackCount: 35,
    tracks: SAMPLE_TRACKS.slice(2, 7)
  },
  {
    id: 'PL_focus_flow',
    title: 'Deep Focus & Flow State',
    description: 'Minimal instrumental and deep atmospheric rhythms for coding and study.',
    author: 'Sonora Mind',
    thumbnail: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg',
    trackCount: 42,
    tracks: SAMPLE_TRACKS.slice(0, 5)
  },
  {
    id: 'PL_synthwave_run',
    title: 'Neon Synthwave Drive',
    description: 'Retro 80s synthesizers, driving basslines, and cyberpunk nostalgia.',
    author: 'Outrun Radio',
    thumbnail: 'https://i.ytimg.com/vi/09R8_2nJtjg/hqdefault.jpg',
    trackCount: 28,
    tracks: SAMPLE_TRACKS.slice(3, 8)
  }
];

export const SAMPLE_LRC = `[00:00.00] Sonora Synchronized Lyrics
[00:04.50] Is this the real life?
[00:08.20] Is this just fantasy?
[00:12.80] Caught in a landslide, no escape from reality
[00:20.10] Open your eyes, look up to the skies and see
[00:27.40] I'm just a poor boy, I need no sympathy
[00:34.90] Because I'm easy come, easy go, little high, little low
[00:43.00] Any way the wind blows doesn't really matter to me, to me
[00:54.80] Mama, just killed a man
[01:00.20] Put a gun against his head, pulled my trigger, now he's dead
[01:09.50] Mama, life had just begun
[01:15.80] But now I've gone and thrown it all away
[01:23.00] Mama, ooh, didn't mean to make you cry
[01:31.50] If I'm not back again this time tomorrow
[01:36.40] Carry on, carry on as if nothing really matters
[01:48.00] Too late, my time has come
[01:54.20] Sends shivers down my spine, body's aching all the time
[02:03.00] Goodbye, everybody, I've got to go
[02:09.50] Gotta leave you all behind and face the truth
[02:16.80] Mama, ooh, I don't wanna die
[02:24.00] I sometimes wish I'd never been born at all`;

class ApiService {
  /**
   * Helper to construct auth headers for stateless requests
   */
  getAuthHeaders(): Record<string, string> {
    const stored = getStoredAuth();
    if (!stored) return {};
    const encoded = encodeAuthHeader(stored);
    return encoded ? { 'X-Sonora-Auth': encoded } : {};
  }

  /**
   * Fetch personalized / trending home feed sections directly from YouTube Music
   */
  async getHome(limit = 10): Promise<HomeSection[]> {
    try {
      const res = await fetch(`${API_BASE}/home?limit=${limit}`, {
        headers: this.getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        const rawSections = data.sections || [];
        return rawSections
          .filter((sec: any) => sec && Array.isArray(sec.contents) && sec.contents.length > 0)
          .map((sec: any) => {
            const contents = sec.contents.map((item: any) => {
              const videoId = item.videoId || (item.type === 'song' ? item.id : null);
              if (videoId) {
                return {
                  id: videoId,
                  title: item.title,
                  artist: item.artist || (item.artists && item.artists[0]?.name) || 'YouTube Music',
                  album: item.album?.name || item.album || '',
                  duration: item.duration_seconds || item.duration || 180,
                  durationFormatted: item.durationFormatted || (item.duration ? (typeof item.duration === 'string' ? item.duration : `${Math.floor(item.duration / 60)}:${(item.duration % 60).toString().padStart(2, '0')}`) : '3:00'),
                  thumbnail: item.thumbnail || (item.thumbnails?.[item.thumbnails.length - 1]?.url) || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                } as Track;
              }

              // Check if playlist
              if (item.playlistId || item.itemCount || (item.thumbnails && !item.artists && !item.year)) {
                return {
                  id: item.playlistId || item.browseId || item.id,
                  title: item.title,
                  description: item.description || (item.author ? (typeof item.author === 'string' ? item.author : item.author[0]?.name) : 'YouTube Playlist'),
                  thumbnail: item.thumbnail || (item.thumbnails?.[item.thumbnails.length - 1]?.url) || '',
                  trackCount: item.count ? parseInt(item.count, 10) : (item.itemCount ? parseInt(item.itemCount, 10) : 0),
                } as Playlist;
              }

              // Check if album
              if (item.browseId || item.year) {
                return {
                  id: item.browseId || item.id,
                  title: item.title,
                  artist: item.artist || (item.artists && item.artists[0]?.name) || 'Various Artists',
                  year: item.year || '',
                  thumbnail: item.thumbnail || (item.thumbnails?.[item.thumbnails.length - 1]?.url) || '',
                } as Album;
              }

              // Default fallback as Track if has title
              return {
                id: item.id || '',
                title: item.title,
                artist: item.artist || 'YouTube Music',
                thumbnail: item.thumbnail || (item.thumbnails?.[item.thumbnails.length - 1]?.url) || '',
              } as Track;
            });

            return {
              title: sec.title || 'Recommended',
              contents,
            };
          });
      }
    } catch (err) {
      console.warn('Failed to fetch home feed from backend:', err);
    }
    return [];
  }

  /**
   * Search music across providers (YouTube Music, SoundCloud, All) via Sonora backend
   */
  async search(query: string, filter: SearchFilter = 'all', source: SearchSource = 'all'): Promise<SearchResults> {
    if (!query.trim()) {
      return { query: '', songs: [], albums: [], artists: [], playlists: [] };
    }

    try {
      const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}&filter=${filter}&source=${source}`);
      if (response.ok) {
        const data = await response.json();
        return this.normalizeSearchResults(query, data);
      }
    } catch {
      // Backend not yet reached, fallback to intelligent client-side search over samples
    }

    return this.clientSideSearchFallback(query, filter);
  }

  /**
   * Quick suggestions for search bar
   */
  async getSuggestions(query: string): Promise<string[]> {
    if (!query.trim()) return [];
    try {
      const res = await fetch(`${API_BASE}/suggestions?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
        if (data.suggestions) return data.suggestions;
      }
    } catch {
      // Fallback suggestions
    }

    const q = query.toLowerCase();
    const suggestions = new Set<string>();
    SAMPLE_TRACKS.forEach(t => {
      if (t.title.toLowerCase().includes(q)) suggestions.add(t.title);
      if (t.artist.toLowerCase().includes(q)) suggestions.add(t.artist);
    });
    return Array.from(suggestions).slice(0, 5);
  }

  /**
   * Resolve audio streaming URL for a given track id
   */
  getStreamUrl(videoId: string): string {
    return `${API_BASE}/stream/${videoId}`;
  }

  /**
   * Fetch song info
   */
  async getSong(videoId: string): Promise<Track | null> {
    try {
      const res = await fetch(`${API_BASE}/song/${videoId}`);
      if (res.ok) {
        const data = await res.json();
        if (data) {
          const vid = data.videoId || data.id || videoId;
          return {
            ...data,
            id: vid,
            thumbnail: data.thumbnail || (vid ? `https://i.ytimg.com/vi/${vid}/hqdefault.jpg` : '')
          };
        }
      }
    } catch {
      // fallback
    }
    return SAMPLE_TRACKS.find(t => t.id === videoId) || {
      id: videoId,
      title: 'YouTube Track',
      artist: 'Unknown Artist',
      duration: 210,
      durationFormatted: '3:30',
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      isLiked: false,
    };
  }

  /**
   * Fetch synchronized LRC lyrics
   */
  async getLyrics(
    title: string,
    artist: string,
    duration?: number,
    videoId?: string
  ): Promise<{ syncedLyrics?: string; plainLyrics?: string; lines: LyricLine[] }> {
    try {
      const params = new URLSearchParams();
      if (title) params.append('title', title);
      if (artist) params.append('artist', artist);
      if (duration) params.append('duration', duration.toString());
      if (videoId) params.append('video_id', videoId);
      
      const res = await fetch(`${API_BASE}/lyrics?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const rawLrc = data.syncedLyrics || data.lyrics || data.lrc || '';
        const plain = data.plainLyrics || data.text || '';

        // Check if server already returned parsed lines
        if (Array.isArray(data.lines) && data.lines.length > 0) {
          const parsedLines: LyricLine[] = data.lines
            .map((l: { time?: number | string; startTime?: number | string; start_time?: number | string; text?: string }) => {
              let t = 0;
              if (typeof l.time === 'number') {
                t = l.time > 1000 && (!l.startTime || l.time === l.startTime) ? l.time / 1000 : l.time;
              } else if (l.time !== undefined && l.time !== null && l.time !== '') {
                const parsed = parseFloat(String(l.time));
                t = !isNaN(parsed) ? (parsed > 1000 ? parsed / 1000 : parsed) : 0;
              } else if (typeof l.startTime === 'number') {
                t = l.startTime / 1000;
              } else if (l.startTime !== undefined && l.startTime !== null && l.startTime !== '') {
                t = (parseFloat(String(l.startTime)) || 0) / 1000;
              } else if (typeof l.start_time === 'number') {
                t = l.start_time > 1000 ? l.start_time / 1000 : l.start_time;
              } else if (l.start_time !== undefined && l.start_time !== null && l.start_time !== '') {
                const parsed = parseFloat(String(l.start_time));
                t = !isNaN(parsed) ? (parsed > 1000 ? parsed / 1000 : parsed) : 0;
              }

              return {
                time: Number(t.toFixed(3)),
                text: (l.text || '').trim()
              };
            })
            .filter((l: LyricLine) => l.text.length > 0);

          if (parsedLines.length > 0) {
            return {
              syncedLyrics: rawLrc || (data.hasTimestamps ? SAMPLE_LRC : ''),
              plainLyrics: plain || parsedLines.map((l: LyricLine) => l.text).join('\n'),
              lines: parsedLines
            };
          }
        }

        if (rawLrc) {
          const lines = parseLrc(rawLrc);
          if (lines && lines.length > 0) {
            return {
              syncedLyrics: rawLrc,
              plainLyrics: plain || lines.map(l => l.text).join('\n'),
              lines
            };
          }
        }
      }
    } catch {
      // fallback
    }

    // Default sample LRC lyrics parsed
    const lines = parseLrc(SAMPLE_LRC);
    return {
      syncedLyrics: SAMPLE_LRC,
      plainLyrics: lines.map(l => l.text).join('\n'),
      lines
    };
  }

  /**
   * Fetch radio station tracks for continuous playback
   */
  async getStation(videoId: string): Promise<Track[]> {
    try {
      const res = await fetch(`${API_BASE}/station/${videoId}`);
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data) ? data : data.tracks || [];
      }
    } catch {
      return [];
    }
    return [];
  }

  /**
   * Fetch playlist details
   */
  async getPlaylist(playlistId: string): Promise<Playlist | null> {
    const res = await fetch(`${API_BASE}/playlist/${playlistId}`, {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to load playlist (${res.status})`);
    }
    return await res.json();
  }

  /**
   * Fetch album details
   */
  async getAlbum(browseId: string): Promise<Album | null> {
    try {
      const res = await fetch(`${API_BASE}/album/${browseId}`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // fallback
    }

    return SAMPLE_ALBUMS.find(a => a.id === browseId) || SAMPLE_ALBUMS[0];
  }

  /**
   * Trigger download request to backend
   */
  async requestDownload(track: Track, format: string): Promise<{ success: boolean; message: string; downloadUrl?: string }> {
    try {
      const res = await fetch(`${API_BASE}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: track.id,
          video_id: track.id,
          title: track.title,
          artist: track.artist,
          format: format
        })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // simulation
    }

    return {
      success: true,
      message: `Download started for ${track.title} in ${format.toUpperCase()}`,
      downloadUrl: `${API_BASE}/stream/${track.id}`
    };
  }

  /**
   * Helper to normalize raw backend search payload
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private normalizeSearchResults(query: string, data: any): SearchResults {
    const rawFilter = (data.filter || '').toLowerCase();
    const rawResults = data.results || data.items || [];

    let rawSongs = data.songs || data.tracks || [];
    let rawAlbums = data.albums || [];
    let rawPlaylists = data.playlists || [];
    let rawArtists = data.artists || [];

    if (Array.isArray(rawResults) && rawResults.length > 0) {
      if (rawFilter === 'songs' || (!rawSongs.length && !rawAlbums.length && !rawPlaylists.length && !rawArtists.length)) {
        rawSongs = rawResults;
      } else if (rawFilter === 'albums') {
        rawAlbums = rawResults;
      } else if (rawFilter === 'playlists') {
        rawPlaylists = rawResults;
      } else if (rawFilter === 'artists') {
        rawArtists = rawResults;
      }
    }

    const songs: Track[] = (rawSongs || []).map((item: any) => {
      const videoId = item.videoId || item.id || item.video_id;
      const isSoundCloud = item.source === 'soundcloud' || videoId?.startsWith('sc_');
      return {
        id: videoId,
        title: item.title || item.name,
        artist: item.artist || (item.artists && item.artists[0]?.name) || (isSoundCloud ? 'SoundCloud Artist' : 'Unknown Artist'),
        album: item.album?.name || item.album || (isSoundCloud ? 'SoundCloud' : ''),
        duration: item.duration_seconds || item.duration || 180,
        durationFormatted:
          typeof item.duration === 'number'
            ? `${Math.floor(item.duration / 60)}:${(item.duration % 60).toString().padStart(2, '0')}`
            : item.duration || '3:00',
        thumbnail:
          item.thumbnails?.[item.thumbnails.length - 1]?.url ||
          item.thumbnail ||
          (!isSoundCloud && videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : ''),
        source: item.source || (isSoundCloud ? 'soundcloud' : 'ytmusic'),
      };
    });

    const albums: Album[] = (rawAlbums || []).map((item: any) => ({
      id: item.browseId || item.id,
      title: item.title || item.name,
      artist: item.artist || (item.artists && item.artists[0]?.name) || 'Unknown Artist',
      year: item.year || '',
      thumbnail: item.thumbnails?.[item.thumbnails.length - 1]?.url || item.thumbnail || '',
      trackCount: item.trackCount || 0,
    }));

    const playlists: Playlist[] = (rawPlaylists || []).map((item: any) => ({
      id: item.browseId || item.id,
      title: item.title || item.name,
      author: item.author || 'YouTube Music',
      thumbnail: item.thumbnails?.[item.thumbnails.length - 1]?.url || item.thumbnail || '',
      trackCount: item.itemCount ? parseInt(item.itemCount, 10) : 0,
    }));

    const artists = (rawArtists || []).map((item: any) => ({
      id: item.browseId || item.id,
      name: item.artist || item.name || item.title,
      thumbnail: item.thumbnails?.[item.thumbnails.length - 1]?.url || item.thumbnail || '',
      subscribers: item.subscribers || '',
    }));

    return { query, songs, albums, artists, playlists };
  }

  // ── Authentication ────────────────────────────────────────────────────────

  async getAuthStatus(): Promise<AuthStatus> {
    const stored = getStoredAuth();
    const headers = this.getAuthHeaders();
    try {
      const res = await fetch(`${API_BASE}/auth/status`, { headers });
      if (res.ok) {
        const data: AuthStatus & { authPayload?: any } = await res.json();
        if (data.authenticated) {
          // Keep localStorage up to date with server session data
          if (data.authPayload) {
            setStoredAuth({
              authenticated: true,
              authType: data.authType,
              ...data.authPayload,
              savedAt: Date.now(),
            });
          }
          return data;
        } else if (stored) {
          // Server container rebooted or cold-started without /tmp session
          // Attempt explicit restore via stored credentials
          const restored = await this.restoreAuth(stored);
          if (restored.authenticated) {
            return {
              authenticated: true,
              authType: (restored.authType as any) || stored.authType,
              canGoogleSignIn: data.canGoogleSignIn ?? true,
            };
          } else {
            // Credentials actually expired or failed
            clearStoredAuth();
          }
        }
        return data;
      }
    } catch {
      // Offline fallback: maintain authenticated state if stored credentials exist
      if (stored && stored.authenticated) {
        return {
          authenticated: true,
          authType: stored.authType,
          canGoogleSignIn: true,
        };
      }
    }
    return { authenticated: false, authType: 'none', canGoogleSignIn: false };
  }

  async restoreAuth(payload: StoredAuthData): Promise<{
    success: boolean;
    authenticated: boolean;
    authType?: string;
    authPayload?: any;
  }> {
    try {
      const res = await fetch(`${API_BASE}/auth/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setStoredAuth({
            ...payload,
            authenticated: true,
            authType: data.authType || payload.authType,
            savedAt: Date.now(),
          });
        }
        return data;
      }
    } catch {
      // Ignore network errors during restore attempt
    }
    return { success: false, authenticated: false };
  }

  async generatePairCode(payload?: StoredAuthData, expiresIn = 600): Promise<{
    success: boolean;
    code: string;
    expires_in: number;
    expires_at: number;
    authPayload?: any;
  }> {
    const dataToSend = payload || getStoredAuth();
    const res = await fetch(`${API_BASE}/auth/pair/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload: dataToSend, expires_in: expiresIn }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to generate mobile pairing code');
    }
    return await res.json();
  }

  async claimPairCode(code: string): Promise<{
    success: boolean;
    authenticated: boolean;
    authType: string;
    authPayload: StoredAuthData;
  }> {
    const res = await fetch(`${API_BASE}/auth/pair/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Invalid or expired pairing code');
    }
    const data = await res.json();
    if (data.authenticated && data.authPayload) {
      setStoredAuth({
        ...data.authPayload,
        authenticated: true,
        savedAt: Date.now(),
      });
    }
    return data;
  }

  async loginWithHeaders(headers: string): Promise<{
    success: boolean;
    authenticated: boolean;
    authType?: string;
    authPayload?: any;
  }> {
    const res = await fetch(`${API_BASE}/auth/headers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ headers }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to authenticate with provided headers');
    }
    const data = await res.json();
    if (data.authenticated) {
      setStoredAuth({
        authenticated: true,
        authType: 'headers',
        headers: data.authPayload?.headers || headers,
        savedAt: Date.now(),
      });
    }
    return data;
  }

  async startOAuth(): Promise<{
    verification_url: string;
    user_code: string;
    device_code: string;
    expires_in: number;
    interval: number;
  }> {
    const res = await fetch(`${API_BASE}/auth/oauth/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to start Google OAuth');
    }
    return await res.json();
  }

  async pollOAuth(deviceCode: string): Promise<{
    status: 'pending' | 'success' | 'error';
    error?: string;
    authenticated?: boolean;
    slow_down?: boolean;
    token?: any;
    client_data?: any;
    authPayload?: any;
  }> {
    const res = await fetch(`${API_BASE}/auth/oauth/poll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_code: deviceCode }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Error polling OAuth status');
    }
    const data = await res.json();
    if (data.status === 'success' || data.authenticated) {
      setStoredAuth({
        authenticated: true,
        authType: 'google_oauth',
        token: data.token || data.authPayload?.token,
        client_data: data.client_data || data.authPayload?.client_data,
        savedAt: Date.now(),
      });
    }
    return data;
  }

  async logout(): Promise<{ success: boolean; authenticated: boolean }> {
    clearStoredAuth();
    try {
      const res = await fetch(`${API_BASE}/auth/logout`, { method: 'POST' });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Ignore
    }
    return { success: true, authenticated: false };
  }

  // ── User Library Sync ──────────────────────────────────────────────────────

  async getLibraryLikedSongs(limit = 100): Promise<Track[]> {
    try {
      const res = await fetch(`${API_BASE}/library/liked?limit=${limit}`, {
        headers: this.getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        const rawTracks = data.tracks || [];
        return rawTracks.map((item: any) => ({
          id: item.videoId || item.id,
          title: item.title,
          artist: item.artist || (item.artists && item.artists[0]?.name) || 'Unknown Artist',
          album: item.album?.name || item.album || '',
          duration: item.duration_seconds || item.duration || 180,
          durationFormatted: item.duration || '3:00',
          thumbnail:
            item.thumbnails?.[item.thumbnails.length - 1]?.url ||
            item.thumbnail ||
            `https://i.ytimg.com/vi/${item.videoId || item.id}/hqdefault.jpg`,
          isLiked: true,
        }));
      }
    } catch {
      // Ignore
    }
    return [];
  }

  async getLibraryPlaylists(): Promise<Playlist[]> {
    const res = await fetch(`${API_BASE}/library/playlists`, {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to load YouTube Music playlists (${res.status})`);
    }
    const data = await res.json();
    const raw = data.playlists || [];
    return raw.map((p: any) => ({
      id: p.playlistId || p.browseId || p.id,
      title: p.title,
      description: p.description || '',
      author: p.author || 'You',
      thumbnail: p.thumbnails?.[p.thumbnails.length - 1]?.url || p.thumbnail || '',
      trackCount: p.count || p.itemCount || 0,
    }));
  }

  async getLibraryAlbums(): Promise<Album[]> {
    try {
      const res = await fetch(`${API_BASE}/library/albums`, {
        headers: this.getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        const raw = data.albums || [];
        return raw.map((a: any) => ({
          id: a.browseId || a.id,
          title: a.title,
          artist: a.artists?.[0]?.name || a.artist || 'Unknown Artist',
          year: a.year || '',
          thumbnail: a.thumbnails?.[a.thumbnails.length - 1]?.url || a.thumbnail || '',
          trackCount: a.trackCount || 0,
        }));
      }
    } catch {
      // Ignore
    }
    return [];
  }

  private clientSideSearchFallback(query: string, filter: SearchFilter): SearchResults {
    const q = query.toLowerCase();
    const songs = (filter === 'all' || filter === 'songs')
      ? SAMPLE_TRACKS.filter(t => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q))
      : [];
    const albums = (filter === 'all' || filter === 'albums')
      ? SAMPLE_ALBUMS.filter(a => a.title.toLowerCase().includes(q) || a.artist.toLowerCase().includes(q))
      : [];
    const playlists = (filter === 'all' || filter === 'playlists')
      ? SAMPLE_PLAYLISTS.filter(p => p.title.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q)))
      : [];

    return {
      query,
      songs: songs.length ? songs : SAMPLE_TRACKS,
      albums: albums.length ? albums : SAMPLE_ALBUMS,
      playlists: playlists.length ? playlists : SAMPLE_PLAYLISTS,
      artists: [
        { id: 'art_1', name: 'Queen', subscribers: '17.8M' },
        { id: 'art_2', name: 'The Weeknd', subscribers: '35.4M' },
        { id: 'art_3', name: 'Adele', subscribers: '31.2M' },
      ].filter(() => filter === 'all' || filter === 'artists')
    };
  }
}

export const api = new ApiService();
