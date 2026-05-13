// // src/regexStuff.ts
// // Minimal, compiling version that we can extend later.

// import type { ParsedQuery, QueryClause } from './ParsedQuery';

// // (Kept because you had them; not used yet—warnings are OK.)
// const TEXT_FIELDS = new Set(['character', 'series', 'tag', 'code']);
// const NUMERIC_FIELDS = new Set(['number', 'edition', 'wishlists', 'grabber', 'burnvalue']);

// export function parseQuery(input: string): ParsedQuery {
//   const raw = input ?? '';
//   const clauses: QueryClause[] = [];

//   const trimmed = raw.trim();
//   if (!trimmed) return { raw, clauses };

//   // For now: split by whitespace. (We can add quotes/prefixes next.)
//   const tokens = trimmed.split(/\s+/);

//   for (const token of tokens) {
//     // Basic prefix support: character:rem / series:rezero
//     const idx = token.indexOf(':');
//     if (idx > 0) {
//       const key = token.slice(0, idx).toLowerCase();
//       const value = token.slice(idx + 1).trim();
//       if (!value) continue;

//       if (key === 'c' || key === 'character') {
//         clauses.push({ type: 'character', value });
//         continue;
//       }
//       if (key === 's' || key === 'series') {
//         clauses.push({ type: 'series', value });
//         continue;
//       }
//     }

//     // Bare token default (current behavior): character search
//     clauses.push({ type: 'character', value: token });
//   }

//   return { raw, clauses };
// }

// regexStuff.ts
// Older/utility-style parser. Regex-heavy. Looser typing.
// Purpose: turn a user search string into ParsedQuery { clauses }.
// No Dexie, no React.

export type TextOp = ':' | 'is';
export type NumOp = '<' | '<=' | '=' | '>' | '>=';
export type Operator = TextOp | NumOp;

export type Clause =
  | { field: string; operator: TextOp; value: string }
  | { field: string; operator: NumOp; value: number };

export interface ParsedQuery {
  raw: string;
  clauses: Clause[];
  // Anything not parsed into clauses can be kept here for debugging or future “free text” features
  leftovers?: string[];
}

// Field buckets (strings, not strict unions yet)
export const TEXT_KEYS = new Set([
  'character',
  'series',
  'tag',
  'code',
]);

export const NUMERIC_KEYS = new Set([
  'number',
  'edition',
  'wishlists',
  'grabber',
  'burnvalue',
  'obtainedtimestamp',
]);

// --- Regex patterns ---
//
// Supports:
//   edition>=2
//   number=123
//   wishlists<10
//   character:foo
//   seriesisbar   (because earlier you used "is" without a separator sometimes)
//   series:isbar  (still works too)
//
// Also supports quoted values for text clauses:
//   series:"Fate/Grand Order"
//   character:'Café Mélange'
//
//cpt
const FIELD_ALIASES: Record<string, string> = {
  // series
  s: "series",
  sr: "series",
  series: "series",

  // character
  c: "character",
  char: "character",
  character: "character",
  n: "character",
  name: "character",

  // wishlist(s)
  w: "wishlists",
  wl: "wishlists",
  wls: "wishlists",
  wishlist: "wishlists",
  wishlists: "wishlists",

  // obtained timestamp casing fix
  obtainedtimestamp: "obtainedTimestamp",
  obtained: "obtainedTimestamp",
  obtd: "obtainedTimestamp",
  obt: "obtainedTimestamp",

  // number
  p: "number",
  print: "number",

  //edition
  ed: "edition",
  edition: "edition",
  e: "edition",

  //tag
  t: "tag",
  tag: "tag",
};
//cpt
function normalizeField(raw: string) {
  const key = raw.trim().toLowerCase();
  return FIELD_ALIASES[key] ?? key; // default: lowercased key
}



const NUMERIC_CLAUSE_REGEX = /^([a-zA-Z]+)(<=|>=|<|>|=)(-?\d+(?:\.\d+)?)$/;

// Prefer field:(value) or fieldis(value). "is" as a glued operator is allowed.
const TEXT_CLAUSE_REGEX = /^([a-zA-Z]+)(:|is)(.+)$/;

// Very simple quote detection (older style; not a full lexer)
function stripMatchingQuotes(s: string): string {
  const t = s.trim();
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    return t.slice(1, -1);
  }
  return t;
}

// Split input into tokens, keeping quoted phrases together.
// Example: series:"Fate/Grand Order" -> one token
function splitKeepingQuotes(input: string): string[] {
  const out: string[] = [];
  let cur = '';
  let quote: '"' | "'" | null = null;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if ((ch === '"' || ch === "'") && quote === null) {
      quote = ch as '"' | "'";
      cur += ch;
      continue;
    }
    if (quote !== null && ch === quote) {
      quote = null;
      cur += ch;
      continue;
    }

    if (quote === null && /\s/.test(ch)) {
      if (cur.trim()) out.push(cur.trim());
      cur = '';
      continue;
    }

    cur += ch;
  }

  if (cur.trim()) out.push(cur.trim());
  return out;
}

/**
 * Parse a raw search string into clauses.
 *
 * Notes (older behavior):
 * - If token doesn't match any structured clause, it becomes an implicit character search (field: 'character', operator ':').
 * - Numeric values are converted to number immediately.
 * - Unknown fields fall back to implicit character search (instead of being dropped).
 */
export function searchCards(input: string): ParsedQuery {
  const raw = input ?? '';
  const clauses: Clause[] = [];
  const leftovers: string[] = [];

  if (!raw.trim()) return { raw, clauses };

  const tokens = splitKeepingQuotes(raw.trim());

  // for (const token of tokens) {
  for (let i = 0; i < tokens.length; i++) {
  const token = tokens[i];

    // --- Numeric clause first ---
    const numMatch = token.match(NUMERIC_CLAUSE_REGEX);
    if (numMatch) {
      const [, fieldRaw, opRaw, valueRaw] = numMatch;
      // const field = fieldRaw.toLowerCase();
      const field = normalizeField(fieldRaw);
      const operator = opRaw as NumOp;
      const value = Number(valueRaw);

      if (NUMERIC_KEYS.has(field) && Number.isFinite(value)) {
        clauses.push({ field, operator, value });
        continue;
      }
      // if it looks numeric but field isn't numeric, treat it as leftover / free text
      leftovers.push(token);
      continue;
    }


// --- Text clause ---
  const textMatch = token.match(TEXT_CLAUSE_REGEX);
  if (textMatch) {
    const [, fieldRaw, opRaw, valueRaw] = textMatch;
    const field = normalizeField(fieldRaw);
    const operator = opRaw as TextOp;

    // Start with whatever came after ":" / "is"
    let value = valueRaw.trim();

    // If the value is NOT quoted, allow it to consume subsequent tokens as part of the same value.
    // This makes: s:Fate Grand Order  work without quotes.
    const isQuoted =
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")) ||
      value.startsWith('"') ||
      value.startsWith("'");

    if (!isQuoted && TEXT_KEYS.has(field)) {
      // We'll glue on more tokens until we hit something that looks like a new clause.
      // New clause = matches NUMERIC_CLAUSE_REGEX or TEXT_CLAUSE_REGEX
      while (i + 1 < tokens.length) {
        const next = tokens[i + 1];

        if (NUMERIC_CLAUSE_REGEX.test(next) || TEXT_CLAUSE_REGEX.test(next)) break;

        value += " " + next;
        i++;
      }
    }

    value = stripMatchingQuotes(value);

    if (TEXT_KEYS.has(field)) {
      clauses.push({ field, operator, value });
      continue;
    }

    leftovers.push(token);
    continue;
  }

    // --- Fallback: implicit character search ---
    // Older behavior: every “free” token becomes a character clause.
    const implicit = stripMatchingQuotes(token);
    if (implicit) {
      clauses.push({ field: 'character', operator: ':', value: implicit });
    }
  }

  return leftovers.length ? { raw, clauses, leftovers } : { raw, clauses };
}
