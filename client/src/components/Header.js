import '../styles/header.css';
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Authentication from './Authentication';

const Header = ({ user, setUser }) => {
    const [showAuth, setShowAuth] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        setUser(null);
        navigate('/'); 
    };

    return (
        <>
            <div className="header">
                <div className="header-left">
                    <Link to="/" className="logo">
                        <img className="logoImage" src="/LogoVersions/Logo.png" alt="Tutoria Logo"/>
                    </Link>
                    <Link to="/" className="logoName">Tutoria</Link>
                    <Link to="/find-tutor" className="headerItem">Find a Tutor</Link>
                    <Link to="/become-tutor" className="headerItem">Become a Tutor</Link>
                </div>

                <div className="header-right">
                    {!user ? (
                        <button onClick={() => setShowAuth(true)} title="auth">Login</button>
                    ) : (
                        <>
                            <Link to="/messages" className="messages">
                                <img className="messagesIcon" src="/Icons/Messages.png" alt="Messages"/>
                            </Link>
                            <Link to="/notifications" className="notifications">
                                <img className="notificationsIcon" src="/Icons/Notifications.png" alt="Notifications"/>
                            </Link>
                            {location.pathname === '/profile' ? (
                                <button title="Logout" onClick={handleLogout}>Logout</button>
                            ) : (
                                <Link to="/profile" className="defaultPicture">
                                    <img className="defaultPictureIcon" src="/Icons/Default_Profile_Picture.png" alt="DefaultPicture"/>
                                </Link>
                            )}
                        </>
                    )}
                </div>
            </div>

            {showAuth && (
                <Authentication setShowAuth={setShowAuth} setUser={setUser} />
            )}
        </>
    );
};

export default Header;
