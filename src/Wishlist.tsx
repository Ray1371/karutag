import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './Upload';

// define wishlist collection here
export interface WishlistItem {
  nameseries: string; // name + series combo to be unique
  name: string;
  series: string;
  editions: boolean[]; // maybe just have multiple editions, because it is possible to have multiple editions of the same card in a wishlist.
  hunting?: number;
  comment?: string;
}


export const addWishlist = async (name: string, series: string, edition: number) => {
  const nameseries = `${name}_${series}`;
  const chara = await db.wishlist.get(nameseries);
  if (!chara) {
    const newChara: WishlistItem = {
      nameseries,
      name,
      series,
      editions: [false, false, false, false, false, false, false],
    };
    newChara.editions[edition - 1] = true;
    await db.wishlist.add(newChara);
  }
};

export const removeWishlist = async (name: string, series: string) => {
  return await db.wishlist.where('nameseries').equals(`${name}_${series}`).delete();
};

export const modifyWishlist = async (
  name: string,
  series: string,
  edition?: number,
  hunting?: number,
  comment?: string
) => {
  const nameseries = `${name}_${series}`;
  const chara = await db.wishlist.get(nameseries);
  if (!chara) {
    if (edition !== undefined) {
      await addWishlist(name, series, edition);
    }
  } else {
    await db.wishlist.where('nameseries').equals(nameseries).modify((item) => {
      if (edition !== undefined) {
        item.editions[edition - 1] = !item.editions[edition - 1];
      }
      if (hunting !== undefined) {
        item.hunting = hunting;
      }
      if (comment !== undefined) {
        item.comment = comment;
      }
    });
  }
};

export const toggleWishlistEdition = async (
  name: string,
  series: string,
  edition: number
) => {
  const nameseries = `${name}_${series}`;
  const chara = await db.wishlist.get(nameseries);
  if (!chara) {
    await addWishlist(name, series, edition);
    return;
  }

  const editionIndex = edition - 1;
  const currentlySelected = chara.editions[editionIndex];

  if (currentlySelected) {
    const updatedEditions = [...chara.editions];
    updatedEditions[editionIndex] = false;
    if (updatedEditions.some(Boolean)) {
      await db.wishlist.where('nameseries').equals(nameseries).modify((item) => {
        item.editions[editionIndex] = false;
      });
    } else {
      await removeWishlist(name, series);
    }
  } else {
    await db.wishlist.where('nameseries').equals(nameseries).modify((item) => {
      item.editions[editionIndex] = true;
    });
  }
};

export const updateWishlistEntry = async (
  name: string,
  series: string,
  changes: {
    editions?: boolean[];
    hunting?: number | null;
    comment?: string;
  }
) => {
  const nameseries = `${name}_${series}`;
  const chara = await db.wishlist.get(nameseries);
  if (!chara) {
    if (
      changes.editions?.some(Boolean) ||
      changes.hunting !== undefined ||
      changes.comment !== undefined
    ) {
      await db.wishlist.add({
        nameseries,
        name,
        series,
        editions: changes.editions ?? [false, false, false, false, false, false, false],
        hunting: changes.hunting ?? undefined,
        comment: changes.comment,
      });
    }
    return;
  }

  await db.wishlist.where('nameseries').equals(nameseries).modify((item) => {
    if (changes.editions) {
      item.editions = changes.editions;
    }
    if (changes.hunting !== undefined) {
      item.hunting = changes.hunting === null ? undefined : changes.hunting;
    }
    if (changes.comment !== undefined) {
      item.comment = changes.comment;
    }
  });
};

type wishset = {
  series: string;
  charas: WishlistItem[];
};

export const exportWishlist = async (): Promise<void> => {
  const series: string[] = Array.from(
    new Set((await db.wishlist.toArray()).map((item) => item.series))
  ).sort();
  const sets: wishset[] = [];
  let fullMessage = `MY WISHLIST\n\n`;
  for (const s of series) {
    const charas = await db.wishlist.where('series').equals(s).toArray();
    sets.push({ series: s, charas });
  }
  for (const set of sets) {
    let setMessage = `From ${set.series}, I want:\n`;
    for (const chara of set.charas) {
      const selectedEditions = chara.editions
        .map((isSelected, index) => (isSelected ? index + 1 : null))
        .filter((edition): edition is number => edition !== null);
      const editionText = selectedEditions.length > 0 ? `editions ${selectedEditions.join(', ')}` : 'no editions selected';
      let huntingText = '';
      if (chara.hunting === 1) {
        huntingText = ` SP's only`;
      }
      if (chara.hunting === 2) {
        huntingText = ` LP's and SP's`;
      }
      if (chara.hunting === 3) {
        huntingText = ` MP's and better`;
      }
      if (chara.hunting === 4) {
        huntingText = ` any print!`;
      }
      setMessage += ` ${chara.name} (${editionText})${huntingText ? ` [${huntingText}]` : ''}`;
      if (chara.comment?.trim()) {
        setMessage += `\nComment: ${chara.comment.trim()}`;
      }
      setMessage += `\n\n`;
    }
    fullMessage += setMessage;
  }

  const today = new Date().toISOString().slice(0, 10);
  const fileName = `Karuta Wishlist ${today}.txt`;
  const blob = new Blob([fullMessage], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const WishlistStarButton = ({
  name,
  series,
  edition,
}: {
  name: string;
  series: string;
  edition: number;
}) => {
  const nameseries = `${name}_${series}`;
  const wishlistEntry = useLiveQuery(() => db.wishlist.get(nameseries), [nameseries], undefined);

  const editionSelected = wishlistEntry?.editions?.[edition - 1] ?? false;
  const buttonLabel = editionSelected ? '★' : '☆';
  const title = wishlistEntry
    ? editionSelected
      ? 'Remove this edition from wishlist'
      : 'Add this edition to existing wishlist entry'
    : 'Add this name/series to wishlist';

  const handleClick = async () => {
    if (!wishlistEntry) {
      await addWishlist(name, series, edition);
    } else {
      await toggleWishlistEdition(name, series, edition);
    }
  };

  return (
    <button
      type="button"
      className="wishlist-star-button"
      title={title}
      onClick={handleClick}
    >
      {buttonLabel}
    </button>
  );
};

const WishlistEntryRow = ({ item }: { item: WishlistItem }) => {
  const [localEditions, setLocalEditions] = useState(item.editions);
  const [localHunting, setLocalHunting] = useState(item.hunting ?? 0);
  const [localComment, setLocalComment] = useState(item.comment ?? '');

  useEffect(() => {
    setLocalEditions(item.editions);
    setLocalHunting(item.hunting ?? 0);
    setLocalComment(item.comment ?? '');
  }, [item.editions, item.hunting, item.comment]);

  const handleEditionChange = async (index: number, checked: boolean) => {
    const nextEditions = [...localEditions];
    nextEditions[index] = checked;
    setLocalEditions(nextEditions);
    await updateWishlistEntry(item.name, item.series, { editions: nextEditions });
  };

  const handleHuntingChange = async (value: number) => {
    setLocalHunting(value);
    await updateWishlistEntry(item.name, item.series, { hunting: value === 0 ? null : value });
  };

  const handleCommentBlur = async () => {
    await updateWishlistEntry(item.name, item.series, { comment: localComment });
  };

  return (
    <tr>
      <td className="col-series">{item.series}</td>
      <td className="col-name">{item.name}</td>
      <td className="col-edition">
        <div className="wishlist-editions">
          {localEditions.map((checked, index) => (
            <label key={index} className="wishlist-edition-label">
              <input
                type="checkbox"
                checked={checked}
                onChange={(event) => handleEditionChange(index, event.target.checked)}
              />
              {index + 1}
            </label>
          ))}
        </div>
      </td>
      <td>
        <select
          value={localHunting}
          onChange={(event) => handleHuntingChange(Number(event.target.value))}
        >
          <option value={0}>None</option>
          <option value={1}>1 - SP's only</option>
          <option value={2}>2 - LP's and SP's</option>
          <option value={3}>3 - MP's and better</option>
          <option value={4}>4 - Any print</option>
        </select>
      </td>
      <td>
        <input
          type="text"
          value={localComment}
          onChange={(event) => setLocalComment(event.target.value)}
          onBlur={handleCommentBlur}
          placeholder="Add a note"
        />
      </td>
      <td>
        <button
          type="button"
          className="wishlist-row-remove"
          onClick={() => removeWishlist(item.name, item.series)}
        >
          Remove
        </button>
      </td>
    </tr>
  );
};

const Wishlist = ({
  suggestedNames,
  suggestedSeries,
}: {
  suggestedNames: string[];
  suggestedSeries: string[];
}) => {
  const wishlist = useLiveQuery(() => db.wishlist.toArray(), [], []);
  const [name, setName] = useState('');
  const [series, setSeries] = useState('');
  const [edition, setEdition] = useState(1);
  const [hunting, setHunting] = useState(0);
  const [comment, setComment] = useState('');
  const [feedback, setFeedback] = useState('');

  const uniqueNames = useMemo(
    () =>
      Array.from(
        new Set([
          ...suggestedNames,
          ...(wishlist?.map((item) => item.name) ?? []),
        ])
      ).sort(),
    [suggestedNames, wishlist]
  );

  const uniqueSeries = useMemo(
    () =>
      Array.from(
        new Set([
          ...suggestedSeries,
          ...(wishlist?.map((item) => item.series) ?? []),
        ])
      ).sort(),
    [suggestedSeries, wishlist]
  );

  const handleAddWishlist = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedSeries = series.trim();
    if (!trimmedName || !trimmedSeries || edition < 1 || edition > 7) {
      setFeedback('Please provide a valid name, series, and edition between 1 and 7.');
      return;
    }

    await addWishlist(trimmedName, trimmedSeries, edition);
    if (hunting > 0 || comment.trim()) {
      await modifyWishlist(trimmedName, trimmedSeries, undefined, hunting || undefined, comment.trim() || undefined);
    }

    setFeedback(`Saved ${trimmedName} from ${trimmedSeries} to your wishlist.`);
    setName('');
    setSeries('');
    setEdition(1);
    setHunting(0);
    setComment('');
  };

  return (
    <div id="wishlist-view">
      <div className="wishlist-actions">
        <button type="button" onClick={exportWishlist}>
          Export Wishlist
        </button>
      </div>

      <table className="card-table wishlist-table">
        <thead>
          <tr>
            <th className="col-series">Series</th>
            <th className="col-name">Name</th>
            <th className="col-edition">Editions</th>
            <th className="col-hunting">Hunting</th>
            <th>Comment</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {wishlist && wishlist.length > 0 ? (
            wishlist.map((item) => (
              <WishlistEntryRow key={item.nameseries} item={item} />
            ))
          ) : (
            <tr>
              <td colSpan={6}>No wishlist entries yet.</td>
            </tr>
          )}
        </tbody>
      </table>

      <form className="wishlist-form" onSubmit={handleAddWishlist}>
        <div className="wishlist-form-row">
          <label>
            Series
            <input
              list="wishlist-series-list"
              value={series}
              onChange={(event) => setSeries(event.target.value)}
              placeholder="Type or choose a series"
            />
          </label>
          <label>
            Name
            <input
              list="wishlist-name-list"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Type or choose a name"
            />
          </label>
          <label>
            Edition
            <input
              type="number"
              min={1}
              max={7}
              value={edition}
              onChange={(event) => setEdition(Number(event.target.value))}
            />
          </label>
          <label>
            Hunting
            <select
              value={hunting}
              onChange={(event) => setHunting(Number(event.target.value))}
            >
              <option value={0}>None</option>
              <option value={1}>SP's only</option>
              <option value={2}>LP's and SP's</option>
              <option value={3}>MP's and better</option>
              <option value={4}>Any print</option>
            </select>
          </label>
        </div>
        <div className="wishlist-form-row">
          <label>
            Comment
            <input
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Optional note"
            />
          </label>
          <button type="submit">Add / Update Wishlist Entry</button>
        </div>
      </form>

      <datalist id="wishlist-name-list">
        {uniqueNames.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
      <datalist id="wishlist-series-list">
        {uniqueSeries.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
      {feedback && <div className="wishlist-feedback">{feedback}</div>}
    </div>
  );
};

export default Wishlist;
