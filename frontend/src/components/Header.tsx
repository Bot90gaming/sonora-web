import React, { useState, useEffect, useRef } from 'react';
import { Search, Sun, Moon, Settings, X, Music, RotateCw, Smartphone } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import { AuthStatus } from '../types';

interface HeaderProps {
  onSearch: (query: string) => void;
  onOpenSettings: () => void;
  onOpenAuth?: () => void;
  onReload?: () => void;
  authStatus?: AuthStatus;
  searchQuery: string;
  onToggleMobileMode?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onSearch,
  onOpenSettings,
  onOpenAuth,
  onReload,
  authStatus,
  searchQuery,
  onToggleMobileMode,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [inputValue, setInputValue] = useState(searchQuery);
  const [isReloading, setIsReloading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Platform detection for keyboard shortcut label
  const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent || navigator.platform);
  const shortcutLabel = isMac ? '⌘K' : 'Ctrl K';

  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  // Global keyboard shortcut to focus search bar (Ctrl+K, Cmd+K, or '/')
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isTyping =
        activeTag === 'input' ||
        activeTag === 'textarea' ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !isTyping)) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        setShowSuggestions(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced suggestions fetch
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (inputValue.trim().length > 1) {
        try {
          const results = await api.getSuggestions(inputValue);
          setSuggestions(results);
        } catch {
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
      }
    };

    const timer = setTimeout(fetchSuggestions, 200);
    return () => clearTimeout(timer);
  }, [inputValue]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
      handleSelectSuggestion(suggestions[selectedIndex]);
    } else if (inputValue.trim()) {
      onSearch(inputValue.trim());
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setInputValue(suggestion);
    onSearch(suggestion);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    setInputValue('');
    setSuggestions([]);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDownInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
      } else if (e.key === 'Enter') {
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          e.preventDefault();
          handleSelectSuggestion(suggestions[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  return (
    <header className="relative h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 border-b border-m3-outline-variant/20 bg-m3-surface/80 backdrop-blur-xl sticky top-0 z-30 transition-colors duration-300">
      {/* Top subtle ambient rim highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-m3-primary/30 to-transparent pointer-events-none" />

      {/* Search Input Bar with suggestions */}
      <div ref={containerRef} className="relative w-full max-w-sm sm:max-w-md md:max-w-xl transition-all duration-300">
        <form onSubmit={handleSubmit} className="relative flex items-center group">
          {/* Search Icon with state glow */}
          <div className="absolute left-3.5 flex items-center pointer-events-none">
            <Search
              className={`w-4 h-4 transition-colors duration-200 ${
                isFocused ? 'text-m3-primary' : 'text-m3-on-surface-variant/70 group-hover:text-m3-on-surface-variant'
              }`}
            />
          </div>

          {/* Search Input Field */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowSuggestions(true);
              setSelectedIndex(-1);
            }}
            onFocus={() => {
              setIsFocused(true);
              setShowSuggestions(true);
            }}
            onBlur={() => {
              setIsFocused(false);
            }}
            onKeyDown={handleKeyDownInput}
            placeholder="Search songs, albums, artists, playlists..."
            className="w-full h-10 pl-10 pr-20 sm:pr-24 rounded-m3-full bg-m3-surface-container-high/60 hover:bg-m3-surface-container-high/90 focus:bg-m3-surface-container-highest text-m3-on-surface placeholder-m3-on-surface-variant/50 text-sm border border-m3-outline-variant/25 focus:border-m3-primary/60 focus:outline-none focus:ring-2 focus:ring-m3-primary/20 transition-all duration-200 shadow-inner"
          />

          {/* Right Action: Clear Button or Keyboard Shortcut Badge */}
          <div className="absolute right-3 flex items-center gap-1.5">
            {inputValue ? (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 rounded-full text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container-highest transition-all duration-150 transform hover:scale-110 active:scale-95 focus:outline-none"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-1 select-none pointer-events-none">
                <kbd className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-m3-on-surface-variant/70 bg-m3-surface-container-high border border-m3-outline-variant/30 rounded-m3-xs shadow-xs">
                  {shortcutLabel}
                </kbd>
                <span className="text-[10px] text-m3-on-surface-variant/40">or</span>
                <kbd className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-m3-on-surface-variant/70 bg-m3-surface-container-high border border-m3-outline-variant/30 rounded-m3-xs shadow-xs">
                  /
                </kbd>
              </div>
            )}
          </div>
        </form>

        {/* Animated Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-12 left-0 right-0 glass-panel rounded-m3-xl shadow-2xl py-2 z-50 border border-m3-outline-variant/30 backdrop-blur-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header info */}
            <div className="px-3.5 py-1 text-[11px] font-semibold tracking-wider uppercase text-m3-on-surface-variant/60 flex items-center justify-between border-b border-m3-outline-variant/15 mb-1">
              <span>Quick Suggestions</span>
              <span className="hidden sm:inline text-[10px] lowercase text-m3-on-surface-variant/40">
                ↑↓ to navigate · ↵ to select
              </span>
            </div>

            {/* Suggestion list */}
            <div className="max-h-64 overflow-y-auto">
              {suggestions.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSuggestion(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full px-3.5 py-2 text-left text-sm flex items-center gap-3 transition-colors duration-150 ${
                      isSelected
                        ? 'bg-m3-primary/15 text-m3-primary font-medium'
                        : 'text-m3-on-surface hover:bg-m3-surface-variant/40'
                    }`}
                  >
                    <div
                      className={`p-1 rounded-full transition-colors ${
                        isSelected ? 'bg-m3-primary/20 text-m3-primary' : 'text-m3-on-surface-variant/60'
                      }`}
                    >
                      <Music className="w-3.5 h-3.5" />
                    </div>
                    <span className="truncate flex-1">{item}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* YouTube Account / Sign-In Button */}
        {onOpenAuth && (
          authStatus?.authenticated ? (
            <button
              onClick={onOpenAuth}
              title="YouTube Account (Connected) - Click to manage"
              className="flex items-center gap-2 px-3 py-1.5 rounded-m3-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-all shadow-xs active:scale-95 group"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <svg className="w-3.5 h-3.5 fill-red-500" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              <span className="hidden sm:inline">Connected</span>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              title="Sign in with YouTube Music"
              className="flex items-center gap-2 px-3 py-1.5 rounded-m3-full bg-red-600/15 hover:bg-red-600/25 text-red-400 hover:text-red-300 border border-red-500/30 text-xs font-bold transition-all shadow-xs active:scale-95 group"
            >
              <svg className="w-3.5 h-3.5 fill-red-500 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )
        )}

        {/* Sonora Status Pill */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-m3-full bg-m3-surface-container-high/70 border border-m3-outline-variant/20 text-xs text-m3-on-surface-variant font-medium select-none shadow-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>Sonora Web</span>
        </div>

        {/* Switch to Mobile View Toggle */}
        {onToggleMobileMode && (
          <button
            onClick={onToggleMobileMode}
            title="Switch to Mobile View"
            aria-label="Switch to Mobile View"
            className="relative w-10 h-10 rounded-m3-full flex items-center justify-center bg-m3-surface-container-high/60 hover:bg-m3-surface-container-highest border border-m3-outline-variant/25 transition-all duration-300 hover:scale-105 active:scale-95 shadow-xs group focus:outline-none focus:ring-2 focus:ring-m3-primary/30"
          >
            <Smartphone className="w-4 h-4 text-m3-on-surface-variant group-hover:text-m3-primary transition-colors" />
          </button>
        )}

        {/* Smooth Animated Dark/Light Theme Switch Toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
          className="relative w-10 h-10 rounded-m3-full flex items-center justify-center bg-m3-surface-container-high/60 hover:bg-m3-surface-container-highest border border-m3-outline-variant/25 transition-all duration-300 hover:scale-105 active:scale-95 shadow-xs overflow-hidden group focus:outline-none focus:ring-2 focus:ring-m3-primary/30"
        >
          {/* Sun Icon for Dark Mode (click to switch to light) */}
          <Sun
            className={`w-5 h-5 text-amber-400 absolute transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
              theme === 'dark'
                ? 'rotate-0 scale-100 opacity-100'
                : '-rotate-90 scale-0 opacity-0 pointer-events-none'
            }`}
          />
          {/* Moon Icon for Light Mode (click to switch to dark) */}
          <Moon
            className={`w-5 h-5 text-indigo-500 absolute transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
              theme === 'light'
                ? 'rotate-0 scale-100 opacity-100'
                : 'rotate-90 scale-0 opacity-0 pointer-events-none'
            }`}
          />
        </button>

        {/* Reload / Refresh Button with Spin Animation */}
        <button
          onClick={() => {
            setIsReloading(true);
            setTimeout(() => {
              if (onReload) {
                onReload();
              } else {
                window.location.reload();
              }
            }, 250);
          }}
          title="Reload Sonora (Refresh content)"
          aria-label="Reload application"
          className="relative w-10 h-10 rounded-m3-full flex items-center justify-center bg-m3-surface-container-high/60 hover:bg-m3-surface-container-highest border border-m3-outline-variant/25 transition-all duration-300 hover:scale-105 active:scale-95 shadow-xs group focus:outline-none focus:ring-2 focus:ring-m3-primary/30"
        >
          <RotateCw
            className={`w-4 h-4 text-m3-on-surface-variant group-hover:text-m3-primary transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
              isReloading ? 'animate-spin text-m3-primary' : 'group-hover:rotate-180'
            }`}
          />
        </button>

        {/* Settings button with smooth hover rotation micro-interaction */}
        <button
          onClick={onOpenSettings}
          title="Sonora Settings"
          aria-label="Open Settings"
          className="relative w-10 h-10 rounded-m3-full flex items-center justify-center bg-m3-surface-container-high/60 hover:bg-m3-surface-container-highest border border-m3-outline-variant/25 transition-all duration-300 hover:scale-105 active:scale-95 shadow-xs group focus:outline-none focus:ring-2 focus:ring-m3-primary/30"
        >
          <Settings className="w-5 h-5 text-m3-on-surface-variant group-hover:text-m3-primary transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:rotate-90 active:rotate-180" />
        </button>
      </div>
    </header>
  );
};
