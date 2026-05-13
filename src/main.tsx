import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// If we introduced any context providers, global state, or theming, they would be wrapped here.
// For example, if we added a context provider:
// import { MyContextProvider } from './MyContext';

// If we introduced a router:
// import { BrowserRouter } from 'react-router-dom';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* Wrap App in any providers if needed */}

    <App />

  </React.StrictMode>
);
