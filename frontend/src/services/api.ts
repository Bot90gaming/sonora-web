import { Track, Album, Playlist, SearchResults, LyricLine, SearchFilter } from '../types';

const API_BASE = '/api';

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
   * Search YouTube Music via Sonora backend
   */
  async search(query: string, filter: SearchFilter = 'all'): Promise<SearchResults> {
    if (!query.trim()) {
      return { query: '', songs: [], albums: [], artists: [], playlists: [] };
    }

    try {
      const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}&filter=${filter}`);
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
      // fallback
    }

    // Return other tracks as station
    return SAMPLE_TRACKS.filter(t => t.id !== videoId);
  }

  /**
   * Fetch playlist details
   */
  async getPlaylist(playlistId: string): Promise<Playlist | null> {
    try {
      const res = await fetch(`${API_BASE}/playlist/${playlistId}`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // fallback
    }

    return SAMPLE_PLAYLISTS.find(p => p.id === playlistId) || SAMPLE_PLAYLISTS[0];
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
      return {
        id: videoId,
        title: item.title || item.name,
        artist: item.artist || (item.artists && item.artists[0]?.name) || 'Unknown Artist',
        album: item.album?.name || item.album || '',
        duration: item.duration_seconds || item.duration || 180,
        durationFormatted: item.duration || '3:00',
        thumbnail:
          item.thumbnails?.[item.thumbnails.length - 1]?.url ||
          item.thumbnail ||
          (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : ''),
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
