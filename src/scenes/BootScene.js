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

        // TẢI ẢNH KHÁCH HÀNG VÀ NGOÀI TRỜI
        // TẢI BỘ ẢNH KHÁCH HÀNG 1
        this.load.image('cust1_down', 'cust1_down.png'); 
        this.load.image('cust1_side', 'cust1_side.png'); 
        this.load.image('cust1_sit', 'cust1_sit.png'); 
        
        // TẢI BỘ ẢNH KHÁCH HÀNG 2
        this.load.image('cust2_down', 'cust2_down.png'); 
        this.load.image('cust2_side', 'cust2_side.png'); 
        this.load.image('cust2_sit', 'cust2_sit.png');
        
        this.load.image('outdoor_bg', 'outdoor_bg.png'); // Ảnh nền Mặt Tiền Quán
        
        // Cửa hàng nguyên liệu và Tiệm lẩu mini
        this.load.image('mini_store', 'mini_store.png'); 
        this.load.image('mini_hotpot', 'mini_hotpot.png');

        // TẢI ẢNH 3 LOẠI NỒI LẨU THỰC TẾ
        this.load.image('pot_spicy', 'pot_spicy.png');     // Ảnh lẩu cay
        this.load.image('pot_herbal', 'pot_herbal.png');   // Ảnh lẩu nấm
        this.load.image('pot_seafood', 'pot_seafood.png'); // Ảnh lẩu hải sản
    }

    create() {
        this.scene.start('GameScene');
    }
}