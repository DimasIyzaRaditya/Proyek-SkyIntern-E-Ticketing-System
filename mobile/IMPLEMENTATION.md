# SkyIntern Mobile - Flutter Implementation

Implementasi aplikasi E-Ticketing system SkyIntern menggunakan Flutter dengan fitur-fitur yang sama dengan versi web.

## 📁 Struktur Project

```
lib/
├── main.dart                           # Entry point dengan routing dan providers
├── models/
│   ├── user_model.dart                # Model untuk User & Session
│   ├── flight_model.dart              # Model untuk Flight & Airport
│   └── booking_model.dart             # Model untuk Booking, Passenger, Ticket
├── services/
│   ├── api_client.dart                # HTTP Client dengan auth handling
│   ├── auth_service.dart              # Authentication API calls
│   ├── flight_service.dart            # Flight search & airport API calls
│   └── booking_service.dart           # Booking & payment API calls
├── providers/
│   ├── auth_provider.dart             # State management untuk authentication
│   ├── flight_provider.dart           # State management untuk flight search
│   └── booking_provider.dart          # State management untuk bookings
├── screens/
│   ├── login_screen.dart              # Login page
│   ├── register_screen.dart           # Registration page
│   ├── search_screen.dart             # Flight search page
│   ├── search_results_screen.dart     # Search results dengan filter & sorting
│   └── dashboard_screen.dart          # User dashboard dengan bookings
├── widgets/
│   └── common_widgets.dart            # Reusable widgets (AppBar, Button, Card, etc)
└── utils/
    ├── formatters.dart                # Currency, Date, String formatting
    └── helpers.dart                   # Local storage, UI helpers, holidays
```

## 🎯 Fitur-Fitur Utama

### 1. **Authentication**
- ✅ Login dengan email & password
- ✅ Register akun baru
- ✅ Forgot Password (placeholder)
- ✅ Session management dengan localStorage
- ✅ JWT token handling

### 2. **Flight Search**
- ✅ Pilih airport (origin & destination)
- ✅ Calendar date picker untuk departure & return
- ✅ Passenger count (adult & children)
- ✅ Search dengan automatic airport data loading

### 3. **Search Results**
- ✅ Display flights dalam list card
- ✅ Sort by: Price (low/high), Duration, Departure time
- ✅ Flight details dengan facilities & aircraft info
- ✅ Tap flight untuk melihat detail

### 4. **Dashboard**
- ✅ Display user profile
- ✅ Show all user bookings
- ✅ Booking status tracking (PENDING, PAID, CANCELLED, EXPIRED)
- ✅ Pull to refresh
- ✅ Quick search button (FAB)
- ✅ Logout functionality

### 5. **API Integration**
- ✅ Auth endpoints (login, register, profile)
- ✅ Flight endpoints (airports, search, details)
- ✅ Booking endpoints (list, create, cancel)
- ✅ Error handling & token refresh

## 🔧 State Management

Menggunakan **Provider** untuk state management:

### AuthProvider
```dart
- isAuthenticated: bool
- user: UserSession?
- token: string?
- isLoading: bool
- login()
- register()
- logout()
- getProfile()
- updateProfile()
```

### FlightProvider
```dart
- airports: List<Airport>
- flights: List<FlightCardItem>
- isLoadingAirports: bool
- isLoadingFlights: bool
- loadAirports()
- searchFlights()
- sortFlights()
```

### BookingProvider
```dart
- bookings: List<Booking>
- isLoading: bool
- loadBookings()
- createBooking()
- cancelBooking()
```

## 🎨 UI Components

### Common Widgets
- **AppBar**: Custom AppBar dengan back button & actions
- **PrimaryButton**: Primary button dengan loading state
- **InputField**: Text input dengan validation
- **FlightCard**: Flight display card dengan ripple effect

### Screens dengan Navigation
```
/login (initial)
  ↓
/register (if new user)
  ↓
/dashboard (main screen)
  ├── /search (FAB)
  ├── /search-results
  ├── /flight-detail
  ├── /edit-profile
  └── /forgot-password
```

## 🌐 API Endpoints (Expected)

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/profile
PUT    /api/auth/profile
POST   /api/auth/forgot-password
POST   /api/auth/reset-password

GET    /api/flights/airports
GET    /api/flights/search
GET    /api/flights/:id

GET    /api/bookings
POST   /api/bookings
POST   /api/bookings/:id/cancel
POST   /api/bookings/:id/payment
POST   /api/bookings/:id/reschedule
```

## 📦 Dependencies

```yaml
provider: ^6.0.0          # State management
http: ^1.1.0              # HTTP client
intl: ^0.19.0             # Internationalization & formatting
```

## 🚀 Setup & Running

1. **Install dependencies**
   ```bash
   cd mobile
   flutter pub get
   ```

2. **Run aplikasi**
   ```bash
   flutter run
   ```

3. **Build APK** (Android)
   ```bash
   flutter build apk --release
   ```

4. **Build IPA** (iOS)
   ```bash
   flutter build ios --release
   ```

## 📝 File Descriptions

### Models
- **user_model.dart**: UserSession class untuk menyimpan user data
- **flight_model.dart**: FlightCardItem dan Airport models untuk search
- **booking_model.dart**: Booking structure dengan flight & passenger info

### Services
- **api_client.dart**: Core HTTP client dengan JWT auth
- **auth_service.dart**: Login, register, profile management
- **flight_service.dart**: Airport list & flight search
- **booking_service.dart**: Booking CRUD operations

### Providers
- **auth_provider.dart**: ChangeNotifier untuk auth state
- **flight_provider.dart**: ChangeNotifier untuk flight state
- **booking_provider.dart**: ChangeNotifier untuk booking state

### Screens
- **login_screen.dart**: Email/password login UI
- **register_screen.dart**: New account registration
- **search_screen.dart**: Date picker, airport selector, passenger count
- **search_results_screen.dart**: Filterable flight list
- **dashboard_screen.dart**: User profile & bookings display

### Widgets
- **common_widgets.dart**: Reusable UI components

### Utils
- **formatters.dart**: Currency, Date, String formatting
- **helpers.dart**: Local storage, dialogs, holiday mapping

## ⚠️ TODO / Placeholder Features

- [ ] Edit Profile Screen (placeholder)
- [ ] Flight Detail Page (placeholder)
- [ ] Forgot Password Flow (placeholder)
- [ ] Payment Integration (Midtrans)
- [ ] QR Code Ticket Display
- [ ] File upload untuk document/avatar
- [ ] Offline mode caching
- [ ] Dark theme support
- [ ] Passenger data form validation

## 🔐 Security Notes

- JWT tokens disimpan di memory (bisa upgrade ke secure storage)
- HTTPS recommended untuk production
- Sanitize semua user inputs
- Validate token expiration

## 📱 Platform Support

- ✅ iOS 11.0+
- ✅ Android 5.0+ (API Level 21+)
- ⚠️ Web (minimal)
- ⚠️ macOS, Windows, Linux (bisa dengan adjustment)

## 💡 Future Enhancements

1. Implement real payment gateway (Midtrans)
2. Add offline capabilities
3. Improve error handling & retry logic
4. Add analytics tracking
5. Implement push notifications
6. Add hotel search (expansion feature)
7. Loyalty program integration
8. Multi-language support
