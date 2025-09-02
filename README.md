# InventSightAPP - React Native Point of Sale

A modern React Native point of sale application with inventory management capabilities.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or later)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- React Native development environment

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

3. Configure API connection (see [API Setup](#-api-setup) below)

4. Start the development server:
```bash
npm start
```

## 🔧 API Setup

### Important: React Native Localhost Connectivity

React Native applications **cannot connect to `localhost`** from physical devices or certain emulators because `localhost` resolves to the device's localhost, not your development machine.

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
- **Physical Device**: Check that `API_BASE_URL` uses your machine's IP, not `localhost`
- **Backend Not Running**: Ensure Spring Boot backend is running on port 8080
- **Firewall**: Check if firewall is blocking connections on port 8080
- **Network**: Ensure device and development machine are on same network

#### "Cannot connect to localhost"
- This is expected on physical devices
- Use automatic configuration or set proper IP in `.env`

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