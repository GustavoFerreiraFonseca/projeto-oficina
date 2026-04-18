const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

// Banco de dados temporário em memória (Array de objetos)
let usuariosConectados = {};
let salas = [];

io.on('connection', (socket) => {
    console.log('Novo cliente conectado: ' + socket.id);

    // Escuta quando o jogador tenta fazer login
    socket.on('fazerLogin', (nickname) => {
        // Lógica simples: salva o nickname associado ao ID do socket
        usuariosConectados[socket.id] = {
            id: socket.id,
            nome: nickname,
            vitorias: 0
        };
        
        console.log(`Usuário logado: ${nickname}`);
        
        // Responde para o cliente que o login deu certo
        socket.emit('loginSucesso', usuariosConectados[socket.id]);
    });

    socket.on('disconnect', () => {
        if (usuariosConectados[socket.id]) {
            console.log(`Usuário ${usuariosConectados[socket.id].nome} saiu.`);
            delete usuariosConectados[socket.id];
        }
    });
});

http.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
});