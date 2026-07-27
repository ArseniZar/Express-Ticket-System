package com.example.bookingservice.dto.inventory;

import java.time.LocalDateTime;

public record CreateEventRequest(
        String title,
        double price,
        int availableSeats,
        LocalDateTime startTime,
        LocalDateTime endTime
) {}
