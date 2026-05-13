
import { useState} from 'react';
import './App.css';
// import Upload from './Upload' // Use this when the user has not yet uploaded their Karuta collection ever.
import NotYetUploaded from './NotYetUploaded';
import MainMenu from './MainMenu'; // Use this when the user has already uploaded their Karuta collection.
import { db } from './Upload';
import './index.css'

function App() {
  // const [hasUploaded, setHasUploaded] = useState(false);//change this to reflect status from localstorage if it exists
  const [hasUploaded, setHasUploaded] = useState(
    localStorage.getItem("uploaded") === "true"
  );



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


      {/* welcome component here. */}
      {!hasUploaded && <NotYetUploaded setHasUploaded={setHasUploaded} />}


      {hasUploaded && <MainMenu />}

    </>
  );
}

export default App;

