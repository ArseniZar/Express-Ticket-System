package com.example.bookingservice.controller;

import org.springframework.hateoas.EntityModel;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.bookingservice.dto.inventory.*;
import com.example.bookingservice.service.InventoryService;

import java.time.ZoneId;
import java.util.List;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.linkTo;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.methodOn;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @PostMapping
    public ResponseEntity<?> createEvent(@RequestBody CreateEventRequest request) {
        try {
            var event = inventoryService.createEvent(request);
            var response = new CreateEventResponse(event.getId(), "Event created successfully");

            var model = EntityModel.of(response);
            model.add(linkTo(methodOn(InventoryController.class).getEventById(event.getId())).withSelfRel());

            return ResponseEntity.ok(model);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{eventId}")
    public ResponseEntity<?> deleteEvent(@PathVariable Long eventId) {
        try {
            var request = new DeleteEventRequest(eventId);
            var entity = inventoryService.deleteEvent(request);
            var response = new DeleteEventResponse(entity.getId(), "Event deleted successfully");

            var model = EntityModel.of(response);
            model.add(linkTo(methodOn(InventoryController.class).getAllEvents()).withRel("all-events"));

            return ResponseEntity.ok(model);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{eventId}")
    public ResponseEntity<?> updateEvent(@PathVariable Long eventId, @RequestBody UpdateEventRequest request) {
        try {
            var entity = inventoryService.updateEvent(eventId, request);
            var response = new UpdateEventResponse(entity.getId(), "Event updated successfully"); // Исправили опечатку

            var model = EntityModel.of(response);
            model.add(linkTo(methodOn(InventoryController.class).getEventById(entity.getId())).withSelfRel());

            return ResponseEntity.ok(model);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{eventId}")
    public ResponseEntity<?> getEventById(@PathVariable Long eventId) {
        try {
            var request = new GetEventRequest(eventId);
            var event = inventoryService.getEventById(request);
            var response = new GetEventResponse(
                    event.getId(),
                    event.getTitle(),
                    event.getPrice(),
                    event.getAvailableSeats(),
                    event.getStartTime().toGregorianCalendar().toInstant()
                            .atZone(ZoneId.systemDefault())
                            .toLocalDateTime(),
                    event.getEndTime().toGregorianCalendar().toInstant().atZone(ZoneId.systemDefault())
                            .toLocalDateTime());

            var model = EntityModel.of(response);
            model.add(linkTo(methodOn(InventoryController.class).getEventById(eventId)).withSelfRel());
            model.add(linkTo(methodOn(InventoryController.class).updateEvent(eventId, null)).withRel("update"));
            model.add(linkTo(methodOn(InventoryController.class).deleteEvent(eventId)).withRel("delete"));

            return ResponseEntity.ok(model);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllEvents() {
        try {
            var events = inventoryService.getAllEvents();
            
            List<EntityModel<GetEventResponse>> response = events.stream().map(event -> {
                var dto = new GetEventResponse(
                        event.getId(),
                        event.getTitle(),
                        event.getPrice(),
                        event.getAvailableSeats(),
                        event.getStartTime().toGregorianCalendar().toInstant()
                                .atZone(ZoneId.systemDefault())
                                .toLocalDateTime(),
                        event.getEndTime().toGregorianCalendar().toInstant()
                                .atZone(ZoneId.systemDefault())
                                .toLocalDateTime());
                
                return EntityModel.of(dto,
                        linkTo(methodOn(InventoryController.class).getEventById(event.getId())).withSelfRel());
            }).toList();

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}