

/**
 *
 * @param leaderboardId
 * @constructor
 */
function Game(leaderboardId) {
    console.log("Class Game Initialized");

    // bind callback methods
    var _this = this,
        __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); };},
        __slice = Array.prototype.slice;

    this.init =                         __bind(this.init, this);
    this.isLocalPlayerTurn =            __bind(this.isLocalPlayerTurn, this);
    this.getPlayerAlias =               __bind(this.getPlayerAlias, this);
    this.send =                         __bind(this.send, this);
    this.isSocial =                     __bind(this.isSocial, this);
    this.submitScore =                  __bind(this.submitScore, this);
    this.waitingLogin =                 __bind(this.waitingLogin, this);
    this.createMatch =                  __bind(this.createMatch, this);
    this.cancelMatch =                  __bind(this.cancelMatch, this);
    this.disconnect =                   __bind(this.disconnect, this);
    this.showLeaderboard =              __bind(this.showLeaderboard, this);
    this.error =                        __bind(this.error, this);
    this.found =                        __bind(this.found, this);
    this.init =                         __bind(this.init, this);
    this.dataReceived =                 __bind(this.dataReceived, this);
    this.stateChanged =                 __bind(this.stateChanged, this);
    this.connectionWithPlayerFailed =   __bind(this.connectionWithPlayerFailed, this);
    this.failed =                       __bind(this.failed, this);
    this.loginStatusChanged =           __bind(this.loginStatusChanged, this);
    this.requestScore =                 __bind(this.requestScore, this);
    this.received =                     __bind(this.received, this);
    this.loaded =                       __bind(this.loaded, this);

    this.width = parseInt(window.innerWidth);
    this.height = parseInt(window.innerHeight);
    this.size = 0.85 * 500;
    this.model = new TicTacToeGameModel(this, this.width, this.height, this.size);
    this.ui = new Canvas(this, this.model, this.width, this.height, this.size);
    this.match = new Match(leaderboardId,function(type) {_this[type].apply(_this, __slice.call(arguments, 1));});

}

/**
 *
 * @type {{constructor: Game, width: number, height: number, size: number, model: undefined, ui: undefined, match: undefined, multiplayerService: Function, socialService: Function, matchEvent: Function, init: Function, handleMatch: Function, loginSocialService: Function, createMatch: Function, cancelMatch: Function, isSocial: Function, showLeaderboard: Function, disconnect: Function, submitScore: Function, isLocalPlayerTurn: Function, getPlayerAlias: Function, send: Function}}
 */
Game.prototype = {
    constructor: Game,
    width: 0,
    height: 0,
    size: 0,
    model: undefined,
    ui: undefined,
    match: undefined,

    start: function(players, services, firstTurn, firstPlayerTokens) {
        this.match.init(players, services, firstTurn, firstPlayerTokens);
    },


    waitingLogin: function() {
      return this.match.waitingLogin;
    },

    isLocalPlayerTurn: function(index) {
        return this.match.isLocalPlayerTurn(index);
    },

    getPlayerAlias: function(index) {
        return this.match.getPlayerAlias(index);
    },

    send: function(index, message) {
        this.match.send(index, message);
    },

    isSocial: function() {
        return this.match.isSocial();
    },

    submitScore: function(value) {
        this.match.submitScore(value);
    },

    createMatch: function(multi, players, tokens) {
        this.match.createMatch(multi, players, tokens);
    },

    cancelMatch: function() {
        this.match.cancelMatch();
    },

    disconnect: function(sendMessage) {
        this.model.state = GAMESTATES.STATE_IDLE;
        this.match.disconnect(sendMessage);
    },

    showLeaderboard: function() {
        this.match.showLeaderboard();
    },



    error: function(error) {
        this.model.state = GAMESTATES.STATE_IDLE;
        console.log(error ? error.message : "match canceled");
    },

    found: function() {
        this.model.state = GAMESTATES.STATE_WAITING_FOR_PLAYERS;
    },

    init: function(players, services) {
        this.model.init(players, services);
    },

    dataReceived: function(match, data, playerID) {

        message = JSON.parse(data);

        if (message[0] === "token") {
            this.model.tokenMessageReceived(message[1], message[2], playerID);
        }
        else if (message[0] === "exit" && this.model.state === GAMESTATES.STATE_PLAYING && this.model.isMultiplayerGame) {
            alert("Opponent disconnected");
            this.match.disconnect(false);
        }
        else if (message[0] === "turn") {
            this.model.firstTurnMessageReceived(message[1],message[2]);
        }
    },

    stateChanged: function(match, player, state) {
        if (this.model.state === GAMESTATES.STATE_WAITING_FOR_PLAYERS)
            this.match.requestPlayersInfo(match);
    },

    connectionWithPlayerFailed: function(match, player, error) {

        this.match.disconnect(false);
    },

    failed: function(match, error) {

        this.match.disconnect(false);
    },

    loginStatusChanged: function(object, value, error) {
    },

    requestScore: function(object, value, error) {
        if (error) {
            console.error("Error getting user score: " + error.message);
        } else if (value) {
            console.log("score: " + value.score);
            this.model.localUserScore = value.score;
        }
    },

    received: function(object, match, error) {
        if (this.model.state !== GAMESTATES.STATE_IDLE) {
            //simulate exit click
            this.ui.onTouch(0, this.ui.canvas_height);
        }
        this.model.state = GAMESTATES.STATE_CREATING_MATCH;

    },

    loaded: function(object, match, error) {
        this.model.isMultiplayerGame = true;
    }

};

