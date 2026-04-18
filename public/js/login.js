class Login extends Phaser.Scene {
    constructor() {
        super({ key: 'login' });
        this.nomeUsuario = "";
        this.cursorPiscando = true;
    }

    create() {
        // Captura as dimensões dinâmicas da janela do navegador
        const largura = this.cameras.main.width;
        const altura = this.cameras.main.height;
        const centroX = largura / 2;
        const centroY = altura / 2;

        // Título centralizado com base no tamanho real da tela
        this.add.text(centroX, centroY - 180, 'COLISEU', { 
            fontSize: '64px', 
            fill: '#ffcc00',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(centroX, centroY - 100, 'Digite seu nome de Guerreiro:', { 
            fontSize: '22px', 
            fill: '#ffffff' 
        }).setOrigin(0.5);

        // --- CAIXA DE INPUT CENTRALIZADA ---
        let campoFundo = this.add.graphics();
        campoFundo.fillStyle(0xffffff, 1);
        // Posicionamento relativo: centro menos metade da largura da caixa (300/2 = 150)
        campoFundo.fillRoundedRect(centroX - 150, centroY - 30, 300, 60, 10); 
        campoFundo.lineStyle(4, 0xffcc00);
        campoFundo.strokeRoundedRect(centroX - 150, centroY - 30, 300, 60, 10);

        // Zona de interação para o mouse (mãozinha)
        this.add.zone(centroX, centroY, 300, 60).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Texto que o usuário digita
        this.textoExibido = this.add.text(centroX, centroY, '|', { 
            fontSize: '28px', 
            fill: '#000' 
        }).setOrigin(0.5);

        // --- BOTÃO ENTRAR REPOSICIONADO ---
        this.bordaBotao = this.add.graphics();
        this.desenharBordaBotao(0xffffff, centroX, centroY + 120);

        let txtEntrar = this.add.text(centroX, centroY + 120, 'ENTRAR', { 
            fontSize: '32px', 
            fill: '#ffffff' 
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        // Eventos de Hover (Mudança de cor)
        txtEntrar.on('pointerover', () => {
            txtEntrar.setStyle({ fill: '#00ff00' });
            this.desenharBordaBotao(0x00ff00, centroX, centroY + 120);
        });
        txtEntrar.on('pointerout', () => {
            txtEntrar.setStyle({ fill: '#ffffff' });
            this.desenharBordaBotao(0xffffff, centroX, centroY + 120);
        });

        // --- LÓGICA DE TECLADO ---
        this.input.keyboard.on('keydown', (event) => {
            if (event.keyCode === 8 && this.nomeUsuario.length > 0) {
                this.nomeUsuario = this.nomeUsuario.slice(0, -1);
            } else if (event.key.length === 1 && this.nomeUsuario.length < 15) {
                this.nomeUsuario += event.key;
            }
            this.atualizarTexto();
        });

        this.input.keyboard.on('keydown-ENTER', () => this.tentarLogar());
        txtEntrar.on('pointerdown', () => this.tentarLogar());

        // Timer do cursor piscando
        this.time.addEvent({
            delay: 500,
            callback: () => { 
                this.cursorPiscando = !this.cursorPiscando; 
                this.atualizarTexto(); 
            },
            loop: true
        });

        // --- OUVINTE DO SOCKET (MUITO IMPORTANTE) ---
        socket.off('loginSucesso');
        socket.on('loginSucesso', (dados) => {
            // Salva o nome na variável global do game.js para usar no Menu
            nickUsuario = dados.nome; 
            this.scene.start('mainMenu');
        });
    }

    tentarLogar() {
        if (this.nomeUsuario.length > 2) {
            socket.emit('fazerLogin', this.nomeUsuario);
        }
    }

    // Função atualizada para aceitar coordenadas dinâmicas
    desenharBordaBotao(cor, x, y) {
        this.bordaBotao.clear();
        this.bordaBotao.lineStyle(3, cor);
        // Centraliza o retângulo de contorno exatamente sobre o texto
        this.bordaBotao.strokeRoundedRect(x - 125, y - 30, 250, 60, 10);
    }

    atualizarTexto() {
        let cursor = this.cursorPiscando ? '|' : ' ';
        this.textoExibido.setText(this.nomeUsuario + cursor);
    }
}