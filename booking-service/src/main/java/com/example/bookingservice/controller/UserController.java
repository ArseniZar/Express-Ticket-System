package com.example.bookingservice.controller;

import com.example.bookingservice.dto.user.*;
import com.example.bookingservice.service.UserService;
import org.springframework.hateoas.EntityModel;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.linkTo;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.methodOn;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody CreateUserRequest request) {
        try {
            var user = userService.createUser(request);

            var response = new CreateUserResponse(
                    user.getId(),
                    "User created successfully");

            var model = EntityModel.of(response);
            model.add(linkTo(methodOn(UserController.class).getUserById(user.getId())).withSelfRel());

            return ResponseEntity.ok(model);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{userId}")
    public ResponseEntity<?> updateUser(@PathVariable Long userId, @RequestBody UpdateUserRequest request) {
        try {
            var updateRequest = new UpdateUserRequest(
                    request.firstName(),
                    request.lastName(),
                    request.age(),
                    request.username());
            var user = userService.updateUser(userId, updateRequest);
            var response = new UpdateUserResponse(user.getId(), "User updated successfully");

            var model = EntityModel.of(response);
            model.add(linkTo(methodOn(UserController.class).getUserById(user.getId())).withSelfRel());

            return ResponseEntity.ok(model);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<?> deleteUser(@PathVariable Long userId) {
        try {
            var request = new DeleteUserRequest(userId); 
            userService.deleteUser(request);
            var response = new DeleteUserResponse("User deleted successfully");

            var model = EntityModel.of(response);
            model.add(linkTo(methodOn(UserController.class).getAllUsers()).withRel("all-users"));

            return ResponseEntity.ok(model);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{userId}")
    public ResponseEntity<?> getUserById(@PathVariable Long userId) {
        try {
            var request = new GetUserRequest(userId);
            var user = userService.getUserById(request);
            var response = new GetUserResponse(
                    user.getId(),
                    user.getUsername(),
                    user.getFirstName(),
                    user.getLastName(),
                    user.getAge());

            var model = EntityModel.of(response);
            model.add(linkTo(methodOn(UserController.class).getUserById(userId)).withSelfRel());
            model.add(linkTo(methodOn(UserController.class).getUserByUsername(user.getUsername())).withRel("by-username"));
            model.add(linkTo(methodOn(UserController.class).deleteUser(userId)).withRel("delete"));

            return ResponseEntity.ok(model);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/username/{username}")
    public ResponseEntity<?> getUserByUsername(@PathVariable String username) {
        try {
            var user = userService.getUserByUsername(username);
            var response = new GetUserResponse(
                    user.getId(),
                    user.getUsername(),
                    user.getFirstName(),
                    user.getLastName(),
                    user.getAge());

            var model = EntityModel.of(response);
            model.add(linkTo(methodOn(UserController.class).getUserByUsername(username)).withSelfRel());
            model.add(linkTo(methodOn(UserController.class).getUserById(user.getId())).withRel("by-id"));

            return ResponseEntity.ok(model);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllUsers() {
        try {
            var users = userService.getAllUsers();
            
            List<EntityModel<GetUserResponse>> response = users.stream()
                    .map(user -> {
                        var dto = new GetUserResponse(
                                user.getId(),
                                user.getUsername(),
                                user.getFirstName(),
                                user.getLastName(),
                                user.getAge());
                        
                        return EntityModel.of(dto,
                                linkTo(methodOn(UserController.class).getUserById(user.getId())).withSelfRel());
                    })
                    .toList();

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}