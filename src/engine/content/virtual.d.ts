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
