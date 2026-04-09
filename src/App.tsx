import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import HeartMendApp from './pages/HeartMendApp';
import UserDashboard from './pages/UserDashboard';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/dashboard" element={<UserDashboard />} />
      <Route path="/chat" element={<HeartMendApp />} />
    </Routes>
  );
}

export default App;
