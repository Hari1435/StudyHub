import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import AuthPage from './pages/AuthPage';
import FaDashboard from './pages/FaDashboard';
import StuDashboard from './pages/StuDashboard';
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="authenticate" element={<AuthPage/>}/>
        <Route path="fadashboard" element={<FaDashboard />} />
        <Route path="studashboard" element={<StuDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;