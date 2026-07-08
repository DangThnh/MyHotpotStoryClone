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
        
        this.tables.forEach(tableData => {
            // Đặt alpha 0.001 để tàng hình
            let tableSprite = this.add.image(tableData.x, tableData.y, 'white_box')
                .setDisplaySize(160, 100).setAlpha(0.001).setDepth(100).setInteractive({ useHandCursor: true });
            
            let statusText = this.add.text(tableData.x, tableData.y, tableData.isLocked ? `🔒 ${tableData.unlockPrice}` : tableData.status, { 
                font: 'bold 22px Arial', fill: '#fff', stroke: '#000', strokeThickness: 4 
            }).setOrigin(0.5).setDepth(50);

            this.tableSprites[tableData.id] = { bg: tableSprite, text: statusText };

            // BẮT SỰ KIỆN TƯƠNG TÁC TAY VÀO BÀN ĂN
            tableSprite.on('pointerup', () => {
                // NẾU ĐANG VUỐT MÀN HÌNH THÌ KHÔNG TÍNH LÀ CLICK BÀN
                if (this.isDragging) return;

                if (tableData.isLocked) {
                    this.cameras.main.shake(100, 0.005);
                    return;
                }

                // TÌM KHÁCH HÀNG ĐANG NGỒI Ở BÀN NÀY
                let seatedCustomer = this.customers.find(c => c.assignedTableId === tableData.id);
                if (!seatedCustomer) return;

                // CÁC TRẠNG THÁI BẤM VÀO BÀN
                if (seatedCustomer.state === 'SIT_ORDERING') {
                    // 1. NHẬN ORDER
                    seatedCustomer.state = 'WAITING_FOR_FOOD';

                    //seatedCustomer.state = 'ORDER_TAKEN';
                    if (seatedCustomer.bubbleTxt) {
                        seatedCustomer.bubbleTxt.setText('⏳ Đang nấu...');
                        seatedCustomer.bubbleBg.setFillStyle(0xf1c40f);
                    }
                    this.pendingOrders.push({
                        customerRef: seatedCustomer,
                        recipe: seatedCustomer.order.req 
                    });
                    
                    // Update chữ trên Nút Nồi Lẩu trong Bếp
                    if (this.orderCountTxt) this.orderCountTxt.setText(`Đơn đang chờ: ${this.pendingOrders.length}`);

                } else if (seatedCustomer.state === 'FOOD_READY') {
                    // 2. BƯNG ĐỒ ĂN LÊN BÀN
                    this.serveFoodToCustomer(seatedCustomer);
                } 
                // Phần Dọn dẹp bàn (DONE_EATING) ta sẽ làm ở Tác vụ 4.4 sau
            });
    

            // ... (Khai báo tableSprite và statusText giữ nguyên)

            // BẮT SỰ KIỆN TƯƠNG TÁC TAY VÀO BÀN ĂN
            tableSprite.on('pointerdown', () => {
                // Chỉ xử lý nếu Camera không đang bị lướt (Tránh bấm nhầm khi đang vuốt màn hình)
                if (this.isDragging) return;

                // Cảnh báo nếu bàn đang bị khóa chưa mua
                if (tableData.isLocked) {
                    this.cameras.main.shake(100, 0.005);
                    console.log(`Cần ${tableData.unlockPrice} Vàng để mở bàn này!`);
                    return;
                }

                // 1. TÌM KHÁCH HÀNG ĐANG NGỒI Ở BÀN NÀY (NẾU CÓ)
                let seatedCustomer = this.customers.find(c => c.assignedTableId === tableData.id);

                if (!seatedCustomer) return; // Bàn trống thì bấm không có tác dụng

                // 2. XỬ LÝ THEO TỪNG TRẠNG THÁI CỦA KHÁCH
                if (seatedCustomer.state === 'SIT_ORDERING') {
                    // Trạng thái 1: Khách đang giơ Menu đòi ăn -> Bấm vào để NHẬN ORDER
                    seatedCustomer.state = 'ORDER_TAKEN';
                    
                    // Đổi hình bong bóng thành icon Đồng hồ cát (Chờ nấu)
                    if (seatedCustomer.bubbleTxt) {
                        seatedCustomer.bubbleTxt.setText('⏳ Đang nấu...');
                        seatedCustomer.bubbleBg.setFillStyle(0xf1c40f); // Đổi màu nền bong bóng sang Vàng
                    }

                    // Đẩy Order này vào mảng chờ của Bếp (Sẽ tạo ở Tác vụ 4.3)
                    this.pendingOrders.push({
                        customerRef: seatedCustomer,
                        recipe: seatedCustomer.order.req // { chili: 1, beef: 2... }
                    });

                    this.orderCountTxt.setText(`Đơn đang chờ: ${this.pendingOrders.length}`);

                } else if (seatedCustomer.state === 'FOOD_READY') {
                    // Trạng thái 2: Bếp đã nấu xong đồ -> Bấm vào để PHỤC VỤ (BƯNG LÊN MẶT BÀN)
                    this.serveFoodToCustomer(seatedCustomer);

                } else if (seatedCustomer.state === 'DONE_EATING') {
                    // Trạng thái 3: Khách ăn xong để lại tiền -> Bấm vào để DỌN BÀN
                    this.cleanTableAndCollectMoney(seatedCustomer, tableData);
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

        // 1. NÚT: NỒI LẨU KHỔNG LỒ (Bấm để Nấu ăn)
        let stoveBtn = this.add.rectangle(270, 500, 250, 150, 0xe74c3c).setInteractive({ useHandCursor: true });
        this.add.text(270, 500, "🍲 NẤU LẨU", { font: 'bold 30px Arial', fill: '#fff' }).setOrigin(0.5);
        
        // Text hiển thị số đơn hàng đang chờ nấu
        this.orderCountTxt = this.add.text(270, 600, "Đơn đang chờ: 0", { font: '18px Arial', fill: '#fff' }).setOrigin(0.5);

        stoveBtn.on('pointerdown', () => {
            if (this.isDragging) return;

            // KIỂM TRA NÚT THẮT 1: BỒN RỬA ĐẦY CHÉN BẨN?
            if (this.dirtyDishes >= 5) {
                this.cameras.main.shake(200, 0.01);
                console.log("HẾT ĐĨA SẠCH! Phải rửa chén ngay!");
                return;
            }

            // KIỂM TRA NÚT THẮT 2: CÓ ĐƠN HÀNG NÀO KHÔNG?
            if (this.pendingOrders.length === 0) {
                console.log("Bếp đang rảnh rỗi!");
                return;
            }

            // Lấy Order cũ nhất ra nấu (FIFO - First In First Out)
            let currentOrder = this.pendingOrders[0];
            let req = currentOrder.recipe; // Yêu cầu nguyên liệu: vd { chili: 1, beef: 2 }

            // KIỂM TRA NÚT THẮT 3: CÓ ĐỦ NGUYÊN LIỆU TRONG KHO KHÔNG?
            let hasEnoughItems = true;
            for (let item in req) {
                if (this.inventory[item] < req[item]) {
                    hasEnoughItems = false;
                    break;
                }
            }

            if (!hasEnoughItems) {
                this.cameras.main.shake(100, 0.005);
                console.log("THIẾU NGUYÊN LIỆU! Ra ngoài trời mua thêm đi!");
                return;
            }

            // NẾU VƯỢT QUA MỌI RÀO CẢN -> NẤU THÀNH CÔNG!
            // 1. Trừ kho
            for (let item in req) {
                this.inventory[item] -= req[item];
            }
            this.updateInventoryHUD();

            // 2. Rút Order khỏi mảng chờ
            this.pendingOrders.shift(); 
            this.orderCountTxt.setText(`Đơn đang chờ: ${this.pendingOrders.length}`);

            // 3. Đổi trạng thái khách hàng ngoài Sảnh thành "Đồ ăn đã sẵn sàng"
            currentOrder.customerRef.state = 'FOOD_READY';
            
            if (currentOrder.customerRef.bubbleTxt) {
                currentOrder.customerRef.bubbleTxt.setText('🍲 Xong! Bưng ra!');
                currentOrder.customerRef.bubbleBg.setFillStyle(0x2ecc71); // Đổi bong bóng thành xanh lá
            }

            console.log("Nấu xong 1 nồi lẩu! Mau ra Sảnh bưng cho khách!");
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
        let menu = [
            { id: 'spicy', name: '🌶️ Lẩu Cay', price: 60, req: { chili: 1, beef: 2, veggies: 1 } },
            { id: 'herbal', name: '🌿 Lẩu Nấm', price: 40, req: { herbs: 1, veggies: 2 } },
            { id: 'seafood', name: '🍤 Lẩu Hải Sản', price: 110, req: { bone: 1, seafood: 2, veggies: 1 } }
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

    serveFoodToCustomer(customer) {
        // Đồ ăn ra: Ẩn bong bóng gọi món
        if (customer.bubbleBg) {
            customer.bubbleBg.destroy();
            customer.bubbleTxt.destroy();
        }

        // Đổi màu khách sang Xanh Lá (Biểu hiện đang ăn vui vẻ)
        
        customer.state = 'EATING';

        // TẠO HOẠT ẢNH NHAI ĐỒ ĂN (Dập dềnh lên xuống)
        let eatTween = this.tweens.add({
            targets: customer,
            angle: 3,           // Nghiêng nhẹ sang phải 3 độ
            y: customer.y - 2,  // Hơi nhổm người lên 2 pixel
            yoyo: true,         // Quay lại vị trí 0
            repeat: -1,         // Lặp liên tục
            duration: 350,      // Nhịp nhai 350ms
            ease: 'Sine.easeInOut' // Chuyển động mượt mà
        });

        
            // Ăn xong ngừng dập dềnh


        // Khách ngồi ăn 5 giây (Tăng tốc để test, thực tế GDD là 15s)
        this.time.delayedCall(5000, () => {
             eatTween.stop();
              customer.setAngle(0);
            // 1. ĂN XONG TRẢ TIỀN! (Bàn VIP x2 tiền)
            let table = this.tables.find(t => t.id === customer.assignedTableId);
            let finalPrice = table.isVip ? customer.order.price * 2 : customer.order.price;
            
            this.gold += finalPrice;
            localStorage.setItem('hotpot_gold', this.gold.toString());
            this.goldText.setText(`🪙 ${this.gold}`);

            // Bay chữ Tiền Vàng
            let moneyTxt = this.add.text(customer.x, customer.y - 40, `+${finalPrice} Vàng`, { font: 'bold 18px Arial', fill: '#ffd700', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(5000);
            this.tweens.add({ targets: moneyTxt, y: moneyTxt.y - 50, alpha: 0, duration: 1500, onComplete: () => moneyTxt.destroy() });

            // 2. GIẢI PHÓNG BÀN & THU HỒI KHÁCH
            table.status = 'EMPTY'; // Bàn trống rồi, khách mới có thể vào!
            
            // Xóa khách này khỏi mảng
            this.customers = this.customers.filter(c => c !== customer);
            customer.destroy();

           // 3. GỌI KHÁCH TIẾP THEO Ở NGOÀI TRỜI VÀO
            if (this.waitingQueue.length > 0) {
                let nextCustomer = this.waitingQueue.shift(); 
                this.updateQueuePositions(); 
                
                table.status = 'OCCUPIED';
                nextCustomer.assignedTableId = table.id;
                nextCustomer.state = 'WALKING_TO_TABLE';

                // KỊCH BẢN ĐI 4 BƯỚC (Dành cho người đứng chờ)
                this.tweens.add({
                    targets: nextCustomer,
                    x: this.doorOutsideX, // Bước 1: Đi từ chỗ xếp hàng tới Cửa ngoài
                    y: this.doorOutsideY,
                    duration: 1000,
                    ease: 'Linear',
                    onComplete: () => {
                        nextCustomer.setPosition(this.doorInsideX, this.doorInsideY); // Bước 2: Teleport vào trong
                        this.tweens.add({
                            targets: nextCustomer,
                            y: table.y + 40, // Bước 3: Đi dọc hành lang giữa
                            duration: 1500,
                            ease: 'Linear',
                            onComplete: () => {
                                this.tweens.add({
                                    targets: nextCustomer,
                                    x: table.x, // Bước 4: Rẽ vào bàn
                                    duration: 800,
                                    ease: 'Linear',
                                    onComplete: () => {
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