class Lobby extends Phaser.Scene {
    constructor() {
        super({ key: 'Lobby' });
        this.salaAtual = null;
        this.mensagens = [];
        this.digitando = false;
        this.textoBuffer = "";
    }

    init(data) {
        this.salaAtual = data;
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
            // Avisa o servidor para limpar a sala
            socket.emit('abandonarSala');
            
            // Volta para o Menu Principal no Phaser (mantendo o socket vivo)
            this.scene.start('mainMenu');
        });

        // --- CHAT (DIREITA) ---
        this.desenharChat();

        // --- EVENTOS DO SERVER ---
        socket.off('atualizarJogadoresLobby');
        socket.on('atualizarJogadoresLobby', (nomes) => {
            let lista = nomes.map((n, i) => `${i + 1}. ${n}`).join('\n');
            this.listaJogadoresText.setText(lista);
        });

        socket.off('chatMensagem');
        socket.on('chatMensagem', (msg) => {
            this.adicionarMensagem(msg);
        });

        socket.off('salaFechada');
        socket.on('salaFechada', () => {
            alert("O Host encerrou a sala.");
            this.scene.start('mainMenu'); // Em vez de reload, vai para o menu
        });

        // --- CONTROLES ---
        this.input.keyboard.on('keydown', (e) => this.gerenciarTeclado(e));

        // SOLUÇÃO PARA O BUG DE LISTA VAZIA:
        // Assim que o convidado entra, ele avisa o server que o Lobby dele carregou
        socket.emit('pedirListaNomes', this.salaAtual.id);
    }

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

    adicionarMensagem(msg) {
        this.mensagens.push(`[${msg.usuario}]: ${msg.texto}`);
        if (this.mensagens.length > 18) this.mensagens.shift();
        this.chatDisplay.setText(this.mensagens.join('\n'));
    }

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