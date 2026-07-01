import type { Card } from "./Upload";
import { useState } from "react";
import {db} from './Upload';
import './index.css'
import calcMaxEffort from "./maxEffort";
import { WishlistStarButton } from './Wishlist';

import { useContext } from "react";
import { optionsContext, TagListContext } from "./App";
import { IoIosSearch } from "react-icons/io"; 
import Select from 'react-select';
// import { TbPrompt } from "react-icons/tb";

type SelectedTableProps = {
  cards: Card[];
  selected: Set<string>;
  onToggleOne: (code: string) => void;
    sortKey: 
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
    | 'dye_name';

    sortDir: 'asc' | 'desc';
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
      | 'dye_name'
    ) => void;
    isSingleton: boolean;
};

// Prompt types for Tag and Sale message generation
type TagPrompt = {
  id: string;
  tag: string;
  codes: string[];
  message: string;
  isSingleton?: boolean;
};

type SalePrompt = {
  id: string;
  message: string;
};

const TagMessage = (props: { 
    message: string;
    tag: string;
    codes: string[];
    onDiscard: () => void;
    isSingleton?:boolean;    
  }) => {
  const[clicked, setClicked] = useState(false);
  const[applied, setApplied] = useState(false);
  //todo?: Maybe let the most recent TM be green. How to do that?
  const handleClick = () => {
    if(clicked === true) 
      props.onDiscard();//prevent multiple clicks within timeout
    setClicked(true);
    //delay for 5 seconds then reset clicked to false
    setTimeout(() => {
      setClicked(false);
    }, 5000);
  }
  //idk if need async yet,cpt suggested 
  const applyChange = async() => {
    //split message into array of codes
    const codes = props.message.split(' ');


console.log("Matched rows:");
    await db.transaction('rw', db.collection, async() => {
      await db.collection
        .where('code')
        .anyOf(codes)
        .modify({ tag: props.tag });
    });
    //todo: Verify that changes applied, ensure UI picks this up too.
    
  }



  return (
    <div className="tagMessageDiv">
      <button
        tabIndex={-1}
        onClick={() => {
          navigator.clipboard.writeText(`kt ${props.tag} ${props.message}`);
          handleClick();
        }}
        onDoubleClick={async () => {
          await applyChange();
          setApplied(true);
          setTimeout(() => {
            setApplied(false);
          }, 5000);
        }}
      >
        <div>
          <p>kt {props.tag} {props.message}</p>
          {clicked === true ?
            <p>Copied!</p>
            :
            <p>Click to copy, double-click to apply the tag</p>
          }
        </div>
      </button>
      <div>
        {/* todo: Implement apply change event */}
        <button 
        tabIndex={-1}
        onClick={() => {
          applyChange();
          setApplied(true);
          setTimeout(() => {
            setApplied(false);
          }, 5000);
        }}
        disabled={applied}
        >Apply Change</button>
        {/* todo: Implement discard change event = just close this box. */}
        <button tabIndex={-1} onClick={props.onDiscard}>Discard Change / Close This Box</button>
      </div>
    </div>
  );
}
//Component that is generated.

const SaleMessage = (
  props: SalePrompt & { onDiscard: () => void }
) => {
  const [clicked, setClicked] = useState(false);

  const handleClick = () => {
    if (clicked === true) props.onDiscard();
    setClicked(true);
    setTimeout(() => setClicked(false), 5000);
  };

  const lines = props.message
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const payload = lines.join('\n');
  const excelLines = lines.map((line) => {
    const match = line.match(/^(.+?) ❤️(.+?) (.+?) - (.+?) - #(.+?) ◈(.+)$/);
    if (!match) return line;

    const [, code, wishlists, name, series, print, edition] = match;
    return [code, wishlists, name, series, print, edition].join('\t');
  });
  const excelPayload = excelLines.join('\n');

  return (
    <div className="saleMessageDiv">
      <button
        tabIndex={-1}
        onClick={() => {
          navigator.clipboard.writeText(payload);
          handleClick();
        }}
      >
        <div>
          {lines.map((l, idx) => (
            <p key={idx}>{l}</p>
          ))}
          {clicked === true ? <p>Copied!</p> : <p>Click to copy above message</p>}
        </div>
      </button>
      <div>
        <button tabIndex={-1} onClick={props.onDiscard}>Discard / Close</button>
        <button tabIndex={-1} onClick={() => navigator.clipboard.writeText(excelPayload)}>
          Copy Excel Format
        </button>
      </div>
    </div>
  );
};

export default function SelectedTable({
  cards,
  selected,
  onToggleOne,
  sortKey,
  sortDir,
  onToggleSort,
  isSingleton,
}: SelectedTableProps) {
  if (cards.length === 0) {
    return <div>No cards selected.</div>;
  }


  //state to hold tag message components. Would like these to persist across user sessions until cleared or user re-uploads collection.
const [tagMessages, setTagMessages] = useState<TagPrompt[]>([]);
const [tagName, setTagName] = useState('');

  const [saleMessages, setSaleMessages] = useState<SalePrompt[]>([]);
  const [newTagsByCode, setNewTagsByCode] = useState<Record<string, string>>({});

//todo: style borders onto the generated components
//todo: implement so that if user clicks message while applied is true, auto-closes the component after copying

  const generatePrompts = (tag:string, isSingleton: boolean, codes?: string[]) => {
    //get all card codes from selected set
    let selectedCards: string[] = [];
    // selected.forEach((code) => {
    for(const code of codes ?? selected) {
      selectedCards.push(code);
    };

    const prompts:TagPrompt[] = [];
    let chunk: string[] = [];

    if(isSingleton) {
      while(selectedCards.length > 0) {
        chunk.push(selectedCards.shift()!);
        //create prompt for each individual card
        prompts.push({
          id: crypto.randomUUID(),
          tag: tag,
          codes: [...chunk],               // ✅ the real source of truth
          message: chunk.join(" "),        // whatever you want to display/copy
        });
        chunk = [];
      }
    }
    //split into chunks of 50 instead
    else{
      while (selectedCards.length > 0) {//while or do while?
        chunk.push(selectedCards.shift()!);
        //if maxed out chunk, force push the tag message component,
        //flush chunk, keep going if applicable
        if(chunk.length === 50) {
          prompts.push({
            id: crypto.randomUUID(),
            tag: tag,
            codes: [...chunk],               // ✅ the real source of truth
            message: chunk.join(" "),        // whatever you want to display/copy
          });
    
          chunk = [];   
        }
      };
      //handle leftover chunk
        if (chunk.length > 0) {
          prompts.push({
            id: crypto.randomUUID(),
            tag: tag,
            codes: [...chunk],               // ✅ the real source of truth
            message: chunk.join(" "),        // whatever you want to display/copy

          });

        }
    }
    setTagMessages(prev => [...prev, ...prompts]);
  };

  const generateSellMessages = () => {
    const prompts: SalePrompt[] = [];
    const maxChars = 2000;
    const currentBatch: string[] = [];
    let currentBatchLength = 0;

    const flushBatch = () => {
      if (currentBatch.length === 0) return;

      prompts.push({
        id: crypto.randomUUID(),
        message: currentBatch.join('\n'),
      });

      currentBatch.length = 0;
      currentBatchLength = 0;
    };

    selected.forEach((code) => {
      const card = cards.find((c) => c.code === code);
      if (!card) return;

      const line = `${card.code} ❤️${card.wishlists} ${card.character} - ${card.series} - #${card.number} ◈${card.edition}`;
      const nextBatchLength = currentBatchLength + (currentBatchLength === 0 ? 0 : 1) + line.length;

      if (currentBatchLength > 0 && nextBatchLength > maxChars) {
        flushBatch();
      }

      currentBatch.push(line);
      currentBatchLength = currentBatch.length === 1 ? line.length : nextBatchLength;
    });

    flushBatch();

    if (prompts.length > 0) {
      setSaleMessages((prev) => [...prev, ...prompts]);
    }
  };
  const {
      condensedTable,
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

  const tagList = useContext(TagListContext);

  const handleRowSearch = (url: string, button: HTMLButtonElement) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    const currentCell = button.closest('td');
    const nextCell = currentCell?.nextElementSibling as HTMLElement | null;
    const nextInput = nextCell?.querySelector<HTMLInputElement>('input');
    nextInput?.focus();
  };

  const newTagPromptGenerator = () => {
    // Implementation for generating new tag prompts
    // let tagMessages: TagPrompt[] = [];
    type TagCodes = {
      tag:string;
      codes:string[];
    }
    let tagCodes: TagCodes[] = [];


    for (const code of Object.keys(newTagsByCode)) {
      // Generate a new tag prompt for each code
      //if no tag was given, skip
      if (!newTagsByCode[code]?.trim()) {
        continue;
      }
      //if there's no TagCode for the tag, create it
      if(!tagCodes.some(tag => tag.tag === newTagsByCode[code])) {
        //TODO: still need to add the rest of the structure
        tagCodes.push({
          tag: newTagsByCode[code],
          codes: [code]
        });
      }
      else {
        //if there is a TagCode for the tag, add the code to it
        const existingTag = tagCodes.find(tag => tag.tag === newTagsByCode[code]);
        if(existingTag) {
          existingTag.codes.push(code);
        }
      }
    }
    for (const tagCode of tagCodes) {
      // Plan: Generate prompts given the tagCode, while still accounting for singleton toggle;
      //might need to remake due to the original method lazily doing all the one tag for all messages at once.
      generatePrompts(tagCode.tag, isSingleton, tagCode.codes);
    }
  };



  return (
    <div id='selected-table'>
    <table className=
      {condensedTable ? "card-table condensed" : "card-table"}
    >
      <thead>
        <tr>
                  <th scope="col" className="col-search"></th>

          <th scope="col"
            className="col-check"
          >Selected</th>
          <th className="col-code">Code</th>
          <th className="col-wl">
            WLs
            <button tabIndex={-1} onClick={() => onToggleSort('wishlists')}>
              {sortKey === 'wishlists' ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
            </button>
            </th>
          <th className="col-name">
            <button tabIndex={-1} onClick={() => onToggleSort('character')}>
              {sortKey === 'character' ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
            </button>
            Character
          </th>
          <th className="col-series">
            <button tabIndex={-1} onClick={() => onToggleSort('series')}>
              {sortKey === 'series' ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
            </button>
            Series
          </th>
          <th className='col-edition'>
            <button tabIndex={-1} onClick={() => onToggleSort('edition')}>
              {sortKey === 'edition' ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
            </button>
            Ed.
          </th>
          <th className='col-print'>
            <button tabIndex={-1} onClick={() => onToggleSort('number')}>
              {sortKey === 'number' ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
            </button>
            Print
          </th>
          <th className='col-tag'>
            <button tabIndex={-1} onClick={() => onToggleSort('tag')}>
              {sortKey === 'tag' ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
            </button>
            Tag
          </th>
{/* todo: learn about how to let users pick and choose which columns to see */}
          {!hideQuality && <th className='col-quality'>
            <button tabIndex={-1} onClick={() => onToggleSort('quality')}>
              {sortKey === 'quality' ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
            </button>
            Quality
          </th>}
          {/* <th className='col-quality'>Quality</th> */}
          {!hideEffort && <th className='col-effort'>
            <button tabIndex={-1} onClick={() => onToggleSort('worker.effort')}>
              {sortKey === 'worker.effort' ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
            </button>
            Effort
          </th>}
          {!hideToughness && <th className='col-toughness'>Toughness</th>}
          {!hideEffort && <th className='col-maxeffort'>
            <button tabIndex={-1} onClick={() => onToggleSort('maxeffort')}>
              {sortKey === 'maxeffort' ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
            </button>
            Max Effort
          </th>}
          {!hideFrame && <th className='col-frame'>
            <button tabIndex={-1} onClick={() => onToggleSort('frame')}>
              {sortKey === 'frame' ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
            </button>
            Frame
          </th>}
          {!hideDye && <th className='col-dye'>
            <button tabIndex={-1} onClick={() => onToggleSort('dye_name')}>
              {sortKey === 'dye_name' ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
            </button>
            Dye
          </th>}

          <th>
            <p>Tag All Below As:</p>

            <Select
              className="select-tag-dropdown"
              classNamePrefix="react-select"
              isClearable={true}
              placeholder="Select/Type tag?"
              isSearchable={true}
              options={tagList.map(tag => ({ value: tag, label: tag }))}
              value={tagName ? { value: tagName, label: tagName } : null}
              onChange={(selectedOption) => setTagName(selectedOption?.value ?? '')}
            />

            <button tabIndex={-1} onClick={() => generatePrompts(tagName, isSingleton)}>Tag All </button>
            <button tabIndex={-1} onClick={() => generateSellMessages()}>Generate Sale Messages</button>
            <button tabIndex={-1} onClick={() => newTagPromptGenerator()}>Set New Tags</button>


          </th>

          <th className='col-newtag'>New Tag? </th>

          
        </tr>
      </thead>

      <tbody>
        {cards.map((card) => (
          <tr key={card.code}>
            <td className="col-search">
              <button tabIndex={-1} onClick={(event) => handleRowSearch(`https://www.google.com/search?tbm=isch&q=${generateSearchString(card)}`, event.currentTarget)}>
                <IoIosSearch />
              </button>
            </td>
            <td
              className="col-check"
            >
              <input
                type="checkbox"                tabIndex={-1}                aria-label={`Deselect ${card.character}`}
                checked={selected.has(card.code)}
                onChange={() => onToggleOne(card.code)}
                className="col-check"
              />
              <WishlistStarButton
                name={card.character}
                series={card.series}
                edition={card.edition}
              />
            </td>

            <td className="col-code">{card.code}</td>
            <td className="col-wl">{card.wishlists}</td>
            <td 
              onClick={()=>navigator.clipboard.writeText(card.character)}
              className="col-name">{card.character}</td>
            <td 
              onClick={()=>navigator.clipboard.writeText(card.series)}
              className="col-series">{card.series}</td>
            <td className="col-edition">{card.edition}</td>
            <td className="col-print">{card.number}</td>
            <td className="col-tag">{card.tag}</td>
            {!hideQuality && <td className='col-quality'>{card.quality}</td>}
            {!hideEffort && <td className='col-effort'>{card.worker_effort}</td>}
            {/* todo: go back to upload.tsx and fix up worker fields if needed */}
            {!hideToughness && <td className='col-toughness'>{card.worker_toughness}</td>}
            {!hideEffort && <td className='col-maxeffort'>{(() => {
                const [reg, mystic] = card.regMaxEffort != null && card.mysticMaxEffort != null
                  ? [card.regMaxEffort, card.mysticMaxEffort]
                  : card.worker_effort != null
                    ? calcMaxEffort(card)
                    : [null, null];
                return reg != null ? <>{reg}{mystic != null ? <> (<strong>{mystic}</strong>)</> : ''}</> : '';
              })()}</td>}
            {!hideFrame && <td className='col-frame'>{card.frame}</td>}
            {!hideDye && <td className='col-dye'>{card.dye_name}</td>}

              <td className='col-newtag'>
                  {/* <input 
                  name={`newTag-${card.code}`} 
                  id={`newTag-${card.code}`}
                  type='text' 
                  placeholder='Enter new tag?' 
                  autoComplete='tags'
                  list='tagList'
                  value={newTagsByCode[card.code] ?? ''}
                  tabIndex={0}
                  onChange={(e) => {
                    setNewTagsByCode((prev) => ({
                      ...prev,
                      [card.code]: e.target.value,
                    }));
                  }}
                  /> */}
                  <Select
                    className="select-tag-dropdown"
                    classNamePrefix="react-select"
                    isClearable={true}
                    placeholder="Select/Type Tag?"
                    isSearchable={true}
                    options={tagList.map(tag => ({ value: tag, label: tag }))} //cpt
                    onChange={(selectedOption) => {
                      setNewTagsByCode((prev) => ({
                        ...prev,
                        [card.code]: selectedOption?.value ?? '',
                      }));
                    }}

                  />
            </td>

          </tr>
        ))}
      </tbody>
    </table>
    <datalist id="tagList">
      {tagList.map((option) => (
        <option key={option} value={option} />
      ))}
    </datalist>
    <div id='tag-messages'
      className="pageBottomSpacer" />
     {tagMessages.length > 0 && (
      <div>
        {tagMessages.map((p) => (
          <TagMessage
            key={p.id}
            message={p.message}
            tag={p.tag}
            codes={p.codes}
            onDiscard={() =>
              setTagMessages((prev) => prev.filter((x) => x.id !== p.id))
            }
          />
        ))}
      </div>
    )} 
    {saleMessages.length > 0 && (
      <div>
        {saleMessages.map((p) => (
          <SaleMessage
            key={p.id}
            id={p.id}
            message={p.message}
            onDiscard={() => setSaleMessages((prev) => prev.filter((x) => x.id !== p.id))}
          />
        ))}
      </div>
    )}
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
