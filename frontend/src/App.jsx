import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import ViewPage from './pages/ViewPage.jsx';
import AdminPage from './pages/AdminPage.jsx';

function Navbar() {
  const { pathname } = useLocation();
  return (
    <nav className="bg-rose-700 text-white px-6 py-4 flex justify-between items-center shadow-lg sticky top-0 z-50">
      <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-wide">
        <span className="text-2xl">💍</span>
        <span>MatriMatch</span>
      </Link>
      <div className="flex items-center gap-4">
        <Link
          to="/"
          className={`text-sm font-medium transition-colors ${pathname === '/' ? 'text-white underline underline-offset-4' : 'text-rose-200 hover:text-white'}`}
        >
          Browse Profiles
        </Link>
        <Link
          to="/admin"
          className={`text-sm font-semibold px-4 py-1.5 rounded-full border border-white/40 transition-colors ${pathname === '/admin' ? 'bg-white text-rose-700' : 'hover:bg-white/10'}`}
        >
          Admin Portal
        </Link>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<ViewPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}
