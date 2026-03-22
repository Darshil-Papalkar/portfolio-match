import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home, Heart, ShieldCheck } from 'lucide-react';
import { AnimeNavBar } from './components/ui/AnimeNavbar.jsx';
import ViewPage from './pages/ViewPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import MatchPage from './pages/MatchPage.jsx';

const NAV_ITEMS = [
  { name: 'Browse', url: '/', icon: Home },
  { name: 'Match',  url: '/match', icon: Heart },
  { name: 'Admin',  url: '/admin', icon: ShieldCheck },
];

function Layout() {
  return (
    <>
      <AnimeNavBar items={NAV_ITEMS} />
      <div className="pt-32 sm:pt-36 md:pt-40">
        <Routes>
          <Route path="/" element={<ViewPage />} />
          <Route path="/match" element={<MatchPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </div>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}
