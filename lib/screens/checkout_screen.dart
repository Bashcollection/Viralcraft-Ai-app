import 'package:flutter/material.dart';
import '../services/flutterwave_service.dart';

class CheckoutScreen extends StatelessWidget {
  const CheckoutScreen({super.key});

  void _handleBuyCredits(BuildContext context, double amount, int credits) {
    FlutterwaveService.processLivePayment(
      context: context,
      amount: amount,
      itemDescription: '$credits AI Script Generation Credits',
      onSuccess: (txRef, status) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Payment Successful! Reference: $txRef'),
              backgroundColor: Colors.green,
            ),
          );
        }
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Top Up AI Credits'),
        centerTitle: true,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            _buildCreditCard(
              context,
              title: 'Starter Pack',
              credits: 50,
              price: 1500,
              color: Colors.blue.shade50,
            ),
            const SizedBox(height: 16),
            _buildCreditCard(
              context,
              title: 'Pro Creator Pack',
              credits: 200,
              price: 5000,
              color: Colors.indigo.shade50,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCreditCard(
    BuildContext context, {
    required String title,
    required int credits,
    required double price,
    required Color color,
  }) {
    return Card(
      color: color,
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        subtitle: Text('$credits AI Script Credits'),
        trailing: ElevatedButton(
          onPressed: () => _handleBuyCredits(context, price, credits),
          child: Text('₦${price.toStringAsFixed(0)}'),
        ),
      ),
    );
  }
}
