# Network Configuration and Troubleshooting Guide

This guide provides detailed instructions for configuring network connectivity between the React Native app and your backend server.

## Understanding React Native Network Connectivity

### Key Concept: localhost vs IP Address

**Important**: React Native apps running on physical devices or emulators **cannot** connect to `localhost` or `127.0.0.1` because these addresses refer to the device itself, not your development machine.

### Platform-Specific Defaults

The app automatically detects the platform and uses appropriate defaults:

- **Android Emulator**: `http://10.0.2.2:8080` (special alias for host machine)
- **iOS Simulator**: `http://localhost:8080` (can access host machine's localhost)
- **Physical Devices**: `http://<YOUR_MACHINE_IP>:8080` (requires actual IP address)

## Quick Start Guide

### Step 1: Ensure Backend is Running

Before configuring the app, verify your backend server is running:

```bash
# Test locally on your machine
curl http://localhost:8080/api/dashboard/summary

# Expected response: JSON data or HTTP error (not connection refused)
```

If you get "Connection refused", your backend is not running.

### Step 2: Find Your Machine's IP Address

#### On Windows:
1. Open Command Prompt (cmd)
2. Type: `ipconfig`
3. Look for "IPv4 Address" under your active network adapter
4. Common patterns: `192.168.x.x` or `10.0.x.x`

Example output:
```
Wireless LAN adapter Wi-Fi:
   IPv4 Address. . . . . . . . . . . : 192.168.1.100
```

#### On macOS:
1. Open Terminal
2. Type: `ifconfig | grep "inet " | grep -v 127.0.0.1`
3. The first result is usually your WiFi IP

Or use GUI:
1. System Preferences → Network
2. Select your active connection (WiFi or Ethernet)
3. Your IP address is displayed on the right

#### On Linux:
```bash
# Method 1
ip addr show | grep "inet " | grep -v 127.0.0.1

# Method 2
hostname -I
```

### Step 3: Configure API Base URL

Create or update `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and set your API URL:

```env
# Replace 192.168.1.100 with YOUR machine's IP address
API_BASE_URL=http://192.168.1.100:8080

# For Android Emulator (if default doesn't work)
# API_BASE_URL=http://10.0.2.2:8080

# For Production
# API_BASE_URL=https://your-api-domain.com
```

### Step 4: Ensure Both Devices on Same Network

**Critical**: Your development machine and mobile device must be on the **same WiFi network**.

- Check WiFi settings on both devices
- Look for the same network name (SSID)
- Guest networks may have isolation enabled (use regular network)

### Step 5: Configure Firewall

Your firewall must allow incoming connections on port 8080.

#### Windows Firewall:
1. Open Windows Defender Firewall
2. Click "Advanced settings"
3. Click "Inbound Rules"
4. Look for rules blocking port 8080
5. Create a new inbound rule to allow TCP port 8080

Quick command (run as Administrator):
```cmd
netsh advfirewall firewall add rule name="Backend API" dir=in action=allow protocol=TCP localport=8080
```

#### macOS Firewall:
1. System Preferences → Security & Privacy → Firewall
2. Click "Firewall Options"
3. Ensure your backend app is allowed
4. Or temporarily disable firewall for testing (not recommended for production)

#### Linux (UFW):
```bash
sudo ufw allow 8080/tcp
```

### Step 6: Configure Backend CORS

Your backend must accept cross-origin requests from the React Native app.

For Spring Boot, add to your configuration:

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("*")  // Or specify your app's origin
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }
}
```

Or add `@CrossOrigin(origins = "*")` to controllers:

```java
@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api")
public class ApiController {
    // Your endpoints
}
```

### Step 7: Restart Everything

After making changes:

1. **Restart backend server**: Ensure it binds to `0.0.0.0`, not just `localhost`
2. **Close and restart Expo app**: Changes to `.env` require restart
3. **Clear Metro bundler cache** (if needed): `expo start -c`

## Common Error Messages and Solutions

### Error: "Network: Connected but no internet access"

**Cause**: App is connected to WiFi but cannot reach backend server.

**Solutions**:
1. Verify backend is running: `curl http://localhost:8080/api/dashboard/summary`
2. Check firewall allows port 8080
3. Ensure devices on same network
4. Verify API_BASE_URL uses correct IP

### Error: "timeout of 10000ms exceeded"

**Cause**: App sent request but no response received within 10 seconds.

**Solutions**:
1. Backend not running or crashed
2. Wrong IP address in API_BASE_URL
3. Firewall blocking connection
4. Backend taking too long to respond (check backend logs)

### Error: "Network request failed"

**Cause**: Cannot establish connection at all.

**Solutions**:
1. Check API_BASE_URL format: `http://` not `https://` (unless using SSL)
2. Verify port number (8080)
3. Try pinging backend: `ping 192.168.1.100`
4. Check network connectivity

### Error: "Cannot find native module 'ExpoBarCodeScanner'"

**Cause**: Using deprecated `expo-barcode-scanner` package (removed in SDK 54).

**Status**: ✅ **Fixed** - App now uses built-in barcode scanning from `expo-camera`.

If you still see this error:
1. Ensure you're using Expo SDK 54
2. Clear node_modules and reinstall: `rm -rf node_modules && npm install`
3. Clear Expo cache: `expo start -c`
4. Rebuild the app

## Testing Network Connectivity

### Test 1: Backend Reachable from Your Machine

```bash
curl http://localhost:8080/api/dashboard/summary
```

Expected: JSON response or HTTP error (not "connection refused")

### Test 2: Backend Reachable from Network

```bash
# Replace with your machine's IP
curl http://192.168.1.100:8080/api/dashboard/summary
```

Expected: Same response as Test 1

If Test 1 passes but Test 2 fails:
- Backend is not binding to all interfaces
- Check backend configuration: `server.address=0.0.0.0`

### Test 3: Port is Open

From another device on the network:

```bash
# Test port connectivity
nc -zv 192.168.1.100 8080

# Or telnet
telnet 192.168.1.100 8080
```

Expected: "Connection succeeded" or similar message

### Test 4: App Configuration

Check the app's detected configuration:

```javascript
// In your app code
import { getNetworkInfo } from './utils/networkConfig';
console.log('Network Info:', getNetworkInfo());
```

## Advanced Troubleshooting

### Using Charles Proxy or Wireshark

For deep network debugging:

1. Install Charles Proxy or Wireshark
2. Monitor network traffic from your device
3. Check if requests are being sent
4. Verify request format and headers
5. Check response status codes

### Using adb logcat (Android)

```bash
# View real-time logs
adb logcat | grep -i "network\|api\|error"
```

### Checking iOS Simulator Logs

```bash
# View simulator logs
xcrun simctl spawn booted log stream --predicate 'processImagePath contains "Expo"'
```

## Environment-Specific Configuration

### Development

```env
API_BASE_URL=http://192.168.1.100:8080
LOG_LEVEL=debug
```

### Staging

```env
API_BASE_URL=https://staging-api.example.com
LOG_LEVEL=info
```

### Production

```env
API_BASE_URL=https://api.example.com
LOG_LEVEL=error
```

## Backend Configuration Checklist

Ensure your backend is configured correctly:

- [ ] Server binds to `0.0.0.0:8080` (not just `localhost:8080`)
- [ ] CORS is enabled for all origins (or your app's origin)
- [ ] Firewall allows port 8080
- [ ] Backend logs show incoming requests
- [ ] Health check endpoint works: `/api/health` or `/actuator/health`

### Spring Boot Configuration Example

`application.properties`:
```properties
server.address=0.0.0.0
server.port=8080

# Enable CORS
spring.web.cors.allowed-origins=*
spring.web.cors.allowed-methods=GET,POST,PUT,DELETE,OPTIONS
spring.web.cors.allowed-headers=*
```

## Network Security Best Practices

### Development
- Use HTTP on local network (faster)
- Allow all CORS origins for convenience
- Disable authentication checks (optional)

### Production
- **Always use HTTPS**
- Restrict CORS to specific origins
- Enable proper authentication
- Use environment variables for secrets
- Implement rate limiting

## Getting Help

If you've tried everything and still can't connect:

1. **Collect diagnostic information**:
   ```bash
   # Your machine's IP
   ipconfig  # Windows
   ifconfig  # macOS/Linux
   
   # Test backend locally
   curl -v http://localhost:8080/api/dashboard/summary
   
   # Test from network
   curl -v http://YOUR_IP:8080/api/dashboard/summary
   
   # Check if port is open
   netstat -an | grep 8080
   ```

2. **Check Expo logs**: Look for network-related errors

3. **Create an issue** with:
   - Your platform (iOS/Android, Simulator/Device)
   - Your network setup (WiFi, same network, etc.)
   - Error messages from app logs
   - Backend logs showing requests (or lack thereof)
   - Results from diagnostic commands above

## Quick Reference

| Scenario | API_BASE_URL |
|----------|-------------|
| Android Emulator | `http://10.0.2.2:8080` |
| iOS Simulator | `http://localhost:8080` |
| Physical Device (same WiFi) | `http://YOUR_IP:8080` |
| Production | `https://api.yourdomain.com` |

**Remember**: After changing `.env`, restart the Expo app completely!
