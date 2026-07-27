package com.example.reportservice.messaging;

import com.example.reportservice.model.Report;
import com.example.reportservice.repository.ReportRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

@Service
public class ReportListener {

    private static final Logger logger = LoggerFactory.getLogger(ReportListener.class);
    private final ReportRepository reportRepository;

    public ReportListener(ReportRepository reportRepository) {
        this.reportRepository = reportRepository;
    }

    @RabbitListener(queues = "reports_queue")
    public void processReport(ReportMessage message) {
        if (message == null) {
            logger.warn("Received a null message. Skipping.");
            return;
        }

        if (message.service() == null || message.action() == null || message.entityId() == null) {
            logger.error("Invalid message format: service={}, action={}, entityId={}",
                    message.service(), message.action(), message.entityId());
            return;
        }

        try {
            logger.info("Processing event [{}] for [{}] ID [{}] sent at [{}]",
                    message.action(), message.entity(), message.entityId(), message.timestamp());

            Report report = new Report(
                    message.service(),  
                    message.action(),    
                    message.entity(),    
                    message.entityId(),  
                    message.userId(),  
                    message.details()   
            );

            reportRepository.save(report);
            logger.info("Report successfully saved for entity ID: {}", message.entityId());

        } catch (Exception e) {
            logger.error("Failed to save report to database: {}", e.getMessage());
        }
    }
}