// Looks up yarns in Ravelry's yarn database for the "Look it up" choice on the new yarn screen.
// The Ravelry keys (RAVELRY_USER, RAVELRY_KEY) are Supabase secrets and never reach the app.
// Until Ravelry allows DropStitch's use of the API, only the accounts in YARN_SEARCH_USERS
// (comma-separated user ids, also a secret) may use it; everyone else gets { allowed: false }.
//
// Body: { ping: true } → { allowed }; { query } → { allowed, yarns }; { id } → { allowed, yarn }.
// Deploy: npx supabase functions deploy yarn-search --project-ref velashxmnntxvvckqovj

import { createClient } from 'jsr:@supabase/supabase-js@2';

const RAVELRY = 'https://api.ravelry.com';
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

/** Whether the caller is a signed-in user on the list. The auth server checks the token, so it can't be faked. */
async function allowed(req: Request): Promise<boolean> {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return false;
  const users = (Deno.env.get('YARN_SEARCH_USERS') ?? '').split(',').map((u) => u.trim()).filter(Boolean);
  if (!users.length) return false;
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);
  const { data } = await supabase.auth.getUser(token);
  return !!data.user && users.includes(data.user.id);
}

async function ravelry(path: string) {
  const auth = btoa(`${Deno.env.get('RAVELRY_USER') ?? ''}:${Deno.env.get('RAVELRY_KEY') ?? ''}`);
  const res = await fetch(`${RAVELRY}${path}`, { headers: { Authorization: `Basic ${auth}` } });
  if (!res.ok) throw new Error(`Ravelry answered ${res.status}`);
  return res.json();
}

type RavelryYarn = {
  id: number;
  name: string;
  permalink?: string;
  yarn_company_name?: string;
  yarn_weight?: { name?: string } | null;
  yardage?: number | null;
  grams?: number | null;
  discontinued?: boolean;
  yarn_fibers?: { percentage?: number; fiber_type?: { name?: string } }[];
  min_needle_size?: { metric?: number } | null;
  max_needle_size?: { metric?: number } | null;
};

/** Only the facts the app shows, with the link back to Ravelry. Nothing is stored. */
function slim(y: RavelryYarn) {
  return {
    id: y.id,
    name: y.name,
    company: y.yarn_company_name ?? '',
    weight: y.yarn_weight?.name ?? '',
    metres: y.yardage ? Math.round(y.yardage * 0.9144) : null,
    grams: y.grams ?? null,
    discontinued: !!y.discontinued,
    url: y.permalink ? `https://www.ravelry.com/yarns/library/${y.permalink}` : null,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (!(await allowed(req))) return json({ allowed: false });

  let body: { ping?: boolean; query?: string; id?: number } = {};
  try {
    body = await req.json();
  } catch {
    // An empty body is a ping.
  }
  try {
    if (body.query?.trim()) {
      const q = encodeURIComponent(body.query.trim().slice(0, 80));
      const data = await ravelry(`/yarns/search.json?query=${q}&page_size=15`);
      return json({ allowed: true, yarns: (data.yarns ?? []).map(slim) });
    }
    if (body.id) {
      const data = await ravelry(`/yarns/${Number(body.id)}.json`);
      const y: RavelryYarn = data.yarn;
      const fibres = (y.yarn_fibers ?? [])
        .map((f) => ({ name: f.fiber_type?.name ?? '', percentage: f.percentage ?? null }))
        .filter((f) => f.name);
      const needles = [y.min_needle_size?.metric, y.max_needle_size?.metric].filter((n): n is number => !!n);
      return json({ allowed: true, yarn: { ...slim(y), fibres, needles: [...new Set(needles)] } });
    }
    return json({ allowed: true });
  } catch (e) {
    return json({ allowed: true, error: e instanceof Error ? e.message : 'Ravelry lookup failed' }, 502);
  }
});
