import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../models/models.dart';
import '../theme/app_theme.dart';

/// Missing speeds and long time gaps must not create an invented continuous line.
List<List<TrackPoint>> speedSegments(List<TrackPoint> points, Duration maxGap) {
  final segments = <List<TrackPoint>>[];
  var current = <TrackPoint>[];
  for (final point in points) {
    if (point.speedKmh == null) {
      if (current.isNotEmpty) segments.add(current);
      current = [];
      continue;
    }
    if (current.isNotEmpty &&
        point.time.difference(current.last.time) > maxGap) {
      segments.add(current);
      current = [];
    }
    current.add(point);
  }
  if (current.isNotEmpty) segments.add(current);
  return segments;
}

class SpeedChart extends StatelessWidget {
  final List<TrackPoint> points;
  final bool demo;
  const SpeedChart({super.key, required this.points, this.demo = false});
  @override
  Widget build(BuildContext context) {
    final valid = points.where((p) => p.speedKmh != null).toList();
    if (valid.length < 2) {
      return const Padding(
        padding: EdgeInsets.all(16),
        child: Text('Not enough recorded speed data to draw a graph.'),
      );
    }
    final peak = valid.map((p) => p.speedKmh!).reduce(math.max);
    final segments = speedSegments(points, Duration(seconds: demo ? 180 : 5));
    final minutes =
        points.last.time.difference(points.first.time).inMilliseconds / 60000;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Speed (km/h) · peak ${peak.toStringAsFixed(1)}',
          style: const TextStyle(color: AppTheme.muted),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 190,
          child: Semantics(
            label:
                'Journey speed graph. Peak ${peak.toStringAsFixed(1)} kilometres per hour over ${minutes.toStringAsFixed(1)} minutes.',
            child: CustomPaint(painter: _SpeedPainter(points, segments)),
          ),
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('0 min'),
            Text('${minutes.toStringAsFixed(1)} min'),
          ],
        ),
        const SizedBox(height: 8),
        const Text(
          'Elapsed journey time. Breaks in the line indicate missing data.',
          style: TextStyle(color: AppTheme.muted),
        ),
      ],
    );
  }
}

class _SpeedPainter extends CustomPainter {
  final List<TrackPoint> points;
  final List<List<TrackPoint>> segments;
  _SpeedPainter(this.points, this.segments);
  @override
  void paint(Canvas canvas, Size size) {
    const left = 30.0;
    const top = 10.0;
    final width = math.max(1.0, size.width - left - 10);
    final height = size.height - 20;
    final maxSpeed = math.max(
      20.0,
      points.fold<double>(0, (m, p) => math.max(m, p.speedKmh ?? 0)) * 1.1,
    );
    final total = math.max(
      1,
      points.last.time.difference(points.first.time).inMilliseconds,
    );
    final grid = Paint()
      ..color = const Color(0xFFDEE5EB)
      ..strokeWidth = 1;
    for (var i = 0; i <= 4; i++) {
      final y = top + height * i / 4;
      canvas.drawLine(Offset(left, y), Offset(left + width, y), grid);
      final label = TextPainter(
        text: TextSpan(
          text: (maxSpeed * (1 - i / 4)).round().toString(),
          style: const TextStyle(color: AppTheme.muted, fontSize: 10),
        ),
        textDirection: TextDirection.ltr,
      )..layout();
      label.paint(canvas, Offset(0, y - 6));
    }
    Offset position(TrackPoint p) => Offset(
      left +
          width * p.time.difference(points.first.time).inMilliseconds / total,
      top + height * (1 - (p.speedKmh! / maxSpeed).clamp(0.0, 1.0)),
    );
    final line = Paint()
      ..color = AppTheme.teal
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5;
    for (final segment in segments) {
      if (segment.length == 1) {
        canvas.drawCircle(
          position(segment.first),
          2.5,
          Paint()..color = AppTheme.teal,
        );
      } else {
        final path = Path()
          ..moveTo(position(segment.first).dx, position(segment.first).dy);
        for (final p in segment.skip(1)) {
          final pos = position(p);
          path.lineTo(pos.dx, pos.dy);
        }
        canvas.drawPath(path, line);
      }
    }
  }

  @override
  bool shouldRepaint(covariant _SpeedPainter oldDelegate) =>
      oldDelegate.points != points;
}
