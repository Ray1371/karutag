
// MainMenu.tsx
// Primary UI + orchestration component
// Handles uploads, search input, and displaying cards


import Navbar from "./Navbar";

import CollectionTable from "./CollectionTable";
import SelectedTable from "./SelectedTable";
import Wishlist from './Wishlist';

import './App.css';
import { useEffect, useState, useMemo } from 'react';

import { useLiveQuery } from 'dexie-react-hooks';

import {db} from './Upload';
import type { Card } from './Upload';
import calcMaxEffort from './maxEffort';
import { TagListContext } from './App';

import { searchCards,
         TEXT_KEYS,
         NUMERIC_KEYS,
 } from './regexStuff';

// -----------------------------

export default function MainMenu() {
//Sorting logic
  type SortDir = 'asc' | 'desc';
  type SortKey = 'wishlists' | 'character' | 'series' | 'edition' | 'number' | 'tag' | 'quality' | 'worker.effort' | 'maxeffort' | 'frame' | 'dye_name';

  //todo: pass this to SelectedTable
  //get list of tags for newtag to use
  const [tagList, setTagList] = useState<string[]>([]);



  // Upload-related state
  // const [_selectedFile, setSelectedFile] = useState<File | null>(null);
    const [_selectedFile] = useState<File | null>(null);
  const [isUploading] = useState(false);
  const [rowCount] = useState(0);
  const [cardsUpdated] = useState(0);

  // Search-related state
  const [searchFilter, setSearchFilter] = useState('');
  const [filteredCards, setFilteredCards] = useState<Card[]>([]);

  const handleSearchButtonClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  
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

  // Wishlist view toggle
  const [showWishlist, setShowWishlist] = useState(false);

  // Full collection (live)
  const fullCollection = useLiveQuery(
    () => db.collection.toArray(),
    [],
    []
  );

    useEffect(() => {
    //get collection, then get unique tags
    const cards = fullCollection ?? [];
    const uniqueTags = Array.from(
      new Set(
        cards
          .map((card) => card.tag)
          .filter((tag): tag is string => typeof tag === 'string' && tag.trim() !== '')
      )
    ).sort();

    setTagList(uniqueTags);
  }, [fullCollection]);

  const selectedCards =
  (fullCollection ?? []).filter((c) => selected.has(c.code));

  const suggestedNames = useMemo(
    () =>
      Array.from(
        new Set((fullCollection ?? []).map((card) => card.character))
      ).sort(),
    [fullCollection]
  );

  const suggestedSeries = useMemo(
    () =>
      Array.from(new Set((fullCollection ?? []).map((card) => card.series))).sort(),
    [fullCollection]
  );

  function compareUnknown(a: unknown, b: unknown): number {
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    const sa = String(a ?? '').toLowerCase();
    const sb = String(b ?? '').toLowerCase();
    return sa.localeCompare(sb);
  }

  function getSortValue(card: Card, key: SortKey): unknown {
    switch (key) {
      case 'wishlists':
        return card.wishlists;
      case 'number':
        return card.number;
      case 'character':
        return card.character;
      case 'series':
        return card.series;
      case 'edition':
        return card.edition;
      case 'tag':
        return card.tag ?? '';
      case 'quality':
        return card.quality ?? '';
      case 'frame':
        return card.frame ?? '';
      case 'dye_name':
        return card.dye_name ?? '';
      case 'worker.effort':
        return card.worker_effort ?? 0;
      case 'maxeffort': {
        if (card.regMaxEffort != null) return card.regMaxEffort;
        if (card.worker_effort != null) return calcMaxEffort(card)[0];
        return 0;
      }
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

      <div className="view-toggle-row">
        <button
          type="button"
          className={!showWishlist ? 'active' : ''}
          onClick={() => setShowWishlist(false)}
        >
          Collection
        </button>
        <button
          type="button"
          className={showWishlist ? 'active' : ''}
          onClick={() => setShowWishlist(true)}
        >
          Wishlist
        </button>
      </div>

      {showWishlist ? (
        <Wishlist suggestedNames={suggestedNames} suggestedSeries={suggestedSeries} />
      ) : (
        <>
          <span className='first-row'>
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
              aria-label={autoAddBulkAriaLabel}
            >
              {bulkRecentlyClicked ? 'Added Bulk' : 'Auto-Add Bulk'}
            </button>
            <button
              className="bulk-tooltip-button"
              aria-label={autoAddBulkAriaLabel}
              data-tooltip="Press to select all cards within: w<=[WL Limit](default 100) p>=1001 t:none"
            >
              ?
            </button>
            <button 
              className="singleton"
              onClick={() => setIsSingleton(!isSingleton)}
            >
              {isSingleton ? 'Singleton Mode: ON' : 'Singleton Mode: OFF'}
            </button>
            <button
              className="singleton-tooltip-button"
              data-tooltip="If enabled, each card gets its own tagging message"
            >
              ?
            </button>
          </span>

          <input
            className="wider-input"
            type="text"
            placeholder="Search cards..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
          />

          <CollectionTable
            cards={sortedFilteredCards}
            selected={selected}
            onToggleOne={toggleOne}
            allSelected={allSelected}
            onToggleSelectAll={toggleSelectAll}
            sortKey={sortKey}
            sortDir={sortDir}
            onToggleSort={toggleSort}
            onSearchButtonClick={handleSearchButtonClick}
          />

          <div>
            Total Cards in Collection: {fullCollection?.length ?? 0}
          </div>

          <h2>Selected Cards ({selectedCards.length})</h2>
          <TagListContext.Provider value={tagList}>
            <SelectedTable
              cards={sortedSelectedCards}
              selected={selected}
              onToggleOne={toggleOne}
              isSingleton={isSingleton}
              sortKey={sortKey}
              sortDir={sortDir}
              onToggleSort={toggleSort}
            />
          </TagListContext.Provider>
        </>
      )}

      {isUploading && (
        <div>
          Uploaded {cardsUpdated} / {rowCount}
        </div>
      )}
    </div>
  );
}
