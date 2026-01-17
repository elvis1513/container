import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from 'app/routes';

const baseHref = document.querySelector('base')?.getAttribute('href')?.replace(/\/$/, '') ?? '/';

export const App = () => {
  return (
    <BrowserRouter basename={baseHref}>
      <AppRoutes />
    </BrowserRouter>
  );
};

export default App;
