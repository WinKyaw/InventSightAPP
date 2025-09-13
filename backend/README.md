# InventSight Backend

This is the Spring Boot backend for the InventSight POS application, featuring comprehensive exception handling and logging for database operations.

## Features

### Global Exception Handler
- **Location**: `com.pos.inventsight.exception.GlobalExceptionHandler`
- **Purpose**: Logs full stack traces for all exceptions and provides structured error responses
- **Coverage**: Database constraint violations, SQL errors, validation errors, and general exceptions

### Error Response Structure
- **Location**: `com.pos.inventsight.exception.ErrorResponse`
- **Purpose**: Standardized JSON error response format for API consumers
- **Fields**: status, error, message, details, path, timestamp

### Comprehensive Logging Configuration
- **SQL Logging**: All SQL statements, parameters, and execution details
- **Exception Logging**: Full stack traces for all exceptions
- **Database Logging**: Connection pool, transactions, and constraint violations
- **Debug Mode**: Root logger set to DEBUG level for comprehensive visibility

## Database Support

### H2 Database (Development)
```properties
spring.datasource.url=jdbc:h2:mem:inventsight
spring.h2.console.enabled=true
spring.h2.console.path=/h2-console
```

### PostgreSQL (Production)
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/inventsight
spring.datasource.driverClassName=org.postgresql.Driver
```

## Running the Application

### Prerequisites
- Java 17 or later
- Maven 3.6 or later

### Development Mode
```bash
cd backend
mvn spring-boot:run
```

### Production Build
```bash
cd backend
mvn clean package
java -jar target/inventsight-backend-1.0.0.jar
```

## Debugging Database Issues

The application is configured to provide maximum visibility into database operations:

### SQL Logging
- All SQL statements are logged with formatting
- SQL parameters are logged at TRACE level
- Query execution plans are visible

### Constraint Violation Debugging
- Unique constraint violations are logged with full details
- Foreign key constraint errors include referenced table information
- Not-null constraint violations show affected columns
- SQL error codes and states are logged for detailed diagnosis

### Log Files
- Console output with colored formatting
- File logging to `logs/inventsight.log`
- Rolling file appender with 30-day retention

## Exception Handling Examples

### Database Constraint Violations
```json
{
  "status": 409,
  "error": "Database constraint violation",
  "details": "SQL Error: duplicate key value violates unique constraint (Code: 23505, State: 23505)",
  "path": "uri=/api/products",
  "timestamp": "2024-01-15T10:30:45.123"
}
```

### Validation Errors
```json
{
  "status": 400,
  "error": "Validation failed",
  "details": "name: must not be blank; price: must be greater than 0;",
  "path": "uri=/api/products",
  "timestamp": "2024-01-15T10:30:45.123"
}
```

## Configuration

### Key Configuration Properties
- `logging.level.root=DEBUG` - Enable debug logging
- `spring.jpa.show-sql=true` - Show SQL statements
- `server.error.include-stacktrace=always` - Include full stack traces
- `management.endpoints.web.exposure.include=*` - Enable actuator endpoints

### CORS Configuration
Configured to allow React Native frontend connections:
```properties
spring.web.cors.allowed-origins=*
spring.web.cors.allowed-methods=GET,POST,PUT,DELETE,OPTIONS
```

## Monitoring and Health Checks

Spring Boot Actuator endpoints are enabled for monitoring:
- `/actuator/health` - Application health status
- `/actuator/loggers` - Dynamic log level management
- `/actuator/metrics` - Application metrics

## Development Notes

- The global exception handler ensures all database errors are captured and logged
- Error responses follow a consistent structure for easy frontend handling
- SQL logging includes parameter binding for complete request tracing
- Connection pool monitoring helps identify database performance issues

This backend is designed to work seamlessly with the React Native frontend in the parent directory, providing robust error handling and comprehensive logging for debugging database constraint violations and other issues.