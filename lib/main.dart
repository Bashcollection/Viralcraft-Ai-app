import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'screens/dashboard_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Supabase.initialize(
    url: 'https://jjrultpfgynxqowfnagu.supabase.co',
    anonKey: const String.fromEnvironment(
      'SUPABASE_ANON_KEY',
      defaultValue: 'FLWPUBK-e165c107cffe4924242b35baa8ef803a-X',
    ),
    authOptions: const FlutterAuthClientOptions(
      authFlowType: AuthFlowType.pkce,
    ),
  );

  runApp(const ViralCraftApp());
}

class ViralCraftApp extends StatelessWidget {
  const ViralCraftApp({super.key});

  @override
  Widget build(BuildContext context) {
    // Professional Deep Blue & Indigo Palette
    const seedIndigo = Colors.indigo;
    const scaffoldBg = Color(0xFFF5F7FA);

    return MaterialApp(
      title: 'ViralCraft AI',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        scaffoldBackgroundColor: scaffoldBg,
        colorScheme: ColorScheme.fromSeed(
          seedColor: seedIndigo,
          brightness: Brightness.light,
          primary: const Color(0xFF1E40AF),     // Deep Indigo/Blue
          secondary: const Color(0xFF0284C7),   // Sky/Cyan accent
          surface: Colors.white,
          background: scaffoldBg,
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.white,
          foregroundColor: Color(0xFF0F172A),
          elevation: 0.5,
          centerTitle: false,
          titleTextStyle: TextStyle(
            color: Color(0xFF0F172A),
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        cardTheme: CardTheme(
          color: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
            side: const BorderSide(color: Color(0xFFE2E8F0)),
          ),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF1E40AF),
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          ),
        ),
      ),
      home: const DashboardScreen(),
    );
  }
}
