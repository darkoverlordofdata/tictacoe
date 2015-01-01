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
    match = new JsObject(context['Match'], [this, leaderboardId]);
    model = new TicTacToeGameModel(this, width, height, size);
    ui = new Canvas(this, model, width, height, size);
    

  }

  init(players, services, firstTurn, firstPlayerTokens) {
    match.callMethod('init', [players, services, firstTurn, firstPlayerTokens]);
  }


  waitingLogin() {
    return match['waitingLogin'];
  }

  isLocalPlayerTurn(index) {
    return match.callMethod('isLocalPlayerTurn', [index]);
  }

  getPlayerAlias(index) {
    return match.callMethod('getPlayerAlias', [index]);
  }

  send(index, message) {
    match.callMethod('send', [index, message]);
  }

  isSocial() {
    return match.callMethod('isSocial', []);
  }

  submitScore(value) {
    match.callMethod('submitScore', [value]);
  }

  createMatch(multi, players, tokens) {
    print("createMatch");
    print("isMultiplayerGame ${match['isMultiplayerGame']}");
    print("createMatch ${match['createMatch']}");

    match.callMethod('createMatch', [multi, players, tokens]);
    print("after createMatch");
  }

  cancelMatch() {
    match.callMethod('cancelMatch', []);
  }

  disconnect(sendMessage) {
    model.state = STATE_IDLE;
    match.callMethod('disconnect', [sendMessage]);
  }

  showLeaderboard() {
    match.callMethod('showLeaderboard', []);
  }

  /**
   *
   * @param type
   * @param object
   * @param match
   * @param error
   */
  multiplayerService(type, object, match, error) {
    switch(type) {

      case 'received':
        if (model.state != STATE_IDLE) {
          //simulate exit click
          ui.onTouch(0, ui.canvas_height);
        }
        model.state = STATE_CREATING_MATCH;

        break;

      case 'loaded':
        model.isMultiplayerGame = true;
        break;
    }
  }

  /**
   *
   *
   * @param type
   * @param object
   * @param value
   * @param error
   */
  socialService(type, object, value, error) {
    switch(type) {

      case 'loginStatusChanged':
        break;

      case 'requestScore':
        if (error != null) {
          print("Error getting user score: " + error['message']);
        } else if (value != null) {
          print("score: " + value['score']);
          model.localUserScore = value['score'];
        }
        break;
    }
  }

  /**
   *
   * @param type
   */
  handleMatch(type, [p1, p2, p3]) {
    var error;
    var players;
    var services;
    var match;
    var data;
    var playerID;
    var message;
    var player;
    var state;

    switch(type) {

      case 'error':
        error = p1;

        model.state = STATE_IDLE;
        print(error != null ? error['message'] : "match canceled");
        break;

      case 'found':
        model.state = STATE_WAITING_FOR_PLAYERS;
        break;

      case 'init':
        players = p1;
        services = p2;

        model.init(players, services);
        break;

      case 'dataReceived':
        match = p1;
        data = p2;
        playerID = p3;

        message = JSON.decode(data);

        if (message[0] == "token") {
          model.tokenMessageReceived(message[1], message[2], playerID);
        } else if (message[0] == "exit" && model.state == STATE_PLAYING && model.isMultiplayerGame) {
          window.alert("Opponent disconnected");
          match.disconnect(false);
        } else if (message[0] == "turn") {
            model.firstTurnMessageReceived(message[1],message[2]);
        }
        break;

      case 'stateChanged':
        match = p1;
        player = p2;
        state = p3;

        if (model.state == STATE_WAITING_FOR_PLAYERS)
          match.callMethod('requestPlayersInfo', [match]);
        break;

      case 'connectionWithPlayerFailed':
        match = p1;
        player = p2;
        error = p3;

        match.callMethod('disconnect', [false]);
        break;

      case 'failed':
        match = p1;
        error = p2;

        match.callMethod('disconnect', [false]);
        break;
    }
  }

}