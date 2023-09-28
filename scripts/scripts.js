const gameDefaults = {
  started: false,
  score: 0,
  difficultySetting: 1, // Index of difficulty for snake's movement speed
  difficulty: [150, 100, 50], // movement speed in miliseconds
  maxApples: 3,
  apples: 0,
  powerups: 0,
  powerupFlashTimer: null,
  powerupSpeedMultiplier: 2, // Snake speed is dictated in milliseconds and is divided by this number during a powerup. 2 would mean speed doubles
  powerupDuration: 10000, // In milliseconds
  columns: 50,
  rows: 50,
  powerUpChance: 3, // When we go to determine if we'll spawn a powerup, we generate a number between 1 and this number. If it's 1, we spawn the powerup.
  timers: [], // Will store timers IDs so we can iterate through this and stop them during game over or game reset.
  moveCooldownTimer: 100, // Move cooldown in miliseconds. Helps prevent sporadic movements that can cause unintional self collisions.
  moveCooldown: false,
  snakeDefaults: {
    alive: true,
    immortal: false,
    position: [[0,0]], // Default head position is 0,0
    direction: [],
    moveInterval: null,
    flashInterval: null,
    bodyClass: "snake-body",
    headClass: "snake-head",
    powerClass: "powered-up",
  },
  cellDefaults: {
    apple: false,
    snake: false,
    powerUp: false,
    element: null,
  }
}
let game = structuredClone(gameDefaults);
let snake = structuredClone(game.snakeDefaults);
const grid = [];

// Grid generation. Since DOM elements are placed left to right
window.onload = function() {
  const container = document.getElementById("grid");
  for(let y = 0; y < game.rows; y++) {
    for(let x = 0; x < game.columns; x++) {
      if(y === 0) { // Initiate columns on the initial passthrough
        grid.push([]);
      }
      const element = document.createElement("div");
      container.appendChild(element);
      element.setAttribute('data-x', x);
      element.setAttribute('data-y', y);
      element.setAttribute('onClick', `testClick(test)`);
      element.classList.add("cell");
      grid[x][y] = structuredClone(game.cellDefaults);
      grid[x][y].element = element;
    }
  }
  moveSnake(0, 0);
}

// Difficulty button functionality
function difficultyButtons(diffSetting, diffName) {
  const element = document.getElementById("diff");
  if(!game.started && snake.alive) {
    game.difficultySetting = diffSetting;
    element.innerHTML = diffName;
  } else if(confirm(`Do you want to reset the game with difficulty setting: ${diffName}`)) {
    resetGame(diffSetting, element, diffName);
  }
}

document.addEventListener("keydown", event => {
  let dx;
  let dy;
  if(!game.started && snake.alive) {
    generateApples();
    game.started = true;
  } 
  if(snake.alive && !game.moveCooldown) {
    if(event.code === "ArrowLeft" && (snake.direction[0] !== 1 || snake.direction[1] !== 0)) {
      dx = -1;
      dy = 0;
      snake.direction = [-1, 0];
    } else if(event.code === "ArrowRight" && (snake.direction[0] !== -1 || snake.direction[1] !== 0)) {
      dx = 1;
      dy = 0;
      snake.direction = [1, 0];
    } else if(event.code === "ArrowDown" && (snake.direction[0] !== 0 || snake.direction[1] !== -1)) {
      dx = 0;
      dy = 1;
      snake.direction = [0, 1];
    } else if(event.code === "ArrowUp" && (snake.direction[0] !== 0 || snake.direction[1] !== 1)) {
      dx = 0;
      dy = -1;
      snake.direction = [0, -1];
    }
    if(dx !== undefined) {
      setMovementInterval(dx, dy);
      game.moveCooldown = true;
      setTimeout(() => game.moveCooldown = false, game.moveCooldownTimer)
    }
  }
});

function setMovementInterval(dx, dy) {
  const index = game.difficultySetting;
  const speed = game.difficulty[index];
  clearInterval(snake.moveInterval);
  snake.moveInterval = setInterval(() => moveSnake(dx, dy), speed);
}

function generateApples() {
  const max = game.maxApples - game.apples; // Sets the max number of apples that can be spawned to game.maxApples - game.apples
  const min = game.apples === 0 ? 1 : 0; // If no apples exist yet, the minimum to spawn is 1, otherwise minumum is 0.
  const spawnAmount = randomNum(min, max); // Spawn a random number of apples between min and max.
  for(i = 0; i < spawnAmount; i++) { // Attemps to spawn an apple spawnAmount times
    if(game.apples === game.maxApples) { // If we are already at max apple capacity, 
      return; // we simply return and do not spawn an apple
    } else { // otherwise we execute apple spawning logic
      let appleSpawned = false; // Sets to appleSpawned false before attempting to spawn an apple
      while(!appleSpawned) { // Loops until an apple is spawned and appleSpawned is set to true
        const ranX = randomNum(0, game.columns-1); // Sets ranX to a random column
        const ranY = randomNum(0, game.rows-1); // Sets ranY to a random row
        if(isEmpty(ranX, ranY)) {
          grid[ranX][ranY].apple = true;
          grid[ranX][ranY].element.classList.add("apple");
          game.apples++;
          appleSpawned = true;
        }
      }
    }
  }
  if(randomNum(1, game.powerUpChance) === 1 && game.powerups === 0 && !snake.immortal) { // If a randomly generated number between 1 and game.powerUpChance is 1 and there are no powerups on the board, and the snake is currently not powered up, we 
    generatePowerUp(); // call the function to generate a powerUp on the grid
  }
}

function moveSnake(dx, dy) {
  const x = snake.position[0][0]; // Stores the x coordinate of the snake's head.
  const y = snake.position[0][1]; // Stores the y coordinate of the snake's head.
  grid[x][y].element.classList.remove(snake.headClass); // remove the snake-head color from the current head location
  snake.position.length > 1 ? grid[x][y].element.classList.add(snake.bodyClass) : grid[x][y].snake = false; // If the snake is not just a head, replace the uncolored cell with body color, otherwise leave it empty and mark it as not occupied by the snake
  let newX = (x + dx + game.columns) % game.columns; // Uses modular arithmatic to wrap around columns
  let newY = (y + dy + game.rows) % game.rows; // Uses modular arithmatic to wrap around columns
  grid[newX][newY].element.classList.add(snake.headClass);
  grid[newX][newY].snake = true;
  snake.position.unshift([newX, newY]); // Adds the new head coordinates to the front of the snake.positions array
  grid[newX][newY].apple ? ateApple(newX, newY) : handleTail(); // If we ate an apple we call ateApple, otherwise we call handleTail to move the tail.
  isSnakeOnSnake(newX, newY, 1, 0) && gameOver(); // Short circuit method of calling gameOver if the snake ate itself.
  grid[newX][newY].powerUp && eatPowerup(newX, newY); // Short circuit method of calling eatPowerup if the snake ate a powerup.
}

function handleTail() {
  const lastIndex = snake.position.length-1;
  const tailX = snake.position[lastIndex][0];
  const tailY = snake.position[lastIndex][1];
  snake.position.pop(); // we remove the end (tail) of the snake position array 
  if(!isSnakeOnSnake(tailX, tailY, 0, 1)){ // and then check that the tail was not on top of another part of the snake's body
    grid[tailX][tailY].element.classList.remove(snake.bodyClass); // before uncoloring that grid cell from the grid
    grid[tailX][tailY].snake = false; // and marking the cell as not being occupied by the snake
  }
}

function ateApple(x, y) {
    grid[x][y].apple = false;
    grid[x][y].element.classList.remove("apple");
    game.apples--;
    updateScore(10);
    generateApples();
}

function isSnakeOnSnake(x, y, startI, adjust) {
  for(i = startI; i < snake.position.length-adjust; i++) { // Start at the second section of the snake, this way we don't compare the head to itself
    if(x === snake.position[i][0] && y === snake.position[i][1]) {
      return true;
    }
  }
  return false;
}

function eatPowerup(x, y) {
    clearInterval(game.powerUpFlashTimer);
    grid[x][y].powerUp = false;
    grid[x][y].element.classList.remove("powered-up");
    game.powerups--;
    powerupSnake();
    updateScore(10);
}

function generatePowerUp() {
  let powerupGenerated = false;
  while(!powerupGenerated) {
    const x = randomNum(0, game.columns-1);
    const y = randomNum(0, game.rows-1);
    if(isEmpty(x, y)) {
      grid[x][y].powerUp = true;
      grid[x][y].element.classList.add("powered-up");
      game.powerups++;
      powerupGenerated = true;
      game.powerUpFlashTimer = setInterval(() => {
        grid[x][y].element.classList.contains("powered-up") ? grid[x][y].element.classList.remove("powered-up") : grid[x][y].element.classList.add("powered-up");
      }, 500)
    }
  }
}

// Start the interval for flashing the snake gold and also start the timeout for when the buff ends and the snake returns to normal.
function powerupSnake() {
  const index = game.difficultySetting;
  const dx = snake.direction[0];
  const dy = snake.direction[1];
  game.difficulty[index] /= game.powerupSpeedMultiplier; // Increase the snake's speed setting.
  setMovementInterval(dx, dy); // Call the movement setup with a faster speed to speed up the snake.
  startFlashingSnake(); // Calls the function to start flashing the snake golden during the powerup duration.
  setTimeout(() => powerdownSnake(index), game.powerupDuration); // Buff ends after the duration set in game.powerupDuration.
}

function startFlashingSnake() {
  snake.flashInterval = setInterval(() => {
    snake.immortal = true; // sets the snake to immortal so it can pass through itself.
    flashSnake(); // Calls the flash snake function every 
  }, 300); // 300 milliseconds
}

function powerdownSnake(index) {
  // Reset the speed of the snake back to default
  game.difficulty[index] = gameDefaults.difficulty[index];
  // Grab the updated direction
  const dx = snake.direction[0];
  const dy = snake.direction[1];
  clearInterval(snake.flashInterval);
  if(snake.bodyClass === snake.powerClass) { // If the interval ends while the snake is golden, we trigger the flash one last time to get the snake back to normal color.
    flashSnake();
    snake.immortal = false;
  }
 setMovementInterval(dx, dy); // Returns speed back to normal when buff ends.
}

function flashSnake() {
  // Remove old styling
  for(const segment of snake.position) {
    const x = segment[0];
    const y = segment[1];
    grid[x][y].element.classList.remove(snake.bodyClass);
    grid[x][y].element.classList.remove(snake.headClass);
  }
  // Update the class stored in "bodyClass" because each time the snake moves, the move function applies this style to the grid. So we need to change it.
  snake.bodyClass === snake.powerClass ? snake.bodyClass = game.snakeDefaults.bodyClass : snake.bodyClass = snake.powerClass;
 // Add new styling immediately, even though the snake will render itself as it moves. Applying the new style immediately looks much more aesthetic and fluid.
  for(const segment of snake.position) {
    const x = segment[0];
    const y = segment[1];
    grid[x][y].element.classList.add(snake.bodyClass);
  }
}

// Helper function to determine is a grid is empty or not.
function isEmpty(x, y) {
  return grid[x][y].apple === false && grid[x][y].snake === false && grid[x][y].powerUp === false
}

function randomNum(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function updateScore(adj) {
  const element = document.getElementById("scount");
  game.score += adj;
  element.innerHTML = game.score;
}

function gameOver() {
  if(snake.immortal) {
    return
  } else {
    clearAllIntervals();
    snake.alive = false;
    game.started = false;
    alert("GAME OVER - Choose a difficulty to reset the game.");
  }
}

function resetGame(diffSetting, diffElement, diffName) {
  clearAllIntervals(); // Clear all intervals
  clearAllCells(); // Clear all grid cells
  updateScore(game.score/-1); // Sets score back to 0 on the page
  game = structuredClone(gameDefaults); // Return game state to default
  snake = structuredClone(game.snakeDefaults); // Restore snake back to default settings.
  moveSnake(0, 0); // restores snake's starting position
  game.difficultySetting = diffSetting; // Sets the difficulty setting to the new setting
  diffElement.innerHTML = diffName; // Displays the difficulty on the page
}

function clearAllCells() {
  for(let y = 0; y < game.rows; y++) {
    for(let x = 0; x < game.columns; x++) {
      const element = grid[x][y].element; // Temporarily store the element reference to a new variable
      grid[x][y] = structuredClone(game.cellDefaults); // Set this grid object back to default values
      grid[x][y].element = element; // Restore the element reference
      grid[x][y].element.classList.remove(...element.classList); // Remove all added CSS class styling
      grid[x][y].element.classList.add("cell"); // Add back cell styling
    }
  }
}

function clearAllIntervals() {
  // Can use a single array later that stores all interval IDs and just iterate through to clear them
  clearInterval(game.powerUpFlashTimer);
  clearInterval(snake.moveInterval);
  clearInterval(snake.flashInterval);
}