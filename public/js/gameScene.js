// =============================================================================
// gameScene.js — Cena da arena com HUD e mecânica de combate
// =============================================================================

class GameScene extends Phaser.Scene {
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

    init(data) {
        this.salaId         = data.salaId;
        this.nomeUsuario    = data.nomeUsuario;
        this.jogadoresDados = data.jogadoresDados;
    }

    // =========================================================================
    preload() {
        this.load.image('Tileset_arenas', 'sprites/Tileset_arenas.png');
        this.load.tilemapTiledJSON('mapa_arena1', 'sprites/Tilemap_Arena.tmj');

        this.load.image('Guerreiro',  'sprites/Sp_warrior.png');
        this.load.image('Arqueiro',   'sprites/Sp_archer.png');
        this.load.image('sp_arrow',   'sprites/sp_arrow.png');   // projétil

        this.load.spritesheet('Guerreiro_idle',      'sprites/sp_sheet_warrior_idle.png',
            { frameWidth: 64,  frameHeight: 89  });
        this.load.spritesheet('Guerreiro_attacking', 'sprites/sp_sheet_warrior_attacking.png',
            { frameWidth: 106, frameHeight: 117 });
        this.load.spritesheet('Arqueiro_idle',       'sprites/sp_sheet_archer_idle.png',
            { frameWidth: 64,  frameHeight: 96  });
        this.load.spritesheet('Arqueiro_attacking',  'sprites/sp_sheet_archer_attacking.png',
            { frameWidth: 134, frameHeight: 103 });
    }

    // =========================================================================
    create() {
        // --- Mapa ---
        const map     = this.make.tilemap({ key: 'mapa_arena1' });
        const tileset = map.addTilesetImage('Tileset_arena', 'Tileset_arenas');
        const escala  = 3;

        map.createLayer('fundo',  tileset, 0, 0).setScale(escala).setDepth(-2);
        map.createLayer('nuvens', tileset, 0, 0).setScale(escala).setDepth(-1);

        this._chao = map.createLayer('terreno', tileset, 0, 0).setScale(escala).setDepth(0);
        this._chao.setCollisionByProperty({ collides: true });

        this.cameras.main.setBounds(0, 0, map.widthInPixels * escala, map.heightInPixels * escala);

        // --- Personagens ---
        const heroiLocal    = this.jogadoresDados.get(this.nomeUsuario)?.heroi ?? 'Guerreiro';
        const heroiOponente = this._heroiOponente();

        this.player_1 = new Player(this, 500, 200, heroiLocal,    heroiLocal,    1);
        this.player_2 = new Player(this, 900, 200, heroiOponente, heroiOponente, 1);
        this.player_2.setAlpha(0);

        this.physics.add.collider(this.player_1, this._chao);
        this.physics.add.collider(this.player_2, this._chao);

        // --- Colisão das flechas do P1 com o chão ---
        this.physics.add.collider(
            this.player_1.flechas,
            this._chao,
            (flecha) => { flecha.destruir(); }
        );

        // --- Colisão das flechas do P1 com o corpo do P2 ---
        // Verificada manualmente no update para ter controle total do evento de rede
        // (não usamos physics.add.overlap aqui para evitar callbacks fora de sincronia)

        // --- Nomes e HUD ---
        this._nomeP1 = this.nomeUsuario;
        this._nomeP2 = this._nomeOponente();
        this._criarHUD();

        // --- Controles ---
        this.teclado = this.input.keyboard.addKeys('A,D,Z,X,C,SPACE');

        // Clique do mouse — o player_1 gerencia internamente pelo activePointer,
        // mas mantemos este listener para o Guerreiro (ativarAtaquePorMouse)
        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown() && this.player_1.character === 'Guerreiro') {
                this.player_1.ativarAtaquePorMouse();
            }
        });

        // --- Socket ---
        socket.emit('prontoParaJogar', this.salaId);
        this._registrarEventosSocket();
    }

    // =========================================================================
    update() {
        if (this._partidaEncerrada) return;

        this.player_1.update(this.teclado);

        // Checa colisão: hitbox corpo a corpo do P1 vs P2
        this._checarAtaqueCaC();

        // Checa colisão: flechas do P1 vs corpo do P2
        this._checarFlechas();

        this._atualizarHUD();
        this._enviarPosicao();
    }

    // =========================================================================
    // COLISÃO CORPO A CORPO (Guerreiro)
    // =========================================================================
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

    // =========================================================================
    // COLISÃO FLECHAS (Arqueiro) vs P2
    // =========================================================================
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

    // =========================================================================
    // FLASH VISUAL DE HIT
    // =========================================================================
    _flashHit(alvo) {
        alvo.setTint(0xffffff);
        this.time.delayedCall(80,  () => alvo.setTint(0xff4444));
        this.time.delayedCall(220, () => alvo.clearTint());
    }

    // =========================================================================
    // HUD — barras de vida fixas no topo
    // =========================================================================
    _criarHUD() {
        const W = 400, H = 28, Y = 40;
        this._hudP1 = this._makeBarraVida(80,             Y, W, H, this._nomeP1, 'left');
        this._hudP2 = this._makeBarraVida(1920 - 80 - W,  Y, W, H, this._nomeP2, 'right');
    }

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
        this.add.text(txtX, y - 24, nome, {
            fontSize: '20px', fill: '#fff', fontStyle: 'bold',
            stroke: '#000', strokeThickness: 3
        }).setOrigin(lado === 'left' ? 0 : 1, 0).setScrollFactor(0).setDepth(12);
        // Ícone
        const iconX = lado === 'left' ? x - 28 : x + w + 6;
        this.add.text(iconX, y + 2, '♥', { fontSize: '22px', fill: '#ff4466' })
            .setScrollFactor(0).setDepth(12);

        return { barra, larguraBase: w };
    }

    _atualizarHUD() {
        this._setBarra(this._hudP1, this.player_1.vida, this.player_1.maxVida);
        this._setBarra(this._hudP2, this.player_2.vida, this.player_2.maxVida);
    }

    _setBarra(hud, vida, max) {
        const pct = Phaser.Math.Clamp(vida / max, 0, 1);
        hud.barra.width = hud.larguraBase * pct;
        if      (pct > 0.5)  hud.barra.setFillStyle(0x00cc44);
        else if (pct > 0.25) hud.barra.setFillStyle(0xffaa00);
        else                 hud.barra.setFillStyle(0xee2222);
    }

    // =========================================================================
    // ENVIAR POSIÇÃO (todo frame)
    // =========================================================================
    _enviarPosicao() {
        socket.emit('moverJogador', {
            salaId:    this.salaId,
            x:         this.player_1.x,
            y:         this.player_1.y,
            velocityX: this.player_1.body.velocity.x,
            velocityY: this.player_1.body.velocity.y,
            flipX:     this.player_1.flipX,
            vida:      this.player_1.vida
        });
    }

    // =========================================================================
    // SOCKET
    // =========================================================================
    _registrarEventosSocket() {
        socket.off('posicaoOponente');
        socket.on('posicaoOponente', (dados) => {
            this.player_2.setAlpha(1);
            this.player_2.updateDirections_oponente(dados.x, this.player_2.x);
            this.player_2.setPosition(dados.x, dados.y);
            this.player_2.setVelocity(dados.velocityX, dados.velocityY);
            if (dados.vida !== undefined) this.player_2.vida = dados.vida;
        });

        socket.off('receberDano');
        socket.on('receberDano', (dados) => {
            this.player_1.receberDano(dados.dano);
            this._checarFimDePartida();
        });

        socket.off('oponentePronto');
        socket.on('oponentePronto', () => console.log('Oponente entrou!'));

        socket.off('oponenteDesconectou');
        socket.on('oponenteDesconectou', () => {
            if (!this._partidaEncerrada)
                this._encerrarPartida('Seu oponente desconectou.\nVocê venceu por W.O.!', true);
        });
    }

    // =========================================================================
    // FIM DE PARTIDA
    // =========================================================================
    _checarFimDePartida() {
        if (this._partidaEncerrada) return;
        if (this.player_1.vida <= 0) this._encerrarPartida('Você foi derrotado!', false);
        if (this.player_2.vida <= 0) this._encerrarPartida('Você venceu!', true);
    }

    _encerrarPartida(msg, vitoria) {
        this._partidaEncerrada = true;
        this.physics.pause();

        this.add.rectangle(960, 540, 1920, 1080, 0x000000, 0.65)
            .setScrollFactor(0).setDepth(20);
        this.add.text(960, 460, msg, {
            fontSize: '88px', fill: vitoria ? '#ffcc00' : '#ff4444',
            fontStyle: 'bold', stroke: '#000', strokeThickness: 6, align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(21);

        const btn = this.add.text(960, 620, '[ VOLTAR AO MENU ]', {
            fontSize: '50px', fill: '#ffffff', stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5).setScrollFactor(0).setDepth(21).setInteractive({ useHandCursor: true });

        btn.on('pointerover',  () => btn.setStyle({ fill: '#00ff00' }));
        btn.on('pointerout',   () => btn.setStyle({ fill: '#ffffff' }));
        btn.on('pointerdown',  () => {
            socket.emit('abandonarSala');
            this.scene.start('mainMenu', { nomeUsuario: this.nomeUsuario });
        });
    }

    // =========================================================================
    _heroiOponente() {
        let h = 'Guerreiro';
        this.jogadoresDados.forEach((d, n) => { if (n !== this.nomeUsuario) h = d.heroi; });
        return h;
    }
    _nomeOponente() {
        let n = 'Oponente';
        this.jogadoresDados.forEach((d, nome) => { if (nome !== this.nomeUsuario) n = nome; });
        return n;
    }
}