import 'package:flutter/material.dart';

class AppTheme {
  AppTheme._();
  static const navy = Color(0xFF152B40);
  static const teal = Color(0xFF007F78);
  static const muted = Color(0xFF526474);
  static const background = Color(0xFFF3F6F8);

  static ThemeData get light => ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(seedColor: teal),
    scaffoldBackgroundColor: background,
    appBarTheme: const AppBarTheme(
      backgroundColor: background,
      foregroundColor: navy,
      centerTitle: false,
      elevation: 0,
      scrolledUnderElevation: 0,
    ),
    navigationBarTheme: const NavigationBarThemeData(
      backgroundColor: Colors.white,
      indicatorColor: Color(0xFFD4EEE9),
    ),
    dividerColor: const Color(0xFFDEE5EB),
  );
}
