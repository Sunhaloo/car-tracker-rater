import 'package:flutter/material.dart';
import '../data/demo_repository.dart';
import '../models/models.dart';
import '../services/journey_repository.dart';
import '../widgets/async_panel.dart';
import '../widgets/ui_components.dart';

class DeviceStatusScreen extends StatefulWidget {
  final JourneyRepository repository;
  const DeviceStatusScreen({super.key, required this.repository});
  @override
  State<DeviceStatusScreen> createState() => _DeviceStatusScreenState();
}

class _DeviceStatusScreenState extends State<DeviceStatusScreen> {
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      Text(
        'Device status',
        style: Theme.of(
          context,
        ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
      ),
      const SizedBox(height: 8),
      const Text(
        'A snapshot of what the server last received from your vehicle. Refresh to check again.',
      ),
      if (widget.repository is DemoRepository)
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: DropdownButtonFormField<String>(
            initialValue: (widget.repository as DemoRepository).statusScenario,
            decoration: const InputDecoration(
              labelText: 'Demo status scenario',
              border: OutlineInputBorder(),
            ),
            items: const [
              DropdownMenuItem(
                value: 'normal',
                child: Text('Online + offline examples'),
              ),
              DropdownMenuItem(
                value: 'gps',
                child: Text('GPS searching example'),
              ),
              DropdownMenuItem(
                value: 'server',
                child: Text('Server unavailable example'),
              ),
            ],
            onChanged: (value) {
              if (value != null) {
                setState(
                  () => (widget.repository as DemoRepository).statusScenario =
                      value,
                );
              }
            },
          ),
        ),
      AsyncPanel<StatusSnapshot>(
        key: ValueKey(
          widget.repository is DemoRepository
              ? (widget.repository as DemoRepository).statusScenario
              : 'api',
        ),
        load: widget.repository.status,
        builder: (snapshot) => Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.all(8),
              child: Text('Checked: ${timestamp(snapshot.checkedAt)}'),
            ),
            if (snapshot.devices.isEmpty)
              const InfoCard(
                title: 'No linked device',
                child: Text(
                  'Ask the project administrator to link your device to this account on the website.',
                ),
              ),
            ...snapshot.devices.map(
              (device) => InfoCard(
                title: device.label,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      children: [
                        Icon(
                          device.online
                              ? Icons.cloud_done_outlined
                              : Icons.cloud_off_outlined,
                          color: device.online
                              ? const Color(0xFF007F78)
                              : Colors.grey,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          device.online
                              ? 'Online at last check'
                              : 'Offline / no recent upload',
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    _SensorRow('GPS', device.gps),
                    const SizedBox(height: 8),
                    _SensorRow('Motion sensor (IMU)', device.imu),
                    const SizedBox(height: 12),
                    Facts({
                      'Last upload': timestamp(device.lastSeen),
                      'Data age at check': device.ageSeconds == null
                          ? 'No data received'
                          : '${device.ageSeconds} seconds',
                      'Last known latitude':
                          device.latitude?.toStringAsFixed(6) ?? 'Unavailable',
                      'Last known longitude':
                          device.longitude?.toStringAsFixed(6) ?? 'Unavailable',
                      'Position recorded': timestamp(device.lastPositionTime),
                    }),
                    const SizedBox(height: 8),
                    const Text(
                      'A last known position may be older than the latest upload. Offline does not prove a sensor has failed.',
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    ],
  );
}

class _SensorRow extends StatelessWidget {
  final String label;
  final SensorStatus sensor;
  const _SensorRow(this.label, this.sensor);
  @override
  Widget build(BuildContext context) {
    final color = switch (sensor.state) {
      'ok' => const Color(0xFF007F78),
      'warning' => const Color(0xFFAA6300),
      _ => Colors.grey,
    };
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(Icons.circle, size: 14, color: color),
        const SizedBox(width: 8),
        Expanded(child: Text('$label: ${sensor.message}')),
      ],
    );
  }
}
