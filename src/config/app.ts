/** The product name. This is the only place it is written; it will change before launch. */
export const APP_NAME = 'Project Neon';

/**
 * Prefix for every storage key. Fixed forever and independent of APP_NAME,
 * so renaming the app never loses anyone's saved progress.
 */
export const STORAGE_NAMESPACE = 'pneon';

/** Used in export file names. Derived, so it follows APP_NAME. */
export const APP_SLUG = APP_NAME.toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

export const REPO_URL = 'https://github.com/krasimir-paunov/code-learning-app';

export const APP_DESCRIPTION =
  'Learn HTML, CSS, JavaScript, C#, .NET and algorithms by doing: interactive lessons, auto-checked challenges and a skill-tree map.';
