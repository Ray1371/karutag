
// MainMenu.tsx
// Primary UI + orchestration component
// Handles uploads, search input, and displaying cards

import {useContext} from 'react';
import { optionsContext } from './App';
import Navbar from "./Navbar";

import CollectionTable from "./CollectionTable";
import SelectedTable from "./SelectedTable";

import './App.css';
import { useEffect, useState, useMemo } from 'react';

import { useLiveQuery } from 'dexie-react-hooks';

// import handleUpload, { db } from './Upload';
import {db} from './Upload';
import type { Card } from './Upload';


import { searchCards,
         TEXT_KEYS,
         NUMERIC_KEYS,
 } from './regexStuff';

// -----------------------------

export default function MainMenu() {
//Sorting logic
  type SortDir = 'asc' | 'desc';
  type SortKey = 'wishlists' | 'character' | 'series' | 'edition' | 'number' | 'tag' | 'quality' | 'worker.effort' | 'maxeffort' | 'frame' | 'dye_name';

  // Upload-related state
  // const [_selectedFile, setSelectedFile] = useState<File | null>(null);
    const [_selectedFile] = useState<File | null>(null);
  const [isUploading] = useState(false);
  const [rowCount] = useState(0);
  const [cardsUpdated] = useState(0);

  // Search-related state
  const [searchFilter, setSearchFilter] = useState('');
  const [filteredCards, setFilteredCards] = useState<Card[]>([]);
  
  //Select-related state
  const [selected, setSelected] = useState<Set<string>>(new Set());

  //singleton state
  const [isSingleton, setIsSingleton] = useState(false);

  //sort states
  const [sortKey, setSortKey] = useState<SortKey>('wishlists');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  //bulk clicked state
  const [bulkRecentlyClicked, setBulkRecentlyClicked] = useState(false);

  //WL limit state
  const [wlLimit, setWlLimit] = useState(100);

  // Full collection (live)
  const fullCollection = useLiveQuery(
    () => db.collection.toArray(),
    [],
    []
  );

  const selectedCards =
  (fullCollection ?? []).filter((c) => selected.has(c.code));



  function compareUnknown(a: unknown, b: unknown): number {
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    const sa = String(a ?? '').toLowerCase();
    const sb = String(b ?? '').toLowerCase();
    return sa.localeCompare(sb);
  }

  function getSortValue(card: Card, key: SortKey): unknown {
    switch (key) {
      case 'wishlists': return card.wishlists;
      case 'number': return card.number;
      case 'character': return card.character;
      case 'series': return card.series;
      case 'edition': return card.edition;
    }
  }

  function sortCards(cards: Card[], key: SortKey, dir: SortDir): Card[] {
    const mul = dir === 'asc' ? 1 : -1;
    return [...cards].sort((a, b) => mul * compareUnknown(getSortValue(a, key), getSortValue(b, key)));
  }

  const sortedFilteredCards = useMemo(
  () => sortCards(filteredCards, sortKey, sortDir),
  [filteredCards, sortKey, sortDir]
);

const sortedSelectedCards = useMemo(
  () => sortCards(selectedCards, sortKey, sortDir),
  [selectedCards, sortKey, sortDir]
);

function toggleSort(nextKey: SortKey) {
  if (nextKey === sortKey) {
    setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
  } else {
    setSortKey(nextKey);
    setSortDir(nextKey === 'wishlists' || nextKey === 'number' ? 'desc' : 'asc');
  }
}






  // -----------------------------
  // Filtering logic (older style)
  // -----------------------------
  useEffect(() => {
    if (!fullCollection) return;

    // Empty search = show everything
    if (!searchFilter.trim()) {
      setFilteredCards(fullCollection);
      return;
    }

    const parsed = searchCards(searchFilter);
    console.log(parsed);

    //Filters still not working as intended
    const query = db.collection.filter(card => {

      for (const clause of parsed.clauses) {
        const field = clause.field as keyof Card;

        if(TEXT_KEYS.has(clause.field)) {

          if (field === 'character') {
            // const hay = (card.character ?? '').toLowerCase();
            const hay = String(card.charaTokens ??"" ).toLowerCase();
            const needle = String(clause.value ??"" ).toLowerCase();
            // const needle = clause.value.toString().toLowerCase();
            if (!hay.includes(needle)) return false;
          }
          else if (field === 'series') {
            // const hay = (card.series ?? '').toLowerCase();
            const hay = String(card.seriesTokens ??"" ).toLowerCase();
            const needle = clause.value.toString().toLowerCase();
            if (!hay.includes(needle)) return false;
          }

          else if(field === 'tag'){
            //if field is tag, then check if tag exactly matches (lowercase)
            //todo:handle tag is none / tag:none case
            //idk about const tag below atm
            const tag = card.tag ?? '';
            if(clause.value.toString().toLowerCase() === 'none')
            {
              if(tag !== '' || tag.toString().toLowerCase() !== 'none') 
                return false;
            }
            //normal tag check
            else{
              if(tag.toLowerCase() !== clause.value.toString().toLowerCase()
                // || clause.value.toString().toLowerCase() === 'none'  
              )
                return false;
            }
          }
        }
        else if (NUMERIC_KEYS.has(clause.field)) {
            const cardVal = card[field];
            if (typeof cardVal !== 'number') return false;

            switch (clause.operator) {
              case '<':
                if (!(cardVal < clause.value)) return false;
                break;
              case '<=':
                if (!(cardVal <= clause.value)) return false;
                break;
              case '=':
                if (!(cardVal === clause.value)) return false;
                break;
              case '>':
                if (!(cardVal > clause.value)) return false;
                break;
              case '>=':
                if (!(cardVal >= clause.value)) return false;
                break;
            }
        }
        //Clause field was invalid
        else {
          return false;
        }
      }
      //idk
      return true;
    });
      
    query.toArray().then(setFilteredCards);
  }, [searchFilter, fullCollection]);


  //Select all cards and toggle
      const allSelected =
      filteredCards.length > 0 &&
      filteredCards.every(c => selected.has(c.code));

    function toggleSelectAll() {
      setSelected(prev => {
        const next = new Set(prev);
        const codes = filteredCards.map(c => c.code);
        const prevAll = codes.length > 0 && codes.every(code => next.has(code));

        if (prevAll) {
          codes.forEach(code => next.delete(code));
        } else {
          codes.forEach(code => next.add(code));
        }
        return next;
      });
    }

  function toggleOne(code: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  }

  //bulk button
  //todo: add tooltip explaining what it does
  function addBulk(){
    setSelected(prev => {
      const next = new Set(prev);
      filteredCards.forEach(card => {
        if(
          (card.tag === '' || card.tag === null) && // Not tagged
          ( card.wishlists <= wlLimit) && // 100 or less wishlists
          (card.number >= 1001) // Print is 1001 or above
        )
          next.add(card.code);
      });
      return next;
  })};


  const autoAddBulkAriaLabel = `Auto-Add Bulk button adds all untagged cards 
  with 100 (by default) or fewer wishlists 
  and print number above 1000 to the selection.`;


  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div id='collection-table' className="main-menu">
      <Navbar />
      <h1>Karuta Collection</h1>

      {/* Upload */}
      {/* todo: remove margin from first-row elements */}
      <span className='first-row'>
        {/* <input
          type="file"
          accept=".csv"
          onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
        /> */}



        {/* Auto-Add Bulk Button and input*/}
        <input
          className="wider-input bulk-input"
          type="number"
          placeholder="WL Limit"
          value={wlLimit}
          onChange={(e) => setWlLimit(Number(e.target.value))}
        />
        <button 
          disabled={bulkRecentlyClicked}
          onClick={()=>{
            addBulk();
            setBulkRecentlyClicked(true);
            setTimeout(() => setBulkRecentlyClicked(false), 5000);
          }}
          // todo? Keep button size consistent between the states
        aria-label={autoAddBulkAriaLabel}>
          {bulkRecentlyClicked ? 'Added Bulk' 
          :
           'Auto-Add Bulk'}
        </button>
        {/* Bulk tooltip button */}
        {/* Plan: make tooltip appear on mouseover(or click for mobile) */}
        <button
          className="bulk-tooltip-button"
          aria-label={autoAddBulkAriaLabel}
          data-tooltip="Press to select all cards within:
          w<=[WL Limit](default 100) p>=1001 t:none
          ."
        >
          ?
        </button>

        {/* singleton toggle button */}
        <button 
          className="singleton"
          onClick={() => setIsSingleton(!isSingleton)}
        >
          {isSingleton ? 'Singleton Mode: ON' : 'Singleton Mode: OFF'}
        </button>

        <button
          className="singleton-tooltip-button"
          data-tooltip="If enabled, each card gets its own tagging message"
          >?</button>
      </span>

              {/* Search */}
        <input
        className="wider-input"
          type="text"
          placeholder="Search cards..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
        />
      {/* Table */}
      <CollectionTable
        cards={sortedFilteredCards}
        selected={selected}
        onToggleOne={toggleOne}
        allSelected={allSelected}
        onToggleSelectAll={toggleSelectAll}
        sortKey={sortKey}
        sortDir={sortDir}
        onToggleSort={toggleSort}
      />


{/* todo: left align the collection div */}
      <div>
        Total Cards in Collection: {fullCollection?.length ?? 0}
      </div>

{/* Table for Selected Cards */}
    <h2>Selected Cards ({selectedCards.length})</h2>
    <SelectedTable
      // cards={selectedCards}
        cards={sortedSelectedCards}
       selected={selected}
       onToggleOne={toggleOne}
        isSingleton={isSingleton}
        sortKey={sortKey}
         sortDir={sortDir}
         onToggleSort={toggleSort}
    />

      {/* Upload progress */}
      {isUploading && (
        <div>
          Uploaded {cardsUpdated} / {rowCount}
        </div>
      )}
    </div>
  );
}
