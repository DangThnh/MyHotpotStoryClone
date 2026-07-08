class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    init() {

        // TỌA ĐỘ ĐƯỜNG ĐI TRONG SẢNH (Waypoints)
        // 1. Cánh cửa Sảnh Chính (Nơi khách xuất hiện khi bước từ ngoài vào)
        this.doorInsideX = 810;  
        this.doorInsideY = 900;  // Dưới cùng sảnh chính

        // 2. Trục Hành Lang Giữa (Khách sẽ đi thẳng theo trục này để né bàn)
        this.hallwayX = 810;

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

        // Khai báo trong hàm init()
        this.pendingOrders = [];

        // KHỞI TẠO 4 BẾP NẤU (Tọa độ X, Y giả định nằm rải rác bên khu Bếp trái)
        this.stoves = [
            { id: 0, x: 150, y: 270, status: 'IDLE', currentOrder: null },
            { id: 1, x: 390, y: 270, status: 'IDLE', currentOrder: null },
            { id: 2, x: 150, y: 440, status: 'IDLE', currentOrder: null },
            { id: 3, x: 390, y: 440, status: 'IDLE', currentOrder: null }
        ];

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
        // 3. ẨN CÁC KHỐI BÀN ẢO VÀ NHẬN CLICK
        // ==========================================
        this.tableSprites = {}; 
        
       // =======================================================
        // 3. ẨN CÁC KHỐI BÀN ẢO VÀ NHẬN CLICK (ĐÃ DỌN SẠCH & ĐỒNG BỘ)
        // =======================================================
        this.tableSprites = {}; 
        
        this.tables.forEach(tableData => {
            // Tạo Vùng Click tàng hình nổi lên trên
            let tableSprite = this.add.image(tableData.x, tableData.y, 'white_box')
                .setDisplaySize(160, 100)
                .setAlpha(0.001)
                .setDepth(100) // Đảm bảo nổi lên trên mặt bàn
                .setInteractive({ useHandCursor: true });
            
            let statusText = this.add.text(tableData.x, tableData.y, tableData.isLocked ? `🔒 ${tableData.unlockPrice}` : tableData.status, { 
                font: 'bold 22px Arial', fill: '#fff', stroke: '#000', strokeThickness: 4 
            }).setOrigin(0.5).setDepth(50);

            this.tableSprites[tableData.id] = { bg: tableSprite, text: statusText };

            // CHỈ SỬ DỤNG DUY NHẤT 1 SỰ KIỆN POINTERUP ĐỒNG BỘ
            tableSprite.on('pointerup', () => {
                if (this.isDragging) return;

                if (tableData.isLocked) {
                    this.cameras.main.shake(100, 0.005);
                    return;
                }

                let seatedCustomer = this.customers.find(c => c.assignedTableId === tableData.id);
                if (!seatedCustomer) return;

                // KHÁCH ĐANG ĐỢI GỌI MÓN -> NHẬN ORDER
                if (seatedCustomer.state === 'SIT_ORDERING') {
                    seatedCustomer.state = 'WAITING_FOR_FOOD'; 
                    
                    if (seatedCustomer.bubbleTxt) {
                        seatedCustomer.bubbleTxt.setText('⏳ Đang nấu...');
                        seatedCustomer.bubbleBg.setFillStyle(0xf1c40f);
                    }

                    // PUSH ĐẦY ĐỦ DATA (ĐỂ BẾP ĐỌC ĐƯỢC COLOR VÀ COOKTIME)
                    this.pendingOrders.push({
                        customerRef: seatedCustomer,
                        recipe: seatedCustomer.order.req,
                        fullOrderData: seatedCustomer.order // <--- Gửi kèm cấu hình món lẩu sang cho Bếp
                    });
                    
                    this.refreshStovesIndicator(); // Báo hiệu cho Bếp nhấp nháy
                }
            });
        });


       // =================================================================
        // KHÔNG GIAN 2: NGOÀI TRỜI (Nằm tại X: 0->540, Y: -1500)
        // =================================================================
        let outX = 270;
        let outY = -1020; 

        // Vẽ ảnh nền Ngoài trời (Thay cho white_box vỉa hè)
        // Lưu ý: Cậu cần có tấm ảnh outdoor_bg dọc tỷ lệ 9:16 (540x960)
        this.add.image(0, -1500, 'outdoor_bg').setOrigin(0, 0).setDisplaySize(540, 960).setDepth(0);

        // MÔ HÌNH NHÀ HÀNG (Có gắn cửa để khách đi vào)
        // Điểm này cực kỳ quan trọng: Đây là tọa độ Cánh Cửa bên Ngoài Trời
        this.doorOutsideX = outX - 100;
        this.doorOutsideY = outY - 50;
        
        let miniRestaurant = this.add.image(this.doorOutsideX, this.doorOutsideY, 'mini_hotpot')
            .setDisplaySize(200, 200)
            .setInteractive({ useHandCursor: true });
        
        miniRestaurant.on('pointerdown', () => {
            this.cameras.main.scrollX = 540;
            this.cameras.main.scrollY = 0;
        });

        // CỬA HÀNG MUA NGUYÊN LIỆU 
        let supplyStore = this.add.image(outX + 130, outY - 50, 'mini_store')
            .setDisplaySize(180, 180)
            .setInteractive({ useHandCursor: true });

        supplyStore.on('pointerdown', () => {
            let currentCamX = this.cameras.main.scrollX + 270; 
            let currentCamY = this.cameras.main.scrollY + 480;
            this.shopUI.setPosition(currentCamX, currentCamY);
            this.shopUI.setVisible(true);
        });

        // ---> KHU VỰC HÀNG ĐỢI (Nơi khách đứng xếp hàng)
        this.add.rectangle(outX, outY + 180, 450, 150, 0x000000, 0.3);
        this.add.text(outX, outY + 180, "Ghế chờ của thực khách...", { font: 'italic 20px Arial', fill: '#ccc' }).setOrigin(0.5);


      // ==========================================
        // 4. HỆ THỐNG KÉO VUỐT CAMERA (ĐÃ FIX LỖI CLICK)
        // ==========================================
        this.isDragging = false;
        this.dragStartX = 0;
        this.camStartX = 0;

        this.input.on('pointerdown', (pointer) => {
            if (this.cameras.main.scrollY === 0) {
                this.isDragging = false; // Mới chạm vào, CHƯA TÍNH LÀ VUỐT
                this.dragStartX = pointer.x;
                this.camStartX = this.cameras.main.scrollX;
            }
        });

        this.input.on('pointermove', (pointer) => {
            if (pointer.isDown && this.cameras.main.scrollY === 0) {
                // CHÌ TÍNH LÀ VUỐT NẾU NGÓN TAY DI CHUYỂN HƠN 5 PIXEL
                if (Math.abs(pointer.x - this.dragStartX) > 5) {
                    this.isDragging = true; 
                    let deltaX = this.dragStartX - pointer.x;
                    this.cameras.main.scrollX = this.camStartX + deltaX;
                }
            }
        });

        this.input.on('pointerup', () => {
            // Khi nhấc tay lên, delay 50ms rồi mới reset cờ dragging để tránh click nhầm
            this.time.delayedCall(50, () => { this.isDragging = false; });
        });
        
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

// ==========================================
        // GIAI ĐOẠN 3: KHỞI TẠO MÁY TRẠNG THÁI KHÁCH HÀNG
        // ==========================================
        this.customers = []; // Mảng chứa tất cả khách đang có mặt
        this.waitingQueue = []; // Mảng chứa khách đang đứng chờ ngoài trời

        // Vị trí xếp hàng ngoài trời (Tọa độ X thay đổi dần để xếp hàng dọc)
        this.queueStartX = 270; 
        this.queueStartY = -840; 

        // Khởi động Timer Đẻ Khách: Mỗi 5 - 8 giây đẻ 1 tốp khách (1 tốp = 1 Container hình người)
        this.time.addEvent({
            delay: 6000,
            callback: this.spawnCustomer,
            callbackScope: this,
            loop: true
        });

        // =================================================================
        // KHU VỰC BẾP (BÊN TRÁI MÀN HÌNH: X=270)
        // =================================================================

        // =================================================================
        // KHU VỰC BẾP: 4 TRẠM NẤU ĂN ĐỘC LẬP
        // =================================================================
        this.stoveVisuals = []; // Lưu trữ đồ họa của 4 bếp để dễ cập nhật

        this.stoves.forEach((stove, index) => {
            // 1. Vùng Click tàng hình đè lên mặt bàn bếp trong ảnh nền
            let zone = this.add.image(stove.x, stove.y, 'white_box').setDisplaySize(120, 100).setAlpha(0.001).setInteractive({ useHandCursor: true });
            
            // 2. Vòng tròn nhấp nháy (Chỉ hiện khi Bếp rảnh & Có đơn chờ)
            let blinkCircle = this.add.circle(stove.x, stove.y, 50).setStrokeStyle(4, 0xf1c40f).setAlpha(0).setDepth(10);
            this.tweens.add({ targets: blinkCircle, alpha: 1, yoyo: true, repeat: -1, duration: 500 }); // Chạy nhấp nháy sẵn, ta sẽ ẩn/hiện nó bằng code
            blinkCircle.setVisible(false);

            // 3. Hình ảnh Nồi Lẩu (Ban đầu tàng hình)
              let pot = this.add.sprite(stove.x, stove.y - 10, 'pot_spicy')
                .setDisplaySize(70, 50) // Kích thước hiển thị nồi lẩu trên bếp
                .setDepth(15)
                .setVisible(false);

            // 4. Thanh Loading Nấu ăn (Ban đầu tàng hình)
            let loadBg = this.add.rectangle(stove.x, stove.y - 50, 80, 10, 0x000).setDepth(20).setVisible(false);
            let loadFill = this.add.rectangle(stove.x - 40, stove.y - 50, 0, 10, 0x2ecc71).setOrigin(0, 0.5).setDepth(21).setVisible(false);

            // 5. Bong bóng "Phục vụ" (Khi nấu xong)
            let serveBubble = this.add.text(stove.x, stove.y - 70, "🛎️ BƯNG RA", { font: 'bold 16px Arial', fill: '#000', backgroundColor: '#fff', padding: 5 }).setOrigin(0.5).setDepth(25).setVisible(false);

            this.stoveVisuals.push({ zone, blinkCircle, pot, loadBg, loadFill, serveBubble });

            // BẮT SỰ KIỆN CLICK VÀO BẾP NÀY
            zone.on('pointerup', () => {
                if (this.isDragging) return;
                this.handleStoveClick(index); // Gọi hàm xử lý logic Bếp
            });
        });

       

        // 2. NÚT: BỒN RỬA CHÉN (Bấm để rửa bát thủ công)
        let sinkBtn = this.add.rectangle(270, 750, 200, 100, 0x3498db).setInteractive({ useHandCursor: true });
        this.add.text(270, 750, "🚰 RỬA BÁT", { font: 'bold 24px Arial', fill: '#fff' }).setOrigin(0.5);

        this.dirtyDishTxt = this.add.text(270, 830, "Bát bẩn: 0/5", { font: '18px Arial', fill: '#fff' }).setOrigin(0.5);

        sinkBtn.on('pointerdown', () => {
            if (this.isDragging) return;

            if (this.dirtyDishes > 0) {
                this.dirtyDishes--; // Mỗi click rửa 1 cái bát
                this.dirtyDishTxt.setText(`Bát bẩn: ${this.dirtyDishes}/5`);
            }
        });

    }

    update() {
        // Game quản lý dùng Event Driven, update() sẽ rất ít code
    }

    refreshStovesIndicator() {
        // Cập nhật vòng tròn nhấp nháy: Chỉ bật khi Bếp đang IDLE VÀ có Đơn hàng đang chờ
        let hasPendingOrders = this.pendingOrders.length > 0;
        this.stoves.forEach((stove, index) => {
            let vis = this.stoveVisuals[index];
            if (stove.status === 'IDLE' && hasPendingOrders) {
                vis.blinkCircle.setVisible(true); // Gợi ý người chơi bấm vào đây để nấu!
            } else {
                vis.blinkCircle.setVisible(false);
            }
        });
    }

    handleStoveClick(index) {
        let stove = this.stoves[index];
        let vis = this.stoveVisuals[index];

        // KIỂM TRA NÚT THẮT 1: BỒN RỬA ĐẦY CHÉN BẨN? (Giữ nguyên logic cũ)
        if (this.dirtyDishes >= 5) {
            this.cameras.main.shake(200, 0.01);
            console.log("HẾT ĐĨA SẠCH! Phải rửa chén ngay!");
            return;
        }

        if (stove.status === 'IDLE' && this.pendingOrders.length > 0) {
            // ==============================================
            // BẮT ĐẦU NẤU AĂN
            // ==============================================
            let currentOrder = this.pendingOrders[0];
            let req = currentOrder.recipe; 
            
            // Ktra nguyên liệu
            let hasEnoughItems = true;
            for (let item in req) { if (this.inventory[item] < req[item]) hasEnoughItems = false; }

            if (!hasEnoughItems) {
                this.cameras.main.shake(100, 0.005);
                console.log("THIẾU NGUYÊN LIỆU!");
                return;
            }

            // ĐỦ ĐỒ -> TRỪ KHO VÀ ĐƯA ĐƠN VÀO BẾP
            for (let item in req) { this.inventory[item] -= req[item]; }
            this.updateInventoryHUD();
            
            stove.currentOrder = this.pendingOrders.shift(); // Lấy đơn khỏi hàng chờ
            stove.status = 'COOKING';
            this.refreshStovesIndicator(); // Tắt vòng nhấp nháy ở bếp này

            // CẬP NHẬT GIAO DIỆN BẾP
            vis.blinkCircle.setVisible(false);

             let tex = currentOrder.fullOrderData.textureKey;
            if (this.textures.exists(tex)) {
                vis.pot.setTexture(tex);
                vis.pot.clearTint();
            } else {
                vis.pot.setTexture('white_box'); // Dùng khối trắng nhuộm màu đỏ dự phòng nếu chưa có ảnh
                vis.pot.setTint(0xe74c3c);
            }
            vis.pot.setVisible(true);

            vis.loadBg.setVisible(true);
            vis.loadFill.setVisible(true).width = 0; // Reset thanh bar

            // Hoạt ảnh Nồi lẩu rung lắc dập dềnh
            let boilTween = this.tweens.add({ targets: vis.pot, y: stove.y - 15, yoyo: true, repeat: -1, duration: 150 });

            // Tween chạy thanh Loading theo thời gian món ăn
            this.tweens.add({
                targets: vis.loadFill,
                width: 80, // Đổ đầy thanh bar
                duration: currentOrder.fullOrderData.cookTime,
                onComplete: () => {
                    // NẤU XONG!
                    boilTween.stop();
                    vis.pot.y = stove.y - 10; // Trả nồi về chỗ cũ
                    vis.loadBg.setVisible(false);
                    vis.loadFill.setVisible(false);
                    
                    vis.serveBubble.setVisible(true); // Bật bong bóng "BƯNG RA"
                    stove.status = 'READY_TO_SERVE';
                }
            });

        } else if (stove.status === 'READY_TO_SERVE') {
            // ==============================================
            // BƯNG ĐỒ ĂN RA CHO KHÁCH (CLICK LẦN 2)
            // ==============================================
            // Reset Bếp về trạng thái rảnh
            stove.status = 'IDLE';
            vis.pot.setVisible(false);
            vis.serveBubble.setVisible(false);
            this.refreshStovesIndicator(); // Bật lại vòng nhấp nháy nếu còn đơn chờ

           // Truyền Key Ảnh Nồi lẩu thực tế sang cho bàn ăn của khách
            this.serveFoodToCustomer(stove.currentOrder.customerRef, stove.currentOrder.fullOrderData.textureKey);
        }
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

   spawnCustomer() {
        if (this.waitingQueue.length >= 5) return;

        // 1. CHỌN NGẪU NHIÊN BỘ ẢNH KHÁCH HÀNG
        let custType = Phaser.Math.Between(1, 2) === 1 ? 'cust1' : 'cust2';
        
        // Mặc định đẻ ra là đứng nhìn xuống (_down)
        let customer = this.add.sprite(this.queueStartX, this.queueStartY, `${custType}_down`)
            .setDisplaySize(50, 80)
            .setDepth(4000);
        
        customer.custType = custType; // Lưu lại bộ ảnh để đổi sau này
        customer.state = 'SPAWN'; 
        customer.assignedTableId = null; 
        this.customers.push(customer);

        let emptyTable = this.tables.find(t => t.status === 'EMPTY');

        if (emptyTable) {
            emptyTable.status = 'OCCUPIED';
            customer.assignedTableId = emptyTable.id;
            customer.state = 'WALKING_TO_TABLE';

            // ==========================================
            // KỊCH BẢN ĐI 4 BƯỚC CÓ ĐỔI HƯỚNG VÀ NGỒI
            // ==========================================
            
            // BƯỚC 1: Xếp hàng xong rẽ phải đi đến cửa Ngoài trời
            customer.setTexture(`${customer.custType}_side`); 
            customer.setFlipX(false); // Mặt quay sang phải

            this.tweens.add({
                targets: customer,
                x: this.doorOutsideX,
                y: this.doorOutsideY,
                duration: 1000,
                ease: 'Linear',
                onComplete: () => {
                    // BƯỚC 2: Bước qua Cửa (Teleport vào trong)
                    customer.setPosition(this.doorInsideX, this.doorInsideY);

                    // BƯỚC 3: Đi thẳng dọc Hành lang giữa (Mặt hướng lên/xuống)
                    customer.setTexture(`${customer.custType}_down`); 

                    this.tweens.add({
                        targets: customer,
                        y: emptyTable.y + 40,
                        duration: 1500,
                        ease: 'Linear',
                        onComplete: () => {
                            // BƯỚC 4: Rẽ ngang vào bàn ăn
                            customer.setTexture(`${customer.custType}_side`); 
                            
                            // Nếu bàn nằm bên TRÁI hành lang -> Lật mặt sang Trái
                            if (emptyTable.x < this.hallwayX) {
                                customer.setFlipX(true); 
                            } else {
                                customer.setFlipX(false); // Bàn bên Phải -> Quay sang Phải
                            }

                            this.tweens.add({
                                targets: customer,
                                x: emptyTable.x,
                                duration: 800,
                                ease: 'Linear',
                                onComplete: () => {
                                    // ==========================================
                                    // BƯỚC 5: ĐÃ ĐẾN BÀN! CHUYỂN SANG ẢNH NGỒI
                                    // ==========================================
                                    customer.setTexture(`${customer.custType}_sit`);
                                    
                                    // Lật lại ảnh gốc vì mặt ghế xoay cố định
                                    customer.setFlipX(false); 
                                    
                                    // Nâng khách lên một chút cho khớp với mặt ghế (Tùy chỉnh Y)
                                    customer.y -= 15; 
                                    
                                    customer.state = 'SIT_ORDERING'; 
                                    this.showOrderBubble(customer); 
                                }
                            });
                        }
                    });
                }
            });

        } else {
            // HẾT BÀN: Cho vào mảng Đợi và xếp hàng ngoài trời
            customer.setTexture(`${customer.custType}_down`); // Đứng xếp hàng nhìn xuống
            customer.state = 'WAITING_OUTSIDE';
            this.waitingQueue.push(customer);
            this.updateQueuePositions(); 
        }
    }

    showOrderBubble(customer) {
        // Bảng Menu (Theo GDD)
     // Cập nhật thực đơn gán kèm Texture Key của ảnh
        let menu = [
            { id: 'spicy', name: '🌶️ Lẩu Cay', price: 60, cookTime: 4000, textureKey: 'pot_spicy', req: { chili: 1, beef: 2, veggies: 1 } },
            { id: 'herbal', name: '🌿 Lẩu Nấm', price: 40, cookTime: 3000, textureKey: 'pot_herbal', req: { herbs: 1, veggies: 2 } },
            { id: 'seafood', name: '🍤 Lẩu Hải Sản', price: 110, cookTime: 6000, textureKey: 'pot_seafood', req: { bone: 1, seafood: 2, veggies: 1 } }
        ];

        // Khách chọn ngẫu nhiên 1 món
        let chosenDish = Phaser.Utils.Array.GetRandom(menu);
        customer.order = chosenDish;

        // Vẽ Bong Bóng chat hiện lên đầu khách
        customer.bubbleBg = this.add.rectangle(customer.x, customer.y - 50, 100, 30, 0xffffff).setStrokeStyle(2, 0x000).setDepth(4001);
        customer.bubbleTxt = this.add.text(customer.x, customer.y - 50, chosenDish.name, { font: 'bold 12px Arial', fill: '#000' }).setOrigin(0.5).setDepth(4002);

        // Chuyển trạng thái sang Đang Chờ Phục Vụ
        // customer.state = 'WAITING_FOR_FOOD';

        // Đẩy yêu cầu món ăn này vào Hàng Đợi (Job Queue) để Tí nữa Nhân Viên Bếp nấu! (Sẽ làm ở GĐ 4)
        // Hiện tại tạm thời tự động phục vụ sau 3 giây để test loop Khách Hàng.
        // this.time.delayedCall(3000, () => {
        //     this.serveFoodToCustomer(customer);
        // });
    }

   serveFoodToCustomer(customer, potTextureKey) {
        if (customer.bubbleBg) {
            customer.bubbleBg.destroy();
            customer.bubbleTxt.destroy();
        }
        
        customer.state = 'EATING';

        // 1. TÌM BÀN ĂN CỦA KHÁCH
        let table = this.tables.find(t => t.id === customer.assignedTableId);

        // =======================================================
        // CHỖ CĂN CHỈNH TỌA ĐỘ NỒI LẨU TRÊN MẶT BÀN (OFFSET COORDS)
        // =======================================================
        // Nếu muốn nồi lẩu xê dịch so với tâm cái bàn, cậu chỉnh 2 con số này:
        let hotpotOffsetX = 0;   // Dịch sang phải (+) hoặc sang trái (-)
        let hotpotOffsetY = -15; // Dịch lên trên (-) hoặc xuống dưới (+)
        // =======================================================

        let potX = table.x + hotpotOffsetX;
        let potY = table.y + hotpotOffsetY;

        // 2. VẼ NỒI LẨU ẢNH THẬT LÊN MẶT BÀN
        let tablePot;
        if (this.textures.exists(potTextureKey)) {
            tablePot = this.add.sprite(potX, potY, potTextureKey)
                .setDisplaySize(60, 40) // Kích thước nồi lẩu đặt trên bàn ăn
                .setDepth(15);
        } else {
            tablePot = this.add.rectangle(potX, potY, 40, 25, 0xe74c3c)
                .setStrokeStyle(2, 0x000)
                .setDepth(15); // Fallback hình chữ nhật đỏ
        }

        // TẠO HOẠT ẢNH ĂN LẮC LƯ (Giữ nguyên)
        let eatTween = this.tweens.add({
            targets: customer,
            angle: 3,           
            y: customer.y - 2,  
            yoyo: true,         
            repeat: -1,         
            duration: 350,      
            ease: 'Sine.easeInOut' 
        });

        // Khách ngồi ăn 5 giây
        this.time.delayedCall(5000, () => {
            eatTween.stop(); 
            customer.setAngle(0); 
            
            // Xóa nồi lẩu trên mặt bàn khi khách ăn xong dọn đi
            tablePot.destroy(); 
            
            // Trả tiền
            let finalPrice = table.isVip ? customer.order.price * 2 : customer.order.price;
            this.gold += finalPrice;
            localStorage.setItem('hotpot_gold', this.gold.toString());
            this.goldText.setText(`🪙 ${this.gold}`);

            let moneyTxt = this.add.text(customer.x, customer.y - 40, `+${finalPrice} Vàng`, { font: 'bold 18px Arial', fill: '#ffd700', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(5000);
            this.tweens.add({ targets: moneyTxt, y: moneyTxt.y - 50, alpha: 0, duration: 1500, onComplete: () => moneyTxt.destroy() });

            // GIẢI PHÓNG BÀN & THU HỒI KHÁCH
            table.status = 'EMPTY'; 
            this.customers = this.customers.filter(c => c !== customer);
            customer.destroy();

            // GỌI KHÁCH TIẾP THEO Ở NGOÀI TRỜI VÀO (Giữ nguyên logic cũ của cậu...)
            if (this.waitingQueue.length > 0) {
                let nextCustomer = this.waitingQueue.shift(); 
                this.updateQueuePositions(); 
                
                table.status = 'OCCUPIED';
                nextCustomer.assignedTableId = table.id;
                nextCustomer.state = 'WALKING_TO_TABLE';

                this.tweens.add({
                    targets: nextCustomer,
                    x: this.doorOutsideX, 
                    y: this.doorOutsideY,
                    duration: 1000,
                    ease: 'Linear',
                    onComplete: () => {
                        nextCustomer.setPosition(this.doorInsideX, this.doorInsideY); 
                        this.tweens.add({
                            targets: nextCustomer,
                            y: table.y + 40, 
                            duration: 1500,
                            ease: 'Linear',
                            onComplete: () => {
                                this.tweens.add({
                                    targets: nextCustomer,
                                    x: table.x, 
                                    duration: 800,
                                    ease: 'Linear',
                                    onComplete: () => {
                                        nextCustomer.setTexture(`${nextCustomer.custType}_sit`);
                                        nextCustomer.setFlipX(false);
                                        nextCustomer.y -= 15;
                                        nextCustomer.state = 'SIT_ORDERING';
                                        this.showOrderBubble(nextCustomer);
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    }

    updateQueuePositions() {
        // Xếp các khách đang đợi thành hàng ngũ ngoài đường
        this.waitingQueue.forEach((cust, index) => {
            let targetX = this.queueStartX + (index * 45) - 90; // Dàn hàng ngang ra
            this.tweens.add({
                targets: cust,
                x: targetX,
                y: this.queueStartY,
                duration: 500,
                ease: 'Power1'
            });
        });
    }

}