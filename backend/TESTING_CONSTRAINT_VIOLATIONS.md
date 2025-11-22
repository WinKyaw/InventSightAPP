# Testing Database Constraint Violations

This document provides examples of how to test the global exception handler with database constraint violations.

## Testing Endpoints

The backend includes test endpoints specifically designed to trigger various database constraint violations:

### 1. Test Constraint Violation Endpoint
```
POST /api/products/test-constraint-violation
```

This endpoint creates a product with null required fields to trigger not-null constraint violations.

**Example Request:**
```bash
curl -X POST http://localhost:8080/api/products/test-constraint-violation \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "status": 409,
  "error": "Database constraint violation",
  "details": "SQL Error: NULL not allowed for column \"NAME\" (Code: 23502, State: 23502)",
  "path": "uri=/api/products/test-constraint-violation",
  "timestamp": "2024-01-15T10:30:45.123"
}
```

### 2. Unique Constraint Violation Test
```
POST /api/products
```

Create products with duplicate SKU or barcode values.

**Example Request - First Product:**
```bash
curl -X POST http://localhost:8080/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "sku": "TEST001",
    "barcode": "123456789",
    "price": 19.99,
    "stockQuantity": 10
  }'
```

**Example Request - Duplicate SKU:**
```bash
curl -X POST http://localhost:8080/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Another Product",
    "sku": "TEST001",
    "barcode": "987654321",
    "price": 29.99,
    "stockQuantity": 5
  }'
```

**Expected Response for Duplicate:**
```json
{
  "status": 409,
  "error": "Database constraint violation",
  "details": "SQL Error: Unique index or primary key violation (Code: 23505, State: 23505)",
  "path": "uri=/api/products",
  "timestamp": "2024-01-15T10:31:45.123"
}
```

### 3. Validation Constraint Test
```
POST /api/products
```

Send invalid data to trigger validation constraints.

**Example Request - Invalid Price:**
```bash
curl -X POST http://localhost:8080/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "",
    "sku": "INVALID",
    "price": -10.00,
    "stockQuantity": -5
  }'
```

**Expected Response:**
```json
{
  "status": 400,
  "error": "Validation failed",
  "details": "name: must not be blank; price: must be greater than 0;",
  "path": "uri=/api/products",
  "timestamp": "2024-01-15T10:32:45.123"
}
```

### 4. Foreign Key Constraint Test
```
POST /api/products/test-fk-violation
```

This endpoint sets a non-existent category ID to trigger FK constraint violations.

**Example Request:**
```bash
curl -X POST http://localhost:8080/api/products/test-fk-violation \
  -H "Content-Type: application/json" \
  -d '{
    "name": "FK Test Product",
    "sku": "FK001",
    "price": 15.99,
    "stockQuantity": 3
  }'
```

**Expected Response:**
```json
{
  "status": 409,
  "error": "Database constraint violation",
  "details": "SQL Error: Referential integrity constraint violation (Code: 23503, State: 23503)",
  "path": "uri=/api/products/test-fk-violation",
  "timestamp": "2024-01-15T10:33:45.123"
}
```

## Log Output Examples

When these constraint violations occur, you'll see detailed logging in the console and log files:

### Console Output for Unique Constraint Violation:
```
2024-01-15 10:31:45.123 ERROR 1234 --- [nio-8080-exec-1] c.p.i.e.GlobalExceptionHandler          : Database constraint violation occurred

org.springframework.dao.DataIntegrityViolationException: could not execute statement; SQL [insert into products (barcode,category_id,created_at,description,name,price,sku,stock_quantity,updated_at) values (?,?,?,?,?,?,?,?,?)]; constraint [UK_PRODUCT_SKU]
	at org.hibernate.exception.ConstraintViolationException.<init>(ConstraintViolationException.java:81)
	at org.hibernate.exception.internal.SQLExceptionTypeDelegate.convert(SQLExceptionTypeDelegate.java:59)
	...

2024-01-15 10:31:45.124 ERROR 1234 --- [nio-8080-exec-1] c.p.i.e.GlobalExceptionHandler          : SQL Error Code: 23505, SQL State: 23505
```

### Console Output for Validation Errors:
```
2024-01-15 10:32:45.123 ERROR 1234 --- [nio-8080-exec-2] c.p.i.e.GlobalExceptionHandler          : Constraint validation violation occurred

jakarta.validation.ConstraintViolationException: Validation failed for classes [com.pos.inventsight.entity.Product] during persist time for groups [jakarta.validation.groups.Default, ]
List of constraint violations:[
	ConstraintViolationImpl{interpolatedMessage='must not be blank', propertyPath=name, rootBeanClass=class com.pos.inventsight.entity.Product, messageTemplate='{jakarta.validation.constraints.NotBlank.message}'}
	ConstraintViolationImpl{interpolatedMessage='must be greater than 0', propertyPath=price, rootBeanClass=class com.pos.inventsight.entity.Product, messageTemplate='{jakarta.validation.constraints.Positive.message}'}
]
```

## H2 Console for Manual Testing

The application includes H2 console for manual database inspection:

1. Access: `http://localhost:8080/h2-console`
2. JDBC URL: `jdbc:h2:mem:inventsight`
3. Username: `sa`
4. Password: `password`

You can manually inspect the database structure and constraints:

```sql
-- View product table structure
SHOW CREATE TABLE products;

-- View existing constraints
SELECT * FROM INFORMATION_SCHEMA.CONSTRAINTS 
WHERE TABLE_NAME = 'PRODUCTS';

-- Manually trigger constraint violations
INSERT INTO products (name, sku, price, stock_quantity, created_at, updated_at) 
VALUES ('Test', 'DUPLICATE_SKU', 10.00, 5, NOW(), NOW());

-- Try to insert duplicate SKU (will fail)
INSERT INTO products (name, sku, price, stock_quantity, created_at, updated_at) 
VALUES ('Test2', 'DUPLICATE_SKU', 15.00, 3, NOW(), NOW());
```

## Running Integration Tests

Use Maven to run all tests including integration tests:

```bash
cd backend
mvn test

# Run specific test class
mvn test -Dtest=GlobalExceptionHandlerTest

# Run with debug logging
mvn test -Dlogging.level.com.pos.inventsight=DEBUG
```

## Expected Log Levels

The application is configured with comprehensive logging:

- `DEBUG`: All application logs, SQL statements, parameter binding
- `TRACE`: Hibernate type handling, parameter values
- `ERROR`: All exceptions with full stack traces

This ensures maximum visibility into database constraint violations and makes debugging much easier.