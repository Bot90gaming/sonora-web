import React from 'react';
import { Music, Settings, RefreshCw, Monitor, Search } from 'lucide-react';
import { AuthStatus } from '../../types';
import { DeviceMode } from '../../utils/device';

interface MobileHeaderProps {
  onOpenSearch?: () => void;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  authStatus?: AuthStatus;
  onReload?: () => void;
  isReloading?: boolean;
  deviceMode: DeviceMode;
  onToggleDeviceMode: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  onOpenSearch,
  onOpenSettings,
  onOpenAuth,
  authStatus,
  onReload,
  isReloading,
  deviceMode,
  onToggleDeviceMode,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-m3-surface/85 backdrop-blur-xl border-b border-m3-outline-variant/20 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 flex items-center justify-between">
      {/* Brand Logo & Name */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-400 via-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
          <Music className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="text-base font-black tracking-tight bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
            Sonora
          </span>
          <span className="ml-1 text-[10px] font-bold text-sky-400/80 bg-sky-500/10 px-1.5 py-0.5 rounded-full border border-sky-400/20">
            Mobile
          </span>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Search Shortcut */}
        {onOpenSearch && (
          <button
            onClick={onOpenSearch}
            className="p-2 rounded-full text-m3-on-surface-variant hover:text-m3-primary hover:bg-m3-surface-container transition-colors active:scale-95"
            title="Search Music"
          >
            <Search className="w-4 h-4" />
          </button>
        )}

        {/* Device Switcher (Quick Toggle Desktop / Mobile) */}
        <button
          onClick={onToggleDeviceMode}
          className="p-2 rounded-full text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container transition-colors active:scale-95"
          title={`Switch to Desktop View (Current: ${deviceMode})`}
        >
          <Monitor className="w-4 h-4" />
        </button>

        {/* Reload Feed */}
        {onReload && (
          <button
            onClick={onReload}
            disabled={isReloading}
            className={`p-2 rounded-full text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container transition-colors active:scale-95 ${
              isReloading ? 'animate-spin text-m3-primary' : ''
            }`}
            title="Reload Feed"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        {/* YouTube Auth Badge / Avatar */}
        <button
          onClick={onOpenAuth}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
            authStatus?.authenticated
              ? 'bg-red-600/15 text-red-500 border border-red-500/30'
              : 'bg-m3-surface-container text-m3-on-surface-variant hover:text-m3-on-surface'
          }`}
          title={authStatus?.authenticated ? 'YouTube Connected' : 'Sign In with YouTube'}
        >
          <svg className="w-3.5 h-3.5 fill-current text-red-500" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
          <span className="hidden xs:inline">
            {authStatus?.authenticated ? 'Connected' : 'Sign In'}
          </span>
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-full text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container transition-colors active:scale-95"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
