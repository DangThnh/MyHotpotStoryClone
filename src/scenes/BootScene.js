class BootScene extends Phaser.Scene {
    constructor() { 
        super('BootScene'); 
    }

    preload() {
        // Đổi màu nền của BootScene thành màu ĐỎ rực rỡ phong cách tiệm lẩu
        this.cameras.main.setBackgroundColor('#e74c3c');

        let width = this.cameras.main.width;
        let height = this.cameras.main.height;

        // ==========================================
        // 1. THIẾT LẬP THANH LOADING (NẰM Ở NỬA DƯỚI MÀN HÌNH)
        // ==========================================
        
        // Chữ "Loading..."
        let loadingText = this.make.text({
            x: width / 2,
            y: 740, // Đặt ở Y=740 để nhường khoảng trống 600px cho ảnh giới thiệu phía trên
            text: 'Đang tải tài nguyên...',
            style: { font: 'bold 18px Arial', fill: '#ffffff', stroke: '#000000', strokeThickness: 4 }
        }).setOrigin(0.5);

        // Chữ hiển thị phần trăm số nhảy (%)
        let percentText = this.make.text({
            x: width / 2,
            y: 780,
            text: '0%',
            style: { font: 'bold 18px Arial', fill: '#ffd700', stroke: '#000000', strokeThickness: 4 } // Chữ màu vàng óng viền đen
        }).setOrigin(0.5);

        // Khung ngoài của thanh tiến trình (Box)
        let progressBox = this.add.graphics();
        progressBox.fillStyle(0x333333, 0.8);
        progressBox.fillRect(width / 2 - 180, 820, 360, 20);

        // Lõi chạy của thanh tiến trình (Bar)
        let progressBar = this.add.graphics();

        // LẮNG NGHE TIẾN TRÌNH LOADER
        this.load.on('progress', (value) => {
            percentText.setText(parseInt(value * 100) + '%');
            progressBar.clear();
            progressBar.fillStyle(0xffd700, 1); // Đổi lõi thanh chạy thành màu VÀNG ÓNG cho hợp nền đỏ
            progressBar.fillRect(width / 2 - 175, 823, 350 * value, 14);
        });

        // ==========================================
        // KỸ THUẬT SIÊU ĐẲNG: HIỂN THỊ ẢNH NGAY KHI VỪA NẠP XONG 
        // ==========================================
        // Lắng nghe sự kiện: Ngay khi riêng tấm ảnh 'intro_img' nạp xong (mất 0.05s đầu ván), vẽ nó lên màn hình ngay!
        this.load.on('filecomplete-image-intro_img', () => {
            this.add.image(width / 2, 380, 'intro_img') // Tâm ảnh đặt ở Y=380 (Cao 600px -> quét từ Y=80 đến Y=680)
                .setDisplaySize(400, 600) // Khớp khít tỉ lệ 400x600 cậu yêu cầu
                .setDepth(10);
        });

        // ==========================================
        // ĐĂNG KÝ TẢI TÀI NGUYÊN GAME
        // ==========================================
        this.load.setPath('assets/images/');
        
        // Đăng ký nạp ảnh giới thiệu đầu tiên trong danh sách
        this.load.image('intro_img', 'intro_img.png'); 

        // Các ảnh nền bản đồ
        this.load.image('hotpot_bg', 'hotpot_bg.png'); 
        this.load.image('outdoor_bg', 'outdoor_bg.png'); 
        this.load.image('upgrade_store', 'upgrade_store.png'); 
        this.load.image('mini_store', 'mini_store.png'); 
        this.load.image('mini_hotpot', 'mini_hotpot.png');
        
        // Đồ họa Nồi lẩu thực tế
        this.load.image('pot_spicy', 'pot_spicy.png');
        this.load.image('pot_herbal', 'pot_herbal.png');
        this.load.image('pot_seafood', 'pot_seafood.png');

        // Đồ họa bồn rửa và các icon
        this.load.image('dishwasher', 'dishwasher.png'); 
        this.load.image('sink_dirty', 'sink_dirty.png'); 
        this.load.image('angry_bubble', 'angry_bubble.png'); 

        // Đồ họa Đầu Bếp (Chef)
        this.load.image('chef_down', 'chef_down.png'); 
        this.load.image('chef_side', 'chef_side.png'); 
        this.load.image('chef_up', 'chef_up.png'); 

        // Đồ họa Phục Vụ (Waitress)
        this.load.image('waitress_down', 'waitress_down.png'); 
        this.load.image('waitress_side', 'waitress_side.png'); 
        this.load.image('waitress_up', 'waitress_up.png'); 

        // Đồ họa Khách hàng 1 (cust1)
        this.load.image('cust1_down', 'cust1_down.png'); 
        this.load.image('cust1_side', 'cust1_side.png'); 
        this.load.image('cust1_sit', 'cust1_sit.png'); 

        // Đồ họa Khách hàng 2 (cust2)
        this.load.image('cust2_down', 'cust2_down.png'); 
        this.load.image('cust2_side', 'cust2_side.png'); 
        this.load.image('cust2_sit', 'cust2_sit.png'); 

        // Tạo sẵn texture 'white_box' dùng làm các khối ảo tàng hình
        let graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRect(0, 0, 10, 10);
        graphics.generateTexture('white_box', 10, 10);

        // --- LOAD ÂM THANH ---
        this.load.setPath('assets/audio/');
        this.load.audio('bgm', 'bgm.mp3');
        this.load.audio('sfx_chatter', 'chatter.mp3');
        this.load.audio('sfx_cook', 'cook.mp3');
        this.load.audio('sfx_serve', 'serve.mp3');
        this.load.audio('sfx_cash', 'cash.mp3');
        this.load.audio('sfx_buy', 'buy.mp3');
        this.load.audio('sfx_wash', 'wash.mp3');
        this.load.audio('sfx_angry', 'angry.mp3');
    }

    create() {
        // Khi load hoàn tất -> TRỰC TIẾP NHẢY VÀO GAME LUÔN (Không qua MenuScene)
        this.scene.start('GameScene');
    }
}