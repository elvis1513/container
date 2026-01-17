import React from 'react';
import { Routes, Route } from 'react-router';

// Direct import for now - Loadable has issues with webpack chunk configuration
import { PackingPage } from 'app/site/packing';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/packing" element={<PackingPage />} />
      <Route path="/" element={<PackingPage />} />
    </Routes>
  );
};

export default AppRoutes;
