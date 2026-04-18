class SettingsScene extends Phaser.Scene {
    constructor() {
        // A 'key' deve ser igual ao nome que você usará no game.js
        super({ key: 'settingsScene' });
    }

    preload() {
        // Onde carregaremos as artes do seu amigo
    }

    create() {
        // Texto de teste para você ver que não está mais "tudo preto"
        this.add.text(400, 300, 'TELA DE CONFIGURAÇÕES', { 
            fontSize: '32px', 
            fill: '#fff' 
        }).setOrigin(0.5);

        this.add.text(400, 350, 'Clique para simular login', { 
            fontSize: '18px', 
            fill: '#00ff00' 
        }).setOrigin(0.5);

        // Evento de clique para mudar de cena
        this.input.on('pointerdown', () => {
            this.scene.start('mainMenu');
        });
    }

    update() {
        // Lógica constante (não precisa de nada agora)
    }
}