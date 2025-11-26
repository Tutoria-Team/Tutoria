import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ user, children, checkingAuth }) => {
  if (checkingAuth) {
    // Bootstrap spinner while checking auth
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: '80vh' }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to home page if not logged in
    return <Navigate to="/" replace />;
  }

  // User is logged in, render the child component
  return children;
};

export default PrivateRoute;
