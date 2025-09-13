package com.pos.inventsight.exception;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.context.request.WebRequest;

import jakarta.validation.ConstraintViolationException;
import java.sql.SQLException;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Test class for GlobalExceptionHandler to ensure proper exception handling
 * and error response generation.
 */
@SpringBootTest
public class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler exceptionHandler = new GlobalExceptionHandler();

    @Test
    public void testHandleDataIntegrityViolationException() {
        // Arrange
        WebRequest request = mock(WebRequest.class);
        when(request.getDescription(false)).thenReturn("uri=/api/products");
        
        SQLException sqlException = new SQLException("Unique constraint violation", "23505", 23505);
        DataIntegrityViolationException exception = new DataIntegrityViolationException("Duplicate key", sqlException);

        // Act
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleDataIntegrityViolation(exception, request);

        // Assert
        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertNotNull(response.getBody());
        
        ErrorResponse errorResponse = response.getBody();
        assertEquals(409, errorResponse.getStatus());
        assertEquals("Database constraint violation", errorResponse.getError());
        assertTrue(errorResponse.getDetails().contains("SQL Error"));
        assertTrue(errorResponse.getDetails().contains("23505"));
        assertEquals("uri=/api/products", errorResponse.getPath());
        assertNotNull(errorResponse.getTimestamp());
    }

    @Test
    public void testHandleSQLException() {
        // Arrange
        WebRequest request = mock(WebRequest.class);
        when(request.getDescription(false)).thenReturn("uri=/api/products");
        
        SQLException exception = new SQLException("Foreign key constraint violation", "23503", 23503);

        // Act
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleSQLException(exception, request);

        // Assert
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        
        ErrorResponse errorResponse = response.getBody();
        assertEquals(500, errorResponse.getStatus());
        assertEquals("Database error occurred", errorResponse.getError());
        assertTrue(errorResponse.getDetails().contains("Foreign key constraint violation"));
        assertTrue(errorResponse.getDetails().contains("23503"));
        assertEquals("uri=/api/products", errorResponse.getPath());
        assertNotNull(errorResponse.getTimestamp());
    }

    @Test
    public void testHandleIllegalArgumentException() {
        // Arrange
        WebRequest request = mock(WebRequest.class);
        when(request.getDescription(false)).thenReturn("uri=/api/products");
        
        IllegalArgumentException exception = new IllegalArgumentException("Invalid product ID");

        // Act
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleIllegalArgument(exception, request);

        // Assert
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        
        ErrorResponse errorResponse = response.getBody();
        assertEquals(400, errorResponse.getStatus());
        assertEquals("Invalid argument provided", errorResponse.getError());
        assertEquals("Invalid product ID", errorResponse.getDetails());
        assertEquals("uri=/api/products", errorResponse.getPath());
        assertNotNull(errorResponse.getTimestamp());
    }

    @Test
    public void testHandleRuntimeException() {
        // Arrange
        WebRequest request = mock(WebRequest.class);
        when(request.getDescription(false)).thenReturn("uri=/api/products");
        
        RuntimeException exception = new RuntimeException("Unexpected error occurred");

        // Act
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleRuntimeException(exception, request);

        // Assert
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        
        ErrorResponse errorResponse = response.getBody();
        assertEquals(500, errorResponse.getStatus());
        assertEquals("An unexpected error occurred", errorResponse.getError());
        assertEquals("Unexpected error occurred", errorResponse.getDetails());
        assertEquals("uri=/api/products", errorResponse.getPath());
        assertNotNull(errorResponse.getTimestamp());
    }

    @Test
    public void testHandleGenericException() {
        // Arrange
        WebRequest request = mock(WebRequest.class);
        when(request.getDescription(false)).thenReturn("uri=/api/products");
        
        Exception exception = new Exception("Generic error");

        // Act
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleGenericException(exception, request);

        // Assert
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        
        ErrorResponse errorResponse = response.getBody();
        assertEquals(500, errorResponse.getStatus());
        assertEquals("An unexpected error occurred", errorResponse.getError());
        assertEquals("Generic error", errorResponse.getDetails());
        assertEquals("uri=/api/products", errorResponse.getPath());
        assertNotNull(errorResponse.getTimestamp());
    }

    @Test
    public void testErrorResponseStructure() {
        // Test ErrorResponse creation and getters/setters
        LocalDateTime now = LocalDateTime.now();
        ErrorResponse errorResponse = new ErrorResponse(
            400, 
            "Validation Error", 
            "Invalid input provided", 
            "uri=/api/test", 
            now
        );

        assertEquals(400, errorResponse.getStatus());
        assertEquals("Validation Error", errorResponse.getError());
        assertEquals("Validation Error", errorResponse.getMessage()); // Should be same as error for backward compatibility
        assertEquals("Invalid input provided", errorResponse.getDetails());
        assertEquals("uri=/api/test", errorResponse.getPath());
        assertEquals(now, errorResponse.getTimestamp());
    }
}