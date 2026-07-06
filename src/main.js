const config = {
    type: Phaser.AUTO,
    width: 540,
    height: 960, // Tỷ lệ dọc 9:16
    backgroundColor: '#2c3e50', // Màu nền mặc định
    // KHÔNG KHAI BÁO PHYSICS Ở ĐÂY
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [BootScene, GameScene]
};

const game = new Phaser.Game(config);