import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppProvider';
import { MediaProvider } from './context/MediaContext';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { LearnPage } from './pages/LearnPage';
import { SpotterPage } from './pages/SpotterPage';
import { DeepDivePage } from './pages/DeepDivePage';
import { CodesPage } from './pages/CodesPage';
import { EncyclopediaPage } from './pages/EncyclopediaPage';
import { AdminPage } from './pages/AdminPage';

export default function App() {
  return (
    <AppProvider>
      <MediaProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/admin" element={<AdminPage />} />
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="learn" element={<LearnPage />} />
              <Route path="spotter" element={<SpotterPage />} />
              <Route path="deepdive" element={<DeepDivePage />} />
              <Route path="codes" element={<CodesPage />} />
              <Route path="airpedia" element={<EncyclopediaPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </MediaProvider>
    </AppProvider>
  );
}
