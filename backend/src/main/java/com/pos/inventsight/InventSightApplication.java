package com.pos.inventsight;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main Spring Boot application class for InventSight POS Backend
 * 
 * This application includes global exception handling with comprehensive
 * logging for database constraint violations and SQL errors.
 */
@SpringBootApplication
public class InventSightApplication {

    public static void main(String[] args) {
        SpringApplication.run(InventSightApplication.class, args);
    }
}