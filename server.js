const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

// Banco de dados em memória
let usuariosConectados = {};
let salas = [];

io.on('connection', (socket) => {
    console.log('Novo cliente conectado: ' + socket.id);

    // --- LÓGICA DE LOGIN COM LIMPEZA DE FANTASMAS ---
    socket.on('fazerLogin', (nickname) => {
        const nomeLimpo = nickname.trim();
        const regexAlfanumerico = /^[a-zA-Z0-9]{3,11}$/;

        if (!regexAlfanumerico.test(nomeLimpo)) {
            socket.emit('loginErro', 'Use apenas letras e números (3 a 11 caracteres)!');
            return;
        }

        // 1. Procurar se o nome já existe no banco de dados
        const usuarioExistente = Object.values(usuariosConectados).find(
            u => u.nome.toLowerCase() === nomeLimpo.toLowerCase()
        );

        if (usuarioExistente) {
            // 2. IMPORTANTE: Verificar se o socket desse usuário ainda está ativo
            const socketAntigo = io.sockets.sockets.get(usuarioExistente.id);

            if (socketAntigo && socketAntigo.connected) {
                // Se o socket antigo ainda responde, barramos o novo login
                console.log(`[NEGADO] Tentativa de duplicar nick ativo: ${nomeLimpo}`);
                socket.emit('loginErro', 'Este nome já está em uso por um jogador ativo!');
                return;
            } else {
                // Se o socket não existe ou caiu, limpamos a "sessão fantasma"
                console.log(`[LIMPEZA] Removendo sessão inativa de: ${nomeLimpo}`);
                delete usuariosConectados[usuarioExistente.id];
                salas = salas.filter(s => s.id !== `sala_${usuarioExistente.id}`);
            }
        }

        // 3. Se passou pelos testes, registra o novo usuário
        usuariosConectados[socket.id] = {
            id: socket.id,
            nome: nomeLimpo,
            vitorias: 0
        };
        socket.nick = nomeLimpo;

        console.log(`[LOGIN] Usuário aceito: ${nomeLimpo}`);
        socket.emit('loginSucesso', usuariosConectados[socket.id]);
        io.emit('atualizarListaSalas', salas);
    });

    // --- GERENCIAMENTO DE SALAS ---
    socket.on('criarSala', () => {
        const salaId = `sala_${socket.id}`;
        const novaSala = {
            id: salaId,
            nome: `Arena de ${socket.nick}`,
            criador: socket.nick,
            jogadores: [socket.id],
            status: 'lobby',
            cheia: false
        };

        socket.join(salaId);
        salas.push(novaSala);

        io.emit('atualizarListaSalas', salas);
        socket.emit('confirmarEntrada', novaSala);
    });

    socket.on('entrarSala', (salaId) => {
        const sala = salas.find(s => s.id === salaId);

        if (sala && sala.jogadores.length < 2) {
            socket.join(salaId);
            sala.jogadores.push(socket.id);
            
            if (sala.jogadores.length === 2) sala.cheia = true;

            // Avisa a sala sobre o novo integrante
            io.to(salaId).emit('chatMensagem', {
                usuario: 'SISTEMA',
                texto: `${socket.nick} entrou no lobby.`
            });

            // Envia lista de nomes para todos na sala
            const nomesNaSala = sala.jogadores.map(id => usuariosConectados[id].nome);
            io.to(salaId).emit('atualizarJogadoresLobby', nomesNaSala);

            io.emit('atualizarListaSalas', salas);
            socket.emit('confirmarEntrada', sala);
        } else {
            socket.emit('loginErro', 'A sala está cheia ou não existe!');
        }
    });

    socket.on('pedirListaNomes', (salaId) => {
        const sala = salas.find(s => s.id === salaId);
        if (sala) {
            const nomesNaSala = sala.jogadores.map(id => usuariosConectados[id] ? usuariosConectados[id].nome : "Desconhecido");
            socket.emit('atualizarJogadoresLobby', nomesNaSala);
        }
    });

    // --- ABANDONAR SALA (SEM DESCONECTAR) ---
    socket.on('abandonarSala', () => {
        const salaDono = salas.find(s => s.id === `sala_${socket.id}`);
        
        if (salaDono) {
            io.to(salaDono.id).emit('salaFechada');
            salas = salas.filter(s => s.id !== salaDono.id);
        } else {
            salas.forEach(sala => {
                if (sala.jogadores.includes(socket.id)) {
                    sala.jogadores = sala.jogadores.filter(id => id !== socket.id);
                    sala.cheia = false;
                    io.to(sala.id).emit('chatMensagem', { usuario: 'SISTEMA', texto: `${socket.nick} abandonou o lobby.` });
                    const nomesRestantes = sala.jogadores.map(id => usuariosConectados[id].nome);
                    io.to(sala.id).emit('atualizarJogadoresLobby', nomesRestantes);
                }
            });
        }
        socket.leaveAll(); // Sai de todas as rooms (exceto a sua própria)
        socket.join(socket.id); 
        io.emit('atualizarListaSalas', salas);
    });

    // --- CHAT ---
    socket.on('enviarMensagem', (dados) => {
        io.to(dados.salaId).emit('chatMensagem', {
            usuario: socket.nick,
            texto: dados.texto
        });
    });

    socket.on('pedirSalas', () => {
        socket.emit('atualizarListaSalas', salas);
    });

    // --- DESCONEXÃO TOTAL (FECHAR ABA/SAIR) ---
    socket.on('disconnect', () => {
        console.log(`[DISCONNECT] ${socket.nick || socket.id} saiu do servidor.`);

        const salaDono = salas.find(s => s.id === `sala_${socket.id}`);
        if (salaDono) {
            io.to(salaDono.id).emit('salaFechada');
            salas = salas.filter(s => s.id !== salaDono.id);
        } else {
            // Se era convidado, remove da lista de quem sobrou
            salas.forEach(sala => {
                if (sala.jogadores.includes(socket.id)) {
                    sala.jogadores = sala.jogadores.filter(id => id !== socket.id);
                    sala.cheia = false;
                    io.to(sala.id).emit('chatMensagem', { usuario: 'SISTEMA', texto: `${socket.nick} desconectou.` });
                    const nomes = sala.jogadores.map(id => usuariosConectados[id] ? usuariosConectados[id].nome : "...");
                    io.to(sala.id).emit('atualizarJogadoresLobby', nomes);
                }
            });
        }

        if (usuariosConectados[socket.id]) {
            delete usuariosConectados[socket.id];
        }
        io.emit('atualizarListaSalas', salas);
    });
});

http.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
});