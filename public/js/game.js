const socket = io();                            // Instância única --> Singleton
let nickUsuario = "";                           // Variável global que armazena o nome do usuário

// Configuração do Phaser
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 1920,
    height: 1080,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.NO_CENTER,     // Com o auto-center o phaser estava redimensionando errado
        expandParent: false                     // Impede o phaser alterar a div pai
    },
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false }
    },
    scene: [Login, MainMenu, Jogar, Lobby, GameScene, RankingScene, SettingsScene]
};

const game = new Phaser.Game(config);

