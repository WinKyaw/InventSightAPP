package com.pos.inventsight.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import jakarta.validation.ConstraintViolationException;
import java.sql.SQLException;
import java.time.LocalDateTime;

/**
 * Global exception handler that logs full stack traces for all exceptions
 * and provides structured error responses for API consumers.
 * 
 * This handler ensures database/constraint violations are visible in logs
 * and API responses for easier debugging.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Handles database constraint violations (unique, not-null, foreign key, etc.)
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrityViolation(
            DataIntegrityViolationException ex, WebRequest request) {
        
        logger.error("Database constraint violation occurred", ex);
        
        String message = "Database constraint violation";
        String details = ex.getMessage();
        
        // Extract more specific constraint information if available
        if (ex.getCause() instanceof SQLException) {
            SQLException sqlEx = (SQLException) ex.getCause();
            logger.error("SQL Error Code: {}, SQL State: {}", sqlEx.getErrorCode(), sqlEx.getSQLState());
            details = String.format("SQL Error: %s (Code: %d, State: %s)", 
                sqlEx.getMessage(), sqlEx.getErrorCode(), sqlEx.getSQLState());
        }
        
        ErrorResponse errorResponse = new ErrorResponse(
            HttpStatus.CONFLICT.value(),
            message,
            details,
            request.getDescription(false),
            LocalDateTime.now()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.CONFLICT);
    }

    /**
     * Handles constraint violations from validation annotations
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolation(
            ConstraintViolationException ex, WebRequest request) {
        
        logger.error("Constraint validation violation occurred", ex);
        
        StringBuilder details = new StringBuilder();
        ex.getConstraintViolations().forEach(violation -> {
            details.append(violation.getPropertyPath())
                   .append(": ")
                   .append(violation.getMessage())
                   .append("; ");
        });
        
        ErrorResponse errorResponse = new ErrorResponse(
            HttpStatus.BAD_REQUEST.value(),
            "Validation failed",
            details.toString(),
            request.getDescription(false),
            LocalDateTime.now()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handles SQL exceptions directly
     */
    @ExceptionHandler(SQLException.class)
    public ResponseEntity<ErrorResponse> handleSQLException(
            SQLException ex, WebRequest request) {
        
        logger.error("SQL Exception occurred - Error Code: {}, SQL State: {}", 
            ex.getErrorCode(), ex.getSQLState(), ex);
        
        String details = String.format("SQL Error: %s (Code: %d, State: %s)", 
            ex.getMessage(), ex.getErrorCode(), ex.getSQLState());
        
        ErrorResponse errorResponse = new ErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            "Database error occurred",
            details,
            request.getDescription(false),
            LocalDateTime.now()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    /**
     * Handles illegal argument exceptions
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(
            IllegalArgumentException ex, WebRequest request) {
        
        logger.error("Illegal argument provided", ex);
        
        ErrorResponse errorResponse = new ErrorResponse(
            HttpStatus.BAD_REQUEST.value(),
            "Invalid argument provided",
            ex.getMessage(),
            request.getDescription(false),
            LocalDateTime.now()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handles runtime exceptions
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handleRuntimeException(
            RuntimeException ex, WebRequest request) {
        
        logger.error("Runtime exception occurred", ex);
        
        ErrorResponse errorResponse = new ErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            "An unexpected error occurred",
            ex.getMessage(),
            request.getDescription(false),
            LocalDateTime.now()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    /**
     * Catches all other exceptions not handled by specific handlers
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(
            Exception ex, WebRequest request) {
        
        logger.error("Unhandled exception occurred", ex);
        
        ErrorResponse errorResponse = new ErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            "An unexpected error occurred",
            ex.getMessage(),
            request.getDescription(false),
            LocalDateTime.now()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}