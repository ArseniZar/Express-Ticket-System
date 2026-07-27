package com.example.bookingservice.service;

import java.time.Instant;
import java.util.List;

import javax.xml.datatype.DatatypeFactory;
import javax.xml.datatype.XMLGregorianCalendar;

import org.springframework.stereotype.Service;

import com.example.bookingservice.client.InventoryClient;
import com.example.bookingservice.dto.inventory.CreateEventRequest;
import com.example.bookingservice.dto.inventory.DeleteEventRequest;
import com.example.bookingservice.dto.inventory.GetEventRequest;
import com.example.bookingservice.dto.inventory.UpdateEventRequest;
import com.example.bookingservice.reporting.ReportMessage;
import com.example.bookingservice.reporting.ReportPublisher;
import com.example.bookingservice.wsdl.EventSoapDto;

import org.springframework.transaction.annotation.Transactional;

@Service
public class InventoryService {
    private final InventoryClient inventoryClient;
    private final ReportPublisher reportPublisher;

    public InventoryService(InventoryClient inventoryClient, ReportPublisher reportPublisher) {
        this.inventoryClient = inventoryClient;
        this.reportPublisher = reportPublisher;
    }

    @Transactional
    public EventSoapDto createEvent(CreateEventRequest request) {
        EventSoapDto event = new EventSoapDto();
        event.setTitle(request.title());
        event.setPrice(request.price());
        event.setAvailableSeats(request.availableSeats());

        try {
            DatatypeFactory datatypeFactory = DatatypeFactory.newInstance();

            if (request.startTime() != null) {
                XMLGregorianCalendar xmlStartTime = datatypeFactory
                        .newXMLGregorianCalendar(request.startTime().toString());
                event.setStartTime(xmlStartTime);
            }

            if (request.endTime() != null) {
                XMLGregorianCalendar xmlEndTime = datatypeFactory.newXMLGregorianCalendar(request.endTime().toString());
                event.setEndTime(xmlEndTime);
            }
        } catch (javax.xml.datatype.DatatypeConfigurationException e) {
            throw new RuntimeException("XML Date Factory initialization failed: " + e.getMessage(), e);
        }

        try {
            event = inventoryClient.createEvent(event);
        } catch (Exception e) {
            reportPublisher.publish(new ReportMessage(
                    "booking-service",
                    "EVENT_CREATION_FAILED",
                    "event",
                    null,
                    null,
                    "reason=Failed to create event: " + e.getMessage(),
                    Instant.now().toString()));
            throw new RuntimeException("Failed to create event: " + e.getMessage(), e);
        }
        return event;
    }

    @Transactional
    public EventSoapDto deleteEvent(DeleteEventRequest request) {
        try {
            var event = inventoryClient.getEventById(request.eventId());
            if (event == null) {
                reportPublisher.publish(new ReportMessage(
                        "booking-service", "EVENT_DELETE_FAILED", "event",
                        request.eventId(), null,
                        "reason=Event not found", Instant.now().toString()));
                throw new RuntimeException("Event not found: " + request.eventId());
            }
            try {
                boolean status = inventoryClient.deleteEvent(event.getId());
                if (!status) {
                    reportPublisher.publish(new ReportMessage(
                            "booking-service", "EVENT_DELETE_FAILED", "event",
                            event.getId(), null,
                            "reason=Failed to delete event: ", Instant.now().toString()));
                    throw new RuntimeException("Failed to delete event with id: " + event.getId());
                }
                reportPublisher.publish(new ReportMessage(
                        "booking-service", "EVENT_DELETE_DELETED", "event",
                        event.getId(), null,
                        "status=deleted", Instant.now().toString()));
                return event;

            } catch (RuntimeException e) {
                reportPublisher.publish(new ReportMessage(
                        "booking-service", "EVENT_DELETE_FAILED", "event",
                        event.getId(), null,
                        "reason=Failed to delete event: " + e.getMessage(), Instant.now().toString()));
                throw new RuntimeException("Failed to delete event: " + e.getMessage(), e);
            }

        } catch (Exception e) {
            reportPublisher.publish(new ReportMessage(
                    "booking-service", "EVENT_DELETE_FAILED", "event",
                    request.eventId(), null,
                    "reason=Failed to delete event: " + e.getMessage(), Instant.now().toString()));
            throw new RuntimeException("" + e.getMessage(), e);
        }
    }

    @Transactional
    public EventSoapDto updateEvent(Long eventId, UpdateEventRequest request) {
        try {
            var event = inventoryClient.getEventById(eventId);
            if (event == null) {
                reportPublisher.publish(new ReportMessage(
                        "booking-service", "EVENT_DELETE_FAILED", "event",
                        eventId, null,
                        "reason=Event not found", Instant.now().toString()));
                throw new RuntimeException("Event not found: " + eventId);
            }
            event.setTitle(request.title());
            event.setPrice(request.price());
            event.setAvailableSeats(request.availableSeats());

            try {
                DatatypeFactory datatypeFactory = DatatypeFactory.newInstance();

                if (request.startTime() != null) {
                    XMLGregorianCalendar xmlStartTime = datatypeFactory
                            .newXMLGregorianCalendar(request.startTime().toString());
                    event.setStartTime(xmlStartTime);
                }

                if (request.endTime() != null) {
                    XMLGregorianCalendar xmlEndTime = datatypeFactory
                            .newXMLGregorianCalendar(request.endTime().toString());
                    event.setEndTime(xmlEndTime);
                }
            } catch (javax.xml.datatype.DatatypeConfigurationException e) {
                throw new RuntimeException("XML Date Factory initialization failed: " + e.getMessage(), e);
            }

           try {
                boolean status = inventoryClient.updateEvent(event);
                if (!status) {
                    reportPublisher.publish(new ReportMessage(
                            "booking-service", "EVENT_UPDATE_FAILED", "event",
                            event.getId(), null,
                            "reason=Failed to update event: ", Instant.now().toString()));
                    throw new RuntimeException("Failed to update event with id: " + event.getId());
                }
                reportPublisher.publish(new ReportMessage(
                        "booking-service", "EVENT_UPDATE_UPDATED", "event",
                        event.getId(), null,
                        "status=updated", Instant.now().toString()));
                return event;

            } catch (RuntimeException e) {
                reportPublisher.publish(new ReportMessage(
                        "booking-service", "EVENT_UPDATE_FAILED", "event",
                        event.getId(), null,
                        "reason=Failed to update event: " + e.getMessage(), Instant.now().toString()));
                throw new RuntimeException("Failed to update event: " + e.getMessage(), e);
            }

        } catch (Exception e) {
            reportPublisher.publish(new ReportMessage(
                    "booking-service", "EVENT_UPDATE_FAILED", "event",
                    eventId, null,
                    "reason=Event not found: " + e.getMessage(), Instant.now().toString()));
            throw new RuntimeException("Event not found: " + eventId);
        }
    }
    
    @Transactional
    public EventSoapDto getEventById(GetEventRequest request) {
        try {
            var event = inventoryClient.getEventById(request.eventId());
            if (event == null) {
                reportPublisher.publish(new ReportMessage(
                        "booking-service", "EVENT_FETCH_FAILED", "event",
                        request.eventId(), null,
                        "reason=Event not found", Instant.now().toString()));
                throw new RuntimeException("Event not found: " + request.eventId());
            }
            return event;
        } catch (Exception e) {
            reportPublisher.publish(new ReportMessage(
                    "booking-service", "EVENT_FETCH_FAILED", "event",
                    request.eventId(), null,
                    "reason=Failed to fetch event: " + e.getMessage(), Instant.now().toString()));
            throw new RuntimeException("Failed to fetch event: " + e.getMessage(), e);
        }
    }

    @Transactional
    public List<EventSoapDto> getAllEvents() {
        try {
            return inventoryClient.getAllEvents();
        } catch (Exception e) {
            reportPublisher.publish(new ReportMessage(
                    "booking-service", "EVENT_FETCH_ALL_FAILED", "event",
                    null, null,
                    "reason=Failed to fetch events: " + e.getMessage(), Instant.now().toString()));
            throw new RuntimeException("Failed to fetch events: " + e.getMessage(), e);
        }
    }

}
