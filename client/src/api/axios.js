// client/src/api/axios.js

import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:9000/api', // Update this URL if your backend is different
  headers: {
    'Content-Type': 'application/json',
  },
});

export default instance;