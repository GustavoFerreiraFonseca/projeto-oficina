// =============================================================================
// arrow.js — Projétil do Arqueiro
// =============================================================================
//
// FÍSICA:
//   A gravidade GLOBAL do mundo é 500 (definida em game.js).
//   Usamos setGravityY(-500) para cancelá-la completamente na flecha,
//   e definimos nossa própria gravidade suave de +80 para a parábola.
//   Resultado efetivo: a flecha sente apenas 80 de gravidade → curva suave.
//
//   Velocidade horizontal alta (700px/s) garante que ela alcance o oponente
//   antes de cair muito.
// =============================================================================

class Arrow extends Phaser.Physics.Arcade.Sprite
{
    constructor(scene, x, y, angulo, velocidade)
    {
        super(scene, x, y, 'sp_arrow');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.depth = 2;
        this.setScale(2.5); // 56x12 → fica ~140x30, visível sem pixelado

        // --- Física ---
        // Cancela a gravidade global (500) e aplica só 80 → parábola suave
        this.body.setGravityY(-500 + 80);
        this.body.allowRotation = false; // rotação feita manualmente via setRotation

        // Decompõe a velocidade nos eixos
        const vx = Math.cos(angulo) * velocidade;
        const vy = Math.sin(angulo) * velocidade;
        this.setVelocity(vx, vy);

        // Alinha o sprite com a direção inicial de lançamento
        this.setRotation(angulo);

        // Hitbox estreita para ser justa com a sprite fina
        this.body.setSize(44, 6);
        this.body.setOffset(6, 3);

        // Auto-destruição por tempo limite (2.5 segundos)
        scene.time.delayedCall(2500, () => { if (this.active) this.destruir(); });
    }

    // =========================================================================
    // UPDATE — chamado automaticamente pelo grupo (runChildUpdate: true)
    // =========================================================================
    update()
    {
        if (!this.active) return;

        // Rotação dinâmica: o sprite aponta sempre para onde a flecha está indo
        const ang = Math.atan2(this.body.velocity.y, this.body.velocity.x);
        this.setRotation(ang);

        // Destrói se sair muito do campo de visão
        const cam    = this.scene.cameras.main;
        const margem = 300;
        if (
            this.x < cam.scrollX - margem ||
            this.x > cam.scrollX + cam.width  + margem ||
            this.y > cam.scrollY + cam.height + margem
        ) {
            this.destruir();
        }
    }

    // =========================================================================
    // DESTRUIÇÃO — fade rápido antes de sumir
    // =========================================================================
    destruir()
    {
        if (!this.active) return;
        this.setActive(false);
        this.body.stop();

        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: 100,
            onComplete: () => { if (this.scene) this.destroy(); }
        });
    }
}