package com.example.bookingservice.client;

import com.example.bookingservice.wsdl.*;
import jakarta.annotation.PostConstruct;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.discovery.DiscoveryClient;
import org.springframework.oxm.jaxb.Jaxb2Marshaller;
import org.springframework.stereotype.Component;
import org.springframework.ws.client.core.support.WebServiceGatewaySupport;

import java.util.List;

@Component
public class InventoryClient extends WebServiceGatewaySupport {

    private final DiscoveryClient discoveryClient;
    private static final String SERVICE_NAME = "inventory-service";

    public InventoryClient(DiscoveryClient discoveryClient) {
        this.discoveryClient = discoveryClient;
    }

    @PostConstruct
    public void init() {
        Jaxb2Marshaller marshaller = new Jaxb2Marshaller();
        marshaller.setContextPath("com.example.bookingservice.wsdl");
        
        this.setMarshaller(marshaller);
        this.setUnmarshaller(marshaller);
    }

    private String getEndpoint() {
        List<ServiceInstance> instances = discoveryClient.getInstances(SERVICE_NAME);
        if (instances == null || instances.isEmpty()) {
            throw new RuntimeException("Inventory service not found in Eureka!");
        }
        return instances.get(0).getUri().toString() + "/ws/inventory";
    }

    public List<EventSoapDto> getAllEvents() {
        GetEventsResponse res = (GetEventsResponse) getWebServiceTemplate()
            .marshalSendAndReceive(getEndpoint(), new GetEventsRequest());
        return res.getEvents();
    }

    public EventSoapDto getEventById(Long id) {
        GetEventByIdRequest req = new GetEventByIdRequest();
        req.setId(id);
        GetEventByIdResponse res = (GetEventByIdResponse) getWebServiceTemplate()
            .marshalSendAndReceive(getEndpoint(), req);
        return res.getEvent();
    }

    public EventSoapDto createEvent(EventSoapDto event) {
        CreateEventRequest req = new CreateEventRequest();
        req.setTitle(event.getTitle());
        req.setPrice(event.getPrice());
        req.setAvailableSeats(event.getAvailableSeats());
        req.setStartTime(event.getStartTime());
        req.setEndTime(event.getEndTime());

        CreateEventResponse res = (CreateEventResponse) getWebServiceTemplate()
            .marshalSendAndReceive(getEndpoint(), req);
        return res.getEvent();
    }

    public boolean updateEvent(EventSoapDto event) {
        UpdateEventRequest req = new UpdateEventRequest();
        req.setEvent(event);
        UpdateEventResponse res = (UpdateEventResponse) getWebServiceTemplate()
            .marshalSendAndReceive(getEndpoint(), req);
        return res.isSuccess();
    }

    public boolean deleteEvent(Long id) {
        DeleteEventRequest req = new DeleteEventRequest();
        req.setId(id);
        DeleteEventResponse res = (DeleteEventResponse) getWebServiceTemplate()
            .marshalSendAndReceive(getEndpoint(), req);
        return res.isSuccess();
    }
}