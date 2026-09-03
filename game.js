const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Fixed internal tracking dimensions
canvas.width = 800;
canvas.height = 500;

let gameActive = false;
let score = 0;
let baseSpeed = 7;
let currentSpeed = 7;
let playerLane = 1; 
let playerX = 400;
let targetX = 400;
let obstacles = [];
let gameTime = 0;

// FIXED: Defined clearly so code never strips the list array
const lanePositions = Array.of(160, 400, 640);

// Key controls configuration
window.addEventListener('keydown', function(e) {
    if (!gameActive) return;
    if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        if (playerLane > 0) playerLane--;
    }
    if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        if (playerLane < 2) playerLane++;
    }
});

// Mobile gesture configuration
let touchStartX = 0;
window.addEventListener('touchstart', function(e) {
    touchStartX = e.changedTouches[0].screenX;
}, { passive: true });

window.addEventListener('touchend', function(e) {
    if (!gameActive) return;
    let touchEndX = e.changedTouches[0].screenX;
    let diffX = touchEndX - touchStartX;

    if (diffX > 40) { 
        if (playerLane < 2) playerLane++;
    } else if (diffX < -40) { 
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
    document.getElementById('screenSub').innerText = "System compromised. Final Score: " + Math.floor(score);
    document.getElementById('actionBtn').innerText = "REBOOT RUN";
    document.getElementById('overlay').style.display = 'flex';
}

function spawnObstacle() {
    if (Math.random() < 0.02 + (gameTime * 0.000005)) {
        let lane = Math.floor(Math.random() * 3);
        
        if (obstacles.length > 0 && obstacles[obstacles.length - 1].z > 450 && obstacles[obstacles.length - 1].lane === lane) return;
        
        obstacles.push({
            lane: lane,
            z: 500, 
            width: 140,
            height: 45
        });
    }
}

function animate() {
    if (!gameActive) return;
    
    gameTime++;
    score += 0.1;
    currentSpeed = baseSpeed + (gameTime * 0.001); 
    document.getElementById('scoreDisplay').innerText = "SCORE: " + Math.floor(score);

    // Render Canvas Backdrop
    ctx.fillStyle = '#050512';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let horizonX = 400, horizonY = 180;
    let groundY = 500;

    // FIXED: Formatted safely so borders load correctly
    let laneEdges = Array.of(40, 280, 520, 760); 
    
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 3;
    for (let i = 0; i < laneEdges.length; i++) {
        ctx.beginPath();
        ctx.moveTo(horizonX + (laneEdges[i] - horizonX) * 0.05, horizonY);
        ctx.lineTo(laneEdges[i], groundY);
        ctx.stroke();
    }

    // Perspective floor updates
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

    // Manage falling hazards
    spawnObstacle();
    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i];
        obs.z -= currentSpeed; 

        let scale = (500 - obs.z) / 320; 
        if (scale < 0) scale = 0;

        let startLaneX = horizonX + (lanePositions[obs.lane] - horizonX) * 0.05;
        let renderX = startLaneX + (lanePositions[obs.lane] - startLaneX) * scale;
        let renderY = horizonY + (groundY - horizonY) * scale;
        
        let w3D = obs.width * scale;
        let h3D = obs.height * scale;

        ctx.fillStyle = '#ff007f';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff007f';
        ctx.fillRect(renderX - w3D / 2, renderY - h3D, w3D, h3D);
        ctx.shadowBlur = 0; 

        if (obs.z <= 70 && obs.z >= 20) {
            if (playerLane === obs.lane) {
                gameOver();
                return;
            }
        }

        if (obs.z < 0) obstacles.splice(i, 1);
    }

    // Left/Right character animation calculations
    targetX = lanePositions[playerLane];
    playerX += (targetX - playerX) * 0.25;

    let playerY = 440;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.ellipse(playerX, playerY + 25, 30, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#00f0ff';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00f0ff';
    ctx.fillRect(playerX - 22, playerY + 12, 44, 8);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(playerX - 8, playerY - 35, 16, 45); 
    ctx.fillStyle = '#ff007f';
    ctx.fillRect(playerX - 10, playerY - 48, 20, 13); 
    
    ctx.shadowBlur = 0; 

    requestAnimationFrame(animate);
}
