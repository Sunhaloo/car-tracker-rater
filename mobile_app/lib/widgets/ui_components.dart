import 'package:flutter/material.dart';
import '../models/models.dart';
import '../theme/app_theme.dart';

String timestamp(DateTime? value) {
  if (value == null) return 'Unavailable';
  // This Mauritius project displays one fixed timezone on phone and browser.
  final d = value.toUtc().add(const Duration(hours: 4));
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  String two(int n) => n.toString().padLeft(2, '0');
  return '${d.day} ${months[d.month - 1]} ${d.year} · ${two(d.hour)}:${two(d.minute)} MUT';
}

String quantity(double? value, String unit, {int digits = 1}) =>
    value == null ? 'Unavailable' : '${value.toStringAsFixed(digits)} $unit';
String route(Trip trip) =>
    '${trip.startLabel ?? 'Start location'} → ${trip.endLabel ?? 'End location'}';
String duration(Trip trip) {
  if (trip.startedAt == null || trip.endedAt == null) return 'Unavailable';
  final seconds = trip.endedAt!.difference(trip.startedAt!).inSeconds;
  if (seconds < 0) return 'Unavailable';
  return seconds < 60 ? '$seconds sec' : '${seconds ~/ 60} min';
}

class InfoCard extends StatelessWidget {
  final String title;
  final Widget child;
  const InfoCard({super.key, required this.title, required this.child});
  @override
  Widget build(BuildContext context) => Card(
    color: Colors.white,
    child: Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            title,
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    ),
  );
}

class Facts extends StatelessWidget {
  final Map<String, String> values;
  const Facts(this.values, {super.key});
  @override
  Widget build(BuildContext context) => Column(
    children: values.entries
        .map(
          (entry) => Padding(
            padding: const EdgeInsets.symmetric(vertical: 6),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Text(
                    entry.key,
                    style: const TextStyle(color: AppTheme.muted),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(child: Text(entry.value, textAlign: TextAlign.right)),
              ],
            ),
          ),
        )
        .toList(),
  );
}

class ScoreCard extends StatelessWidget {
  final Trip trip;
  const ScoreCard(this.trip, {super.key});
  @override
  Widget build(BuildContext context) => Card(
    color: AppTheme.navy,
    child: Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'DRIVING RATING',
            style: TextStyle(color: Colors.white70, letterSpacing: 1.5),
          ),
          const SizedBox(height: 12),
          Text(
            trip.inProgress || trip.score == null
                ? '—'
                : '${trip.score!.toStringAsFixed(1)} / 10',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 34,
              fontWeight: FontWeight.bold,
            ),
          ),
          Text(
            trip.displayRating,
            style: const TextStyle(color: Colors.white, fontSize: 18),
          ),
          const SizedBox(height: 12),
          Text(
            trip.inProgress
                ? 'Rating is pending journey completion.'
                : trip.score == null
                ? 'The server has not supplied a usable score for this journey.'
                : 'Calculated by the backend from recorded journey data.',
            style: const TextStyle(color: Colors.white70),
          ),
        ],
      ),
    ),
  );
}
