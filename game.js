// Game Canvas and Context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');

// Game Variables
let score = 0;
let gameRunning = true;
let keys = {};
let backgroundOffset = 0; // For scrolling background effect

// Asset loading
const assets = {
    unicorn: new Image(),
    cloud: new Image(),
    rainbow: new Image()
};

// Asset paths
assets.unicorn.src = 'assets/20250615_1745_Cute Unicorn Asset_simple_compose_01jxt0sr7afjeaw4chx08w71k1.png';
assets.cloud.src = 'assets/20250615_1755_Cloud Game Asset_simple_compose_01jxt1d6qve3vve0wy7gnkebqm.png';
assets.rainbow.src = 'assets/20250615_1753_Cute Rainbow Asset_simple_compose_01jxt19f5rfe79y1b3j9p8a435.png';

// Game Objects
const unicorn = {
    x: 200, // Fixed position - unicorn stays in place for side-scrolling effect
    y: 450, // Ground level
    width: 120,
    height: 100,
    velocityY: 0,
    speed: 4, // This is now the background scroll speed
    jumpPower: -18, // Increased jump power to reach clouds
    isJumping: false,
    groundY: 450,
    animationOffset: 0
};

const clouds = [];
const rainbows = [];
const backgroundClouds = []; // Background clouds for parallax effect

// Physics constants
const gravity = 0.8;
const groundLevel = 450;

// Asset loading counter
let assetsLoaded = 0;
const totalAssets = 3;

// Asset load event listeners
Object.values(assets).forEach(asset => {
    asset.onload = () => {
        assetsLoaded++;
        if (assetsLoaded === totalAssets) {
            initGame();
        }
    };
});

// Initialize game
function initGame() {
    // Generate initial clouds
    generateClouds();
    generateRainbows();
    generateBackgroundClouds();
    
    // Start game loop
    gameLoop();
}

// Generate clouds at various heights
function generateClouds() {
    for (let i = 0; i < 12; i++) {
        // Create clouds at different levels for more variety
        let cloudLevel;
        if (i % 3 === 0) {
            cloudLevel = 280 + Math.random() * 40; // High level (280-320)
        } else if (i % 3 === 1) {
            cloudLevel = 340 + Math.random() * 40; // Mid level (340-380)
        } else {
            cloudLevel = 380 + Math.random() * 40; // Low level (380-420)
        }
        
        clouds.push({
            x: 300 + i * 160, // Even closer together
            y: cloudLevel,
            width: 150,
            height: 80,
            passed: false
        });
    }
}

// Generate rainbows to collect
function generateRainbows() {
    for (let i = 0; i < 8; i++) {
        rainbows.push({
            x: 350 + i * 200, // More frequent rainbows
            y: 200 + Math.random() * 150, // Spread across different heights
            width: 60,
            height: 60,
            collected: false,
            bobOffset: Math.random() * Math.PI * 2
        });
    }
}

// Generate background clouds for parallax effect
function generateBackgroundClouds() {
    for (let i = 0; i < 8; i++) {
        backgroundClouds.push({
            x: Math.random() * canvas.width * 2,
            y: 50 + Math.random() * 100,
            width: 100 + Math.random() * 50,
            height: 50 + Math.random() * 30,
            speed: 0.5 + Math.random() * 1.5,
            opacity: 0.3 + Math.random() * 0.4
        });
    }
}

// Input handling
canvas.addEventListener('click', (e) => {
    jump();
});

canvas.addEventListener('mousedown', (e) => {
    jump();
});

// Touch support for mobile
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    jump();
});

// Jump function
function jump() {
    if (!unicorn.isJumping) {
        unicorn.velocityY = unicorn.jumpPower;
        unicorn.isJumping = true;
    }
}

// Update game state
function update() {
    // Update background scrolling
    backgroundOffset += unicorn.speed;
    
    // Update unicorn physics
    updateUnicorn();
    
    // Move clouds and rainbows
    updateClouds();
    updateRainbows();
    updateBackgroundClouds();
    
    // Check collisions
    checkCollisions();
    
    // Generate new objects
    manageObjects();
}

function updateUnicorn() {
    // Apply gravity
    unicorn.velocityY += gravity;
    unicorn.y += unicorn.velocityY;
    
    // Ground collision
    if (unicorn.y >= unicorn.groundY) {
        unicorn.y = unicorn.groundY;
        unicorn.velocityY = 0;
        unicorn.isJumping = false;
    }
    
    // Unicorn stays in fixed horizontal position for side-scrolling effect
    // No horizontal movement - background moves instead
    
    // Animation offset for sprite movement (faster when falling)
    if (unicorn.velocityY > 0) {
        unicorn.animationOffset += 0.4; // Faster animation when falling
    } else {
        unicorn.animationOffset += 0.2; // Normal animation
    }
}

function updateClouds() {
    clouds.forEach((cloud, index) => {
        cloud.x -= unicorn.speed;
        
        // Remove clouds that have moved off screen
        if (cloud.x + cloud.width < 0) {
            clouds.splice(index, 1);
        }
    });
}

function updateRainbows() {
    rainbows.forEach((rainbow, index) => {
        rainbow.x -= unicorn.speed;
        
        // Add bobbing animation
        rainbow.bobOffset += 0.1;
        
        // Remove rainbows that have moved off screen (both collected and uncollected)
        if (rainbow.x + rainbow.width < 0) {
            rainbows.splice(index, 1);
        }
    });
}

function updateBackgroundClouds() {
    backgroundClouds.forEach((cloud, index) => {
        cloud.x -= cloud.speed; // Different speed for parallax effect
        
        // Reset cloud position when it goes off screen
        if (cloud.x + cloud.width < 0) {
            cloud.x = canvas.width + Math.random() * 200;
            cloud.y = 50 + Math.random() * 100;
        }
    });
}

function checkCollisions() {
    // Check rainbow collection
    rainbows.forEach(rainbow => {
        if (!rainbow.collected && 
            unicorn.x < rainbow.x + rainbow.width &&
            unicorn.x + unicorn.width > rainbow.x &&
            unicorn.y < rainbow.y + rainbow.height &&
            unicorn.y + unicorn.height > rainbow.y) {
            
            rainbow.collected = true;
            score += 10;
            updateScore();
        }
    });
    
    // Reset ground level first - unicorn should fall unless on a cloud
    let onCloud = false;
    let currentCloudY = 450; // Default ground level
    
    // Check cloud platform collision (improved platform mechanics)
    clouds.forEach(cloud => {
        // Check if unicorn is landing on top of cloud
        if (unicorn.x + 10 < cloud.x + cloud.width &&
            unicorn.x + unicorn.width - 10 > cloud.x &&
            unicorn.y + unicorn.height >= cloud.y &&
            unicorn.y + unicorn.height <= cloud.y + 25 &&
            unicorn.velocityY >= 0) {
            
            // Land on cloud
            unicorn.y = cloud.y - unicorn.height;
            unicorn.velocityY = 0;
            unicorn.isJumping = false;
            currentCloudY = cloud.y - unicorn.height;
            onCloud = true;
        }
        
        // Check if unicorn is standing on cloud (for continuous standing)
        if (unicorn.x + 10 < cloud.x + cloud.width &&
            unicorn.x + unicorn.width - 10 > cloud.x &&
            Math.abs(unicorn.y + unicorn.height - cloud.y) <= 5) {
            onCloud = true;
            currentCloudY = cloud.y - unicorn.height;
        }
    });
    
    // Update ground level - fall if not on cloud
    unicorn.groundY = currentCloudY;
    
    // If not on any cloud and above ground, make sure unicorn can fall
    if (!onCloud && unicorn.y < 450) {
        unicorn.groundY = 450;
    }
}

function manageObjects() {
    // Add new clouds
    if (clouds.length < 12) {
        const lastCloud = clouds[clouds.length - 1];
        if (!lastCloud || lastCloud.x < canvas.width - 120) {
            // Generate clouds at different levels like in initial generation
            let cloudLevel;
            const levelType = Math.floor(Math.random() * 3);
            if (levelType === 0) {
                cloudLevel = 280 + Math.random() * 40; // High level
            } else if (levelType === 1) {
                cloudLevel = 340 + Math.random() * 40; // Mid level
            } else {
                cloudLevel = 380 + Math.random() * 40; // Low level
            }
            
            clouds.push({
                x: canvas.width + Math.random() * 80,
                y: cloudLevel,
                width: 150,
                height: 80,
                passed: false
            });
        }
    }
    
    // Add new rainbows
    if (rainbows.length < 10) {
        const lastRainbow = rainbows[rainbows.length - 1];
        if (!lastRainbow || lastRainbow.x < canvas.width - 200) {
            rainbows.push({
                x: canvas.width + Math.random() * 150,
                y: 200 + Math.random() * 150, // Spread across different heights
                width: 60,
                height: 60,
                collected: false,
                bobOffset: Math.random() * Math.PI * 2
            });
        }
    }
}

// Render game
function render() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background gradient (sky to grass)
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB'); // Sky blue
    gradient.addColorStop(0.7, '#98FB98'); // Light green
    gradient.addColorStop(1, '#228B22'); // Darker green
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw background clouds for parallax effect
    backgroundClouds.forEach(cloud => {
        ctx.globalAlpha = cloud.opacity;
        ctx.drawImage(assets.cloud, cloud.x, cloud.y, cloud.width, cloud.height);
    });
    ctx.globalAlpha = 1.0; // Reset alpha
    
    // Draw scrolling grass pattern
    ctx.strokeStyle = '#32CD32';
    ctx.lineWidth = 4;
    const grassY = groundLevel + unicorn.height;
    
    // Draw multiple grass lines for scrolling effect
    for (let i = -50; i < canvas.width + 50; i += 20) {
        const x = (i - (backgroundOffset % 20));
        ctx.beginPath();
        ctx.moveTo(x, grassY);
        ctx.lineTo(x + 15, grassY);
        ctx.stroke();
        
        // Draw small grass blades
        ctx.beginPath();
        ctx.moveTo(x + 5, grassY);
        ctx.lineTo(x + 5, grassY - 8);
        ctx.moveTo(x + 10, grassY);
        ctx.lineTo(x + 10, grassY - 6);
        ctx.stroke();
    }
    
    // Draw clouds
    clouds.forEach(cloud => {
        ctx.drawImage(assets.cloud, cloud.x, cloud.y, cloud.width, cloud.height);
    });
    
    // Draw rainbows with bobbing animation
    rainbows.forEach(rainbow => {
        if (!rainbow.collected) {
            const bobY = rainbow.y + Math.sin(rainbow.bobOffset) * 5;
            ctx.drawImage(assets.rainbow, rainbow.x, bobY, rainbow.width, rainbow.height);
        }
    });
    
    // Draw unicorn (flipped to face right)
    ctx.save();
    ctx.scale(-1, 1); // Flip horizontally
    ctx.drawImage(assets.unicorn, -unicorn.x - unicorn.width, unicorn.y, unicorn.width, unicorn.height);
    ctx.restore();
    
    // Draw simple shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.ellipse(unicorn.x + unicorn.width/2, unicorn.groundY + unicorn.height + 10, 40, 10, 0, 0, 2 * Math.PI);
    ctx.fill();
}

// Update score display
function updateScore() {
    scoreElement.textContent = score;
}

// Main game loop
function gameLoop() {
    if (gameRunning) {
        update();
        render();
        requestAnimationFrame(gameLoop);
    }
}

// Error handling for asset loading
Object.values(assets).forEach((asset, index) => {
    asset.onerror = () => {
        console.error(`Failed to load asset ${index}`);
    };
});

// Initialize score display
updateScore(); 