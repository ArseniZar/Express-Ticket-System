package com.example.bookingservice;

import com.example.bookingservice.dto.user.CreateUserRequest;  
import com.example.bookingservice.model.User;
import com.example.bookingservice.repository.BookingRepository;
import com.example.bookingservice.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.context.annotation.Bean;

@EnableDiscoveryClient
@SpringBootApplication
public class BookingServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(BookingServiceApplication.class, args);
    }

    @Bean
    CommandLineRunner initDatabase(UserRepository userRepository,
                                   BookingRepository bookingRepository) {
        return args -> {
            String adminUsername = "admin";

            if (!userRepository.existsByUsername(adminUsername)) {
                
                User admin = new User(
                        adminUsername, 
                        "System", 
                        "Administrator", 
                        30
                );
              
                userRepository.save(admin);
                System.out.println(">>> [INIT] Database initialized! Admin created.");
            } else {
                System.out.println(">>> [INIT] Admin already exists. Skipping database initialization.");
            }
        };
    }
}