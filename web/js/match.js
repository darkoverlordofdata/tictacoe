var Match = function(){

    var DEBUG = true;

    /**
     *
     * Turns Based Match
     *
     * @param game
     * @param leaderboardId
     * @constructor
     *
     */
    function Match(game, leaderboardId) {

        var gc,             //  Cocoon.Social.GameCenter
            gp,             //  Cocoon.Social.GooglePlayGames
            _this = this,   //  Game
            __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

        if (DEBUG) console.log("Class Match Initialized");

        // bind callback methods
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

        this.game = game;
        this.waitingLogin = false;
        this.usingGameCenter = false;

        /**
         * Connect to the Cocoon Native Game Service
         */
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
            if (DEBUG) console.log("No Native Game Services");
        }

        this.loopbackServices = [new Cocoon.Multiplayer.LoopbackService(),new Cocoon.Multiplayer.LoopbackService()];

        if (this.multiplayerService) {

            this.multiplayerService.on("invitation",{
                /**
                 * received calllback
                 */
                received: function(){
                    if (DEBUG) console.log("Invitation received");
                    _this.game.multiplayerService('received', _this);
                },
                /**
                 * loaded callback
                 *
                 * @param match
                 * @param error
                 */
                loaded: function(match, error){
                    if (DEBUG) console.log("Invitation ready: (Error: + " + JSON.stringify(error) + ")");
                    _this.game.multiplayerService('loaded', _this, match, error);
                    _this.handleMatch(match,error);
                }
            });
        }
        //Social Service Login and Score Listeners
        if (this.socialService) {
            this.socialService.on("loginStatusChanged",function(loggedIn, error){
                _this.game.socialService('loginStatusChanged', _this, loggedIn, error);
                if (loggedIn) {
                    if (DEBUG) console.log("Logged into social service");
                    _this.socialService.requestScore(function(score, error){
                        _this.game.socialService('requestScore', _this, score, error);
                    });
                }
            });

            this.loginSocialService(true);
        }

    }

    /**
     *
     * @type {{constructor: Match, waitingLogin: boolean, usingGameCenter: boolean, isMultiplayerGame: boolean, requestPlayersInfo: undefined, game: undefined, socialService: undefined, multiplayerService: undefined, players: undefined, init: Function, handleMatch: Function, loginSocialService: Function, createMatch: Function, cancelMatch: Function, isSocial: Function, showLeaderboard: Function, disconnect: Function, submitScore: Function, isLocalPlayerTurn: Function, getPlayerAlias: Function, send: Function}}
     */
    Match.prototype = {
        constructor: Match,
        waitingLogin: false,
        usingGameCenter: false,
        isMultiplayerGame: false,
        requestPlayersInfo: undefined,
        game: undefined,
        socialService: undefined,
        multiplayerService: undefined,
        players: undefined,

        /**
         * Initialize a match
         *
         * @param players
         * @param services
         * @param firstTurn
         * @param firstPlayerTokens
         */
        init: function(players, services, firstTurn, firstPlayerTokens) {
            var i,
                j;

            // make a copy
            this.players = players.slice();
            // and order players by ID to sync multiplayer turn order
            this.players.sort(function(a,b) {return a.userID  < b.userID ? -1 : 1;} );

            //get the references to each multiplayer match instance
            for (i = 0; i < this.players.length; ++i) {
                this.players[i].match = null;
                for (j = 0; j < services.length; ++j) {
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
         * Handle Match callbacks
         *
         * @param match
         * @param error
         */
        handleMatch: function(match, error) {

            var requestPlayersCallback,
                _this = this;

            if (DEBUG) console.log(match);
            if (!match) {
                _this.game.handleMatch('error', error ? error.message : "match canceled");
                return;
            }

            if (DEBUG) console.log("match found");
            _this.game.handleMatch('found', match);
            requestPlayersCallback = function(players, error) {
                if (error) {
                    if (DEBUG) console.log("requestPlayersInfo:" + error.message);
                    _this.game.handleMatch('error', "requestPlayersInfo:" + error.message)
                    return;
                }
                if (DEBUG) console.log("Received players info: " + JSON.stringify(players));
                _this.game.handleMatch('init', players, _this.isMultiplayerGame ? [_this.multiplayerService] : _this.loopbackServices);
                match.start();
            };

            _this.requestPlayersInfo = function(match) {
                if (match.getExpectedPlayerCount() === 0) {
                    match.requestPlayersInfo(requestPlayersCallback);
                }
            };


            match.on("match",{
                /**
                 * dataReceived callback
                 *
                 * @param match
                 * @param data
                 * @param playerID
                 */
                dataReceived: function(match, data, playerID){
                    if (DEBUG) console.log("received Data: " + data  + " from Player: " + playerID);
                    _this.game.handleMatch('dataReceived', match, data, playerID);
                },
                /**
                 * stateChanged callback
                 *
                 * @param match
                 * @param player
                 * @param state
                 */
                stateChanged: function(match, player, state){
                    if (DEBUG) console.log("onMatchStateChanged: " + player + " " + state);
                    _this.game.handleMatch('stateChanged', match, player, state);
                },
                /**
                 * connectionWithPlayerFailed callback
                 *
                 * @param match
                 * @param player
                 * @param error
                 */
                connectionWithPlayerFailed: function(match, player, error){
                    if (DEBUG) console.log("onMatchConnectionWithPlayerFailed: " + player + " " + error);
                    _this.game.handleMatch('connectionWithPlayerFailed', match, player, error);
                },
                /**
                 * failed callback
                 *
                 * @param match
                 * @param error
                 */
                failed: function(match, error){
                    if (DEBUG) console.log("onMatchFailed " +  error);
                    _this.game.handleMatch('failed', match, error);
                }
            });

            // The match might be returned before connections have been established between players. At this stage, all the players are in the process of connecting to each other.
            // Always check the getExpectedPlayerCount value before starting a match. When its value reaches zero, all expected players are connected, and your game can begin the match.
            // If expectedPlayerCount > 0 waint until onMatchStateChanged events
            if (match.getExpectedPlayerCount() === 0) {
                match.requestPlayersInfo(requestPlayersCallback);
            }
        },

        /**
         * Login to Social Service
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
                        if (!autoLogin && error.code === 2 && _this.usingGameCenter) {
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
         * Create a Match
         *
         * @param multi
         * @param players
         * @param tokens
         */
        createMatch: function(multi, players, tokens) {
            var request = new Cocoon.Multiplayer.MatchRequest(players, tokens);

            this.isMultiplayerGame = multi;
            if (this.isMultiplayerGame) {

                if (this.multiplayerService == null) {
                    alert("Multiplayer is not supported on this device");
                    return;
                }

                if (!this.socialService.isLoggedIn()) {

                    this.loginSocialService(false);
                } else {
                    this.multiplayerService.findMatch(request, this.handleMatch);
                }


            } else {

                this.loopbackServices[0].findAutoMatch(request, this.handleMatch);
                this.loopbackServices[1].findAutoMatch(request, function(){}); //only listen to the first loopback service delegate
            }

        },

        /**
         * Cancel a Match
         */
        cancelMatch: function() {

            if (this.isMultiplayerGame) {
                this.multiplayerService.cancelAutoMatch();
            }
            else {
                this.loopbackServices[0].cancelAutomatch();
                this.loopbackServices[1].cancelAutomatch();
            }

        },

        /**
         * Are we using Social Service
         */
        isSocial: function() {
            this.socialService && this.socialService.isLoggedIn()
        },

        /**
         * Show Leaderboard
         *
         * @returns {boolean}
         */
        showLeaderboard: function() {
            if (DEBUG) console.log("Social: "+this.isSocial());
            if(this.isSocial()) {
                this.socialService.showLeaderboard();
                return true;
            } else {
                return false;
            }
        },

        /**
         * Disconnect
         *
         * @param sendMessage
         * @returns {boolean}
         */
        disconnect: function(sendMessage) {
            var i;

            for (i = 0; i < this.players.length; ++i) {
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
         * Submit Score
         *
         * @param value
         */
        submitScore: function(value) {
            this.socialService.submitScore(value, function(error) {
                if (error) {
                    console.error("Error submitting score: " + error);
                }
                else {
                    if (DEBUG) console.log("Score submitted!");
                }
            });

        },

        /**
         * Is it the local player turn
         *
         * @param index
         * @returns {boolean}
         */
        isLocalPlayerTurn: function(index) {
            return !!this.players[index].match;
        },

        /**
         * Get the player index
         *
         * @param index
         * @returns {userName|*|Cocoon.Social.User.userName|Cocoon.Social.Score.userName|Cocoon.Social.GameCenter.Score.userName|Cocoon.Multiplayer.PlayerInfo.userName}
         */
        getPlayerAlias: function(index) {
            return this.players[index].userName;
        },

        /**
         * Send Message
         *
         * @param index
         * @param message
         */
        send: function(index, message) {
            this.players[index].match.sendDataToAllPlayers(message);
        }

    };
    return Match;
}();

