package com.sms.finance.service;

import org.springframework.stereotype.Service;
import java.util.UUID;

/**
 * Unified Notification Service for multi-channel communication (SMS, Email, WhatsApp).
 * Consolidates third-party tool usage (Twilio for SMS/WA, SendGrid for Email).
 */
@Service
public class NotificationService {

    /**
     * Sends a unified notification across multiple channels.
     * @param userId The recipient user ID.
     * @param message The message content.
     * @param channels Array of channels to use (e.g., "SMS", "EMAIL", "WHATSAPP").
     */
    public void sendUnifiedNotification(UUID userId, String message, String[] channels) {
        for (String channel : channels) {
            switch (channel.toUpperCase()) {
                case "EMAIL":
                    sendEmail(userId, message);
                    break;
                case "SMS":
                    sendSMS(userId, message);
                    break;
                case "WHATSAPP":
                    sendWhatsApp(userId, message);
                    break;
                default:
                    System.out.println("Unknown notification channel: " + channel);
            }
        }
    }

    private void sendEmail(UUID userId, String message) {
        // [SENDGRID INTEGRATION]
        System.out.println("[SENDGRID] Sending Email to user " + userId + ": " + message);
    }

    private void sendSMS(UUID userId, String message) {
        // [TWILIO SMS INTEGRATION]
        System.out.println("[TWILIO-SMS] Sending SMS to user " + userId + ": " + message);
    }

    private void sendWhatsApp(UUID userId, String message) {
        // [TWILIO WHATSAPP INTEGRATION]
        System.out.println("[TWILIO-WA] Sending WhatsApp to user " + userId + ": " + message);
    }
}
