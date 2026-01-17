import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { I18nProvider } from 'app/platform/i18n';
import AppRoutes from 'app/routes';

const baseHref = document.querySelector('base')?.getAttribute('href')?.replace(/\/$/, '') ?? '/';

export const App = () => {
  return (
    <I18nProvider>
      <BrowserRouter basename={baseHref}>
        <AppRoutes />
      </BrowserRouter>
    </I18nProvider>
  );
};

export default App;
