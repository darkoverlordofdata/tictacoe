

/**
 *
 * @param leaderboardId
 * @constructor
 */
function Game(leaderboardId) {
    console.log("Class Game Initialized");

    var gc,             //  Cocoon.Social.GameCenter
        gp,             //  Cocoon.Social.GooglePlayGames
        _this = this;   //  Game

    // bind callback methods
    var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
    this.handleMatch =          __bind(this.handleMatch, this);
    this.loginSocialService =   __bind(this.loginSocialService, this);
    this.createMatch =          __bind(this.createMatch, this);
    this.cancelMatch =          __bind(this.cancelMatch, this);
    this.showLeaderboard =      __bind(this.showLeaderboard, this);
    this.disconnect =           __bind(this.disconnect, this);
    this.isSocial =             __bind(this.isSocial, this);
    this.submitScore =          __bind(this.submitScore, this);
    this.init =                 __bind(this.init, this);
    this.isLocalPlayerTurn =    __bind(this.isLocalPlayerTurn, this);
    this.getPlayerAlias =       __bind(this.getPlayerAlias, this);
    this.send =                 __bind(this.send, this);

    this.width = parseInt(window.innerWidth);
    this.height = parseInt(window.innerHeight);
    this.size = 0.85 * 500;
    this.waitingLogin = false;
    this.usingGameCenter = false; //hint used to show Game cetner Disabled errors;
    this.model = new TicTacToeGameModel(this, this.width, this.height, this.size);
    this.ui = new Canvas(this, this.model, this.width, this.height, this.size);

    if (Cocoon.Social.GameCenter.nativeAvailable) {
        gc = Cocoon.Social.GameCenter;
        this.socialService = gc.getSocialInterface();
        this.multiplayerService = gc.getMultiplayerInterface();
        this.usingGameCenter = true;
    } else if (Cocoon.Social.GooglePlayGames.nativeAvailable) {
        gp = Cocoon.Social.GooglePlayGames;
        gp.init({defaultLeaderboard: leaderboardId});
        this.socialService = gp.getSocialInterface();
        this.multiplayerService = gp.getMultiplayerInterface();
    } else {
        console.log("No Native Game Services");
    }

    this.loopbackServices = [new Cocoon.Multiplayer.LoopbackService(),new Cocoon.Multiplayer.LoopbackService()];


    if (this.multiplayerService) {

        this.multiplayerService.on("invitation",{
            /**
             *
             */
            received: function(){
                console.log("Invitation received");
                if (_this.model.state !== GAMESTATES.STATE_IDLE) {
                    //simulate exit click
                    _this.ui.processGameTouch(0, _this.ui.canvas_height);
                }
                _this.model.state = GAMESTATES.STATE_CREATING_MATCH;
            },
            /**
             *
             * @param match
             * @param error
             */
            loaded: function(match, error){
                console.log("Invitation ready: (Error: + " + JSON.stringify(error) + ")");
                _this.model.isMultiplayerGame = true;
                _this.handleMatch(match,error);
            }
        });
    }
    //Social Service Login and Score Listeners
    if (this.socialService) {
        this.socialService.on("loginStatusChanged",function(loggedIn, error){
            if (loggedIn) {
                console.log("Logged into social service");
                _this.socialService.requestScore(function(score, error){
                    if (error) {
                        console.error("Error getting user score: " + error.message);
                    }
                    else if (score) {
                        console.log("score: " + score.score);
                        _this.model.localUserScore = score.score;
                    }
                });
            }
        });

        this.loginSocialService(true);
    }

}
/**
 *
 * @type {{constructor: Game, model: undefined, ui: undefined, socialService: undefined, multiplayerService: undefined, players: undefined, waitingLogin: boolean, usingGameCenter: boolean, width: number, height: number, size: number, init: Function, handleMatch: Function, loginSocialService: Function, createMatch: Function, cancelMatch: Function, showLeaderboard: Function, disconnect: Function, isSocial: Function, submitScore: Function, isLocalPlayerTurn: Function, getPlayerAlias: Function, send: Function}}
 */
Game.prototype = {
    constructor: Game,
    width: 0,
    height: 0,
    size: 0,
    waitingLogin: false,
    usingGameCenter: false,
    model: undefined,
    ui: undefined,
    socialService: undefined,
    multiplayerService: undefined,
    players: undefined,

    /**
     *
     * @param players
     * @param services
     * @param firstTurn
     * @param firstPlayerTokens
     */
    init: function(players, services, firstTurn, firstPlayerTokens) {
        // make a copy
        this.players = players.slice();
        // and order players by ID to sync multiplayer turn order
        this.players.sort(function(a,b) {return a.userID  < b.userID ? -1 : 1;} );

        //get the references to each multiplayer match instance
        for (var i = 0; i < this.players.length; ++i) {
            this.players[i].match = null;
            for (var j = 0; j < services.length; ++j) {
                if (services[j] && services[j].getMatch().getLocalPlayerID() === this.players[i].userID ) {
                    this.players[i].match = services[j].getMatch();
                }
            }
        }

        //Only the first players sends a random value to determine the turn and tokens for each player
        if (this.players[0].match != null) {
            this.players[0].match.sendDataToAllPlayers(JSON.stringify(["turn", firstTurn, firstPlayerTokens]));
        }

    },

    /**
     *
     * @param match
     * @param error
     */
    handleMatch: function(match, error) {

        var _this = this;

        console.log(match);
        if (!match) {
            this.model.state = GAMESTATES.STATE_IDLE;
            console.log(error ? error.message : "match canceled");
            return;
        }

        console.log("match found");
        this.model.state = GAMESTATES.STATE_WAITING_FOR_PLAYERS;
        var requestPlayersCallback = function(players, error) {
            if (error) {
                alert("requestPlayersInfo:" + error.message);
                _this.model.state = GAMESTATES.STATE_IDLE;
                return;
            }
            console.log("Received players info: " + JSON.stringify(players));
            _this.model.initGame(players, _this.model.isMultiplayerGame ? [_this.multiplayerService] : _this.loopbackServices);
            match.start();
        };

        match.on("match",{
            /**
             *
             * @param match
             * @param data
             * @param playerID
             */
            dataReceived: function(match, data, playerID){

                console.log("received Data: " + data  + " from Player: " + playerID);
                var messsage = JSON.parse(data);

                if (messsage[0] === "token") {
                    _this.model.tokenMessageReceived(messsage[1], messsage[2], playerID);
                }
                else if (messsage[0] === "exit" && _this.model.state === GAMESTATES.STATE_PLAYING && _this.model.isMultiplayerGame) {
                    alert("Opponent disconnected");
                    _this.disconnect(false);
                }
                else if (messsage[0] === "turn") {
                    _this.model.firstTurnMessageReceived(messsage[1],messsage[2]);
                }
            },
            /**
             *
             * @param match
             * @param player
             * @param state
             */
            stateChanged: function(match, player, state){
                console.log("onMatchStateChanged: " + player + " " + state);

                if (_this.model.state == GAMESTATES.STATE_WAITING_FOR_PLAYERS && match.getExpectedPlayerCount() == 0) {
                    match.requestPlayersInfo(requestPlayersCallback);
                }
            },
            /**
             *
             * @param match
             * @param player
             * @param error
             */
            connectionWithPlayerFailed: function(match, player, error){
                alert("onMatchConnectionWithPlayerFailed: " + player + " " + error);
                _this.disconnect(false);
            },
            /**
             *
             * @param match
             * @param error
             */
            failed: function(match, error){
                console.error("onMatchFailed " +  error);
                _this.disconnect(false);
            }
        });

        // The match might be returned before connections have been established between players. At this stage, all the players are in the process of connecting to each other.
        // Always check the getExpectedPlayerCount value before starting a match. When its value reaches zero, all expected players are connected, and your game can begin the match.
        // If expectedPlayerCount > 0 waint until onMatchStateChanged events
        if (match.getExpectedPlayerCount() == 0) {
            match.requestPlayersInfo(requestPlayersCallback);
        }
    },

    /**
     *
     * @param autoLogin
     */
    loginSocialService: function(autoLogin) {
        var _this = this;
        if (!this.socialService)
            return;

        if (!this.waitingLogin) {
            this.waitingLogin = true;
            this.socialService.login(function(loggedIn, error){
                if (!loggedIn || error) {
                    console.error("Login failed: " + JSON.stringify(error));
                    //Tell the user that Game Center is Disabled
                    if (!autoLogin && error.code == 2 && _this.usingGameCenter) {
                        Cocoon.Dialog.confirm({
                            title : "Game Center Disabled",
                            message : "Sign in with the Game Center application to enable it",
                            confirmText : "Ok",
                            cancelText : "Cancel"
                        }, function(accepted){
                            if(accepted) Cocoon.App.openURL("gamecenter:");
                        });
                    }
                }

                _this.waitingLogin = false;
            });

        }
    },

    /**
     *
     * @param multi
     */
    createMatch: function(multi) {
        var request = new Cocoon.Multiplayer.MatchRequest(2,2);
        if (multi) {

            if (this.multiplayerService == null) {
                alert("Multiplayer is not supported on this device");
                return;
            }

            if (!this.socialService.isLoggedIn()) {

                this.loginSocialService(false);
            }
            else
            {
                this.model.isMultiplayerGame = true;
                this.multiplayerService.findMatch(request, this.handleMatch);
                this.model.state = GAMESTATES.STATE_CREATING_MATCH;
            }


        } else {

            this.model.isMultiplayerGame = false;
            this.loopbackServices[0].findAutoMatch(request, this.handleMatch);
            this.loopbackServices[1].findAutoMatch(request, function(){}); //only listen to the first loopback service delegate
            this.model.state = GAMESTATES.STATE_CREATING_MATCH;
        }

    },

    /**
     *
     */
    cancelMatch: function() {
        if (this.model.isMultiplayerGame) {
            this.multiplayerService.cancelAutoMatch();
        }
        else {
            this.loopbackServices[0].cancelAutomatch();
            this.loopbackServices[1].cancelAutomatch();
        }

        this.model.state = GAMESTATES.STATE_IDLE;

    },

    /**
     *
     */
    isSocial: function() {
        this.socialService && this.socialService.isLoggedIn()
    },

    /**
     *
     * @returns {boolean}
     */
    showLeaderboard: function() {
        console.log("Social: "+this.isSocial());
        if(this.isSocial()) {
            this.model.state = GAMESTATES.STATE_IDLE;
            this.socialService.showLeaderboard();
            return true;
        } else {
            return false;
        }
    },

    /**
     *
     * @param sendMessage
     * @returns {boolean}
     */
    disconnect: function(sendMessage) {
        this.model.state = GAMESTATES.STATE_IDLE;
        for (var i = 0; i < this.players.length; ++i) {
            if (this.players[i].match != null){
                if (sendMessage){
                    this.players[i].match.sendDataToAllPlayers(JSON.stringify(["exit"]));
                    this.players[i].match.disconnect();
                }
            }
        }
        return true;
    },

    /**
     *
     * @param value
     */
    submitScore: function(value) {
        this.socialService.submitScore(value, function(error) {
            if (error) {
                console.error("Error submitting score: " + error);
            }
            else {
                console.log("Score submitted!");
            }
        });

    },

    /**
     *
     * @param index
     * @returns {boolean}
     */
    isLocalPlayerTurn: function(index) {
        return !!this.players[index].match;
    },

    /**
     *
     * @param index
     * @returns {userName|*|Cocoon.Social.User.userName|Cocoon.Social.Score.userName|Cocoon.Social.GameCenter.Score.userName|Cocoon.Multiplayer.PlayerInfo.userName}
     */
    getPlayerAlias: function(index) {
        return this.players[index].userName;
    },

    /**
     *
     * @param index
     * @param message
     */
    send: function(index, message) {
        this.players[index].match.sendDataToAllPlayers(message);
    }

};

