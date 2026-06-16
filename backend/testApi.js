const http = require('http');
const jwt = require('jsonwebtoken');

// Generate token manually like auth.controller.ts does
const token = jwt.sign(
  { userId: '82a15db1-3425-4d67-9e02-2836d014a12e' }, // Anvesh's ID
  process.env.JWT_SECRET || 'supersecret',
  { expiresIn: '1h' }
);

http.get('http://localhost:5000/api/v1/auth/me', {
  headers: { 'Authorization': `Bearer ${token}` }
}, res => {
  let b = '';
  res.on('data', d => b += d);
  res.on('end', () => {
    console.log("ME RESPONSE FOR ANVESH:");
    console.dir(JSON.parse(b), { depth: null });
  });
});
