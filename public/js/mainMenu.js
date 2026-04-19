// Minha classe MainMenu herda de uma cena do Phaser
class MainMenu extends Phaser.Scene {
    constructor() {
        super({ key: 'mainMenu' });
    }

    create() {
        // Captura as dimensões dinâmicas da janela do navegador
        const largura = 1920;
        const altura = 1080;
        const centroX = largura / 2;
        const centroY = altura / 2;

        // Coloca o nome do usuário no canto superior esquerdo
        this.add.text(40, 40, `Usuário: ${nickUsuario}`, { 
            fontSize: '35px', 
            fill: '#ffcc00',
            fontStyle: 'bold'
        }).setOrigin(0, 0);

        // Coloca o título "MENU PRINCIPAL" centralizado
        this.add.text(centroX, 200, 'MENU PRINCIPAL', { 
            fontSize: '100px', 
            fill: '#ffcc00',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Botões centralizados usando o centroX real
        this.criarBotao(centroX, 450, 'JOGAR', () => this.scene.start('jogar'));
        this.criarBotao(centroX, 580, 'RANKING', () => this.scene.start('rankingScene'));
        this.criarBotao(centroX, 710, 'CONFIGURAÇÕES', () => this.scene.start('settingsScene'));
        this.criarBotao(centroX, 840, 'SAIR', () => window.location.reload());
    }

    // Função que desenha o retângulo e o texto com hover
    criarBotao(x, y, label, acao) {
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