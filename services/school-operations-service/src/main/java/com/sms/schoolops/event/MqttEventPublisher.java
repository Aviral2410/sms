package com.sms.schoolops.event;

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

    private static final Logger logger = LoggerFactory.getLogger(MqttEventPublisher.class);

    private final ObjectMapper objectMapper;
    private IMqttClient mqttClient;

    @Value("${app.mqtt.broker-url:tcp://sms-mqtt-broker:1883}")
    private String brokerUrl;

    @Value("${app.mqtt.client-id:school-operations-service}")
    private String clientId;

    public MqttEventPublisher(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void init() {
        try {
            this.mqttClient = new MqttClient(brokerUrl, clientId + "_" + UUID.randomUUID().toString().substring(0, 8));
            MqttConnectOptions options = new MqttConnectOptions();
            options.setAutomaticReconnect(true);
            options.setCleanSession(true);
            options.setConnectionTimeout(10);
            mqttClient.connect(options);
            logger.info("MQTT connected. brokerUrl={}", brokerUrl);
        } catch (Exception e) {
            logger.warn("Failed to connect to MQTT broker. brokerUrl={} error={}", brokerUrl, e.getMessage());
        }
    }

    public void publish(String topic, Object payload) {
        if (mqttClient == null || !mqttClient.isConnected()) {
            return;
        }
        try {
            byte[] bytes = objectMapper.writeValueAsBytes(payload);
            MqttMessage message = new MqttMessage(bytes);
            message.setQos(1);
            mqttClient.publish(topic, message);
        } catch (Exception e) {
            logger.warn("Failed to publish MQTT message. topic={} error={}", topic, e.getMessage());
        }
    }

    @PreDestroy
    public void cleanup() {
        try {
            if (mqttClient != null && mqttClient.isConnected()) {
                mqttClient.disconnect();
                mqttClient.close();
            }
        } catch (Exception e) {
            // ignore
        }
    }
}
