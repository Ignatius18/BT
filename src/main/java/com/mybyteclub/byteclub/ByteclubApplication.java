package com.mybyteclub.byteclub;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import com.mybyteclub.byteclub.model.User;
import com.mybyteclub.byteclub.repository.UserRepository;

@SpringBootApplication
public class ByteclubApplication {

	public static void main(String[] args) {
		SpringApplication.run(ByteclubApplication.class, args);
	}

	@Bean
	public CommandLineRunner createDefaultAdmin(UserRepository userRepository) {
		return args -> {
			String adminUsername = "admin";
			String adminEmail = "admin@example.com";
			String adminPassword = "admin123";

			if (!userRepository.existsByUsername(adminUsername)) {
				BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
				String encoded = encoder.encode(adminPassword);
				User admin = new User(adminUsername, adminEmail, encoded);
				userRepository.save(admin);
				System.out.println("[startup] Created default admin user: 'admin' (password: admin123)");
			}
		};
	}
}
