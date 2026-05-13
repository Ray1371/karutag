import './index.css';

export default function Navbar() {
  return (
    // todo: styling
    <nav className="navbar">
      <h2>Karutag</h2>
      <a id="nav-button" href="#collection-table">Collection</a>
      <a id="nav-button" href="#selected-table">Selected Cards</a>
      <a id="nav-button" href="#tag-messages">Tag Messages</a>
      <p>You can click on cards name or series to copy it to clipboard.</p>
    </nav>
  );
}