class MainMenu extends Phaser.Scene {
    constructor() {
        super({ key: 'mainMenu' });
    }

    create() {
        // Captura as dimensões dinâmicas da janela do navegador
        const largura = this.cameras.main.width;
        const altura = this.cameras.main.height;
        const centroX = largura / 2;
        const centroY = altura / 2;

        // 1. Usuário no canto superior esquerdo (Padding de 20px)
        this.add.text(20, 20, `Usuário: ${nickUsuario}`, { 
            fontSize: '20px', 
            fill: '#ffcc00',
            fontStyle: 'bold'
        }).setOrigin(0, 0);

        // 2. Título "COLISEU" centralizado dinamicamente
        this.add.text(centroX, altura * 0.15, 'COLISEU', { 
            fontSize: '60px', 
            fill: '#ffcc00',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 3. Botões centralizados usando o centroX real
        // Multiplicamos a altura por frações (0.4, 0.5, etc) para distribuir os botões
        this.criarBotao(centroX, altura * 0.40, 'JOGAR', () => this.scene.start('jogar'));
        this.criarBotao(centroX, altura * 0.52, 'RANKING', () => this.scene.start('rankingScene'));
        this.criarBotao(centroX, altura * 0.64, 'CONFIGURAÇÕES', () => this.scene.start('settingsScene'));
        this.criarBotao(centroX, altura * 0.76, 'SAIR', () => window.location.reload());
    }

    // Função que desenha o retângulo e o texto com hover de forma dinâmica
    criarBotao(x, y, label, acao) {
        let larguraB = 350; // Aumentei um pouco para caber "CONFIGURAÇÕES" confortavelmente
        let alturaB = 60;

        // Desenho da borda inicial (Branca)
        let borda = this.add.graphics();
        borda.lineStyle(3, 0xffffff);
        borda.strokeRoundedRect(x - larguraB/2, y - alturaB/2, larguraB, alturaB, 10);

        // Texto do botão
        let txt = this.add.text(x, y, label, { fontSize: '26px', fill: '#ffffff' })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        // --- EVENTOS DE INTERAÇÃO (HOVER) ---
        txt.on('pointerover', () => {
            txt.setStyle({ fill: '#00ff00' });
            borda.clear();
            borda.lineStyle(3, 0x00ff00);
            borda.strokeRoundedRect(x - larguraB/2, y - alturaB/2, larguraB, alturaB, 10);
        });

        txt.on('pointerout', () => {
            txt.setStyle({ fill: '#ffffff' });
            borda.clear();
            borda.lineStyle(3, 0xffffff);
            borda.strokeRoundedRect(x - larguraB/2, y - alturaB/2, larguraB, alturaB, 10);
        });

        txt.on('pointerdown', acao);
    }
}