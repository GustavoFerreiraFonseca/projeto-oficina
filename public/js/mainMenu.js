// js/mainMenu.js

// 1. Defina o padrão visual no topo (como se fosse um CSS)
const ESTILO_BOTAO = {
    corPadrao: 0xffffff,
    corHover: 0x00ff00,
    texto: { fontSize: '22px', fill: '#ffffff' },
    textoHover: { fill: '#00ff00' }
};

class MainMenu extends Phaser.Scene {
    constructor() {
        super({ key: 'mainMenu' });
    }

    create() {
        // Título centralizado
        this.add.text(400, 80, 'MENU PRINCIPAL', { fontSize: '40px', fill: '#ffcc00' }).setOrigin(0.5);

        // 1. Botão JOGAR
        this.criarBotao(400, 200, 'JOGAR', () => {
            this.scene.start('jogar');
        });

        // 2. Botão RANKING
        this.criarBotao(400, 280, 'RANKING', () => {
            this.scene.start('rankingScene');
        });

        // 3. Botão CONFIGURAÇÕES (Certifique-se que esta linha existe!)
        this.criarBotao(400, 360, 'CONFIGURAÇÕES', () => {
            this.scene.start('settingsScene');
        });

        // 4. Botão SAIR
        this.criarBotao(400, 440, 'SAIR', () => {
            window.location.reload(); 
        });
    }

    // Função que desenha o retângulo e o texto com hover
    criarBotao(x, y, label, acao) {
        let largura = 300;
        let altura = 50;

        // Desenho da borda inicial (Branca)
        let borda = this.add.graphics();
        borda.lineStyle(3, 0xffffff);
        borda.strokeRoundedRect(x - largura/2, y - altura/2, largura, altura, 10);

        // Texto do botão
        let txt = this.add.text(x, y, label, { fontSize: '22px', fill: '#ffffff' })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        // --- EVENTOS DE INTERAÇÃO ---
        txt.on('pointerover', () => {
            txt.setStyle({ fill: '#00ff00' }); // Texto verde
            borda.clear();
            borda.lineStyle(3, 0x00ff00); // Borda verde
            borda.strokeRoundedRect(x - largura/2, y - altura/2, largura, altura, 10);
        });

        txt.on('pointerout', () => {
            txt.setStyle({ fill: '#ffffff' }); // Volta branco
            borda.clear();
            borda.lineStyle(3, 0xffffff); // Volta branco
            borda.strokeRoundedRect(x - largura/2, y - altura/2, largura, altura, 10);
        });

        txt.on('pointerdown', acao);
    }
}