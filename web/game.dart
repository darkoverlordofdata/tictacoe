part of tictactoe;


class Game {

  int width;
  int height;
  int size;
  JsObject match;
  TicTacToeGameModel model;
  Canvas ui;

  Game(String leaderboardId) {
    print("Class Game Initialized");

    width = window.innerWidth;
    height = window.innerHeight;
    size = (0.85 * 500).floor();
    match = new JsObject(context['Match'], [leaderboardId, invoke]);
    model = new TicTacToeGameModel(this, width, height, size);
    ui = new Canvas(this, model, width, height, size);
    match.callMethod('onTouch', [ui.canvas, ui.onTouch]);


  }

  start(players, services, firstTurn, firstPlayerTokens) {
    this.match.callMethod('init', [players, services, firstTurn, firstPlayerTokens]);
  }


  waitingLogin() {
    return match['waitingLogin'];
  }

  isLocalPlayerTurn(index) {
    return this.match.callMethod('isLocalPlayerTurn', [index]);
  }

  getPlayerAlias(index) {
    return this.match.callMethod('getPlayerAlias', [index]);
  }

  send(index, message) {
    this.match.callMethod('send', [index, message]);
  }

  isSocial() {
    return this.match.callMethod('isSocial', []);
  }

  submitScore(value) {
    this.match.callMethod('submitScore', [value]);
  }

  createMatch(multi, players, tokens) {
    this.match.callMethod('createMatch', [multi, players, tokens]);
  }

  cancelMatch() {
    this.match.callMethod('cancelMatch', []);
  }

  disconnect(sendMessage) {
    model.state = STATE_IDLE;
    this.match.callMethod('disconnect', [sendMessage]);
  }

  showLeaderboard() {
    this.match.callMethod('showLeaderboard', []);
  }

  invoke(String methodName, List args) {
    switch (methodName) {
      case 'error':
        return Function.apply(error, args);
      case 'found':
        return Function.apply(found, args);
      case 'init':
        return Function.apply(init, args);
      case 'dataReceived':
        return Function.apply(dataReceived, args);
      case 'stateChanged':
        return Function.apply(stateChanged, args);
      case 'connectionWithPlayerFailed':
        return Function.apply(connectionWithPlayerFailed, args);
      case 'failed':
        return Function.apply(failed, args);
      case 'loginStatusChanged':
        return Function.apply(loginStatusChanged, args);
      case 'requestScore':
        return Function.apply(requestScore, args);
      case 'received':
        return Function.apply(received, args);
      case 'loaded':
        return Function.apply(loaded, args);
      default:
        throw new Exception("Invalid method name: $methodName");
    }
  }

  received(object, match, error) {
    if (model.state != STATE_IDLE) {
      //simulate exit click
      ui.onTouch(0, ui.canvas_height);
    }
    model.state = STATE_CREATING_MATCH;
  }
  
  loaded(object, match, error) {
    model.isMultiplayerGame = true;
  }

  loginStatusChanged(object, value, error) {
    
  }

  requestScore(object, value, error) {
    
      if (error != null) {
        print("Error getting user score: " + error['message']);
      } else if (value != null) {
        print("score: " + value['score']);
        model.localUserScore = value['score'];
      }
  }

  error(error) {
      model.state = STATE_IDLE;
      print(error != null ? error['message'] : "match canceled");
  }

  found(match) {
    print("FOUND");
    model.state = STATE_WAITING_FOR_PLAYERS;
  }

  init(players, services) {
      model.init(players, services);
  }

  dataReceived(match, data, playerID) {

      var message = JSON.decode(data);

      if (message[0] == "token") {
        model.tokenMessageReceived(message[1], message[2], playerID);
      } else if (message[0] == "exit" && model.state == STATE_PLAYING && model.isMultiplayerGame) {
        window.alert("Opponent disconnected");
        match.disconnect(false);
      } else if (message[0] == "turn") {
          model.firstTurnMessageReceived(message[1],message[2]);
      }
  }

  stateChanged(match, player, state) {
      if (model.state == STATE_WAITING_FOR_PLAYERS)
        this.match.callMethod('requestPlayersInfo', [match]);
  }

  connectionWithPlayerFailed(match, player, error) {
      this.match.callMethod('disconnect', [false]);
  }

  failed(match, error) {
      this.match.callMethod('disconnect', [false]);
  }

}