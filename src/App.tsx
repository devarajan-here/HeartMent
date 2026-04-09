import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import HeartMendApp from './pages/HeartMendApp';
import UserDashboard from './pages/UserDashboard';
import { SessionProvider } from './store/SessionStore';

function App() {
  return (
    <SessionProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/chat" element={<HeartMendApp />} />
        </Routes>
      </Router>
    </SessionProvider>
  );
}

export default App;
