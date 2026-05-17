import type { Card } from "./Upload";
// import { useState } from "react";
// import Dexie from "dexie";
import { useState, type ChangeEvent } from "react";
import {db} from './Upload';
// import { TaggingBarPortal } from "./TagPortal";
import './index.css'
import calcMaxEffort from "./maxEffort";

import { useContext } from "react";
import { optionsContext } from "./App";


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
  // const context = useContext(optionsContext);


  return (
    <div className="tagMessageDiv">
      <button onClick={() => {
        navigator.clipboard.writeText(`kt ${props.tag} ${props.message}`);
        handleClick();
      }}>
        <div>
          <p>kt {props.tag} {props.message}</p>
          {clicked === true ?
            <p>Copied!</p>
            :
            <p>Click to copy above message</p>
          }
        </div>
      </button>
      <div>
        {/* todo: Implement apply change event */}
        <button 
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
        <button onClick={props.onDiscard}>Discard Change / Close This Box</button>
      </div>
    </div>
  );
}
//Component that is generated.

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
type TagPrompt = { id: string; tag: string; codes: string[]; message: string };
  const [tagMessages, setTagMessages] = useState<TagPrompt[]>([]);
  const [tagName, setTagName] = useState('');
const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
  setTagName(event.target.value);
};

//todo: style borders onto the generated components
//todo: implement so that if user clicks message while applied is true, auto-closes the component after copying

  const generatePrompts = (isSingleton: boolean) => {
    //get all card codes from selected set
    let selectedCards: string[] = [];
    selected.forEach((code) => {
      selectedCards.push(code);
    });



    const prompts:TagPrompt[] = [];
    let chunk: string[] = [];

    if(isSingleton) {
      while(selectedCards.length > 0) {
        chunk.push(selectedCards.shift()!);
        //create prompt for each individual card
        prompts.push({
          id: crypto.randomUUID(),
          tag: tagName,
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
            tag: tagName,
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
            tag: tagName,
            codes: [...chunk],               // ✅ the real source of truth
            message: chunk.join(" "),        // whatever you want to display/copy

          });

        }
    }
    setTagMessages(prev => [...prev, ...prompts]);
  };

  const {
      condensedTable,
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
    <div id='selected-table'>
    <table className=
      {condensedTable ? "card-table condensed" : "card-table"}
    >
      <thead>
        <tr>
          <th scope="col"
            className="col-check"
          >Selected</th>
          <th className="col-code">Code</th>
          <th className="col-wl">
            WLs
            <button onClick={() => onToggleSort('wishlists')}>
              {sortKey === 'wishlists' ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
            </button>
            </th>
          <th className="col-name">Character</th>
          <th className="col-series">Series</th>
          <th className='col-edition'>Ed.</th>
          <th className='col-print'>Print</th>
          <th className='col-tag'>Tag</th>
{/* todo: learn about how to let users pick and choose which columns to see */}
          {!hideQuality && <th className='col-quality'>Quality</th>}
          {/* <th className='col-quality'>Quality</th> */}
          {!hideEffort && <th className='col-effort'>Effort</th>}
          {/* <th className='col-effort'>Effort</th> */}
          {!hideToughness && <th className='col-toughness'>Toughness</th>}
          {!hideEffort && <th className='col-maxeffort'>Max Effort</th>}
          {!hideFrame && <th className='col-frame'>Frame</th>}
          {!hideDye && <th className='col-dye'>Dye</th>}

          <th>
            <p>Tag Selected As:</p>
            <input 
             className="wider-input"
             type="text"
             placeholder="Enter tag name" 
            value={tagName} onChange={handleChange}
            />
            <button onClick={() => generatePrompts(isSingleton)}>Tag Selected</button>
          </th>
          
        </tr>
      </thead>

      <tbody>
        {cards.map((card) => (
          <tr key={card.code}>
            <td
              className="col-check"
            >
              <input
                type="checkbox"
                aria-label={`Deselect ${card.character}`}
                checked={selected.has(card.code)}
                onChange={() => onToggleOne(card.code)}
                className="col-check"
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
            {!hideEffort && <td className='col-maxeffort'>{card.worker_effort ? calcMaxEffort(card) : ''}</td>}
            {!hideFrame && <td className='col-frame'>{card.frame}</td>}
            {!hideDye && <td className='col-dye'>{card.dye_name}</td>}
          </tr>
        ))}
      </tbody>
    </table>
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
    </div>
    
  );
}


// const nameCheck = (name: string | undefined):string => {
//   return name.includes('Mystic') ? 'Mystic Dye' : 'false';
// }