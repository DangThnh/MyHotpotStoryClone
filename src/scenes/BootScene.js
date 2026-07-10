class BootScene extends Phaser.Scene {
    constructor() { 
        super('BootScene'); 
    }

    preload() {
        // Thiết lập màn hình nền sẫm màu ấm áp cho sảnh chờ nạp game
        this.cameras.main.setBackgroundColor('#1a1a1a');

        let width = this.cameras.main.width;
        let height = this.cameras.main.height;

        // 1. CHỮ "LOADING..."
        let loadingText = this.make.text({
            x: width / 2,
            y: height / 2 + 120, // Đẩy xuống nửa dưới màn hình để nhường chỗ cho ảnh giới thiệu
            text: 'Đang tải tài nguyên...',
            style: { font: 'bold 18px Arial', fill: '#ffffff' }
        }).setOrigin(0.5);

        // 2. CHỮ PHẦN TRĂM (%) SỐ NHẢY ĐỘNG
        let percentText = this.make.text({
            x: width / 2,
            y: height / 2 + 160,
            text: '0%',
            style: { font: 'bold 16px Arial', fill: '#f1c40f' }
        }).setOrigin(0.5);

        // 3. KHUNG NGOÀI CỦA THANH TIẾN TRÌNH (BOX)
        let progressBox = this.add.graphics();
        progressBox.fillStyle(0x333333, 0.8);
        progressBox.fillRect(width / 2 - 180, height / 2 + 200, 360, 20);

        // 4. LÕI CHẠY CỦA THANH TIẾN TRÌNH (BAR)
        let progressBar = this.add.graphics();

        // =======================================================
        // LẮNG NGHE TIẾN TRÌNH LOADER CỦA PHASER
        // =======================================================
        this.load.on('progress', (value) => {
            // Nhảy số %
            percentText.setText(parseInt(value * 100) + '%');
            
            // Vẽ lấp đầy thanh Loading màu xanh lá
            progressBar.clear();
            progressBar.fillStyle(0x27ae60, 1);
            progressBar.fillRect(width / 2 - 175, height / 2 + 203, 350 * value, 14);
        });

        // Khi load hoàn tất -> Tự động dọn dẹp bộ nhớ các text và graphics dán tạm
        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
        });


        // =======================================================
        // BẮT ĐẦU TẢI TOÀN BỘ TÀI NGUYÊN (IMAGES)
        // =======================================================
        this.load.setPath('assets/images/');
        
        // Ảnh giới thiệu (600x400)
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

        // Đồ họa chuyển hướng của Đầu Bếp (Chef)
        this.load.image('chef_down', 'chef_down.png'); 
        this.load.image('chef_side', 'chef_side.png'); 
        this.load.image('chef_up', 'chef_up.png'); 

        // Đồ họa chuyển hướng của Phục Vụ (Waitress)
        this.load.image('waitress_down', 'waitress_down.png'); 
        this.load.image('waitress_side', 'waitress_side.png'); 
        this.load.image('waitress_up', 'waitress_up.png'); 

        // Đồ họa chuyển hướng của Khách hàng 1 (cust1)
        this.load.image('cust1_down', 'cust1_down.png'); 
        this.load.image('cust1_side', 'cust1_side.png'); 
        this.load.image('cust1_sit', 'cust1_sit.png'); 

        // Đồ họa chuyển hướng của Khách hàng 2 (cust2)
        this.load.image('cust2_down', 'cust2_down.png'); 
        this.load.image('cust2_side', 'cust2_side.png'); 
        this.load.image('cust2_sit', 'cust2_sit.png'); 

        // Tạo sẵn texture 'white_box' dùng làm các khối ảo tàng hình
        let graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRect(0, 0, 10, 10);
        graphics.generateTexture('white_box', 10, 10);


        // =======================================================
        // BẮT ĐẦU TẢI TOÀN BỘ TÀI NGUYÊN (AUDIO)
        // =======================================================
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
        let width = this.cameras.main.width;
        let height = this.cameras.main.height;

        // VẼ ẢNH GIỚI THIỆU LÊN CHÍNH GIỮA MÀN HÌNH NỬA TRÊN
        let intro = this.add.image(width / 2, height / 2 - 100, 'intro_img');
        
        // Co giãn tỷ lệ vàng (Giữ nguyên tỉ lệ 600x400 nhưng bóp về 480x320 để lọt lòng màn hình mobile dọc)
        intro.setDisplaySize(400, 600);

        // Hiệu ứng Fade In (Hiện mờ sang rõ) cho ảnh giới thiệu thêm phần cuốn hút
        intro.setAlpha(0);
        this.tweens.add({
            targets: intro,
            alpha: 1,
            duration: 800,
            ease: 'Power1'
        });

        // Cho dừng chân đọc thông tin ảnh giới thiệu 2.5 giây rồi mới chính thức chuyển tiếp vào sảnh chờ
        this.time.delayedCall(2500, () => {
            // Chuyển sang MenuScene (Lưu ý: main.js của cậu đang cài đặt mảng scene là [BootScene, MenuScene, GameScene] nên nhảy vào MenuScene là chuẩn xác!)
            this.scene.start('MenuScene');
        });
    }
}