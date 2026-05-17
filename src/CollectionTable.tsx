import { useState,useEffect,useContext } from "react";
import type { Card } from "./Upload";
import './index.css'
import calcMaxEffort from "./maxEffort";
import { IoIosSearch } from "react-icons/io";
import { optionsContext

 } from "./App";
type CollectionTableProps = {
  cards: Card[];
  selected: Set<string>;
  onToggleOne: (code: string) => void;
  allSelected: boolean;
  onToggleSelectAll: () => void;
  sortKey: string;
  sortDir: string;
  onToggleSort: (key: 
    'wishlists' 
    | 'character' 
    | 'series' 
    | 'edition' 
    | 'number'
    | 'tag'

    | 'quality' 
    | 'worker.effort'
    | 'maxeffort'
    | 'frame'
  ) => void;
};

export default function CollectionTable({
  cards,
  selected,
  onToggleOne,
  allSelected,
  onToggleSelectAll,
  sortKey,
  sortDir,
  onToggleSort
}: CollectionTableProps) {
    //pagination component state
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 20;//change when ready to implement dynamic cards per page
  // const [cardsPerPage, setCardsPerPage] = useState(20);
  const [displayedCards, setDisplayedCards] = useState<Card[]>([]);//cards to show on current page, unsure if wanted this way



  useEffect(() => {
    //take current page and cards per page to set displayed cards
    const firstCardIndex = (currentPage - 1) * cardsPerPage;
    const lastCardIndex = firstCardIndex + cardsPerPage;
    setDisplayedCards(cards.slice(firstCardIndex, lastCardIndex));
    
  },[currentPage,cards]);
  const maxPage = Math.ceil(cards.length / cardsPerPage);
  useEffect(() => {
  if (maxPage === 0) return;
  if (currentPage > maxPage) setCurrentPage(maxPage);
  if (currentPage < 1) setCurrentPage(1);
}, [maxPage, currentPage]);

  // const context = useContext(optionsContext);
  const {
      condensedTable,
      // setCondensedTable,
      // hideWishlists,
      // setHideWishlists,
      hideToughness,
      // setHideToughness,
      hideDye,
      // setHideDye,
      hideFrame,
      // setHideFrame,
      hideEffort,
      // setHideEffort,
      hideQuality,
      // setHideQuality
  } = useContext(optionsContext);

  
  
  return (
  <div id='collection-table'>
    <table className={
      condensedTable ? "card-table condensed" : "card-table"
    }
    >
      <thead
        className="header-bar"
      >
        <tr
        >
          <th className="col-search">
            Google Image Search
          </th>
          <th scope="col"
            className="col-check"
          >
            <input
              type="checkbox"
              aria-label="Select all cards"
              checked={allSelected}
              onChange={onToggleSelectAll}
              
            />
          </th>
          <th className="col-code">Code</th>
          <th className="col-wl">
            <button onClick={() => onToggleSort('wishlists')}>
              {sortKey === 'wishlists' ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
            </button>
             WLs
            </th>
{/* todo here: make the search button */}



          <th className="col-name">
          <button onClick={() => onToggleSort('character')}>
              {sortKey === 'character' ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
            </button>
            Character</th>
          <th className="col-series">
            <button onClick={() => onToggleSort('series')}>
              {sortKey === 'series' ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
            </button>
            Series</th>
          <th className='col-edition'>Ed.</th>
          <th className='col-print'>Print</th>

          <th className='col-tag'>Tag
            {sortKey === 'tag' && (
              <button onClick={() => onToggleSort('tag')}>
                {sortKey === 'tag' ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
              </button>
            )}
          </th>


          {/* {!hideEffort && (
            <th className='col-effort'>Effort
              <button onClick={() => onToggleSort('worker.effort')}>
                {sortKey === 'effort' ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
              </button>
            </th>
          )} */}
          {!hideQuality && (
            <th className='col-quality'>Quality
              <button onClick={() => onToggleSort('quality')}>
                {sortKey === 'quality' ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
              </button>
            </th>
          )}
          {!hideToughness && (
            <th className='col-toughness'>Tough</th>
          )}
          {!hideEffort && (
            <th className='col-effort'>Effort
              <button onClick={() => onToggleSort('worker.effort')}>
                {sortKey === 'effort' ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
              </button>
            </th>
          )}
          {!hideEffort && (
            <th className='col-maxeffort'>Max Effort
              <button onClick={() => onToggleSort('maxeffort')}>
                {sortKey === 'maxeffort' ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
              </button>
            </th>
          )}
          {!hideFrame && (
            <th className='col-frame'>Frame
              <button onClick={() => onToggleSort('frame')}>
                {sortKey === 'frame' ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
              </button>
            </th>
          )}
          {!hideDye && (
            <th className='col-dye'>Dye
            
            </th>
          )}
        </tr>
      </thead>

      <tbody >
        {
          displayedCards.map((card) => (
            <tr key={card.code} 
            className={`align-text-left`}
            >
              <td>
                <button onClick={() => 
                  {
                    open(`https://www.google.com/search?tbm=isch&q=${generateSearchString(card)}`)
                  }
                }>
                  <IoIosSearch />
                </button>
              </td>
              <td>
                <input
                  type="checkbox"
                  aria-label={`Select ${card.character}`}
                  checked={selected.has(card.code)}
                  onChange={() => onToggleOne(card.code)}
                  className="col-check"
                />
              </td>
              <td className="code-column">{card.code}</td>
              <td className="col-wl">{card.wishlists}</td>
              <td 
                onClick={()=>navigator.clipboard.writeText(card.series)}
                className="col-name">{card.character}</td>
              <td 
                onClick={()=>navigator.clipboard.writeText(card.series)}
                className="col-series">{card.series}</td>
              <td className='col-edition'>{card.edition}</td>
              <td className='col-print'>{card.number}</td>
              <td className='col-tag'>{card.tag}</td>

              {!hideEffort && (
                <td className='col-effort'>{card.worker_effort}</td>
              )}
              {!hideQuality && (
                <td className='col-quality'>{card.quality}</td>
              )}
              {/* todo: go back to upload.tsx and fix up worker fields if needed */}
              {!hideToughness && (
                <td className='col-toughness'>{card.worker_toughness}</td>
              )}
              {!hideEffort && (
                <td className='col-maxeffort'>{card.worker_effort ? calcMaxEffort(card) : ''}</td>
              )}
              {!hideFrame && (
                <td className='col-frame'>{card.frame}</td>
              )}
              {!hideDye && (
                <td className='col-dye'>{card.dye_name}</td>
              )}
            </tr>
          ))
        }

      </tbody>
    </table>

    <div>

    <PageDiv
      pageNumber={currentPage}
      setCurrentPage={setCurrentPage}
      maxPage={maxPage}
    />
    </div>

  </div>
  );
}


const PageDiv = ({
  pageNumber,
  setCurrentPage,
  maxPage}: {
    pageNumber: number,
    setCurrentPage: (page:number) => void,
     maxPage: number}) => {
  const [jumpPage, setJumpPage] = useState<number | ''>('');
  return(
  <div>
    {/* First page */}
    {maxPage <= 3 &&
      <button 
        onClick={() => setCurrentPage(1)} 
        disabled={pageNumber === maxPage || pageNumber == 1}>
        1 
      </button>
    }

    {/* If only 2 pages... */}
    {maxPage === 2 &&
      <button 
        onClick={() => setCurrentPage(1)} 
        disabled={pageNumber === 1}>
        2
      </button>
    }
    {/* If more than 2 pages... / Prev Page*/}
    {maxPage > 2 &&
      <button 
        onClick={() => setCurrentPage(Math.min(maxPage,pageNumber - 1))} 
        disabled={pageNumber === 1}>
        {pageNumber - 1}
      </button>
    }

  {/* Page 4 / Next Page  */}
    {maxPage > 3 &&
      <button 
        onClick={() => setCurrentPage(Math.max(1,pageNumber + 1))}
        // todo: check maxPage logic is consistent
        disabled={pageNumber === maxPage || (pageNumber === 3 && maxPage === 4)}>
        {pageNumber + 1}
      </button>
    }
    {/* Last Page */}
    {maxPage > 4 &&
      <button
        onClick={() => setCurrentPage(maxPage)}
        disabled={pageNumber === maxPage}>
        {maxPage}
      </button>
    }
    {/* TextBar + Button Component to Jump Pages */}
    {maxPage > 5 &&
      <div>
        <input 
        type="number" 
        min={1} 
        max={maxPage} 
        value={jumpPage}
        onChange={(e)=>{
          const value = Number(e.target.value);
          setJumpPage(Number.isNaN(value) ? '':value);
        }}/>
        
        {/* todo: bind button/setCurrentPage state to input's value */}
        <button
          onClick={() => {
            if (typeof jumpPage === 'number' && jumpPage >= 1 && jumpPage <= maxPage) {
              setCurrentPage(jumpPage);
            }
          }}
        >
          Go
        </button>
      </div>
    }
  </div>
  );
}

const generateSearchString: (card: Card) => string = (card) => {
  const character = card.character;
  const series = card.series;
  let searchString:string = 
  (character.split(' ').join('+') + '+' + 
  series.split(' ').join('+'));
  return searchString;
}