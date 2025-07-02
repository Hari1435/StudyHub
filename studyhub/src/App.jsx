import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import Home from './pages/Home'
import AuthPage from './pages/AuthPage';
import FaDashboard from './pages/FaDashboard';
import StuDashboard from './pages/StuDashboard';
import Profile from './pages/Profile';

function App() {
  const navigate = useNavigate();
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="authenticate" element={<AuthPage onBack={() => navigate('/')} />} />
      <Route path="fadashboard" element={<FaDashboard />} />
      <Route path="studashboard" element={<StuDashboard />} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  );
}

export default function AppWithRouter() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}