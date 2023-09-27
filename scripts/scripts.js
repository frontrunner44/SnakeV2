const game = {
  started: false,
  difficultySetting: 2, // Index of difficulty for snake's movement speed
  difficulty: [500, 250, 100], // movement speed in miliseconds
  maxApples: 3,
  apples: 0,
  columns: 50,
  rows: 50,
  timers: [], // Will store timers IDs so we can iterate through this and stop them during game over or game reset.
  moveCooldownTimer: 100, // Move cooldown in miliseconds. Helps prevent sporadic movements that can cause unintional self collisions.
  moveCooldown: false,
  snakeDefaults: {
    alive: true,
    position: [[0,0]], // Default head position is 0,0
    direction:"",
    moveInterval: null,
    flashInterval: null,
    bodyClass: "snake-body",
    headClass: "snake-head",
    powerClass: "powered-up",
  },
  grid: [],
  cellDefaults: {
    apple: false,
    snake: false,
    powerUp: false,
    element: null,
  }
}
const snake = structuredClone(game.snakeDefaults);

// Grid generation. Since DOM elements are placed left to right
window.onload = function() {
  const container = document.getElementById("grid");
  for(let y = 0; y < game.rows; y++) {
    for(let x = 0; x < game.columns; x++) {
      if(y === 0) { // Initiate columns on the initial passthrough
        game.grid.push([]);
      }
      const element = document.createElement("div");
      container.appendChild(element);
      element.setAttribute('data-x', x);
      element.setAttribute('data-y', y);
      element.setAttribute('onClick', `testClick(test)`);
      element.classList.add("cell");
      game.grid[x][y] = structuredClone(game.cellDefaults);
      game.grid[x][y].element = element;
    }
  }
  game.grid[0][0].element.classList.add("snake-head");
  game.grid[0][0].snake = true;
}

document.addEventListener("keydown", event => {
  let dx;
  let dy;
  if(!game.started && snake.alive) {
    generateApples();
    game.started = true;
  } 
  if(snake.alive && !game.moveCooldown) {
    console.log("Move triggered");
    if(event.code === "ArrowLeft" && snake.direction !== "right") {
      dx = -1;
      dy = 0;
      snake.direction = "left";
    } else if(event.code === "ArrowRight" && snake.direction !== "left") {
      dx = 1;
      dy = 0;
      snake.direction = "right";
    } else if(event.code === "ArrowDown" && snake.direction !== "up") {
      dx = 0;
      dy = 1;
      snake.direction = "down";
    } else if(event.code === "ArrowUp" && snake.direction !== "down") {
      dx = 0;
      dy = -1;
      snake.direction = "up";
    }
    if(dx !== undefined) {
      clearInterval(snake.moveInterval);
      const index = game.difficultySetting;
      const speed = game.difficulty[index];
      snake.moveInterval = setInterval(() => moveSnake(dx, dy), speed);
      game.moveCooldown = true;
      setTimeout(() => game.moveCooldown = false, game.moveCooldownTimer)
    }
  }
});

function generateApples() {
  const max = game.maxApples - game.apples; // Sets the max number of apples that can be spawned to game.maxApples - game.apples
  const min = game.apples === 0 ? 1 : 0; // If no apples exist yet, the minimum to spawn is 1, otherwise minumum is 0.
  const spawnAmount = randomNum(min, max); // Spawn a random number of apples between min and max.
  console.log(`${spawnAmount} is the returned random number`);
  for(i = 0; i < spawnAmount; i++) { // Attemps to spawn an apple spawnAmount times
    if(game.apples === game.maxApples) { // If we are already at max apple capacity, 
      return; // we simply return and do not spawn an apple
    } else { // otherwise we execute apple spawning logic
      let appleSpawned = false; // Sets to appleSpawned false before attempting to spawn an apple
      while(!appleSpawned) { // Loops until an apple is spawned and appleSpawned is set to true
        const ranX = randomNum(0, game.columns-1); // Sets ranX to a random column
        const ranY = randomNum(0, game.rows-1); // Sets ranY to a random row
        if(isEmpty(ranX, ranY)) {
          game.grid[ranX][ranY].apple = true;
          game.grid[ranX][ranY].element.classList.add("apple");
          game.apples++;
          appleSpawned = true;
        }
      }
    }
  }
}

function moveSnake(dx, dy) {
  const x = snake.position[0][0]; // Stores the x coordinate of the snake's head.
  const y = snake.position[0][1]; // Stores the y coordinate of the snake's head.
  if(snake.position.length > 1) { // If snake is not only a head,
    game.grid[x][y].element.classList.remove(snake.headClass); // remove the snake-head color from the current head location
    game.grid[x][y].element.classList.add(snake.bodyClass); // and replace it with the body color
  } else { // otherwise
    game.grid[x][y].element.classList.remove(snake.headClass); // remove the snake head color from the cell
    game.grid[x][y].snake = false;
  }
  let newX = (x + dx + game.columns) % game.columns; // Uses modular arithmatic to wrap around columns
  let newY = (y + dy + game.rows) % game.rows; // Uses modular arithmatic to wrap around columns
  game.grid[newX][newY].element.classList.add(snake.headClass);
  game.grid[newX][newY].snake = true;
  snake.position.unshift([newX, newY]); // Adds the new head coordinates to the front of the snake.positions array
  checkAteApple(newX, newY); // Handles moving the tail as well
  checkCannibalism();
}

function checkAteApple(x, y) {
  if(!game.grid[x][y].apple) {
    const lastIndex = snake.position.length-1;
    const tailX = snake.position[lastIndex][0];
    const tailY = snake.position[lastIndex][1];
    snake.position.pop(); // Remove the tail
    game.grid[tailX][tailY].element.classList.remove(snake.bodyClass);
    game.grid[tailX][tailY].snake = false;
  } else {
    game.grid[x][y].apple = false;
    game.grid[x][y].element.classList.remove("apple");
    game.apples--;
    generateApples();
  }
}

function checkCannibalism() {
  const x = snake.position[0][0];
  const y = snake.position[0][1];
  for(i = 1; i < snake.position.length; i++) { // Start at the second section of the snake, this way we don't compare the head to itself
    if(x === snake.position[i][0] && y === snake.position[i][1]) {
      gameOver();
    }
  }
}

// Start the interval for flashing the snake gold and also start the timeout for when the buff ends and the snake returns to normal.
function powerUpSnake() {
  snake.flashInterval = setInterval(() => {
    !snake.immortal ? snake.immortal = true : undefined; // sets the snake to immortal so it can pass through itself.
    flashSnake(); // Calls the flash snake function every 
  }, 300); // 300 milliseconds

  setTimeout(() => {
    clearInterval(snake.flashInterval);
    if(snake.bodyClass === snake.powerClass) { // If the interval ends while the snake is golden, we trigger the flash one last time to get the snake back to normal color.
      flashSnake();
      snake.immortal = false;
    }
  },10000); // Buff ends after 10 seconds.
}

function flashSnake() {
  // Remove old styling
  for(const segment of snake.position) {
    const x = segment[0];
    const y = segment[1];
    game.grid[x][y].element.classList.remove(snake.bodyClass);
    game.grid[x][y].element.classList.remove(snake.headClass);
  }
  // Update styling
  snake.bodyClass === snake.powerClass ? snake.bodyClass = game.snakeDefaults.bodyClass : snake.bodyClass = snake.powerClass;
 // Add new styling
  for(const segment of snake.position) {
    const x = segment[0];
    const y = segment[1];
    game.grid[x][y].element.classList.add(snake.bodyClass);
  }
}

// Helper function to determine is a grid is empty or not.
function isEmpty(x, y) {
  if(game.grid[x][y].apple === false && game.grid[x][y].snake === false && game.grid[x][y].powerUp === false) {
    return true;
  } else {
    return false;
  }
}

function randomNum(min, max) {
  console.log(`Random number between ${min} and ${max} being generated`)
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function gameOver() {
 console.log("dedededed");
}