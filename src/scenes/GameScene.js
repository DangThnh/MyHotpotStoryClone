class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    init() {
        // 1. DATA: KHO NGUYÊN LIỆU (BẾP)
        this.inventory = {
            chili: 5,     // Ớt (Nước cốt)
            herbs: 5,     // Thảo mộc
            bone: 5,      // Xương ống
            beef: 10,     // Thịt bò (Đồ nhúng)
            veggies: 10,  // Rau
            seafood: 5    // Hải sản
        };

        this.dirtyDishes = 0; // Bồn rửa chén

        // 2. DATA: QUẢN LÝ BÀN ĂN TRONG SẢNH (STATE MACHINE)
        // Mỗi bàn có ID, Tọa độ X/Y, Trạng thái hiện tại, và cờ nhận diện Bàn VIP
        // 2. DATA: QUẢN LÝ BÀN ĂN (ĐÃ MỞ RỘNG TỌA ĐỘ)
        this.tables = [
            // SẢNH CHÍNH (Khu vực giữa: X khoảng 600 - 1000)
            { id: 1, x: 700, y: 350, status: 'EMPTY', isLocked: false, isVip: false, unlockPrice: 0 },
            { id: 2, x: 920, y: 350, status: 'LOCKED', isLocked: true, isVip: false, unlockPrice: 200 },
            { id: 3, x: 700, y: 650, status: 'LOCKED', isLocked: true, isVip: false, unlockPrice: 500 },
            { id: 4, x: 920, y: 650, status: 'LOCKED', isLocked: true, isVip: false, unlockPrice: 1000 },
            
            // PHÒNG VIP (Khu vực phải: X khoảng 1150 - 1500)
            { id: 5, x: 1250, y: 400, status: 'LOCKED', isLocked: true, isVip: true, unlockPrice: 2000 },
            { id: 6, x: 1450, y: 400, status: 'LOCKED', isLocked: true, isVip: true, unlockPrice: 4000 }
        ];

        // ==========================================
        // 3. DATA: DÒNG TIỀN & BẢNG GIÁ CỬA HÀNG
        // ==========================================
        // Lấy tiền từ LocalStorage, nếu mới chơi cho sẵn 500 Vàng làm vốn
        this.gold = parseInt(localStorage.getItem('hotpot_gold')) || 500; 

        this.shopPrices = {
            chili: 5,     // Ớt
            herbs: 5,     // Thảo mộc
            bone: 8,      // Xương ống
            beef: 12,     // Thịt bò
            veggies: 4,   // Rau củ
            seafood: 20   // Hải sản
        };

        // Giỏ hàng tạm thời khi đang chọn đồ trong UI
        this.cart = { chili: 0, herbs: 0, bone: 0, beef: 0, veggies: 0, seafood: 0 };
    }

  create() {
     // ==========================================
        // 1. THIẾT LẬP CAMERA (Bên trong và Bầu trời)
        // ==========================================
        this.cameras.main.setBounds(0, -2000, 1620, 2960);
        this.cameras.main.scrollX = 540; // Đứng ở Sảnh Chính (Tọa độ X của phòng giữa)
        this.cameras.main.scrollY = 0;

        // =================================================================
        // 2. KHÔNG GIAN BÊN TRONG: VẼ TẤM ẢNH NỀN KHỔNG LỒ DUY NHẤT
        // =================================================================
        // Ảnh bắt đầu từ X=0, Y=0 (Mép trái của phòng Bếp)
        this.add.image(0, 0, 'hotpot_bg')
            .setOrigin(0, 0)
            .setDisplaySize(1620, 960) // Ép kích thước vừa khít 3 màn hình
            .setDepth(0);

        // NÚT: CÁNH CỬA RA NGOÀI TRỜI (Vẫn phải dùng Code để vẽ nút bấm nổi lên)
        // Đặt ở dưới cùng Sảnh chính (X=810)
        let doorToOutside = this.add.image(810, 880, 'white_box')
            .setDisplaySize(200, 60)
            .setTint(0x8e44ad)
            .setInteractive({ useHandCursor: true })
            .setDepth(100);
            
        this.add.text(810, 880, "🚪 RA NGOÀI TRỜI", { font: 'bold 18px Arial', fill: '#fff' })
            .setOrigin(0.5)
            .setDepth(101);
        
        doorToOutside.on('pointerdown', () => {
            this.cameras.main.scrollX = 0;
            this.cameras.main.scrollY = -1500;
        });

        // ==========================================
        // 3. ẨN CÁC KHỐI BÀN ẢO (INVISIBLE HITBOX)
        // ==========================================
        // Tấm ảnh AI gen đã có Bàn và Ghế, ta chỉ dùng khối của Phaser làm Vùng Click Ảo (Tàng hình)
        this.tableSprites = {}; 
        
        this.tables.forEach(tableData => {
            // Đặt Alpha = 0.001 (Gần như tàng hình nhưng vẫn click được)
            let tableSprite = this.add.image(tableData.x, tableData.y, 'white_box')
                .setDisplaySize(160, 100) // Kích thước vùng click bao trọn cái Bàn trong ảnh
                .setAlpha(0.001) // <--- TÀNG HÌNH VÙNG CLICK
                .setInteractive({ useHandCursor: true });
            
            // Text hiển thị Trạng thái/Tiền mở khóa vẫn nổi lên đè trên Bàn
            let statusText = this.add.text(tableData.x, tableData.y, tableData.isLocked ? `🔒 ${tableData.unlockPrice}` : tableData.status, { 
                font: 'bold 22px Arial', fill: '#fff', stroke: '#000', strokeThickness: 4 
            }).setOrigin(0.5).setDepth(50);

            this.tableSprites[tableData.id] = { bg: tableSprite, text: statusText };
        });


        // =================================================================
        // KHÔNG GIAN 2: NGOÀI TRỜI (Nằm tại X: 0->540, Y: -1500)
        // =================================================================
        
        let outX = 270;
        let outY = -1020; // Tâm màn hình của khu vực ngoài trời (-1500 + 480)

        // Nền đường phố / Vỉa hè
        this.add.image(outX, outY, 'white_box').setDisplaySize(540, 960).setTint(0x7f8c8d);
        this.add.text(outX, outY - 400, "TRƯỚC CỬA QUÁN LẨU", { font: 'bold 30px Arial', fill: '#fff' }).setOrigin(0.5);

        // ---> MÔ HÌNH NHÀ HÀNG THU NHỎ (Bấm vào để quay lại bên trong)
        let miniRestaurant = this.add.image(outX - 120, outY - 150, 'white_box').setDisplaySize(200, 250).setTint(0xd35400).setInteractive({ useHandCursor: true });
        this.add.text(outX - 120, outY - 150, "TIỆM LẨU\n(Bấm để vào)", { font: 'bold 20px Arial', fill: '#fff', align: 'center' }).setOrigin(0.5);
        
        miniRestaurant.on('pointerdown', () => {
            // Teleport camera về lại Sảnh Chính bên trong
            this.cameras.main.scrollX = 540;
            this.cameras.main.scrollY = 0;
        });

        // ---> CỬA HÀNG MUA NGUYÊN LIỆU (Nằm cạnh nhà hàng)
        let supplyStore = this.add.image(outX + 130, outY - 150, 'white_box').setDisplaySize(180, 200).setTint(0x27ae60).setInteractive({ useHandCursor: true });
        this.add.text(outX + 130, outY - 150, "🛒 SHOP\nNGUYÊN LIỆU", { font: 'bold 18px Arial', fill: '#fff', align: 'center' }).setOrigin(0.5);

      supplyStore.on('pointerdown', () => {
            // Lấy tọa độ trung tâm của Camera hiện tại (Đang đứng ở đâu thì lấy ở đó)
            let currentCamX = this.cameras.main.scrollX + 270; 
            let currentCamY = this.cameras.main.scrollY + 480;
            
            // Dịch chuyển nguyên cái UI đến đập thẳng vào mặt người chơi
            this.shopUI.setPosition(currentCamX, currentCamY);
            
            // Bật lên
            this.shopUI.setVisible(true);
        });

        // ---> KHU VỰC HÀNG ĐỢI (Nơi khách đứng xếp hàng)
        this.add.rectangle(outX, outY + 180, 450, 150, 0x000000, 0.3);
        this.add.text(outX, outY + 180, "Ghế chờ của thực khách...", { font: 'italic 20px Arial', fill: '#ccc' }).setOrigin(0.5);


        // ==========================================
        // HỆ THỐNG KÉO VUỐT CAMERA (CHỈ CHO PHÉP KHI Ở BÊN TRONG)
        // ==========================================
        this.isDragging = false;
        this.dragStartX = 0;
        this.camStartX = 0;

        this.input.on('pointerdown', (pointer) => {
            // CHỈ CHO PHÉP VUỐT KHI Ở BÊN TRONG QUÁN (scrollY === 0)
            if (this.cameras.main.scrollY === 0) {
                this.isDragging = true;
                this.dragStartX = pointer.x;
                this.camStartX = this.cameras.main.scrollX;
            }
        });

        this.input.on('pointermove', (pointer) => {
            if (this.isDragging && this.cameras.main.scrollY === 0) {
                let deltaX = this.dragStartX - pointer.x;
                this.cameras.main.scrollX = this.camStartX + deltaX;
            }
        });

        this.input.on('pointerup', () => { this.isDragging = false; });
        this.input.on('pointerout', () => { this.isDragging = false; });
   
        // ==========================================
        // HUD: THANH CÔNG CỤ GHIM TRÊN MÀN HÌNH (SCROLL FACTOR = 0)
        // ==========================================
        // Khung nền HUD trên cùng
        let hudBg = this.add.rectangle(270, 25, 540, 50, 0x000000, 0.6).setDepth(10000).setScrollFactor(0);
        
        // Hiển thị Vàng (Góc phải)
        this.goldText = this.add.text(520, 25, `🪙 ${this.gold}`, { font: 'bold 22px Arial', fill: '#f1c40f' })
            .setOrigin(1, 0.5).setDepth(10001).setScrollFactor(0);

        // Hiển thị Kho hàng (Góc trái) - Để theo dõi nguyên liệu
        this.inventoryText = this.add.text(20, 25, "📦 Kho: Đang trống", { font: '14px Arial', fill: '#fff' })
            .setOrigin(0, 0.5).setDepth(10001).setScrollFactor(0);
            
        this.updateInventoryHUD(); // Cập nhật chữ lần đầu tiên

        // KHỞI TẠO GIAO DIỆN CỬA HÀNG (ẨN MẶC ĐỊNH)
        this.createShopUI();

    }

    update() {
        // Game quản lý dùng Event Driven, update() sẽ rất ít code
    }

    updateInventoryHUD() {
        let inv = this.inventory;
        this.inventoryText.setText(`🌶️${inv.chili} 🌿${inv.herbs} 🦴${inv.bone} | 🥩${inv.beef} 🥬${inv.veggies} 🍤${inv.seafood}`);
    }

    createShopUI() {
       // Cố tình đặt ở gốc tọa độ (0,0), không ghim Scroll, sẽ chủ động Teleport nó sau
        this.shopUI = this.add.container(0, 0).setDepth(20000).setVisible(false);

        // Nền đen mờ khổng lồ che toàn bộ map 1620x2960
        let overlay = this.add.rectangle(0, 0, 3000, 3000, 0x000000, 0.8).setInteractive();

        // Bảng Menu trắng ở giữa
        let panel = this.add.rectangle(0, 0, 400, 600, 0xffffff).setStrokeStyle(4, 0x27ae60);
        let title = this.add.text(0, -260, "🛒 CỬA HÀNG NGUYÊN LIỆU", { font: 'bold 24px Arial', fill: '#27ae60' }).setOrigin(0.5);
        
        this.shopUI.add([overlay, panel, title]);

        // Tạo mảng giao diện cho 6 mặt hàng
        let items = [
            { key: 'chili', name: '🌶️ Ớt Tứ Xuyên', price: this.shopPrices.chili },
            { key: 'herbs', name: '🌿 Thảo Mộc', price: this.shopPrices.herbs },
            { key: 'bone', name: '🦴 Xương Ống', price: this.shopPrices.bone },
            { key: 'beef', name: '🥩 Ba Chỉ Bò', price: this.shopPrices.beef },
            { key: 'veggies', name: '🥬 Rau Thập Cẩm', price: this.shopPrices.veggies },
            { key: 'seafood', name: '🍤 Hải Sản', price: this.shopPrices.seafood }
        ];

        this.cartTexts = {}; // Lưu lại Text số lượng để update

        items.forEach((item, index) => {
            let startY = -180 + (index * 60);

            // Tên và Giá
            let nameTxt = this.add.text(-160, startY, `${item.name} (${item.price}G)`, { font: 'bold 18px Arial', fill: '#333' }).setOrigin(0, 0.5);
            
            // Nút [-]
            let minusBtn = this.add.rectangle(50, startY, 40, 40, 0xe74c3c).setInteractive({ useHandCursor: true });
            let minusTxt = this.add.text(50, startY, "-", { font: 'bold 24px Arial', fill: '#fff' }).setOrigin(0.5);
            
            // Chữ Số lượng (Mặc định 0)
            let qtyTxt = this.add.text(100, startY, "0", { font: 'bold 20px Arial', fill: '#000' }).setOrigin(0.5);
            this.cartTexts[item.key] = qtyTxt;

            // Nút [+]
            let plusBtn = this.add.rectangle(150, startY, 40, 40, 0x2ecc71).setInteractive({ useHandCursor: true });
            let plusTxt = this.add.text(150, startY, "+", { font: 'bold 24px Arial', fill: '#fff' }).setOrigin(0.5);

            // Sự kiện Click [-] và [+]
            plusBtn.on('pointerdown', () => {
                this.cart[item.key]++;
                qtyTxt.setText(this.cart[item.key]);
                this.updateCartTotal();
            });

            minusBtn.on('pointerdown', () => {
                if (this.cart[item.key] > 0) {
                    this.cart[item.key]--;
                    qtyTxt.setText(this.cart[item.key]);
                    this.updateCartTotal();
                }
            });

            this.shopUI.add([nameTxt, minusBtn, minusTxt, qtyTxt, plusBtn, plusTxt]);
        });

        // TỔNG TIỀN
        this.totalCostText = this.add.text(0, 190, "Tổng: 0 Vàng", { font: 'bold 24px Arial', fill: '#d35400' }).setOrigin(0.5);
        this.shopUI.add(this.totalCostText);

        // NÚT THANH TOÁN
        let checkoutBtn = this.add.rectangle(0, 250, 200, 60, 0x27ae60).setInteractive({ useHandCursor: true });
        let checkoutTxt = this.add.text(0, 250, "THANH TOÁN", { font: 'bold 20px Arial', fill: '#fff' }).setOrigin(0.5);
        
        checkoutBtn.on('pointerdown', () => {
            this.processCheckout();
        });

        // NÚT ĐÓNG UI CỬA HÀNG
        let closeBtn = this.add.rectangle(160, -260, 40, 40, 0xe74c3c).setInteractive({ useHandCursor: true });
        let closeTxt = this.add.text(160, -260, "X", { font: 'bold 20px Arial', fill: '#fff' }).setOrigin(0.5);
        closeBtn.on('pointerdown', () => {
            this.shopUI.setVisible(false);
        });

        this.shopUI.add([checkoutBtn, checkoutTxt, closeBtn, closeTxt]);
    }

    updateCartTotal() {
        let total = 0;
        for (let key in this.cart) {
            total += this.cart[key] * this.shopPrices[key];
        }
        this.totalCost = total; // Lưu lại để dùng khi thanh toán
        this.totalCostText.setText(`Tổng: ${total} Vàng`);
    }

    processCheckout() {
        if (this.totalCost === 0) return; // Giỏ hàng trống

        if (this.gold >= this.totalCost) {
            // Trừ tiền
            this.gold -= this.totalCost;
            localStorage.setItem('hotpot_gold', this.gold.toString());
            this.goldText.setText(`🪙 ${this.gold}`);

            // Chuyển hàng từ Giỏ vào Kho Bếp
            for (let key in this.cart) {
                this.inventory[key] += this.cart[key];
                this.cart[key] = 0; // Reset giỏ
                this.cartTexts[key].setText("0"); // Reset UI
            }

            // Cập nhật lại Text Kho hàng HUD
            this.updateInventoryHUD();
            this.updateCartTotal(); // Reset tổng tiền

            // Tắt UI
            this.shopUI.setVisible(false);

            // Bắn chữ tốn tiền
            console.log(`Đã mua hàng thành công! Tốn ${this.totalCost} Vàng.`);
        } else {
            // Không đủ tiền: Lắc nhẹ Camera cảnh báo
            this.cameras.main.shake(100, 0.005);
            console.log("Không đủ tiền!");
        }
    }

}