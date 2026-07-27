package com.example.bookingservice.reporting;

public record ReportMessage(
        String service,
        String action,
        String entity,
        Long entityId,
        Long userId,
        String details,
        String timestamp
) {}
