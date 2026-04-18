const express = require('express');
const app = express();
const http = require('http').createServer(app);

// Faz o servidor "enxergar" a pasta public
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

http.listen(3000, () => {
  console.log('Servidor rodando em: http://localhost:3000');
});