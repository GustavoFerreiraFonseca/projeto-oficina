// js/game.js

const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    // Pega a largura e altura real da janela do usuário
    width: window.innerWidth, 
    height: window.innerHeight,
    scale: {
        mode: Phaser.Scale.RESIZE, // O jogo se redimensiona se a janela mudar
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false }
    },
    scene: [Login, MainMenu, Jogar, Lobby, GameScene, RankingScene, SettingsScene]
};

const game = new Phaser.Game(config);

// Variáveis utilitárias para usarmos nas cenas
// Elas sempre darão o centro real, não importa o monitor
let larguraReal = window.innerWidth;
let alturaReal = window.innerHeight;

const socket = io();

let nickUsuario = "";