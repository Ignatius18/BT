package com.mybyteclub.byteclub.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mybyteclub.byteclub.model.User;
import com.mybyteclub.byteclub.service.AuthService;

import jakarta.servlet.http.HttpSession;

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
            User user = authService.register(request.getUsername(), request.getEmail(), request.getPassword(), request.getRecoveryKeyword());
            boolean isAdmin = "admin".equalsIgnoreCase(user.getUsername());
            return ResponseEntity.ok(new AuthResponse(user.getId(), user.getUsername(), user.getEmail(), isAdmin, "Регистрация прошла успешно"));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ErrorResponse(exception.getMessage()));
        }
    }

    @PostMapping("/restore")
    public ResponseEntity<?> restore(@RequestBody RestoreRequest request) {
        try {
            authService.recoverPassword(request.getUsernameOrEmail(), request.getRecoveryKeyword(), request.getNewPassword());
            return ResponseEntity.ok(new SuccessResponse("Пароль успешно восстановлен. Войдите с новым паролем."));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ErrorResponse(exception.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request, HttpSession session) {
        try {
            User user = authService.authenticate(request.getUsername(), request.getPassword());
            session.setAttribute("user", user);
            boolean isAdmin = "admin".equalsIgnoreCase(user.getUsername());
            return ResponseEntity.ok(new AuthResponse(user.getId(), user.getUsername(), user.getEmail(), isAdmin, "Вход выполнен успешно"));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ErrorResponse(exception.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        if (session != null) {
            session.invalidate();
        }
        return ResponseEntity.ok(new SuccessResponse("Вышли из системы и очистили сессию"));
    }

   @GetMapping("/profile")
   public ResponseEntity<?> getProfile(HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponse("Пользователь не авторизован"));
        }
        boolean isAdmin = "admin".equalsIgnoreCase(user.getUsername());
        return ResponseEntity.ok(new AuthResponse(user.getId(), user.getUsername(), user.getEmail(), isAdmin, null));
   }

    public static class RegistrationRequest {
        private String username;
        private String email;
        private String password;
        private String recoveryKeyword;
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        public String getRecoveryKeyword() { return recoveryKeyword; }
        public void setRecoveryKeyword(String recoveryKeyword) { this.recoveryKeyword = recoveryKeyword; }
    }

    public static class LoginRequest {
        private String username;
        private String password;
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class RestoreRequest {
        private String usernameOrEmail;
        private String recoveryKeyword;
        private String newPassword;
        public String getUsernameOrEmail() { return usernameOrEmail; }
        public void setUsernameOrEmail(String usernameOrEmail) { this.usernameOrEmail = usernameOrEmail; }
        public String getRecoveryKeyword() { return recoveryKeyword; }
        public void setRecoveryKeyword(String recoveryKeyword) { this.recoveryKeyword = recoveryKeyword; }
        public String getNewPassword() { return newPassword; }
        public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
    }

    public static class AuthResponse {
        private final Long id;
        private final String username;
        private final String email;
        private final boolean admin;
        private final String message;

        public AuthResponse(Long id, String username, String email, boolean admin, String message) {
            this.id = id;
            this.username = username;
            this.email = email;
            this.admin = admin;
            this.message = message;
        }

        public Long getId() { return id; }
        public String getUsername() { return username; }
        public String getEmail() { return email; }
        public boolean isAdmin() { return admin; }
        public String getMessage() { return message; }
    }

    public static class ErrorResponse {
        private final String error;
        public ErrorResponse(String error) { this.error = error; }
        public String getError() { return error; }
    }

    public static class SuccessResponse {
        private final String message;
        public SuccessResponse(String message) { this.message = message; }
        public String getMessage() { return message; }
    }
}
