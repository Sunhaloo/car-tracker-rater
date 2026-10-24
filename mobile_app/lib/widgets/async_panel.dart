import 'package:flutter/material.dart';

/// Owns its request, ignores obsolete replies and exposes an explicit retry.
class AsyncPanel<T> extends StatefulWidget {
  final Future<T> Function() load;
  final Widget Function(T value) builder;
  const AsyncPanel({super.key, required this.load, required this.builder});
  @override
  State<AsyncPanel<T>> createState() => _AsyncPanelState<T>();
}

class _AsyncPanelState<T> extends State<AsyncPanel<T>> {
  T? _value;
  Object? _error;
  bool _busy = true;
  int _request = 0;
  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final request = ++_request;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final value = await widget.load();
      if (mounted && request == _request) setState(() => _value = value);
    } catch (error) {
      if (mounted && request == _request) setState(() => _error = error);
    } finally {
      if (mounted && request == _request) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      Align(
        alignment: Alignment.centerRight,
        child: TextButton.icon(
          onPressed: _busy ? null : _load,
          icon: const Icon(Icons.refresh),
          label: const Text('Refresh'),
        ),
      ),
      if (_busy)
        const Padding(
          padding: EdgeInsets.all(24),
          child: Center(child: CircularProgressIndicator()),
        ),
      if (_error != null)
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _value == null
                      ? 'Could not load data'
                      : 'Refresh failed — showing previous data',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  _error is FormatException
                      ? 'The server response did not match the expected format.'
                      : _error.toString(),
                ),
                TextButton(
                  onPressed: _busy ? null : _load,
                  child: const Text('Try again'),
                ),
              ],
            ),
          ),
        ),
      if (_value != null) widget.builder(_value as T),
    ],
  );
}
