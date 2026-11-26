// src/theme/sections.ts
export const forms = {
  column:  'col-main',
  reading: 'col-main-margin lg:grid lg:grid-cols-subgrid',
  split:   'col-wide grid gap-x-12 gap-y-8 lg:grid-cols-2',
  wide:    'col-wide',
  full:    'col-full',
} as const;

export type Form = keyof typeof forms;
export type Surface = 'plain' | 'inset' | 'raised' | 'dark';

export interface SectionDef {
  form: Form;
  surface: Surface;
  icon: string;
  label: string;
}

export const sections = {
  prose:      { form: 'reading', surface: 'plain',  icon: 'text',  label: 'Reading' },
  derivation: { form: 'column',  surface: 'inset',  icon: 'sigma', label: 'Derivation' },
  steps:      { form: 'column',  surface: 'plain',  icon: 'steps', label: 'Steps' },
  example:    { form: 'wide',    surface: 'raised', icon: 'spark', label: 'Example' },
  lab:        { form: 'full',    surface: 'dark',   icon: 'code',  label: 'Lab' },
} satisfies Record<string, SectionDef>;

export type SectionKind = keyof typeof sections;
