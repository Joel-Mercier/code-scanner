# Code Scanner

A powerful and feature-rich QR code and barcode scanner mobile application for Android built with React Native and Expo. Scan, generate, and manage various types of codes with an intuitive interface and comprehensive functionality.

## 📱 Features

### 🔍 **Scanning Capabilities**
- **Multi-format Support**: Scan QR codes and 12+ barcode types including EAN13, EAN8, UPC-A, UPC-E, Code128, Code39, DataMatrix, PDF417, Aztec, Codabar, and ITF14
- **Real-time Camera**: Live camera feed with instant code detection
- **Torch Control**: Built-in flashlight for low-light scanning
- **Camera Controls**: Switch between front and back cameras
- **Zoom Functionality**: Adjustable zoom slider for better scanning precision
- **Scanning Overlay**: Optional visual overlay to guide scanning

### 🎯 **Code Generation**
- **QR Code Types**:
  - **URLs**: Generate QR codes for web links
  - **Text**: Create QR codes for plain text
  - **WiFi**: Generate WiFi connection QR codes with SSID, password, and encryption settings
  - **Email**: Create email QR codes with subject, body, CC, and BCC
  - **Phone**: Generate phone number QR codes
  - **SMS**: Create SMS QR codes with pre-filled messages
  - **vCard**: Generate contact information QR codes
  - **Location**: Create GPS location QR codes
  - **Cryptocurrency**: Generate Bitcoin, Ethereum, and Litecoin payment QR codes
  - **Events**: Create calendar event QR codes

- **Barcode Types**: Support for all major barcode formats with customizable styling
- **Customization Options**: 
  - Error correction levels
  - Margins and scaling
  - Custom colors and styling
  - Logo embedding for QR codes
  - Text positioning for barcodes

### 📚 **History & Management**
- **Scan History**: Automatically save all scanned codes
- **Result Management**: View, share, and manage scanned results
- **Smart Actions**: Context-aware actions based on code type (open URLs, call numbers, send emails, etc.)
- **Bulk Operations**: Clear entire history with confirmation

### 🎨 **User Experience**
- **Modern UI**: Clean, dark-themed interface with smooth animations
- **Internationalization**: Multi-language support (English, French)
- **Responsive Design**: Optimized for various screen sizes and orientations
- **Accessibility**: Built with accessibility best practices
- **Smooth Animations**: Fluid transitions and micro-interactions

### 🔧 **Technical Features**
- **Offline Capability**: Core functionality works without internet
- **Data Persistence**: Local storage using MMKV for fast access
- **Image Capture**: Take photos and save to device gallery
- **Sharing**: Share codes via native sharing mechanisms
- **Export Options**: Save generated codes as images

## 🛠 Technical Stack

### **Core Framework**
- **React Native** `0.81.4` - Cross-platform mobile development
- **Expo** `54.0.9` - Development platform and tools
- **TypeScript** `5.9.2` - Type-safe JavaScript

### **Key Dependencies**
- **Navigation**: `@react-navigation/native` - App navigation
- **Camera**: `expo-camera` - Camera functionality
- **State Management**: `zustand` - Lightweight state management
- **Forms**: `@tanstack/react-form` - Form handling with validation
- **Data Fetching**: `@tanstack/react-query` - Server state management
- **Storage**: `react-native-mmkv` - Fast key-value storage
- **Animations**: `react-native-reanimated` - Smooth animations
- **UI Components**: `@gorhom/bottom-sheet` - Bottom sheet modals
- **QR Code Generation**: `qrcode` - QR code creation
- **Barcode API**: Custom service using `barcodeapi.org`
- **Internationalization**: `react-i18next` - Multi-language support

### **Development Tools**
- **Linting**: `@biomejs/biome` - Fast linter and formatter
- **Type Checking**: TypeScript with strict configuration
- **Build System**: EAS Build for app compilation

### **Platform Support**
- **Android**: Full support with APK builds
- **iOS**: Configured for iOS (requires device for testing)
- **Web**: Metro bundler for web deployment

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd code-scanner
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on device/simulator**
   ```bash
   # Android
   npm run android
   
   # iOS
   npm run ios
   
   # Web
   npm run web
   ```

### Building for Production

```bash
# Build APK for Android
eas build --platform android --profile production

# Build for iOS
eas build --platform ios --profile production
```

## 📁 Project Structure

```
code-scanner/
├── app/                    # App screens (Expo Router)
│   ├── index.tsx          # Main scanner screen
│   ├── barcode.tsx        # Barcode display screen
│   ├── qr-code.tsx        # QR code display screen
│   ├── history.tsx        # Scan history screen
│   ├── new-code.tsx       # Code generation screen
│   └── settings.tsx       # Settings screen
├── components/            # Reusable UI components
├── config/               # App configuration
├── constants/            # App constants (colors, spacing)
├── hooks/               # Custom React hooks
├── i18n/                # Internationalization files
├── services/            # External API services
├── stores/              # State management (Zustand)
├── utils/               # Utility functions
└── types.ts             # TypeScript type definitions
```

## 🎯 Key Features Implementation

### **Scanner Engine**
- Uses `expo-camera` with real-time barcode detection
- Supports 12+ barcode formats with optimized scanning algorithms
- Custom overlay system using `@shopify/react-native-skia` for visual guidance

### **Code Generation**
- QR codes generated using `qrcode` library with SVG output
- Barcodes generated via `barcodeapi.org` API service
- Custom data formatters for different QR code types (WiFi, vCard, etc.)

### **State Management**
- Zustand for lightweight, performant state management
- Separate stores for scanner results and app settings
- Persistent storage using MMKV for offline capability

### **Form Handling**
- `@tanstack/react-form` for complex form validation
- Zod schemas for type-safe validation
- Dynamic form fields based on selected code type

## 🌍 Internationalization

The app supports multiple languages with easy extensibility:
- English (default)
- French
- Extensible architecture for additional languages

## 🔧 Configuration

### **App Configuration** (`app.json`)
- Bundle identifier: `com.jmercier.codescanner`
- Version: `1.0.2`
- New Architecture enabled
- Edge-to-edge design for Android

### **Build Configuration** (`eas.json`)
- Development, preview, and production build profiles
- Android APK builds configured
- Auto-increment versioning for production

## 🚧 Roadmap

- [ ] Test on real iOS device

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

**Built with ❤️ using React Native and Expo**