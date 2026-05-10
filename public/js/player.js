// arquivo onde tera todas as informações do player, como animações, criação dele como objeto, etc...
// por enquanto como existe apenas um tipo de personagem, e só tem uma imagem e não um sprite, por enquanto apenas é uma imagem que anda

class Player extends Phaser.Physics.Arcade.Sprite 
{

    constructor(scene, x, y, texture, character, scale)
    {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.character = character;
        this.setScale(scale)
        this.depth = 1;
        
        this.setDragX(1500);
        this.setMaxVelocity(300, 1000);
    }

    update(keyboard)
    {
        this.move(keyboard);
    }

    // metodo que controla a movimentação do player 
    move(keyboard)
    {
        this.updateDirections()
        if (keyboard.A.isDown) 
        {
            if (this.body.velocity.x > 20)
            {
                this.setVelocityX(0);
            }
            this.setAccelerationX(-300);
        } else {
            if (keyboard.D.isDown) 
            {
                if (this.body.velocity.x < 0)
                {
                    this.setVelocityX(0);
                }
                this.setAccelerationX(300);
            } else {
                this.setAccelerationX(0);
            }
        }

        if (this.body.blocked.down)
        {
            if (keyboard.SPACE.isDown) this.setVelocityY(-400);
        } 
    }

    // metodo que controla a direção do player com base para onde ele está indo
    updateDirections()
    {
        if (this.body.velocity.x > 0)
        {
            this.setFlipX(false);
        } else {
            if (this.body.velocity.x < 0)
            {
                this.setFlipX(true);
            }
        }
    }
}
