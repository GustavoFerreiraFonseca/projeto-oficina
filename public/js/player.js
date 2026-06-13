class Player extends Phaser.Physics.Arcade.Sprite
{
    //construtor da classe player
    constructor(scene, x, y, texture, character, scale)
    {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.character = character;
        this.setScale(scale);
        this.depth = 1;

        if (this.character == 'Guerreiro')
        {
            this.body.setSize(64, 88); 
            this.body.setOffset(28, 24);
        } else {
            this.body.setSize(63, 87); 
            this.body.setOffset(70, 14);
        }

        // --- Física ---
        this.setDragX(1500);
        this.setMaxVelocity(300, 1000);

        // --- Vida ---
        this.maxVida  = 100;
        this.vida     = this.maxVida;
        this.morto    = false;

        // --- Estado de combate ---
        this.atacando    = false;
        this.podeTakar   = true;
        this.tomandoDano = false;

        // --- Arqueiro: estado de mira ---
        this._carregando  = false;
        this._cargaAngulo = 0;

        // detecta se algum input foi feito para poder previnir erros e poder execulta-los
        this._zAnterior   = false;
        this._mouseAntes  = false;

        // --- Hitbox de ataque (corpo a corpo — Guerreiro) ---
        this.hitboxAtaque = scene.add.zone(x, y, 70, 60);
        scene.physics.world.enable(this.hitboxAtaque);
        this.hitboxAtaque.body.allowGravity = false;
        this.hitboxAtaque.ativa = false;

        // --- Indicador de mira do Arqueiro ---
        // Graphics reutilizado a cada frame (limpamos e redesenhamos)
        this._miraGfx = scene.add.graphics().setDepth(15);

        // --- Grupo de flechas ativas ---
        this.flechas = scene.physics.add.group({
            classType: Arrow,
            runChildUpdate: true
        });

        this._def_animations();
        
        this.play(this.character + '_idle', true);
    }
    
    // update a cada frame
    update(keyboard)
    {
        if (this.morto) return;
        
        this._mover(keyboard);
        
        if (this.character === 'Arqueiro') {
            this._updateArqueiro(keyboard);
        } else {
            this._updateGuerreiro(keyboard);
        }
        
        this._atualizarHitboxPos();
        this._registrarEventosAnimacao();
    }

    // gerencia a movimentação do personagme com base na tecla pressionana
    _mover(keyboard)
    {
        // Guerreiro trava durante ataque; Arqueiro pode mover durante carga
        const travar = this.atacando && this.character === 'Guerreiro';

        if (!travar) {
            this._flipPorVelocidade();
            if (keyboard.A.isDown) {
                if (this.body.velocity.x > 20) this.setVelocityX(0);
                this.setAccelerationX(-300);
            } else if (keyboard.D.isDown) {
                if (this.body.velocity.x < 0) this.setVelocityX(0);
                this.setAccelerationX(300);
            } else {
                this.setAccelerationX(0);
            }
        } else {
            this.setAccelerationX(0);
        }

        if (this.body.blocked.down && keyboard.SPACE.isDown) {
            this.setVelocityY(-400);
        }
    }

    // Gerenciamento do guerreiro que verifica cada ação que ele faz
    _updateGuerreiro(keyboard)
    {
        const zAgora = keyboard.Z.isDown;
        const mouse  = this.scene.input.activePointer;

        const zApertou    = zAgora && !this._zAnterior;
        const mouseApertou = mouse.leftButtonDown() && !this._mouseAntes;

        if ((zApertou || mouseApertou) && !this.atacando && this.podeTakar) {
            this._dispararAtaqueCaC();
        }

        this._zAnterior  = zAgora;
        this._mouseAntes = mouse.leftButtonDown();
    }

    // execulta o ataque do guerreiro
    _dispararAtaqueCaC()
    {
        this.atacando  = true;
        this.podeTakar = false;
        this.play('Guerreiro_attacking', true);
    }

    // Compatibilidade com GameScene (clique externo para Guerreiro)
    ativarAtaquePorMouse()
    {
        if (this.character === 'Guerreiro' && !this.atacando && this.podeTakar && !this.morto) {
            this._dispararAtaqueCaC();
        }
    }

    // gerenciamento do arqueiro que verifica todas as ações dele
    _updateArqueiro(keyboard)
    {
        const zAgora = keyboard.Z.isDown;
        const mouse  = this.scene.input.activePointer;
        const btn    = mouse.leftButtonDown();

        const botaoSeguro  = zAgora || btn;
        const zApertou     = zAgora && !this._zAnterior;
        const mouseApertou = btn    && !this._mouseAntes;

        // Início da carga
        if ((zApertou || mouseApertou) && !this._carregando && !this.atacando && this.podeTakar) {
            this._iniciarCarga();
        }

        // Durante a carga, atualiza mira
        if (this._carregando) {
            this._atualizarMira();
        } else {
            this._miraGfx.clear(); // garante que some quando não está carregando
        }

        // dispara a flecha
        if (this._carregando && !botaoSeguro) {
            this._dispararFlecha();
        }

        this._zAnterior  = zAgora;
        this._mouseAntes = btn;
    }

    // iniciando a carga, fazendo a animação do arqueiro parar quando 
    _iniciarCarga()
    {
        this._carregando = true;
        this.atacando    = true;
        this.podeTakar   = false;

        this.play('Arqueiro_attacking', true);

        // Pausa no frame 4 (arco tensionado) — 4 frames a 10fps = 400ms
        this.scene.time.delayedCall(400, () => {
            if (this._carregando && this.anims.isPlaying) {
                this.anims.pause();
            }
        });
    }

    // =========================================================================
    // INDICADOR DE MIRA — linha tracejada + ponto final
    // Desenhado em coordenadas de MUNDO (não de câmera)
    // =========================================================================
    _atualizarMira()
    {
        const mouse  = this.scene.input.activePointer;
        const worldX = mouse.worldX;
        const worldY = mouse.worldY;

        // Ângulo do personagem até o mouse
        const angulo = Phaser.Math.Angle.Between(this.x, this.y, worldX, worldY);
        this._cargaAngulo = angulo;

        // Vira o sprite na direção do mouse
        this.setFlipX(worldX < this.x);

        // --- Desenha a linha de mira tracejada ---
        const gfx     = this._miraGfx;
        const alcance = 220; // comprimento da linha em pixels
        const ox      = this.x;
        const oy      = this.y - 20; // altura da mão do arqueiro

        const ex = ox + Math.cos(angulo) * alcance;
        const ey = oy + Math.sin(angulo) * alcance;

        gfx.clear();

        // Linha tracejada branca semi-transparente
        const segmentos  = 8;
        const tamanhoSeg = alcance / (segmentos * 2);
        gfx.lineStyle(2, 0xffffff, 0.55);
        for (let i = 0; i < segmentos; i++) {
            const t0 = (i * 2)     / (segmentos * 2);
            const t1 = (i * 2 + 1) / (segmentos * 2);
            gfx.beginPath();
            gfx.moveTo(ox + Math.cos(angulo) * (t0 * alcance),
                       oy + Math.sin(angulo) * (t0 * alcance));
            gfx.lineTo(ox + Math.cos(angulo) * (t1 * alcance),
                       oy + Math.sin(angulo) * (t1 * alcance));
            gfx.strokePath();
        }

        // Ponto de impacto no final da linha
        gfx.fillStyle(0xffdd44, 0.9);
        gfx.fillCircle(ex, ey, 5);

        // Pequeno círculo na origem (cano do arco)
        gfx.lineStyle(1, 0xffffff, 0.5);
        gfx.strokeCircle(ox, oy, 6);
    }

    _atualizarMiraOponente(angulo) {
        this._cargaAngulo = angulo;
        const gfx = this._miraGfx;
        const alcance = 220; 
        const ox = this.x;
        const oy = this.y - 20; 

        const ex = ox + Math.cos(angulo) * alcance;
        const ey = oy + Math.sin(angulo) * alcance;

        gfx.clear();
        const segmentos = 8;
        gfx.lineStyle(2, 0xffffff, 0.55);
        for (let i = 0; i < segmentos; i++) {
            const t0 = (i * 2) / (segmentos * 2);
            const t1 = (i * 2 + 1) / (segmentos * 2);
            gfx.beginPath();
            gfx.moveTo(ox + Math.cos(angulo) * (t0 * alcance), oy + Math.sin(angulo) * (t0 * alcance));
            gfx.lineTo(ox + Math.cos(angulo) * (t1 * alcance), oy + Math.sin(angulo) * (t1 * alcance));
            gfx.strokePath();
        }
        gfx.fillStyle(0xffdd44, 0.9);
        gfx.fillCircle(ex, ey, 5);
        gfx.lineStyle(1, 0xffffff, 0.5);
        gfx.strokeCircle(ox, oy, 6);
    }

    // =========================================================================
    // DISPARAR FLECHA
    // =========================================================================
    _dispararFlecha()
    {
        this._carregando = false;
        this._miraGfx.clear();

        // Resume a animação (frames 5-6: soltar o arco)
        if (this.anims.isPaused) this.anims.resume();

        // Ponto de origem: ponta do arco
        const offX = this.flipX ? -32 : 32;
        const offY = -22;

        const posXFlecha = this.x + offX;
        const posYFlecha = this.y + offY;

        const flecha = new Arrow(
            this.scene,
            posXFlecha,
            posYFlecha,
            this._cargaAngulo,
            700 // px/s — velocidade alta para alcançar o oponente
        );
        this.flechas.add(flecha);
        flecha.atirar(this._cargaAngulo, 700);

        socket.emit('dispararFlecha', {
            salaId: this.scene.salaId,
            x: posXFlecha,
            y: posYFlecha,
            angulo: this._cargaAngulo
        });
        
        // podeTakar e atacando resetados pelo listener animationcomplete
    }

    // =========================================================================
    // RECEBER DANO
    // =========================================================================
    receberDano(quantidade)
    {
        if (this.tomandoDano || this.morto) return;

        this.vida = Math.max(0, this.vida - quantidade);
        this.tomandoDano = true;

        // Interrompe carregamento do arqueiro
        if (this._carregando) {
            this._carregando = false;
            this._miraGfx.clear();
            this.atacando  = false;
            this.podeTakar = true;
            if (this.anims.isPaused) this.anims.resume();
            this.play('Arqueiro_idle', true);
        }

        // Flash branco → vermelho → normal
        this.setTint(0xffffff);
        this.scene.time.delayedCall(80,  () => { if (!this.morto) this.setTint(0xff4444); });
        this.scene.time.delayedCall(220, () => { if (!this.morto) this.clearTint(); });

        // Knockback
        const dir = this.flipX ? 1 : -1;
        this.setVelocityX(dir * 260);
        this.setVelocityY(-160);

        this.scene.time.delayedCall(400, () => { this.tomandoDano = false; });

        if (this.vida <= 0) this._morrer();
    }

    // =========================================================================
    // MORTE
    // =========================================================================
    _morrer()
    {
        this.morto = true;
        this.hitboxAtaque.ativa = false;
        this._carregando = false;
        this._miraGfx.clear();
        this.setTint(0x444444);
        this.setAccelerationX(0);
        this.setVelocity(0, 0);
        this.body.allowGravity = false;
        this.flechas.clear(true, true);

        this.scene.tweens.add({
            targets: this, alpha: 0, y: this.y + 50,
            duration: 700, ease: 'Power2'
        });
    }

    // =========================================================================
    // POSIÇÃO DA HITBOX
    // =========================================================================
    _atualizarHitboxPos()
    {
        const offX = 52;
        const offY = this.character === 'Guerreiro' ? -8 : -4;
        const dir  = this.flipX ? -1 : 1;
        this.hitboxAtaque.setPosition(this.x + dir * offX, this.y + offY);
    }

    // =========================================================================
    // FLIP
    // =========================================================================
    _flipPorVelocidade()
    {
        if      (this.body.velocity.x > 0) this.setFlipX(false);
        else if (this.body.velocity.x < 0) this.setFlipX(true);
    }

    updateDirections_oponente(x, x_anterior)
    {
        if      (x > x_anterior) this.setFlipX(false);
        else if (x < x_anterior) this.setFlipX(true);
    }

    // =========================================================================
    // EVENTOS DE ANIMAÇÃO — registrados UMA VEZ no construtor
    // =========================================================================
    _registrarEventosAnimacao()
    {
        // Guerreiro: ativa hitbox no frame do golpe
        this.on('animationupdate', (anim, frame) => {
            if (anim.key !== 'Guerreiro_attacking') return;
            if (frame.index === 2) this.hitboxAtaque.ativa = true;
            if (frame.index === 3) this.hitboxAtaque.ativa = false;
        });


        this.on('animationcomplete', (anim) => {
            if (anim.key === 'Guerreiro_attacking') {
                this.hitboxAtaque.ativa = false;
                this.atacando = false;
                this.scene.time.delayedCall(600, () => { this.podeTakar = true; });
                this.play('Guerreiro_idle', true);
            }
            if (anim.key === 'Arqueiro_attacking') {
                this._carregando = false;
                this.atacando    = false;
                this.scene.time.delayedCall(400, () => { this.podeTakar = true; });
                this.play('Arqueiro_idle', true);
            }
        });
    }

    // =========================================================================
    // ANIMAÇÕES
    // =========================================================================
    _def_animations()
    {
        const existe = (key) => this.scene.anims.exists(key);

        if (!existe('Guerreiro_idle')) {
            this.scene.anims.create({
                key: 'Guerreiro_idle',
                frames: this.scene.anims.generateFrameNumbers('Guerreiro_idle', { start: 0, end: 4 }),
                frameRate: 6, repeat: -1,
            });
        }
        if (!existe('Guerreiro_attacking')) {
            this.scene.anims.create({
                key: 'Guerreiro_attacking',
                frames: this.scene.anims.generateFrameNumbers('Guerreiro_attacking', { start: 0, end: 4 }),
                frameRate: 10, repeat: 0
            });
        }
        if (!existe('Arqueiro_idle')) {
            this.scene.anims.create({
                key: 'Arqueiro_idle',
                frames: this.scene.anims.generateFrameNumbers('Arqueiro_idle', { start: 0, end: 4 }),
                frameRate: 6, repeat: -1
            });
        }
        if (!existe('Arqueiro_attacking')) {
            this.scene.anims.create({
                key: 'Arqueiro_attacking',
                frames: this.scene.anims.generateFrameNumbers('Arqueiro_attacking', { start: 0, end: 6 }),
                frameRate: 10, repeat: 0
            });
        }
    }
}