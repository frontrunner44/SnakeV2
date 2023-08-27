// Declare default values for the game.
const gameDefaults = {
      snake:[0], // Each position in the array is it's body segment. So 0 is the head and every position after is the body, with the last being the tail. Values of each position represent position on the grid.
      gridWidth:50, // The game.gridWidth of the grid will be used for positional calculations. The grid is 34x34 cells.
      gridSize:50*50, // Used for calculations pertaining to hitting the edges of the grid.50
      currentDirection:"",
      apples:[], // Store apple locations
      maxApples:3,
      gameTimers:{},
      gameStarted:false,
      snakeDead:false,
      diffSetting:1,
      difficulty:[75,45,25], // Easy, Medium, Difficult (move rate)
      score:0,
      headColor:"rgb(148,0,211)", // game.snake's head color
      bodyColor:"rgb(255, 255, 255)", // game.snake's body color
      bgColor:"rgb(0,0,0)", // The BG color left behind when your game.snake leaves a position.
      appleColor:"rgb(0,255,0)",
      pressDown:38, // Button for moving down
      pressLeft:39, // Button for moving left
      pressRight:37, // Button for moving right
      pressUp:40, // Button for moving up
      addSegmentHere:-1, // Variable to store the tail's position on the grid in case we need to add a segment after eating an apple.
      powerUp:{color:"rgb(255, 215, 0)", speed:1000, chance:5, buffDuration:10000, location:-1, snakeFlashSpeed:250, flashColor:"rgb(255, 215, 0)"},
      immortalSnake:false
}
let game = structuredClone(gameDefaults); // Clones the default values from the gameDefaults object into a new usable object called game.

// Game controls and triggers.
$(document).keydown(function(event){
  //console.log(game);
  startGame();
  if(event.which === game.pressDown && game.currentDirection !== "down") {
    game.currentDirection = "up";
  } else if(event.which === game.pressLeft && game.currentDirection !== "left") {
    game.currentDirection = "right";
  } else if(event.which === game.pressRight && game.currentDirection !== "right") {
    game.currentDirection = "left";
  } else if(event.which === game.pressUp && game.currentDirection !== "up") {
    game.currentDirection = "down";
  }
});

function startGame(){
  if(!game.gameStarted && !game.snakeDead) {
    game.gameTimers.snakeMovement = setInterval(moveSnake, game.difficulty[game.diffSetting]); // Start the moving function.
    game.gameTimers.powerupSpawn = setInterval(generatePowerUp,game.powerUp.speed); // Start the powerUp generating function
    appleTime(); // call the apple generating function -- Can probably create an object holding all important generating functions here and iterate through
    game.gameStarted = true;
  }
}

// Prepares the grid on page load.
$(document).ready(function(){
  // Grid generation
	for(let i=0; i<game.gridSize; i++) {
  		$("#grid").append("<div class='cell' data-pos='"+i+"'></div>");
	}
  // Color head position.
	$(".cell").eq(0).css("background-color",game.headColor);
});



// game.difficulty Setting & Game Reset
$("button").click(function(){
  if(game.snakeDead || game.gameStarted && confirm("Do you want to reset and start a new game?")) {
    Object.keys(game.gameTimers).forEach(timerKey => clearInterval(game.gameTimers[timerKey])); // Clear all intervals running
    $(".cell").css("background-color",game.bgColor); // Recolor the board
    $(".cell").eq(0).css("background-color",game.headColor); // Reset head position.
    game = structuredClone(gameDefaults); // Restores the default values to the game Object by cloning the object holding the
  }
  if(!game.gameStarted) {
    $("#diff").html($(this).data("diff"));
    game.diffSetting = parseInt($(this).data("speed"));
  }
});

// Apple generating function
function appleTime() {
  for(let i=0; i<game.maxApples; i++) {
    if(game.apples.length === 0){ // Checks if no game.apples are currently generated and if they aren't, makes sure at least one apple is generated.
      generateApple();
    } else if(game.apples.length < game.maxApples) { // Checks if the current amount of game.apples generated is less than the max allowed game.apples.
      if(randomNumber(1,4) === 4) {
        generateApple(); // If a 1 is rolled, generates another apple. This gives a roughly 25% chance for additional apple(s) to be generated.
      }
    } else {
      break; // If game.apples are generated and already at maximum allowed, ends the loop early.
    }
  } 
  function generateApple(){
    game.apples.push(findEmptySpot());
    $(".cell").eq(game.apples[game.apples.length-1]).css("background-color",game.appleColor);
  }
}

// Power-Up generating function. 
function generatePowerUp() {
  //console.log("PowerUp function called");
  if(randomNumber(1,game.powerUp.chance) === 1){
    game.powerUp.location = findEmptySpot();
    $(".cell").eq(game.powerUp.location).css("background-color",game.powerUp.color);
    //console.log("Powerup generated");
    clearInterval(game.gameTimers.powerupSpawn);
    game.gameTimers.flashingLogic = setInterval(flashingLogic,game.powerUp.snakeFlashSpeed);
  }
  //console.log("Failed to generate");
}

// game.snake moving functionality. This uses .unshift() to push a new head position and then snips the tail off with .pop().
function moveSnake() {
  let oldHeadPosition = game.snake[0]; // Variable to store old head position to pretty up calculations.
  let newHeadPosition; // Variable to store the result for the new head position.
  let setNewColor = game.bodyColor;
  if(game.snake.length === 1) { // If the game.snake is only a head, it leaves behind blank space, otherwise it will leave behind body color.
    setNewColor = game.bgColor;
  }

  // Set the color of the cell the head is leaving.
  $(".cell").eq(game.snake[0]).css("background-color", setNewColor); 

  // Determine the head's new position based on the direction it is moving.
  // Moving right:
  if(game.currentDirection === "right") {
    game.currentDirection = "right";
	  if(oldHeadPosition % game.gridWidth+1 !== game.gridWidth) { // Modular arithmetic for checking if you are NOT on an edge. If you're on the right edge, remainder will be the grid
	   newHeadPosition = oldHeadPosition += 1;
	  } else {
	   newHeadPosition = oldHeadPosition -= game.gridWidth-1;
	  }
  }

  // game.currentDirection left:
  if(game.currentDirection === "left") { 
    game.currentDirection = "left";
    if(oldHeadPosition % game.gridWidth === 0) { // Modular arithmetic for calculating left edges
      newHeadPosition = oldHeadPosition += game.gridWidth-1;
    } else {
      newHeadPosition = oldHeadPosition -= 1;
    }
  }

  // game.currentDirection Up:
  if(game.currentDirection === "up") {
    game.currentDirection = "up";
    if(oldHeadPosition > game.gridWidth-1) {
      newHeadPosition = oldHeadPosition -= game.gridWidth;
    } else {
      newHeadPosition = oldHeadPosition += game.gridSize-game.gridWidth;
    }
  }

  // game.currentDirection Down:
  if(game.currentDirection === "down") { 
    game.currentDirection = "down";
    if(oldHeadPosition < game.gridSize-game.gridWidth) {
      newHeadPosition = oldHeadPosition += game.gridWidth;
    } else {
      newHeadPosition = oldHeadPosition -= game.gridSize-game.gridWidth;
    }
  }

  game.snake.unshift(newHeadPosition); // Push newHeadPosition to the front of the array to update the head's new location.
  $(".cell").eq(game.snake[0]).css("background-color",game.headColor); // Color new head cell.
  game.addSegmentHere = game.snake[game.snake.length-1]; // Store the tail's current location on the grid in case we eat an apple and need to add a game.snake portion behind the tail.
  $(".cell").eq(game.snake[game.snake.length-1]).css("background-color",game.bgColor); // Uncolor the tail position to "move" it up.


  game.snake.pop(); // Remove the tail by removing the last index from the game.snake array.
  eatApple(game.addSegmentHere); // Apple eating logic.
  eatSelf(); // Self collision logic.
  eatPowerUp(); // PowerUp eating logic
} // end of move function

// Apple eating logic
function eatApple() {
  if(game.apples.indexOf(game.snake[0]) !== -1) { // Checks if the head location is found inside of the game.apples array
    let removeApple = game.apples.indexOf(game.snake[0]);
    game.score += game.snake.length*2;
    $("#scount").html(game.score);
    game.snake.push(game.addSegmentHere);
    game.apples.splice(removeApple, 1); // Remove apple from array
    appleTime();
  } 
}

// Self collision logic. Makes sure the head OR the tail doesn't collide with the body. The tail can collide when being generated on a space already taken up by another body part.
function eatSelf() {
  if((game.snake.indexOf(game.snake[0], 1) !== -1 || game.snake.lastIndexOf(game.snake[game.snake.length-1],-2) !== -1) && !game.immortalSnake) {
    //console.log(game.immortalSnake);
    alert("Ouch! You took a bite out of yourself! That's disgusting! Choose a game.difficulty to reset the game.");
    $(".cell").css("background-color","red");
    Object.keys(game.gameTimers).forEach(i => clearInterval(game.gameTimers[i])); // Clear all intervals running
    game.snakeDead = true;
  }
}

// PowerUp eating logic combined with game.snake flashing animation logic
function eatPowerUp() {
  if(game.snake[0] === game.powerUp.location) {
    //console.log("Triggered eat power up, you're immortal!");
    //clearInterval(game.gameTimers.powerupSpawn);
    game.powerUp.location = -1;
    //game.gameTimers.flashingLogic = setInterval(flashingLogic,game.powerUp.snakeFlashSpeed);
    game.immortalSnake = true;
    setTimeout(immortalBuffEnd,game.powerUp.buffDuration);
  }
}

function flashingLogic() {
  if(game.powerUp.location !== -1) {
    console.log("Triggered exists");
    console.log($(".cell").eq(game.powerUp.location).css("background-color"));
    console.log(game.powerUp.color);
    if($(".cell").eq(game.powerUp.location).css("background-color") === game.powerUp.color) {
      console.log("Trigger gold detected");
      $(".cell").eq(game.powerUp.location).css("background-color",game.bgColor);
    } else {
      console.log("Trigger non-gold detected");
      $(".cell").eq(game.powerUp.location).css("background-color",game.powerUp.color);
    }
  } else {
      if($(".cell").eq(game.snake[1]).css("background-color") === game.bodyColor) {
        game.snake.forEach(i => $(".cell").eq(i).css("background-color",game.powerUp.flashColor));
      } else {
        game.snake.forEach(i => $(".cell").eq(i).css("background-color",game.bodyColor));
      }
    }
}

function immortalBuffEnd() {
  // logic for the buff ending here
  clearInterval(game.gameTimers.flashingLogic);
  game.snake.forEach(i => $(".cell").eq(i).css("background-color",game.bodyColor)); // return game.snake's color
  game.gameTimers.powerupSpawn = setInterval(generatePowerUp,game.powerUp.speed); // turns on the buff spawner again
  game.immortalSnake = false;
}

// Function for locating an empty spot on the grid. This makes it easier to add objects to the game since I only need to update this particular function.
function findEmptySpot() {
  let foundLocation = false;
  let objectLocations = game.snake.concat(game.apples,game.powerUp.location); // Fills a new array with the locations of all objects in the game
  while(!foundLocation) {
    let randomPosition = randomNumber(0,game.gridSize-1);
    if(objectLocations.indexOf(randomPosition) === -1) { // If the randomly generated position is an empty position, return it's position.
      foundLocation = true;
      return randomPosition;
    }
  }
}

// Generate a random number between two values, inclusive. Still need to go around and update the places I need to use this.
function randomNumber(min, max) {
  return Math.floor(Math.random()*((max+1)-min)+min);
}