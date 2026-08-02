import React from 'react';
import { PurchaseOrderPage } from './components/PurchaseOrder';

export const App: React.FC = () => {
  return (
    <main className="w-full min-h-screen bg-slate-900">
      <PurchaseOrderPage />
    </main>
  );
};

export default App;
