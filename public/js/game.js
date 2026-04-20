const socket = io();                            // Instância única --> Singleton
let nickUsuario = "";                           // Variável global que armazena o nome do usuário

const style = document.createElement('style');
style.innerHTML = `
body { margin: 0; padding: 0; background-color: #000; overflow: hidden; }
#game-container { width: 100vw; height: 100vh; display: flex; justify-content: center; align-items: center; }
`;
document.head.appendChild(style);

// Configuração do Phaser
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 1920,
    height: 1080,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.NO_CENTER,
        expandParent: false // CRITICAL: Impede que o Phaser deforme a div pai
    },
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false }
    },
    scene: [Login, MainMenu, Jogar, Lobby, GameScene, RankingScene, SettingsScene]
};

const game = new Phaser.Game(config);

