import './index.css';
import { useState,
  // useContext 
} from 'react';

export default function Navbar() {
  const [currentTip, setCurrentTip] = useState(Math.floor(Math.random() * tips.length));


  return (
    // todo: styling
    <nav className="navbar">
      <h2>Karutag</h2>
      <a id="nav-button" href="#collection-table">Collection</a>
      <a id="nav-button" href="#selected-table">Selected Cards</a>
      <a id="nav-button" href="#tag-messages">Tag Messages</a>
      {/* todo:let users click this to cycle through tips */}
      <button 
        className = "tip-button"
        onClick={() => {
        setCurrentTip((Math.floor(Math.random() * tips.length)));
      }}>
        {tips[currentTip]}
      </button>
    </nav>
  );
}

const tips:string[] = [
  "You can click on cards name or series to copy it to clipboard",
  "Click the search icon to search for images of the character on Google",
  "MaxEffort assumes Mint Quality, S Toughness, a frame, and regular(/mystic) dye on the card."
]