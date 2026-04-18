const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 } }
    },
    // Verifique se os nomes batem com os arquivos (Login com L maiúsculo)
    scene: [Login, MainMenu, Jogar, Lobby, GameScene, RankingScene, SettingsScene]
};

const game = new Phaser.Game(config);
const socket = io();