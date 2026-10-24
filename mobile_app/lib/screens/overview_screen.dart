import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/journey_repository.dart';
import '../widgets/async_panel.dart';
import '../widgets/ui_components.dart';
import 'trip_details_screen.dart';

class OverviewScreen extends StatelessWidget {
  final JourneyRepository repository;
  final String username;
  final bool demo;
  const OverviewScreen({
    super.key,
    required this.repository,
    required this.username,
    this.demo = false,
  });
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      Text(
        'Hello, $username',
        style: Theme.of(
          context,
        ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
      ),
      const SizedBox(height: 8),
      const Text('Review your latest completed journey and driving behaviour.'),
      AsyncPanel<LatestJourney>(
        load: repository.latestCompleted,
        builder: (latest) {
          final trip = latest.trip;
          if (trip == null) {
            return const InfoCard(
              title: 'No rated journeys yet',
              child: Text(
                'Completed journeys of at least 1 km appear here. Short journeys can still appear in History.',
              ),
            );
          }
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (latest.savedCopy)
                const InfoCard(
                  title: 'Saved summary · server unavailable',
                  child: Text(
                    'This is a previously downloaded summary. Details and device status still require the server.',
                  ),
                ),
              Padding(
                padding: const EdgeInsets.all(8),
                child: Text(
                  'Latest completed journey · downloaded ${timestamp(latest.savedAt)}',
                ),
              ),
              ScoreCard(trip),
              InfoCard(
                title: route(trip),
                child: Facts({
                  'Started': timestamp(trip.startedAt),
                  'Distance': quantity(trip.distanceKm, 'km'),
                  'Duration': duration(trip),
                  'Maximum speed': quantity(trip.maxSpeedKmh, 'km/h'),
                }),
              ),
              const SizedBox(height: 12),
              FilledButton.icon(
                onPressed: () => Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => TripDetailsScreen(
                      id: trip.id,
                      repository: repository,
                      demo: demo,
                    ),
                  ),
                ),
                icon: const Icon(Icons.show_chart),
                label: const Padding(
                  padding: EdgeInsets.all(12),
                  child: Text('View journey and graph'),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Overview shows the newest completed journey of at least 1 km. It does not show an active journey.',
              ),
            ],
          );
        },
      ),
    ],
  );
}
