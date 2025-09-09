require("dotenv").config({ path: __dirname + "/.env" });
const express = require('express');
const pool = require(__dirname + "/config/db.config.js");

const app = express();

const PORT = process.env.PORT || 9000;

app.use(express.json()); 

//Functions
const getUsers = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Database query failed:', error);
    res.status(500).json({ error: error.message });
  }
};

//Here you can add your routes
//Here's an example
app.get("/", (req, res) => {
    res.send("Hello World!");
  });

app.get('/users', getUsers)

app.listen(PORT, () => {
    console.log(`Server listening on the port  ${PORT}`);
})