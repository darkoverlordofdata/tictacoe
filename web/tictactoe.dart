part of tictactoe;

const STATE_IDLE                 = 0;
const STATE_CREATING_MATCH       = 1;
const STATE_WAITING_FOR_PLAYERS  = 2;
const STATE_PLAYING              = 3;
const STATE_SCORES               = 4;

class TicTacToeGameModel {

  static const ms = const Duration(milliseconds: 1);

  var game;
  List<List<int>> oTokens;
  List<List<int>> xTokens;
  var boardRect;
  int playerTurn;
  int state;
  bool isMultiplayerGame;
  int localUserScore;
  var playerTokenSelector;
  Math.Random rnd;

  TicTacToeGameModel(this.game, int width, int height, int size) {

    print("Class TicTacToeGameModel Initialized");

    oTokens = [[0,0,0],[0,0,0],[0,0,0]];
    xTokens = [[0,0,0],[0,0,0],[0,0,0]];
    boardRect = {'x': width/2 - size/2, 'y': height/2-size/2, 'w':size, 'h':size };
    playerTurn = 0;
    state = STATE_IDLE;
    isMultiplayerGame = false;
    localUserScore = 0;
    rnd = new Math.Random();
  }

  init(JsArray playersInfo, services) {
    game.start(playersInfo, services, rnd.nextInt(2), rnd.nextInt(2));
    oTokens = [[0,0,0],[0,0,0],[0,0,0]];
    xTokens = [[0,0,0],[0,0,0],[0,0,0]];
    playerTurn = 0;
    playerTokenSelector= 0;
  }

  nextTurn() {
    playerTurn = (playerTurn+1) %2;
  }

  isLocalPlayerTurn() {
    return game.isLocalPlayerTurn(playerTurn);
  }

  isPlayerTurn(index){
    return playerTurn == index;
  }

  getPlayerAlias(index) {
    return game.getPlayerAlias(index);
  }

  getPlayerTokens(index) {
    if (playerTokenSelector == 0) return index == 0 ? xTokens : oTokens;
    if (playerTokenSelector == 1) return index == 1 ? xTokens : oTokens;
  }

  getPlayerTokensSymbol(index) {
    return getPlayerTokens(index) == xTokens ? "X" : "O";
  }

  putToken(row, col) {
    if (isLocalPlayerTurn() && oTokens[row][col] == 0 && xTokens[row][col] == 0 && state == STATE_PLAYING) {
      var message = JSON.encode(["token",row,col]);
      print("sent message: " + message);
      game.send(playerTurn, message);
    }
  }

  tokenMessageReceived(row,col,playerID) {
    var tokens = getPlayerTokens(playerTurn);

    tokens[row][col] = 1;
    if (checkWinnerTokens()) {

      state = STATE_SCORES;
      new Timer(ms*100, (){showWinAnimation();});

      //send scores only if it is a multiplayer match and the local player is the winner
      if (isMultiplayerGame && isLocalPlayerTurn() && game.isSocial()) {
        localUserScore+=100;
        print("submitScore $localUserScore");
        game.submitScore(localUserScore, (error) {
          if (error) {
            print("Error submitting score: " + error);
          } else {
            print("Score submitted!");
          }
        });
      }
    }
    else if (checkTieGame()) {
      state = STATE_SCORES;

      new Timer(ms*100, (){showTieAnimation();});
      if (isMultiplayerGame && game.isSocial()) {
        localUserScore+=10;
        print("submitScore $localUserScore");
        game.submitScore(localUserScore, (error) {
          if (error) {
            print("Error submitting score: " + error);
          } else {
            print("Score submitted!");
          }
        });
      }
    } else {
      nextTurn();
    }

  }
  firstTurnMessageReceived(firstTurn, firstPlayertokens) {
    playerTurn = firstTurn;
    playerTokenSelector = firstPlayertokens;

    state = STATE_PLAYING;
  }

  checkWinnerTokens() {
    var tokens = getPlayerTokens(playerTurn);

    //vertical and horizontal lines
    for (var i = 0; i < 3; ++i) {
      if (tokens[i][0] == 1 && tokens[i][1] == 1 && tokens[i][2] == 1) return true;
      if (tokens[0][i] == 1 && tokens[1][i] == 1 && tokens[2][i] == 1) return true;
    }

    //diagonal lines
    if (tokens[0][0] == 1 && tokens[1][1] ==1 && tokens[2][2] == 1) return true;
    if (tokens[0][2] == 1 && tokens[1][1] ==1 && tokens[2][0] == 1) return true;

    return false;
  }

  checkTieGame() {

    var n = 0;
    for (var i = 0; i< 3; ++i) {
      for (var j = 0; j < 3; ++j ) {
        if (xTokens[i][j] == 1) n++;
        if (oTokens[i][j] == 1) n++;
      }
    }

    return n >=9;
  }

  showWinAnimation() {
    window.alert(game.getPlayerAlias(this.playerTurn) + " Wins");
  }
  showTieAnimation() {
    window.alert("Tie game");
  }

}
