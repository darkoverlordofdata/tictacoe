

/**
 *
 * @param leaderboardId
 * @constructor
 */
function Game(leaderboardId) {
    console.log("Class Game Initialized");

    // bind callback methods
    var _this = this,
        __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

    this.init =                 __bind(this.init, this);
    this.isLocalPlayerTurn =    __bind(this.isLocalPlayerTurn, this);
    this.getPlayerAlias =       __bind(this.getPlayerAlias, this);
    this.send =                 __bind(this.send, this);
    this.isSocial =             __bind(this.isSocial, this);
    this.submitScore =          __bind(this.submitScore, this);
    this.waitingLogin =         __bind(this.waitingLogin, this);
    this.createMatch =          __bind(this.createMatch, this);
    this.cancelMatch =          __bind(this.cancelMatch, this);
    this.disconnect =           __bind(this.disconnect, this);
    this.showLeaderboard =      __bind(this.showLeaderboard, this);

    this.width = parseInt(window.innerWidth);
    this.height = parseInt(window.innerHeight);
    this.size = 0.85 * 500;
    this.model = new TicTacToeGameModel(this, this.width, this.height, this.size);
    this.ui = new Canvas(this, this.model, this.width, this.height, this.size);
    this.match = new Match(leaderboardId,
        function(type) {
            var error,
                players,
                services,
                match,
                data,
                playerID,
                message,
                player,
                state,
                object,
                value;

            switch(type) {

                case 'error':
                    error = arguments[1];

                    _this.model.state = GAMESTATES.STATE_IDLE;
                    console.log(error ? error.message : "match canceled");
                    break;

                case 'found':
                    _this.model.state = GAMESTATES.STATE_WAITING_FOR_PLAYERS;
                    break;

                case 'init':
                    players = arguments[1];
                    services = arguments[2];

                    _this.model.init(players, services)
                    break;

                case 'dataReceived':
                    match = arguments[1];
                    data = arguments[2];
                    playerID = arguments[3];

                    message = JSON.parse(data);

                    if (message[0] === "token") {
                        _this.model.tokenMessageReceived(message[1], message[2], playerID);
                    }
                    else if (message[0] === "exit" && _this.model.state === GAMESTATES.STATE_PLAYING && _this.model.isMultiplayerGame) {
                        alert("Opponent disconnected");
                        _this.match.disconnect(false);
                    }
                    else if (message[0] === "turn") {
                        _this.model.firstTurnMessageReceived(message[1],message[2]);
                    }
                    break;

                case 'stateChanged':
                    match = arguments[1];
                    player = arguments[2];
                    state = arguments[3];

                    if (_this.model.state === GAMESTATES.STATE_WAITING_FOR_PLAYERS)
                        _this.match.requestPlayersInfo(match);
                    break;

                case 'connectionWithPlayerFailed':
                    match = arguments[1];
                    player = arguments[2];
                    error = arguments[3];

                    _this.match.disconnect(false);
                    break;

                case 'failed':
                    match = arguments[1];
                    error = arguments[2];

                    _this.match.disconnect(false);
                    break;

                //socialService: function(type, object, value, error) {
                case 'loginStatusChanged':
                    object = arguments[1];
                    value = arguments[2];
                    error = arguments[3];
                    break;

                //socialService: function(type, object, value, error) {
                case 'requestScore':
                    object = arguments[1];
                    value = arguments[2];
                    error = arguments[3];
                    if (error) {
                        console.error("Error getting user score: " + error.message);
                    } else if (value) {
                        console.log("score: " + value.score);
                        _this.model.localUserScore = value.score;
                    }
                    break;

                //multiplayerService: function(type, object, match, error) {
                case 'received':
                    object = arguments[1];
                    match = arguments[2];
                    error = arguments[3];
                    if (_this.model.state !== GAMESTATES.STATE_IDLE) {
                        //simulate exit click
                        _this.ui.onTouch(0, _this.ui.canvas_height);
                    }
                    _this.model.state = GAMESTATES.STATE_CREATING_MATCH;

                    break;

                //multiplayerService: function(type, object, match, error) {
                case 'loaded':
                    object = arguments[1];
                    match = arguments[2];
                    error = arguments[3];
                    _this.model.isMultiplayerGame = true;
                    break;

            }
        }
    );

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

    init: function(players, services, firstTurn, firstPlayerTokens) {
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
    }
};

