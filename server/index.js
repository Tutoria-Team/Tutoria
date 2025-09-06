require("dotenv").config({ path: __dirname + "/.env" });
const express = require('express');
const pool = require(__dirname + "/config/db.config.js");

const app = express();

const PORT = process.env.PORT || 9000;

app.use(express.json()); 

//Functions
const getUsers =  (req, res) => {
  pool.query('SELECT * FROM users', (error, users) => {
    if (error) {
      console.error('Error executing query', error.stack);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.status(200).json(users.rows)
  })
}

//Here you can add your routes
//Here's an example
app.get("/", (req, res) => {
    res.send("Hello World!");
  });

app.get('/users', getUsers)

app.listen(PORT, () => {
    console.log(`Server listening on the port  ${PORT}`);
})