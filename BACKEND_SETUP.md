# Backend Setup Guide for InventSight Mobile App

## Prerequisites

Your InventSight backend server must be running and properly configured for the mobile app to connect.

## Critical: Enable Local Authentication

**⚠️ IMPORTANT**: By default, the InventSight backend's `AuthController` is **DISABLED**. The `/api/auth/login` endpoint will literally not exist unless you explicitly enable it.

### Why This Matters

The backend uses a conditional annotation:
```java
@ConditionalOnProperty(name = "inventsight.security.local-login.enabled", 
                       havingValue = "true", 
                       matchIfMissing = false)
public class AuthController {
    // Login endpoints
}
```

With `matchIfMissing = false`, the entire AuthController (including login, signup endpoints) is **disabled by default**. This is why you see network timeout errors - the endpoint doesn't exist!

## Step 1: Enable Local Authentication in Backend

Edit `src/main/resources/application.yml` in your InventSight backend repository:

```yaml
inventsight:
  security:
    local-login:
      enabled: true  # ✅ REQUIRED for mobile app login
```

**Or** if using `application.properties`:

```properties
inventsight.security.local-login.enabled=true
```

### Verify the Change

After updating the configuration:

1. **Restart the backend server**
2. **Check the logs** for the AuthController being initialized
3. **Test the endpoint**:
   ```bash
   curl -X POST http://localhost:8080/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123"}'
   ```
   
   Expected: HTTP 401 (Unauthorized) or 200 (if credentials valid)
   
   ❌ NOT Expected: Connection refused or 404 Not Found

## Step 2: Configure Backend Server Binding

Ensure your backend binds to all network interfaces, not just localhost:

**In `application.yml`:**
```yaml
server:
  address: 0.0.0.0  # Listen on all interfaces
  port: 8080
```

**Or in `application.properties`:**
```properties
server.address=0.0.0.0
server.port=8080
```

This allows the backend to accept connections from your mobile device on the network.

## Step 3: Enable CORS (Cross-Origin Resource Sharing)

The mobile app needs CORS enabled to make API requests.

**Option A: Global CORS Configuration (Recommended for Development)**

Create or update your CORS configuration class:

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("*")  // Allow all origins in development
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(false);
    }
}
```

**Option B: Controller-Level CORS**

Add to your controllers:

```java
@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api")
public class YourController {
    // Your endpoints
}
```

## Step 4: Start Backend Server

```bash
cd /path/to/InventSight
mvn spring-boot:run
```

Or if using Gradle:

```bash
./gradlew bootRun
```

**Verify server is running:**

```bash
# Check health endpoint
curl http://localhost:8080/actuator/health

# Expected response: {"status":"UP"}
```

## Step 5: Find Your Backend IP Address

The mobile app needs your computer's IP address to connect.

### On Mac:
```bash
# WiFi
ipconfig getifaddr en0

# Ethernet
ipconfig getifaddr en1
```

### On Windows:
```cmd
ipconfig
```
Look for "IPv4 Address" under your active network adapter (WiFi or Ethernet).
Common format: `192.168.x.x` or `10.0.x.x`

### On Linux:
```bash
hostname -I | awk '{print $1}'

# Or
ip addr show | grep "inet " | grep -v 127.0.0.1
```

**Example Output:** `192.168.1.100`

## Step 6: Update Mobile App Configuration

Edit `.env` file in the InventSightAPP repository:

```bash
cp .env.example .env
```

Update the file with your backend IP:

```env
# Replace with YOUR machine's IP address from Step 5
API_BASE_URL=http://192.168.1.100:8080

# Timeout (30 seconds recommended)
API_TIMEOUT=30000
```

## Step 7: Verify Connectivity

### Test 1: Local Access
```bash
curl http://localhost:8080/api/auth/login
```
Expected: HTTP 405 (Method Not Allowed) or 400 (Bad Request)
❌ NOT: Connection refused

### Test 2: Network Access
```bash
# Replace with your IP from Step 5
curl http://192.168.1.100:8080/api/auth/login
```
Expected: Same as Test 1

### Test 3: Login Endpoint
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```
Expected: JSON response (even if error)

## Troubleshooting

### Error: "Network Error - No response received"

**Symptom:** Mobile app shows timeout after 10-30 seconds

**Causes:**
1. ✅ **Backend not running** - Start the backend server
2. ✅ **local-login not enabled** - Check `application.yml` has `inventsight.security.local-login.enabled: true`
3. ✅ **Wrong IP address** - Verify IP with `ipconfig` or `ifconfig`
4. ✅ **Firewall blocking** - Check firewall allows port 8080
5. ✅ **Different networks** - Ensure mobile and computer on same WiFi

### Error: "timeout of 10000ms exceeded"

**This means:** Request sent but no response received.

**Check:**
```bash
# 1. Backend is running
curl http://localhost:8080/actuator/health

# 2. Login endpoint exists
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{}'

# 3. Backend logs show the request arriving
# Check backend console for incoming request logs
```

### Backend Logs Show No Requests

**Problem:** Backend never receives the request

**Solutions:**
1. **Check IP address** - Use correct IP from Step 5
2. **Check same network** - Both devices on same WiFi
3. **Check firewall** - Allow port 8080

**Windows Firewall:**
```cmd
netsh advfirewall firewall add rule name="Backend API" dir=in action=allow protocol=TCP localport=8080
```

**macOS Firewall:**
- System Preferences → Security & Privacy → Firewall → Firewall Options
- Allow your Java/Spring Boot app

**Linux (UFW):**
```bash
sudo ufw allow 8080/tcp
```

### Error: "404 Not Found" on /api/auth/login

**Problem:** AuthController is not enabled!

**Solution:** 
1. Edit `application.yml` in backend
2. Add:
   ```yaml
   inventsight:
     security:
       local-login:
         enabled: true
   ```
3. Restart backend server
4. Verify endpoint exists with curl

### Backend Database Issues

**Symptom:** Backend starts but crashes on requests

**Check:**
- Database is running (PostgreSQL/MySQL/etc.)
- Database credentials in `application.yml` are correct
- Database migrations have been applied
- Backend logs for database connection errors

### Connection Works from Browser but Not Mobile

**Problem:** CORS not configured

**Solution:** Add CORS configuration (see Step 3)

## Quick Start Checklist

Before starting the mobile app:

- [ ] Backend repository cloned and built
- [ ] `inventsight.security.local-login.enabled: true` in `application.yml`
- [ ] Backend server running on port 8080
- [ ] Health endpoint responding: `curl http://localhost:8080/actuator/health`
- [ ] Found computer's IP address
- [ ] Updated `.env` file with correct IP
- [ ] Both devices on same WiFi network
- [ ] Firewall allows port 8080
- [ ] CORS enabled in backend

## Testing the Complete Flow

1. **Start backend:**
   ```bash
   cd ../InventSight
   mvn spring-boot:run
   ```

2. **Verify backend:**
   ```bash
   curl http://localhost:8080/actuator/health
   # Should return: {"status":"UP"}
   ```

3. **Test login endpoint:**
   ```bash
   curl -X POST http://YOUR_IP:8080/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123"}'
   ```

4. **Start mobile app:**
   ```bash
   cd ../InventSightAPP
   npm start
   ```

5. **Try logging in** with valid credentials

## Common Development Scenarios

### Scenario 1: Android Emulator
```env
# .env
API_BASE_URL=http://10.0.2.2:8080
```
Android emulator uses `10.0.2.2` as alias for host machine's localhost.

### Scenario 2: iOS Simulator
```env
# .env
API_BASE_URL=http://localhost:8080
```
iOS simulator can access host's localhost directly.

### Scenario 3: Physical Device
```env
# .env
API_BASE_URL=http://192.168.1.100:8080
```
Use your actual machine IP. Change when switching networks!

## Need More Help?

1. **Check backend logs** for errors
2. **Check mobile app logs** in Metro bundler console
3. **Use network diagnostic tools:**
   ```bash
   # Test port is open
   nc -zv 192.168.1.100 8080
   
   # Or telnet
   telnet 192.168.1.100 8080
   ```
4. **Review [NETWORK_TROUBLESHOOTING.md](./NETWORK_TROUBLESHOOTING.md)** for detailed network debugging

## Security Notes

### Development
- ✅ HTTP is fine for local development
- ✅ CORS `*` is acceptable for testing
- ✅ local-login enabled for testing

### Production
- ⚠️ Use HTTPS only
- ⚠️ Restrict CORS to specific origins
- ⚠️ Consider disabling local-login if using OAuth
- ⚠️ Use proper authentication/authorization
- ⚠️ Enable rate limiting
- ⚠️ Use environment variables for secrets

## Summary

The most common issue is **forgetting to enable local-login in the backend**. Always check:

```yaml
inventsight:
  security:
    local-login:
      enabled: true  # ← THIS IS REQUIRED!
```

Without this setting, the mobile app will timeout because the login endpoint literally doesn't exist.
