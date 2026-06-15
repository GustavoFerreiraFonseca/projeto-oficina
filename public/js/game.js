const socket = io();                            // Instância única --> Singleton
let nickUsuario = "";                           // Variável global que armazena o nome do usuário

// Configuração do Phaser
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 1920,
    height: 1080,
    pixelArt: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.NO_CENTER,     
        expandParent: false                     
    },
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 500 } , debug: true} 
    },
    scene: [Login, MainMenu, Jogar, Lobby, GameScene, RankingScene, SettingsScene]
};

const game = new Phaser.Game(config);

