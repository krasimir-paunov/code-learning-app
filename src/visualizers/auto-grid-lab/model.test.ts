import { describe, expect, it } from 'vitest';
import { autoTracks } from './model.ts';

// Every expectation is Chromium's computed grid-template-columns for the same grid.
describe('autoTracks', () => {
  it('auto-fill keeps every track that fits, even empty ones', () => {
    expect(autoTracks('auto-fill', 700, 150, 10, 2).sizes).toEqual([167.5, 167.5, 167.5, 167.5]);
  });

  it('auto-fit collapses the empty tracks and their gaps', () => {
    expect(autoTracks('auto-fit', 700, 150, 10, 2).sizes).toEqual([345, 345, 0, 0]);
  });

  it('behaves the same as auto-fill once the items fill every track', () => {
    expect(autoTracks('auto-fit', 700, 150, 10, 6).sizes).toEqual([167.5, 167.5, 167.5, 167.5]);
  });

  it('always makes at least one track, never below the minimum', () => {
    expect(autoTracks('auto-fill', 300, 150, 10, 3).sizes).toEqual([300]);
    expect(autoTracks('auto-fit', 100, 150, 10, 1).sizes).toEqual([150]);
  });
});
