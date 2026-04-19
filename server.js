const express = require('express');                     // Framework que cuida de rotas URLs e arquivos estáticos
const app = express();                                  // Instância do meu aplicativo express
const http = require('http').createServer(app);         // Criando meu servidor http(Padrão NODE) junto com meu express 
const io = require('socket.io')(http);                  // Instãncia do Socket.io, responsável por escutar o tráfego

app.use(express.static('public'));                      // Tudo que está na pasta 'public' o navegador tem acesso direto

// Banco de dados temporário em memória, sendo o de usuários um dicionário (O(1)) e as salas um vetor (O(n))
let usuariosConectados = {};
let salas = [];

// Evento de quando um navegador entra no meu site, cada aba tem um socket único (esse id será usado como ID do jogador)
io.on('connection', (socket) => {                       
    console.log('Novo cliente conectado: ' + socket.id);

    // Escuta quando o jogador tenta fazer login
    socket.on('fazerLogin', (nickname) => {
        const nomeLimpo = nickname.trim();

        // Permitimos apenas letras e números no tamanho de 3 a 11 caracteres
        const regexAlfanumerico = /^[a-zA-Z0-9]{3,11}$/;

        // Verifica se o nome já existe
        const nomeJaExiste = Object.values(usuariosConectados).some(u => u.nome.toLowerCase() === nomeLimpo.toLowerCase());

        if (!regexAlfanumerico.test(nomeLimpo)) {
            console.log(`[REJEITADO] Nome com caracteres inválidos ou tamanho incorreto: ${nomeLimpo}`);
            socket.emit('loginErro', 'Use apenas letras e números (3 a 11 caracteres)!');
            return;
        }

        if (nomeJaExiste) {
            console.log(`[REJEITADO] Alguém já esta usando esse nome: ${nomeLimpo}`);
            socket.emit('loginErro', 'Este nome já está em uso por outro usuário!');
            return;
        }

        // Se está tudo certo com o nome
        usuariosConectados[socket.id] = {
            id: socket.id,
            nome: nomeLimpo,
            vitorias: 0
        };
        
        console.log(`[LOGIN] Usuário aceito: ${nomeLimpo}`);
        socket.emit('loginSucesso', usuariosConectados[socket.id]);
    });

    // Remove o jogador que saiu para evitar vazamento de memória
    socket.on('disconnect', () => {
        if (usuariosConectados[socket.id]) {
            console.log(`Usuário ${usuariosConectados[socket.id].nome} saiu.`);
            delete usuariosConectados[socket.id];
        }
    });
});

// Inicialização do servidor (Porta 3000)
http.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
});