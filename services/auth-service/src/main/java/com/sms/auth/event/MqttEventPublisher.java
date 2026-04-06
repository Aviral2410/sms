package com.sms.auth.event;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.eclipse.paho.client.mqttv3.IMqttClient;
import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.util.UUID;

@Component
public class MqttEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(MqttEventPublisher.class);

    @Value("${app.mqtt.broker-url:tcp://sms-mqtt-broker:1883}")
    private String brokerUrl;

    private IMqttClient client;
    private final ObjectMapper objectMapper;

    public MqttEventPublisher(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void init() {
        try {
            String publisherId = "auth-service-" + UUID.randomUUID().toString().substring(0, 8);
            this.client = new MqttClient(brokerUrl, publisherId);
            
            MqttConnectOptions options = new MqttConnectOptions();
            options.setAutomaticReconnect(true);
            options.setCleanSession(true);
            options.setConnectionTimeout(10);
            
            log.info("Connecting to MQTT broker at {}", brokerUrl);
            this.client.connect(options);
            log.info("Successfully connected to MQTT broker");
        } catch (Exception e) {
            log.warn("Failed to connect to MQTT broker: {}", e.getMessage());
        }
    }

    public void publish(String topic, Object payload) {
        if (client == null || !client.isConnected()) {
            return;
        }

        try {
            String json = objectMapper.writeValueAsString(payload);
            MqttMessage msg = new MqttMessage(json.getBytes());
            msg.setQos(1);
            client.publish(topic, msg);
            log.debug("Published to topic {}: {}", topic, json);
        } catch (Exception e) {
            log.error("Error publishing to MQTT topic {}: {}", topic, e.getMessage());
        }
    }

    @PreDestroy
    public void cleanup() {
        try {
            if (client != null && client.isConnected()) {
                client.disconnect();
                client.close();
            }
        } catch (Exception e) {
            log.error("Error during MQTT client cleanup", e);
        }
    }
}
