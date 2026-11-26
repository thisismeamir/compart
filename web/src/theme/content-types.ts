// src/theme/content-types.ts
export const contentTypes = {
  math:      { label: 'Math',      icon: 'sigma' },
  code:      { label: 'Code',      icon: 'code' },
  exercises: { label: 'Exercises', icon: 'check' },
  figures:   { label: 'Figures',   icon: 'image' },
} as const;
export type ContentType = keyof typeof contentTypes;

export interface LectureMeta {
  title: string;
  part: number;
  number: number;
  abstract: string;
  deliverables: string[];
  contentTypes: ContentType[];
  prerequisites: { slug: string; title: string }[];
  minutes?: number;
}
