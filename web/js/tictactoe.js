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
    this.playerTurn = 0;
    this.state = GAMESTATES.STATE_IDLE;
    this.isMultiplayerGame = false;
    this.localUserScore = 0;
}

TicTacToeGameModel.prototype = {

    constructor: TicTacToeGameModel,
    state: GAMESTATES.STATE_IDLE,
    playerTurn: 0,
    isMultiplayerGame: false,
    localUserScore: 0,
    game: undefined,
    oTokens: undefined,
    xTokens: undefined,
    boardRect: undefined,

    /**
     *
     * @param playersInfo
     * @param services
     */
    initGame: function(playersInfo, services) {
        this.game.init(playersInfo, services, Math.random() < 0.5 ? 0 : 1, Math.random() < 0.5 ? 0 : 1);
        this.oTokens = [[0,0,0],[0,0,0],[0,0,0]];
        this.xTokens = [[0,0,0],[0,0,0],[0,0,0]];
        this.playerTurn = 0;
        this.playerTokenSelector= 0;
    },

    /**
     *
     */
    nextTurn: function() {
        this.playerTurn = (this.playerTurn+1) %2;
    },

    /**
     *
     * @returns {*}
     */
    isLocalPlayerTurn: function() {
        return this.game.isLocalPlayerTurn(this.playerTurn);
    },

    /**
     *
     * @param index
     * @returns {boolean}
     */
    isPlayerTurn: function(index){
        return this.playerTurn === index;
    },

    /**
     *
     * @param index
     * @returns {*}
     */
    getPlayerAlias: function(index) {
        return this.game.getPlayerAlias(index);
    },

    /**
     *
     * @param index
     * @returns {*}
     */
    getPlayerToken: function(index) {
        if (this.playerTokenSelector == 0) return index == 0 ? this.xTokens : this.oTokens;
        if (this.playerTokenSelector == 1) return index == 1 ? this.xTokens : this.oTokens;
    },

    /**
     *
     * @param index
     * @returns {string}
     */
    getPlayerTokenSymbol: function(index) {
        return this.getPlayerToken(index) === this.xTokens ? "X" : "O";
    },

    /**
     *
     * @param row
     * @param col
     */
    putToken: function(row, col) {
        console.log("putToken " + row + " " + col);
        if (this.isLocalPlayerTurn() && this.oTokens[row][col] ===0 && this.xTokens[row][col] ===0 &&  this.state === GAMESTATES.STATE_PLAYING) {
            var message = JSON.stringify(["token",row,col]);
            console.log("sent message: " + message);
            this.game.send(this.playerTurn, message);
        }
    },

    /**
     *
     * @param row
     * @param col
     * @param playerID
     */
    tokenMessageReceived: function(row,col,playerID) {
        var tokens = this.getPlayerToken(this.playerTurn),
            _this = this;
        
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
        } else if (this.checkTieGame()) {

            this.state = GAMESTATES.STATE_SCORES;
            setTimeout(function(){_this.showTieAnimation()},100);
            if (this.isMultiplayerGame && this.game.isSocial()) {
                this.localUserScore+=10;
                console.log("submitScore " + this.localUserScore);
                this.game.submitScore(this.localUserScore);
            }
        } else {
            this.nextTurn();
        }

    },

    /**
     *
     * @param firstTurn
     * @param firstPlayertokens
     */
    firstTurnMessageReceived: function(firstTurn, firstPlayertokens) {
        this.playerTurn = firstTurn;
        this.playerTokenSelector = firstPlayertokens;
        this.state = GAMESTATES.STATE_PLAYING;
    },

    /**
     *
     * @returns {boolean}
     */
    checkWinnerTokens: function() {
        var tokens = this.getPlayerToken(this.playerTurn);

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

    /**
     *
     * @returns {boolean}
     */
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

    /**
     *
     */
    showWinAnimation: function() {
        alert(this.game.getPlayerAlias(this.playerTurn) + " Wins")
    },

    /**
     *
     */
    showTieAnimation: function() {
        alert("Tie game");
    }
};
