const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 320;
canvas.height = 480;

let bird = {
  x: 50,
  y: 150,
  width: 20,
  height: 20,
  gravity: 0.4,
  lift: -7,
  velocity: 0,
};

let pipes = [];
let pipeWidth = 80;
let pipeGap = 150;
let frame = 0;
let pipeInterval = 110;

function drawBird() {
  ctx.fillStyle = "yellow";
  ctx.fillRect(bird.x, bird.y, bird.width, bird.height);
}

function updateBird() {
  bird.velocity += bird.gravity;
  bird.y += bird.velocity;

  if (bird.y + bird.height > canvas.height) {
    bird.y = canvas.height - bird.height;
    bird.velocity = 0;
  } else if (bird.y < 0) {
    bird.y = 0;
    bird.velocity = 0;
  }
}

function drawPipes() {
  pipes.forEach((pipe) => {
    ctx.fillStyle = "green";
    ctx.fillRect(pipe.x, 0, pipeWidth, pipe.top);
    ctx.fillRect(pipe.x, pipe.top + pipeGap, pipeWidth, canvas.height);
  });
}

function updatePipes() {
  if (frame % pipeInterval === 0) {
    let top = Math.random() * (canvas.height - pipeGap - 20) + 10;
    pipes.push({ x: canvas.width, top: top });
  }
  pipes.forEach((pipe) => {
    pipe.x -= 2;
  });
  pipes = pipes.filter((pipe) => pipe.x + pipeWidth > 0);
}

function checkCollision() {
  pipes.forEach((pipe) => {
    if (
      bird.x < pipe.x + pipeWidth &&
      bird.x + bird.width > pipe.x &&
      (bird.y < pipe.top || bird.y + bird.height > pipe.top + pipeGap)
    ) {
      resetGame();
    }
  });
}

function resetGame() {
  bird.y = 150;
  bird.velocity = 0;
  pipes = [];
  frame = 0;
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  updateBird();
  drawBird();
  updatePipes();
  drawPipes();
  checkCollision();
  frame++;
  requestAnimationFrame(gameLoop);
}

canvas.addEventListener("click", () => {
  bird.velocity = bird.lift;
});

gameLoop();
