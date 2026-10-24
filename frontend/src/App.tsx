import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { RunPage } from './pages/RunPage';
import { HistoryPage } from './pages/HistoryPage';
import { SampleReportPage } from './pages/SampleReportPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col selection:bg-accent-cyan/20 selection:text-accent-cyan">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/verify" element={<WorkspacePage />} />
              <Route path="/verifications/:id" element={<RunPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/sample" element={<SampleReportPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
