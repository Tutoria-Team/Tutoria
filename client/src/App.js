import './App.css';
import axios from 'axios';
import React, {useState, useEffect} from 'react';
import Header from './components/Header';
import 'bootstrap/dist/css/bootstrap.min.css'

const App = () => {
  const [user, setUser] = useState(null);

  return (
    <div>
      <Header user={user} setUser={setUser} />
      <div style={{ maxWidth: 400, margin: 'auto', padding: 20 }}>
        
      </div>
    </div>
  );
};

export default App;
