import { getStoredSettings } from './settings';

const canVibrate = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  if (!('vibrate' in navigator)) return false;
  const settings = getStoredSettings();
  return Boolean(settings.hapticsEnabled);
};

export const hapticMove = () => {
  if (!canVibrate()) return;
  try {
    navigator.vibrate(12);
  } catch (e) {}
};

export const hapticWall = () => {
  if (!canVibrate()) return;
  try {
    navigator.vibrate(30);
  } catch (e) {}
};

export const hapticError = () => {
  if (!canVibrate()) return;
  try {
    navigator.vibrate([40, 60, 40]);
  } catch (e) {}
};

export const hapticVictory = () => {
  if (!canVibrate()) return;
  try {
    navigator.vibrate([60, 80, 60, 80, 100]);
  } catch (e) {}
};
