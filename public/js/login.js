class Login extends Phaser.Scene {
    constructor() {
        super({ key: 'login' });
        this.nomeUsuario = "";
        this.cursorPiscando = true;
    }

    create() {
        const largura = this.cameras.main.width;
        const altura = this.cameras.main.height;
        const centroX = largura / 2;
        const centroY = altura / 2;

        // --- VISUAL ---
        this.add.text(centroX, centroY - 180, 'COLISEU', { 
            fontSize: '64px', fill: '#ffcc00', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(centroX, centroY - 100, 'Digite seu nome:', { 
            fontSize: '22px', fill: '#ffffff' 
        }).setOrigin(0.5);

        let campoFundo = this.add.graphics();
        campoFundo.fillStyle(0xffffff, 1);
        campoFundo.fillRoundedRect(centroX - 150, centroY - 30, 300, 60, 10); 
        campoFundo.lineStyle(4, 0xffcc00);
        campoFundo.strokeRoundedRect(centroX - 150, centroY - 30, 300, 60, 10);

        this.add.zone(centroX, centroY, 300, 60).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.textoExibido = this.add.text(centroX, centroY, '|', { 
            fontSize: '28px', fill: '#000' 
        }).setOrigin(0.5);

        this.bordaBotao = this.add.graphics();
        this.desenharBordaBotao(0xffffff, centroX, centroY + 120);

        let txtEntrar = this.add.text(centroX, centroY + 120, 'ENTRAR', { 
            fontSize: '32px', fill: '#ffffff' 
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // --- HOVER ---
        txtEntrar.on('pointerover', () => {
            txtEntrar.setStyle({ fill: '#00ff00' });
            this.desenharBordaBotao(0x00ff00, centroX, centroY + 120);
        });
        txtEntrar.on('pointerout', () => {
            txtEntrar.setStyle({ fill: '#ffffff' });
            this.desenharBordaBotao(0xffffff, centroX, centroY + 120);
        });

        // --- INPUT DE TECLADO ---
        this.input.keyboard.on('keydown', (event) => {
            if (event.keyCode === 8 && this.nomeUsuario.length > 0) {
                this.nomeUsuario = this.nomeUsuario.slice(0, -1);
            } else if (event.key.length === 1 && this.nomeUsuario.length < 11) {
                this.nomeUsuario += event.key;
            }
            this.atualizarTexto();
        });

        // Eventos de clique e Enter (Chamando a função corretamente agora)
        this.input.keyboard.on('keydown-ENTER', () => this.tentarLogar());
        txtEntrar.on('pointerdown', () => this.tentarLogar());

        // --- CURSOR ---
        this.time.addEvent({
            delay: 500,
            callback: () => { 
                this.cursorPiscando = !this.cursorPiscando; 
                this.atualizarTexto(); 
            },
            loop: true
        });

        // --- COMUNICAÇÃO (SOCKET) ---
        // Limpamos ouvintes antigos para evitar o bug de disparos múltiplos
        socket.off('loginSucesso');
        socket.off('loginErro');

        socket.on('loginSucesso', (dados) => {
            nickUsuario = dados.nome; 
            this.scene.start('mainMenu');
        });

        socket.on('loginErro', (mensagem) => {
            alert(mensagem);
        });
    }

    // Corrigido: Agora a lógica está diretamente dentro do método da classe
    tentarLogar() {
        const nomeParaEnviar = this.nomeUsuario.trim();
        if (nomeParaEnviar.length >= 3) {
            socket.emit('fazerLogin', nomeParaEnviar);
        } else {
            alert("O nome deve ter pelo menos 3 caracteres!");
        }
    }

    desenharBordaBotao(cor, x, y) {
        this.bordaBotao.clear();
        this.bordaBotao.lineStyle(3, cor);
        this.bordaBotao.strokeRoundedRect(x - 125, y - 30, 250, 60, 10);
    }

    atualizarTexto() {
        let cursor = this.cursorPiscando ? '|' : ' ';
        this.textoExibido.setText(this.nomeUsuario + cursor);
    }
}