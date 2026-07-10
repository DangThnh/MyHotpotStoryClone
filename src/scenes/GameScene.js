class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    init(data) {
        // TỌA ĐỘ ĐƯỜNG ĐI TRONG SẢNH (Waypoints)
        // 1. Cánh cửa Sảnh Chính (Nơi khách xuất hiện khi bước từ ngoài vào)
        this.doorInsideX = 810;  
        this.doorInsideY = 900;  // Dưới cùng sảnh chính

        // 2. Trục Hành Lang Giữa (Khách sẽ đi thẳng theo trục này để né bàn)
        this.hallwayX = 810;

        // =======================================================
        // 1. TỰ ĐỘNG KHỞI TẠO & TẢI KHO NGUYÊN LIỆU (PERSISTENT INVENTORY)
        // =======================================================
        let savedInventory = localStorage.getItem('hotpot_inventory');
        if (savedInventory === null) {
            // Nếu mới chơi: Cho đúng hệt số lượng ban đầu cậu quy định
            this.inventory = {
                chili: 5,     // Ớt (Nước cốt)
                herbs: 5,     // Thảo mộc
                bone: 5,      // Xương ống
                beef: 10,     // Thịt bò (Đồ nhúng)
                veggies: 10,  // Rau
                seafood: 5    // Hải sản
            };
            localStorage.setItem('hotpot_inventory', JSON.stringify(this.inventory));
        } else {
            this.inventory = JSON.parse(savedInventory);
        }

        this.dirtyDishes = 0; // Bồn rửa chén

        // =======================================================
        // 2. KHAI BÁO BẢN ĐỒ BÀN ĂN (GIỮ 100% CẤU TRÚC ĐÃ CĂN CHỈNH)
        // =======================================================
        this.tables = [
            // SẢNH CHÍNH
            { id: 1, x: 700, y: 350, status: 'EMPTY', isLocked: false, isVip: false, unlockPrice: 0, seatOffsetX: 0, seatOffsetY: -30, path: [
                    { x: 810, y: 300, dir: 'down', flipX: false }, // Mốc 1: Đi dọc hành lang giữa lên Y=375
                    { x: 700, y: 300, dir: 'side', flipX: false }   // Mốc 2: Rẽ trái bò vào ghế bàn 1
                ] },
            { id: 2, x: 920, y: 350, status: 'LOCKED', isLocked: true, isVip: false, unlockPrice: 200, seatOffsetX: 0, seatOffsetY: -30,
                 path: [
                    { x: 810, y: 300, dir: 'down', flipX: false }, // Mốc 1: Đi dọc hành lang giữa lên Y=375
                    { x: 920, y: 300, dir: 'side', flipX: true }   // Mốc 2: Rẽ trái bò vào ghế bàn 1
                ]
             },
            { id: 3, x: 700, y: 650, status: 'LOCKED', isLocked: true, isVip: false, unlockPrice: 500, seatOffsetX: 0, seatOffsetY: -30,
                 path: [
                    { x: 810, y: 625, dir: 'down', flipX: false }, // Mốc 1: Đi dọc hành lang giữa lên Y=375
                    { x: 700, y: 625, dir: 'side', flipX: false }   // Mốc 2: Rẽ trái bò vào ghế bàn 1
                ]
             },
            { id: 4, x: 920, y: 650, status: 'LOCKED', isLocked: true, isVip: false, unlockPrice: 1000, seatOffsetX: 0, seatOffsetY: -30,
                 path: [
                    { x: 810, y: 625, dir: 'down', flipX: false }, // Mốc 1: Đi dọc hành lang giữa lên Y=375
                    { x: 920, y: 625, dir: 'side', flipX: true }   // Mốc 2: Rẽ trái bò vào ghế bàn 1
                ]
             },
            
            // PHÒNG VIP
            {  id: 5, x: 1250, y: 400, status: 'LOCKED', isLocked: true, isVip: true, unlockPrice: 2000, seatOffsetX: 0, seatOffsetY: 25,
                path: [
                    { x: 810, y: 700, dir: 'down', flipX: false },  // Mốc 1: Đi lên ngã rẽ phòng VIP (Y=550)
                    { x: 1350, y: 700, dir: 'side', flipX: true }, // Mốc 2: Rẽ phải chui qua Cửa phòng VIP (X=1120)
                    { x: 1350, y: 300, dir: 'down', flipX: false }, // Mốc 3: Đi dọc hành lang trong phòng VIP lên Y=425
                    { x: 1230, y: 300, dir: 'side', flipX: false }  // Mốc 4: Rẽ phải ngồi vào ghế bàn VIP 5
                ]
            },
            { id: 6, x: 1450, y: 400, status: 'LOCKED', isLocked: true, isVip: true, unlockPrice: 4000, seatOffsetX: 0, seatOffsetY: 25,
                path: [
                    { x: 810, y: 700, dir: 'down', flipX: false },  // Mốc 1: Đi lên ngã rẽ phòng VIP (Y=550)
                    { x: 1350, y: 700, dir: 'side', flipX: true }, // Mốc 2: Rẽ phải chui qua Cửa phòng VIP (X=1120)
                    { x: 1350, y: 300, dir: 'down', flipX: false }, // Mốc 3: Đi dọc hành lang trong phòng VIP lên Y=425
                    { x: 1470, y: 300, dir: 'side', flipX: true }  // Mốc 4: Rẽ phải ngồi vào ghế bàn VIP 5
                ]
             }
        ];

        // =======================================================
        // 2.5. ĐỒNG BỘ TRẠNG THÁI KHÓA/MỞ BÀN TỪ LOCALSTORAGE
        // =======================================================
        let savedUnlockedTables = localStorage.getItem('hotpot_unlocked_tables');
        let unlockedTableIds = [1]; // Bàn 1 luôn mở mặc định

        if (savedUnlockedTables === null) {
            localStorage.setItem('hotpot_unlocked_tables', JSON.stringify(unlockedTableIds));
        } else {
            unlockedTableIds = JSON.parse(savedUnlockedTables);
        }

        // Ép trạng thái đã mở khóa lên bàn ăn thực tế
        this.tables.forEach(table => {
            if (unlockedTableIds.includes(table.id)) {
                table.isLocked = false;
                table.status = 'EMPTY';
            } else {
                table.isLocked = true;
                table.status = 'LOCKED';
            }
        });

        // ==========================================
        // 3. DATA: DÒNG TIỀN & BẢNG GIÁ CỬA HÀNG
        // ==========================================
        this.gold = parseInt(localStorage.getItem('hotpot_gold')) || 500; 

        this.shopPrices = {
            chili: 5,     // Ớt
            herbs: 5,     // Thảo mộc
            bone: 8,      // Xương ống
            beef: 12,     // Thịt bò
            veggies: 4,   // Rau củ
            seafood: 20   // Hải sản
        };

        this.cart = { chili: 0, herbs: 0, bone: 0, beef: 0, veggies: 0, seafood: 0 };
        this.pendingOrders = [];

        // KHỞI TẠO 4 BẾP NẤU (GIỮ NGUYÊN TỌA ĐỘ CŨ)
        this.stoves = [
            { id: 0, x: 150, y: 270, status: 'IDLE', currentOrder: null },
            { id: 1, x: 390, y: 270, status: 'IDLE', currentOrder: null },
            { id: 2, x: 150, y: 440, status: 'IDLE', currentOrder: null },
            { id: 3, x: 390, y: 440, status: 'IDLE', currentOrder: null }
        ];

        // ==========================================
        // 4. DATA: HỆ THỐNG TỰ ĐỘNG HÓA (NHÂN SỰ)
        // ==========================================
        this.staffPrices = {
            dishwasher: 2000, 
            chef: 4000,       
            waiter: 8000      
        };

        this.hasDishwasher = localStorage.getItem('hotpot_has_dishwasher') === 'true';
        this.hasChef = localStorage.getItem('hotpot_has_chef') === 'true';
        this.hasWaiter = localStorage.getItem('hotpot_has_waiter') === 'true';

        // Đọc xem người chơi đã hoàn thành hướng dẫn chưa
        this.tutorialDone = localStorage.getItem('hotpot_tutorial_done') === 'true';
        this.tutorialStep = 0; 
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
            
        this.add.text(810, 880, "🚪 RA NGOÀI", { font: 'bold 18px Arial', fill: '#fff' })
            .setOrigin(0.5)
            .setDepth(101);
        
        doorToOutside.on('pointerdown', () => {
            if (!this.tutorialDone) return;
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
            if (!this.tutorialDone) return;
                if (this.isDragging) return;

              // 1. CLICK ĐỂ MỞ KHÓA BÀN MỚI
                if (tableData.isLocked) {
                    if (this.gold >= tableData.unlockPrice) {
                        // Đủ tiền -> Trực tiếp mở khóa!
                        this.gold -= tableData.unlockPrice;
                        localStorage.setItem('hotpot_gold', this.gold.toString());
                        this.goldText.setText(`🪙 ${this.gold}`);

                        tableData.isLocked = false;
                        tableData.status = 'EMPTY';

                          let unlockedTableIds = JSON.parse(localStorage.getItem('hotpot_unlocked_tables')) || [1];
                        if (!unlockedTableIds.includes(tableData.id)) {
                            unlockedTableIds.push(tableData.id);
                            localStorage.setItem('hotpot_unlocked_tables', JSON.stringify(unlockedTableIds));
                        }

                        // Đổi màu bàn ăn sang trắng sáng (Phản hồi thị giác)
                        let normalColor = tableData.isVip ? 0xe74c3c : 0xecf0f1;
                        tableSprite.setTint(normalColor);

                        // Ẩn chữ giá tiền khóa bàn đi
                        statusText.setText('EMPTY');
                        
                        console.log(`Đã mở khóa thành công Bàn ${tableData.id}!`);
                    } else {
                        // Thiếu tiền: Rung lắc camera cảnh báo
                        this.cameras.main.shake(150, 0.005);
                        this.showNotification("Bạn không đủ tiền");
                        console.log("Không đủ Vàng để mở khóa bàn này!");
                    }
                    return;
                }

                // 2. TÌM KHÁCH ĐANG NGỒI (NẾU CÓ)
                let seatedCustomer = this.customers.find(c => c.assignedTableId === tableData.id);
                if (!seatedCustomer) return;

                // Ở đây chúng ta tạm thời để trống. 
                // Khi khách ăn xong (Trạng thái 'DONE_EATING'), người chơi sẽ click vào bàn này để dọn bát đĩa bẩn.
                // Chúng ta sẽ viết logic dọn bàn ở Giai đoạn tiếp theo.
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
        
        let miniRestaurant = this.add.image(this.doorOutsideX -25, this.doorOutsideY - 130, 'mini_hotpot')
            .setDisplaySize(200, 280)
            .setInteractive({ useHandCursor: true });
        
        miniRestaurant.on('pointerdown', () => {
            this.cameras.main.scrollX = 540;
            this.cameras.main.scrollY = 0;
        });

        // CỬA HÀNG MUA NGUYÊN LIỆU 
        let supplyStore = this.add.image(outX + 130, outY - 180, 'mini_store')
            .setDisplaySize(180, 280)
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

        // =================================================================
        // KHÔNG GIAN 3: KHU PHỐ NÂNG CẤP (Bên phải khu ngoài trời: X = 540 -> 1080)
        // =================================================================
        let upgradeOutX = 810; // Tâm của khu phố mới (540 + 270)
        let upgradeOutY = -1020;

        // Ảnh nền Khu phố Nâng Cấp (Cậu tự load 'upgrade_bg' ở BootScene nhé, tạm dùng màu)
      // Sử dụng lại ảnh 'outdoor_bg' nhưng đặt ở vị trí X = 540 (Nối tiếp với tấm thứ 1)
        this.add.image(540, -1500, 'outdoor_bg').setOrigin(0, 0).setDisplaySize(540, 960).setDepth(0);
       
        // MÔ HÌNH CỬA HÀNG NÂNG CẤP (Nhấn vào để mở UI)
        let upgradeStore;
        
        if (this.textures.exists('upgrade_store')) {
            // NẾU CÓ ẢNH THẬT -> Dùng ảnh thật
            upgradeStore = this.add.sprite(upgradeOutX, upgradeOutY-200, 'upgrade_store')
                .setDisplaySize(280, 280) // Kích thước hiển thị của tòa nhà (Chỉnh to nhỏ ở đây)
                .setInteractive({ useHandCursor: true });
        } else {
            // NẾU CHƯA LOAD ĐƯỢC ẢNH -> Trả về khối chữ nhật vàng dự phòng
            upgradeStore = this.add.image(upgradeOutX, upgradeOutY, 'white_box')
                .setDisplaySize(250, 200).setTint(0xf39c12).setInteractive({ useHandCursor: true });
        }

        upgradeStore.on('pointerdown', () => {
            let currentCamX = this.cameras.main.scrollX + 270; 
            let currentCamY = this.cameras.main.scrollY + 480;
            this.upgradeUI.setPosition(currentCamX, currentCamY);
            this.upgradeUI.setVisible(true);
        });

        // ==========================================
        // MŨI TÊN CHUYỂN CẢNH (Qua lại giữa 2 khu ngoài trời)
        // ==========================================
        // 1. Mũi tên Phải (Ở khu Tiệm lẩu, trỏ sang Cty Nhân Sự)
        let arrowRight = this.add.text(outX + 220, outY, "▶", { font: 'bold 50px Arial', fill: '#fff', backgroundColor: '#000' })
            .setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(100);
            
        arrowRight.on('pointerdown', () => {
            // Lướt Camera sang phải (Sang khu Nhân sự)
            this.tweens.add({ targets: this.cameras.main, scrollX: 540, duration: 300, ease: 'Sine.easeInOut' });
        });

        // 2. Mũi tên Trái (Ở Cty Nhân sự, trỏ về Tiệm Lẩu)
        let arrowLeft = this.add.text(upgradeOutX - 220, upgradeOutY, "◀", { font: 'bold 50px Arial', fill: '#fff', backgroundColor: '#000' })
            .setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(100);

        arrowLeft.on('pointerdown', () => {
            // Lướt Camera về lại khu Tiệm lẩu ban đầu
            this.tweens.add({ targets: this.cameras.main, scrollX: 0, duration: 300, ease: 'Sine.easeInOut' });
        });

      // ==========================================
        // 4. HỆ THỐNG KÉO VUỐT CAMERA (ĐÃ FIX LỖI CLICK)
        // ==========================================
        this.isDragging = false;
        this.dragStartX = 0;
        this.camStartX = 0;

        this.input.on('pointerdown', (pointer) => {
             if (!this.tutorialDone && this.tutorialStep !== 2) return;

            if (this.cameras.main.scrollY === 0) {
                this.isDragging = false; // Mới chạm vào, CHƯA TÍNH LÀ VUỐT
                this.dragStartX = pointer.x;
                this.camStartX = this.cameras.main.scrollX;
            }
        });

        this.input.on('pointermove', (pointer) => {
             if (!this.tutorialDone && this.tutorialStep !== 2) return;
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
        this.createUpgradeUI(); // Thêm dòng này
          this.createRecipeUI();

// ==========================================
        // GIAI ĐOẠN 3: KHỞI TẠO MÁY TRẠNG THÁI KHÁCH HÀNG
        // ==========================================
        this.customers = []; // Mảng chứa tất cả khách đang có mặt
        this.waitingQueue = []; // Mảng chứa khách đang đứng chờ ngoài trời

        // Vị trí xếp hàng ngoài trời (Tọa độ X thay đổi dần để xếp hàng dọc)
        this.queueStartX = 270; 
        this.queueStartY = -840; 

        // Khởi động Timer Đẻ Khách: Mỗi 5 - 8 giây đẻ 1 tốp khách (1 tốp = 1 Container hình người)
         if (this.tutorialDone) {
        this.time.addEvent({
            delay: 6000,
            callback: this.spawnCustomer,
            callbackScope: this,
            loop: true
        });
        } else {
            // Nếu chưa -> Khởi động hệ thống hướng dẫn người chơi
            this.startTutorialSystem();
        }

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

        // ==========================================
        // VẼ ĐẦU BẾP TỰ ĐỘNG (CHỈ HIỆN KHI ĐÃ MUA)
        // ==========================================
        // Tọa độ chờ (Đứng giữa phòng bếp)
        this.chefStandbyX = 270; 
        this.chefStandbyY = 480;
        
        this.chefSprite = this.add.sprite(this.chefStandbyX, this.chefStandbyY, 'chef_down')
            .setDisplaySize(45, 90)
            .setDepth(18) // Cho đứng trên bếp một chút
            .setVisible(this.hasChef);
        
        this.chefState = 'IDLE'; // Cờ trạng thái: Đang Rảnh / Đang Đi / Đang Nấu
        
        // Khởi động AI quét đơn hàng
        this.runChefAI();

        // ==========================================
        // VẼ PHỤC VỤ BÀN (CHỈ HIỆN KHI ĐÃ MUA)
        // ==========================================
        // Vị trí chờ (Đứng sát mép phải sảnh chính, gần VIP)
        this.waitressStandbyX = 810; 
        this.waitressStandbyY = 200;
        
        this.waitressSprite = this.add.sprite(this.waitressStandbyX, this.waitressStandbyY, 'waitress_down')
            .setDisplaySize(45, 90)
            .setDepth(4005) 
            .setVisible(this.hasWaiter);
        
        this.waitressState = 'IDLE'; 
        this.waitressSprite.custType = 'waitress'; // Để hàm walkCustomerPath lôi đúng ảnh waitress_side, waitress_down ra
        
        // Khởi động AI Phục vụ
        this.runWaitressAI();

       

       // =================================================================
        // KHU VỰC BỒN RỬA CHÉN THỦ CÔNG (ĐỒNG BỘ NÚT BẤM VÀ ĐỒ HỌA)
        // =================================================================
        this.sinkX = 270; // Cậu chỉ cần chỉnh tọa độ x, y duy nhất tại đây!
        this.sinkY = 105;
        this.isWashing = false; 

            // ==========================================
        this.dishwasherSprite = this.add.sprite(this.sinkX + 90, this.sinkY - 10, 'dishwasher')
            .setDisplaySize(60, 70)
            .setDepth(14)
            .setVisible(this.hasDishwasher); // Ẩn nếu chưa mua

        // Tạo một Tween Rung nhè nhẹ cho Máy rửa bát (Chưa chạy vội)
        this.dishwasherShakeTween = this.tweens.add({
            targets: this.dishwasherSprite,
            x: this.dishwasherSprite.x + 2,
            yoyo: true,
            repeat: -1,
            duration: 50,
            paused: true // Đóng băng, chỉ chạy khi có bát bẩn
        });

        // Bắt đầu vòng lặp AI tự động kiểm tra và rửa bát
        this.runDishwasherAI();

        // 1. Sprite bát đĩa bẩn (Hợp nhất Đồ họa và Nút bấm bằng cách setInteractive)
        this.dirtyDishesSprite = this.add.sprite(this.sinkX, this.sinkY - 10, 'sink_dirty')
            .setDisplaySize(190,155) // Tự do đổi kích thước ảnh, vùng click sẽ tự co dãn theo!
            .setDepth(15)
            .setInteractive({ useHandCursor: true }) // <--- BIẾN ẢNH BÁT BẨN THÀNH NÚT BẤM
            .setVisible(false);

        // 2. Thanh Loading Rửa Bát (Tọa độ tự động ăn theo sinkX, sinkY)
        this.washBg = this.add.rectangle(this.sinkX, this.sinkY - 50, 80, 10, 0x000000).setDepth(20).setVisible(false);
        this.washFill = this.add.rectangle(this.sinkX - 40, this.sinkY - 50, 0, 10, 0x3498db).setOrigin(0, 0.5).setDepth(21).setVisible(false);

        // 3. Text hiển thị số bát bẩn (Tự động ăn theo sinkX, sinkY)
        this.dirtyDishTxt = this.add.text(this.sinkX, this.sinkY + 45, "Bát bẩn: 0/5", { 
            font: 'bold 14px Arial', fill: '#ff4757' 
        }).setOrigin(0.5).setDepth(22);

        // BẮT SỰ KIỆN CLICK TRỰC TIẾP LÊN ẢNH BÁT ĐĨA BẨN ĐỂ RỬA CHÉN
        this.dirtyDishesSprite.on('pointerup', () => {

             if (!this.tutorialDone) return;

            if (this.isDragging || this.isWashing) return;

            if (this.dirtyDishes > 0) {
                this.isWashing = true;

                // Hiện thanh Loading
                this.washBg.setVisible(true);
                this.washFill.setVisible(true).width = 0;

                // Chạy thanh Loading rửa bát trong 2 giây (2000ms)
                this.tweens.add({
                    targets: this.washFill,
                    width: 80,
                    duration: 2000,
                    onComplete: () => {
                        this.dirtyDishes--; 
                        this.dirtyDishTxt.setText(`Bát bẩn: ${this.dirtyDishes}/5`);
                        
                        // Ẩn ảnh bát đĩa bẩn nếu đã rửa sạch hết
                        if (this.dirtyDishes === 0) {
                            this.dirtyDishesSprite.setVisible(false);
                        }

                        this.washBg.setVisible(false);
                        this.washFill.setVisible(false);
                        this.isWashing = false;

                        console.log("Đã rửa xong 1 cái bát!");
                    }
                });
            }
        });

        // sinkBtn.on('pointerdown', () => {
        //     if (this.isDragging) return;

        //     if (this.dirtyDishes > 0) {
        //         this.dirtyDishes--; // Mỗi click rửa 1 cái bát
        //         this.dirtyDishTxt.setText(`Bát bẩn: ${this.dirtyDishes}/5`);
        //     }
        // });

        // ==========================================
        // NÚT BẤM XEM DANH SÁCH CÔNG THỨC Ở BẾP (X = 270, Y = 880)
        // ==========================================
        let recipeBtn = this.add.image(270, 880, 'white_box')
            .setDisplaySize(240, 60)
            .setTint(0x27ae60)
            .setInteractive({ useHandCursor: true })
            .setDepth(100);
            
        this.add.text(270, 880, "📜 CÔNG THỨC", { font: 'bold 18px Arial', fill: '#fff' })
            .setOrigin(0.5)
            .setDepth(101);

        recipeBtn.on('pointerdown', () => {
            if (this.isDragging) return;
            
            // CHỐT CHẶN: Không cho mở công thức khi đang chạy Hướng dẫn tân thủ
            if (!this.tutorialDone) return;

            // Teleport UI Công thức đập thẳng vào mắt người chơi
            let currentCamX = this.cameras.main.scrollX + 270; 
            let currentCamY = this.cameras.main.scrollY + 480;
            this.recipeUI.setPosition(currentCamX, currentCamY);
            
            this.recipeUI.setVisible(true);
        });
    }

    update() {
        // KIỂM TRA LƯỚT CAMERA TRONG TUTORIAL
        if (!this.tutorialDone && this.tutorialStep === 2) {
            // Nếu người chơi kéo Camera sang trái (X của camera trượt về < 100 tức là đã nhìn thấy Bếp)
            if (this.cameras.main.scrollX <= 100) {
                this.showTutorialStep(3); // Kích hoạt Bước 3: Soi sáng bếp nấu
            }
        }
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

        if (!this.tutorialDone) {
            if (index !== 0) return; // Khóa 3 bếp còn lại
            if (this.tutorialStep !== 3 && this.tutorialStep !== 4) return; // Khóa click nếu sai bước
        }

        let stove = this.stoves[index];
        let vis = this.stoveVisuals[index];

        // KIỂM TRA NÚT THẮT 1: BỒN RỬA ĐẦY CHÉN BẨN? (Giữ nguyên logic cũ)
        if (this.dirtyDishes >= 5) {
            this.cameras.main.shake(200, 0.01);
              this.showNotification("Hãy rửa bát trước");
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
                this.showNotification("Thiếu nguyên liệu"); 
                console.log("THIẾU NGUYÊN LIỆU!");
                return;
            }

            // ĐỦ ĐỒ -> TRỪ KHO VÀ ĐƯA ĐƠN VÀO BẾP
            for (let item in req) { this.inventory[item] -= req[item]; }
            this.updateInventoryHUD();
              this.saveInventory(); 
            
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

            // SỬA ĐOẠN ĐẦU BẾP NẤU THÀNH CÔNG:
            if (!this.tutorialDone && this.tutorialStep === 3) {
                this.showTutorialStep(4); // Chuyển sang Bước 4: Chờ nấu chín và soi sáng duy nhất cái Bếp đang nấu
                
                let brush = this.add.circle(0, 0, 85, 0xffffff).setVisible(false);
                this.rt.erase(brush, stove.x, stove.y + 2000); // Chỉ soi sáng duy nhất cái bếp này
                brush.destroy();
            }

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

            stove.currentOrder = null;
             if (!this.tutorialDone && this.tutorialStep === 4) {
                this.showTutorialStep(5.1);
            }
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

             this.saveInventory(); 

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
    //if (this.isSpawnerLocked || this.waitingQueue.length >= 5) return;
    
        if (this.waitingQueue.length >= 5) return;

        let custType = Phaser.Math.Between(1, 2) === 1 ? 'cust1' : 'cust2';
        
        let customer = this.add.sprite(this.queueStartX, this.queueStartY, `${custType}_down`)
            .setDisplaySize(50, 80)
            .setDepth(4000);
        
        customer.custType = custType; 
        customer.state = 'SPAWN'; 
        customer.assignedTableId = null; 
        this.customers.push(customer);

        let emptyTable = this.tables.find(t => t.status === 'EMPTY');

       if (emptyTable) {
            emptyTable.status = 'OCCUPIED';
            customer.assignedTableId = emptyTable.id;
            customer.state = 'WALKING_TO_TABLE';

            // BƯỚC 1: Khách đứng ngoài đường đi bộ đến Cửa ngoài tiệm lẩu
            customer.setTexture(`${customer.custType}_side`); 
            customer.setFlipX(false); 

            this.tweens.add({
                targets: customer,
                x: this.doorOutsideX,
                y: this.doorOutsideY,
                duration: 1000,
                ease: 'Linear',
                onComplete: () => {
                    // Trễ 1ms để giải phóng bộ nhớ
                    this.time.delayedCall(1, () => {
                        if (!customer || !customer.active) return;

                        // BƯỚC 2: Teleport vào trong sảnh chính
                        customer.setPosition(this.doorInsideX, this.doorInsideY);

                        // =======================================================
                        // BƯỚC 3: BẬT GPS - TỰ ĐỘNG DẪN ĐƯỜNG ĐẾN BÀN VIP/THƯỜNG
                        // =======================================================
                        // Copy mảng path của bàn để tránh làm hỏng mảng gốc
                        let gpsRoute = [...emptyTable.path]; 

                        this.walkCustomerPath(customer, gpsRoute, () => {
                            // Khi đi bộ hết các mốc GPS -> Khách ngồi xuống gọi món
                            customer.setTexture(`${customer.custType}_sit`);
                            customer.setFlipX(false); 
                            customer.state = 'SIT_ORDERING'; 
                            this.startPatienceTimer(customer, 'SIT_ORDERING'); 
                            this.showOrderBubble(customer); 
                        });
                        // =======================================================
                    });
                }
            });

        } else {
            customer.setTexture(`${customer.custType}_down`); 
            customer.state = 'WAITING_OUTSIDE';
            this.waitingQueue.push(customer);
            this.updateQueuePositions(); 
            
        this.startPatienceTimer(customer, 'WAITING_OUTSIDE'); // Bắt đầu đếm ngược giận dữ ngoài đường
        }
    }

   showOrderBubble(customer) {
        let menu = [
            { id: 'spicy', name: '🌶️ Lẩu Cay', price: 60, cookTime: 4000, textureKey: 'pot_spicy', req: { chili: 1, beef: 2, veggies: 1 } },
            { id: 'herbal', name: '🌿 Lẩu Nấm', price: 40, cookTime: 3000, textureKey: 'pot_herbal', req: { herbs: 1, veggies: 2 } },
            { id: 'seafood', name: '🍤 Lẩu Hải Sản', price: 110, cookTime: 6000, textureKey: 'pot_seafood', req: { bone: 1, seafood: 2, veggies: 1 } }
        ];

        let chosenDish = Phaser.Utils.Array.GetRandom(menu);
        customer.order = chosenDish;

        // 1. VẼ BONG BÓNG VÀ BIẾN NÓ THÀNH NÚT BẤM CẢM ỨNG (setInteractive)
        customer.bubbleBg = this.add.rectangle(customer.x, customer.y - 60, 110, 35, 0xffffff)
            .setStrokeStyle(2, 0x000000)
            .setDepth(4001)
            .setInteractive({ useHandCursor: true }); // <--- BIẾN THÀNH NÚT CLICK

        customer.bubbleTxt = this.add.text(customer.x, customer.y - 60, chosenDish.name, { 
            font: 'bold 12px Arial', fill: '#000000' 
        }).setOrigin(0.5).setDepth(4002);

        // Chuyển trạng thái Khách sang đang ngồi chờ gọi món
        customer.state = 'SIT_ORDERING';

        // 2. BẮT SỰ KIỆN CLICK TRỰC TIẾP VÀO BONG BÓNG ĐỂ LẤY ORDER
        customer.bubbleBg.on('pointerup', () => {
            if (this.isDragging) return; // Đang vuốt màn hình thì bỏ qua

            if (customer.state === 'SIT_ORDERING') {

                customer.state = 'WAITING_FOR_FOOD';
                this.startPatienceTimer(customer, 'WAITING_FOR_FOOD');

                // Đổi giao diện bong bóng sang màu vàng (Đang nấu)
                customer.bubbleTxt.setText('⏳ Đang nấu...');
                customer.bubbleBg.setFillStyle(0xf1c40f);

                // Đẩy đơn vào Bếp
                this.pendingOrders.push({
                    customerRef: customer,
                    recipe: customer.order.req,
                    fullOrderData: customer.order
                });

                this.refreshStovesIndicator(); // Báo hiệu bếp nhấp nháy
                console.log(`Đã nhận đơn: ${chosenDish.name}!`);
            }
        });
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
        let hotpotOffsetY = -110; // Dịch lên trên (-) hoặc xuống dưới (+)
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

            // CỘNG 1 BÁT BẨN KHI KHÁCH ĂN XONG
            this.dirtyDishes++;
            this.dirtyDishTxt.setText(`Bát bẩn: ${this.dirtyDishes}/5`);
            
            // Hiện ảnh bát bẩn chồng chất trong bồn
            this.dirtyDishesSprite.setVisible(true);

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

           // 3. GỌI KHÁCH TIẾP THEO Ở NGOÀI TRỜI VÀO
           // =======================================================
            // 3. GỌI KHÁCH TIẾP THEO Ở NGOÀI TRỜI VÀO (SỬ DỤNG GPS WAYPOINTS)
            // =======================================================
            if (this.waitingQueue.length > 0) {
                let nextCustomer = this.waitingQueue.shift(); 

                // Tắt Timer giận dữ chờ xếp hàng ngoài trời
                if (nextCustomer.patienceTimer) {
                    nextCustomer.patienceTimer.remove();
                    nextCustomer.patienceTimer = null;
                }

                this.updateQueuePositions(); 
                
                table.status = 'OCCUPIED';
                nextCustomer.assignedTableId = table.id;
                nextCustomer.state = 'WALKING_TO_TABLE';

                // Lật mặt sang phải để bắt đầu đi ra Cửa Ngoài Trời
                nextCustomer.setTexture(`${nextCustomer.custType}_side`); 
                nextCustomer.setFlipX(false); 

                this.tweens.add({
                    targets: nextCustomer,
                    x: this.doorOutsideX, 
                    y: this.doorOutsideY,
                    duration: 1000,
                    ease: 'Linear',
                    onComplete: () => {
                        // HOÃN 1MS ĐỂ PHÒNG THỦ LỖI TWEEN TRÔI TỌA ĐỘ
                        this.time.delayedCall(1, () => {
                            if (!nextCustomer || !nextCustomer.active) return;
                            
                            // Teleport vào trong sảnh chính
                            nextCustomer.setPosition(this.doorInsideX, this.doorInsideY); 
                            
                            // Copy lộ trình GPS của bàn trống này
                            let gpsRoute = [...table.path]; 

                            // Gọi bộ não Đệ quy (Recursive) tự động dắt khách theo lộ trình
                            this.walkCustomerPath(nextCustomer, gpsRoute, () => {
                                // Khi đi tới đích (Hết mốc GPS) -> Tự động ngồi xuống và gọi món
                                nextCustomer.setTexture(`${nextCustomer.custType}_sit`);
                                nextCustomer.setFlipX(false);
                                nextCustomer.state = 'SIT_ORDERING';
                                this.startPatienceTimer(nextCustomer, 'SIT_ORDERING'); 
                                this.showOrderBubble(nextCustomer);
                            });
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

    startPatienceTimer(customer, stateName) {
        // Nếu khách đã có Timer đang chạy -> Hủy cái cũ đi để đếm lại từ đầu cho trạng thái mới
        if (customer.patienceTimer) {
            customer.patienceTimer.remove();
        }

        // Bắt đầu đếm ngược 60 giây (60000ms)
        customer.patienceTimer = this.time.delayedCall(60000, () => {
            this.handleCustomerAngryLeave(customer, stateName);
        }, [], this);
    }

    handleCustomerAngryLeave(customer, stateAtLeave) {
        if (!customer || !customer.active) return;

        console.log(`😡 Khách đã bỏ về vì chờ quá lâu ở trạng thái: ${stateAtLeave}!`);

        // 1. DỌN SẠCH CÁC LIÊN KẾT ĐƠN HÀNG CŨ TRONG BẾP (ĐỂ TRÁNH BẾP NẤU CHO MA)
        this.pendingOrders = this.pendingOrders.filter(order => order.customerRef !== customer);
        this.refreshStovesIndicator();

        // 2. HIỆN BONG BÓNG GIẬN DỮ 💢
        if (customer.bubbleBg) {
            customer.bubbleBg.destroy();
            customer.bubbleTxt.destroy();
        }

        let angryBubble = this.add.sprite(customer.x, customer.y - 60, 'angry_bubble').setDisplaySize(40, 40).setDepth(4005);
        
        // 3. CHO KHÁCH ĐI BỘ RA KHỎI TIỆM (NẾU ĐANG NGỒI TRONG QUÁN)
        if (stateAtLeave !== 'WAITING_OUTSIDE') {
            let table = this.tables.find(t => t.id === customer.assignedTableId);
            table.status = 'EMPTY'; // Giải phóng bàn ăn ngay

            this.tweens.add({
                targets: customer,
                x: this.doorInsideX,
                y: this.doorInsideY,
                duration: 1000,
                onComplete: () => {
                    customer.setPosition(this.doorOutsideX, this.doorOutsideY);
                    this.tweens.add({
                        targets: customer,
                        x: this.queueStartX,
                        y: this.queueStartY,
                        duration: 1000,
                        onComplete: () => {
                            angryBubble.destroy();
                            this.customers = this.customers.filter(c => c !== customer);
                            customer.destroy();
                        }
                    });
                }
            });
        } else {
            // Nếu giận dữ ngoài đường thì tự hủy luôn
            angryBubble.destroy();
            this.waitingQueue = this.waitingQueue.filter(c => c !== customer);
            this.customers = this.customers.filter(c => c !== customer);
            customer.destroy();
            this.updateQueuePositions();
        }

        // 4. HÌNH PHẠT: KHÓA SPAWNER ĐẺ KHÁCH TRONG 1 PHÚT (60 GIÂY)
        // this.lockSpawner();
    }

    lockSpawner() {
        if (this.isSpawnerLocked) return; // Nếu đang bị phạt rồi thì thôi
        this.isSpawnerLocked = true;

        // Vẽ một Text cảnh báo to màu đỏ ghim trên màn hình
        let penaltyTxt = this.add.text(270, 80, "⚠️ CỬA HÀNG BỊ PHẠT ĐÓNG CỬA 1 PHÚT!", { 
            font: 'bold 18px Arial', fill: '#ff4757', stroke: '#000', strokeThickness: 4 
        }).setOrigin(0.5).setDepth(20005).setScrollFactor(0);

        // Hiệu ứng nhấp nháy chữ phạt
        this.tweens.add({ targets: penaltyTxt, alpha: 0.3, yoyo: true, repeat: -1, duration: 500 });

        // Tạm thời dừng Spawner
        let originalTimer = this.time.addEvent({
            delay: 1000,
            callback: () => {}, // Chạy rỗng để đếm ngược
            repeat: 59
        });

        this.time.delayedCall(60000, () => {
            this.isSpawnerLocked = false;
            penaltyTxt.destroy(); // Hết phạt dọn text đi
            console.log("Cửa hàng đã mở cửa đón khách trở lại!");
        });
    }

    showNotification(message) {
        // Nếu đang có một thông báo cũ hiển thị -> Hủy nó đi để tránh chữ đè lên nhau
        if (this.activeNotification) {
            this.activeNotification.destroy();
        }

        // Tạo Text thông báo nằm ngay chính giữa màn hình (Ghim cố định theo mắt người chơi)
        this.activeNotification = this.add.text(270, 480, message, {
            font: 'bold 24px Arial',
            fill: '#ff4757', // Màu đỏ cảnh báo rực rỡ
            stroke: '#000000',
            strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5).setDepth(30000).setScrollFactor(0); // setScrollFactor(0) để ghim chặt giữa camera!

        // Hiệu ứng bay lên nhẹ và mờ dần biến mất sau 1.5 giây
        this.tweens.add({
            targets: this.activeNotification,
            y: 430, // Bay lên trên 50px
            alpha: 0, // Mờ dần về 0
            duration: 1500,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                if (this.activeNotification) {
                    this.activeNotification.destroy();
                    this.activeNotification = null;
                }
            }
        });
    }

  // Thêm tham số speed = 150 ở cuối (Mặc định là 150 nếu không truyền gì vào)
    walkCustomerPath(customer, path, onCompleteCallback, speed = 250) { 
        if (!customer || !customer.active) return;

        if (path.length === 0) {
            if (onCompleteCallback) onCompleteCallback();
            return;
        }

        let nextPoint = path.shift();

        if (nextPoint.dir) {
            customer.setTexture(`${customer.custType}_${nextPoint.dir}`);
        }
        if (nextPoint.hasOwnProperty('flipX')) {
            customer.setFlipX(nextPoint.flipX);
        }

        let distance = Phaser.Math.Distance.Between(customer.x, customer.y, nextPoint.x, nextPoint.y);
        
        // Tính duration dựa trên biến speed động
        let duration = (distance / speed) * 1000;

        this.tweens.add({
            targets: customer,
            x: nextPoint.x,
            y: nextPoint.y,
            duration: duration,
            ease: 'Linear',
            onComplete: () => {
                // Truyền tiếp biến speed cho các bước đệ quy tiếp theo
                this.walkCustomerPath(customer, path, onCompleteCallback, speed);
            }
        });
    }

    createUpgradeUI() {
        this.upgradeUI = this.add.container(0, 0).setDepth(20000).setVisible(false);
        let overlay = this.add.rectangle(0, 0, 3000, 3000, 0x000000, 0.8).setInteractive();
        let panel = this.add.rectangle(0, 0, 450, 600, 0xffffff).setStrokeStyle(4, 0xf39c12);
        let title = this.add.text(0, -250, "🤝 TUYỂN DỤNG NHÂN SỰ", { font: 'bold 26px Arial', fill: '#d35400' }).setOrigin(0.5);
        this.upgradeUI.add([overlay, panel, title]);

        // Danh sách Nhân sự
        let staffList = [
            { key: 'dishwasher', name: '🤖 Máy Rửa Bát', desc: 'Tự động rửa bát bẩn\nNgăn quá tải bồn rửa', price: this.staffPrices.dishwasher },
            { key: 'chef', name: '👨‍🍳 Đầu Bếp', desc: 'Tự động nấu Lẩu\nKhi có Đơn gọi món', price: this.staffPrices.chef },
            { key: 'waiter', name: '💁‍♀️ Phục Vụ Bàn', desc: 'Tự động lấy Order\nvà bưng Lẩu cho khách', price: this.staffPrices.waiter }
        ];

        staffList.forEach((staff, index) => {
            let startY = -120 + (index * 140);

            // Khung từng người
            let itemBg = this.add.rectangle(0, startY, 400, 120, 0xecf0f1).setStrokeStyle(2, 0xbdc3c7);
            let nameTxt = this.add.text(-180, startY - 30, staff.name, { font: 'bold 20px Arial', fill: '#2c3e50' }).setOrigin(0, 0.5);
            let descTxt = this.add.text(-180, startY + 10, staff.desc, { font: '16px Arial', fill: '#7f8c8d' }).setOrigin(0, 0.5);

            // Biến cờ kiểm tra xem đã mua chưa
            let isOwned = false;
            if (staff.key === 'dishwasher') isOwned = this.hasDishwasher;
            if (staff.key === 'chef') isOwned = this.hasChef;
            if (staff.key === 'waiter') isOwned = this.hasWaiter;

            // Nút Bấm Mua
            let buyBtn = this.add.rectangle(120, startY, 130, 50, isOwned ? 0x95a5a6 : 0x27ae60).setInteractive({ useHandCursor: !isOwned });
            let buyTxt = this.add.text(120, startY, isOwned ? "ĐÃ THUÊ" : `🪙 ${staff.price}`, { font: 'bold 18px Arial', fill: '#fff' }).setOrigin(0.5);

            buyBtn.on('pointerdown', () => {
                if (isOwned) return; // Mua rồi thì thôi
                
                if (this.gold >= staff.price) {
                    // Trừ tiền
                    this.gold -= staff.price;
                    localStorage.setItem('hotpot_gold', this.gold.toString());
                    this.goldText.setText(`🪙 ${this.gold}`);

                    // Lưu trạng thái đã mua
                    if (staff.key === 'dishwasher') { 
                     this.hasDishwasher = true; 
                     localStorage.setItem('hotpot_has_dishwasher', 'true'); 
                     this.dishwasherSprite.setVisible(true); // <--- LÀM CHO MÁY HIỆN HÌNH NGAY LẬP TỨC
                    }
                   if (staff.key === 'chef') { 
                    this.hasChef = true; 
                      localStorage.setItem('hotpot_has_chef', 'true'); 
                         this.chefSprite.setVisible(true); // <--- LÀM ĐẦU BẾP HIỆN HÌNH NGAY
                        }
                    if (staff.key === 'waiter') { this.hasWaiter = true; localStorage.setItem('hotpot_has_waiter', 'true');
                        this.waitressSprite.setVisible(true);
                     }

                    // Cập nhật UI Nút bấm
                    isOwned = true;
                    buyBtn.setFillStyle(0x95a5a6);
                    buyTxt.setText("ĐÃ THUÊ");
                    buyBtn.disableInteractive();

                    this.showNotification(`Tuyển thành công ${staff.name}!`);
                    
                    // SPAWN NHÂN VIÊN RA BẢN ĐỒ (Sẽ làm ở Giai đoạn sau)
                    this.spawnStaffSprite(staff.key); 

                } else {
                    this.showNotification("Bạn không đủ Vàng!");
                }
            });

            this.upgradeUI.add([itemBg, nameTxt, descTxt, buyBtn, buyTxt]);
        });

        // Nút Đóng
        let closeBtn = this.add.rectangle(180, -260, 40, 40, 0xe74c3c).setInteractive({ useHandCursor: true });
        let closeTxt = this.add.text(180, -260, "X", { font: 'bold 20px Arial', fill: '#fff' }).setOrigin(0.5);
        closeBtn.on('pointerdown', () => { this.upgradeUI.setVisible(false); });
        this.upgradeUI.add([closeBtn, closeTxt]);
    }

    // Hàm tạo Sprite hiển thị dưới đất khi vừa mua xong
    spawnStaffSprite(staffType) {
        console.log("Đã xuất hiện nhân sự:", staffType);
        // Ta sẽ vẽ Sprite vào Bếp / Sảnh ở bước viết AI sau
    }

    runDishwasherAI() {
        // AI sẽ chạy một vòng lặp quét (Heartbeat) cứ mỗi 2.5 giây một lần
        this.time.addEvent({
            delay: 2500, // Tốc độ xử lý của Máy rửa bát (Nhanh hơn người chơi bấm tay 1 chút)
            callback: () => {
                // Điều kiện dừng: Nếu chưa mua máy, hoặc đang không có bát bẩn, hoặc người chơi đang rửa tay -> Bỏ qua nhịp này
                if (!this.hasDishwasher || this.dirtyDishes <= 0 || this.isWashing) {
                    this.dishwasherShakeTween.pause(); // Máy ngừng rung
                    return;
                }

                // TIẾN HÀNH RỬA TỰ ĐỘNG
                this.isWashing = true; // Khóa không cho người chơi click chen ngang
                this.dishwasherShakeTween.resume(); // Bật máy rung ầm ầm

                // Tự động bật thanh Loading xanh dương ở trên Bồn rửa bát
                this.washBg.setVisible(true);
                this.washFill.setVisible(true).width = 0;

                this.tweens.add({
                    targets: this.washFill,
                    width: 80,
                    duration: 2000, // Máy mất 2 giây để rửa sạch 1 cái đĩa
                    onComplete: () => {
                        this.dirtyDishes--; 
                        this.dirtyDishTxt.setText(`Bát bẩn: ${this.dirtyDishes}/5`);
                        
                        if (this.dirtyDishes === 0) {
                            this.dirtyDishesSprite.setVisible(false);
                        }

                        this.washBg.setVisible(false);
                        this.washFill.setVisible(false);
                        this.isWashing = false; // Nhả khóa ra

                        this.dishwasherShakeTween.pause(); // Rửa xong tắt rung máy
                    }
                });
            },
            callbackScope: this,
            loop: true
        });
    }

   runChefAI() {
        this.time.addEvent({
            delay: 1000, 
            callback: () => {
                // Điều kiện chặn (Giữ nguyên)
                if (!this.hasChef || this.chefState !== 'IDLE' || this.dirtyDishes >= 5 || this.pendingOrders.length === 0) return;

                let emptyStoveIndex = this.stoves.findIndex(s => s.status === 'IDLE');
                if (emptyStoveIndex === -1) return; 

                // KHÓA TRẠNG THÁI: BẮT ĐẦU ĐI NẤU
                this.chefState = 'MOVING_TO_STOVE';
                let targetStove = this.stoves[emptyStoveIndex];
                
                // Tọa độ Đích (Đứng hơi lệch xuống dưới cái bếp một tí để thao tác)
                let targetX = targetStove.x;
                let targetY = targetStove.y + 40;

                // Tốc độ Đầu bếp 
                let speed = 200; 

                // =================================================================
                // CHẶNG ĐI (LƯỢT ĐẾN BẾP) - ĐI VUÔNG GÓC 2 BƯỚC
                // =================================================================
                
                // 1. TÍNH CHẶNG ĐI DỌC (TRỤC Y)
                let durY = (Math.abs(targetY - this.chefSprite.y) / speed) * 1000;
                
                // Đổi ảnh dọc: Lên hay Xuống?
                if (targetY < this.chefSprite.y) {
                    this.chefSprite.setTexture('chef_up');
                } else {
                    this.chefSprite.setTexture('chef_down');
                }

                // Tween Chặng Dọc
                this.tweens.add({
                    targets: this.chefSprite,
                    y: targetY,
                    duration: durY,
                    ease: 'Linear',
                    onComplete: () => {
                        // 2. TÍNH CHẶNG ĐI NGANG (TRỤC X) KHI ĐÃ TỚI NGANG HÀNG
                        let durX = (Math.abs(targetX - this.chefSprite.x) / speed) * 1000;

                        // Đổi ảnh ngang và Lật mặt
                        this.chefSprite.setTexture('chef_side');
                        if (targetX < this.chefSprite.x) {
                            this.chefSprite.setFlipX(true); // Sang trái
                        } else {
                            this.chefSprite.setFlipX(false); // Sang phải
                        }

                        // Tween Chặng Ngang (Tạt vào bếp)
                        this.tweens.add({
                            targets: this.chefSprite,
                            x: targetX,
                            duration: durX,
                            ease: 'Linear',
                            onComplete: () => {
                                // ==============================================
                                // ĐÃ ĐẾN NƠI -> BẬT BẾP NẤU!
                                // ==============================================
                                this.chefSprite.setTexture('chef_up'); // Đứng nhìn thẳng vào nồi
                                this.chefSprite.setFlipX(false);
                                
                                this.handleStoveClick(emptyStoveIndex); 

                                // ==============================================
                                // CHẶNG VỀ (QUAY LẠI VỊ TRÍ CHỜ) - ĐI VUÔNG GÓC 2 BƯỚC
                                // ==============================================
                                this.chefState = 'RETURNING';

                                // 1. TÍNH CHẶNG VỀ NGANG (Lùi ra giữa hành lang)
                                let retDurX = (Math.abs(this.chefStandbyX - this.chefSprite.x) / speed) * 1000;
                                this.chefSprite.setTexture('chef_side');
                                if (this.chefStandbyX < this.chefSprite.x) {
                                    this.chefSprite.setFlipX(true);
                                } else {
                                    this.chefSprite.setFlipX(false);
                                }

                                this.tweens.add({
                                    targets: this.chefSprite,
                                    x: this.chefStandbyX,
                                    duration: retDurX,
                                    ease: 'Linear',
                                    onComplete: () => {
                                        // 2. TÍNH CHẶNG VỀ DỌC (Trở về đúng tâm phòng)
                                        let retDurY = (Math.abs(this.chefStandbyY - this.chefSprite.y) / speed) * 1000;
                                        if (this.chefStandbyY < this.chefSprite.y) {
                                            this.chefSprite.setTexture('chef_up');
                                        } else {
                                            this.chefSprite.setTexture('chef_down');
                                        }
                                        this.chefSprite.setFlipX(false);

                                        this.tweens.add({
                                            targets: this.chefSprite,
                                            y: this.chefStandbyY,
                                            duration: retDurY,
                                            ease: 'Linear',
                                            onComplete: () => {
                                                // ĐÃ VỀ TỚI NHÀ, SẴN SÀNG NHẬN ĐƠN MỚI
                                                this.chefSprite.setTexture('chef_down');
                                                this.chefState = 'IDLE'; 
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            },
            callbackScope: this,
            loop: true
        });
    }

    returnWaitressToStandby(targetLocation, targetTable) {
        let hallwaySanhX = 810;
        let hallwayVipX = 1350;
        let doorVipY = 700;

        let pathReturn = [];
        if (targetTable.isVip) {
            pathReturn.push({ x: hallwayVipX, y: targetLocation.y, dir: 'side', flipX: hallwayVipX < targetLocation.x });
            pathReturn.push({ x: hallwayVipX, y: doorVipY, dir: targetLocation.y > doorVipY ? 'up' : 'down', flipX: false });
            pathReturn.push({ x: hallwaySanhX, y: doorVipY, dir: 'side', flipX: true });
            pathReturn.push({ x: hallwaySanhX, y: this.waitressStandbyY, dir: 'up', flipX: false });
            pathReturn.push({ x: this.waitressStandbyX, y: this.waitressStandbyY, dir: 'side', flipX: false });
        } else {
            pathReturn.push({ x: hallwaySanhX, y: targetLocation.y, dir: 'side', flipX: hallwaySanhX < targetLocation.x });
            pathReturn.push({ x: hallwaySanhX, y: this.waitressStandbyY, dir: targetLocation.y > this.waitressStandbyY ? 'up' : 'down', flipX: false });
            pathReturn.push({ x: this.waitressStandbyX, y: this.waitressStandbyY, dir: 'side', flipX: false });
        }

        this.walkCustomerPath(this.waitressSprite, pathReturn, () => {
            this.waitressSprite.setTexture('waitress_down');
            this.waitressState = 'IDLE'; 
        }, 250);
    }

  runWaitressAI() {
        this.time.addEvent({
            delay: 1000, 
            callback: () => {
                if (!this.hasWaiter || this.waitressState !== 'IDLE') return;

                let targetTask = null;
                let targetLocation = null;
                let targetObject = null; // Lưu trữ bàn hoặc bếp tương tác
                let targetTable = null;  // Lưu trữ dữ liệu bàn đích

                // ==============================================
                // 1. QUÉT TÌM VIỆC ƯU TIÊN
                // ==============================================
                let readyStoveIndex = this.stoves.findIndex(s => s.status === 'READY_TO_SERVE');
                if (readyStoveIndex !== -1) {
                    targetTask = 'SERVE_FOOD';
                    targetObject = readyStoveIndex;
                    let stoveOrder = this.stoves[readyStoveIndex].currentOrder;
                    targetTable = this.tables.find(t => t.id === stoveOrder.customerRef.assignedTableId);
                    targetLocation = { x: targetTable.x, y: targetTable.y + 40 }; // Đích đến cuối cùng là Bàn ăn
                } else {
                    let orderingCustomer = this.customers.find(c => c.state === 'SIT_ORDERING');
                    if (orderingCustomer) {
                        targetTask = 'TAKE_ORDER';
                        targetObject = orderingCustomer;
                        targetTable = this.tables.find(t => t.id === orderingCustomer.assignedTableId);
                        targetLocation = { x: targetTable.x, y: targetTable.y + 40 }; 
                    }
                }

                // ==============================================
                // 2. LẬP LỘ TRÌNH GPS NÉ TƯỜNG (3-LEG JOURNEY)
                // ==============================================
                if (targetTask) {
                    this.waitressState = 'WORKING';
                    
                    // --- CÁC NÚT GIAO THÔNG CHỐNG XUYÊN TƯỜNG ---
                    let doorKitchenX = 540;  // Cửa Bếp
                    let doorKitchenY = 700;  
                    let doorVipX = 1080;     // Cửa phòng VIP
                    let doorVipY = 700;      
                    let hallwaySanhX = 810;  // Trục dọc Sảnh
                    let hallwayBepX = 270;   // Trục dọc Bếp
                    let hallwayVipX = 1350;  // Trục dọc VIP
                    // ---------------------------------------------

                    if (targetTask === 'SERVE_FOOD') {
                        // =======================================================
                        // KỊCH BẢN PHỤC VỤ (CHẶNG 1: CHẠY VÀO BẾP LẤY LẨU)
                        // =======================================================
                        let pathStove = [];
                        let stove = this.stoves[targetObject];

                        pathStove.push({ x: hallwaySanhX, y: doorKitchenY, dir: 'down', flipX: false });
                        pathStove.push({ x: hallwayBepX, y: doorKitchenY, dir: 'side', flipX: true });
                        pathStove.push({ x: hallwayBepX, y: stove.y + 40, dir: 'up', flipX: false });
                        pathStove.push({ x: stove.x, y: stove.y + 40, dir: 'side', flipX: stove.x < hallwayBepX });

                        // Chạy vào bếp với tốc độ 250
                        this.walkCustomerPath(this.waitressSprite, pathStove, () => {
                            this.waitressSprite.setTexture('waitress_up'); 
                            
                            // Đứng ở bếp lấy đồ trong 0.3s (Đã sửa cú pháp sạch sẽ, không truyền bậy bạ 250 vào đây)
                            this.time.delayedCall(300, () => {
                                if (!this.waitressSprite || !this.waitressSprite.active) return;

                                let pathTable = [];
                                
                                // Đi ra khỏi bếp chui qua cửa Bếp
                                pathTable.push({ x: hallwayBepX, y: stove.y + 40, dir: 'side', flipX: hallwayBepX < stove.x });
                                pathTable.push({ x: hallwayBepX, y: doorKitchenY, dir: 'down', flipX: false });
                                pathTable.push({ x: hallwaySanhX, y: doorKitchenY, dir: 'side', flipX: false });

                                if (targetTable.isVip) {
                                    // Bàn VIP
                                    pathTable.push({ x: hallwaySanhX, y: doorVipY, dir: 'up', flipX: false });
                                    pathTable.push({ x: hallwayVipX, y: doorVipY, dir: 'side', flipX: false });
                                    pathTable.push({ x: hallwayVipX, y: targetLocation.y, dir: targetLocation.y > doorVipY ? 'down' : 'up', flipX: false });
                                    pathTable.push({ x: targetLocation.x, y: targetLocation.y, dir: 'side', flipX: targetLocation.x < hallwayVipX });
                                } else {
                                    // Bàn Thường
                                    pathTable.push({ x: hallwaySanhX, y: targetLocation.y, dir: 'up', flipX: false });
                                    pathTable.push({ x: targetLocation.x, y: targetLocation.y, dir: 'side', flipX: targetLocation.x < hallwaySanhX });
                                }

                                // Bưng lẩu ra bàn khách với tốc độ 250
                                this.walkCustomerPath(this.waitressSprite, pathTable, () => {
                                    this.waitressSprite.setTexture('waitress_up');
                                    
                                    // Đặt lẩu lên bàn
                                    this.handleStoveClick(targetObject);

                                    // Đi về chỗ nghỉ
                                    let pathReturn = [];
                                    if (targetTable.isVip) {
                                        pathReturn.push({ x: hallwayVipX, y: targetLocation.y, dir: 'side', flipX: hallwayVipX < targetLocation.x });
                                        pathReturn.push({ x: hallwayVipX, y: doorVipY, dir: targetLocation.y > doorVipY ? 'up' : 'down', flipX: false });
                                        pathReturn.push({ x: hallwaySanhX, y: doorVipY, dir: 'side', flipX: true });
                                        pathReturn.push({ x: hallwaySanhX, y: this.waitressStandbyY, dir: 'up', flipX: false });
                                        pathReturn.push({ x: this.waitressStandbyX, y: this.waitressStandbyY, dir: 'side', flipX: false });
                                    } else {
                                        pathReturn.push({ x: hallwaySanhX, y: targetLocation.y, dir: 'side', flipX: hallwaySanhX < targetLocation.x });
                                        pathReturn.push({ x: hallwaySanhX, y: this.waitressStandbyY, dir: targetLocation.y > this.waitressStandbyY ? 'up' : 'down', flipX: false });
                                        pathReturn.push({ x: this.waitressStandbyX, y: this.waitressStandbyY, dir: 'side', flipX: false });
                                    }

                                    // Đi về với tốc độ 250
                                    this.walkCustomerPath(this.waitressSprite, pathReturn, () => {
                                        this.waitressSprite.setTexture('waitress_down');
                                        this.waitressState = 'IDLE'; 
                                    }, 250);
                                }, 250);
                            }, [], this); // Đã bọc [], this cực kỳ chuẩn xác cho delayedCall
                        }, 350); // Đầu ra của walkCustomerPath chặng 1 nhận tốc độ 250 chuẩn chỉ

                    
                        // ... (Kịch bản lấy order TAKE_ORDER bên dưới giữ nguyên không đổi) ...
                    } else if (targetTask === 'TAKE_ORDER') {
                        // =======================================================
                        // KỊCH BẢN LẤY ORDER (ĐI TỪ CHỖ CHỜ RA BÀN KHÁCH & QUAY VỀ)
                        // =======================================================
                        let pathOrder = [];
                        if (targetTable.isVip) {
                            pathOrder.push({ x: hallwaySanhX, y: this.waitressStandbyY, dir: 'side', flipX: true });
                            pathOrder.push({ x: hallwaySanhX, y: doorVipY, dir: 'down', flipX: false });
                            pathOrder.push({ x: hallwayVipX, y: doorVipY, dir: 'side', flipX: false });
                            pathOrder.push({ x: hallwayVipX, y: targetLocation.y, dir: targetLocation.y > doorVipY ? 'down' : 'up', flipX: false });
                            pathOrder.push({ x: targetLocation.x, y: targetLocation.y, dir: 'side', flipX: targetLocation.x < hallwayVipX });
                        } else {
                            pathOrder.push({ x: hallwaySanhX, y: this.waitressStandbyY, dir: 'side', flipX: true });
                            pathOrder.push({ x: hallwaySanhX, y: targetLocation.y, dir: targetLocation.y > this.waitressStandbyY ? 'down' : 'up', flipX: false });
                            pathOrder.push({ x: targetLocation.x, y: targetLocation.y, dir: 'side', flipX: targetLocation.x < hallwaySanhX });
                        }

                        this.walkCustomerPath(this.waitressSprite, pathOrder, () => {
                            this.waitressSprite.setTexture('waitress_up'); 
                            
                            this.time.delayedCall(500, () => {
                                // =======================================================
                                // CHỐT CHẶN PHÒNG THỦ: NẾU KHÁCH ĐÃ BỎ VỀ TRƯỚC KHI PHỤC VỤ ĐẾN NƠI
                                // =======================================================
                                if (!targetObject || !targetObject.active || targetObject.state !== 'SIT_ORDERING') {
                                    console.log("Khách đã bỏ đi trước khi ghi đơn! Phục vụ quay về...");
                                    this.returnWaitressToStandby(targetLocation, targetTable); // Đi về nghỉ ngơi
                                    return; // Thoát sớm, bảo vệ game không bị sập!
                                }
                                // =======================================================

                                // NẾU KHÁCH CÒN SỐNG -> TIẾN HÀNH LẤY ORDER
                                targetObject.state = 'WAITING_FOR_FOOD';
                                if (targetObject.bubbleTxt && targetObject.bubbleTxt.active) {
                                    targetObject.bubbleTxt.setText('⏳ Đang nấu...');
                                    targetObject.bubbleBg.setFillStyle(0xf1c40f);
                                }
                                this.pendingOrders.push({
                                    customerRef: targetObject,
                                    recipe: targetObject.order.req,
                                    fullOrderData: targetObject.order 
                                });
                                this.refreshStovesIndicator();
                                this.startPatienceTimer(targetObject, 'WAITING_FOR_FOOD'); 

                                // LẤY XONG -> ĐI VỀ CHỖ NGHỈ
                                this.returnWaitressToStandby(targetLocation, targetTable);
                            });
                        }, 400);
                    
                    }
                }
            },
            callbackScope: this,
            loop: true
        });
    }
    
   startTutorialSystem() {
        let width = 540;
        let height = 960;

        // 1. TẤM KÍNH ĐEN MỜ KHỔNG LỒ (RenderTexture)
        this.rt = this.add.renderTexture(0, -2000, 1620, 2960).setDepth(999900); // Đẩy lên 999k
        this.rt.fill(0x000000, 0.75);

        // 2. VẼ PHẲNG BẢNG CHÁT (KHÔNG DÙNG CONTAINER)
        let panelX = 380; // Đẩy bảng sang mép phải
        let panelY = 480;

        // Khung nền xám
        this.tutBg = this.add.rectangle(panelX, panelY, 260, 400, 0x1a1a1a)
            .setStrokeStyle(3, 0xf1c40f)
            .setScrollFactor(0)
            .setDepth(999990); // Depth 999.990

        // Text hướng dẫn (Nằm lọt lòng khung)
        this.tutText = this.add.text(265, 310, "", { 
            font: 'bold 16px Arial', fill: '#ffffff', wordWrap: { width: 230, useAdvancedWrap: true } 
        }).setScrollFactor(0).setDepth(999991);

        // NÚT "TIẾP TỤC" PHẲNG (CẢM ỨNG CỰC NHẠY)
        this.tutNextBtn = this.add.rectangle(panelX, panelY + 140, 150, 45, 0xf1c40f)
            .setScrollFactor(0)
            .setDepth(999992)
            .setInteractive({ useHandCursor: true });

        this.tutNextTxt = this.add.text(panelX, panelY + 140, "TIẾP TỤC", { 
            font: 'bold 16px Arial', fill: '#000000' 
        }).setOrigin(0.5).setScrollFactor(0).setDepth(999993);

        // Sự kiện Click nút Tiếp Tục
        this.tutNextBtn.on('pointerdown', () => {
            this.handleTutorialNext();
        });

        // BẮT SỰ KIỆN TỰ HỦY KHI HOÀN THÀNH TUTORIAL Ở BƯỚC CUỐI
        this.tutElements = [this.tutBg, this.tutText, this.tutNextBtn, this.tutNextTxt];

        // BẮT ĐẦU BƯỚC 0
        this.showTutorialStep(0);
    }

    showTutorialStep(step) {
        this.tutorialStep = step;
        
        // Mặc định ẩn nút Tiếp Tục (Chỉ hiện khi cần đọc thoại)
        this.tutNextBtn.setVisible(false);
        this.tutNextTxt.setVisible(false);

        // Reset lại tấm kính đen mờ (Xóa các lỗ đục cũ)
        this.rt.clear();
        this.rt.fill(0x000000, 0.75);

        // Cọ vẽ hình tròn dùng để đục lỗ
        let brush = this.add.circle(0, 0, 50, 0xffffff).setVisible(false);

        switch(step) {
            case 0:
                // BƯỚC 0: Chào mừng
                this.tutText.setText("Chào mừng bạn đã đến với tiệm lẩu My Hotpot Story, bạn sẽ là chủ tiệm lẩu này, tôi sẽ giúp bạn từ những bước nhỏ nhất.");
                this.tutNextBtn.setVisible(true);
                this.tutNextTxt.setVisible(true);
                break;

            case 1:
                // BƯỚC 1: Khách vào và gọi món
                this.tutText.setText("Vị khách đầu tiên của quán, hãy đến nhận order bằng cách bấm vào yêu cầu của khách.");
                
                // Trực tiếp sinh ra đúng 1 vị khách cho Tutorial
                this.spawnTutorialCustomer(); 
                break;

            case 2:
                // BƯỚC 2: Yêu cầu vuốt màn hình sang Bếp
                this.tutText.setText("Hãy kéo vuốt màn hình sang bên phải để di chuyển vào nhà bếp.");
                break;

            case 3:
                // BƯỚC 3: Yêu cầu bấm Bếp nấu
                this.tutText.setText("Hãy bấm vào một cái bếp để chuẩn bị thức ăn.");
                
                // Đục lỗ sáng rực tại cả 4 cái Bếp nấu ở phòng Bếp (Y=-1500)
                this.stoves.forEach(stove => {
                    brush.setRadius(70);
                    this.rt.erase(brush, stove.x, stove.y + 2000); // Tọa độ Y dịch chuyển theo RenderTexture
                });
                break;

            case 4:
                // BƯỚC 4: Yêu cầu bưng đồ ăn ra phục vụ
                this.tutText.setText("Đang chuẩn bị...\n\nKhi thức ăn chín, hãy bấm vào nút BƯNG RA để phục vụ khách.");
                // (Tiêu điểm sáng sẽ tự động vẽ đè lên cái bếp nấu chín ở hàm handleStoveClick)
                break;

            case 5.1:
                this.tutText.setText("Vậy là bạn đã nắm được cách phục vụ khách hàng rồi đấy!");
                
                // =======================================================
                // TỰ ĐỘNG LƯỚT CAMERA VỀ LẠI SẢNH CHÍNH (MƯỢT MÀ TRONG 500MS)
                // =======================================================
                this.tweens.add({
                    targets: this.cameras.main,
                    scrollX: 540, // Tọa độ X của Sảnh Chính
                    duration: 500,
                    ease: 'Sine.easeInOut'
                });
                // =======================================================

                this.tutNextBtn.setVisible(true);
                this.tutNextTxt.setVisible(true);
                break;

            case 5.2:
                this.tutText.setText("Nhớ là luôn chú ý số lượng nguyên liệu còn lại trong kho.");
                
                // Đục lỗ soi sáng HUD Kho hàng ở góc trên bên trái
                brush.setRadius(100);
                this.rt.erase(brush, 540 + 130, 25 + 2000); // 130 là trung tâm text HUD kho khi đứng ở sảnh
                
                this.tutNextBtn.setVisible(true);
                this.tutNextTxt.setVisible(true);
                break;

            case 5.3:
                this.tutText.setText("Cũng như nhớ rửa bát sau mỗi lần phục vụ nếu không bạn sẽ không có bát mới.");
                
                // Teleport camera sang khu Bếp để chỉ cho người chơi bồn rửa bát
                this.cameras.main.scrollX = 0;
                
                // Đục lỗ soi sáng Bồn Rửa Bát
                brush.setRadius(110);
                this.rt.erase(brush, this.sinkX, this.sinkY + 2000);
                
                this.tutNextBtn.setVisible(true);
                this.tutNextTxt.setVisible(true);
                break;

            case 5.4:
                this.tutText.setText("Ngoài ra bạn có thể dùng tiền để mở khóa bàn mới và mở rộng quy mô nhà hàng.");
                
                // Teleport camera về lại Sảnh chính để chỉ cho người chơi bàn khóa
                this.cameras.main.scrollX = 540;
                
                // Đục lỗ soi sáng cái Bàn số 2 (Đang bị khóa)
                brush.setRadius(120);
                this.rt.erase(brush, 920, 350 + 2000);
                
                this.tutNextBtn.setVisible(true);
                this.tutNextTxt.setVisible(true);
                break;

            case 5.5:
                this.tutText.setText("Chúc bạn kinh doanh thành công và gặt hái nhiều tài lộc!");
                this.tutNextBtn.setVisible(true);
                this.tutNextTxt.setVisible(true);
                break;
        }

        brush.destroy(); // Giải phóng cọ vẽ
    }

    handleTutorialNext() {
        if (this.tutorialStep === 0) {
            this.showTutorialStep(1);
        } else if (this.tutorialStep === 5.1) {
            this.showTutorialStep(5.2);
        } else if (this.tutorialStep === 5.2) {
            this.showTutorialStep(5.3);
        } else if (this.tutorialStep === 5.3) {
            this.showTutorialStep(5.4);
        } else if (this.tutorialStep === 5.4) {
            this.showTutorialStep(5.5);
        } else if (this.tutorialStep === 5.5) {
            // KẾT THÚC TUTORIAL
            this.tutorialDone = true;
            localStorage.setItem('hotpot_tutorial_done', 'true');
            
            // Hủy toàn bộ UI hướng dẫn
            this.rt.destroy();
           this.tutElements.forEach(el => el.destroy()); 

            // Khởi động lại Timer sinh khách tự động mặc định của game
            this.time.addEvent({
                delay: 6000,
                callback: this.spawnCustomer,
                callbackScope: this,
                loop: true
            });

            console.log("Hoàn thành hướng dẫn tân thủ!");
        }
    }

    spawnTutorialCustomer() {
        // Luôn chọn khách số 1
        let customer = this.add.sprite(this.queueStartX, this.queueStartY, 'cust1_down')
            .setDisplaySize(50, 80).setDepth(4000);
        
        customer.custType = 'cust1';
        customer.state = 'WALKING_TO_TABLE';
        this.customers.push(customer);

        let table = this.tables[0]; // Luôn là Bàn 1
        table.status = 'OCCUPIED';
        customer.assignedTableId = table.id;

        // Đi bộ vào bàn
        customer.setTexture('cust1_side');
        this.tweens.add({
            targets: customer,
            x: this.doorOutsideX,
            y: this.doorOutsideY,
            duration: 1000,
            onComplete: () => {
                this.time.delayedCall(1, () => {
                    customer.setPosition(this.doorInsideX, this.doorInsideY);
                    customer.setTexture('cust1_down');
                    this.tweens.add({
                        targets: customer,
                        y: table.y + table.seatOffsetY,
                        duration: 1500,
                        onComplete: () => {
                            this.tweens.add({
                                targets: customer,
                                x: table.x + table.seatOffsetX,
                                duration: 800,
                                onComplete: () => {
                                    customer.setTexture('cust1_sit');
                                    customer.state = 'SIT_ORDERING';
                                    
                                    // Hiện bong bóng gọi món (Luôn gọi Lẩu Cay 🌶️ để khống chế nguyên liệu)
                                    customer.order = { id: 'spicy', name: '🌶️ Lẩu Cay', price: 60, cookTime: 4000, textureKey: 'pot_spicy', req: { chili: 1, beef: 2, veggies: 1 } };
                                    
                                    customer.bubbleBg = this.add.rectangle(customer.x, customer.y - 60, 110, 35, 0xffffff).setStrokeStyle(2, 0x0).setDepth(4001).setInteractive({ useHandCursor: true });
                                    customer.bubbleTxt = this.add.text(customer.x, customer.y - 60, customer.order.name, { font: 'bold 12px Arial', fill: '#000' }).setOrigin(0.5).setDepth(4002);

                                    // ĐỤC LỖ SOI SÁNG BONG BÓNG TRÊN ĐẦU KHÁCH
                                    let brush = this.add.circle(0, 0, 80, 0xffffff).setVisible(false);
                                    this.rt.erase(brush, customer.x, customer.y - 60 + 2000);
                                    brush.destroy();

                                    // Lắng nghe click bong bóng để sang Bước 2
                                    customer.bubbleBg.on('pointerup', () => {
                                        customer.state = 'WAITING_FOR_FOOD';
                                        customer.bubbleTxt.setText('⏳ Đang nấu...');
                                        customer.bubbleBg.setFillStyle(0xf1c40f);

                                        this.pendingOrders.push({
                                            customerRef: customer,
                                            recipe: customer.order.req,
                                            fullOrderData: customer.order
                                        });

                                        // CHUYỂN SANG BƯỚC 2: YÊU CẦU QUẸT SANG BẾP
                                        this.showTutorialStep(2);
                                    });
                                }
                            });
                        }
                    });
                });
            }
        });
    }

    saveInventory() {
        localStorage.setItem('hotpot_inventory', JSON.stringify(this.inventory));
    }

    createRecipeUI() {
        // Khởi tạo Container ghim tầng cao nhất
        this.recipeUI = this.add.container(0, 0).setDepth(20000).setVisible(false);
        
        // Nền đen mờ che toàn bộ map chống click nhầm
        let overlay = this.add.rectangle(0, 0, 3000, 3000, 0x000000, 0.8).setInteractive();
        
        // Bảng Menu trắng ở giữa
        let panel = this.add.rectangle(0, 0, 420, 500, 0xffffff).setStrokeStyle(4, 0x27ae60);
        let title = this.add.text(0, -210, "📜 DANH SÁCH CÔNG THỨC", { font: 'bold 24px Arial', fill: '#27ae60' }).setOrigin(0.5);
        
        this.recipeUI.add([overlay, panel, title]);

        // Danh sách 3 công thức lẩu thần thánh theo GDD
        let recipes = [
            { name: "🌶️ Lẩu Cay Tứ Xuyên", price: 60, desc: "Yêu cầu:\n• 1 Ớt Tứ Xuyên\n• 2 Ba Chỉ Bò\n• 1 Rau Thập Cẩm" },
            { name: "🌿 Lẩu Nấm Dưỡng Sinh", price: 40, desc: "Yêu cầu:\n• 1 Thảo Mộc\n• 2 Rau Thập Cẩm" },
            { name: "🍤 Lẩu Hải Sản Trường Thọ", price: 110, desc: "Yêu cầu:\n• 1 Xương Ống\n• 2 Hải Sản\n• 1 Rau Thập Cẩm" }
        ];

        recipes.forEach((rec, index) => {
            let startY = -110 + (index * 115);

            // Khung của từng công thức
            let itemBg = this.add.rectangle(0, startY, 380, 95, 0xf8f9fa).setStrokeStyle(1, 0xdcdde1);
            
            // Tên món ăn
            let nameTxt = this.add.text(-170, startY - 25, rec.name, { font: 'bold 18px Arial', fill: '#2c3e50' }).setOrigin(0, 0.5);
            
            // Mô tả nguyên liệu chi tiết
            let descTxt = this.add.text(-170, startY + 15, rec.desc, { font: '14px Arial', fill: '#7f8c8d' }).setOrigin(0, 0.5);
            
            // Số vàng thu hoạch được (Căn lề phải)
            let priceTxt = this.add.text(170, startY, `🪙 ${rec.price}`, { font: 'bold 20px Arial', fill: '#e67e22' }).setOrigin(1, 0.5);

            this.recipeUI.add([itemBg, nameTxt, descTxt, priceTxt]);
        });

        // Nút Đóng UI
        let closeBtn = this.add.rectangle(170, -210, 40, 40, 0xe74c3c).setInteractive({ useHandCursor: true });
        let closeTxt = this.add.text(170, -210, "X", { font: 'bold 20px Arial', fill: '#fff' }).setOrigin(0.5);
        closeBtn.on('pointerdown', () => {
            this.recipeUI.setVisible(false);
        });

        this.recipeUI.add([closeBtn, closeTxt]);
    }
}