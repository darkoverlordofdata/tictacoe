/**
 *
 * @type {{STATE_IDLE: number, STATE_CREATING_MATCH: number, STATE_WAITING_FOR_PLAYERS: number, STATE_PLAYING: number, STATE_SCORES: number}}
 */

var GAMESTATES = {
    STATE_IDLE                  : 0,
    STATE_CREATING_MATCH        : 1,
    STATE_WAITING_FOR_PLAYERS   : 2,
    STATE_PLAYING               : 3,
    STATE_SCORES                : 4
};

/**
 *
 * @param game
 * @param width
 * @param height
 * @param size
 * @constructor
 */
function TicTacToeGameModel(game, width, height, size)
{

    console.log("Class TicTacToeGameModel Initialized");

    this.game = game;
    this.oTokens = [[0,0,0],[0,0,0],[0,0,0]];
    this.xTokens = [[0,0,0],[0,0,0],[0,0,0]];
    this.boardRect = {x: width/2 - size/2, y: height/2-size/2, w:size, h:size };
    this.players = [];
    this.playerTurn = 0;
    this.state = GAMESTATES.STATE_IDLE;
    this.isMultiplayerGame = false;
    this.localUserScore = 0;
}

TicTacToeGameModel.prototype = {

    constructor: TicTacToeGameModel,
    game: undefined,
    oTokens: undefined,
    xTokens: undefined,
    boardRect: undefined,
    players: undefined,
    playerTurn: 0,
    state: GAMESTATES.STATE_IDLE,
    isMultiplayerGame: false,
    localUserScore: 0,

    initGame: function(playersInfo, services) {
        this.oTokens = [[0,0,0],[0,0,0],[0,0,0]];
        this.xTokens = [[0,0,0],[0,0,0],[0,0,0]];
        this.players = playersInfo.slice();
        this.playerTurn = 0;
        this.playerTokenSelector= 0;

        this.game.init(playersInfo, services)
        ////order players by ID to sync multiplayer turn order
        //this.players.sort(function(a,b) {return a.userID  < b.userID ? -1 : 1;} );
        //
        //
        ////get the references to each multiplayer match instance
        //for (var i = 0; i < this.players.length; ++i) {
        //    this.players[i].match = null;
        //    for (var j = 0; j < services.length; ++j) {
        //        if (services[j] && services[j].getMatch().getLocalPlayerID() === this.players[i].userID ) {
        //            this.players[i].match = services[j].getMatch();
        //        }
        //    }
        //}
        //
        ////Only the first players sends a random value to determine the turn and tokens for each player
        //if (this.players[0].match != null) {
        //    var firstTurn = Math.random() < 0.5 ? 0 : 1;
        //    var firstPlayerTokens = Math.random() < 0.5 ? 0 : 1;
        //    this.players[0].match.sendDataToAllPlayers(JSON.stringify(["turn",firstTurn, firstPlayerTokens]));
        //}
    },

    nextTurn: function() {
        this.playerTurn = (this.playerTurn+1) %2;
    },

    isLocalPlayerTurn: function() {
        return !!this.players[this.playerTurn].match;
    },

    isPlayerTurn: function(index){
        return this.playerTurn === index;
    },

    getPlayerAlias: function(index) {
        return this.players[index].userName;
    },

    getPlayerTokens: function(index) {
        if (this.playerTokenSelector == 0) return index == 0 ? this.xTokens : this.oTokens;
        if (this.playerTokenSelector == 1) return index == 1 ? this.xTokens : this.oTokens;
    },
    getPlayerTokensSymbol: function(index) {
        return this.getPlayerTokens(index) === this.xTokens ? "X" : "O";
    },
    putToken: function(row, col) {
        console.log("putToken " + row + " " + col);
        if (this.isLocalPlayerTurn() && this.oTokens[row][col] ===0 && this.xTokens[row][col] ===0 &&  this.state === GAMESTATES.STATE_PLAYING) {
            var message = JSON.stringify(["token",row,col]);
            console.log("sent message: " + message);
            this.players[this.playerTurn].match.sendDataToAllPlayers(message);
        }
    },

    tokenMessageReceived: function(row,col,playerID) {
        var _this = this;
        var tokens = this.getPlayerTokens(this.playerTurn);
        console.log("tokenMessageReceived: " + row + " " + col);
        tokens[row][col] = 1;
        if (this.checkWinnerTokens()) {

            this.state = GAMESTATES.STATE_SCORES;
            setTimeout(function(){_this.showWinAnimation()},100);
            //send scores only if it is a multiplayer match and the local player is the winner
            if (this.isMultiplayerGame && this.isLocalPlayerTurn() && this.game.isSocial()) {
                this.localUserScore+=100;
                console.log("submitScore " + this.localUserScore);
                this.game.submitScore(this.localUserScore);
            }
        }
        else if (this.checkTieGame()) {

            this.state = GAMESTATES.STATE_SCORES;
            _this = this;
            setTimeout(function(){_this.showTieAnimation()},100);
            if (this.isMultiplayerGame && this.game.isSocial()) {
                this.localUserScore+=10;
                console.log("submitScore " + this.localUserScore);
                this.game.submitScore(this.localUserScore);
            }
        }
        else
        {
            this.nextTurn();
        }

    },

    firstTurnMessageReceived: function(firstTurn, firstPlayertokens) {
        this.playerTurn = firstTurn;
        this.playerTokenSelector = firstPlayertokens;

        this.state = GAMESTATES.STATE_PLAYING;
    },

    checkWinnerTokens: function() {
        var tokens = this.getPlayerTokens(this.playerTurn);

        //vertical and horizontal lines
        for (var i = 0; i < 3; ++i) {
            if (tokens[i][0] === 1 && tokens[i][1] === 1 && tokens[i][2] === 1) return true;
            if (tokens[0][i] === 1 && tokens[1][i] === 1 && tokens[2][i] === 1) return true;
        }

        //diagonal lines
        if (tokens[0][0] === 1 && tokens[1][1] ===1 && tokens[2][2] === 1) return true;
        if (tokens[0][2] === 1 && tokens[1][1] ===1 && tokens[2][0] === 1) return true;

        return false;
    },

    checkTieGame: function() {

        var n = 0;
        for (var i = 0; i< 3; ++i) {
            for (var j = 0; j < 3; ++j ) {
                if (this.xTokens[i][j] === 1) n++;
                if (this.oTokens[i][j] === 1) n++;
            }
        }

        return n >=9;
    },

    showWinAnimation: function() {
        alert(this.players[this.playerTurn].userName + " Wins");
    },
    showTieAnimation: function() {
        alert("Tie game");
    },

    disconnect: function(sendMessage) {
        this.state = GAMESTATES.STATE_IDLE;
        for (var i = 0; i < this.players.length; ++i) {
            if (this.players[i].match != null){
                if (sendMessage){
                    this.players[i].match.sendDataToAllPlayers(JSON.stringify(["exit"]));
                    this.players[i].match.disconnect();
                }
            }
        }
    }
};
