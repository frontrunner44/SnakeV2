const MAX_ROWS = 50;
const MAX_COLS = 50;
const MAX_APPLES = 3;
const POWERUP_CHANCE = 3;
const POWERUP_DURATION = 10000;
const POWERUP_SPEEDMOD = 2; // Speed mod. Speed is divided by this number to get the new speed. Since speed represents the frequency in milliseconds that the move function is called, dividing by 2 doubles speed.
const MOVE_COOLDOWN = 100;
const DIFFICULTY_SPEEDS = [150, 100, 50];
const DEFAULT_DIFFICULTY_INDEX = 1;
const DEFAULT_SNAKE_SPAWN = [[0,0]];
const SNAKE_BODY_CLASS = "snake-body";
const SNAKE_HEAD_CLASS = "snake-head";
const SNAKE_POWERUP_CLASS = "powered-up";

class Game {
  constructor() {
    this.started = false;
    this.score = 0;
    this.difficultySetting = DEFAULT_DIFFICULTY_INDEX;
    this.difficulty = structuredClone(DIFFICULTY_SPEEDS); // Clones the difficulty_speeds array
    this.maxApples = MAX_APPLES;
    this.apples = 0;
    this.powerups = 0;
    this.powerupFlashTimer = null;
    this.powerupDuration = POWERUP_DURATION;
    this.columns = MAX_COLS;
    this.rows = MAX_ROWS;
    this.powerUpChance = POWERUP_CHANCE;
    this.timers = [];
    this.moveCooldownTimer = MOVE_COOLDOWN;
    this.moveCooldown = false;
    this.powerupSpeedMod = POWERUP_SPEEDMOD; 
  }
 }

class Snake {
  constructor() {
    this.alive = true;
    this.immortal = false;
    this.position = structuredClone(DEFAULT_SNAKE_SPAWN); // Clones the default snake spawn array
    this.direction = [];
    this.moveInterval = null;
    this.flashInterval = null;
    this.bodyClass = SNAKE_BODY_CLASS;
    this.headClass = SNAKE_HEAD_CLASS;
    this.powerClass = SNAKE_POWERUP_CLASS;
    this.speedMod = 1; // Default speed mod. Speed is divided by this number to get the new speed. 1 is default/normal speed.
  }

  spawn() {
    const x = this.position[0][0];
    const y = this.position[0][1];
    grid.cell[x][y].snake = true;
    grid.cell[x][y].element.classList.add(this.headClass);
  }

  resetColor() {
    this.bodyClass = SNAKE_BODY_CLASS;
  }

  move(dx, dy) {
    const index = game.difficultySetting;
    const speed = game.difficulty[index];
    clearInterval(this.moveInterval);
    this.moveInterval = setInterval(() => moveSnake(dx, dy), speed/this.speedMod);
  }

  powerup() {
    const dx = this.direction[0];
    const dy = this.direction[1];
    this.speedMod = game.powerupSpeedMod; // Increase the snake's speed by setting the speedMod to game.powerupSpeedMod.
    this.move(dx, dy); // Call the movement setup with a faster speed to speed up the snake.
    startFlashingSnake(); // Calls the function to start flashing the snake golden during the powerup duration.
    setTimeout(() => this.powerdown(), game.powerupDuration); // Buff ends after the duration set in game.powerupDuration.
  }

  powerdown() {
    // Reset the speed of the snake back to default
    this.speedMod = 1; // Restore default speed
    // Grab the updated direction
    const dx = this.direction[0];
    const dy = this.direction[1];
    clearInterval(this.flashInterval);
    if(this.bodyClass === this.powerClass) { // If the interval ends while the snake is golden, we trigger the flash one last time to get the snake back to normal color.
      flashSnake();
      this.immortal = false;
    }
   this.move(dx, dy); // Returns speed back to normal when buff ends.
  }
}

class Cell {
  constructor(element) {
    this.apple = false;
    this.snake = false;
    this.powerup = false;
    this.element = element;
    element.classList.remove(...element.classList); // Remove any added css classes to this DOM.
    element.classList.add("cell"); // Add back the cell styling. Later on I'll add this by default via css stylesheet.
  }
}

class Grid {
  constructor() {
    this.cell = [];
    this.generateGrid();
  }

  generateGrid() {
    // DOM creation. Since cells are placed left to right, we use rows on the outer loop and then columns in the inner. When we're iterating through the first row, we initiate each column by pushing to the array.
    for (let y = 0; y < game.rows; y++) {
      for (let x = 0; x < game.columns; x++) {
        if(y === 0) {
          this.cell.push([]); // Initializes the columns. While y is 0, we are iterating through the columns for the first time, so we need to create them.
       }
       const element = document.querySelector(`[data-x="${x}"][data-y="${y}"]`); // Grab the respective DOM element
       this.cell[x][y] = new Cell(element); // Create a new cell in this index and send the respective DOM element as a parameter so it can hold it as a reference
      }
    }  
  }
}

let game = new Game;
let snake = new Snake;
let grid = [];

// DOM creation. Since cells are placed left to right, we use rows on the outer loop and then columns in the inner.
window.onload = function() {
  const container = document.getElementById("grid");
  for(let y = 0; y < game.rows; y++) {
    for(let x = 0; x < game.columns; x++) {
      const element = document.createElement("div");
      container.appendChild(element);
      element.setAttribute('data-x', x);
      element.setAttribute('data-y', y);
      element.setAttribute('onClick', `testClick(test)`);
      element.classList.add("cell");
    }
  }
  grid = new Grid();
  snake.spawn();
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
      snake.move(dx, dy);
      game.moveCooldown = true;
      setTimeout(() => game.moveCooldown = false, game.moveCooldownTimer)
    }
  }
});

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
          grid.cell[ranX][ranY].apple = true;
          grid.cell[ranX][ranY].element.classList.add("apple");
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
  grid.cell[x][y].element.classList.remove(snake.headClass); // remove the snake-head color from the current head location
  snake.position.length > 1 ? grid.cell[x][y].element.classList.add(snake.bodyClass) : grid.cell[x][y].snake = false; // If the snake is not just a head, replace the uncolored cell with body color, otherwise leave it empty and mark it as not occupied by the snake
  let newX = (x + dx + game.columns) % game.columns; // Uses modular arithmatic to wrap around columns
  let newY = (y + dy + game.rows) % game.rows; // Uses modular arithmatic to wrap around columns
  grid.cell[newX][newY].element.classList.add(snake.headClass);
  grid.cell[newX][newY].snake = true;
  snake.position.unshift([newX, newY]); // Adds the new head coordinates to the front of the snake.positions array
  grid.cell[newX][newY].apple ? ateApple(newX, newY) : handleTail(); // If we ate an apple we call ateApple, otherwise we call handleTail to move the tail.
  if(isSnakeOnSnake(newX, newY, 1, 0) && !snake.immortal) { // If the snake landed on itself and is not immortal, we
    gameOver(); // call the gameOver() function
  }
  if(grid.cell[newX][newY].powerup) {
    eatPowerup(newX, newY);
   }
}

function handleTail() {
  const lastIndex = snake.position.length-1;
  const tailX = snake.position[lastIndex][0];
  const tailY = snake.position[lastIndex][1];
  snake.position.pop(); // we remove the end (tail) of the snake position array 
  if(!isSnakeOnSnake(tailX, tailY, 0, 1)){ // and then check that the tail was not on top of another part of the snake's body
    grid.cell[tailX][tailY].element.classList.remove(snake.bodyClass); // before uncoloring that grid cell from the grid
    grid.cell[tailX][tailY].snake = false; // and marking the cell as not being occupied by the snake
  }
}

function ateApple(x, y) {
    grid.cell[x][y].apple = false;
    grid.cell[x][y].element.classList.remove("apple");
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
    grid.cell[x][y].powerup = false;
    grid.cell[x][y].element.classList.remove("powered-up");
    game.powerups--;
    snake.powerup();
    updateScore(10);
}

function generatePowerUp() {
  let powerupGenerated = false;
  while(!powerupGenerated) {
    const x = randomNum(0, game.columns-1);
    const y = randomNum(0, game.rows-1);
    if(isEmpty(x, y)) {
      grid.cell[x][y].powerup = true;
      grid.cell[x][y].element.classList.add("powered-up");
      game.powerups++;
      powerupGenerated = true;
      game.powerUpFlashTimer = setInterval(() => {
        grid.cell[x][y].element.classList.contains("powered-up") ? grid.cell[x][y].element.classList.remove("powered-up") : grid.cell[x][y].element.classList.add("powered-up");
      }, 500)
    }
  }
}

function startFlashingSnake() {
  snake.flashInterval = setInterval(() => {
    snake.immortal = true; // sets the snake to immortal so it can pass through itself.
    flashSnake(); // Calls the flash snake function every 
  }, 300); // 300 milliseconds
}

function flashSnake() {
  // Remove old styling
  for(const segment of snake.position) {
    const x = segment[0];
    const y = segment[1];
    grid.cell[x][y].element.classList.remove(snake.bodyClass);
    grid.cell[x][y].element.classList.remove(snake.headClass);
  }
  // Update the class stored in "bodyClass" because each time the snake moves, the move function applies this style to the grid. So we need to change it.
  snake.bodyClass === snake.powerClass ? snake.resetColor() : snake.bodyClass = snake.powerClass;
 // Add new styling immediately, even though the snake will render itself as it moves. Applying the new style immediately looks much more aesthetic and fluid.
  for(const segment of snake.position) {
    const x = segment[0];
    const y = segment[1];
    grid.cell[x][y].element.classList.add(snake.bodyClass);
  }
}

// Helper function to determine is a grid is empty or not.
function isEmpty(x, y) {
  return grid.cell[x][y].apple === false && grid.cell[x][y].snake === false && grid.cell[x][y].powerup === false
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
  clearAllIntervals();
  snake.alive = false;
  game.started = false;
  alert("GAME OVER - Choose a difficulty to reset the game.");
}

function resetGame(diffSetting, diffElement, diffName) {
  clearAllIntervals(); // Clear all intervals
  grid = new Grid(); // Generate a new grid array.
  updateScore(game.score/-1); // Sets score back to 0 on the page
  game = new Game; // Return game state to default
  snake = new Snake; // Restore snake back to default settings.
  snake.spawn(); // Respawn the snake
  game.difficultySetting = diffSetting; // Sets the difficulty setting to the new setting
  diffElement.innerHTML = diffName; // Displays the difficulty on the page
}

function clearAllCells() {
  for(let y = 0; y < game.rows; y++) {
    for(let x = 0; x < game.columns; x++) {
      const element = grid.cell[x][y].element; // Temporarily store the element reference to a new variable
      grid.cell[x][y] = new Cell(element); // Set this grid object back to default values
    }
  }
}

function clearAllIntervals() {
  // Can use a single array later that stores all interval IDs and just iterate through to clear them
  clearInterval(game.powerUpFlashTimer);
  clearInterval(snake.moveInterval);
  clearInterval(snake.flashInterval);
}