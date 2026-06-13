class GameScene extends Phaser.Scene {
    // construtor da classe
    constructor() {
        super({ key: 'gameScene' });
        this.player_2       = null;
        this.salaId         = null;
        this.nomeUsuario    = null;
        this.jogadoresDados = new Map();
        this._hudP1            = null;
        this._hudP2            = null;
        this._nomeP1           = '';
        this._nomeP2           = '';
        this._partidaEncerrada = false;
        this._chao             = null; // referência ao layer de colisão
    }

    // inicizalizando alguns dados
    init(data) {
        this.salaId         = data.salaId;
        this.nomeUsuario    = data.nomeUsuario;
        this.jogadoresDados = data.jogadoresDados;
    }

    // fazendo o preload dos sprites e spritesheets, alem do tilemap da arena (no caso apenas 1 tilemap)
    preload() {
        this.load.image('Tileset_arenas', 'sprites/Tileset_arenas.png');
        this.load.tilemapTiledJSON('mapa_arena1', 'sprites/Tilemap_Arena.tmj');

        this.load.image('Guerreiro',  'sprites/Sp_warrior.png');
        this.load.image('Arqueiro',   'sprites/Sp_archer.png');
        this.load.image('sp_arrow',   'sprites/sp_arrow.png');   // projétil
        this.load.image('Hud',        'sprites/sp_health_bar.png') // hud 

        this.load.spritesheet('Guerreiro_idle',      'sprites/sp_sheet_warrior_idle.png',
            { frameWidth: 106, frameHeight: 117 });
        this.load.spritesheet('Guerreiro_attacking', 'sprites/sp_sheet_warrior_attacking.png',
            { frameWidth: 106, frameHeight: 117 });
        this.load.spritesheet('Arqueiro_idle',       'sprites/sp_sheet_archer_idle.png',
            { frameWidth: 204, frameHeight: 103 });
        this.load.spritesheet('Arqueiro_attacking',  'sprites/sp_sheet_archer_attacking.png',
            { frameWidth: 204, frameHeight: 103 });
    }

    create() {
        // resetando todas as variaveis para previnir de bugs futuros
        this.player_2       = null;
        this._hudP1            = null;
        this._hudP2            = null;
        this._nomeP1           = '';
        this._nomeP2           = '';
        this._partidaEncerrada = false;
        this._chao             = null; 
        this.physics.resume();

        // definindo o Mapa 
        const map     = this.make.tilemap({ key: 'mapa_arena1' });
        const tileset = map.addTilesetImage('Tileset_arena', 'Tileset_arenas');
        const escala  = 3; 

        map.createLayer('fundo',  tileset, 0, 0).setScale(escala).setDepth(-2);
        map.createLayer('nuvens', tileset, 0, 0).setScale(escala).setDepth(-1);

        this._chao = map.createLayer('terreno', tileset, 0, 0).setScale(escala).setDepth(0);
        this._chao.setCollisionByProperty({ collides: true });

        this.cameras.main.setBounds(0, 0, map.widthInPixels * escala, map.heightInPixels * escala);

        // criando os players, tanto o jogador atual, quanto o oponente
        const heroiLocal    = this.jogadoresDados.get(this.nomeUsuario)?.heroi ?? 'Guerreiro';
        const heroiOponente = this._heroiOponente();

        this.player_1 = new Player(this, 500, 200, heroiLocal,    heroiLocal,    1); // P1
        this.player_2 = new Player(this, 900, 200, heroiOponente, heroiOponente, 1); // P2
        this.player_2.setAlpha(0);

        this.physics.add.collider(this.player_1, this._chao);
        this.physics.add.collider(this.player_2, this._chao);

        // Colisão das flechas do P1 com o chão 
        this.physics.add.collider(
            this.player_1.flechas,
            this._chao,
            (flecha) => { flecha.destruir(); }
        );

        // --- Nomes e HUD ---
        this._nomeP1 = this.nomeUsuario;
        this._nomeP2 = this._nomeOponente();
        this._criarHUD();

        // --- Controles ---
        this.teclado = this.input.keyboard.addKeys('A,D,Z,X,C,SPACE');

        // gerenciamento do clique do mouse do player1, especificamente se o player está usando o Guerreiro
        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown() && this.player_1.character === 'Guerreiro') {
                this.player_1.ativarAtaquePorMouse();
            }
        });

        // Começando os registros dos eventos do Socket
        socket.emit('prontoParaJogar', this.salaId);
        this._registrarEventosSocket();
    }

    // update a cada frame
    update() {
        if (this._partidaEncerrada) return;

        this.player_1.update(this.teclado);

        // Checa colisão: hitbox corpo a corpo do P1 vs P2
        this._checarAtaqueCaC();

        // Checa colisão: flechas do P1 vs corpo do P2
        this._checarFlechas();

        this._atualizarHUD();
        this._enviarPosicao();
        this._checarFimDePartida();
    }

    // verificando o ataque do guerreiro (ataque corpo a corpo)
    _checarAtaqueCaC() {
        if (!this.player_1.hitboxAtaque.ativa) return;
        if (this.player_2.alpha === 0)         return;

        const r1 = this.player_1.hitboxAtaque.getBounds();
        const r2 = this.player_2.getBounds();

        if (Phaser.Geom.Intersects.RectangleToRectangle(r1, r2)) {
            this.player_1.hitboxAtaque.ativa = false;
            const dano = 18; // dano do Guerreiro
            socket.emit('atacarOponente', { salaId: this.salaId, dano });
            this._flashHit(this.player_2);
        }
    }

    // verificando a colisão da flecha
    _checarFlechas() {
        if (this.player_2.alpha === 0) return;

        const alvoBounds = this.player_2.getBounds();

        this.player_1.flechas.getChildren().forEach((flecha) => {
            if (!flecha.active) return;

            const flechaBounds = flecha.getBounds();
            if (Phaser.Geom.Intersects.RectangleToRectangle(flechaBounds, alvoBounds)) {
                flecha.destruir();

                const dano = 12; // dano do Arqueiro
                socket.emit('atacarOponente', { salaId: this.salaId, dano });
                this._flashHit(this.player_2);
            }
        });
    }

    // Flash visual de hit
    _flashHit(alvo) {
        alvo.setTint(0xffffff);
        this.time.delayedCall(80,  () => alvo.setTint(0xff4444));
        this.time.delayedCall(220, () => alvo.clearTint());
    }

    //criando a hud, basicamente apenas contendo a barra de vida
    _criarHUD() {
        const W = 600, H = 48, Y = 114;
        const borda = this.add.sprite(0, 0, 'Hud');
        borda.setOrigin(0, 0);
        borda.setDepth(20);
        borda.setScale(3);
        this._hudP1 = this._makeBarraVida(303,             Y, W, H, this._nomeP1, 'left');
        this._hudP2 = this._makeBarraVida(1920 - 303 - W,  Y, W, H, this._nomeP2, 'right');
    }

    // criando a barra de vida do jogador
    _makeBarraVida(x, y, w, h, nome, lado) {
        // Fundo
        this.add.rectangle(x, y, w, h, 0x111111, 0.85)
            .setOrigin(0,0).setScrollFactor(0).setDepth(10);
        // Barra
        const barra = this.add.rectangle(x, y, w, h, 0x00cc44, 1)
            .setOrigin(0,0).setScrollFactor(0).setDepth(11);
        // Borda
        const g = this.add.graphics().setScrollFactor(0).setDepth(12);
        g.lineStyle(2, 0xffffff, 0.7);
        g.strokeRect(x, y, w, h);
        // Nome
        const txtX = lado === 'left' ? x + 6 : x + w - 6;
        this.add.text(txtX, y - 64, nome, {
            fontSize: '32px', fill: '#fff', fontStyle: 'bold',
            stroke: '#000', strokeThickness: 10
        }).setOrigin(lado === 'left' ? 0 : 1, 0).setScrollFactor(0).setDepth(22);

        return { barra, larguraBase: w, x: x, y: y };
    }

    // atualiza a cada frame o hud
    _atualizarHUD() {
        this._setBarra(this._hudP1, this.player_1.vida, this.player_1.maxVida);
        this._setBarra_oponente(this._hudP2, this.player_2.vida, this.player_2.maxVida);
    }

    // criando a barra de vida do jogador atual
    _setBarra(hud, vida, max) {
        const pct = Phaser.Math.Clamp(vida / max, 0, 1);
        hud.barra.width = hud.larguraBase * pct;
        if      (pct > 0.5)  hud.barra.setFillStyle(0x00cc44);
        else if (pct > 0.25) hud.barra.setFillStyle(0xffaa00);
        else                 hud.barra.setFillStyle(0xee2222);
    }
    
    // criando a barra de vida do oponente
    _setBarra_oponente(hud, vida, max) {
        const pct = Phaser.Math.Clamp(vida / max, 0, 1);
        hud.barra.width = hud.larguraBase * pct;
        hud.barra.setPosition(hud.x + (hud.larguraBase - ( hud.larguraBase * pct)), hud.y);
        if      (pct > 0.5)  hud.barra.setFillStyle(0x00cc44);
        else if (pct > 0.25) hud.barra.setFillStyle(0xffaa00);
        else                 hud.barra.setFillStyle(0xee2222);
    }

    // enviar posição junto com as ações do player como mirar, atirar, atacar, etc
    _enviarPosicao() {

        const animacaoAtual = this.player_1.anims.currentAnim ? this.player_1.anims.currentAnim.key : null;

        socket.emit('moverJogador', {
            salaId:    this.salaId,
            x:         this.player_1.x,
            y:         this.player_1.y,
            velocityX: this.player_1.body.velocity.x,
            velocityY: this.player_1.body.velocity.y,
            flipX:     this.player_1.flipX,
            vida:      this.player_1.vida,

            animacao: animacaoAtual,
            carregandoArqueiro: this.player_1._carregando,
            anguloArqueiro: this.player_1._cargaAngulo
        });
    }

    // registrando todos os eventos do socket 
    _registrarEventosSocket() {
        socket.off('posicaoOponente');
        socket.on('posicaoOponente', (dados) => {
            this.player_2.setAlpha(1);
            this.player_2.setFlipX(dados.flipX)
            this.player_2.updateDirections_oponente(dados.x, this.player_2.x);
            this.player_2.setPosition(dados.x, dados.y);
            this.player_2.setVelocity(dados.velocityX, dados.velocityY);
            if (dados.vida !== undefined) this.player_2.vida = dados.vida;

            if (dados.animacao) {
                // Captura qual animação o player_2 está tocando neste exato momento na sua tela
                const animacaoOponenteNaMinhaTela = this.player_2.anims.currentAnim ? this.player_2.anims.currentAnim.key : null;

                // TRAVA DE SEGURANÇA: Só dá o .play() se a animação que veio da rede for DIFERENTE da que já está rodando
                if (dados.animacao !== animacaoOponenteNaMinhaTela) {
                    this.player_2.play(dados.animacao, true);
                }
            }

            if (this.player_2.character === 'Arqueiro') {
                // Se o oponente estiver segurando o botão de carregar na tela dele...
                if (dados.carregandoArqueiro) {
                    this.player_2._carregando = true;
                    this.player_2._cargaAngulo = dados.anguloArqueiro;
                    
                    // Força a animação a pausar no frame do arco tensionado (Frame 4)
                    if (this.player_2.anims.isPlaying) {
                        this.player_2.anims.pause();
                    }
                    
                    // Executa o método do player que desenha a linha branca tracejada na tela
                    this.player_2._atualizarMiraOponente(dados.anguloArqueiro);
                } else {
                    // Se ele soltou o botão, limpamos a mira do oponente
                    this.player_2._carregando = false;
                    this.player_2._miraGfx.clear();
                    if (this.player_2.anims.isPaused) {
                        this.player_2.anims.resume();
                    }
                }
            }
        });

        // evento que dispara a flecha
        socket.off('dispararFlecha');
        socket.on('dispararFlecha', (dados) => {
            if (!this.player_2 || this.player_2.alpha === 0) return;

            const flechaOponente = new Arrow(
                this,
                dados.x,
                dados.y,
                dados.angulo,
                700
            );

            this.player_2.flechas.add(flechaOponente);
            flechaOponente.atirar(dados.angulo, 700);

            if (this.plataformas) {
                this.physics.add.collider(flechaOponente, this.plataformas, () => {
                    flechaOponente.destroy(); // Some ao tocar no chão/parede
                });
            }

            this.physics.add.collider(flechaOponente, this._chao, () => {
                    flechaOponente.destroy(); // Some ao tocar no chão/parede
                });

            // B. Fazer a flecha sumir (e te dar dano) se bater em VOCÊ (this.player_1)
            this.physics.add.overlap(flechaOponente, this.player_1, () => {
                flechaOponente.destroy(); // Some ao te acertar
            });
        });

        // evento que recebe dano
        socket.off('receberDano');
        socket.on('receberDano', (dados) => {
            this.player_1.receberDano(dados.dano);
        });

        // evento que aviasa quando o oponente esta pronto
        socket.off('oponentePronto');
        socket.on('oponentePronto', () => console.log('Oponente entrou!'));
        
        
        
        // evento que avisa que o oponente desconectou da sala (caiu)
        socket.off('oponenteDesconectou');
        socket.on('oponenteDesconectou', () => {
            if (!this._partidaEncerrada)
                this._encerrarPartida('Seu oponente desconectou.\nVocê venceu por W.O.!', true);
        });

        // evento para que quando o jogador apertar em voltar, ele volte para o lobby, 
        socket.off('voltarLobby');
        socket.on('voltarLobby', (sala) => {

            sala.nomeUsuario = this.nomeUsuario;

            socket.off('posicaoOponente');
            socket.off('receberDano');
            socket.off('voltarLobby');
            this._partidaEncerrada = false;

            this.scene.start('Lobby', sala); // Passa o objeto da sala para a próxima cena
        });
    }

    // checa o fim da partida, ou seja, se algum dos jogadores morreu ou se algum caiu antes 
    _checarFimDePartida() {
        if (this._partidaEncerrada) return;
        if (this.player_1.vida <= 0) this._encerrarPartida('Você foi derrotado!', false);
        if (this.player_2.vida <= 0) this._encerrarPartida('Você venceu!', true);
    }

    // encerra a partida, mostrando uma mensagem na tela dependo se voce ganhou, perdeu ou oponente desconectado
    _encerrarPartida(msg, vitoria) {
        this._partidaEncerrada = true;
        this.physics.pause();

        this.add.rectangle(960, 540, 1920, 1080, 0x000000, 0.65)
            .setScrollFactor(0).setDepth(20);


        if (vitoria) {
            socket.emit('AdicionarVitoria');
        }

        
        this.add.text(960, 460, msg, {
            fontSize: '88px', fill: vitoria == true ? '#ffcc00' : '#ff4444',
            fontStyle: 'bold', stroke: '#000', strokeThickness: 6, align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(21);

        const btn = this.add.text(960, 620, '[ VOLTAR AO MENU ]', {
            fontSize: '50px', fill: '#ffffff', stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5).setScrollFactor(0).setDepth(21).setInteractive({ useHandCursor: true });

        btn.on('pointerover',  () => btn.setStyle({ fill: '#00ff00' }));
        btn.on('pointerout',   () => btn.setStyle({ fill: '#ffffff' }));
        btn.on('pointerdown',  () => {
            socket.emit('abandonarPartida', this.salaId);
        });
    }

    // define qual é o heroi do oponente
    _heroiOponente() {
        let h = 'Guerreiro';
        this.jogadoresDados.forEach((d, n) => { if (n !== this.nomeUsuario) h = d.heroi; });
        return h;
    }
    // define qual é o nome do oponente
    _nomeOponente() {
        let n = 'Oponente';
        this.jogadoresDados.forEach((d, nome) => { if (nome !== this.nomeUsuario) n = nome; });
        return n;
    }
}