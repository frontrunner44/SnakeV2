
function powerUpSnake() {
  snake.flashInterval = setInterval(() => {
    !snake.immortal ? snake.immortal = true : undefined;
    flashSnake();
  }, 300);

  setTimeout(() => {
    clearInterval(snake.flashInterval);
    if(snake.bodyClass === snake.powerClass) {
      flashSnake();
      snake.immortal = false;
    }
  },10000);
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