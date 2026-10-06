/**
 * Records on <html data-modality> whether the user last used a keyboard or a pointer. Browsers
 * disagree on whether focus moved by script (route focus after navigation) should show a ring
 * after a click; with this the ring shows to keyboard users only, in every browser.
 */
export function trackInputModality(root: HTMLElement = document.documentElement): () => void {
  const onKey = () => {
    root.dataset.modality = 'keyboard';
  };
  const onPointer = () => {
    root.dataset.modality = 'pointer';
  };
  window.addEventListener('keydown', onKey, true);
  window.addEventListener('pointerdown', onPointer, true);
  return () => {
    window.removeEventListener('keydown', onKey, true);
    window.removeEventListener('pointerdown', onPointer, true);
  };
}
