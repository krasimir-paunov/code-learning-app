declare module 'virtual:content/manifest' {
  // Ambient module blocks cannot use relative import declarations, only import() types.
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const manifest: import('../skilltree/types.ts').SkillManifest;
  export default manifest;
}

declare module 'virtual:content/lessons' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  type CompiledLesson = import('./lesson-types.ts').CompiledLesson;
  export const lessonLoaders: Record<string, () => Promise<{ default: CompiledLesson }>>;
}

declare module 'virtual:content/cheatsheets' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  type CompiledSheet = import('./cheatsheet-types.ts').CompiledSheet;
  /** Every sheet's track and title, in display order (eager and small). */
  export const sheetIndex: { track: string; title: string }[];
  /** One lazy chunk per sheet, keyed by track. */
  export const sheetLoaders: Record<string, () => Promise<{ default: CompiledSheet }>>;
}
