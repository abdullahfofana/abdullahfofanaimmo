import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOUND_PREFERENCE_KEY = '@immoci_notification_sound_enabled';

// In-memory audio context singleton
let sharedAudioCtx: any = null;
let isAudioUnlocked = false;
let lastPlayTimestamp = 0;
const MIN_PLAY_INTERVAL_MS = 500;

/**
 * Lazily initialize and return the Web Audio Context
 */
function getAudioContext(): any {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;

  try {
    const AudioContextClass =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioContextClass();
    }
    return sharedAudioCtx;
  } catch (err) {
    console.warn('[SoundNotification] AudioContext init error:', err);
    return null;
  }
}

/**
 * Handle browser autoplay restrictions by unlocking the audio context
 * on first user interaction (click, keypress, touchstart)
 */
export function initAudioUnlocker(): () => void {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return () => {};
  }

  const unlockHandler = async () => {
    try {
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        await ctx.resume();
      }
      isAudioUnlocked = true;
    } catch {
      // Browser autoplay policy still restricting
    } finally {
      cleanupListeners();
    }
  };

  const cleanupListeners = () => {
    if (typeof window === 'undefined') return;
    window.removeEventListener('click', unlockHandler);
    window.removeEventListener('touchstart', unlockHandler);
    window.removeEventListener('keydown', unlockHandler);
  };

  window.addEventListener('click', unlockHandler, { once: true, passive: true });
  window.addEventListener('touchstart', unlockHandler, { once: true, passive: true });
  window.addEventListener('keydown', unlockHandler, { once: true, passive: true });

  return cleanupListeners;
}

/**
 * Retrieve user sound preference (default: true)
 */
export async function isSoundEnabled(): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem(SOUND_PREFERENCE_KEY);
    if (stored === null) return true;
    return stored === 'true';
  } catch {
    return true;
  }
}

/**
 * Set and persist user sound preference
 */
export async function setSoundEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(SOUND_PREFERENCE_KEY, enabled ? 'true' : 'false');
  } catch (err) {
    console.warn('[SoundNotification] Error saving sound preference:', err);
  }
}

/**
 * Plays a professional, harmonic dual-tone chime (587.33Hz D5 -> 880Hz A5)
 * Synthesized dynamically via Web Audio API:
 * - Zero network dependencies (never fails on 404s or slow connections)
 * - Ultra-low latency (<5ms)
 * - Soft exponential decay envelope (crisp, pleasant, non-jarring)
 * - Debounced to prevent overlapping audio on rapid events
 */
export async function playMessageNotificationSound(force = false): Promise<boolean> {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return false;
  }

  // 1. Check sound preference unless forced (e.g. testing)
  if (!force) {
    const enabled = await isSoundEnabled();
    if (!enabled) return false;
  }

  // 2. Debounce rapid-fire events (prevent audio stutter or echoing)
  const now = Date.now();
  if (now - lastPlayTimestamp < MIN_PLAY_INTERVAL_MS) {
    return false;
  }
  lastPlayTimestamp = now;

  const ctx = getAudioContext();
  if (!ctx) return false;

  try {
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        // Autoplay blocked by browser policy
        return false;
      }
    }

    const t = ctx.currentTime;

    // Master gain for the whole chime
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.3, t);
    masterGain.connect(ctx.destination);

    // ── Tone 1: Fundamental warm chime (587.33 Hz / D5) ──
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, t);

    gain1.gain.setValueAtTime(0.001, t);
    gain1.gain.exponentialRampToValueAtTime(0.4, t + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc1.connect(gain1);
    gain1.connect(masterGain);

    // ── Tone 2: Ascending crystal bell overtone (880 Hz / A5) ──
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880.0, t + 0.08);

    gain2.gain.setValueAtTime(0.001, t);
    gain2.gain.setValueAtTime(0.001, t + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.45, t + 0.10);
    gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.48);

    osc2.connect(gain2);
    gain2.connect(masterGain);

    // Trigger oscillators
    osc1.start(t);
    osc1.stop(t + 0.25);

    osc2.start(t + 0.08);
    osc2.stop(t + 0.50);

    return true;
  } catch (err) {
    console.warn('[SoundNotification] Audio synthesis failed gracefully:', err);
    return false;
  }
}
