// client/src/components/UserList.js

import React, { useEffect, useState } from 'react';
import axios from '../api/axios'; // Import your Axios instance

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('/users') // Calls http://localhost:5000/api/users
      .then((response) => {
        setUsers(response.data);
      })
      .catch((err) => {
        setError('Failed to fetch users');
        console.error(err);
      });
  }, []);

  return (
    <div>
      <h2>User List</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <ul>
        {users.map((user) => (
          <li key={user.id}>{user.name}</li> // Adjust based on your API
        ))}
      </ul>
    </div>
  );
};

export default UserList;
