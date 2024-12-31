import React from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, History, User, LogOut, LayoutDashboard, Menu, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

export default function Navbar() {
  const { setSession } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    closeMenu();
  };

  return (
    <nav className="bg-surface border-b border-divider">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16 relative">
          <Link to="/" className="flex items-center space-x-2 text-text-primary hover:text-text-highlight">
            <img src="/logo.svg" alt="Yujin Fit" className="h-8 w-8" />
            <span className="font-bold text-xl">Yujin Fit</span>
          </Link>
          
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className={`
            absolute top-full right-0 left-0 
            md:relative md:top-auto md:right-auto md:left-auto
            bg-surface md:bg-transparent
            shadow-lg md:shadow-none
            flex flex-col md:flex-row 
            space-y-2 md:space-y-0 md:space-x-4
            p-4 md:p-0
            ${isMenuOpen ? 'block' : 'hidden md:flex'}
            z-50
          `}>
            <NavLink to="/" icon={<LayoutDashboard className="h-5 w-5" />} text="Dashboard" onClick={closeMenu} />
            <NavLink to="/generator" icon={<Dumbbell className="h-5 w-5" />} text="Create" onClick={closeMenu} />
            <NavLink to="/history" icon={<History className="h-5 w-5" />} text="Workouts" onClick={closeMenu} />
            <NavLink to="/friends" icon={<Users className="h-5 w-5" />} text="Friends" onClick={closeMenu} />
            <NavLink to="/profile" icon={<User className="h-5 w-5" />} text="Profile" onClick={closeMenu} />
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 px-3 py-2 rounded text-gray-600 hover:text-gray-900 w-full md:w-auto"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

interface NavLinkProps {
  to: string;
  icon: React.ReactNode;
  text: string;
  onClick?: () => void;
}

function NavLink({ to, icon, text, onClick }: NavLinkProps) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center space-x-1 px-3 py-2 rounded text-text-secondary hover:text-text-highlight transition-colors"
    >
      {icon}
      <span>{text}</span>
    </Link>
  );
}