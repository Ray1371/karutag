import { useState } from 'react'
import './App.css'
import {handleUpload} from './Upload';

//might need to modify the "setHasUploaded" part of this function.
export default function NotYetUploaded({ setHasUploaded }: { setHasUploaded: React.Dispatch<React.SetStateAction<boolean>> }) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isValid, setIsValid] = useState<boolean>(false); // Is the file an actual Karuta Collection?
    const [isUploading, setIsUploading] = useState(false);
    const [cardsUpdated, setCardsUpdated] = useState(0);
    const [rowCount, setRowCount] = useState(0);

    // defining signals on React's end
    const signals = {
      updateRowCount: (rows: number) => { setRowCount(rows) },
      updateCompletedRows: (rows: number) => { setCardsUpdated(rows) },
      updateValid: (valid: boolean) => { setIsValid(valid) }
    }

  return (
    <div className="upload-container">
      {pleaseUploadBlurb()}

      <label htmlFor="upload-input"
        className="upload-input"
        >(It should be a .csv file)</label>

      <span className="upload-row">
        <input
          id="upload-input"
          type="file"
          accept=".csv"
          name="upload"
          multiple={false}
          onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
        />

        <button
          disabled={isUploading || !selectedFile}
          onClick={async () => {
            if (!selectedFile) return;
            setIsUploading(true);
            const success = await handleUpload(selectedFile, signals);
            if (success)
            {
              setHasUploaded(true);
              localStorage.setItem("uploaded", "true");
            }
            else
              localStorage.setItem("uploaded", "false");

          }}
          className="upload-button"
        >
          {isUploading ? 'Uploading...' : 'Upload'}
        </button>

        {rowCount > 0 && (
          <div className="progress">
            <p>Upload Progress: ${}</p>
          </div>
        )}

        {isUploading && (
          <div className="progress">
            <p>Upload Progress: ${cardsUpdated} / ${rowCount}</p>
          </div>
        )}

        {!isValid && isUploading === false && selectedFile && <InvalidMessage />}
      </span>

      <p className="upload-disclaimer">
        This data is only processed on your device and is not uploaded nor stored anywhere else.
      </p>
    </div>
  )
}

const pleaseUploadBlurb = () => (
  <p>
    Before we begin, please use Karuta Bot's sheet command <br />
    Then paste/upload the resulting link/file.
  </p>
);

const InvalidMessage = () => (
  <p className="invalid-message">
    You either didn't pick a file to upload or the file is not a valid Karuta Collection.
  </p>
);
