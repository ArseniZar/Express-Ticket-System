package com.example.bookingservice.dto.user;


public record GetUserResponse(
        Long userId,
        String username,
        String firstName,
        String lastName,
        int age) {

}
