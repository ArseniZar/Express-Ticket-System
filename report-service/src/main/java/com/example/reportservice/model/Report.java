package com.example.reportservice.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reports")
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "service_name", nullable = false)
    private String serviceName; 

    @Column(name = "event_type", nullable = false)
    private String eventType;  

    @Column(name = "entity_type")
    private String entityType; 

    @Column(name = "entity_id")
    private Long entityId;      

    @Column(name = "user_id")
    private Long userId;

    @Column(columnDefinition = "TEXT")
    private String payload;   

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public Report() {
        this.createdAt = LocalDateTime.now();
    }

    public Report(String serviceName, String eventType, String entityType, Long entityId, Long userId, String payload) {
        this.serviceName = serviceName;
        this.eventType = eventType;
        this.entityType = entityType;
        this.entityId = entityId;
        this.userId = userId;
        this.payload = payload;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public String getServiceName() { return serviceName; }
    public void setServiceName(String serviceName) { this.serviceName = serviceName; }
    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }
    public Long getEntityId() { return entityId; }
    public void setEntityId(Long entityId) { this.entityId = entityId; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getPayload() { return payload; }
    public void setPayload(String payload) { this.payload = payload; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}