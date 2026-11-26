// src/theme/callouts.ts
export const callouts = {
  note:       { label: 'Note',       rail: 'border-sky-60 on-dark:border-sky-30',         tag: 'text-sky-60 on-dark:text-sky-30' },
  definition: { label: 'Definition', rail: 'border-accent',                               tag: 'text-accent' },
  result:     { label: 'Result',     rail: 'border-emerald-60 on-dark:border-emerald-30', tag: 'text-emerald-60 on-dark:text-emerald-30' },
  warning:    { label: 'Warning',    rail: 'border-orange-60 on-dark:border-orange-30',   tag: 'text-orange-60 on-dark:text-orange-30' },
} as const;
export type CalloutKind = keyof typeof callouts;
