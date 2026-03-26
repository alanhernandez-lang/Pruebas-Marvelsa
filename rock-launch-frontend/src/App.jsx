import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Registration from './pages/Registration';
import TokenLogin from './pages/TokenLogin';
import VotingFlow from './pages/VotingFlow';
import AdminDashboard from './pages/AdminDashboard';
import Welcome from './pages/Welcome';
import ThankYou from './pages/ThankYou';

import Ranking from './pages/Ranking';

// Simple context for User State
export const UserContext = React.createContext(null);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for existing session
    const storedUser = localStorage.getItem('rocklaunch_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user", e);
        localStorage.removeItem('rocklaunch_user');
      }
    }
    setLoading(false);
  }, []);

  const login = React.useCallback((userData) => {
    setUser(userData);
    localStorage.setItem('rocklaunch_user', JSON.stringify(userData));
  }, []);

  const logout = React.useCallback(() => {
    setUser(null);
    localStorage.removeItem('rocklaunch_user');
  }, []);

  if (loading) return <div className="container">Loading...</div>;

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      <Router>
        <div className="app-content">
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/votar" element={<TokenLogin />} />
            <Route path="/register" element={<Navigate to="/" />} />
            <Route path="/vote" element={user ? <VotingFlow /> : <Navigate to="/votar" />} />
            <Route path="/ranking" element={<Ranking />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/thank-you" element={<ThankYou />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </Router>
    </UserContext.Provider>
  );
}

export default App;
