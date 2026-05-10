class GameScene extends Phaser.Scene {
    constructor() {
        // A 'key' deve ser igual ao nome que você usará no game.js
        super({ key: 'gameScene' });
    }

    preload() {
        // Onde carregaremos as artes do seu amigo
        // imagem do tileset (contem os quadrados para o tilemap)
        this.load.image('Tileset_arenas', 'sprites/Tileset_arenas.png');

        // imagem do Timemap (mapa real da arena)
        this.load.tilemapTiledJSON('mapa_arena1' , "sprites/Tilemap_Arena.tmj");

        // sprite do player
        this.load.image('guerreiro', 'sprites/Sp_warrior.png');
    }

    create() {
        // Texto de teste para você ver que não está mais "tudo preto"
        this.add.text(400, 300, 'TELA DA ARENA', { 
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

        const map = this.make.tilemap({ key: 'mapa_arena1' });
    
        // O primeiro nome deve ser o nome que aparece dentro do arquivo.tmj
        // O segundo é a chave do nosso tileset definido no preload
        const tileset = map.addTilesetImage('Tileset_arena', 'Tileset_arenas');
        
        // definindo a escala, já que é pixel art
        const escala = 3; 

        // colocando cada layer do mapa na tela
        const fundo = map.createLayer('fundo', tileset, 0, 0).setScale(escala);
        fundo.depth = -2;

        const nuvens = map.createLayer('nuvens', tileset, 0, 0).setScale(escala);
        nuvens.depth = -1;

        const chao = map.createLayer('terreno', tileset, 0, 0).setScale(escala);
        chao.setCollisionByProperty({ collides: true });
        chao.depth = 0;
        
        // Faz a câmera focar no centro do mapa
        this.cameras.main.setBounds(0, 0, map.widthInPixels * escala, map.heightInPixels * escala);

        // criando o player 1
        this.player_1 = new Player(this, 600, 200, 'guerreiro', "guerreiro", 1);
        // fazendo com que o player colida com o chão do cenario
        this.physics.add.collider(this.player_1, chao);

        // criando uma lista dos controles que o jogo terá
        this.teclado = this.input.keyboard.addKeys('A,D,Z,X,C,SPACE'); 
    }
    
    update() 
    {
        this.player_1.update(this.teclado);
    }
}