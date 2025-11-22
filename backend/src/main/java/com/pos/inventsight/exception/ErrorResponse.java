package com.pos.inventsight.exception;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;

/**
 * Standardized error response structure for API error responses.
 * 
 * This class provides a consistent format for all error responses
 * across the application, making it easier for frontend applications
 * to handle errors predictably.
 */
public class ErrorResponse {

    @JsonProperty("status")
    private int status;

    @JsonProperty("error")
    private String error;

    @JsonProperty("message")
    private String message;

    @JsonProperty("details")
    private String details;

    @JsonProperty("path")
    private String path;

    @JsonProperty("timestamp")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS")
    private LocalDateTime timestamp;

    /**
     * Default constructor for JSON serialization
     */
    public ErrorResponse() {
    }

    /**
     * Constructor for creating error responses
     *
     * @param status HTTP status code
     * @param error Error type/category
     * @param details Detailed error message
     * @param path Request path where error occurred
     * @param timestamp When the error occurred
     */
    public ErrorResponse(int status, String error, String details, String path, LocalDateTime timestamp) {
        this.status = status;
        this.error = error;
        this.message = error; // For backward compatibility
        this.details = details;
        this.path = path;
        this.timestamp = timestamp;
    }

    /**
     * Constructor with separate message and details
     *
     * @param status HTTP status code
     * @param error Error type/category
     * @param message Brief error message
     * @param details Detailed error information
     * @param path Request path where error occurred
     * @param timestamp When the error occurred
     */
    public ErrorResponse(int status, String error, String message, String details, String path, LocalDateTime timestamp) {
        this.status = status;
        this.error = error;
        this.message = message;
        this.details = details;
        this.path = path;
        this.timestamp = timestamp;
    }

    // Getters and Setters

    public int getStatus() {
        return status;
    }

    public void setStatus(int status) {
        this.status = status;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    @Override
    public String toString() {
        return "ErrorResponse{" +
                "status=" + status +
                ", error='" + error + '\'' +
                ", message='" + message + '\'' +
                ", details='" + details + '\'' +
                ", path='" + path + '\'' +
                ", timestamp=" + timestamp +
                '}';
    }
}