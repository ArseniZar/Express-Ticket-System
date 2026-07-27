package com.example.inventoryservice.endpoint;

import com.example.inventoryservice.repository.EventRepository;
import com.example.inventoryservice.soap.CreateEventRequest;
import com.example.inventoryservice.soap.CreateEventResponse;
import com.example.inventoryservice.soap.DeleteEventRequest;
import com.example.inventoryservice.soap.DeleteEventResponse;
import com.example.inventoryservice.soap.EventSoapDto;
import com.example.inventoryservice.soap.GetEventByIdRequest;
import com.example.inventoryservice.soap.GetEventByIdResponse;
import com.example.inventoryservice.soap.GetEventsRequest;
import com.example.inventoryservice.soap.GetEventsResponse;
import com.example.inventoryservice.soap.UpdateEventRequest;
import com.example.inventoryservice.soap.UpdateEventResponse;
import com.example.inventoryservice.reporting.ReportMessage;
import com.example.inventoryservice.reporting.ReportPublisher;
import org.springframework.ws.server.endpoint.annotation.Endpoint;
import org.springframework.ws.server.endpoint.annotation.PayloadRoot;
import org.springframework.ws.server.endpoint.annotation.RequestPayload;
import org.springframework.ws.server.endpoint.annotation.ResponsePayload;

import javax.xml.datatype.DatatypeFactory;
import javax.xml.datatype.XMLGregorianCalendar;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.GregorianCalendar;
import java.util.List;

@Endpoint
public class EventEndpoint {

    private static final String NAMESPACE_URI = "http://example.com/inventoryservice/soap";

    private final EventRepository eventRepository;
    private final ReportPublisher reportPublisher;

    public EventEndpoint(EventRepository eventRepository, ReportPublisher reportPublisher) {
        this.eventRepository = eventRepository;
        this.reportPublisher = reportPublisher;
    }

    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "getEventsRequest")
    @ResponsePayload
    public GetEventsResponse getEvents(@RequestPayload GetEventsRequest request) {
        GetEventsResponse response = new GetEventsResponse();

        List<com.example.inventoryservice.model.Event> dbEvents = eventRepository.findAll();

        try {
            for (com.example.inventoryservice.model.Event dbEvent : dbEvents) {
                response.getEvents().add(mapToSoap(dbEvent));
            }
        } catch (Exception e) {
            throw new RuntimeException("Blad mapowania daty w SOAP", e);
        }

        return response;
    }

    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "getEventByIdRequest")
    @ResponsePayload
    public GetEventByIdResponse getEventById(@RequestPayload GetEventByIdRequest request) {
        if (request.getId() == 0L) {
            throw new RuntimeException("Event id is required");
        }

        com.example.inventoryservice.model.Event event = eventRepository.findById(request.getId())
                .orElseThrow(() -> new RuntimeException("Event not found: " + request.getId()));

        GetEventByIdResponse response = new GetEventByIdResponse();
        response.setEvent(mapToSoap(event));
        return response;
    }

    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "createEventRequest")
    @ResponsePayload
    public CreateEventResponse createEvent(@RequestPayload CreateEventRequest request) {
        com.example.inventoryservice.model.Event event = new com.example.inventoryservice.model.Event(
                request.getTitle(),
                request.getPrice(),
                request.getAvailableSeats(),
                toLocalDateTime(request.getStartTime()),
                toLocalDateTime(request.getEndTime())
        );

        com.example.inventoryservice.model.Event saved = eventRepository.save(event);

        reportPublisher.publish(new ReportMessage(
            "inventory-service",
            "EVENT_CREATED",
            "event",
            saved.getId(),
            null,
            "title=" + saved.getTitle(),
            Instant.now().toString()
        ));

        CreateEventResponse response = new CreateEventResponse();
        response.setEvent(mapToSoap(saved));
        return response;
    }

    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "updateEventRequest")
    @ResponsePayload
    public UpdateEventResponse updateEvent(@RequestPayload UpdateEventRequest request) {
        UpdateEventResponse response = new UpdateEventResponse();

        if (request.getEvent() == null) {
            response.setSuccess(false);
            return response;
        }

        return eventRepository.findById(request.getEvent().getId())
                .map(existing -> {
                    EventSoapDto dto = request.getEvent();
                    existing.setTitle(dto.getTitle());
                    existing.setPrice(dto.getPrice());
                    existing.setAvailableSeats(dto.getAvailableSeats());
                    existing.setStartTime(toLocalDateTime(dto.getStartTime()));
                    existing.setEndTime(toLocalDateTime(dto.getEndTime()));
                    eventRepository.save(existing);
                    response.setSuccess(true);

                        reportPublisher.publish(new ReportMessage(
                            "inventory-service",
                            "EVENT_UPDATED",
                            "event",
                            existing.getId(),
                            null,
                            "title=" + existing.getTitle(),
                            Instant.now().toString()
                        ));
                    return response;
                })
                .orElseGet(() -> {
                    response.setSuccess(false);
                    return response;
                });
    }

    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "deleteEventRequest")
    @ResponsePayload
    public DeleteEventResponse deleteEvent(@RequestPayload DeleteEventRequest request) {
        DeleteEventResponse response = new DeleteEventResponse();

        if (request.getId() == 0L) {
            response.setSuccess(false);
            return response;
        }

        if (eventRepository.existsById(request.getId())) {
            eventRepository.deleteById(request.getId());
            response.setSuccess(true);

            reportPublisher.publish(new ReportMessage(
                    "inventory-service",
                    "EVENT_DELETED",
                    "event",
                    request.getId(),
                    null,
                    "",
                    Instant.now().toString()
            ));
        } else {
            response.setSuccess(false);
        }

        return response;
    }

    private EventSoapDto mapToSoap(com.example.inventoryservice.model.Event dbEvent) {
        try {
            EventSoapDto soapDto = new EventSoapDto();
            soapDto.setId(dbEvent.getId());
            soapDto.setTitle(dbEvent.getTitle());
            soapDto.setPrice(dbEvent.getPrice());
            soapDto.setAvailableSeats(dbEvent.getAvailableSeats());

            if (dbEvent.getStartTime() != null) {
                GregorianCalendar startCal = GregorianCalendar.from(dbEvent.getStartTime().atZone(ZoneId.systemDefault()));
                XMLGregorianCalendar xmlStart = DatatypeFactory.newInstance().newXMLGregorianCalendar(startCal);
                soapDto.setStartTime(xmlStart);
            }

            if (dbEvent.getEndTime() != null) {
                GregorianCalendar endCal = GregorianCalendar.from(dbEvent.getEndTime().atZone(ZoneId.systemDefault()));
                XMLGregorianCalendar xmlEnd = DatatypeFactory.newInstance().newXMLGregorianCalendar(endCal);
                soapDto.setEndTime(xmlEnd);
            }

            return soapDto;
        } catch (Exception e) {
            throw new RuntimeException("Blad mapowania daty w SOAP", e);
        }
    }

    private LocalDateTime toLocalDateTime(XMLGregorianCalendar xmlDate) {
        if (xmlDate == null) {
            return null;
        }
        return xmlDate.toGregorianCalendar().toZonedDateTime().toLocalDateTime();
    }
}