

/**
 *
 * @param leaderboardId
 * @constructor
 */
function Game(leaderboardId) {
    console.log("Class Game Initialized");

    // bind callback methods
    var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
    this.init =                 __bind(this.init, this);
    this.multiplayerService =   __bind(this.multiplayerService, this);
    this.socialService =        __bind(this.socialService, this);
    this.handleMatch =          __bind(this.handleMatch, this);
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
    this.match = new Match(this, leaderboardId);
    this.model = new TicTacToeGameModel(this, this.width, this.height, this.size);
    this.ui = new Canvas(this, this.model, this.width, this.height, this.size);

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
        this.match.disconnect(sendMessage);
    },

    showLeaderboard: function(sendMessage) {
        this.match.disconnect(sendMessage);
    },

    /**
     *
     * @param type
     * @param object
     * @param match
     * @param error
     */
    multiplayerService: function(type, object, match, error) {
        switch(type) {

            case 'received':
                if (this.model.state !== GAMESTATES.STATE_IDLE) {
                    //simulate exit click
                    this.ui.processGameTouch(0, this.ui.canvas_height);
                }
                this.model.state = GAMESTATES.STATE_CREATING_MATCH;

                break;

            case 'loaded':
                this.model.isMultiplayerGame = true;
                break;
        }
    },

    /**
     *
     *
     * @param type
     * @param object
     * @param value
     * @param error
     */
    socialService: function(type, object, value, error) {
        switch(type) {

            case 'loginStatusChanged':
                break;

            case 'requestScore':
                if (error) {
                    console.error("Error getting user score: " + error.message);
                } else if (value) {
                    console.log("score: " + value.score);
                    this.model.localUserScore = value.score;
                }
                break;
        }
    },

    /**
     *
     * @param type
     */
    handleMatch: function(type) {
        var error,
            players,
            services,
            match,
            data,
            playerID,
            message,
            player,
            state;
        
        switch(type) {

            case 'error':
                error = arguments[1];
                
                this.model.state = GAMESTATES.STATE_IDLE;
                console.log(error ? error.message : "match canceled");
                break;

            case 'found':
                this.model.state = GAMESTATES.STATE_WAITING_FOR_PLAYERS;
                break;

            case 'init':
                players = arguments[1];
                services = arguments[2];
                
                this.model.initGame(players, services)
                break;

            case 'dataReceived':
                match = arguments[1];
                data = arguments[2];
                playerID = arguments[3];
                
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
                break;

            case 'stateChanged':
                match = arguments[1];
                player = arguments[2];
                state = arguments[3];

                if (this.model.state === GAMESTATES.STATE_WAITING_FOR_PLAYERS)
                    this.match.requestPlayersInfo(match);
                break;

            case 'connectionWithPlayerFailed':
                match = arguments[1];
                player = arguments[2];
                error = arguments[3];

                this.match.disconnect(false);
                break;

            case 'failed':
                match = arguments[1];
                error = arguments[2];

                this.match.disconnect(false);
                break;
        }
    }

};

