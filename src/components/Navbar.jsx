import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'day');
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const toggleTheme = () => {
    const next = theme === 'day' ? 'night' : 'day';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('slot-theme', next);
    setTheme(next);
  };

  const handleLogout = async () => {
    await logout();
    nav('/');
  };

  return (
    <nav className="nav">
      <NavLink className="logo gl" to="/"><i></i>slot</NavLink>

      <ul className="links gl">
        <li><NavLink to="/">Главная</NavLink></li>
        <li><NavLink to="/places">Места</NavLink></li>
        <li><NavLink to="/dashboard">Кабинет</NavLink></li>
      </ul>

      <div className="nr">
        <button
          className="tt gl"
          onClick={toggleTheme}
          aria-label="Переключить тему"
          aria-pressed={theme === 'night'}
        >
          <svg className="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <circle cx="12" cy="12" r="4.2"/>
            <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6"/>
          </svg>
          <svg className="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
            <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4 8.2 8.2 0 1 0 20 14.2z"/>
          </svg>
        </button>

        {user ? (
          <div className="uchip gl">
            <b>{user.displayName || user.email}</b>
            <button className="pill line sm" onClick={handleLogout}>Выйти</button>
          </div>
        ) : (
          <>
            <NavLink className="pill line gl" to="/login">Войти</NavLink>
            <NavLink className="pill solid gl" to="/register">Регистрация</NavLink>
          </>
        )}
      </div>
    </nav>
  );
}