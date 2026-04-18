class Login extends Phaser.Scene {
    constructor() {
        super({ key: 'login' });
        this.nomeUsuario = "";
        this.cursorPiscando = true;
    }

    create() {
        // Título
        this.add.text(400, 150, 'COLISEU', { fontSize: '42px', fill: '#ffcc00' }).setOrigin(0.5);

        // --- CAIXA DE INPUT ---
        let campoFundo = this.add.graphics();
        campoFundo.fillStyle(0xffffff, 1);
        campoFundo.fillRoundedRect(250, 280, 300, 50, 10);
        campoFundo.lineStyle(4, 0xffcc00);
        campoFundo.strokeRoundedRect(250, 280, 300, 50, 10);

        // Zona invisível para mãozinha no input
        this.add.zone(400, 305, 300, 50).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.textoExibido = this.add.text(400, 305, '|', { fontSize: '24px', fill: '#000' }).setOrigin(0.5);

        // --- BOTÃO ENTRAR COM EFEITO HOVER ---
        this.bordaBotao = this.add.graphics();
        this.desenharBordaBotao(0xffffff); // Começa branco

        let txtEntrar = this.add.text(400, 405, 'ENTRAR', { fontSize: '24px', fill: '#ffffff' })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        txtEntrar.on('pointerover', () => {
            txtEntrar.setStyle({ fill: '#00ff00' });
            this.desenharBordaBotao(0x00ff00);
        });

        txtEntrar.on('pointerout', () => {
            txtEntrar.setStyle({ fill: '#ffffff' });
            this.desenharBordaBotao(0xffffff);
        });

        // --- LÓGICA DE LOGIN ---
        this.tentarLogar = () => {
            if (this.nomeUsuario.length > 2) {
                socket.emit('fazerLogin', this.nomeUsuario);
            }
        };

        txtEntrar.on('pointerdown', () => this.tentarLogar());
        this.input.keyboard.on('keydown-ENTER', () => this.tentarLogar());

        // --- LÓGICA DO TECLADO (O que estava faltando) ---
        this.input.keyboard.on('keydown', (event) => {
            if (event.keyCode === 8 && this.nomeUsuario.length > 0) { // Backspace
                this.nomeUsuario = this.nomeUsuario.slice(0, -1);
            } else if (event.key.length === 1 && this.nomeUsuario.length < 15) {
                this.nomeUsuario += event.key;
            }
            this.atualizarTexto();
        });

        // --- TIMER DO CURSOR ---
        this.time.addEvent({
            delay: 500,
            callback: () => {
                this.cursorPiscando = !this.cursorPiscando;
                this.atualizarTexto();
            },
            loop: true
        });

        // Ouvinte do socket
        socket.off('loginSucesso');
        socket.on('loginSucesso', () => {
            this.scene.start('mainMenu');
        });
    }

    desenharBordaBotao(cor) {
        this.bordaBotao.clear();
        this.bordaBotao.lineStyle(3, cor);
        this.bordaBotao.strokeRoundedRect(300, 380, 200, 50, 10);
    }

    atualizarTexto() {
        let cursor = this.cursorPiscando ? '|' : ' ';
        this.textoExibido.setText(this.nomeUsuario + cursor);
    }
}