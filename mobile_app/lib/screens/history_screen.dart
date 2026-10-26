import 'package:flutter/material.dart';

import '../models/models.dart';
import '../services/journey_repository.dart';
import '../widgets/async_panel.dart';
import '../widgets/ui_components.dart';
import 'trip_details_screen.dart';

class HistoryScreen extends StatefulWidget {
  final JourneyRepository repository;
  final bool demo;

  const HistoryScreen({super.key, required this.repository, this.demo = false});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  DateTime? _selectedDate;

  static const _months = [
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

  String _dateLabel(DateTime value) {
    return '${value.day} ${_months[value.month - 1]} ${value.year}';
  }

  Future<void> _chooseDate() async {
    final now = DateTime.now().toUtc().add(const Duration(hours: 4));

    final picked = await showDatePicker(
      context: context,
      helpText: 'Select journey start date',
      initialDate: _selectedDate ?? DateTime(now.year, now.month, now.day),
      firstDate: DateTime(2000),
      lastDate: DateTime(2100, 12, 31),
    );

    if (!mounted || picked == null) {
      return;
    }

    setState(() {
      _selectedDate = picked;
    });
  }

  bool _matchesDate(Trip trip) {
    final selected = _selectedDate;

    if (selected == null) {
      return true;
    }

    final startedAt = trip.startedAt;

    if (startedAt == null) {
      return false;
    }

    // Match the same Mauritius calendar date shown elsewhere in the app.
    final localStart = startedAt.toUtc().add(const Duration(hours: 4));

    return localStart.year == selected.year &&
        localStart.month == selected.month &&
        localStart.day == selected.day;
  }

  Widget _buildJourneys(List<Trip> trips) {
    if (trips.isEmpty) {
      return const InfoCard(
        title: 'No completed journeys',
        child: Text(
          'Your journeys will appear after the device uploads data '
          'and the backend processes it.',
        ),
      );
    }

    final visibleTrips = trips.where(_matchesDate).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Text(
            _selectedDate == null
                ? 'Showing ${visibleTrips.length} journeys'
                : '${visibleTrips.length} journeys on '
                      '${_dateLabel(_selectedDate!)}',
          ),
        ),
        if (visibleTrips.isEmpty)
          const InfoCard(
            title: 'No journeys found for this date',
            child: Text(
              'Choose another date or clear the filter. '
              'The filter searches the recent journeys loaded in History.',
            ),
          ),
        ...visibleTrips.map(
          (trip) => Card(
            color: Colors.white,
            child: ListTile(
              contentPadding: const EdgeInsets.all(16),
              isThreeLine: true,
              leading: const Icon(Icons.route, color: Color(0xFF007F78)),
              title: Text(route(trip)),
              subtitle: Text(
                '${timestamp(trip.startedAt)}\n'
                '${quantity(trip.distanceKm, 'km')} · '
                '${trip.displayRating}',
              ),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => TripDetailsScreen(
                    id: trip.id,
                    repository: widget.repository,
                    demo: widget.demo,
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
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
        const SizedBox(height: 16),
        Wrap(
          spacing: 12,
          runSpacing: 8,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            OutlinedButton.icon(
              onPressed: _chooseDate,
              icon: const Icon(Icons.calendar_month_outlined),
              label: Text(
                _selectedDate == null
                    ? 'Filter by date'
                    : _dateLabel(_selectedDate!),
              ),
            ),
            if (_selectedDate != null)
              TextButton.icon(
                onPressed: () {
                  setState(() {
                    _selectedDate = null;
                  });
                },
                icon: const Icon(Icons.clear),
                label: const Text('Clear filter'),
              ),
          ],
        ),
        AsyncPanel<List<Trip>>(
          load: widget.repository.trips,
          builder: _buildJourneys,
        ),
      ],
    );
  }
}
