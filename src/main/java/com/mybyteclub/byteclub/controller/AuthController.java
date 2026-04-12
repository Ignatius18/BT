package com.mybyteclub.byteclub.controller;

import com.mybyteclub.byteclub.model.User;
import com.mybyteclub.byteclub.service.AuthService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegistrationRequest request) {
        try {
            User user = authService.register(request.getUsername(), request.getEmail(), request.getPassword());
            return ResponseEntity.ok(new AuthResponse(user.getUsername(), user.getEmail(), "Регистрация прошла успешно"));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ErrorResponse(exception.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request, HttpSession session) {
        try {
            User user = authService.authenticate(request.getUsername(), request.getPassword());
            session.setAttribute("userId", user.getId());
            session.setAttribute("username", user.getUsername());
            return ResponseEntity.ok(new AuthResponse(user.getUsername(), user.getEmail(), "Вход выполнен"));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ErrorResponse(exception.getMessage()));
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<?> profile(HttpSession session) {
        Object username = session.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponse("Пользователь не авторизован"));
        }
        return ResponseEntity.ok(new AuthResponse(username.toString(), null, "Пользователь авторизован"));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok(new AuthResponse(null, null, "Вы успешно вышли"));
    }

    public static class RegistrationRequest {
        private String username;
        private String email;
        private String password;

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }

    public static class LoginRequest {
        private String username;
        private String password;

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }

    public static class AuthResponse {
        private final String username;
        private final String email;
        private final String message;

        public AuthResponse(String username, String email, String message) {
            this.username = username;
            this.email = email;
            this.message = message;
        }

        public String getUsername() {
            return username;
        }

        public String getEmail() {
            return email;
        }

        public String getMessage() {
            return message;
        }
    }

    public static class ErrorResponse {
        private final String error;

        public ErrorResponse(String error) {
            this.error = error;
        }

        public String getError() {
            return error;
        }
    }
}
