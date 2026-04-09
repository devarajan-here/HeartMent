import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import HeartMendApp from './pages/HeartMendApp';
import UserDashboard from './pages/UserDashboard';
import Auth from './pages/Auth';
import Admin from './pages/Admin';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Auth />} />
      <Route path="/dashboard" element={<UserDashboard />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/app" element={<HeartMendApp />} />
    </Routes>
  );
}

export default App;
