part of tictactoe;


class Canvas {

  static const ms = const Duration(milliseconds: 1);

  Game game;
  TicTacToeGameModel model;
  int canvas_width;
  int canvas_height;
  int boardSize;
  var assets;
  var canvas;
  var ctx;


  Canvas(this.game, this.model, this.canvas_width, this.canvas_height, this.boardSize) {

    print("Class Canvas Initialized");

    var isCocoon = window.navigator.appVersion.contains("CocoonJS");;
    var scale = Math.min(window.innerHeight/canvas_height,window.innerWidth/canvas_width);

    canvas = document.createElement(isCocoon ? 'screencanvas' : 'canvas');
    canvas.width = canvas_width;
    canvas.height = canvas_height;
    canvas.style.position = "absolute";
    canvas.style.width = "${canvas_width * scale}px";
    canvas.style.height = "${canvas_height * scale}px";
    canvas.style.left = "${window.innerWidth * 0.5 - canvas_width * scale * 0.5}px";
    canvas.style.top = "${window.innerHeight * 0.5 - canvas_height * scale * 0.5}px";
    document.body.append(canvas);

    ctx = canvas.getContext("2d");

    // load the ui assets
    getImages(["cuadricula.png", "O.png", "exit.png", "scores.png", "X.png","xbuena.png","Obuena.png"],
        () {new Timer.periodic(ms*16, (Timer t){
          if (model.state == STATE_IDLE) {
            renderCreateMatch();
          } else if (model.state == STATE_CREATING_MATCH) {
            renderCreatingMatch();
          } else if (model.state == STATE_WAITING_FOR_PLAYERS) {
            renderWaitingForPlayers();
          } else {
            renderBoard();
          }
        });
    });


    // wire up the ui events
    if (isCocoon) {
      canvas.addEventListener("touchstart",
          (touchEvent) {
        onTouch(touchEvent.targetTouches[0].clientX, touchEvent.targetTouches[0].clientY);
      });
    } else {
      canvas.addEventListener("click",
          (ev){
        onTouch(ev.clientX, ev.clientY);
      });
    }

  }

  getImages(sources, Function callback) {
    var images = {};
    var imagesTotal = 1;
    var numImages = sources.length;

    sources.forEach((src) {
      images[src] = new ImageElement();
      images[src].addEventListener('load', (e) {
        print("Asset loaded: $src");
        if (imagesTotal++ >= numImages) {
          print("Starting the game :)");
          assets = images;
          callback();
        }
      });

      images[src].src = "images/"+src;
    });
  }

  renderCreateMatch() {

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas_width, canvas_height);
    ctx.fillStyle="black";
    ctx.strokeStyle = "black";
    var fontSize = (canvas_width * 0.3).floor() << 0 ;
    if (fontSize > 30) fontSize = 30;
    ctx.font =  "${fontSize}px Helvetica";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText("Multiplayer", canvas_width * 0.25, canvas_height * 0.49);
    ctx.textBaseline = "top";
    ctx.fillText("Match", canvas_width * 0.25, canvas_height * 0.51);
    ctx.textBaseline = "bottom";
    ctx.fillText("Local", canvas_width * 0.75, canvas_height * 0.49);
    ctx.textBaseline = "top";
    ctx.fillText("Match", canvas_width * 0.75, canvas_height * 0.51);
    ctx.beginPath();
    ctx.arc(canvas_width * 0.25, canvas_height/2, canvas_width * 0.15, 0, Math.PI * 2, true);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(canvas_width * 0.75, canvas_height/2, canvas_width * 0.15, 0, Math.PI * 2, true);
    ctx.stroke();

    ctx.textBaseline = "bottom";
    ctx.textAlign = "left";
    if (game.waitingLogin()) {
      ctx.fillText("Logging in...", canvas_width * 0.01, canvas_height * 0.99);
    }
    else if (game.isSocial()) {
      ctx.fillText("Logged In", canvas_width * 0.01, canvas_height * 0.99);
    }
  }

  renderCreatingMatch() {
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas_width, canvas_height);
    ctx.fillStyle="black";
    ctx.font = "20pt Helvetica";
    ctx.textAlign = "center";
    ctx.fillText("Searching players for the match...", canvas_width/2, canvas_height/2);
    renderExitButton();
  }

  renderWaitingForPlayers() {
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas_width, canvas_height);
    ctx.fillStyle="black";
    ctx.font = "20pt Helvetica";
    ctx.textAlign = "center";
    ctx.fillText("Waiting for all players to be connected...", canvas_width/2, canvas_height/2);
    renderExitButton();
  }


  renderTokenX(x, y) {
    ctx.drawImage(
        assets["xbuena.png"],
        x,
        y,
        assets["xbuena.png"].width / 2,
        assets["xbuena.png"].height / 2);
  }

  renderTokenO(x, y) {
    ctx.drawImage(
        assets["Obuena.png"],
        x,
        y,
        assets["Obuena.png"].width / 2,
        assets["Obuena.png"].height / 2);
  }

  renderPlayersInfo() {

    ctx.font = "35px Helvetica";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#bbbbbb";

    var first_player_info = {
        'symbol' : model.getPlayerTokensSymbol(0).toUpperCase(),
        'text' : model.getPlayerAlias(0).toUpperCase(),
        'metrics' : {
            'data' : null,
            'textWidth' : null,
            'x' : null
        }
    };

    var second_player_info = {
        'symbol' : model.getPlayerTokensSymbol(1).toUpperCase(),
        'text' : model.getPlayerAlias(1).toUpperCase(),
        'metrics' : {
            'data' : null,
            'textWidth' : null,
            'x' : null
        }
    };

    first_player_info['metrics']['x'] = (first_player_info.symbol == "X" ? canvas_width/2 + assets["X.png"].width : canvas_width/2 + assets["O.png"].width);
    first_player_info['metrics']['data'] = ctx.measureText(first_player_info['text']);
    first_player_info['metrics']['textWidth'] = first_player_info['metrics']['data']['width'];

    second_player_info['metrics']['x'] = (second_player_info.symbol == "X" ? canvas_width/2 + assets["X.png"].width : canvas_width/2 + assets["O.png"].width);
    second_player_info['metrics']['data'] = ctx.measureText(second_player_info['text']);
    second_player_info['metrics']['textWidth'] = second_player_info['metrics']['data']['width'];

    ctx.fillText(first_player_info.text, canvas_width/2 - first_player_info['metrics']['textWidth'] + assets[first_player_info.symbol+".png"].width, canvas_height * 0.01);

    ctx.drawImage(assets[first_player_info.symbol+".png"],
    canvas_width/2 - first_player_info['metrics']['textWidth'] - assets[first_player_info['symbol']+".png"].width - 10,
    canvas_height * 0.017,
    assets[first_player_info['symbol']+".png"].width/2 ,
    assets[first_player_info['symbol']+".png"].height/2
    );

    ctx.fillText(second_player_info['text'], canvas_width/2 + second_player_info['metrics']['textWidth'] / 2 + assets[second_player_info.symbol+".png"].width, canvas_height * 0.01);

    ctx.drawImage(assets[second_player_info['symbol']+".png"],
    canvas_width/2 + second_player_info['metrics']['textWidth'] / 2 - assets[second_player_info['symbol']+".png"].width - 10,
    canvas_height * 0.017,
    assets[second_player_info['symbol']+".png"].width/2 ,
    assets[second_player_info['symbol']+".png"].height/2
    );

    ctx.textBaseline = "bottom";
    ctx.fillText("TURN: " + model.getPlayerTokensSymbol(model.playerTurn), canvas_width * 0.5, canvas_height * 0.99);

  }

  renderExitButton() {

    ctx.font = "35px Helvetica";
    ctx.fillStyle = "#bbbbbb";
    var offset = 10;
    var text = "Exit";
    TextMetrics metrics = ctx.measureText(text);
    var text_width = metrics.width;
    //var text_height = metrics.height;

    ctx.fillText("EXIT", offset + text_width + assets["exit.png"].width * 0.7, canvas_height - offset * 1.4);
    ctx.drawImage(assets["exit.png"],offset, canvas_height - offset - assets["exit.png"].height);
  }

  renderScoresButton() {
    ctx.fillStyle = "black";
    ctx.strokeStyle = "black";
    var offset = 5;
    var width = canvas_width * 0.15;
    var height = width * 0.3;
    ctx.strokeRect(canvas_width - offset - width, canvas_height -offset - height, width, height);
    var fontSize = (width * 0.1) << 0 ;
    ctx.font = fontSize + "pt Helvetica";
    ctx.textBaseline = "middle";
    ctx.fillText("SCORES", canvas_width - offset - width * 0.5 ,canvas_height - height/2 - offset);
  }

  renderBoard() {
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas_width, canvas_height);

    var boardRect = model.boardRect;

    ctx.drawImage(assets["cuadricula.png"],
    (canvas_width - (assets["cuadricula.png"].width / 2)) / 2,
    (canvas_height - (assets["cuadricula.png"].height / 2)) / 2,
    assets["cuadricula.png"].width / 2,
    assets["cuadricula.png"].height / 2
    );

    var row = 0;
    var col = 0;
    for (row = 0; row < 3; ++row) {
      for (col = 0; col < 3; ++col) {
        var x = boardRect.x + boardRect.w * (col == 1 ? 0.315 : (col == 0 ? -0.1 : 0.73));
        var y = boardRect.y + boardRect.h * (row == 1 ? 0.315 : (row == 0 ? -0.1 : 0.73));

        if (model.xTokens[row][col] == 1) {
          renderTokenX(x, y + 20);
        }
        else if (model.oTokens[row][col] == 1) {
          renderTokenO(x, y + 20);
        }

      }
    }

    renderPlayersInfo();
    renderExitButton();

    if (model.state == STATE_SCORES && game.isSocial()) {
      renderScoresButton();
    }
  }

  /**
   *
   * @param x
   * @param y
   */
  onTouch(x,y) {

    var rect = canvas.getBoundingClientRect();
    x = x - rect.left;
    y = y - rect.top;

    var clickedExit = x < canvas_width * 0.15 && y > canvas_height * 0.9;

    if (model.state == STATE_IDLE) {

      if (clickedExit) return;
      game.createMatch(x < canvas_width / 2, 2, 2);

    } else if (model.state == STATE_CREATING_MATCH) {

      if (clickedExit) game.cancelMatch();

    } else if (model.state == STATE_WAITING_FOR_PLAYERS  ) {
      if (clickedExit) {
        game.disconnect(true);
      }
    } else if (model.state == STATE_PLAYING) {

      if (clickedExit) {
        game.disconnect(true);
        return;
      }

      var px = x - model.boardRect.x;
      var py = y - model.boardRect.y;
      if (px >= 0 && py>=0 && px<=model.boardRect.w && py <= model.boardRect.h) {
        var col = (px / (model.boardRect.w / 3)).floor();
        var row = (py / (model.boardRect.h / 3)).floor();
        model.putToken(row,col);
      }
    } else if (model.state == STATE_SCORES) {
      if (clickedExit) {
        game.disconnect(true);
        return;
      }

      var clickedScores = (x > canvas_width * 0.15 && y > canvas_height * 0.9);
      if (clickedScores) {
        if (!game.showLeaderboard()) {
          window.alert("You must be logged into the Social Service.");
        }
      }
    }

  }


}