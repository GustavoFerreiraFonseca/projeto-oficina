class Jogar extends Phaser.Scene {
    constructor() {
        super({ key: 'jogar' });
        this.botoesSalas = []; // Array para rastrear e limpar os botões
    }

    init(data)
    {
        this.nomeUsuario = data.nomeUsuario;
    }

    create() {
        const largura = 1920;
        const altura = 1080;
        const centroX = largura / 2;

        // Título
        this.add.text(centroX, 100, 'SALAS DISPONÍVEIS', { 
            fontSize: '80px', fill: '#ffcc00', fontStyle: 'bold' 
        }).setOrigin(0.5);

        // Botão para CRIAR uma sala
        let btnCriar = this.add.text(centroX, 950, '[ CRIAR MINHA ARENA ]', { 
            fontSize: '50px', fill: '#00ff00', fontStyle: 'bold' 
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

        btnCriar.on('pointerdown', () => {
            socket.emit('criarSala');
        });

        // Escutando o servidor para atualizar a lista
        socket.on('atualizarListaSalas', (lista) => {
            this.renderizarLista(lista);
        });

        // Pede a lista atualizada assim que entra na cena
        socket.emit('pedirSalas');

        socket.on('confirmarEntrada', (sala) => {

            const dadosCompletos = {
                ...sala,
                nomeUsuario: this.nomeUsuario
            };

            this.scene.start('Lobby', dadosCompletos); // Passa o objeto da sala para a próxima cena
        });
    }

    renderizarLista(lista) {
        const centroX = 1920 / 2;

        // 1. Limpar botões antigos para não sobrepor
        this.botoesSalas.forEach(obj => obj.destroy());
        this.botoesSalas = [];

        if (lista.length === 0) {
            let aviso = this.add.text(centroX, 540, 'Nenhuma sala aberta no momento...', { 
                fontSize: '30px', fill: '#888888' 
            }).setOrigin(0.5);
            this.botoesSalas.push(aviso);
            return;
        }

        // 2. Criar um botão para cada sala vinda do servidor
        lista.forEach((sala, index) => {
            let yPos = 300 + (index * 120); // Espaçamento vertical

            let txtSala = this.add.text(centroX, yPos, `${sala.nome} - [ ENTRAR ]`, { 
                fontSize: '40px', fill: '#ffffff', backgroundColor: '#333333', padding: 10
            })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

            txtSala.on('pointerdown', () => {
                console.log("Tentando entrar na sala:", sala.id);
                socket.emit('entrarSala', sala.id);
            });

            // Efeito de hover simples
            txtSala.on('pointerover', () => txtSala.setStyle({ fill: '#ffcc00' }));
            txtSala.on('pointerout', () => txtSala.setStyle({ fill: '#ffffff' }));

            this.botoesSalas.push(txtSala);
        });
    }
}