import '../styles/header.css';
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Authentication from './auth/Authentication';

const Header = ({ user, setUser, showAuth, setShowAuth, authView, setAuthView }) => {
  const location  = useLocation();
  const navigate  = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/');
  };

  return (
    <>
      <header className="header">
        <div className="header-left">
          <Link to="/" className="header-logo">
            <img className="header-logo-img" src="/LogoVersions/Logo.png" alt="Tutoria Logo" />
          </Link>
          <Link to="/" className="header-brand">Tutoria</Link>

          <nav className="header-nav">
            <Link
              to="/find-a-tutor"
              className={`header-nav-item ${
                location.pathname === '/find-a-tutor' || location.pathname === '/' ? 'active' : ''
              }`}
            >
              Find a Tutor
            </Link>
            <Link
              to="/become-a-tutor"
              className={`header-nav-item ${
                location.pathname === '/become-a-tutor' ? 'active' : ''
              }`}
            >
              {user?.is_tutor ? 'My Dashboard' : 'Become a Tutor'}
            </Link>
          </nav>
        </div>

        <div className="header-right">
          {!user ? (
            <button
              className="header-login-btn"
              onClick={() => { setAuthView('login'); setShowAuth(true); }}
            >
              Login
            </button>
          ) : (
            <>
              <Link to="/messages" className="header-icon-link">
                <img className="header-icon" src="/Icons/Messages.png" alt="Messages" />
              </Link>
              <Link to="/notifications" className="header-icon-link">
                <img className="header-icon" src="/Icons/Notifications.png" alt="Notifications" />
              </Link>
              {location.pathname === '/profile' ? (
                <button className="header-login-btn" onClick={handleLogout}>
                  Logout
                </button>
              ) : (
                <Link to="/profile" className="header-avatar-link">
                  <img
                    className="header-avatar"
                    src={user.profile_photo_url || '/Icons/Default_Profile_Picture.png'}
                    alt="Profile"
                  />
                </Link>
              )}
            </>
          )}
        </div>
      </header>

      {showAuth && (
        <Authentication
          setShowAuth={setShowAuth}
          setUser={setUser}
          initialView={authView}
          setAuthView={setAuthView}
        />
      )}
    </>
  );
};

export default Header;