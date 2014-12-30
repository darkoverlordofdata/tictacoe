/**
 *
 * @param game
 * @constructor
 */
function Canvas(game) {

    console.log("Class Canvas Initialized");

    var isCocoon = (navigator.appVersion.indexOf("CocoonJS") !== -1),
        scale = Math.min(window.innerHeight/game.height,window.innerWidth/game.width),
        _this = this;

    this.game = game;
    this.model = game.model;
    this.canvas_width = game.width;
    this.canvas_height = game.height;
    this.boardSize = game.size;
    this.canvas = document.createElement(isCocoon ? 'screencanvas' : 'canvas');
    this.canvas.width = game.width;
    this.canvas.height = game.height;
    this.canvas.style.position = "absolute";
    this.canvas.style.width = (game.width * scale) + "px";
    this.canvas.style.height = (game.height * scale) + "px";
    this.canvas.style.left = (window.innerWidth * 0.5 - game.width * scale * 0.5) + "px";
    this.canvas.style.top = (window.innerHeight * 0.5 - game.height * scale * 0.5) + "px";
    document.body.appendChild(this.canvas);

    this.ctx = this.canvas.getContext("2d");

    // load the ui assets
    this.getImages(["cuadricula.png", "O.png", "exit.png", "scores.png", "X.png","xbuena.png","Obuena.png"],
        function () {
        setInterval(function () {
            if (_this.model.state === GAMESTATES.STATE_IDLE) {
                _this.renderCreateMatch();
            } else if (_this.model.state === GAMESTATES.STATE_CREATING_MATCH) {
                _this.renderCreatingMatch();
            } else if (_this.model.state === GAMESTATES.STATE_WAITING_FOR_PLAYERS) {
                _this.renderWaitingForPlayers();
            } else {
                _this.renderBoard();
            }
        }, 16);
    });

    // wire up the ui events
    if (isCocoon){
        this.canvas.addEventListener("touchstart",
            function(touchEvent) {
                _this.onTouch(touchEvent.targetTouches[0].clientX, touchEvent.targetTouches[0].clientY);
            }
        );
    } else {
        this.canvas.addEventListener("click",
            function(ev) {
                _this.onTouch(ev.clientX, ev.clientY);
            }
        );
    }

}

/**
 *
 * @type {{constructor: Canvas, assets: undefined, game: undefined, model: undefined, canvas: undefined, ctx: undefined, canvas_width: number, canvas_height: number, boardSize: number, getImages: Function, renderCreateMatch: Function, renderCreatingMatch: Function, renderWaitingForPlayers: Function, renderTokenX: Function, renderTokenO: Function, renderPlayersInfo: Function, renderExitButton: Function, renderScoresButton: Function, renderBoard: Function, onTouch: Function}}
 */
Canvas.prototype = {

    constructor: Canvas,
    assets: undefined,
    game: undefined,
    model: undefined,
    canvas: undefined,
    ctx: undefined,
    canvas_width: 0,
    canvas_height: 0,
    boardSize: 0,

    /**
     *
     * @param sources
     * @param callback
     */
    getImages: function(sources, callback) {
        var _this = this;
        var images = {};
        var imagesTotal = 1;
        var numImages = sources.length;

        sources.forEach(function (src) {
            images[src] = new Image();
            images[src].onload = function () {
                console.log("Asset loaded: ",src);
                if (imagesTotal++ >= numImages) {
                    console.log("Starting the game :)");
                    _this.assets = images;
                    callback();
                }
            };
            images[src].src = "images/"+src;
        });
    },

    /**
     *
     */
    renderCreateMatch: function() {

        this.ctx.fillStyle = "white";
        this.ctx.fillRect(0, 0, this.canvas_width, this.canvas_height);
        this.ctx.fillStyle="black";
        this.ctx.strokeStyle = "black";
        var fontSize = (this.canvas_width * 0.3) << 0 ;
        if (fontSize > 30) fontSize = 30;
        this.ctx.font = fontSize + "px Helvetica";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "bottom";
        this.ctx.fillText("Multiplayer", this.canvas_width * 0.25, this.canvas_height * 0.49);
        this.ctx.textBaseline = "top";
        this.ctx.fillText("Match", this.canvas_width * 0.25, this.canvas_height * 0.51);
        this.ctx.textBaseline = "bottom";
        this.ctx.fillText("Local", this.canvas_width * 0.75, this.canvas_height * 0.49);
        this.ctx.textBaseline = "top";
        this.ctx.fillText("Match", this.canvas_width * 0.75, this.canvas_height * 0.51);
        this.ctx.beginPath();
        this.ctx.arc(this.canvas_width * 0.25, this.canvas_height/2, this.canvas_width * 0.15, 0, Math.PI * 2, true);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.arc(this.canvas_width * 0.75, this.canvas_height/2, this.canvas_width * 0.15, 0, Math.PI * 2, true);
        this.ctx.stroke();

        this.ctx.textBaseline = "bottom";
        this.ctx.textAlign = "left";
        if (this.game.waitingLogin) {
            this.ctx.fillText("Logging in...", this.canvas_width * 0.01, this.canvas_height * 0.99);
        }
        else if (this.game.socialService && this.game.socialService.isLoggedIn()) {
            this.ctx.fillText("Logged In", this.canvas_width * 0.01, this.canvas_height * 0.99);
        }
    },

    /**
     *
     */
    renderCreatingMatch: function() {
        this.ctx.fillStyle = "white";
        this.ctx.fillRect(0, 0, this.canvas_width, this.canvas_height);
        this.ctx.fillStyle="black";
        this.ctx.font = "20pt Helvetica";
        this.ctx.textAlign = "center";
        this.ctx.fillText("Searching players for the match...", this.canvas_width/2, this.canvas_height/2);
        this.renderExitButton();
    },

    /**
     *
     */
    renderWaitingForPlayers: function() {
        this.ctx.fillStyle = "white";
        this.ctx.fillRect(0, 0, this.canvas_width, this.canvas_height);
        this.ctx.fillStyle="black";
        this.ctx.font = "20pt Helvetica";
        this.ctx.textAlign = "center";
        this.ctx.fillText("Waiting for all players to be connected...", this.canvas_width/2, this.canvas_height/2);
        this.renderExitButton();
    },

    /**
     *
     * @param x
     * @param y
     */
    renderTokenX: function(x, y) {
        this.ctx.drawImage(
            this.assets["xbuena.png"],
            x,
            y,
            this.assets["xbuena.png"].width / 2,
            this.assets["xbuena.png"].height / 2);
    },

    renderTokenO: function(x, y) {
        this.ctx.drawImage(
            this.assets["Obuena.png"],
            x,
            y,
            this.assets["Obuena.png"].width / 2,
            this.assets["Obuena.png"].height / 2);
    },

    /**
     *
     */
    renderPlayersInfo: function(){

        this.ctx.font = "35px Helvetica";
        this.ctx.textBaseline = "top";
        this.ctx.fillStyle = "#bbbbbb";

        var first_player_info = {
            symbol : this.model.getPlayerTokensSymbol(0).toUpperCase(),
            text : this.model.getPlayerAlias(0).toUpperCase(),
            metrics : {
                data : null,
                textWidth : null,
                x : null
            }
        };

        var second_player_info = {
            symbol : this.model.getPlayerTokensSymbol(1).toUpperCase(),
            text : this.model.getPlayerAlias(1).toUpperCase(),
            metrics : {
                data : null,
                textWidth : null,
                x : null
            }
        };

        first_player_info.metrics.x = (first_player_info.symbol == "X" ? this.canvas_width/2 + this.assets["X.png"].width : this.canvas_width/2 + this.assets["O.png"].width);
        first_player_info.metrics.data = this.ctx.measureText(first_player_info.text);
        first_player_info.metrics.textWidth = first_player_info.metrics.data.width;

        second_player_info.metrics.x = (second_player_info.symbol == "X" ? this.canvas_width/2 + this.assets["X.png"].width : this.canvas_width/2 + this.assets["O.png"].width);
        second_player_info.metrics.data = this.ctx.measureText(second_player_info.text);
        second_player_info.metrics.textWidth = second_player_info.metrics.data.width;

        this.ctx.fillText(first_player_info.text, this.canvas_width/2 - first_player_info.metrics.textWidth + this.assets[first_player_info.symbol+".png"].width, this.canvas_height * 0.01);

        this.ctx.drawImage(this.assets[first_player_info.symbol+".png"],
            this.canvas_width/2 - first_player_info.metrics.textWidth - this.assets[first_player_info.symbol+".png"].width - 10,
            this.canvas_height * 0.017,
            this.assets[first_player_info.symbol+".png"].width/2 ,
            this.assets[first_player_info.symbol+".png"].height/2
        );

        this.ctx.fillText(second_player_info.text, this.canvas_width/2 + second_player_info.metrics.textWidth / 2 + this.assets[second_player_info.symbol+".png"].width, this.canvas_height * 0.01);

        this.ctx.drawImage(this.assets[second_player_info.symbol+".png"],
            this.canvas_width/2 + second_player_info.metrics.textWidth / 2 - this.assets[second_player_info.symbol+".png"].width - 10,
            this.canvas_height * 0.017,
            this.assets[second_player_info.symbol+".png"].width/2 ,
            this.assets[second_player_info.symbol+".png"].height/2
        );

        this.ctx.textBaseline = "bottom";
        this.ctx.fillText("TURN: " + this.model.getPlayerTokensSymbol(this.model.playerTurn), this.canvas_width * 0.5, this.canvas_height * 0.99);

    },

    /**
     *
     */
    renderExitButton: function() {

        this.ctx.font = "35px Helvetica";
        this.ctx.fillStyle = "#bbbbbb";
        var offset = 10;
        var text = "Exit";
        var metrics = this.ctx.measureText(text);
        var text_width = metrics.width;

        this.ctx.fillText("EXIT", offset + text_width + this.assets["exit.png"].width * 0.7, this.canvas_height - offset * 1.4);
        this.ctx.drawImage(this.assets["exit.png"],offset, this.canvas_height - offset - this.assets["exit.png"].height);
    },

    renderScoresButton: function() {
        this.ctx.fillStyle = "black";
        this.ctx.strokeStyle = "black";
        var offset = 5;
        var width = this.canvas_width * 0.15;
        var height = width * 0.3;
        this.ctx.strokeRect(this.canvas_width - offset - width, this.canvas_height -offset - height, width, height);
        var fontSize = (width * 0.1) << 0 ;
        this.ctx.font = fontSize + "pt Helvetica";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText("SCORES", this.canvas_width - offset - width * 0.5 ,this.canvas_height - height/2 - offset);
    },

    /**
     *
     */
    renderBoard: function() {
        this.ctx.fillStyle = "white";
        this.ctx.fillRect(0,0,this.canvas_width,this.canvas_height);

        var boardRect = this.model.boardRect;

        this.ctx.drawImage(this.assets["cuadricula.png"],
            (this.canvas_width - (this.assets["cuadricula.png"].width / 2))  / 2,
            (this.canvas_height - (this.assets["cuadricula.png"].height / 2)) / 2,
            this.assets["cuadricula.png"].width/2 ,
            this.assets["cuadricula.png"].height/2
        );

        var row = 0;
        var col = 0;
        for (row = 0; row < 3; ++row) {
            for (col = 0; col < 3; ++col)
            {
                var x = boardRect.x + boardRect.w * (col == 1 ? 0.315 : (col == 0 ? -0.1 : 0.73));
                var y = boardRect.y + boardRect.h * (row == 1 ? 0.315 : (row == 0 ? -0.1 : 0.73));

                if (this.model.xTokens[row][col] ===1) {
                    this.renderTokenX(x,y+20);
                }
                else if (this.model.oTokens[row][col] ===1) {
                    this.renderTokenO(x,y+20);
                }

            }
        }

        this.renderPlayersInfo();
        this.renderExitButton();

        if (this.model.state == GAMESTATES.STATE_SCORES && this.game.socialService && this.game.socialService.isLoggedIn()) {
            this.renderScoresButton();
        }
    },

    /**
     *
     * @param x
     * @param y
     */
    onTouch: function(x,y) {

        var rect = this.canvas.getBoundingClientRect();
        x = x - rect.left;
        y = y - rect.top;
    
        var clickedExit = x < this.canvas_width * 0.15 && y > this.canvas_height * 0.9;
    
        if (this.model.state === GAMESTATES.STATE_IDLE) {
    
            if (clickedExit) {
                return;
            }

            this.game.createMatch(x < this.canvas_width / 2);
            //var request = new Cocoon.Multiplayer.MatchRequest(2,2);
            //if (x < this.canvas_width / 2) {
            //
            //    if (this.game.multiplayerService == null) {
            //        alert("Multiplayer is not supported on this device");
            //        return;
            //    }
            //
            //    if (!this.game.socialService.isLoggedIn()) {
            //
            //        this.game.loginSocialService(false);
            //    }
            //    else
            //    {
            //        this.model.isMultiplayerGame = true;
            //        this.game.multiplayerService.findMatch(request, this.game.handleMatch);
            //        this.model.state = GAMESTATES.STATE_CREATING_MATCH;
            //    }
            //
            //
            //} else {
            //
            //    this.model.isMultiplayerGame = false;
            //    this.game.loopbackServices[0].findAutoMatch(request, this.game.handleMatch);
            //    this.game.loopbackServices[1].findAutoMatch(request, function(){}); //only listen to the first loopback service delegate
            //    this.model.state = GAMESTATES.STATE_CREATING_MATCH;
            //}
        } else if (this.model.state === GAMESTATES.STATE_CREATING_MATCH) {
            if (clickedExit) {
    
                if (this.model.isMultiplayerGame) {
                    this.game.multiplayerService.cancelAutoMatch();
                }
                else {
                    this.game.loopbackServices[0].cancelAutomatch();
                    this.game.loopbackServices[1].cancelAutomatch();
                }

                this.model.state = GAMESTATES.STATE_IDLE;
            }
        } else if (this.model.state === GAMESTATES.STATE_WAITING_FOR_PLAYERS  ) {
            if (clickedExit) {
                this.model.disconnect(true);
            }
        } else if (this.model.state === GAMESTATES.STATE_PLAYING) {
    
            if (clickedExit) {
                this.model.disconnect(true);
                return;
            }
    
            var px = x - this.model.boardRect.x;
            var py = y - this.model.boardRect.y;
            if (px >= 0 && py>=0 && px<=this.model.boardRect.w && py <= this.model.boardRect.h) {
                col = Math.floor(px / (this.model.boardRect.w / 3));
                row = Math.floor(py / (this.model.boardRect.h / 3));
                this.model.putToken(row,col);
            }
        } else if (this.model.state === GAMESTATES.STATE_SCORES) {
            if (clickedExit) {
                this.model.disconnect(true);
                return;
            }
    
            var clickedScores = (x > this.canvas_width * 0.15 && y > this.canvas_height * 0.9);
            if (clickedScores) {
                if(this.game.socialService && this.game.socialService.isLoggedIn()){
                    this.model.disconnect(true);
                    this.game.socialService.showLeaderboard();
                } else {
                    alert("You must be logged into the Social Service.");
                }
            }
        }
    
    }
};
