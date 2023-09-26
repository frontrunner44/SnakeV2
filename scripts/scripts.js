const game = {
  started: false,
  difficultySetting: 2, // Index of difficulty for snake's movement speed
  difficulty: [500, 250, 100], // movement speed in miliseconds
  columns: 50,
  rows: 50,
  appleLocations: [],
  moveCooldownTimer: 100, // Move cooldown in miliseconds. Helps prevent sporadic movements that can cause unintional self collisions.
  moveCooldown: false,
  snake: {
    alive: true,
    position: [[0,0]], // Default head position is 0,0
    direction:"",
    moveInterval: null,
  },
  grid: [],
  cellDefaults: {
    apple: false,
    appleIndex: null,
    snake: false,
    powerUp: false,
    element: null,
  }
}
const snake = structuredClone(game.snake);

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
    // do stuff when game is just starting
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

function moveSnake(dx, dy) {
  const x = snake.position[0][0]; // Stores the x coordinate of the snake's head.
  const y = snake.position[0][1]; // Stores the y coordinate of the snake's head.
  if(snake.position.length > 1) { // If snake is not only a head,
    game.grid[x][y].element.classList.remove("snake-head"); // remove the snake-head color from the current head location
    game.grid[x][y].element.classList.add("snake-body"); // and replace it with the body color
  } else { // otherwise
    game.grid[x][y].element.classList.remove("snake-head"); // remove the snake head color from the cell
    game.grid[x][y].snake = false;
  }
  let newX = updatePosition(x+dx, game.columns); // Calls a helper function to determine where to place the new location. Mainly used to handle "wrapping" around the grid when going through an edge.
  let newY = updatePosition(y+dy, game.rows); // Calls a helper function to determine where to place the new location. Mainly used to handle "wrapping" around the grid when going through an edge.
  game.grid[newX][newY].element.classList.add("snake-head");
  game.grid[newX][newY].snake = true;
  snake.position.unshift([newX, newY]); // Adds the new head coordinates to the front of the snake.positions array
  checkAteApple(newX, newY); // Handles moving the tail as well
  checkCannibalism();
}

function updatePosition(xy, edge) {
  if(xy < 0) {
    return edge-1;
  } else if(xy >= edge) {
    return 0;
  } else {
    return xy;
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

function checkAteApple(x, y) {
  if(!game.grid[x][y].apple) {
    const lastIndex = snake.position.length-1;
    const tailX = snake.position[lastIndex][0];
    const tailY = snake.position[lastIndex][1];
    snake.position.pop(); // Remove the tail
    game.grid[tailX][tailY].element.classList.remove("snake-body");
    game.grid[tailX][tailY].snake = false;
  } else {
    // handle apple eating logic here -- by ommiting the above logic we essentially create a new segment of the snake by NOT removing its tail
  }
}

function testClick(element) {
  const x = element.getAttribute("data-x");
  const y = element.getAttribute("data-y");
  console.log(`Clicked cell ${x}, ${y}`);
  console.log(game.grid[x][y]);
}

function gameOver() {
 console.log("dedededed");
}