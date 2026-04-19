const socket = io();                            // Instância única --> Singleton
let nickUsuario = "";                           // Variável global que armazena o nome do usuário

// Configuração do Phaser
const config = {
    type: Phaser.AUTO,                          // Phaser decide se usa WebGL ou Canvas
    parent: 'game-container',                   // Onde meu joga será desenhado
    // Define como padrão o full hd como resolução
    width: 1920, 
    height: 1080,
    scale: {
        mode: Phaser.Scale.FIT,                 // O jogo encolhe ou estica para caber em diferentes resoluções
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
