var app = require('./app');

var displayBoard = function(boardInfo){
  //Printing width numbers
  process.stdout.write("   ");
  for (var k = 0; k < boardInfo.width; k++){
    process.stdout.write("" + k);
    if (k < boardInfo.width - 1){
      process.stdout.write(" ");
    }
  }
  process.stdout.write("\n\n");
  //Printing height numbers + board pieces
  for (var i = 0; i < boardInfo.height; i++){
    var row = "" + i + "  ";
    for (var j = 0; j < boardInfo.width; j++){
      row += (boardInfo.revealed[i][j]) ? ((boardInfo.board[i][j]) ? "X" : ((boardInfo.adjMinesCount[i][j]) ? boardInfo.adjMinesCount[i][j].toString() : "*") ) : (boardInfo.flagged[i][j]) ? "F" : "#";
      if (j < boardInfo.width - 1){
        row += " ".repeat((j < 10) ? 1 : Math.floor(Math.log10(j)) + 1);
      }
    }
    console.log(row);
  }
}

try {
  app.init({width: 10, height: 10, mines: 10});
}catch (e){
  console.log("ERROR: A critical error occurred. Error info: \nName: " + e.name + "\nMessage: " + e.message);
  return 1;
}

var isGameOver = false;

process.stdin.setEncoding('utf8');

process.stdin.on('readable', function(){
  var chunk = process.stdin.read();
  if (chunk !== null){
    var commandArr = chunk.split(" ");
    if (commandArr.length >= 3){
      var command = commandArr[0];
      var inputX = parseInt(commandArr[1]);
      var inputY = parseInt(commandArr[2]);
      if (command == "select"){
        var result = app.selectSpot(inputX, inputY);
        if (result.hitInfo == "mine"){
          isGameOver = true;
          console.log("Game over buddy!");
        }else if (result.hitInfo == "alreadyhit"){
          console.log("Already hit!");
        }else if (result.hitInfo == "nonexistent"){
          console.log("This piece does not exist on the board. Select a piece that exists.");
        }else{
          console.log("You're good!");
        }
        if (result.win){
          isGameOver = true;
          console.log("YOU WIN!!!!");
        }
      }else if (command == "flag"){
        var flag = app.flagSpot(inputX, inputY)
        if (flag.flagInfo == "flagged"){
          console.log("Spot [" + inputX + ", " + inputY + "] has been flagged.");
        }else if (flag.flagInfo == "unflagged"){
          console.log("Spot [" + inputX + ", " + inputY + "] has been unflagged.");
        }else if (flag.flagInfo == "alreadyrevealed"){
          console.log("Spot [" + inputX + ", " + inputY + "] has already been revealed.");
        }else if (flag.flagInfo == "nonexistent"){
          console.log("Spot does not exist, so it cannot be flagged.");
        }
      }

      displayBoard(app.getBoardInfo());
    }

    if (isGameOver)
      process.stdin.end();
  }
});
