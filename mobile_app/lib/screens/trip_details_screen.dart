import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/journey_repository.dart';
import '../widgets/async_panel.dart';
import '../widgets/speed_chart.dart';
import '../widgets/ui_components.dart';

class TripDetailsScreen extends StatelessWidget {
  final String id;
  final JourneyRepository repository;
  final bool demo;
  const TripDetailsScreen({
    super.key,
    required this.id,
    required this.repository,
    this.demo = false,
  });
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Journey details')),
    body: SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 760),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (demo)
                const Padding(
                  padding: EdgeInsets.all(8),
                  child: Text('DEMO · invented journey data'),
                ),
              AsyncPanel<TripDetails>(
                load: () => repository.details(id),
                builder: (details) {
                  final trip = details.trip;
                  final events = trip.events;
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      ScoreCard(trip),
                      InfoCard(
                        title: route(trip),
                        child: Facts({
                          'Started': timestamp(trip.startedAt),
                          'Ended': timestamp(trip.endedAt),
                          'Duration': duration(trip),
                          'Distance': quantity(trip.distanceKm, 'km'),
                          'Maximum speed': quantity(trip.maxSpeedKmh, 'km/h'),
                          'Peak braking magnitude': quantity(
                            trip.maxBrakeG,
                            'g',
                            digits: 2,
                          ),
                        }),
                      ),
                      InfoCard(
                        title: 'Speed during the journey',
                        child: SpeedChart(points: details.track, demo: demo),
                      ),
                      InfoCard(
                        title: 'Recorded harsh driving events',
                        child: Facts({
                          'Acceleration':
                              events?.acceleration?.toString() ?? 'Unavailable',
                          'Braking':
                              events?.braking?.toString() ?? 'Unavailable',
                          'Cornering':
                              events?.cornering?.toString() ?? 'Unavailable',
                          'Total': events?.total?.toString() ?? 'Unavailable',
                        }),
                      ),
                      const Padding(
                        padding: EdgeInsets.all(12),
                        child: Text(
                          'Counts and rating come from the server. Sensor gaps or unavailable readings are not treated as zero.',
                        ),
                      ),
                    ],
                  );
                },
              ),
            ],
          ),
        ),
      ),
    ),
  );
}
