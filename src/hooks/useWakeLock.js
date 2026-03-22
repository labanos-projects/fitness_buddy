import { useRef, useCallback } from 'react';

/**
 * Hook to prevent the screen from sleeping during a workout.
 *
 * Strategy (in order of preference):
 *  1. Screen Wake Lock API  – works on Android Chrome, desktop Chrome/Edge, Safari 16.4+
 *  2. Silent-video trick    – a tiny looping 1×1 canvas stream played as a <video>.
 *     This is the most reliable workaround for iOS Safari < 16.4 and all other iOS
 *     browsers (Chrome/Firefox on iOS all use WebKit and share the same limitation).
 */
export default function useWakeLock() {
  const wakeLockRef = useRef(null);   // native WakeLockSentinel
  const videoRef    = useRef(null);   // <video> element for the silent-video fallback

  // ---------------------------------------------------------------------------
  // Silent-video helpers
  // ---------------------------------------------------------------------------

  /** Create and start a hidden looping video to keep the screen on (iOS fallback). */
  const startVideoFallback = useCallback(async () => {
    if (videoRef.current) return; // already running

    const video = document.createElement('video');
    video.setAttribute('playsinline', '');
    video.muted  = true;
    video.loop   = true;
    video.style.cssText =
      'position:fixed;top:-2px;left:-2px;width:1px;height:1px;opacity:0.01;pointer-events:none;z-index:-9999;';

    // Generate a 1×1 canvas stream (1 fps is plenty – we just need *a* stream).
    const canvas = document.createElement('canvas');
    canvas.width  = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, 1, 1);

    if (typeof canvas.captureStream === 'function') {
      // Modern browsers + iOS Safari 11+
      video.srcObject = canvas.captureStream(1);
    } else {
      // Last-resort: a minimal valid MP4 (8-frame, 1×1, silent).
      // Generated with: ffmpeg -f lavfi -i color=black:s=1x1:d=1 -vcodec libx264 -crf 50 -preset ultrafast tiny.mp4
      // then base64-encoded.
      video.src =
        'data:video/mp4;base64,' +
        'AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAu1tZGF0AAACrg' +
        'YF//+q3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE2NCByMzEwOCAzMWUxOWY5IC0g' +
        'SC4yNjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAyMyAtIGh0dHA6Ly' +
        '93d3cudmlkZW9sYW4ub3JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhYmFjPTEgcmVmPTMg' +
        'ZGVibG9jaz0xOjA6MCBhbmFseXNlPTB4MzoweDExMyBtZT1oZXggc3VibWU9NyBwc3k9MS' +
        'BwbWNfd2VpZ2h0PTEgbWl4ZWRfcmVmPTEgbWVfcmFuZ2U9MTYgY2hyb21hX21lPTEgdHJl' +
        'bGxpcz0xIDh4OGRjdD0xIGNxbT0wIGRlYWR6b25lPTIxLDExIGZhc3RfcHNraXA9MSBjaHJv' +
        'bWFfcXBfb2Zmc2V0PS0yIHRocmVhZHM9MyBsb29rYWhlYWRfdGhyZWFkcz0xIHNsaWNlZF90' +
        'aHJlYWRzPTAgbnI9MCBkZWNpbWF0ZT0xIGludGVybGFjZWQ9MCBibHVyYXlfY29tcGF0PTAg' +
        'Y29uc3RyYWluZWRfaW50cmE9MCBiZnJhbWVzPTMgYl9weXJhbWlkPTIgYl9hZGFwdD0xIGJf' +
        'Ymlhcz0wIGRpcmVjdD0xIHdlaWdodGI9MSBvcGVuX2dvcD0wIHdlaWdodHA9MiBrZXlpbnQ9' +
        'MjUwIGtleWludF9taW49MjUgc2NlbmVjdXQ9NDAgaW50cmFfcmVmcmVzaD0wIHJjX2xvb2th' +
        'aGVhZD00MCByYz1jcmYgbWJ0cmVlPTEgY3JmPTUwLjAgcWNvbXA9MC42MCBxcG1pbj0wIHFw' +
        'bWF4PTY5IHFwc3RlcD00IGlwX3JhdGlvPTEuNDAgYXE9MToxLjAwAAAAAA9liIQAAAMP/jY7' +
        'CMjMjAAAAA8AAAMCAAFkAAADAAADAAB6AAAADAAADAAB6AAAAA==';
    }

    document.body.appendChild(video);
    videoRef.current = video;

    try {
      await video.play();
    } catch (err) {
      // Autoplay blocked – clean up gracefully
      console.warn('Silent-video wake-lock fallback failed to play:', err.message);
      stopVideoFallback();
    }
  }, []);

  /** Stop and remove the hidden video element. */
  const stopVideoFallback = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
      videoRef.current.src = '';
      videoRef.current.remove();
      videoRef.current = null;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  const requestWakeLock = useCallback(async () => {
    // --- 1. Try native Wake Lock API (Android Chrome, desktop, Safari 16.4+) ---
    if ('wakeLock' in navigator && !wakeLockRef.current) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        wakeLockRef.current.addEventListener('release', () => {
          wakeLockRef.current = null;
          // If the OS released it (e.g. tab hidden then shown), re-acquire.
          // We rely on the Workout component to call requestWakeLock again on
          // visibilitychange, so nothing extra is needed here.
        });
        return; // native lock acquired – no need for the video fallback
      } catch (err) {
        console.warn('Wake Lock API failed, falling back to video trick:', err.message);
        // Fall through to the video fallback below
      }
    }

    // --- 2. Silent-video fallback (all iOS browsers, older Safari, etc.) ---
    await startVideoFallback();
  }, [startVideoFallback]);

  const releaseWakeLock = useCallback(async () => {
    // Release native lock if held
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch (err) {
        console.warn('Wake lock release failed:', err.message);
      }
      wakeLockRef.current = null;
    }

    // Stop the video fallback if running
    stopVideoFallback();
  }, [stopVideoFallback]);

  return { requestWakeLock, releaseWakeLock };
}
