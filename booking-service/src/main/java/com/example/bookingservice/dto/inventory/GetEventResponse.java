package com.example.bookingservice.dto.inventory;

import java.time.LocalDateTime;

public record GetEventResponse(
        Long eventId,
        String title,
        double price,
        int availableSeats,
        LocalDateTime startTime,
        LocalDateTime endTime) {

}
