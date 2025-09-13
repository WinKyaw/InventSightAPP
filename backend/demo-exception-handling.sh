#!/bin/bash

# Demo script to test exception handling in InventSight Backend
# This script demonstrates various database constraint violations

echo "InventSight Backend Exception Handling Demo"
echo "==========================================="

# Check if Spring Boot app is running
if ! curl -s http://localhost:8080/actuator/health > /dev/null; then
    echo "❌ Spring Boot application is not running on localhost:8080"
    echo "Please start the application first:"
    echo "  cd backend && mvn spring-boot:run"
    exit 1
fi

echo "✅ Spring Boot application is running"
echo ""

# Test 1: Create a valid product
echo "🧪 Test 1: Creating a valid product..."
VALID_RESPONSE=$(curl -s -X POST http://localhost:8080/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Demo Product",
    "sku": "DEMO001",
    "barcode": "123456789",
    "price": 19.99,
    "stockQuantity": 10
  }')

if echo "$VALID_RESPONSE" | grep -q '"id"'; then
    echo "✅ Valid product created successfully"
    PRODUCT_ID=$(echo "$VALID_RESPONSE" | grep -o '"id":[0-9]*' | cut -d':' -f2)
    echo "   Product ID: $PRODUCT_ID"
else
    echo "❌ Failed to create valid product"
    echo "   Response: $VALID_RESPONSE"
fi
echo ""

# Test 2: Unique constraint violation (duplicate SKU)
echo "🧪 Test 2: Testing unique constraint violation (duplicate SKU)..."
DUPLICATE_RESPONSE=$(curl -s -X POST http://localhost:8080/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Duplicate SKU Product",
    "sku": "DEMO001",
    "barcode": "987654321",
    "price": 29.99,
    "stockQuantity": 5
  }')

if echo "$DUPLICATE_RESPONSE" | grep -q '"status":409'; then
    echo "✅ Unique constraint violation handled correctly"
    echo "   Error: $(echo "$DUPLICATE_RESPONSE" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)"
else
    echo "❌ Unique constraint violation not handled as expected"
    echo "   Response: $DUPLICATE_RESPONSE"
fi
echo ""

# Test 3: Not-null constraint violation
echo "🧪 Test 3: Testing not-null constraint violation..."
NULL_RESPONSE=$(curl -s -X POST http://localhost:8080/api/products/test-constraint-violation)

if echo "$NULL_RESPONSE" | grep -q '"status":409'; then
    echo "✅ Not-null constraint violation handled correctly"
    echo "   Error: $(echo "$NULL_RESPONSE" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)"
else
    echo "❌ Not-null constraint violation not handled as expected"
    echo "   Response: $NULL_RESPONSE"
fi
echo ""

# Test 4: Validation constraint violation
echo "🧪 Test 4: Testing validation constraint violation..."
VALIDATION_RESPONSE=$(curl -s -X POST http://localhost:8080/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "",
    "sku": "INVALID",
    "price": -10.00,
    "stockQuantity": -5
  }')

if echo "$VALIDATION_RESPONSE" | grep -q '"status":400'; then
    echo "✅ Validation constraint violation handled correctly"
    echo "   Error: $(echo "$VALIDATION_RESPONSE" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)"
else
    echo "❌ Validation constraint violation not handled as expected"
    echo "   Response: $VALIDATION_RESPONSE"
fi
echo ""

# Test 5: Get all products to verify state
echo "🧪 Test 5: Listing all products..."
ALL_PRODUCTS=$(curl -s http://localhost:8080/api/products)
PRODUCT_COUNT=$(echo "$ALL_PRODUCTS" | grep -o '"id":' | wc -l)
echo "✅ Total products in database: $PRODUCT_COUNT"
echo ""

# Test 6: Check H2 console accessibility
echo "🧪 Test 6: Checking H2 console accessibility..."
if curl -s http://localhost:8080/h2-console > /dev/null; then
    echo "✅ H2 console is accessible at http://localhost:8080/h2-console"
    echo "   JDBC URL: jdbc:h2:mem:inventsight"
    echo "   Username: sa"
    echo "   Password: password"
else
    echo "❌ H2 console is not accessible"
fi
echo ""

# Test 7: Check actuator endpoints
echo "🧪 Test 7: Checking actuator health endpoint..."
HEALTH_RESPONSE=$(curl -s http://localhost:8080/actuator/health)
if echo "$HEALTH_RESPONSE" | grep -q '"status":"UP"'; then
    echo "✅ Application health check passed"
else
    echo "❌ Application health check failed"
    echo "   Response: $HEALTH_RESPONSE"
fi
echo ""

echo "🎉 Demo completed!"
echo ""
echo "💡 Tips for further testing:"
echo "   - Check logs/inventsight.log for detailed SQL and exception logs"
echo "   - Visit http://localhost:8080/h2-console to inspect database"
echo "   - Try the endpoints manually with curl or Postman"
echo "   - Monitor the console output for detailed exception traces"
echo ""
echo "📋 Available test endpoints:"
echo "   GET  /api/products                         - List all products"
echo "   POST /api/products                         - Create product (test constraints)"
echo "   POST /api/products/test-constraint-violation - Force not-null violations"
echo "   POST /api/products/test-fk-violation       - Force foreign key violations"
echo "   GET  /actuator/health                      - Health check"
echo "   GET  /h2-console                          - Database console"