
// Upload.ts
import './App.css';
import Papa from 'papaparse';
import Dexie, { type EntityTable } from 'dexie';

import type { progressSignal } from './progressSignals';

// --------------------
// Types
// --------------------

interface Card {
  code: string;              // primary key / ID
  character: string;
  series: string;
  number: number;            // print
  edition: number;
  dropper?: number;
  grabber: number;
  obtainedTimestamp: number; // timestamp (convert later if needed)
  wishlists: number;
  tag?: string;
  burnvalue?: number;

  quality?: string;
  frame?: string;
  dye_name?: string;
  worker_effort?: number;//needed
  worker_toughness?: string;//needed
  
  worker_quickness:string;
  worker_purity:string;
  worker_dropper:string;
  worker_grabber:string;


  // tokens for partial match searching
  charaTokens: string[];
  seriesTokens: string[];
}

// --------------------
// Dexie DB
// --------------------

const db = new Dexie('Collection') as Dexie & {
  collection: EntityTable<Card, 'code'>;
  toUpload: EntityTable<Card, 'code'>;
};

// NOTE: you mentioned needing to bump version when adding tokens.
// This reflects the version as you pasted it (v1).
db.version(1).stores({
  collection: '&code, number, edition, series, grabber, obtainedTimestamp, charaTokens*, seriesTokens*',
  toUpload: '&code, number, edition, series, grabber, obtainedTimestamp, charaTokens*, seriesTokens*',
});

db.version(2).stores({
  collection: '&code, number, edition, series, grabber, obtainedTimestamp, charaTokens*, seriesTokens*,quality,frame,dye_name,worker_effort,worker_toughness,  worker_quickness,  worker_purity,  worker_dropper,  worker_grabber',
  toUpload: '&code, number, edition, series, grabber, obtainedTimestamp, charaTokens*, seriesTokens*,quality,frame,dye_name,worker_effort,worker_toughness,worker_quickness,  worker_purity,  worker_dropper,  worker_grabber',
});


// --------------------
// Token helpers
// --------------------

function makeTokens(text: unknown): string[] {
  const s = String(text ?? "").toLowerCase();
  return s
    .split(/[^a-z0-9@]+/g)   // keep @ if you want
    .filter(Boolean);
}

// --------------------
// Upload handler
// --------------------

export const handleUpload = async (
  file: File | null,
  signals?: progressSignal
): Promise<boolean> => {
  if (!file) return false;
  if (!file.name.endsWith('.csv')) return false;

  const rowCount = await countRows(file);
  signals?.updateRowCount?.(rowCount);

  const buffer: Card[] = [];
  const BATCH_SIZE = 500;

  let writePromise = Promise.resolve();

  Papa.parse<Card>(file, {
    header: true,
    transformHeader: (header) => {
      return header.replace(/\./g, '_').toLowerCase();
    },
    skipEmptyLines: true,
    dynamicTyping: true,
    worker: false,//do we?

    step: (row) => {
      // IMPORTANT: token generation needs to happen before bulkPut
      const card = row.data;

      buffer.push({
        ...card,
        charaTokens: makeTokens(card.character),
        seriesTokens: makeTokens(card.series),
      });

      if (buffer.length >= BATCH_SIZE) {
        const batch = buffer.splice(0);
        writePromise = writePromise.then(async () => {
          await db.toUpload.bulkPut(batch);
        });
        buffer.length = 0;
      }
    },

    complete: async () => {
      await writePromise;

      // if more buffer cards exist, push them
      if (buffer.length) {
        await db.toUpload.bulkPut(buffer);
      }

      // atomic commit from backup to collection
      await db.transaction('rw', db.collection, db.toUpload, async () => {
        await db.collection.clear();
        const staged = await db.toUpload.toArray();
        await db.collection.bulkPut(staged);
        await db.toUpload.clear();
      });

      signals?.updateValid?.(true);

      const count = await db.collection.count();
      console.log('Cards in DB:', count);
    },

    error: (err) => {
      console.error(err);
    }
  });

  return true;
};

// --------------------
// Utility: count rows
// --------------------

async function countRows(file: File | null): Promise<number> {
  if (!file) return 0;

  return new Promise((resolve, reject) => {
    let rowCount = 0;

    Papa.parse(file, {
      skipEmptyLines: true,
      step: () => rowCount++,
      complete: () => resolve(rowCount),
      error: reject
    });
  });
}

export type { Card };
export { db };
export default handleUpload;

