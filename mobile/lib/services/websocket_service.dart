import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

import 'api_client.dart';

class WebSocketService extends ChangeNotifier {
  WebSocketService._();

  static final WebSocketService instance = WebSocketService._();

  io.Socket? _socket;
  bool _connected = false;
  String? _lastEvent;

  bool get isConnected => _connected;
  String? get lastEvent => _lastEvent;

  String get _socketBaseUrl {
    final host = ApiClient.baseUrl.replaceFirst(RegExp(r'^https?://'), '');
    return 'http://$host';
  }

  void connect({required String token}) {
    disconnect();

    _socket = io.io(
      _socketBaseUrl,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .setAuth({'token': token})
          .build(),
    );

    _socket!.onConnect((_) {
      _connected = true;
      _lastEvent = 'connected';
      notifyListeners();
    });

    _socket!.onDisconnect((_) {
      _connected = false;
      _lastEvent = 'disconnected';
      notifyListeners();
    });

    _socket!.onConnectError((err) {
      _connected = false;
      _lastEvent = 'connect_error: $err';
      notifyListeners();
      debugPrint('Socket connect error: $err');
    });

    _socket!.on('booking:updated', (payload) {
      _lastEvent = 'booking:updated';
      notifyListeners();
      debugPrint('booking:updated => $payload');
    });

    _socket!.on('server:ping', (payload) {
      _lastEvent = 'server:ping';
      notifyListeners();
      debugPrint('server:ping => $payload');
    });

    _socket!.connect();
  }

  void disconnect() {
    _socket?.dispose();
    _socket = null;
    _connected = false;
    notifyListeners();
  }
}
