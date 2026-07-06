class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // Tạo một ảnh ô vuông trắng 10x10 pixel ngay trong bộ nhớ để tái sử dụng
        let graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRect(0, 0, 10, 10);
        graphics.generateTexture('white_box', 10, 10);

        this.load.setPath('assets/images/');
        this.load.image('hotpot_bg', 'hotpot_bg.png');
        
    }

    create() {
        this.scene.start('GameScene');
    }
}