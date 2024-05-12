const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 320;
canvas.height = 480;

let birdSprite = new Image();
birdSprite.src = "assets/bird.png";
let pipeSprite = new Image();
pipeSprite.src = "assets/pipe.png";
let backgroundSprite = new Image();
backgroundSprite.src = "assets/flappybg.png";

let pipes = [];
let pipeWidth = 80;
let pipeGap = 160;
let frame = 0;
let pipeInterval = 110;

let score = 0;
let highScore = 0;
let gamePaused = false;

let birds = [];
let neat;

let totalImages = 3;
let imagesLoaded = 0;

function onImageLoad() {
  imagesLoaded++;
  if (imagesLoaded === totalImages) {
    initNeat();
    requestAnimationFrame(gameLoop); // Start the animation
  }
}

birdSprite.onload = onImageLoad;
pipeSprite.onload = onImageLoad;
backgroundSprite.onload = onImageLoad;

birdSprite.onerror = () => alert("Error loading the bird sprite.");
pipeSprite.onerror = () => alert("Error loading the pipe sprite.");
backgroundSprite.onerror = () => alert("Error loading the background sprite.");

function initBirds() {
  birds = [];
  for (let i = 0; i < neat.popsize; i++) {
    let brain = neat.population[i];
    birds[i] = {
      x: 50,
      y: 150,
      width: 43,
      height: 30,
      gravity: 0.6,
      lift: -15,
      velocity: 0,
      alive: true,
      brain: brain,
      aliveTime: 0, // Initialize alive time
    };
    brain.score = 0;
  }
}

function calculateFitness(bird) {
  let survivalBonus = bird.aliveTime; // Reward each frame of survival.
  let scoreBonus = bird.score * 100; // High reward for each pipe passed to emphasize goal.
  return survivalBonus + scoreBonus - jumpPenalty;
}

function updateNeatFitness() {
  neat.population.forEach((genome, index) => {
    genome.score = calculateFitness(birds[index]);
  });
}

function initNeat() {
  neat = new neataptic.Neat(
    6, // Number of inputs
    1, // Number of outputs
    updateNeatFitness,
    {
      mutation: neataptic.methods.mutation.ALL,
      popsize: 500,
      elitism: Math.round(0.05 * 100),
      mutationRate: 0.3,
      network: new neataptic.architect.Random(6, 4, 1, {
        activation: "ReLU",
      }),
    }
  );
  initBirds();
}
function handlePipes() {
  if (frame % pipeInterval === 0) {
    generatePipe();
  }
  updatePipes();
  drawPipes();
}

function handleBirds() {
  birds.forEach((bird) => {
    if (bird.alive) {
      bird.aliveTime++; // Increment alive time
      updateBird(bird);
      drawBird(bird);
    }
  });
}

function displayScores() {
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "16px Arial";
  ctx.textAlign = "right";
  ctx.fillText(`Score: ${score}`, canvas.width - 10, 30);
  ctx.fillText(`High Score: ${highScore}`, canvas.width - 10, 50);

  ctx.textAlign = "left";
  ctx.fillText(`Generation: ${neat.generation}`, 10, 30);
  let aliveCount = birds.filter((bird) => bird.alive).length;
  ctx.fillText(`Alive: ${aliveCount}`, 10, 50);
}

function resetGame() {
  birds.forEach((bird) => {
    bird.y = 150;
    bird.velocity = 0;
    bird.alive = true;
    bird.brain.score = 0; // Reset score for the bird's brain if necessary
  });
  pipes = [];
  score = 0;
  frame = 0;
  gamePaused = false;
  requestAnimationFrame(gameLoop);
  initBirds();
}

function getBirdInputs(bird, pipes) {
  let nextPipe = pipes.find((pipe) => pipe.x + pipeWidth >= bird.x);
  if (nextPipe) {
    let inputs = [
      (bird.y - (nextPipe.top + pipeGap / 2)) / canvas.height, // Normalized vertical distance to the center of the gap
      bird.velocity / 10, // Normalized velocity
      (canvas.height - bird.y) / canvas.height, // Normalized distance from the bottom
      (nextPipe.x - bird.x) / canvas.width, // Normalized horizontal distance to next pipe
      nextPipe.top / canvas.height, // Normalized height of top pipe
      (canvas.height - (nextPipe.top + pipeGap)) / canvas.height, // Normalized height of bottom pipe
    ];
    return inputs;
  }
  return []; // Return empty array if no next pipe exists
}

let lastTime = 0;
const fpsInterval = 1000 / 60; // 1000 milliseconds divided by 60 fps

function gameLoop(timestamp) {
  const elapsed = timestamp - lastTime;
  if (elapsed > fpsInterval) {
    lastTime = timestamp - (elapsed % fpsInterval);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundSprite, 0, 0, canvas.width, canvas.height);

    if (frame % pipeInterval === 0) {
      generatePipe();
    }

    birds.forEach((bird) => {
      if (bird.alive) {
        let inputs = getBirdInputs(bird, pipes);
        if (inputs.length > 0) {
          // Ensure inputs are not empty
          let output = bird.brain.activate(inputs);
          if (output[0] > 0.5) {
            bird.velocity += bird.lift; // Bird decides to jump
          }
        }
        updateBird(bird);
        drawBird(bird);
        checkCollision(pipes, bird);
      }
    });
    updatePipes();
    drawPipes();

    if (birds.every((b) => !b.alive)) {
      gameOver();
    }
    displayScores();
    frame++;
  }
  requestAnimationFrame(gameLoop);
}

function generatePipe() {
  let top = Math.random() * (canvas.height - pipeGap - 20) + 10;
  pipes.push({ x: canvas.width, top: top, scored: false });
}
function gameOver() {
  neat.sort(); // Sort the population by score
  let newPopulation = [];
  for (let i = 0; i < neat.elitism; i++) {
    newPopulation.push(neat.population[i]);
  }
  for (let i = 0; i < neat.popsize - neat.elitism; i++) {
    newPopulation.push(neat.getOffspring());
  }
  neat.population = newPopulation;
  neat.mutate();

  neat.generation++;

  resetGame();
}

function drawBird(bird) {
  ctx.save();
  ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
  let rotation = Math.max(
    Math.min(bird.velocity / 10, Math.PI / 2),
    -Math.PI / 2
  );
  ctx.rotate(rotation);
  ctx.drawImage(
    birdSprite,
    -bird.width / 2,
    -bird.height / 2,
    bird.width,
    bird.height
  );
  ctx.restore();
}

function updateBird(bird) {
  let inputs = getBirdInputs(bird, pipes);
  if (inputs.length > 0) {
    // Ensure inputs are not empty
    let output = bird.brain.activate(inputs);
    if (output[0] > 0.5) {
      bird.velocity += bird.lift; // Bird decides to jump
      bird.totalJumps = (bird.totalJumps || 0) + 1; // Track jumps for fitness penalty
    }
  }
  bird.velocity += bird.gravity;
  bird.y += bird.velocity;
  bird.y = Math.max(0, Math.min(canvas.height - bird.height, bird.y)); // Keep bird within bounds
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
  pipes.forEach((pipe) => {
    pipe.x -= 2;
    if (!pipe.scored && pipe.x + pipeWidth < birds[0].x) {
      increaseScore();
      pipe.scored = true;
    }
  });
  pipes = pipes.filter((pipe) => pipe.x + pipeWidth > 0);
}

function increaseScore() {
  score++;
  if (score > highScore) {
    highScore = score;
  }
}

function checkCollision(pipes, bird) {
  pipes.forEach((pipe) => {
    if (
      bird.x < pipe.x + pipeWidth &&
      bird.x + bird.width > pipe.x &&
      (bird.y < pipe.top || bird.y + bird.height > pipe.top + pipeGap)
    ) {
      bird.alive = false;
    }
  });
}

// Start the game
imagesLoaded === totalImages && requestAnimationFrame(gameLoop);

birdSprite.onerror = function () {
  console.error("Error loading the bird sprite.");
};
pipeSprite.onerror = function () {
  console.error("Error loading the pipe sprite.");
};
backgroundSprite.onerror = function () {
  console.error("Error loading the background sprite.");
};
