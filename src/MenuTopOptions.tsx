import 
  React,
  { 
    // useState, 
    // useEffect,
    useContext,
  }
   from 'react';

   import { optionsContext } from './App';
  //  import {} from './App';
//will most likely need to implement context here and at tables.
//maybe also have settings be savable maybe via localstorage.
const MenuTopOptions: React.FC = () => {

    const {
      condensedTable,
      setCondensedTable,
      // hideWishlists,
      // setHideWishlists,
      hideToughness,
      setHideToughness,
      hideDye,
      setHideDye,
      hideFrame,
      setHideFrame,
      hideEffort,
      setHideEffort,
      hideQuality,
      setHideQuality,
    } = useContext(optionsContext);
    if (!optionsContext) {
  throw new Error('optionsContext missing provider');
}

  return (
    <div>
      {/* MenuTopOptions component */}
        <input type="checkbox" id="condense-table" name="condense-table" 
        checked={condensedTable}
        onChange={() => setCondensedTable(!condensedTable)}
        />
        <label htmlFor="condense-table">Condense Table</label>
         {/* <br /> */}
         {/* <input type="checkbox" id="hide-wishlists" name="hide-wishlists" 
         checked={hideWishlists}
         onChange={() => setHideWishlists(!hideWishlists)}
         />
        <label htmlFor="hide-wishlists">Hide Wishlists</label> */}
        {/* <br /> */}
        <input type="checkbox" id="hide-toughness" name="hide-toughness" 
        checked={hideToughness}
        onChange={() => setHideToughness(!hideToughness)}
        />
        <label htmlFor="hide-toughness">Hide Toughness</label>
        <br />
        <input type="checkbox" id="hide-dye" name="hide-dye" 
        checked={hideDye}
        onChange={() => setHideDye(!hideDye)}
        />
        <label htmlFor="hide-dye">Hide Dye</label>
        {/* <br /> */}
        <input type="checkbox" id="hide-frame" name="hide-frame" 
        checked={hideFrame}
        onChange={() => setHideFrame(!hideFrame)}
        />
        <label htmlFor="hide-frame">Hide Frame</label>
        {/* <br /> */}
        <input type="checkbox" id="hide-effort" name="hide-effort" 
        checked={hideEffort}
        onChange={() => setHideEffort(!hideEffort)}
        />
        <label htmlFor="hide-effort">Hide Effort</label>
        {/* <br /> */}
        <input type="checkbox" id="hide-quality" name="hide-quality" 
        checked={hideQuality}
        onChange={() => setHideQuality(!hideQuality)}
        />
        <label htmlFor="hide-quality">Hide Quality</label>
    </div>
  );
};

export default MenuTopOptions;