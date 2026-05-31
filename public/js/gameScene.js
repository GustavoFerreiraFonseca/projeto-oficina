class GameScene extends Phaser.Scene {
    constructor() {
        // A 'key' deve ser igual ao nome que você usará no game.js
        super({ key: 'gameScene' });
        this.player_2 = null;    // sprite do oponente
        this.salaId = null;
        this.nomeUsuario = null;
        this.jogadoresDados = new Map()
    }

    init(data) {
        this.salaId = data.salaId;
        this.nomeUsuario = data.nomeUsuario
        this.jogadoresDados = data.jogadoresDados
    }

    preload() {
        // Onde carregaremos as artes do seu amigo
        // imagem do tileset (contem os quadrados para o tilemap)
        this.load.image('Tileset_arenas', 'sprites/Tileset_arenas.png');

        // imagem do Timemap (mapa real da arena)
        this.load.tilemapTiledJSON('mapa_arena1' , "sprites/Tilemap_Arena.tmj");

        // sprite dos pergonagens
        this.load.image('Guerreiro', 'sprites/Sp_warrior.png');
        this.load.image('Arqueiro', 'sprites/Sp_archer.png');

        // =-------------------------------------------------------= //

        // carregando as animações do Guerreiro
        this.load.spritesheet("Guerreiro_idle", "sprites/sp_sheet_warrior_idle.png", {
            frameWidth: 64,
            frameHeight: 89,
            spacing: 0
        })
        this.load.spritesheet("Guerreiro_attacking", "sprites/sp_sheet_warrior_attacking.png", {
            frameWidth: 106,
            frameHeight: 117,
            spacing: 0
        });
        
        // carregando as animações do Arqueiro
        this.load.spritesheet("Arqueiro_idle", "sprites/sp_sheet_archer_idle.png", {
            frameWidth: 64,
            frameHeight: 96,
            spacing: 0
        });
        
        this.load.spritesheet("Arqueiro_attacking", "sprites/sp_sheet_archer_attacking.png", {
            frameWidth: 134,
            frameHeight: 103,
            spacing: 0
        });

    }

    create() {
        // =------------- definindo os dados do mapa, tilemaps, tileset, etc ---------=
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
        
        // =------------- CRIAÇÃO DOS PLAYERS ---------=
        // criando o player 1
        this.player_1 = new Player(this, 600, 200, this.jogadoresDados.get(this.nomeUsuario)?.heroi, this.jogadoresDados.get(this.nomeUsuario)?.heroi, 1)       
        // fazendo com que o player colida com o chão do cenario
        this.physics.add.collider(this.player_1, chao);
        
        // logica do player 2 (invisível até ele se mover)
        this.player_2 = new Player(this, 600, 200, this.definindo_heroi_oponente(), this.definindo_heroi_oponente(), 1)
        this.player_2.setAlpha(0); // oculto até receber posição
        this.physics.add.collider(this.player_2, chao);
        
        // criando uma lista dos controles que o jogo terá
        this.teclado = this.input.keyboard.addKeys('A,D,Z,X,C,SPACE'); 
        // Avisa o servidor que está pronto
        socket.emit('prontoParaJogar', this.salaId);

        // Recebe a posição do oponente e atualiza o sprite
        socket.off('posicaoOponente');
        socket.on('posicaoOponente', (dados) => {
            this.player_2.setAlpha(1);
            this.player_2.updateDirections_oponente(dados.x, this.player_2.x)
            this.player_2.setPosition(dados.x, dados.y);
            this.player_2.setVelocity(dados.velocityX, dados.velocityY);
            // Se você tiver animações: this.player_2.anims.play(dados.acao, true);
        });

        socket.off('oponentePronto');
        socket.on('oponentePronto', () => {
            console.log('Oponente entrou na arena!');
        });

        socket.off('oponenteDesconectou');
        socket.on('oponenteDesconectou', () => {
            alert('Seu oponente desconectou!');
            this.scene.start('mainMenu');
        });
    }
    
    update() 
    {
        this.player_1.update(this.teclado);

        this.enviarPosicao();
    }

    enviarPosicao() 
    {
        socket.emit('moverJogador', {
            salaId: this.salaId,
            x: this.player_1.x,
            y: this.player_1.y,
            velocityX: this.player_1.body.velocity.x,
            velocityY: this.player_1.body.velocity.y,
            // acao: this.player_1.acaoAtual  // se tiver animações
        });
    }

    definindo_heroi_oponente()
    {
        let heroi_oponente = ""

        this.jogadoresDados.forEach((dados, nome) => {
            if (nome != this.nomeUsuario)
            {
                heroi_oponente = dados.heroi
            }
        });

        return heroi_oponente
    }

}