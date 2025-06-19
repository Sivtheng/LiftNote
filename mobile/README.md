# LiftNote Mobile App

A React Native mobile application for the LiftNote fitness platform, built with Expo.

## Features

### Comments with Media Support

- **Text Comments**: Add text-based comments to programs
- **Image Upload**: Upload images from device gallery
- **Video Upload**: Upload videos (max 60 seconds, 10MB)
- **Media Display**: View uploaded images and videos in comments
- **Reply System**: Reply to existing comments
- **Program Selection**: Switch between different programs to view their comments

### Authentication

- Login/Logout functionality
- Password reset
- Profile management

### Programs

- View assigned programs
- Track progress
- Mark weeks as complete

### Progress Logging

- Log daily exercise progress
- View progress history
- Update and delete logs

### Questionnaire

- Complete fitness questionnaires
- Submit answers to coaches

## Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development) or Android Emulator (for Android development)

### Installation

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Install Expo CLI globally (if not already installed):**

   ```bash
   npm install -g @expo/cli
   ```

3. **Start the development server:**

   ```bash
   npm start
   ```

4. **Run on device/simulator:**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your phone

### Environment Configuration

The app uses a simplified network configuration since the database is hosted on DigitalOcean:

- **Development**: `http://192.168.43.233:8000/api` (local Docker backend)
- **Production**: `https://your-backend-domain.com/api` (when backend is deployed)

The mobile app connects to your local Docker backend, which in turn connects to the hosted DigitalOcean database. This eliminates the need for different network configurations.

**Note**: Update the IP address in `src/services/api.ts` if your computer's IP changes.

## Media Upload Features

### Supported Media Types

- **Images**: JPEG, PNG, GIF
- **Videos**: MP4 (max 60 seconds)

### File Size Limits

- Maximum file size: 10MB
- Videos are automatically compressed to 0.8 quality

### Permissions

The app requests camera roll permissions to access media from your device.

## API Integration

The mobile app connects to the same Laravel backend as the web application, using:

- Bearer token authentication
- RESTful API endpoints
- DigitalOcean Spaces for media storage

## Development

### Project Structure

```bash
src/
├── screens/          # Screen components
├── services/         # API services
├── navigation/       # Navigation configuration
├── types/           # TypeScript type definitions
└── config/          # Configuration files
```

### Key Dependencies

- `expo-image-picker`: Media selection
- `expo-av`: Video playback
- `axios`: HTTP requests
- `@react-native-async-storage/async-storage`: Local storage
- `@react-navigation/*`: Navigation

## Troubleshooting

### Common Issues

1. **Media upload fails:**
   - Check network connectivity
   - Verify API endpoint configuration
   - Ensure file size is under 10MB

2. **Permission denied:**
   - Grant camera roll permissions in device settings
   - Restart the app after granting permissions

3. **Video not playing:**
   - Ensure video format is MP4
   - Check video file integrity

### Debug Mode

Enable debug logging by checking the console output in Expo development tools.
