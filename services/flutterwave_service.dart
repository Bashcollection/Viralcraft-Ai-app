import 'package:flutter/material.dart';
import 'package:flutterwave_standard/flutterwave_standard.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class FlutterwaveService {
  // Live Public Key
  static const String livePublicKey = 'FLWPUBK-e165c107cffe4924242b35baa8ef803a-X';

  static Future<void> processLivePayment({
    required BuildContext context,
    required double amount,
    required String itemDescription,
    required Function(String txRef, String status) onSuccess,
  }) async {
    final user = Supabase.instance.client.auth.currentUser;
    final email = user?.email ?? 'customer@example.com';
    final txRef = 'VC-LIVE-${DateTime.now().millisecondsSinceEpoch}';

    final Customer customer = Customer(
      name: user?.userMetadata?['full_name'] ?? "ViralCraft User",
      phoneNumber: "08000000000",
      email: email,
    );

    final Flutterwave flutterwave = Flutterwave(
      context: context,
      publicKey: livePublicKey,
      currency: "NGN",
      redirectUrl: "https://viralcraft-ai-app.onrender.com/api/payment/callback",
      txRef: txRef,
      amount: amount.toStringAsFixed(2),
      customer: customer,
      paymentOptions: "card, ussd, banktransfer",
      customization: Customization(
        title: "ViralCraft AI",
        description: itemDescription,
        logo: "https://viralcraft-ai-app.onrender.com/logo.png",
      ),
      isTestMode: false,
    );

    try {
      final ChargeResponse response = await flutterwave.charge();

      if (response.status == "successful" || response.status == "success" || response.status == "completed") {
        onSuccess(txRef, response.status ?? "success");
      } else {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Payment Unsuccessful: ${response.status ?? "Cancelled"}'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Payment Error: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
}
