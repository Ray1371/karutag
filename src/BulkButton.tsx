import './index.css'
// import { db } from './Upload';
// import type { Card } from './Upload';

export default function BulkButton() {



  return (
    <div className="tooltip">
      Automatically selects all cards that meet the following criteria:
      <br/>
      Not tagged
      <br/>
      100 (default) or less wishlists
      <br/>
      Print is 1001 or above
      <button className="bulk-button tooltip-button"
      // Plan with this: Carry selectBulk back to MainMenu and use it there
        // onClick={selectBulk}
      >
        Auto-Add Bulk
      </button>
    </div>

  );
}