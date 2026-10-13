import type { YarnAppearance } from '@/components/yarn-ball';
import { supabase } from '@/lib/supabase';

/** A yarn from Ravelry's database, as the yarn-search function returns it. */
export type FoundYarn = {
  id: number;
  name: string;
  company: string;
  /** Ravelry's weight name: "Fingering", "DK", "Aran", "Bulky"… */
  weight: string;
  metres: number | null;
  grams: number | null;
  discontinued: boolean;
  /** The yarn's page on Ravelry, for the credit link. */
  url: string | null;
};

export type YarnDetails = FoundYarn & {
  fibres: { name: string; percentage: number | null }[];
  /** Needle sizes in mm, e.g. [3.5, 4]. */
  needles: number[];
};

type Answer = { allowed?: boolean; yarns?: FoundYarn[]; yarn?: YarnDetails; error?: string };

async function ask(body: object): Promise<Answer> {
  if (!supabase) return { allowed: false };
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return { allowed: false };
  const { data, error } = await supabase.functions.invoke<Answer>('yarn-search', { body });
  if (error) throw error;
  return data ?? { allowed: false };
}

/** Whether "Look it up" is open to this account (only some accounts until Ravelry says yes). */
export async function canLookUpYarn(): Promise<boolean> {
  try {
    return !!(await ask({ ping: true })).allowed;
  } catch {
    return false;
  }
}

export async function searchYarns(query: string): Promise<FoundYarn[]> {
  return (await ask({ query })).yarns ?? [];
}

export async function yarnDetails(id: number): Promise<YarnDetails | undefined> {
  return (await ask({ id })).yarn;
}

/** How the painted ball should look for a yarn weight: thin yarns fine, the middle smooth, thick ones chunky. */
export function looksFor(weight: string): YarnAppearance {
  if (/thread|cobweb|lace|fingering/i.test(weight)) return 'fine';
  if (/bulky|jumbo|chunky|super/i.test(weight)) return 'chunky';
  return 'smooth';
}

/** "100% Merino" / "70% Alpaca, 30% Silk". */
export function fibreText(fibres: YarnDetails['fibres']): string {
  return fibres.map((f) => (f.percentage ? `${f.percentage}% ${f.name}` : f.name)).join(', ');
}

/** "4 mm", "3.5 mm". */
export const needleLabel = (mm: number) => `${Number(mm.toFixed(2))} mm`;
