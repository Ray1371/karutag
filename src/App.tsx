//idea: start context here
import { 
  useState,
  // useContext,
  useEffect,
  createContext,
  
  // type Dispatch,
  // type SetStateAction,
} from 'react';
import './App.css';
// import Upload from './Upload' // Use this when the user has not yet uploaded their Karuta collection ever.
import NotYetUploaded from './NotYetUploaded';
import MainMenu from './MainMenu'; // Use this when the user has already uploaded their Karuta collection.
import { db } from './Upload';
import './index.css'
import MenuTopOptions from './MenuTopOptions';

type OptionsContextType = {
  condensedTable: boolean;
  setCondensedTable: React.Dispatch<React.SetStateAction<boolean>>;
  hideWishlists: boolean;
  setHideWishlists: React.Dispatch<React.SetStateAction<boolean>>;
  hideToughness: boolean;
  setHideToughness: React.Dispatch<React.SetStateAction<boolean>>;
  hideDye: boolean;
  setHideDye: React.Dispatch<React.SetStateAction<boolean>>;
  hideFrame: boolean;
  setHideFrame: React.Dispatch<React.SetStateAction<boolean>>;
  hideEffort: boolean;
  setHideEffort: React.Dispatch<React.SetStateAction<boolean>>;
  hideQuality: boolean;
  setHideQuality: React.Dispatch<React.SetStateAction<boolean>>;
};

  // export const optionsContext = createContext(
  //   {
  //   // is there a way to grab actual values from localStorage here instead of hardcoding false? if not, then maybe just have the default be false and then when the MenuTopOptions component mounts, 
  //   // have it update the context with the actual values from localStorage?
  //     condensedTable: localStorage.getItem('condensedTable') === 'true' || false,
  //     setCondensedTable: (value: boolean) => {}, // Placeholder function, will be overridden by the provider
  //     hideWishlists: localStorage.getItem('hideWishlists') === 'true' || false,
  //     setHideWishlists: (value: boolean) => {}, // Placeholder function, will be overridden by the provider
  //     hideToughness: localStorage.getItem('hideToughness') === 'true' || false,
  //     setHideToughness: (value: boolean) => {}, // Placeholder function, will be overridden by the provider
  //     hideDye: localStorage.getItem('hideDye') === 'true' || false,
  //     setHideDye: (value: boolean) => {}, // Placeholder function, will be overridden by the provider
  //     hideFrame: localStorage.getItem('hideFrame') === 'true' || false,
  //     setHideFrame: (value: boolean) => {}, // Placeholder function, will be overridden by the provider
  //     hideEffort: localStorage.getItem('hideEffort') === 'true' || false,
  //     setHideEffort: (value: boolean) => {}, // Placeholder function, will be overridden by the provider
  //     hideQuality: localStorage.getItem('hideQuality') === 'true' || false,
  //     setHideQuality: (value: boolean) => {}, // Placeholder function, will be overridden by the provider
  //   }
  // );
// export const optionsContext =
//   createContext<OptionsContextType | null>(null);
  export const optionsContext = createContext<OptionsContextType>({
    condensedTable: localStorage.getItem('condensedTable') === 'true' || false,
    setCondensedTable: () => {}, // Placeholder function, will be overridden by the provider
    hideWishlists: localStorage.getItem('hideWishlists') === 'true' || false,
    setHideWishlists: () => {}, // Placeholder function, will be overridden by the provider
    hideToughness: localStorage.getItem('hideToughness') === 'true' || false,
    setHideToughness: () => {}, // Placeholder function, will be overridden by the provider
    hideDye: localStorage.getItem('hideDye') === 'true' || false,
    setHideDye: () => {}, // Placeholder function, will be overridden by the provider
    hideFrame: localStorage.getItem('hideFrame') === 'true' || false,
    setHideFrame: () => {}, // Placeholder function, will be overridden by the provider
    hideEffort: localStorage.getItem('hideEffort') === 'true' || false,
    setHideEffort: () => {}, // Placeholder function, will be overridden by the provider
    hideQuality: localStorage.getItem('hideQuality') === 'true' || false,
    setHideQuality: () => {}, // Placeholder function, will be overridden by the provider
  });
  
function App() {
  const [hasUploaded, setHasUploaded] = useState(
    localStorage.getItem("uploaded") === "true"
  );
  //todo if needed? typescript this properly into booleans
   const [isOptionsWindowOpen, setIsOptionsWindowOpen] = useState(false);
   const [condensedTable, setCondensedTable] = useState(
    localStorage.getItem('condensedTable') === 'true' || false
  );
  const [hideWishlists, setHideWishlists] = useState(
    localStorage.getItem('hideWishlists') === 'true' || false
  );
  const [hideToughness, setHideToughness] = useState(
    localStorage.getItem('hideToughness') === 'true' || false
  );
  const [hideDye, setHideDye] = useState(
    localStorage.getItem('hideDye') === 'true' || false
  );
  const [hideFrame, setHideFrame] = useState(
    localStorage.getItem('hideFrame') === 'true' || false
  );
  const [hideEffort, setHideEffort] = useState(
    localStorage.getItem('hideEffort') === 'true' || false
  );
  const [hideQuality, setHideQuality] = useState(
    localStorage.getItem('hideQuality') === 'true' || false
  );

   //context stuff; load settings from localStorage here and then 
   // pass them down via context provider. 
   // also have the functions to update those settings here as well,
   //  and pass those down too.
  // const condensedTable = JSON.parse(localStorage.getItem('condensedTable') || '{}');
  // const hideWishlists = JSON.parse(localStorage.getItem('hideWishlists') || '{}');
  // const hideToughness = JSON.parse(localStorage.getItem('hideToughness') || '{}');
  // const hideDye = JSON.parse(localStorage.getItem('hideDye') || '{}');
  // const hideFrame = JSON.parse(localStorage.getItem('hideFrame') || '{}');
  // const hideEffort = JSON.parse(localStorage.getItem('hideEffort') || '{}');
  // const hideQuality = JSON.parse(localStorage.getItem('hideQuality') || '{}');

  useEffect(() => {
    // Save settings to localStorage whenever they change
    localStorage.setItem('condensedTable', JSON.stringify(condensedTable));
  }, [condensedTable]);

  useEffect(() => {
    localStorage.setItem('hideWishlists', JSON.stringify(hideWishlists));
  }, [hideWishlists]);

  useEffect(() => {
    localStorage.setItem('hideToughness', JSON.stringify(hideToughness));
  }, [hideToughness]);

  useEffect(() => {
    localStorage.setItem('hideDye', JSON.stringify(hideDye));
  }, [hideDye]);

  useEffect(() => {
    localStorage.setItem('hideFrame', JSON.stringify(hideFrame));
  }, [hideFrame]);

  useEffect(() => {
    localStorage.setItem('hideEffort', JSON.stringify(hideEffort));
  }, [hideEffort]);

  useEffect(() => {
    localStorage.setItem('hideQuality', JSON.stringify(hideQuality));
  }, [hideQuality]);

//end context stuff
  async function resetUploaded() {
    await db.collection.clear();
    localStorage.setItem("uploaded", "false");
    setHasUploaded(false);
  }

  return (
    <>
    {hasUploaded && (
    <>
      <button 
      className='upload-button'
      onClick={resetUploaded}>Reset Collection</button>

      
    </>
    )}
    <optionsContext.Provider value={{
      condensedTable,
      setCondensedTable,
      hideWishlists,
      setHideWishlists,
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
    }}>

    <button 
        className="navbar-options-button"
        onClick={()=>{
          setIsOptionsWindowOpen(!isOptionsWindowOpen);
        }}
      >
        Options
    </button>
    {isOptionsWindowOpen && (
      <div className='options-window'>
        {/* options content here */}
        <MenuTopOptions />
      </div>
    )}


      {/* welcome component here. */}
      {!hasUploaded && <NotYetUploaded setHasUploaded={setHasUploaded} />}
      {hasUploaded && <MainMenu />}
      </optionsContext.Provider>
    </>
  );
}

export default App;

