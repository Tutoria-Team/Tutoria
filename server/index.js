require('dotenv').config({ path: __dirname + '/.env' });
const app = require('./src/app');
const { initDB } = require('./src/models');

const PORT = process.env.PORT || 9000;

app.listen(PORT, async () => {
  await initDB();
  console.log(`🚀 Server running on port ${PORT}`);
});