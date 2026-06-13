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

            const usuarioExistente = Object.values(usuariosConectados).find(
                u => u.nome.toLowerCase() === nomeLimpo.toLowerCase()
            );

            if (usuarioExistente) {
                const socketAntigo = io.sockets.sockets.get(usuarioExistente.id);

                if (socketAntigo && socketAntigo.connected) {
                    console.log(`[NEGADO] Tentativa de duplicar nick ativo: ${nomeLimpo}`);
                    socket.emit('loginErro', 'Este nome já está em uso por um jogador ativo!');
                    return;
                } else {
                    console.log(`[LIMPEZA] Removendo sessão inativa de: ${nomeLimpo}`);
                    delete usuariosConectados[usuarioExistente.id];
                    salas = salas.filter(s => s.id !== `sala_${usuarioExistente.id}`);
                }
            }

            usuariosConectados[socket.id] = {
                id: socket.id,
                nome: nomeLimpo,
                Nvitorias: 0
            };
            socket.nick = nomeLimpo;
            socket.Nvitorias = 0;

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

        // verifica se a sala esta cheia ou não para que um novo jogador entre, alem de avisar no char do lobby quem entrou 
        socket.on('entrarSala', (salaId) => {
            const sala = salas.find(s => s.id === salaId);

            if (sala && sala.jogadores.length < 2) {
                socket.join(salaId);
                sala.jogadores.push(socket.id);
                
                if (sala.jogadores.length === 2) sala.cheia = true;

                socket.emit('confirmarEntrada', sala); 

                io.to(salaId).emit('chatMensagem', {
                    usuario: 'SISTEMA',
                    texto: `${socket.nick} entrou no lobby.`
                });
                enviarListaLobby(salaId);
            } else {
                socket.emit('loginErro', 'Sala cheia ou inexistente!');
            }
        });

        socket.on('pedirListaNomes', (salaId) => {
            enviarListaLobby(salaId);
        });

        // Ao clicar no heroi que eles querem, o sistema mudara o heroi para ele
        socket.on('mudarHeroi', (dados) => {
            const { salaId, heroi } = dados;
            if (usuariosConectados[socket.id]) {
                usuariosConectados[socket.id].heroi = heroi;

                io.to(salaId).emit('chatMensagem', {
                    usuario: 'SISTEMA',
                    texto: `${socket.nick} escolheu o heroi: ${heroi}.`
                });

                enviarListaLobby(salaId);
            }
        });

        // --- ABANDONAR SALA (SEM DESCONECTAR) ---
        socket.on('abandonarSala', () => {
            const salaDono = salas.find(s => s.id === `sala_${socket.id}`);
            
            if (salaDono) {
                socket.to(salaDono.id).emit('salaFechada');
                salas = salas.filter(s => s.id !== salaDono.id);
            } else {
                salas.forEach(sala => {
                    if (sala.jogadores.includes(socket.id)) {
                        sala.jogadores = sala.jogadores.filter(id => id !== socket.id);
                        sala.cheia = false;
                        io.to(sala.id).emit('chatMensagem', { usuario: 'SISTEMA', texto: `${socket.nick} abandonou o lobby.` });
                        enviarListaLobby(sala.id);
                    }
                });
            }
            socket.leaveAll();
            socket.join(socket.id); 
            io.emit('atualizarListaSalas', salas);
        });

        // quando um jogadores terminar a partida e clicar em sair, voltam para o lobby
        socket.on('abandonarPartida', (salaId) => {
            const sala = salas.find(s => s.id === salaId);
            if (sala) 
            {
                sala.status = 'lobby'; 
                sala.cheia = true;    
            }

            io.to(salaId).emit('voltarLobby', sala);
        })

        // --- Lista Ranking
        socket.on('enviarMensagem', (dados) => {
            io.to(dados.salaId).emit('chatMensagem', {
                usuario: socket.nick,
                texto: dados.texto
            });
        });

        socket.on('pedirSalas', () => {
            socket.emit('atualizarListaSalas', salas);
        });

        socket.on('iniciarPartida', (salaAtual) => {
            io.to(salaAtual).emit('entrandoPartida');
        });

        // --- MOVIMENTAÇÃO ---
        socket.on('moverJogador', (dados) => {
            // dados = { x, y, velocityX, velocityY, flipX, vida, salaId }
            socket.to(dados.salaId).emit('posicaoOponente', dados);
        });

        socket.on('dispararFlecha', (dados) => {
            // Repassa os dados do tiro para o outro jogador na sala criar a flecha visualmente
            socket.to(dados.salaId).emit('dispararFlecha', dados);
        });

        // cliente calcula localmente a colisão e manda para o outro jogador via servidor para poder aplicar o dano
        socket.on('atacarOponente', (dados) => {
            console.log(`[COMBATE] ${socket.nick} causou ${dados.dano} de dano na sala ${dados.salaId}`);
            socket.to(dados.salaId).emit('receberDano', { dano: dados.dano });
        });

        // Sincronizar estado inicial quando os dois entram
        socket.on('prontoParaJogar', (salaId) => {
            socket.to(salaId).emit('oponentePronto');
        });

        // adicionando + 1 no contador de vitorias // 
        socket.on('AdicionarVitoria', () => {
            usuariosConectados[socket.id].Nvitorias += 1;
        })

        // atualiza a lista do ranking de na ordem decrescente, mostrando a posição, nome e numero de vitorias
        socket.on('atualizarListaRanking', () => {
            // pegando os valores dentro do objeto usuariosConectados
            let listaJogadores = Object.values(usuariosConectados);

            let lista_ordenada = listaJogadores.sort((a, b) => b.Nvitorias - a.Nvitorias);
            
            lista_ordenada.forEach((jogador, n) => {
                socket.emit('chatListaRanking', {
                    posicao: n + 1,
                    usuario: jogador.nome,
                    texto: jogador.Nvitorias,
                });
            });
        });

        // --- DESCONEXÃO TOTAL ---
        socket.on('disconnect', () => {
            console.log(`[DISCONNECT] ${socket.nick || socket.id} saiu do servidor.`);

            // Avisa oponente se estava em partida
            salas.forEach(sala => {
                if (sala.jogadores.includes(socket.id)) {
                    socket.to(sala.id).emit('oponenteDesconectou');
                }
            });

            const salaDono = salas.find(s => s.id === `sala_${socket.id}`);
            if (salaDono) {
                socket.to(salaDono.id).emit('salaFechada');
                salas = salas.filter(s => s.id !== salaDono.id);
            } else {
                salas.forEach(sala => {
                    if (sala.jogadores.includes(socket.id)) {
                        sala.jogadores = sala.jogadores.filter(id => id !== socket.id);
                        sala.cheia = false;
                        io.to(sala.id).emit('chatMensagem', { 
                            usuario: 'SISTEMA', 
                            texto: `${socket.nick || 'Um jogador'} desconectou.` 
                        });
                        enviarListaLobby(sala.id);
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

    function enviarListaLobby(salaId) 
    {
        const sala = salas.find(s => s.id === salaId);
        if (!sala) return;

        const listaPadronizada = sala.jogadores.map(id => ({
            nome: usuariosConectados[id] ? usuariosConectados[id].nome : "Desconhecido",
            heroi: usuariosConectados[id] ? (usuariosConectados[id].heroi || 'Guerreiro') : 'Guerreiro'
        }));
        io.to(salaId).emit('atualizarJogadoresLobby', listaPadronizada);
    }