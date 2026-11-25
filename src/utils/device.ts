/**
 * Sonora Device Detection & Responsive Mode System
 * Automatically detects whether the client is on a mobile device or desktop browser,
 * with real-time viewport listening and optional user override mode ('auto' | 'mobile' | 'desktop').
 */

import { useState, useEffect, useCallback } from 'react';

export type DeviceMode = 'auto' | 'mobile' | 'desktop';

export const DEVICE_MODE_STORAGE_KEY = 'sonora_device_mode_preference';
export const DEVICE_MODE_CHANGED_EVENT = 'sonora_device_mode_changed';

/**
 * Checks if the current browser environment matches mobile patterns:
 * 1. Mobile User-Agent regex (iPhone, Android, iPod, iPad, Mobile, etc.)
 * 2. Touch capability
 * 3. Viewport width <= 768px (standard mobile/tablet breakpoint)
 */
export function checkIsMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;

  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;
  const isMobileUA = mobileRegex.test(ua);

  const hasTouchScreen =
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0;

  const isSmallViewport = window.innerWidth <= 768;

  // If user-agent matches mobile, or if screen is small and has touch, classify as mobile
  return isMobileUA || (isSmallViewport && hasTouchScreen) || isSmallViewport;
}

export function getStoredDeviceMode(): DeviceMode {
  if (typeof window === 'undefined') return 'auto';
  try {
    const stored = localStorage.getItem(DEVICE_MODE_STORAGE_KEY);
    if (stored === 'mobile' || stored === 'desktop' || stored === 'auto') {
      return stored;
    }
  } catch {
    // fallback
  }
  return 'auto';
}

export function setStoredDeviceMode(mode: DeviceMode) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DEVICE_MODE_STORAGE_KEY, mode);
    window.dispatchEvent(new CustomEvent(DEVICE_MODE_CHANGED_EVENT, { detail: { mode } }));
  } catch (err) {
    console.warn('Failed to persist device mode', err);
  }
}

/**
 * React hook that returns whether mobile mode should be rendered.
 * Dynamically reacts to window resize, orientation change, and preference updates.
 */
export function useDeviceDetect() {
  const [preference, setPreference] = useState<DeviceMode>(getStoredDeviceMode);
  const [hardwareMobile, setHardwareMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return checkIsMobileDevice();
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setHardwareMobile(checkIsMobileDevice());
    };

    const handlePrefChange = (e: Event) => {
      const custom = e as CustomEvent<{ mode: DeviceMode }>;
      if (custom.detail?.mode) {
        setPreference(custom.detail.mode);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    window.addEventListener(DEVICE_MODE_CHANGED_EVENT, handlePrefChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      window.removeEventListener(DEVICE_MODE_CHANGED_EVENT, handlePrefChange);
    };
  }, []);

  const setMode = useCallback((mode: DeviceMode) => {
    setPreference(mode);
    setStoredDeviceMode(mode);
  }, []);

  // Compute effective mobile state
  const isMobile = preference === 'mobile' ? true : preference === 'desktop' ? false : hardwareMobile;

  return {
    isMobile,
    preference,
    hardwareMobile,
    setMode,
  };
}
