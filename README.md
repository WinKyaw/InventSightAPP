# InventSightAPP - React Native Point of Sale

A modern React Native point of sale application with inventory management capabilities.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or later)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- React Native development environment
- **InventSight backend server** (see [Backend Setup](#-backend-setup-required) below)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/WinKyaw/InventSightAPP.git
cd InventSightAPP
```

2. Install dependencies:
```bash
npm install
```

3. **⚠️ IMPORTANT: Configure backend** (see [Backend Setup](#-backend-setup-required) below)

4. Configure API connection:
```bash
cp .env.example .env
# Edit .env with your backend IP address
```

5. Start the development server:
```bash
npm start
```

## 🔧 Backend Setup (Required)

**⚠️ CRITICAL**: This mobile app requires the InventSight backend server to be running with **local authentication enabled**.

### Quick Backend Setup

1. **Enable local authentication** in backend `application.yml`:
   ```yaml
   # backend/src/main/resources/application.yml
   inventsight:
     security:
       local-login:
         enabled: true  # ← REQUIRED! Without this, login endpoint doesn't exist
   ```

2. **Start backend server:**
   ```bash
   cd ../InventSight
   mvn spring-boot:run
   ```

3. **Find your backend IP:**
   ```bash
   # Mac/Linux
   ipconfig getifaddr en0
   
   # Windows
   ipconfig
   ```

4. **Update mobile app config:**
   ```bash
   # Edit .env file
   API_BASE_URL=http://YOUR_IP_HERE:8080
   API_TIMEOUT=30000
   ```

5. **Start mobile app:**
   ```bash
   npm start
   ```

**📖 See [BACKEND_SETUP.md](./BACKEND_SETUP.md) for complete setup instructions**

### Why Backend Setup is Critical

The backend's `AuthController` is **disabled by default**. The `/api/auth/login` endpoint literally doesn't exist unless you enable it in `application.yml`. This is the #1 cause of "Network Error - No response received" errors.

## 🔧 API Setup

### Important: React Native Localhost Connectivity

React Native applications **cannot connect to `localhost`** from physical devices or certain emulators because `localhost` resolves to the device's localhost, not your development machine.

**📖 For detailed network troubleshooting, see [NETWORK_TROUBLESHOOTING.md](./NETWORK_TROUBLESHOOTING.md)**

### Automatic Configuration

The app automatically detects the appropriate API URL based on your platform:

- **Android Emulator**: `http://10.0.2.2:8080`
- **iOS Simulator**: `http://localhost:8080`
- **Physical Devices**: `http://192.168.1.100:8080` (uses your machine's IP)

### Manual Configuration

To override automatic detection, create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Then edit `.env` with your specific configuration:

```env
# For Android Emulator
API_BASE_URL=http://10.0.2.2:8080

# For Physical Devices (replace with your machine's IP)
API_BASE_URL=http://192.168.1.100:8080

# For Production
API_BASE_URL=https://your-api-domain.com
```

### Finding Your Machine's IP Address

#### Windows:
```cmd
ipconfig
```
Look for "IPv4 Address" under your active network adapter.

#### macOS/Linux:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

#### Quick Network Info
The app includes a network diagnostic utility. To use it programmatically:

```javascript
import { getNetworkInfo } from './utils/networkConfig';
console.log('Network Info:', getNetworkInfo());
```

## 🏃‍♂️ Running the App

### On Android Emulator
```bash
npm run android
```
- Uses `http://10.0.2.2:8080` automatically
- No additional configuration needed

### On iOS Simulator
```bash
npm run ios
```
- Uses `http://localhost:8080` automatically
- Works with standard localhost

### On Physical Device
1. Ensure your device and development machine are on the same network
2. Find your machine's IP address (see above)
3. Set `API_BASE_URL` in `.env` file to `http://YOUR_MACHINE_IP:8080`
4. Run: `npm start` and scan the QR code

## 🔧 Backend Setup

Ensure your Spring Boot backend is running on port 8080. The backend should:

1. **Accept connections from all interfaces**:
   ```properties
   server.address=0.0.0.0
   server.port=8080
   ```

2. **Configure CORS** for React Native requests:
   ```java
   @CrossOrigin(origins = "*")
   ```

## 🐛 Troubleshooting

### Common Issues

#### "Network Error - No response received"

**Most Common Cause:** Backend AuthController is disabled!

**Solution:**
1. ✅ **Enable local-login** in backend `application.yml`:
   ```yaml
   inventsight:
     security:
       local-login:
         enabled: true
   ```
2. ✅ Restart backend server
3. ✅ Verify endpoint exists: `curl -X POST http://localhost:8080/api/auth/login`

**Other Causes:**
- **Physical Device**: Check that `API_BASE_URL` uses your machine's IP, not `localhost`
- **Backend Not Running**: Ensure Spring Boot backend is running on port 8080
- **Firewall**: Check if firewall is blocking connections on port 8080
- **Network**: Ensure device and development machine are on same network

#### "timeout of 30000ms exceeded"

**Symptom:** Request sent but no response received

**Solutions:**
1. ✅ **Backend running?** Check: `curl http://localhost:8080/actuator/health`
2. ✅ **local-login enabled?** Check `application.yml` (see above)
3. ✅ **Correct IP address?** Run `ipconfig getifaddr en0` (Mac) or `ipconfig` (Windows)
4. ✅ **Same WiFi network?** Ensure mobile device and backend are connected to same WiFi
5. ✅ **Firewall allows port 8080?** Check firewall settings

#### "404 Not Found" on login

**Problem:** AuthController is not enabled in backend!

**Solution:** See "Network Error - No response received" above

#### "Cannot connect to localhost"
- This is expected on physical devices
- Use automatic configuration or set proper IP in `.env`

#### "Connected but no internet access"
This error indicates the app can connect to the network but cannot reach the backend server.

**Quick Fix Checklist:**
1. ✅ Backend is running: `curl http://localhost:8080/actuator/health`
2. ✅ Found correct IP: `ipconfig` (Windows) or `ipconfig getifaddr en0` (Mac)
3. ✅ Updated `.env`: `API_BASE_URL=http://YOUR_IP:8080`
4. ✅ Same WiFi network: Check both devices
5. ✅ Firewall allows port 8080
6. ✅ Restarted Expo app after changing `.env`

### Debugging Network Issues

1. **Check network configuration**:
   ```javascript
   import { getNetworkInfo } from './utils/networkConfig';
   console.log(getNetworkInfo());
   ```

2. **Test backend connectivity**:
   ```bash
   # Test from your development machine
   curl http://localhost:8080/api/auth/login
   
   # Test from network (replace with your IP)
   curl http://192.168.1.100:8080/api/auth/login
   ```

3. **Verify backend CORS configuration**

### How to Find Your Machine's IP Address

#### Windows:
```cmd
ipconfig
```
Look for "IPv4 Address" under your active WiFi or Ethernet adapter (usually starts with 192.168.x.x or 10.0.x.x)

#### macOS:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```
Or check System Preferences → Network → Select your connection → Advanced → TCP/IP

#### Linux:
```bash
ip addr show | grep "inet " | grep -v 127.0.0.1
```
Or:
```bash
hostname -I
```

### Quick Network Troubleshooting Checklist

1. ✅ **local-login enabled in backend** - Check `application.yml` (MOST IMPORTANT!)
2. ✅ Backend server is running on port 8080
3. ✅ Found correct IP address of development machine
4. ✅ Updated `API_BASE_URL` in `.env` file with correct IP
5. ✅ Development machine and mobile device on same WiFi network
6. ✅ Firewall allows connections on port 8080
7. ✅ Restarted the Expo app after changing `.env`
8. ✅ Backend CORS is configured to accept requests from any origin

### Complete Troubleshooting Guides

- **Backend Setup:** See [BACKEND_SETUP.md](./BACKEND_SETUP.md) for complete backend configuration
- **Network Issues:** See [NETWORK_TROUBLESHOOTING.md](./NETWORK_TROUBLESHOOTING.md) for detailed network debugging

## 📱 Supported Platforms

- ✅ Android (Emulator & Physical Device)
- ✅ iOS (Simulator & Physical Device)
- ✅ Expo Go
- ✅ Development Builds

## 🔐 Authentication

The app supports:
- User login/signup
- JWT token-based authentication
- Automatic token refresh
- Demo mode for development

## 📄 License

This project is licensed under the MIT License.

## 📝 Recent Updates

### Expo SDK 54 Migration (Latest)

The app has been updated to Expo SDK 54 with the following changes:

#### Breaking Changes Fixed
- ✅ **Barcode Scanner**: Migrated from deprecated `expo-barcode-scanner` to built-in `expo-camera` barcode scanning
- ✅ **SafeAreaView**: Updated all components to use `react-native-safe-area-context` instead of deprecated React Native SafeAreaView
- ✅ **Permissions**: Simplified permission handling - only camera permission needed (barcode permission now included)

#### What This Means for You
- Barcode scanning now uses the camera's native barcode detection
- No separate barcode scanner permission needed
- Improved performance and reliability
- Fully compatible with Expo SDK 54

For more details on the migration, see the commit history.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

If you encounter issues:
1. Check this README for common solutions
2. Verify your network configuration
3. Ensure backend is properly configured
4. Open an issue with network diagnostic info