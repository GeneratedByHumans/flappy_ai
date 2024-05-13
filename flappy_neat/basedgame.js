const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 320;
canvas.height = 480;

let birdSprite = new Image();
birdSprite.src = "assets/bird.png"; // Update path as necessary

let pipeSprite = new Image();
pipeSprite.src = "assets/pipe.png"; // Update path as necessary

let backgroundSprite = new Image();
backgroundSprite.src = "assets/flappybg.png"; // Update path as necessary

let bird = {
  x: 50,
  y: 150,
  width: 43,
  height: 30,
  gravity: 0.4,
  lift: -7,
  velocity: 0,
};

let pipes = [];
let pipeWidth = 80;
let pipeGap = 150;
let frame = 0;
let pipeInterval = 110;

let score = 0;
let highScore = 0;
let gamePaused = false;

function increaseScore() {
  score++;
  if (score > highScore) {
    highScore = score;
  }
}

function displayScores() {
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "16px Arial";
  ctx.textAlign = "right";
  ctx.fillText(`Score: ${score}`, canvas.width - 10, 30);
  ctx.fillText(`High Score: ${highScore}`, canvas.width - 10, 50);
}

function drawBird() {
  ctx.save(); // Save the current canvas context
  ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2); // Move the rotation point to the center of the bird
  let rotation = Math.max(
    Math.min(bird.velocity / 10, Math.PI / 2),
    -Math.PI / 2
  ); // Clamp the rotation between -90 and 90 degrees
  ctx.rotate(rotation);
  ctx.drawImage(
    birdSprite,
    -bird.width / 2,
    -bird.height / 2,
    bird.width,
    bird.height
  ); // Draw the bird at adjusted position
  ctx.restore(); // Restore the original canvas context
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
    let pipeTotalHeight = pipeSprite.height - 150; // Total drawable height of the pipes (sprite height minus gap)
    let topPipeHeight = pipe.top;
    let bottomPipeHeight = pipeTotalHeight - topPipeHeight;

    // Calculate the Y position of the top pipe on the sprite
    let topPipeSpriteY = (pipeSprite.height - 150) / 2 - topPipeHeight;

    // Draw top part of the pipe
    ctx.drawImage(
      pipeSprite,
      0,
      topPipeSpriteY,
      pipeWidth,
      topPipeHeight,
      pipe.x,
      0,
      pipeWidth,
      topPipeHeight
    );

    // Calculate the Y position where the bottom pipe should start on the canvas
    let bottomPipeY = topPipeHeight + 150;

    // Calculate the Y position of the bottom pipe on the sprite
    let bottomPipeSpriteY = (pipeSprite.height + 150) / 2;

    // Draw bottom part of the pipe
    ctx.drawImage(
      pipeSprite,
      0,
      bottomPipeSpriteY,
      pipeWidth,
      bottomPipeHeight,
      pipe.x,
      bottomPipeY,
      pipeWidth,
      bottomPipeHeight
    );
  });
}

function updatePipes() {
  if (frame % pipeInterval === 0) {
    let top = Math.random() * (canvas.height - pipeGap - 20) + 10;
    pipes.push({ x: canvas.width, top: top, scored: false });
  }
  pipes.forEach((pipe) => {
    if (!pipe.scored && pipe.x + pipeWidth < bird.x) {
      increaseScore();
      pipe.scored = true; // Ensure score is only increased once per pipe
    }
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
      gameOver();
    }
  });
}

function gameOver() {
  gamePaused = true;
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.font = "24px Arial";
  ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2);
  ctx.fillText("Score: " + score, canvas.width / 2, canvas.height / 2 + 30);
  ctx.fillText("Click to Restart", canvas.width / 2, canvas.height / 2 + 60);
}

canvas.addEventListener("click", () => {
  if (gamePaused) {
    resetGame();
    gamePaused = false;
  } else {
    bird.velocity = bird.lift;
  }
});

function resetGame() {
  bird.y = 150;
  bird.velocity = 0;
  pipes = [];
  score = 0;
  frame = 0;
  gamePaused = false; // Ensure the game is marked as not paused
  requestAnimationFrame(gameLoop); // Restart the game loop
}

function gameLoop() {
  if (!gamePaused) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundSprite, 0, 0, canvas.width, canvas.height);
    updateBird();
    drawBird();
    updatePipes();
    drawPipes();
    checkCollision();
    displayScores();
    frame++;
    requestAnimationFrame(gameLoop);
  }
}

canvas.addEventListener("click", () => {
  bird.velocity = bird.lift;
});

gameLoop();
