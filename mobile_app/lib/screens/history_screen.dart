import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/journey_repository.dart';
import '../widgets/async_panel.dart';
import '../widgets/ui_components.dart';
import 'trip_details_screen.dart';

class HistoryScreen extends StatelessWidget {
  final JourneyRepository repository;
  final bool demo;
  const HistoryScreen({super.key, required this.repository, this.demo = false});
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      Text(
        'Journey history',
        style: Theme.of(
          context,
        ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
      ),
      const SizedBox(height: 8),
      const Text(
        'Up to 100 recent completed journeys, including short journeys.',
      ),
      AsyncPanel<List<Trip>>(
        load: repository.trips,
        builder: (trips) => trips.isEmpty
            ? const InfoCard(
                title: 'No completed journeys',
                child: Text(
                  'Your journeys will appear after the device uploads data and the backend processes it.',
                ),
              )
            : Column(
                children: trips
                    .map(
                      (trip) => Card(
                        color: Colors.white,
                        child: ListTile(
                          contentPadding: const EdgeInsets.all(16),
                          isThreeLine: true,
                          leading: const Icon(
                            Icons.route,
                            color: Color(0xFF007F78),
                          ),
                          title: Text(route(trip)),
                          subtitle: Text(
                            '${timestamp(trip.startedAt)}\n${quantity(trip.distanceKm, 'km')} · ${trip.displayRating}',
                          ),
                          trailing: const Icon(Icons.chevron_right),
                          onTap: () => Navigator.of(context).push(
                            MaterialPageRoute<void>(
                              builder: (_) => TripDetailsScreen(
                                id: trip.id,
                                repository: repository,
                                demo: demo,
                              ),
                            ),
                          ),
                        ),
                      ),
                    )
                    .toList(),
              ),
      ),
    ],
  );
}
