import React, { useState, useEffect } from 'react';
import { Play, Heart, Plus, Download, Search, Disc, ListMusic, User } from 'lucide-react';
import { Track, Album, Playlist, SearchResults, SearchFilter } from '../types';
import { api, SAMPLE_TRACKS, SAMPLE_ALBUMS, handleImageError } from '../services/api';
import { usePlayer } from '../context/PlayerContext';

interface SearchViewProps {
  initialQuery?: string;
  onSelectAlbum: (album: Album) => void;
  onSelectPlaylist: (playlist: Playlist) => void;
  onOpenDownload: (track: Track) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  initialQuery = '',
  onSelectAlbum,
  onSelectPlaylist,
  onOpenDownload,
}) => {
  const { playTrack, toggleLike, isLiked, addToQueue } = usePlayer();
  const [filter, setFilter] = useState<SearchFilter>('all');
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResults>(() => {
    if (initialQuery.toLowerCase().includes('queen')) {
      const q = initialQuery.toLowerCase();
      const songs = SAMPLE_TRACKS.filter(t => t.artist.toLowerCase().includes(q) || t.title.toLowerCase().includes(q));
      const albums = SAMPLE_ALBUMS.filter(a => a.artist.toLowerCase().includes(q) || a.title.toLowerCase().includes(q));
      return {
        query: initialQuery,
        songs: songs.length ? songs : [SAMPLE_TRACKS[0]],
        albums: albums.length ? albums : [SAMPLE_ALBUMS[0]],
        artists: [{ id: 'artist-queen', name: 'Queen', thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80', subscribers: '18.4M subscribers' }],
        playlists: [],
      };
    }
    return {
      query: '',
      songs: [],
      albums: [],
      artists: [],
      playlists: [],
    };
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    let isCancelled = false;

    const performSearch = async () => {
      const q = query.trim() || 'top hits';
      setLoading(true);
      try {
        const res = await api.search(q, filter);
        if (!isCancelled) {
          setResults(res);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    performSearch();
    return () => {
      isCancelled = true;
    };
  }, [query, filter]);

  const filterChips: { id: SearchFilter; label: string }[] = [
    { id: 'all', label: 'All Results' },
    { id: 'songs', label: 'Songs' },
    { id: 'albums', label: 'Albums' },
    { id: 'artists', label: 'Artists' },
    { id: 'playlists', label: 'Playlists' },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto pb-16">
      {/* Search Header & Filter Chips */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Search className="w-6 h-6 text-m3-primary" />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-m3-on-surface tracking-tight">
            {query ? `Search results for "${query}"` : 'Browse & Search Music'}
          </h1>
        </div>

        {/* Filter Chips Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {filterChips.map((chip) => {
            const isSelected = filter === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => setFilter(chip.id)}
                className={`px-4 py-2 rounded-m3-full text-xs font-bold uppercase tracking-wider transition-all shrink-0 ${
                  isSelected
                    ? 'bg-m3-primary text-m3-on-primary shadow-sm shadow-m3-primary/30'
                    : 'bg-m3-surface-container text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container-high'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading && results.songs.length === 0 && results.albums.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4 text-m3-on-surface-variant">
          <div className="w-10 h-10 border-4 border-m3-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">Searching YouTube Music library...</p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Songs Results */}
          {(filter === 'all' || filter === 'songs') && results.songs.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-m3-on-surface flex items-center gap-2">
                <span>Songs</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-m3-surface-container-high font-mono text-m3-on-surface-variant">
                  {results.songs.length}
                </span>
              </h2>

              <div className="divide-y divide-m3-outline-variant/15 rounded-m3-lg bg-m3-surface-container/40 border border-m3-outline-variant/20 overflow-hidden">
                {results.songs.map((song, idx) => {
                  const liked = isLiked(song.id);
                  return (
                    <div
                      key={song.id}
                      className="group flex items-center gap-4 p-3 hover:bg-m3-surface-container-high transition-colors"
                    >
                      <span className="w-6 text-center text-xs font-mono text-m3-on-surface-variant/60">
                        {idx + 1}
                      </span>

                      <div
                        onClick={() => playTrack(song, results.songs)}
                        className="relative w-12 h-12 rounded-m3-xs overflow-hidden shrink-0 cursor-pointer bg-m3-surface-container-highest"
                      >
                        <img
                          src={song.thumbnail || (song.id ? `https://i.ytimg.com/vi/${song.id}/hqdefault.jpg` : '')}
                          alt={song.title}
                          onError={(e) => handleImageError(e, song.id)}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                        </div>
                      </div>

                      <div
                        onClick={() => playTrack(song, results.songs)}
                        className="flex-1 min-w-0 cursor-pointer"
                      >
                        <p className="text-sm font-bold text-m3-on-surface truncate group-hover:text-m3-primary transition-colors">
                          {song.title}
                        </p>
                        <p className="text-xs text-m3-on-surface-variant truncate">
                          {song.artist} {song.album ? `• ${song.album}` : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                        <button
                          onClick={() => toggleLike(song)}
                          title={liked ? 'Unlike' : 'Like'}
                          className="p-2 rounded-full text-m3-on-surface-variant hover:text-rose-500 hover:bg-m3-surface-container transition-colors"
                        >
                          <Heart className={`w-4 h-4 ${liked ? 'text-rose-500 fill-rose-500' : ''}`} />
                        </button>
                        <button
                          onClick={() => addToQueue(song)}
                          title="Add to queue"
                          className="p-2 rounded-full text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onOpenDownload(song)}
                          title="Download"
                          className="p-2 rounded-full text-m3-on-surface-variant hover:text-m3-primary hover:bg-m3-surface-container transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-mono text-m3-on-surface-variant/70 w-12 text-right">
                          {song.durationFormatted || '3:30'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Albums Results */}
          {(filter === 'all' || filter === 'albums') && results.albums.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-m3-on-surface flex items-center gap-2">
                <Disc className="w-4 h-4 text-m3-primary" />
                <span>Albums</span>
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {results.albums.map((album) => (
                  <div
                    key={album.id}
                    onClick={() => onSelectAlbum(album)}
                    className="group p-3.5 rounded-m3-lg bg-m3-surface-container/60 hover:bg-m3-surface-container border border-m3-outline-variant/20 hover:border-m3-primary/30 transition-all cursor-pointer"
                  >
                    <div className="relative aspect-square w-full rounded-m3-md overflow-hidden bg-m3-surface-container-high shadow-sm mb-3">
                      <img
                        src={album.thumbnail || (album.tracks && album.tracks[0]?.id ? `https://i.ytimg.com/vi/${album.tracks[0].id}/hqdefault.jpg` : '')}
                        alt={album.title}
                        onError={(e) => handleImageError(e, album.tracks?.[0]?.id)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <p className="text-sm font-bold text-m3-on-surface truncate group-hover:text-m3-primary transition-colors">
                      {album.title}
                    </p>
                    <p className="text-xs text-m3-on-surface-variant truncate">
                      {album.artist} {album.year ? `• ${album.year}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Playlists Results */}
          {(filter === 'all' || filter === 'playlists') && results.playlists.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-m3-on-surface flex items-center gap-2">
                <ListMusic className="w-4 h-4 text-m3-primary" />
                <span>Playlists</span>
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {results.playlists.map((playlist) => (
                  <div
                    key={playlist.id}
                    onClick={() => onSelectPlaylist(playlist)}
                    className="group p-3.5 rounded-m3-lg bg-m3-surface-container/60 hover:bg-m3-surface-container border border-m3-outline-variant/20 hover:border-m3-primary/30 transition-all cursor-pointer"
                  >
                    <div className="relative aspect-square w-full rounded-m3-md overflow-hidden bg-m3-surface-container-high shadow-sm mb-3">
                      <img
                        src={playlist.thumbnail || (playlist.tracks && playlist.tracks[0]?.id ? `https://i.ytimg.com/vi/${playlist.tracks[0].id}/hqdefault.jpg` : '')}
                        alt={playlist.title}
                        onError={(e) => handleImageError(e, playlist.tracks?.[0]?.id)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <p className="text-sm font-bold text-m3-on-surface truncate group-hover:text-m3-primary transition-colors">
                      {playlist.title}
                    </p>
                    <p className="text-xs text-m3-on-surface-variant truncate">
                      {playlist.author || 'Curator'}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Artists Results */}
          {(filter === 'all' || filter === 'artists') && results.artists.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-m3-on-surface flex items-center gap-2">
                <User className="w-4 h-4 text-m3-primary" />
                <span>Artists</span>
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {results.artists.map((artist) => (
                  <div
                    key={artist.id}
                    className="p-4 rounded-m3-lg bg-m3-surface-container/60 border border-m3-outline-variant/20 flex flex-col items-center text-center space-y-3"
                  >
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-m3-surface-container-high shadow-md">
                      <img
                        src={artist.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200'}
                        alt={artist.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-m3-on-surface">{artist.name}</p>
                      <p className="text-xs text-m3-on-surface-variant">
                        {artist.subscribers ? `${artist.subscribers} subscribers` : 'Artist'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
