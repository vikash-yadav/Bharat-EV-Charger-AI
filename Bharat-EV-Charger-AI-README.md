# ⚡ Bharat EV Charger AI

> AI-Powered EV Charging Interoperability Platform for India

Bharat EV Charger AI is a smart EV charging ecosystem prototype that demonstrates how India's fragmented charging infrastructure can be unified through a single intelligent platform.

The application combines charger discovery, Google Maps integration, route planning, AI assistance, charging session simulation, interoperability concepts (OCPP/OCPI), fleet management, and digital payments into a seamless experience.

---

## 🚀 Features

### 🔌 Smart Charger Discovery
- Interactive Google Maps integration
- Nearby charging station visualization
- Multi-operator charging network support
- Station filtering by city, operator, and connector type
- Real-time charger availability simulation

### 🗺️ EV Route Planning
- Predefined EV travel routes
- Charging stop recommendations
- Route visualization on Google Maps
- Navigation assistance

### 🤖 AI EV Assistant
- Gemini-powered EV assistant
- Charging guidance
- EV education and recommendations
- Intelligent user support

### ⚡ Charging Session Simulator
- OCPP workflow simulation
- Charging progress tracking
- State-of-charge monitoring
- Energy consumption calculations
- Cost estimation

### 💳 BharatCharge Pay
- UPI-inspired charging payments
- Wallet top-up simulation
- Digital charging transactions
- Invoice generation

### 🚚 Fleet Management Dashboard
- Fleet monitoring
- Vehicle utilization tracking
- Charging analytics
- Fleet charging optimization

### 🔄 Interoperability Demonstration
- OCPP communication simulation
- Multi-network charging ecosystem
- Cross-provider charging experience
- Future-ready interoperability architecture

---

## 🏗️ Tech Stack

### Frontend
- React 19
- TypeScript
- Vite
- Tailwind CSS
- Lucide React

### Maps & Geolocation
- Google Maps Platform
- @vis.gl/react-google-maps
- Browser Geolocation API

### AI
- Google Gemini API
- @google/genai SDK

### Backend
- Express.js
- Node.js

---

## 📂 Project Structure

```text
src/
├── components/
│   └── GoogleMapsView.tsx
├── App.tsx
├── data.ts
├── types.ts
├── main.tsx
└── index.css

server.ts
vite.config.ts
package.json
```

---

## 🎯 Core Modules

### EV Owner Dashboard
- Discover chargers
- Start charging sessions
- Monitor battery status
- Make payments

### Fleet Manager
- Fleet visibility
- Charging analytics
- Vehicle tracking

### Charging Operator
- Charger monitoring
- Availability management
- Network insights

### Service Technician
- Charger diagnostics
- Maintenance visibility

### System Administrator
- Platform monitoring
- Ecosystem analytics

---

## 🔌 Supported Charging Networks

- Tata Power EZ Charge
- Statiq
- ChargeZone
- Jio-bp Pulse
- Bolt.Earth

---

## 🚗 Supported EV Models

- Tata Nexon EV Max
- Tata Tiago EV
- MG ZS EV
- BYD Atto 3
- Hyundai Ioniq 5

---

## ⚙️ Installation

### Prerequisites

- Node.js 18+
- Google Maps API Key
- Gemini API Key

### Clone Repository

```bash
git clone https://github.com/vikash-yadav/Bharat-EV-Charger-AI.git
cd Bharat-EV-Charger-AI
```

### Install Dependencies

```bash
npm install
```

### Configure Environment

Create a `.env.local` file:

```env
GEMINI_API_KEY=your_gemini_api_key
VITE_GOOGLE_MAPS_PLATFORM_KEY=your_google_maps_api_key
```

### Start Development Server

```bash
npm run dev
```

### Build Application

```bash
npm run build
```

### Run Production Build

```bash
npm start
```

---

## 🌟 Innovation Highlights

- UPI-inspired EV charging ecosystem
- AI-powered charging assistance
- Interoperability-first architecture
- Live geolocation support
- Google Maps visualization
- Fleet management capabilities
- OCPP communication simulation

---

## 🔮 Future Roadmap

- Real OCPP 2.0.1 integration
- OCPI roaming support
- Live charger APIs
- Smart charger reservations
- Queue prediction AI
- Dynamic pricing engine
- Vehicle-to-Grid (V2G)
- Predictive maintenance

---

## 🎯 Vision

Build a unified EV charging experience for India where any EV driver can discover, access, charge, and pay across any charging network through a single intelligent platform.

**One Nation 🇮🇳 • One Charging Network ⚡ • One Seamless Experience 🚗**

---

## 📄 License

MIT License
