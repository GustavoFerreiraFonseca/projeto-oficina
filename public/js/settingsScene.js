class SettingsScene extends Phaser.Scene {
    constructor() {
        // A 'key' deve ser igual ao nome que você usará no game.js
        super({ key: 'settingsScene' });
    }

    create() 
    {   
        // escrendo na tela "TELA DE CONFIGURAÇÕES"
        this.add.text(975, 200, 'CONFIGURAÇÕES', { 
            fontSize: '120px', fill: '#ffcc00', fontStyle: 'bold'
        }).setOrigin(0.5);

        // cria o botão de voltar 
        this.criarBotao(520, 400, 'Musica', (NovoValor) => this.setVolumeMusic(NovoValor), 'slider');
        this.criarBotao(520, 550, 'Efeitos Sonoros', (NovoValor) => this.setVolumeSoundEffetcs(NovoValor), 'slider');
        this.criarBotao(975, 700,   'Sobre', () => window.open('https://github.com/GustavoFerreiraFonseca/projeto-oficina', '_blank'), 'button');
        this.criarBotao(975, 850,  'Voltar', () => this.scene.start('mainMenu'), 'button');
    }

    // cria um botão para poder voltar para a Main Menu
    criarBotao(x, y, label, acao, type) 
    {
        switch (type)
        {
            case 'button':

                let larguraB = 500;
                let alturaB = 100;

                // Desenho da borda inicial
                let borda = this.add.graphics();
                borda.lineStyle(5, 0xffffff);
                borda.strokeRoundedRect(x - larguraB/2, y - alturaB/2, larguraB, alturaB, 20);
                
                // Texto do botão
                let txt = this.add.text(x, y, label, { fontSize: '45px', fill: '#ffffff' })
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true });
                
                // Hover --> Ao passar o mouse por cima do botão ele fica verde
                txt.on('pointerover', () => {
                    txt.setStyle({ fill: '#00ff00' });
                    borda.clear();
                    borda.lineStyle(5, 0x00ff00);
                    borda.strokeRoundedRect(x - larguraB/2, y - alturaB/2, larguraB, alturaB, 20);
                });
                
                txt.on('pointerout', () => {
                    txt.setStyle({ fill: '#ffffff' });
                    borda.clear();
                    borda.lineStyle(5, 0xffffff);
                    borda.strokeRoundedRect(x - larguraB/2, y - alturaB/2, larguraB, alturaB, 20);
                });
                
                txt.on('pointerdown', () => {
                    if (this.registry.get('SoundEffectsOn')) this.sound.play('sound_Click', {volume: this.registry.get('volumeSFX')});
                    if (acao) acao();
                });
            break;

            case 'slider':
                let larguraB_CheckButton = 100;
                let alturaB_CheckButton = 100;
                let ativado = label === 'Musica' ? this.registry.get('musicOn') : this.registry.get('SoundEffectsOn');

                // Desenho da borda inicial
                let CheckButton = this.add.graphics();
                CheckButton.lineStyle(5, 0xffffff);
                CheckButton.fillStyle(ativado === false? 0x000000 : 0x224466, 1);
                CheckButton.fillRoundedRect(x, y - alturaB_CheckButton/2, larguraB_CheckButton, alturaB_CheckButton, 20);
                CheckButton.strokeRoundedRect(x, y - alturaB_CheckButton/2, larguraB_CheckButton, alturaB_CheckButton, 20);

                // Texto do botão
                let txt_CheckButton = this.add.text(x + larguraB_CheckButton/2, y, ativado === true ? 'on' : 'off', { fontSize: '45px', fill: '#ffffff', fontStyle: 'bold'})
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true });

                txt_CheckButton.on('pointerover', () => {
                    CheckButton.clear();
                    CheckButton.lineStyle(5, 0xffffff);
                    CheckButton.fillStyle(0x555555, 1);  
                    CheckButton.fillRoundedRect(x, y - alturaB_CheckButton/2, larguraB_CheckButton, alturaB_CheckButton, 20);
                    CheckButton.strokeRoundedRect(x, y - alturaB_CheckButton/2, larguraB_CheckButton, alturaB_CheckButton, 20);
                });
                
                txt_CheckButton.on('pointerout', () => {
                    CheckButton.clear();
                    CheckButton.lineStyle(5, 0xffffff);
                    CheckButton.fillStyle(ativado === false? 0x000000 : 0x224466, 1);
                    CheckButton.fillRoundedRect(x, y - alturaB_CheckButton/2, larguraB_CheckButton, alturaB_CheckButton, 20);
                    CheckButton.strokeRoundedRect(x, y - alturaB_CheckButton/2, larguraB_CheckButton, alturaB_CheckButton, 20);
                });
                
                
                
                // criando as dimensões da borda da barra do slider
                const larguraB_slider = 760;
                const alturaB_slider = 50;
                
                
                const inicio_slider = x + 150;
                const limite_Direito = inicio_slider + larguraB_slider - 20;
                const limite_Esquerdo = inicio_slider + 20;
                let distanciaTotal = limite_Direito - limite_Esquerdo;
                
                let posicao_inicial = (this.registry.get(label === "Musica" ? 'volumeBGM' : 'volumeSFX') * distanciaTotal) + limite_Esquerdo;
                
                // Desenho da borda inicial
                let borda_slider = this.add.graphics();
                borda_slider.lineStyle(5, 0xffffff);
                borda_slider.fillStyle(0x333333, 1);
                borda_slider.fillRect(inicio_slider, y - alturaB_slider/2, larguraB_slider, alturaB_slider);
                borda_slider.strokeRect(inicio_slider, y - alturaB_slider/2, larguraB_slider, alturaB_slider);
                
                let txt_slider = this.add.text(x + larguraB_slider/2 + 120, y - alturaB_slider/2 + 20, label + ': ' + String(Math.round(this.registry.get(label === "Musica" ? 'volumeBGM' : 'volumeSFX') * 100)) + '%', { fontSize: '45px', fill: '#ffffff', fontStyle: 'bold',}).setOrigin(0.5);
                
                let slider = this.add.rectangle(posicao_inicial, y, 30, 50, 0x555555, 1);
                slider.setInteractive({useHandCursor: true});
                this.input.setDraggable(slider);
                
                txt_CheckButton.on('pointerdown', () => {
                    ativado = !ativado
                    this.registry.set(label === 'Musica' ? 'musicOn' : 'SoundEffectsOn', ativado);
                    txt_CheckButton.setText(ativado === true ? 'on' : 'off');

                    if (!ativado) {
                        if (acao) acao(0);
                        txt_slider.setText(label + ': 0%');
                        slider.x = limite_Esquerdo; 
                    } else {
                        let volRecuperado = this.registry.get(label === 'Musica' ? 'volumeBGM' : 'volumeSFX');
                        
                        if (volRecuperado === 0) {
                            volRecuperado = 0.5;
                            this.registry.set(label === 'Musica' ? 'volumeBGM' : 'volumeSFX', 0.5);
                        }

                        if (acao) acao(volRecuperado);
                        txt_slider.setText(label + ': ' + Math.round(volRecuperado * 100) + '%');
                        slider.x = (volRecuperado * distanciaTotal) + limite_Esquerdo; // Devolve a barrinha para a posição real
                    }

                    CheckButton.clear();
                    CheckButton.lineStyle(5, 0xffffff);
                    CheckButton.fillStyle(ativado === false ? 0x000000 : 0x224466, 1);
                    CheckButton.fillRoundedRect(x, y - alturaB_CheckButton/2, larguraB_CheckButton, alturaB_CheckButton, 20);
                    CheckButton.strokeRoundedRect(x, y - alturaB_CheckButton/2, larguraB_CheckButton, alturaB_CheckButton, 20);
                });

                slider.on('drag', (pointer, dragX, dragY) => {
                    slider.x = Phaser.Math.Clamp(dragX, limite_Esquerdo, limite_Direito);
                    
                    distanciaTotal = limite_Direito - limite_Esquerdo;
                    let posicaoAtual = slider.x - limite_Esquerdo;
                    
                    let porcentagem = posicaoAtual / distanciaTotal;
                    
                    if (acao) acao(porcentagem);
                    
                    txt_slider.setText(label + ': ' + Math.round(porcentagem * 100) + '%');

                    if (porcentagem > 0 && !ativado) {
                        ativado = true;
                        this.registry.set(label === 'Musica' ? 'musicOn' : 'SoundEffectsOn', true);
                        txt_CheckButton.setText('on');
                        CheckButton.clear();
                        CheckButton.lineStyle(5, 0xffffff);
                        CheckButton.fillStyle(0x224466, 1);
                        CheckButton.fillRoundedRect(x, y - alturaB_CheckButton/2, larguraB_CheckButton, alturaB_CheckButton, 20);
                        CheckButton.strokeRoundedRect(x, y - alturaB_CheckButton/2, larguraB_CheckButton, alturaB_CheckButton, 20);
                    } else if (porcentagem === 0 && ativado) {
                        ativado = false;
                        this.registry.set(label === 'Musica' ? 'musicOn' : 'SoundEffectsOn', false);
                        txt_CheckButton.setText('off');
                        CheckButton.clear();
                        CheckButton.lineStyle(5, 0xffffff);
                        CheckButton.fillStyle(0x000000, 1);
                        CheckButton.fillRoundedRect(x, y - alturaB_CheckButton/2, larguraB_CheckButton, alturaB_CheckButton, 20);
                        CheckButton.strokeRoundedRect(x, y - alturaB_CheckButton/2, larguraB_CheckButton, alturaB_CheckButton, 20);
                    }
                });

            break;
        }
    }

    setVolumeMusic(NovoValor)
    {
        let music = this.registry.get('Musica_atual');
        music.setVolume(NovoValor);
        this.registry.set('volumeBGM', NovoValor);
        this.registry.set('Musica_atual', music);
    }

    setVolumeSoundEffetcs(NovoValor)
    {
        this.registry.set('volumeSFX', NovoValor);
    }
}