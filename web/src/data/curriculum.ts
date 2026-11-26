import rawManifest from './manifest.json';

export type TrackId = 'analyst' | 'detector' | 'simulation' | 'software';
export type PartRole = 'Orientation' | 'Core Spine' | 'Parallel' | 'ML Branch' | 'Practice';

export interface ReferenceItem {
  index: number;
  text: string;
  url: string | null;
  extraUrls?: string[];
}

export interface Deliverables {
  lectureNote: string;
  lab: string;
  problemSet: string;
  readingListStructure: string;
}

export interface Dependencies {
  raw: string;
  prerequisites: string;
  downstream: string;
}

export interface LectureEntry {
  id: string;
  partNumber: number;
  lectureNumber: number;
  slug: string;
  title: string;
  level: string;
  page: number;
  status: 'planned' | 'published';
  markdownPath: string;
  latexDir: string;
  scriptsDir: string;
  figuresDir: string;
  exercisesDir: string;
  dependencies: Dependencies;
  abstract: string;
  deliverables: Deliverables;
  learningOutcomes: string[];
  references: ReferenceItem[];
}

export interface PartEntry {
  id: string;
  number: number;
  slug: string;
  title: string;
  level: string;
  role: PartRole;
  page: number;
  status: 'planned' | 'published';
  contentDir: string;
  dependencies: Dependencies;
  abstract: string;
  deliverables: Deliverables;
  learningOutcomes: string[];
  references: ReferenceItem[];
  lectureCount: number;
  lectures: LectureEntry[];
}

export interface TrackStop {
  part: number;
  lectures: 'all' | string[];
}

export interface TrackEntry {
  id: TrackId;
  name: string;
  path: string;
  focus: string;
  stops: TrackStop[];
}

export interface CurriculumManifest {
  schemaVersion: string;
  title: string;
  subtitle: string;
  scope: string;
  unitFormat: string[];
  description: string;
  license: string;
  architecture: {
    structure: string;
    dependencySpine: string;
    proficiencyLevels: { code: string; label: string }[];
    fourTrackDesign: string;
    twoStageLabs: string;
    referenceRigor: string;
  };
  graph: {
    coreSpine: number[];
    parallelParts: number[];
    mlBranch: number[];
  };
  tracks: TrackEntry[];
  stats: {
    partsCount: number;
    lecturesCount: number;
    tracksCount: number;
    referencesCount: number;
  };
  parts: PartEntry[];
}

export const manifest = rawManifest as unknown as CurriculumManifest;

export const partsByNumber: Record<number, PartEntry> = Object.fromEntries(
  manifest.parts.map((p) => [p.number, p]),
);

export const tracksById: Record<TrackId, TrackEntry> = Object.fromEntries(
  manifest.tracks.map((t) => [t.id, t]),
) as Record<TrackId, TrackEntry>;

/** Concise card label (keeps text before em-dash if present); full title stays verbatim in manifest. */
export function compactTitle(title: string): string {
  return title.split('—')[0].trim();
}

export function formatSubset(lectures: 'all' | string[]): string | null {
  if (lectures === 'all') return null;
  if (lectures.length <= 2) return lectures.join(', ');
  // Collapse contiguous runs like 8.6, 8.7, 8.8 → 8.6–8.8
  const nums = lectures.map((id) => Number(id.split('.')[1]));
  const contiguous = nums.every((n, i) => i === 0 || n === nums[i - 1] + 1);
  return contiguous ? `${lectures[0]}–${lectures[lectures.length - 1]}` : lectures.join(', ');
}
