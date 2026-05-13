const canvas = document.getElementById("snake");
const snakePanel = document.getElementById("snake-panel");
const ctx = canvas?.getContext("2d");

const grid = 16;
const size = canvas ? canvas.width / grid : 0;

let snake = [{ x: 8, y: 8 }];
let dir = { x: 1, y: 0 };
let food = spawnFood();
let score = 0;

function spawnFood() {
    return {
        x: Math.floor(Math.random() * grid),
        y: Math.floor(Math.random() * grid)
    };
}

document.addEventListener("keydown", e => {
    if (snakePanel?.hidden || !ctx) return;
    if (e.key === "ArrowUp" && dir.y === 0) dir = { x: 0, y: -1 };
    if (e.key === "ArrowDown" && dir.y === 0) dir = { x: 0, y: 1 };
    if (e.key === "ArrowLeft" && dir.x === 0) dir = { x: -1, y: 0 };
    if (e.key === "ArrowRight" && dir.x === 0) dir = { x: 1, y: 0 };
});

function loop() {
    if (!ctx || !canvas) return;
    const head = {
        x: snake[0].x + dir.x,
        y: snake[0].y + dir.y
    };

    // wall wrap
    head.x = (head.x + grid) % grid;
    head.y = (head.y + grid) % grid;

    // collision with self
    for (let part of snake) {
        if (part.x === head.x && part.y === head.y) {
            snake = [{ x: 8, y: 8 }];
            dir = { x: 1, y: 0 };
            score = 0;
            food = spawnFood();
        }
    }

    snake.unshift(head);

    // eat food
    if (head.x === food.x && head.y === food.y) {
        score++;
        food = spawnFood();
    } else {
        snake.pop();
    }

    draw();
}

function draw() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // food (soft neon)
    ctx.fillStyle = "rgba(120, 120, 255, 0.9)";
    ctx.shadowColor = "rgba(120,120,255,0.6)";
    ctx.shadowBlur = 10;
    ctx.fillRect(food.x * size, food.y * size, size - 2, size - 2);

    // snake
    ctx.shadowBlur = 0;
    snake.forEach((p, i) => {
        ctx.fillStyle = i === 0
            ? "rgba(255,255,255,0.9)"
            : "rgba(255,255,255,0.35)";
        ctx.fillRect(p.x * size, p.y * size, size - 2, size - 2);
    });

    // score
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "12px sans-serif";
    ctx.fillText("Score: " + score, 10, 16);
}

let gameIntervalId = null;

function resetSnake() {
    snake = [{ x: 8, y: 8 }];
    dir = { x: 1, y: 0 };
    score = 0;
    food = spawnFood();
}

function startSnakeLoop() {
    if (gameIntervalId !== null || !ctx) return;
    gameIntervalId = setInterval(loop, 120);
}

function stopSnakeLoop() {
    if (gameIntervalId === null) return;
    clearInterval(gameIntervalId);
    gameIntervalId = null;
}

/**
 * navigator.onLine is often wrong after Wi‑Fi drops. Combined image + fetch
 * probes tolerate different browser / privacy-toolbar behavior better than fetch alone.
 */
function pingConnectivityImage(timeoutMs = 2800) {
    return new Promise((resolve) => {
        let settled = false;
        const img = new Image();
        const done = (ok) => {
            if (settled) return;
            settled = true;
            clearTimeout(t);
            img.onload = img.onerror = null;
            img.removeAttribute("src");
            resolve(ok);
        };
        const t = setTimeout(() => done(false), timeoutMs);
        img.onload = () => done(true);
        img.onerror = () => done(false);
        img.src =
            `https://www.google.com/favicon.ico?connectivity_ck=${Date.now()}`;
    });
}

function pingConnectivityFetch(timeoutMs = 2800) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(
        `https://www.gstatic.com/generate_204?ck=${Date.now()}`,
        { cache: "no-store", mode: "no-cors", signal: controller.signal }
    )
        .then(() => true)
        .catch(() => false)
        .finally(() => clearTimeout(id));
}

let connectivityRefreshRunning = false;

async function refreshSnakeConnectivity() {
    if (!snakePanel || !ctx || connectivityRefreshRunning) return;
    connectivityRefreshRunning = true;

    try {
        let effectiveOffline = navigator.onLine === false;

        if (!effectiveOffline) {
            const [viaImg, viaFetch] = await Promise.all([
                pingConnectivityImage(),
                pingConnectivityFetch(),
            ]);
            effectiveOffline = !viaImg && !viaFetch;
        }

        const shouldShowSnake = effectiveOffline;
        const wasShowing = !snakePanel.hidden;

        snakePanel.hidden = !shouldShowSnake;

        if (shouldShowSnake) {
            if (!wasShowing) resetSnake();
            draw();
            startSnakeLoop();
        } else {
            stopSnakeLoop();
        }
    } finally {
        connectivityRefreshRunning = false;
    }
}

function scheduleConnectivityCheck() {
    void refreshSnakeConnectivity();
}

function scheduleConnectivityCheckWhileVisible() {
    if (document.visibilityState !== "visible") return;
    void refreshSnakeConnectivity();
}

window.addEventListener("offline", scheduleConnectivityCheck);
window.addEventListener("online", scheduleConnectivityCheck);
window.addEventListener("visibilitychange", scheduleConnectivityCheck);
window.addEventListener("focus", scheduleConnectivityCheck);

scheduleConnectivityCheck();
setInterval(scheduleConnectivityCheckWhileVisible, 4500);
