const socket = io();                            // Instância única --> Singleton
let nickUsuario = "";                           // Variável global que armazena o nome do usuário

// Configuração do Phaser
const config = {
    type: Phaser.AUTO,                          // Phaser decide se usa WebGL ou Canvas
    parent: 'game-container',                   // Onde meu joga será desenhado
    // Pega a largura e altura real da janela do usuário
    width: window.innerWidth, 
    height: window.innerHeight,
    scale: {
        mode: Phaser.Scale.RESIZE,              // O jogo se redimensiona se a janela mudar
        autoCenter: Phaser.Scale.CENTER_BOTH    // Garante que o jogo fique centralizado na div (game-container)
    },
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false }
    },
    // A ordem importa, a primeira cena a ser carregada é o login e o resto aguarda o seu scene.start()
    scene: [Login, MainMenu, Jogar, Lobby, GameScene, RankingScene, SettingsScene]
};

const game = new Phaser.Game(config);

// Caso o usuário mude o redimensionamento de sua tela
window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
});
