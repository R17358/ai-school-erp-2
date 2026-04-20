// frontend/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import App from './App';
import './styles/globals.css';

// Apply dark mode from storage before render
const darkMode = localStorage.getItem('darkMode') === 'true';
document.documentElement.classList.toggle('dark', darkMode);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
