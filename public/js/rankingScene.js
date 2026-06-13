class RankingScene extends Phaser.Scene {
    constructor() {
        // A 'key' da scene
        super({ key: 'rankingScene' });
    }

    create() {
        // inicializamos o array contendo todos os colocados dod ranking
        this.listaRanking = [];

        // escrendo na tela "TELA DE RANKING"
        this.add.text(975, 200, 'TELA DE RANKING', { 
            fontSize: '120px', fill: '#ffcc00', fontStyle: 'bold'
        }).setOrigin(0.5);

        // desenha a lista
        this.desenharLista();     
        
        // cria o botão de voltar 
        this.criarBotao(975, 1000, 'Voltar', () => this.scene.start('mainMenu'));

        // atualiza o ranking toda vez que o jogador entrar na tela de ranking
        socket.emit('atualizarListaRanking');

        // recebe a mensagem formatada e adiciona na lista
        socket.off('chatListaRanking');
        socket.on('chatListaRanking', (mensagem) => {
            this.adicionarColocado(mensagem)
        });
    }

    // desenha a lista, centralizando ela na tela
    desenharLista() {
        const x = 400, y = 300;
        let box = this.add.graphics();
        box.fillStyle(0x000000, 0.7).fillRoundedRect(x, y, 1150, 600, 15);
        box.lineStyle(4, 0xffcc00).strokeRoundedRect(x, y, 1150, 600, 15);

        this.chatDisplay = this.add.text(x + (1150/2), y + 40, '', { 
            fontSize: '48px', 
            fill: '#fff', 
            align: 'center',
            wordWrap: { width: 1050 } 
        });

        this.chatDisplay.setOrigin(0.5, 0);
    }

    // metodo para adicionar um novo jogador a lista
    adicionarColocado(msg) 
    {
        if (msg.posicao === 1) {
            this.listaRanking = [];
        }

        this.listaRanking.push(`${msg.posicao}: ${msg.usuario} - ${msg.texto} vitorias`);
        if (this.listaRanking.length > 18) this.listaRanking.shift();
        this.chatDisplay.setText(this.listaRanking.join('\n'));
    }

    // cria um botão para poder voltar para a Main Menu
    criarBotao(x, y, label, acao) 
    {
        let larguraB = 500;
        let alturaB = 100;

        // Desenho da borda inicial
        let borda = this.add.graphics();
        borda.lineStyle(5, 0xffffff);
        borda.strokeRoundedRect(x - larguraB/2, y - alturaB/2, larguraB, alturaB, 20);

        // Texto do botão
        let txt = this.add.text(x, y, label, { fontSize: '45px', fill: '#ffffff' })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        // Hover --> Ao passar o mouse por cima do botão ele fica verde
        txt.on('pointerover', () => {
            txt.setStyle({ fill: '#00ff00' });
            borda.clear();
            borda.lineStyle(5, 0x00ff00);
            borda.strokeRoundedRect(x - larguraB/2, y - alturaB/2, larguraB, alturaB, 20);
        });

        txt.on('pointerout', () => {
            txt.setStyle({ fill: '#ffffff' });
            borda.clear();
            borda.lineStyle(5, 0xffffff);
            borda.strokeRoundedRect(x - larguraB/2, y - alturaB/2, larguraB, alturaB, 20);
        });

        txt.on('pointerdown', acao);
    }
}