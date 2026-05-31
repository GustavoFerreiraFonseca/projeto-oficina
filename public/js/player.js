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
        this.def_animations();

        let animation_idle = this.character + "_idle";
        this.play(animation_idle, true);
    }
    
    update(keyboard)
    {
        this.move(keyboard);
        this.attack(keyboard);
        
        this.on('animationcomplete', () => {
            let animation_idle = this.character + "_idle";
            this.play(animation_idle, true);
        })
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

    attack(keyboard)
    {
        if (keyboard.Z.isDown) 
        {
            let animation_attack = this.character + "_attacking";
            let animation_idle = this.character + "_idle";
            this.play(animation_attack, true);
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

    // metodo criado para poder mudar a direção do oponente
    updateDirections_oponente(x, x_anterior)
    {
        if (x > x_anterior)
        {
            this.setFlipX(false);
        } else {
            if (x < x_anterior)
            {
                this.setFlipX(true);
            }
        }
    }

    def_animations()
    {
        switch (this.character)
        {
            case "Guerreiro":
                this.scene.anims.create({
                    key: "Guerreiro_idle",
                    frames: this.scene.anims.generateFrameNumbers("Guerreiro_idle", {
                        start: 0,
                        end: 4
                    }),
                    frameRate: 6,
                    repeat: -1
                });

                this.scene.anims.create({
                    key: "Guerreiro_attacking",
                    frames: this.scene.anims.generateFrameNumbers("Guerreiro_attacking", {
                        start: 0,
                        end: 4
                    }),
                    frameRate: 10,
                    repeat: 0
                });
            break;

            case "Arqueiro":
                this.scene.anims.create({
                    key: "Arqueiro_idle",
                    frames: this.scene.anims.generateFrameNumbers("Arqueiro_idle", {
                        start: 0,
                        end: 4
                    }),
                    frameRate: 6,
                    repeat: 0
                });

                this.scene.anims.create({
                    key: "Arqueiro_attacking",
                    frames: this.scene.anims.generateFrameNumbers("Arqueiro_attacking", {
                        start: 0,
                        end: 6
                    }),
                    frameRate: 10,
                    repeat: 0
                });
            break;
        }
    }

}
