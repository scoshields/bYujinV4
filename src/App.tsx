import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import WorkoutGenerator from './pages/WorkoutGenerator';
import WorkoutHistory from './pages/WorkoutHistory';
import Profile from './pages/Profile';
import Friends from './pages/Friends';
import Auth from './pages/Auth';
import { useAuthStore } from './stores/authStore';

function App() {
  const { session } = useAuthStore();

  if (!session) {
    return <Auth />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/generator" element={<WorkoutGenerator />} />
            <Route path="/history" element={<WorkoutHistory />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/friends" element={<Friends />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;