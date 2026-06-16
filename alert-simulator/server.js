const express = require('express');
const path = require('path');

const app = express();
const PORT = 3333;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚨 OpsGuardian Alert Simulator running at http://localhost:${PORT}`);
});
