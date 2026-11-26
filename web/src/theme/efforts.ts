// src/theme/efforts.ts
export const efforts = {
  check:     { label: 'Check' },
  derive:    { label: 'Derive' },
  implement: { label: 'Implement' },
} as const;
export type Effort = keyof typeof efforts;
