package com.example.bookingservice.controller;

import com.example.bookingservice.dto.booking.*;
import com.example.bookingservice.service.BookingService;
import org.springframework.hateoas.EntityModel;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.linkTo;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.methodOn;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    public ResponseEntity<?> createBooking(@RequestBody CreateBookingRequest request) {
        try {
            var booking = bookingService.createBooking(request);

            var response = new CreateBookingResponse(
                    booking.getId(),
                    booking.getTotalPrice(),
                    booking.getStatus().name(),
                    "Booking created successfully");

            var model = EntityModel.of(response);
            model.add(linkTo(methodOn(BookingController.class).getBookingById(booking.getId())).withSelfRel());
            model.add(linkTo(methodOn(BookingController.class).payBooking(booking.getId())).withRel("pay"));

            return ResponseEntity.ok(model);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{bookingId}")
    public ResponseEntity<?> deleteBooking(@PathVariable Long bookingId) {
        try {
            var request = new DeleteBookingRequest(bookingId);
            var booking = bookingService.deleteBooking(request);
            var response = new DeleteBookingResponse(
                    booking.getId(),
                    booking.getStatus().name(),
                    "Booking delete successfully");

            var model = EntityModel.of(response);
            model.add(linkTo(methodOn(BookingController.class).getAllBookingsByUserId(booking.getUserId())).withRel("user-bookings"));

            return ResponseEntity.ok(model);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/pay/{bookingId}")
    public ResponseEntity<?> payBooking(@PathVariable Long bookingId) {
        try {
            var request = new PayBookingRequest(bookingId);
            var booking = bookingService.payBooking(request);
            var response = new PayBookingResponse(
                    booking.getId(),
                    booking.getStatus().name(),
                    booking.getTotalPrice(),
                    "Booking payment processed successfully");

            var model = EntityModel.of(response);
            model.add(linkTo(methodOn(BookingController.class).getBookingById(bookingId)).withSelfRel());

            return ResponseEntity.ok(model);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getAllBookingsByUserId(@PathVariable Long userId) {
        try {
            var request = new GetAllBookingByUserRequest(userId);
            var bookings = bookingService.getAllBookingsByUserId(request);
            
            List<EntityModel<GetAllBookingByUserResponse>> response = bookings.stream()
                    .map(booking -> {
                        var dto = new GetAllBookingByUserResponse(
                                booking.getId(),
                                booking.getUserId(),
                                booking.getEventId(),
                                booking.getStatus().name(),
                                booking.getSeats(),
                                booking.getTotalPrice(),
                                booking.getCreatedAt());
                        
                        return EntityModel.of(dto,
                                linkTo(methodOn(BookingController.class).getBookingById(booking.getId())).withSelfRel());
                    })
                    .toList();

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{bookingId}")
    public ResponseEntity<?> getBookingById(@PathVariable Long bookingId) {
        try {
            var request = new GetBookingRequest(bookingId);
            var booking = bookingService.getBookingById(request);
            var response = new GetBookingResponse(
                    booking.getId(),
                    booking.getUserId(),
                    booking.getEventId(),
                    booking.getStatus().name(),
                    booking.getSeats(),
                    booking.getTotalPrice(),
                    booking.getCreatedAt());

            var model = EntityModel.of(response);
            
            model.add(linkTo(methodOn(BookingController.class).getBookingById(bookingId)).withSelfRel());
            model.add(linkTo(methodOn(BookingController.class).deleteBooking(bookingId)).withRel("delete"));
            
            if ("PENDING".equals(booking.getStatus().name())) {
                model.add(linkTo(methodOn(BookingController.class).payBooking(bookingId)).withRel("pay"));
            }

            return ResponseEntity.ok(model);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}