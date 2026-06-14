# SXB VPN — Flutter Mobile App

Premium VPN mobile application for SXB VPN service.

## Features

- **Premium UI** — NordVPN/ProtonVPN inspired dark glassmorphism design
- **Authentication** — JWT login/register with secure token storage
- **VPN Dashboard** — Animated connect button with real-time stats
- **Server Selection** — Browse servers by country with ping display
- **Usage Statistics** — Data consumption charts per app
- **Profile** — Account management and device tracking

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Flutter 3.x |
| State Management | Riverpod 2 |
| Navigation | GoRouter |
| HTTP Client | Dio |
| Secure Storage | flutter_secure_storage |
| Animations | flutter_animate |
| Charts | fl_chart |
| Fonts | Google Fonts (Poppins) |

## Architecture

```
lib/
├── app/           # Theme, router, app widget
├── core/
│   ├── network/   # Dio API client + endpoints
│   └── storage/   # Secure token storage
├── features/      # Screen-level UI (auth, home, vpn, servers, profile, usage)
├── models/        # Data models (User, VpnConfig, Server)
├── providers/     # Riverpod state (AuthNotifier, VpnNotifier)
├── services/      # API service layer (AuthService, VpnService, UserService)
└── widgets/       # Shared UI components
```

## Setup

1. Install Flutter: https://flutter.dev/docs/get-started/install
2. Clone the repo and navigate to this folder:
   ```bash
   cd mobile_app_sxb_vpn
   flutter pub get
   ```
3. Update the API base URL in `lib/core/network/endpoints.dart`:
   ```dart
   static const String baseUrl = 'https://YOUR_BACKEND_URL/api';
   ```
4. Run:
   ```bash
   flutter run
   ```

## API Integration

Connects to the SXB VPN backend:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/auth/login` | User login |
| POST | `/auth/register` | User registration |
| GET | `/auth/me` | Get current user |
| GET | `/vpn/my-config` | Get VPN configuration |
| GET | `/users/:id` | Get user profile |
| GET | `/usage/:userId` | Get usage statistics |

## Design System

- **Background**: `#0B0F1A`
- **Primary**: `#2563EB` → `#06B6D4` (gradient)
- **Connected**: `#10B981`
- **Disconnected**: `#EF4444`
- **Radius**: 12–24px
- **Font**: Poppins (Google Fonts)
