package com.example.walletservice.reporting;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@Component
public class ReportPublisher {

    public static final String QUEUE_NAME = "reports_queue";

    private static final Logger logger = LoggerFactory.getLogger(ReportPublisher.class);

    private final RabbitTemplate rabbitTemplate;

    public ReportPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publish(ReportMessage message) {
        try {
            rabbitTemplate.convertAndSend("", QUEUE_NAME, message);
        } catch (Exception ex) {
            logger.warn("Failed to publish report", ex);
        }
    }
}

