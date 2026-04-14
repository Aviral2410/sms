package com.sms.finance.service;

import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.UUID;

/**
 * Unified Notification Service for multi-channel communication (SMS, Email, WhatsApp).
 * Consolidates third-party tool usage (Twilio for SMS/WA, SendGrid for Email).
 */
@Service
public class NotificationService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);
    private final PlatformConfigRuntimeClient platformConfigRuntimeClient;

    public NotificationService(PlatformConfigRuntimeClient platformConfigRuntimeClient) {
        this.platformConfigRuntimeClient = platformConfigRuntimeClient;
    }

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
                    logger.warn("Unknown notification channel: {}", channel);
            }
        }
    }

    private void sendEmail(UUID userId, String message) {
        PlatformConfigRuntimeClient.RuntimePlatformConfig config = this.platformConfigRuntimeClient.getRuntimeConfig("SENDGRID_EMAIL");
        if (!config.enabled()) {
            logger.warn("Skipping email notification because SENDGRID_EMAIL is disabled. userId={}", userId);
            return;
        }
        logger.info("[SENDGRID] Sending email. userId={} baseUrl={} message={}", userId, config.apiBaseUrl(), message);
    }

    private void sendSMS(UUID userId, String message) {
        PlatformConfigRuntimeClient.RuntimePlatformConfig config = this.platformConfigRuntimeClient.getRuntimeConfig("TWILIO_UNIFIED");
        if (!config.enabled()) {
            logger.warn("Skipping SMS notification because TWILIO_UNIFIED is disabled. userId={}", userId);
            return;
        }
        logger.info("[TWILIO-SMS] Sending sms. userId={} baseUrl={} message={}", userId, config.apiBaseUrl(), message);
    }

    private void sendWhatsApp(UUID userId, String message) {
        PlatformConfigRuntimeClient.RuntimePlatformConfig config = this.platformConfigRuntimeClient.getRuntimeConfig("TWILIO_UNIFIED");
        if (!config.enabled()) {
            logger.warn("Skipping WhatsApp notification because TWILIO_UNIFIED is disabled. userId={}", userId);
            return;
        }
        logger.info("[TWILIO-WA] Sending whatsapp. userId={} baseUrl={} message={}", userId, config.apiBaseUrl(), message);
    }
}
