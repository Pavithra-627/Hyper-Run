const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Fixed logical internal layout resolution
canvas.width = 800;
canvas.height = 500;

let gameActive = false;
let score = 0;
let baseSpeed = 7;
let currentSpeed = 7;
let playerLane = 1; // 0: Left, 1: Center, 2: Right
let playerX = 400;
let targetX = 400;
let obstacles = [];
let gameTime = 0;

const lanePositions =; // Screen coordinates for target lanes

// Keyboard Controls
window.addEventListener('keydown', (e) => {
    if (!gameActive) return;
    if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        if (playerLane > 0) playerLane--;
    }
    if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        if (playerLane < 2) playerLane++;
    }
});

// Mobile Touch Swipe Controls
let touchStartX = 0;
window.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
}, { passive: true });

window.addEventListener('touchend', (e) => {
    if (!gameActive) return;
    let touchEndX = e.changedTouches[0].screenX;
    let diffX = touchEndX - touchStartX;

    if (diffX > 40) { // Swipe Right
        if (playerLane < 2) playerLane++;
    } else if (diffX < -40) { // Swipe Left
        if (playerLane > 0) playerLane--;
    }
}, { passive: true });

function startGame() {
    document.getElementById('overlay').style.display = 'none';
    score = 0;
    currentSpeed = baseSpeed;
    playerLane = 1;
    playerX = 400;
    obstacles = [];
    gameTime = 0;
    gameActive = true;
    animate();
}

function gameOver() {
    gameActive = false;
    document.getElementById('screenTitle').innerText = "CRASH DETECTED";
    document.getElementById('screenSub').innerText = `System compromised. Final Score: ${Math.floor(score)}`;
    document.getElementById('actionBtn').innerText = "REBOOT RUN";
    document.getElementById('overlay').style.display = 'flex';
}

function spawnObstacle() {
    // Spawns obstacles dynamically over time
    if (Math.random() < 0.02 + (gameTime * 0.000005)) {
        let lane = Math.floor(Math.random() * 3);
        
        // Ensure obstacles don't stack directly on top of old ones instantly
        if (obstacles.length > 0 && obstacles[obstacles.length - 1].z > 450 && obstacles[obstacles.length - 1].lane === lane) return;
        
        obstacles.push({
            lane: lane,
            z: 500, // Distance away on the horizon
            width: 140,
            height: 45
        });
    }
}

function animate() {
    if (!gameActive) return;
    
    gameTime++;
    score += 0.1;
    currentSpeed = baseSpeed + (gameTime * 0.001); // Slowly increase velocity
    document.getElementById('scoreDisplay').innerText = `SCORE: ${Math.floor(score)}`;

    // Draw Cyberpunk Background Sky
    ctx.fillStyle = '#050512';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Horizon Variables (Vanishing Point mapping)
    let horizonX = 400, horizonY = 180;
    let groundY = 500;

    // Draw Neon Lanes
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 3;
    let laneEdges =; // Bottom width layout
    
    for (let i = 0; i < laneEdges.length; i++) {
        ctx.beginPath();
        ctx.moveTo(horizonX + (laneEdges[i] - horizonX) * 0.05, horizonY);
        ctx.lineTo(laneEdges[i], groundY);
        ctx.stroke();
    }

    // Moving Gridlines (creates sensation of speed)
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
    ctx.lineWidth = 1;
    let lineOffset = (gameTime * currentSpeed) % 40;
    for (let y = horizonY; y < groundY; y += 30) {
        let progressiveY = y + lineOffset * ((y - horizonY) / 320);
        if (progressiveY < groundY) {
            ctx.beginPath();
            ctx.moveTo(0, progressiveY);
            ctx.lineTo(canvas.width, progressiveY);
            ctx.stroke();
        }
    }

    // Process & Render Obstacles
    spawnObstacle();
    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i];
        obs.z -= currentSpeed; // Moves toward player view

        // 3D Perspective Scale Calculation
        let scale = (500 - obs.z) / 320; 
        if (scale < 0) scale = 0;

        let startLaneX = horizonX + (lanePositions[obs.lane] - horizonX) * 0.05;
        let renderX = startLaneX + (lanePositions[obs.lane] - startLaneX) * scale;
        let renderY = horizonY + (groundY - horizonY) * scale;
        
        let w3D = obs.width * scale;
        let h3D = obs.height * scale;

        // Draw Laser Wall
        ctx.fillStyle = '#ff007f';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff007f';
        ctx.fillRect(renderX - w3D / 2, renderY - h3D, w3D, h3D);
        ctx.shadowBlur = 0; // Clear shadow buffer for performance

        // Frame Collision Window Checking
        if (obs.z <= 70 && obs.z >= 20) {
            if (playerLane === obs.lane) {
                gameOver();
                return;
            }
        }

        // Clean up passed obstacles
        if (obs.z < 0) obstacles.splice(i, 1);
    }

    // Smooth Side-to-Side Player Lane Movement Lerping
    targetX = lanePositions[playerLane];
    playerX += (targetX - playerX) * 0.25;

    // Draw Character (Cyberpunk Rider)
    let playerY = 440;
    
    // Board Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.ellipse(playerX, playerY + 25, 30, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glow Hoverboard
    ctx.fillStyle = '#00f0ff';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00f0ff';
    ctx.fillRect(playerX - 22, playerY + 12, 44, 8);

    // Rider Torso and Helmet
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(playerX - 8, playerY - 35, 16, 45); // Suit
    ctx.fillStyle = '#ff007f';
    ctx.fillRect(playerX - 10, playerY - 48, 20, 13); // Cyber Helmet
    
    ctx.shadowBlur = 0; // Turn off shadows for next loop

    requestAnimationFrame(animate);
}
