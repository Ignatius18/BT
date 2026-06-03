package com.mybyteclub.byteclub.service;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.mybyteclub.byteclub.model.User;
import com.mybyteclub.byteclub.repository.UserRepository;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    private static final String PASSWORD_PATTERN =
            "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-={}\\[\\]:;\"'<>?,./]).{8,}$";

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    public User register(String username, String email, String rawPassword, String recoveryKeyword) {

        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("Имя пользователя не может быть пустым");
        }

        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email не может быть пустым");
        }

        if (rawPassword == null || rawPassword.isBlank()) {
            throw new IllegalArgumentException("Пароль не может быть пустым");
        }

        if (recoveryKeyword == null || recoveryKeyword.isBlank()) {
            throw new IllegalArgumentException("Ключевое слово для восстановления не может быть пустым");
        }

        if (!isPasswordValid(rawPassword)) {
            throw new IllegalArgumentException(
                    "Пароль должен содержать минимум 8 символов, заглавные и строчные буквы, цифру и спецсимвол"
            );
        }

        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Пользователь с таким именем уже существует");
        }

        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Пользователь с таким email уже существует");
        }

        String encodedPassword = passwordEncoder.encode(rawPassword);
        String encodedRecoveryKeyword = passwordEncoder.encode(recoveryKeyword.trim());

        User user = new User(username.trim(), email.trim(), encodedPassword, encodedRecoveryKeyword);
        return userRepository.save(user);
    }

    public User recoverPassword(String usernameOrEmail, String recoveryKeyword, String newPassword) {
        if (usernameOrEmail == null || usernameOrEmail.isBlank()) {
            throw new IllegalArgumentException("Логин или email не может быть пустым");
        }

        if (recoveryKeyword == null || recoveryKeyword.isBlank()) {
            throw new IllegalArgumentException("Ключевое слово для восстановления не может быть пустым");
        }

        if (newPassword == null || newPassword.isBlank()) {
            throw new IllegalArgumentException("Новый пароль не может быть пустым");
        }

        if (!isPasswordValid(newPassword)) {
            throw new IllegalArgumentException(
                    "Пароль должен содержать минимум 8 символов, заглавные и строчные буквы, цифру и спецсимвол"
            );
        }

        User user = userRepository.findByUsernameOrEmail(usernameOrEmail, usernameOrEmail)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));

        if (user.getRecoveryKeywordHash() == null || !passwordEncoder.matches(recoveryKeyword, user.getRecoveryKeywordHash())) {
            throw new IllegalArgumentException("Неверное ключевое слово для восстановления");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        return userRepository.save(user);
    }

    public User authenticate(String username, String rawPassword) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Неверное имя пользователя или пароль"));

        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new IllegalArgumentException("Неверное имя пользователя или пароль");
        }

        return user;
    }

    private boolean isPasswordValid(String password) {
        return password != null && password.matches(PASSWORD_PATTERN);
    }
}
