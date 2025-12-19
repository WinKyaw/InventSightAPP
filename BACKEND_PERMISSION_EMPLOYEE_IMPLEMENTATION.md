# Backend Implementation Guide for Permission and Employee Features

## Overview

The frontend has been updated to support:
1. Employee update API with payload validation
2. Permission caching (5-minute cache)
3. Batch permission checking

However, the backend currently doesn't have the corresponding endpoints. This document provides guidance for implementing them.

## Required Backend Endpoints

### 1. Employee Endpoints

The frontend expects these endpoints (already partially defined in `API_ENDPOINTS.EMPLOYEES`):

#### GET /api/employees
Returns all employees.

#### GET /api/employees/{id}
Returns a specific employee by ID.

#### PUT /api/employees/{id}
Updates an employee with the provided fields.

**Expected Request Body:**
```json
{
  "firstName": "string",
  "lastName": "string",
  "phone": "string",
  "hourlyRate": number,
  "title": "string",
  "startDate": "string (ISO date)",
  "status": "string",
  "bonus": number
}
```

All fields are optional. Only provided fields will be updated.

**Expected Response:**
```json
{
  "id": number,
  "firstName": "string",
  "lastName": "string",
  "phone": "string",
  "hourlyRate": number,
  "title": "string",
  "startDate": "string",
  "status": "string",
  "bonus": number,
  "checkInTime": "string",
  "totalCompensation": number,
  "expanded": false
}
```

### 2. Permission Endpoints

#### GET /api/permissions/check?type={permissionType}
Check if the authenticated user has a specific permission.

**Query Parameters:**
- `type`: Permission type (e.g., 'ADD_ITEM', 'EDIT_ITEM', 'DELETE_ITEM')

**Expected Response:**
```json
{
  "hasPermission": boolean
}
```

#### POST /api/permissions/check-batch
Check multiple permissions at once (recommended for performance).

**Request Body:**
```json
{
  "permissions": ["ADD_ITEM", "EDIT_ITEM", "DELETE_ITEM"]
}
```

**Expected Response:**
```json
{
  "ADD_ITEM": boolean,
  "EDIT_ITEM": boolean,
  "DELETE_ITEM": boolean
}
```

## Implementation Example (Spring Boot)

### PermissionController.java

```java
package com.pos.inventsight.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/permissions")
public class PermissionController {

    @Autowired
    private PermissionService permissionService;

    @Autowired
    private UserService userService;

    /**
     * GET /api/permissions/check - Check single permission
     */
    @GetMapping("/check")
    public ResponseEntity<?> checkPermission(
        @RequestParam String type,
        Authentication authentication
    ) {
        try {
            String username = authentication.getName();
            User user = userService.getUserByUsername(username);
            
            boolean hasPermission = permissionService.checkPermission(
                user.getId(), 
                type
            );
            
            Map<String, Boolean> response = new HashMap<>();
            response.put("hasPermission", hasPermission);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(new ApiResponse(false, "Error checking permission: " + e.getMessage()));
        }
    }

    /**
     * POST /api/permissions/check-batch - Check multiple permissions at once
     */
    @PostMapping("/check-batch")
    public ResponseEntity<?> checkPermissionsBatch(
        @RequestBody BatchPermissionRequest request,
        Authentication authentication
    ) {
        try {
            String username = authentication.getName();
            User user = userService.getUserByUsername(username);
            
            Map<String, Boolean> results = new HashMap<>();
            
            for (String permissionType : request.getPermissions()) {
                boolean hasPermission = permissionService.checkPermission(
                    user.getId(), 
                    permissionType
                );
                results.put(permissionType, hasPermission);
            }
            
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(new ApiResponse(false, "Error checking permissions: " + e.getMessage()));
        }
    }

    public static class BatchPermissionRequest {
        private List<String> permissions;
        
        public List<String> getPermissions() { return permissions; }
        public void setPermissions(List<String> permissions) { this.permissions = permissions; }
    }
}
```

### PermissionService.java

```java
package com.pos.inventsight.service;

import org.springframework.stereotype.Service;

@Service
public class PermissionService {
    
    /**
     * Check if user has a specific permission
     * 
     * @param userId User ID
     * @param permissionType Permission type (e.g., 'ADD_ITEM', 'EDIT_ITEM')
     * @return true if user has permission, false otherwise
     */
    public boolean checkPermission(Long userId, String permissionType) {
        // TODO: Implement your permission logic here
        // This is a placeholder that always returns true for now
        
        // Example implementation:
        // 1. Get user's role
        // 2. Check if role has this permission
        // 3. Check for temporary permissions
        // 4. Return result
        
        return true; // Placeholder
    }
}
```

### EmployeeController.java

```java
package com.pos.inventsight.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

    @Autowired
    private EmployeeService employeeService;

    /**
     * GET /api/employees - Get all employees
     */
    @GetMapping
    public ResponseEntity<List<Employee>> getAllEmployees() {
        List<Employee> employees = employeeService.findAll();
        return ResponseEntity.ok(employees);
    }

    /**
     * GET /api/employees/{id} - Get employee by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Employee> getEmployeeById(@PathVariable Long id) {
        Employee employee = employeeService.findById(id);
        return ResponseEntity.ok(employee);
    }

    /**
     * PUT /api/employees/{id} - Update employee
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateEmployee(
        @PathVariable Long id,
        @RequestBody UpdateEmployeeRequest request
    ) {
        try {
            Employee updated = employeeService.updateEmployee(id, request);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, "Failed to update employee: " + e.getMessage()));
        }
    }

    public static class UpdateEmployeeRequest {
        private String firstName;
        private String lastName;
        private String phone;
        private Double hourlyRate;
        private String title;
        private String startDate;
        private String status;
        private Double bonus;
        
        // Getters and setters...
    }
}
```

## Rate Limiting Configuration (Optional)

If you want to implement rate limiting to prevent abuse, you can use Spring's `@RateLimit` annotation or implement a custom filter.

### Example: Increase Rate Limits for Authenticated Users

```java
package com.pos.inventsight.filter;

import org.springframework.stereotype.Component;
import javax.servlet.*;
import javax.servlet.http.*;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;

@Component
public class RateLimitingFilter implements Filter {
    
    // Increase limits for authenticated users
    private static final int AUTHENTICATED_REQUESTS_PER_MINUTE = 300; // Up from 100
    private static final int UNAUTHENTICATED_REQUESTS_PER_MINUTE = 20;
    
    // Whitelist permission checks (they're cached on frontend anyway)
    private static final List<String> RATE_LIMIT_EXEMPT_PATHS = Arrays.asList(
        "/api/permissions/check-batch"  // Batch endpoint exempt from individual limits
    );
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) 
            throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        String path = httpRequest.getRequestURI();
        
        // Skip rate limiting for exempt paths
        if (RATE_LIMIT_EXEMPT_PATHS.stream().anyMatch(path::startsWith)) {
            chain.doFilter(request, response);
            return;
        }
        
        // ... existing rate limiting logic
        chain.doFilter(request, response);
    }
}
```

## Testing the Implementation

Once the backend endpoints are implemented, test them with:

1. **Single Permission Check:**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://localhost:8080/api/permissions/check?type=ADD_ITEM
   ```

2. **Batch Permission Check:**
   ```bash
   curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"permissions": ["ADD_ITEM", "EDIT_ITEM", "DELETE_ITEM"]}' \
        http://localhost:8080/api/permissions/check-batch
   ```

3. **Employee Update:**
   ```bash
   curl -X PUT -H "Authorization: Bearer YOUR_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"firstName": "John", "lastName": "Doe"}' \
        http://localhost:8080/api/employees/1
   ```

## Frontend Integration

The frontend is already configured to use these endpoints:
- `PermissionService.checkPermission()` - calls `/api/permissions/check`
- `PermissionService.checkPermissions()` - calls `/api/permissions/check-batch`
- `EmployeeService.updateEmployee()` - calls `/api/employees/{id}`

Once you implement the backend endpoints, the frontend will automatically work with them.
