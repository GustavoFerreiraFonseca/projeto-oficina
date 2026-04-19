// Minha classe Login herda de uma cena do Phaser
class Login extends Phaser.Scene {
    constructor() {
        super({ key: 'login' });
        this.nomeUsuario = "";
        this.cursorPiscando = true;
    }

    create() {
        const largura = 1920;
        const altura = 1080;
        const centroX = largura / 2;
        const centroY = altura / 2;

        // Estilo dos textos adicionados
        this.add.text(centroX, centroY - 250, 'COLISEU', { 
            fontSize: '120px', fill: '#ffcc00', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(centroX, centroY - 120, 'Digite seu nome:', { 
            fontSize: '40px', fill: '#ffffff' 
        }).setOrigin(0.5);

        let campoFundo = this.add.graphics();
        campoFundo.fillStyle(0xffffff, 1);
        campoFundo.fillRoundedRect(centroX - 250, centroY - 40, 500, 80, 15); 
        campoFundo.lineStyle(6, 0xffcc00);
        campoFundo.strokeRoundedRect(centroX - 250, centroY - 40, 500, 80, 15);

        // Para que ao passar o mouse por cima fique a mãozinha e não a seta
        this.add.zone(centroX, centroY, 500, 80).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.textoExibido = this.add.text(centroX, centroY, '|', { 
            fontSize: '45px', fill: '#000' 
        }).setOrigin(0.5);

        this.bordaBotao = this.add.graphics();
        this.desenharBordaBotao(0xffffff, centroX, centroY + 180);

        let txtEntrar = this.add.text(centroX, centroY + 180, 'ENTRAR', { 
            fontSize: '50px', fill: '#ffffff' 
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Hover dos botões
        txtEntrar.on('pointerover', () => {
            txtEntrar.setStyle({ fill: '#00ff00' });
            this.desenharBordaBotao(0x00ff00, centroX, centroY + 180);
        });
        txtEntrar.on('pointerout', () => {
            txtEntrar.setStyle({ fill: '#ffffff' });
            this.desenharBordaBotao(0xffffff, centroX, centroY + 180);
        });

        // Recebendo input do teclado
        this.input.keyboard.on('keydown', (event) => {
            if (event.keyCode === 8 && this.nomeUsuario.length > 0) {
                this.nomeUsuario = this.nomeUsuario.slice(0, -1);
            } else if (event.key.length === 1 && this.nomeUsuario.length < 11) {
                this.nomeUsuario += event.key;
            }
            this.atualizarTexto();
        });

        // Eventos de clique e Enter 
        this.input.keyboard.on('keydown-ENTER', () => this.tentarLogar());
        txtEntrar.on('pointerdown', () => this.tentarLogar());

        // Faz parecer o cursor '|' ficar piscando
        this.time.addEvent({
            delay: 500,
            callback: () => { 
                this.cursorPiscando = !this.cursorPiscando; 
                this.atualizarTexto(); 
            },
            loop: true
        });

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
        this.bordaBotao.lineStyle(4, cor);
        this.bordaBotao.strokeRoundedRect(x - 150, y - 45, 300, 90, 15);
    }

    atualizarTexto() {
        let cursor = this.cursorPiscando ? '|' : ' ';
        this.textoExibido.setText(this.nomeUsuario + cursor);
    }
}