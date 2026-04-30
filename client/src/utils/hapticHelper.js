/**
 * Triggers haptic feedback using the Vibration API if supported.
 * @param {string} type - 'light', 'medium', 'success', 'error'
 */
export const triggerHaptic = (type) => {
  if (!window.navigator || !window.navigator.vibrate) return;

  switch (type) {
    case 'light':
      window.navigator.vibrate(10);
      break;
    case 'medium':
      window.navigator.vibrate(20);
      break;
    case 'success':
      window.navigator.vibrate([10, 30, 10]);
      break;
    case 'error':
      window.navigator.vibrate([50, 100, 50]);
      break;
    default:
      window.navigator.vibrate(10);
  }
};
