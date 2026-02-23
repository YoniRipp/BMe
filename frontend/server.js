/**
 * Static file server for production. Sets Cross-Origin-Opener-Policy so Google OAuth popup flow works.
 */
const express = require('express');
const path = require('path');
const dist = path.join(__dirname, 'dist');
const port = Number(process.env.PORT) || 3000;

const app = express();
app.use((_req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  next();
});
app.use(express.static(dist));
app.use((_req, res) => res.sendFile(path.join(dist, 'index.html')));

app.listen(port, () => {
  console.log(`BMe frontend: listening on port ${port}`);
});
