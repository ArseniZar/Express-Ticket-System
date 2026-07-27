package com.example.inventoryservice;

import com.example.inventoryservice.model.Event;
import com.example.inventoryservice.repository.EventRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.context.annotation.Bean;

import java.time.LocalDateTime;

@EnableDiscoveryClient
@SpringBootApplication
public class InventoryServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(InventoryServiceApplication.class, args);
    }

    @Bean
    public CommandLineRunner initDatabase(EventRepository repository) {
        return args -> {
             
             

             
            String event1Title = "Koncert Skryptonita";
            if (!repository.existsByTitle(event1Title)) {
                repository.save(new Event(
                        event1Title,
                        120.0,
                        50,
                        LocalDateTime.now().plusDays(7),
                        LocalDateTime.now().plusDays(7).plusHours(3)
                ));
                System.out.println(">>> [INIT] Event '" + event1Title + "' created.");
            }

             
            String event2Title = "Final Ligi Mistrzow";
            if (!repository.existsByTitle(event2Title)) {
                repository.save(new Event(
                        event2Title,
                        350.0, 
                        10,
                        LocalDateTime.now().plusDays(14).withHour(21).withMinute(0),
                        LocalDateTime.now().plusDays(14).withHour(23).withMinute(30)
                ));
                System.out.println(">>> [INIT] Event '" + event2Title + "' created.");
            }

             
            String event3Title = "Spektakl Mistrz i Malgorzata";  
            if (!repository.existsByTitle(event3Title)) {
                repository.save(new Event(
                        event3Title,
                        65.0,
                        25,
                        LocalDateTime.now().plusDays(2).withHour(19).withMinute(0),
                        LocalDateTime.now().plusDays(2).withHour(21).withMinute(30)
                ));
                System.out.println(">>> [INIT] Event '" + event3Title + "' created.");
            }
        };
    }
}