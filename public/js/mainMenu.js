class MainMenu extends Phaser.Scene {
    constructor() {
        super({ key: 'mainMenu' });
    }

    create() {
        this.add.text(400, 80, 'MENU PRINCIPAL', { fontSize: '40px', fill: '#fff' }).setOrigin(0.5);

        // Criando as opções com retângulos
        this.criarBotao(400, 200, 'JOGAR', () => this.scene.start('jogar'));
        this.criarBotao(400, 280, 'RANKING', () => this.scene.start('rankingScene'));
        this.criarBotao(400, 360, 'CONFIGURAÇÕES', () => this.scene.start('settingsScene'));
        
        // OPÇÃO SAIR: Volta para o login
        this.criarBotao(400, 440, 'SAIR', () => {
            // Opcional: avisar o servidor que deslogou
            window.location.reload(); // Recarrega a página para limpar tudo
        }, 0xff0000); // Cor vermelha para o Sair
    }

    // Função auxiliar para desenhar botões contornados
    criarBotao(x, y, texto, acao, corBorda = 0xffcc00) {
        let largura = 300;
        let altura = 50;

        let fundo = this.add.graphics();
        fundo.lineStyle(3, corBorda);
        fundo.strokeRoundedRect(x - largura/2, y - altura/2, largura, altura, 10);

        let txt = this.add.text(x, y, texto, { fontSize: '22px', fill: '#fff' })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        // Efeito visual ao passar o mouse
        txt.on('pointerover', () => txt.setStyle({ fill: '#ffcc00' }));
        txt.on('pointerout', () => txt.setStyle({ fill: '#fff' }));
        
        txt.on('pointerdown', acao);
    }
}