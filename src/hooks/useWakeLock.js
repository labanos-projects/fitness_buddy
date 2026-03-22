import NoSleep from 'nosleep.js';

// Module-level singleton shared across the app.
// Exporting it lets App.jsx call noSleep.enable() directly inside a
// user-gesture handler (onClick), which is required by iOS Safari's
// autoplay policy. The hook's requestWakeLock/releaseWakeLock are used
// for the pause/resume flow inside Workout where those are also button clicks.
export const noSleep = new NoSleep();

export default function useWakeLock() {
  const requestWakeLock = async () => {
    try {
      await noSleep.enable();
    } catch (e) {
      console.warn('Wake lock enable failed:', e);
    }
  };

  const releaseWakeLock = () => {
    try {
      noSleep.disable();
    } catch (e) {
      // ignore – disable() throws if not yet enabled
    }
  };

  return { requestWakeLock, releaseWakeLock };
}
