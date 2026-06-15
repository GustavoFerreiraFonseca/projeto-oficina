class Lobby extends Phaser.Scene {
    constructor() {
        super({ key: 'Lobby' });
        this.salaAtual = null;
        this.nomeUsuario = null;
        this.mensagens = [];
        this.digitando = false;
        this.textoBuffer = "";
        this.numJogadores = 0;
        this.jogadoresDados = new Map();
        this.criador = null;
    }

    init(data) {
        this.salaAtual = data;
        this.nomeUsuario = data.nomeUsuario;
        this.criador = data.criador;
    }

    create() {
        const largura = 1920;
        const altura = 1080;
        const centroX = largura / 2;

        // Título
        this.add.text(centroX, 80, `ARENA: ${this.salaAtual.nome}`, { 
            fontSize: '60px', fill: '#ffcc00', fontStyle: 'bold' 
        }).setOrigin(0.5);

        // --- LISTA DE JOGADORES (ESQUERDA) ---
        this.add.text(150, 250, 'Jogadores:', { fontSize: '40px', fill: '#ffffff' });
        this.listaJogadoresText = this.add.text(150, 320, '', { fontSize: '35px', fill: '#00ff00' });
        
        // --- BOTÃO SAIR (ABAIXO DA LISTA) ---
        let btnSair = this.add.text(1190, 900, '[ ABANDONAR SALA ]', { 
            fontSize: '40px', fill: '#ff0000', fontStyle: 'bold' 
        })
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {

            if (this.registry.get('SoundEffectsOn')) this.sound.play('sound_Click', {volume: this.registry.get('volumeSFX')});

            if (this.criador == this.nomeUsuario) this.mensagens = [];
            
            // Avisa o servidor para limpar a sala
            socket.emit('abandonarSala');

            this.jogadoresDados.delete(this.nomeUsuario);
            
            // Volta para o Menu Principal no Phaser (mantendo o socket vivo)
            this.scene.start('mainMenu');
        });

        // --- BOTÃO JOGAR (ABAIXO DO BOTÃO SAIR por enquanto...)
        let btnJogar = this.add.text(1190,950, '[ JOGAR ]', {
            fontSize: '40px', fill: '#00ff04', fontStyle: 'bold'
        })
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
            if (this.registry.get('SoundEffectsOn')) this.sound.play('sound_Click', {volume: this.registry.get('volumeSFX')});
            if (this.numJogadores == 2 && this.criador == this.nomeUsuario) socket.emit('iniciarPartida', this.salaAtual.id);
        })

        // --- CHAT (DIREITA) ---
        this.desenharChat();
        // caso ja exista mensagens no chat, ele as desenha 
        if (this.mensagens != null) this.chatDisplay.setText(this.mensagens.join('\n'));

        // --- ESCOLHA DE PERSONAGENS --- 
        this.botoesPersonagens();

        // --- EVENTOS DO SERVER ---
        socket.off('atualizarJogadoresLobby');
        socket.on('atualizarJogadoresLobby', (listaDoServidor) => {
            this.jogadoresDados.clear();
            listaDoServidor.forEach(jogador => {
                this.jogadoresDados.set(jogador.nome, { heroi: jogador.heroi });
                console.log(jogador.nome);
            });

            this.atualizarTextoLista();
            this.numJogadores = listaDoServidor.length;
            
            if (this.numJogadores == 2 && this.criador == this.nomeUsuario)
            {
                btnJogar.setStyle({ fill: '#00ff04'});
                btnJogar.setAlpha(1);
            } else {
                btnJogar.setStyle({ fill: '#446e45'});
                btnJogar.setAlpha(0.5);
            }
        });

        // evento que recebe a mensagem da convertida para o padrão de mensagem, onde ira ser adicionada no chat
        socket.off('chatMensagem');
        socket.on('chatMensagem', (msg) => {
            this.adicionarMensagem(msg);
        });

        // se o host sair da sala, a sala é fechada e todos os jogadores voltam para o menu
        socket.off('salaFechada');
        socket.on('salaFechada', () => {
            alert("O Host encerrou a sala.");
            this.scene.start('mainMenu'); 
        });

        // evento onde apos a permição de entrar, os jogadores iram ser direcionados para a arena
        socket.off('entrandoPartida');
        socket.on('entrandoPartida', () => {

            this.music = this.registry.get('Musica_atual');
            this.music.pause();
            this.registry.set('Musica_atual', this.music);

            this.scene.start('gameScene', { 
                salaId: this.salaAtual.id, 
                nomeUsuario: this.nomeUsuario,
                jogadoresDados: this.jogadoresDados,
                criador: this.criador
            });
        });

        // --- CONTROLES ---
        this.input.keyboard.on('keydown', (e) => this.gerenciarTeclado(e));

        socket.emit('pedirListaNomes', this.salaAtual.id);
    }

    // desenha na tela o chat 
    desenharChat() {
        const x = 1000, y = 250;
        let box = this.add.graphics();
        box.fillStyle(0x000000, 0.7).fillRoundedRect(x, y, 800, 600, 15);
        box.lineStyle(4, 0xffcc00).strokeRoundedRect(x, y, 800, 600, 15);

        this.chatDisplay = this.add.text(x + 20, y + 20, '', { 
            fontSize: '24px', fill: '#fff', wordWrap: { width: 760 } 
        });
        this.labelPrompt = this.add.text(x, y + 620, 'Pressione [ENTER] para conversar', { 
            fontSize: '22px', fill: '#aaa' 
        });
    }

    // metodo para criar botões para escolher o seu heroi
    botoesPersonagens()
    {
        const herois = ['Guerreiro', 'Arqueiro', 'Mago', 'Ninja'];
        let y = 500

        herois.forEach((heroi, i) => {
            let btnHeroi = this.add.text(150, y + 50*i, `[ ${heroi} ]`, {
                fontSize: '40px', fontStyle: 'bold'
            })
            .setInteractive({useHandCursor: true})
            .on('pointerdown', () => {
                if (this.registry.get('SoundEffectsOn')) this.sound.play('sound_Click', {volume: this.registry.get('volumeSFX')});
                socket.emit('mudarHeroi', {
                    salaId: this.salaAtual.id,
                    heroi: heroi
                });
            });
        });
    }

    // atualiza como esta listado os jogadores
    atualizarTextoLista() 
    {
        let texto = '';
        let contador = 1;
        this.jogadoresDados.forEach((dados, nome) => {
            texto += `${contador}. ${nome} - ${dados.heroi}\n`;
            contador++;
        });
        this.listaJogadoresText.setText(texto);
    }

    // adiciona uma mensagem no chat
    adicionarMensagem(msg) {
        this.mensagens.push(`[${msg.usuario}]: ${msg.texto}`);
        if (this.mensagens.length > 18) this.mensagens.shift();
        this.chatDisplay.setText(this.mensagens.join('\n'));
    }
    
    // metodo para gerenciar o teclado, mais especificamente se o jogador clicou no "ENTER"
    gerenciarTeclado(event) {
        if (event.keyCode === 13) { // ENTER
            if (!this.digitando) {
                this.digitando = true;
                this.textoBuffer = "";
                this.labelPrompt.setText("Digitando: |").setStyle({ fill: '#00ff00' });
            } else {
                if (this.textoBuffer.trim() !== "") {
                    socket.emit('enviarMensagem', { salaId: this.salaAtual.id, texto: this.textoBuffer });
                }
                this.digitando = false;
                this.labelPrompt.setText("Pressione [ENTER] para conversar").setStyle({ fill: '#aaa' });
            }
        } else if (this.digitando) {
            if (event.keyCode === 8) this.textoBuffer = this.textoBuffer.slice(0, -1);
            else if (event.key.length === 1) this.textoBuffer += event.key;
            this.labelPrompt.setText("Digitando: " + this.textoBuffer + "|");
        }
    }
}
