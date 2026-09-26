import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../main.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final user = Supabase.instance.client.auth.currentUser;
  bool isLoading = false;
  String statusMessage = '';

  Future<void> generateScript(String prompt) async {
    setState(() {
      isLoading = true;
      statusMessage = 'Generating content...';
    });

    try {
      final response = await http.post(
        Uri.parse('$backendBaseUrl/api/generate-script'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'prompt': prompt}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          statusMessage = 'Success! Script created.';
        });
      } else {
        setState(() {
          statusMessage = 'Server error: ${response.statusCode}';
        });
      }
    } catch (e) {
      setState(() {
        statusMessage = 'Connection failed: $e';
      });
    } finally {
      setState(() {
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('ViralCraft AI Dashboard'),
        centerTitle: true,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Welcome, ${user?.email ?? "Creator"}!',
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            Card(
              child: ListTile(
                leading: const Icon(Icons.cloud_done, color: Colors.green),
                title: const Text('Backend Connection'),
                subtitle: Text(backendBaseUrl),
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: isLoading
                  ? null
                  : () => generateScript('Create a viral video script about AI'),
              icon: isLoading
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.auto_awesome),
              label: Text(isLoading ? 'Processing...' : 'Generate Viral Content'),
            ),
            if (statusMessage.isNotEmpty) ...[
              const SizedBox(height: 16),
              Text(
                statusMessage,
                style: const TextStyle(fontWeight: FontWeight.w500),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
