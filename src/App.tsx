/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  MapPin, 
  Search, 
  Filter, 
  Battery, 
  Navigation, 
  Bot, 
  DollarSign, 
  IndianRupee,
  Activity, 
  Users, 
  Compass, 
  QrCode, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  ShieldCheck, 
  Mic, 
  Volume2, 
  Send, 
  Info, 
  Clock, 
  Gauge, 
  Zap, 
  ArrowRight, 
  FileText, 
  Loader2, 
  Check, 
  ChevronRight, 
  Leaf,
  RefreshCw,
  Sparkles,
  PhoneCall,
  Locate
} from "lucide-react";
import { UserRole, ChargerStation, EVVehicleModel, FleetVehicle, OCPPLogMessage, RouteStop } from "./types";
import { VEHICLES_DATA, CHARGING_STATIONS_DATA, FLEET_VEHICLES_DATA, ROUTE_PLANS } from "./data";
import GoogleMapsView from "./components/GoogleMapsView";

export default function App() {
  // Application Roles State
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.EV_OWNER);
  
  // App Configs / Global State
  const [userWalletBalance, setUserWalletBalance] = useState<number>(850.50);
  const [selectedVehicle, setSelectedVehicle] = useState<EVVehicleModel>(VEHICLES_DATA[0]);
  const [mapMode, setMapMode] = useState<"simulated" | "google">("simulated");
  const [userSoc, setUserSoc] = useState<number>(38); // State Of Charge percentage
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("All");
  const [selectedOperator, setSelectedOperator] = useState<string>("All");
  const [selectedConnector, setSelectedConnector] = useState<string>("All");
  const [showActiveSession, setShowActiveSession] = useState<boolean>(false);
  
  const [showGpayTopup, setShowGpayTopup] = useState<boolean>(false);
  const [gpayTopupAmount, setGpayTopupAmount] = useState<number>(500);
  const [gpayProcessingState, setGpayProcessingState] = useState<"idle" | "processing" | "success">("idle");
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "wallet">("upi");
  const isSessionAbortedRef = useRef<boolean>(false);
  
  // Selected Station for Info & Charging
  const [selectedStation, setSelectedStation] = useState<ChargerStation>(CHARGING_STATIONS_DATA[0]);

  // User Actual Live Location State using browser Geolocation API
  const [userLiveLocation, setUserLiveLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "requesting" | "success" | "denied" | "error">("idle");
  const [locationError, setLocationError] = useState<string>("");

  const requestLiveLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("error");
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setLocationStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLiveLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationStatus("success");
        setLocationError("");
      },
      (error) => {
        console.warn("Geolocation API error:", error);
        setLocationStatus("denied");
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Location permission denied. Utilizing simulated fallback network.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Position unavailable. Check status.");
            break;
          case error.TIMEOUT:
            setLocationError("GPS request timed out. Utilizing fallback.");
            break;
          default:
            setLocationError("Unknown location issue.");
        }
        // Fallback to coordinates of standard default Gateway of India, Mumbai
        if (!userLiveLocation) {
          setUserLiveLocation({ lat: 18.9220, lng: 72.8347 });
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  useEffect(() => {
    requestLiveLocation();
  }, []);
  
  // Interoperability Simulator State (OCPP / OCPI simulation)
  const [chargingInProgress, setChargingInProgress] = useState<boolean>(false);
  const [chargingSoc, setChargingSoc] = useState<number>(38);
  const [energyDeliveredKwh, setEnergyDeliveredKwh] = useState<number>(0);
  const [billAmount, setBillAmount] = useState<number>(0);
  const [ocppState, setOcppState] = useState<string>("Standby");
  const [ocppLogs, setOcppLogs] = useState<OCPPLogMessage[]>([]);
  const [showUpiQrPayment, setShowUpiQrPayment] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  const [generatedInvoice, setGeneratedInvoice] = useState<boolean>(false);
  
  // AI Interactive Route Planner State
  const [sourceRouteInput, setSourceRouteInput] = useState<string>("Mumbai (Gateway of India)");
  const [destRouteInput, setDestRouteInput] = useState<string>("Pune (Koregaon Park)");
  const [selectedRoutePreset, setSelectedRoutePreset] = useState<string>("mumbai-pune");
  const [isComputingRoute, setIsComputingRoute] = useState<boolean>(false);
  const [computedRouteData, setComputedRouteData] = useState<any>(ROUTE_PLANS[0]);
  
  // Gemini AI Assistant State
  const [showAiAssistant, setShowAiAssistant] = useState<boolean>(true);
  const [chatInput, setChatInput] = useState<string>("");
  const [aiLanguage, setAiLanguage] = useState<string>("English");
  const [isAiTyping, setIsAiTyping] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = useState<Array<{role: "user" | "assistant", content: string}>>([
    {
      role: "assistant",
      content: "Namaste! I am your Bharat EV Smart Assistant. I have unified coverage across Tata Power, Statiq, ChargeZone, and other networks. How can I assist you with charging standard checks, OCPP locks, dynamic status, or route schedules today?"
    }
  ]);

  // Voice Interaction Mock state
  const [isListening, setIsListening] = useState<boolean>(false);

  // Technical Operations & Health Metrics State
  const [technicianActiveMetric, setTechnicianActiveMetric] = useState<string>("temp");
  const [selectedDiagnosticsLog, setSelectedDiagnosticsLog] = useState<string>("");
  const [healthStations, setHealthStations] = useState<ChargerStation[]>(CHARGING_STATIONS_DATA);

  // Auto Scroll ref for OCPP message logs
  const logEndRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Alert simulation triggers
  const [alertDismissed, setAlertDismissed] = useState<boolean>(false);

  // Trigger automatic telemetry updates & logs
  useEffect(() => {
    const timer = setInterval(() => {
      // Simulate fluctuation in temperatures & connector availability
      setHealthStations(prev => prev.map(station => {
        const tempDelta = Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0;
        const connectorsRandom = Math.random() > 0.9 ? (Math.random() > 0.5 ? 1 : -1) : 0;
        const newAvailable = Math.max(0, Math.min(station.totalConnectors, station.availableConnectors + connectorsRandom));
        
        return {
          ...station,
          tempCelsius: Math.max(28, Math.min(65, station.tempCelsius + tempDelta)),
          availableConnectors: newAvailable
        };
      }));
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Update OCPP log auto scroll
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ocppLogs]);

  // Update AI Chat auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Live session updater
  useEffect(() => {
    let chargeTimer: any;
    if (chargingInProgress) {
      chargeTimer = setInterval(() => {
        setChargingSoc(prev => {
          if (prev >= 100) {
            setChargingInProgress(false);
            setOcppState("ChargingComplete_AwaitingPayment");
            addOcppLog("Info", "StatusNotification", "State of Charge reached 100%. Stop charging loop triggered.");
            addOcppLog("Call", "StopTransaction", `Stopped charging session at 100% SoC. Units: ${energyDeliveredKwh.toFixed(2)} kWh`);
            return 100;
          }
          
          // Increment energy delivered dynamically based on charger speed
          const speedFactor = selectedStation.powerOutputKw / 3600; // Charge delivered per second
          setEnergyDeliveredKwh(prevEnergy => {
            const added = prevEnergy + speedFactor * 10; // Simulated time step
            const price = added * selectedStation.pricingInrPerKwh;
            setBillAmount(price);
            return added;
          });

          return Math.min(100, prev + 1);
        });
      }, 1000);
    }
    return () => clearInterval(chargeTimer);
  }, [chargingInProgress, energyDeliveredKwh, selectedStation]);

  const addOcppLog = (type: "Call" | "CallResult" | "Info" | "Error", action: string, payload: string) => {
    const newLog: OCPPLogMessage = {
      timestamp: new Date().toLocaleTimeString(),
      type,
      action,
      payload
    };
    setOcppLogs(prev => [...prev, newLog]);
  };

  // Interoperability Launcher: Simulate UPI payment, OCPP authorization, and Live Charging
  const handleStartCharging = () => {
    // 1. Check if user wallet has minimum balance
    if (userWalletBalance < 200) {
      alert("Insufficient Balance in Unified Bharat EV Account. Minimum requirement for pre-authorization is ₹200. Please top up your dynamic wallet first.");
      return;
    }

    isSessionAbortedRef.current = false;
    setOcppLogs([]);
    setChargingSoc(userSoc);
    setEnergyDeliveredKwh(0);
    setBillAmount(0);
    setPaymentSuccess(false);
    setGeneratedInvoice(false);
    setShowActiveSession(true);

    // Run OCPP sequence
    setOcppState("Authorizing");
    addOcppLog("Call", "Authorize.req", `idToken: "BHARAT-EV-USER-${selectedVehicle.id.toUpperCase()}" via OCPP Roaming`);

    setTimeout(() => {
      if (isSessionAbortedRef.current) return;
      addOcppLog("CallResult", "Authorize.conf", "Status: 'Accepted', User authenticated under unified national interoperability agreements.");
      setOcppState("Booting");
      addOcppLog("Call", "BootNotification.req", `chargerId: "${selectedStation.id}", firmware: "v2.0.1+OCPP-Interop"`);
      
      setTimeout(() => {
        if (isSessionAbortedRef.current) return;
        addOcppLog("CallResult", "BootNotification.conf", `Status: 'Accepted', ServerTime: "${new Date().toISOString()}", Interval: 60s`);
        setOcppState("Connecting");
        addOcppLog("Call", "StatusNotification.req", "ConnectorId: 1, Status: 'Preparing', ErrorCode: 'NoError'");
        
        setTimeout(() => {
          if (isSessionAbortedRef.current) return;
          setOcppState("Charging");
          addOcppLog("Call", "StartTransaction.req", `ConnectorId: 1, idToken: 'BHARAT-EV', MeterStart: 5120, Timestamp: '${new Date().toISOString()}'`);
          addOcppLog("CallResult", "StartTransaction.conf", "TransactionId: 90281, Status: 'Accepted' - Current energy flow established.");
          setChargingInProgress(true);
        }, 1200);
      }, 1000);
    }, 1000);
  };

  const handleAbortSession = () => {
    isSessionAbortedRef.current = true;
    setChargingInProgress(false);
    setShowActiveSession(false);
    setOcppState("Standby");
  };

  const handleStopCharging = () => {
    setChargingInProgress(false);
    setOcppState("AwaitingPayment");
    addOcppLog("Call", "StopTransaction.req", `TransactionId: 90281, MeterStop: ${Math.round(5120 + energyDeliveredKwh)}, Reason: 'LocalUserRequest'`);
    addOcppLog("CallResult", "StopTransaction.conf", "Status: 'Accepted', Unified invoice locked. Releasing connector lock mechanism.");
  };

  const handlePayInvoice = () => {
    setShowUpiQrPayment(true);
  };

  const confirmUpiSuccess = () => {
    setShowUpiQrPayment(false);
    setPaymentSuccess(true);
    setUserSoc(chargingSoc); // Update global battery level to simulated final state
    addOcppLog("Info", "PaymentNotification", `UPI Payment cleared centrally. Txn ID: UPI${Math.floor(Math.random() * 899999 + 100000)}@oksbi`);
    setGeneratedInvoice(true);
  };

  const handlePayViaWallet = () => {
    const totalWithGst = billAmount * 1.18;
    if (userWalletBalance < totalWithGst) {
      alert(`Insufficient balance in your secure Bharat EV balance (Required: ₹${totalWithGst.toFixed(2)}). Please top up your wallet or pay via UPI QR.`);
      return;
    }
    setUserWalletBalance(prev => Math.max(0, prev - totalWithGst));
    setPaymentSuccess(true);
    setUserSoc(chargingSoc); // Update global battery level to simulated final state
    addOcppLog("Info", "PaymentNotification", `Central Wallet payment auto-debited. Txn ID: WALLET${Math.floor(Math.random() * 899999 + 100000)}@bharatev`);
    setGeneratedInvoice(true);
  };

  // AI Route calculation trigger
  const handleRouteCalculation = () => {
    setIsComputingRoute(true);
    // Find matching preset route
    const model = ROUTE_PLANS.find(r => r.id === selectedRoutePreset) || ROUTE_PLANS[0];
    
    setTimeout(() => {
      setComputedRouteData(model);
      setIsComputingRoute(false);
    }, 1200);
  };

  // Assistant Quick preset handler
  const handleQuickPreset = (query: string) => {
    setChatInput(query);
    triggerAssistantResponse(query);
  };

  // Send request to real Gemini Server Endpoint
  const triggerAssistantResponse = async (userQuery: string) => {
    if (!userQuery.trim()) return;
    
    const newHistory = [...chatHistory, { role: "user" as const, content: userQuery }];
    setChatHistory(newHistory);
    setChatInput("");
    setIsAiTyping(true);

    // Profile state for the assistant contexts matching Indian settings
    const userProfile = {
      vehicleSelected: selectedVehicle.name,
      batteryStandard: selectedVehicle.chargingStandard,
      currentSoc: userSoc,
      walletBalanceInr: userWalletBalance,
      cityContext: selectedStation.city
    };

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: newHistory,
          userProfile
        })
      });
      const data = await response.json();
      setChatHistory(prev => [...prev, { role: "assistant", content: data.response || "No response received." }]);
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [...prev, { 
        role: "assistant", 
        content: `I'm responding in safe mode. To charge your ${selectedVehicle.name} efficiently, please seek an active ${selectedVehicle.chargingStandard} DC charging hub. There's an active Tata Power point 1.2km away with zero waiting queue.` 
      }]);
    } finally {
      setIsAiTyping(false);
    }
  };

  // Virtual Speech Input Simulation
  const handleVoiceSimulate = () => {
    setIsListening(true);
    const IndianPhrases = [
      "Nearest fast charger with washroom facilities and cafes?",
      "Nexon EV me charge level low hone pe Lonavala highway pe best terminal batao?",
      "Why is my charger throwing OCPP connector locked fault status?",
      "What is the average tariff for DC CCS2 Fast charging in Mumbai?"
    ];
    const randomPhrase = IndianPhrases[Math.floor(Math.random() * IndianPhrases.length)];
    
    setTimeout(() => {
      setIsListening(false);
      setChatInput(randomPhrase);
    }, 1500);
  };

  // Add random custom invoice wallet top up
  const handleWalletTopup = () => {
    setGpayTopupAmount(500);
    setGpayProcessingState("idle");
    setShowGpayTopup(true);
  };

  // Haversine distance formula to compute distance in km between two GPS coordinates
  const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Determine user's current GPS search coordinates
  const userLatForSearch = userLiveLocation?.lat ?? 18.9220;
  const userLngForSearch = userLiveLocation?.lng ?? 72.8347;

  // Primary filtering step based on keyword, brand, and type choices
  const criteriaMatchedStations = healthStations.filter(station => {
    const matchesSearch = searchQuery.trim() === "" || 
                          station.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          station.operator.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          station.city.toLowerCase().includes(searchQuery.toLowerCase());
                          
    const matchesOperator = selectedOperator === "All" || station.operator === selectedOperator;
    
    const matchesConnector = selectedConnector === "All" || 
                              (selectedConnector === "DC Fast" && station.chargerType.includes("DC")) ||
                              (selectedConnector === "AC Slow" && station.chargerType.includes("AC"));

    const distToStation = getDistanceKm(userLatForSearch, userLngForSearch, station.latitude, station.longitude);
    const matchesCity = selectedCity === "All" || station.city === selectedCity || distToStation <= 100;
    
    return matchesSearch && matchesOperator && matchesConnector && matchesCity;
  });

  // Calculate dynamic radius based on matching criteria:
  // Starts with 25km. Expand automatically to 50km if < 10 stations found. Expand to 100km if < 5 stations found.
  let activeRadius = 25;
  const countWithin25 = criteriaMatchedStations.filter(s => getDistanceKm(userLatForSearch, userLngForSearch, s.latitude, s.longitude) <= 25).length;
  
  if (countWithin25 < 10) {
    activeRadius = 50;
    const countWithin50 = criteriaMatchedStations.filter(s => getDistanceKm(userLatForSearch, userLngForSearch, s.latitude, s.longitude) <= 50).length;
    if (countWithin50 < 5) {
      activeRadius = 100;
    }
  }

  // Filter criteria-matching stations down to those physically within computed active dynamic radius
  const filteredStations = criteriaMatchedStations.filter(s => {
    const dist = getDistanceKm(userLatForSearch, userLngForSearch, s.latitude, s.longitude);
    return dist <= activeRadius;
  });

  // Log active discovery debugging details (APIs + filter metrics)
  useEffect(() => {
    console.log("[CHARGER DISCOVERY API TELEMETRY LOG]", {
      totalStationsReturnedByAPI: healthStations.length,
      totalStationsAfterFiltering: criteriaMatchedStations.length,
      totalStationsRenderedOnMap: filteredStations.length,
      activeSearchRadiusKm: activeRadius,
      userLocation: { lat: userLatForSearch, lng: userLngForSearch }
    });
  }, [healthStations.length, criteriaMatchedStations.length, filteredStations.length, activeRadius, userLatForSearch, userLngForSearch]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900" id="bharat-ev-root">
      
      {/* 1. TOP MARQUEE NOTIFICATION BAR (No real/mock logs telemetry clutter in margins, keep clean state) */}
      <div className="bg-emerald-50 border-b border-emerald-100 py-2.5 px-4 sticky top-0 z-50 shadow-sm transition-all animate-fade-in" id="app-status-bar">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div className="text-xs md:text-sm text-emerald-800">
              <span className="font-semibold text-emerald-600">Bharat EV Roaming Core Live:</span> Interoperating 14,821+ Terminals centrally via automated dual OCPP/OCPI relays.
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-xs font-mono select-none">
            <div className="bg-emerald-100/80 border border-emerald-200/60 px-2.5 py-0.5 rounded text-emerald-800 font-medium">
              UPI Unified Wallet: <span className="font-sans font-bold text-slate-900">₹{userWalletBalance.toFixed(2)}</span>
            </div>
            <button 
              id="wallet-topup-btn"
              onClick={handleWalletTopup}
              className="text-xs text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-3 py-1 rounded-lg transition-all font-semibold shadow-sm flex items-center gap-1 active:scale-95 cursor-pointer"
            >
              <Zap className="w-3 h-3" /> Top-UP +₹500 (GPay)
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN HEADER APP BRAND & ROLE SELECTION */}
      <header className="bg-white border-b border-slate-200 py-4 px-4 shadow-sm sticky top-[41px] z-40" id="app-nav-header">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* Logo & Platform Tag */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-200">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-extrabold tracking-tight text-slate-900">
                  Bharat EV Charger AI
                </h1>
                <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full uppercase font-mono font-bold tracking-wider">
                  v2.2
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                UPI-Enabled Unified Roaming Interoperability Hub for India
              </p>
            </div>
          </div>

          {/* Active Navigation Perspectives targeting User Roles */}
          <div className="flex flex-wrap items-center justify-center bg-slate-100 border border-slate-200 p-1.5 rounded-xl" id="role-switches">
            <button
              id="role-tab-owner"
              onClick={() => setCurrentRole(UserRole.EV_OWNER)}
              className={`px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                currentRole === UserRole.EV_OWNER
                  ? "bg-white text-emerald-600 shadow-sm border border-slate-200/50"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-emerald-500" />
              <span>EV Owner Hub</span>
            </button>
            
            <button
              id="role-tab-planner"
              onClick={() => {
                setCurrentRole(UserRole.EV_OWNER);
                // Trick to show route section within context
                const section = document.getElementById('ai-route-planner-section');
                if (section) section.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm text-slate-600 hover:text-slate-900 transition-all flex items-center gap-1.5"
            >
              <Navigation className="w-3.5 h-3.5 text-teal-500 animate-pulse" />
              <span>AI Trip Route</span>
            </button>

            <button
              id="role-tab-fleet"
              onClick={() => setCurrentRole(UserRole.FLEET_MANAGER)}
              className={`px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                currentRole === UserRole.FLEET_MANAGER
                  ? "bg-white text-blue-600 shadow-sm border border-slate-200/50"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users className="w-3.5 h-3.5 text-blue-500" />
              <span>Fleet Manager Portal</span>
            </button>

            <button
              id="role-tab-operator"
              onClick={() => setCurrentRole(UserRole.OPERATOR)}
              className={`px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                currentRole === UserRole.OPERATOR
                  ? "bg-white text-amber-600 shadow-sm border border-slate-200/50"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-amber-500" />
              <span>Technician & IoT Core</span>
            </button>
          </div>
        </div>
      </header>

      {/* 3. HERO OVERVIEW / LIVE SUMMARY WIDGETS */}
      <section className="bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-8" id="platform-general-summary">
        <div className="max-w-7xl mx-auto">
          
          {/* Anomaly Highlight banner */}
          {!alertDismissed && (
            <div className="bg-gradient-to-r from-sky-50 via-teal-50 to-emerald-50 border border-teal-200 rounded-xl p-4 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in shadow-xs" id="health-warning-banner">
              <div className="flex gap-3">
                <div className="p-2.5 rounded-lg bg-teal-100/60 text-teal-700 mt-1 md:mt-0">
                  <AlertTriangle className="w-5 h-5 animate-bounce text-teal-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm md:text-base">
                    Predictive Model Diagnostics Check
                  </h4>
                  <p className="text-xs md:text-sm text-teal-950 mt-1 leading-relaxed">
                    Our AI models detected <span className="font-bold underline text-teal-700">vibration fluctuations & thermal peaks</span> at ChargeZone Lonavala (W-Ghat highway). Self-rectifying backup cooling trigger sent via OCCP. Fleet operations transit route re-optimized dynamically.
                  </p>
                </div>
              </div>
              <div className="flex gap-2.5 self-end md:self-center">
                <button 
                  id="inspect-re-optimize"
                  onClick={() => setCurrentRole(UserRole.OPERATOR)}
                  className="bg-teal-600 hover:bg-teal-500 active:scale-95 text-white text-xs px-4 py-2 rounded-lg font-bold transition-all shadow-sm"
                >
                  Inspect Telemetry
                </button>
                <button 
                  id="dismiss-health-alert"
                  onClick={() => setAlertDismissed(true)}
                  className="text-xs text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-100 px-3 py-2 rounded-lg font-medium transition"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Core Configuration & Status Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6" id="quick-stats-grid">
            
            {/* Active User EV Model Info */}
            <div className="bg-white hover:bg-slate-50/50 border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between transition-all shadow-xs" id="stat-card-vehicle">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Primary EV Config</span>
                <div className="p-1 px-2 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                  Unified CCS2
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <Battery className="w-6 h-6 animate-pulse" />
                </div>
                <div className="min-w-0 flex-1">
                  <select 
                    id="vehicle-selector"
                    value={selectedVehicle.id}
                    onChange={(e) => {
                      const v = VEHICLES_DATA.find(x => x.id === e.target.value);
                      if (v) setSelectedVehicle(v);
                    }}
                    className="bg-transparent text-sm font-extrabold text-slate-800 border-none focus:outline-none cursor-pointer pr-6"
                  >
                    {VEHICLES_DATA.map((v) => (
                      <option key={v.id} value={v.id} className="bg-white text-slate-800">{v.name}</option>
                    ))}
                  </select>
                  <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                    <span>SoC: </span>
                    <span className="text-emerald-600 font-bold">{userSoc}%</span>
                    <span>•</span>
                    <span className="truncate">Range: ~{Math.round(selectedVehicle.estimatedRangeKm * (userSoc/100))} km</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Savings Over Petrol */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between transition-all shadow-xs" id="stat-card-savings">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Net Monthly Savings</span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">+₹4,820</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <IndianRupee className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-base font-extrabold text-slate-800">
                    ₹0.95 / KM Tariff
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Petrol counterpart: ~₹7.20 / KM
                  </p>
                </div>
              </div>
            </div>

            {/* Carbon Offset */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between transition-all shadow-xs" id="stat-card-carbon">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Net Climate Offset</span>
                <span className="text-xs font-mono text-cyan-700 bg-cyan-50 px-2.5 py-0.5 rounded border border-cyan-100 font-bold text-[10px]">CO₂ NetZero</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-cyan-50 text-cyan-600 border border-cyan-100">
                  <Leaf className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-base font-extrabold text-slate-800">
                    284.5 KGs Saved
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Equates to 12.4 mature trees
                  </p>
                </div>
              </div>
            </div>

            {/* Network Congestion Prediction Index */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between transition-all shadow-xs" id="stat-card-congestion">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Congestion Index</span>
                <div className="text-[10px] text-amber-700 font-bold bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded">
                  Peak Hour (10am - 12pm)
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-amber-50 text-amber-600 border border-amber-105">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-base font-extrabold text-slate-800">
                    Waiting: 10 - 25m
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Dynamic pricing applied
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* 4. CHRONICLES OF ROLE SPECIFIC TILES */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="grid-core-layout">
            
            {/* LEFT / CENTER INTERACTIVE WORKSPACE (Takes 8 columns or 12 depending on visual sizes) */}
            <div className="lg:col-span-8 flex flex-col gap-8" id="interoperability-main-workspace">
              
              {/* PERSPECTIVE 1: EV OWNER & PLATFORM CORE DISCOVERY MAP */}
              {currentRole === UserRole.EV_OWNER && (
                <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden" id="ev-owner-discovery-panel">
                  
                  {/* Map Header */}
                  <div className="p-6 border-b border-slate-200/60 bg-gradient-to-r from-slate-50 to-white flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-emerald-500" /> Unified Discovery & Multi-Network Telemetry
                        </h2>
                        <p className="text-xs text-slate-500 mt-1 font-medium">
                          Search compatible chargers roaming flawlessly across Tata Power EZ, Statiq, ChargeZone, and Jio-bp Pulse.
                        </p>
                      </div>
                      <div className="text-xs bg-slate-50 rounded-lg p-2 px-3 border border-slate-200 flex items-center gap-2 text-slate-700 font-medium">
                        <span className="text-slate-500">City:</span>
                        <select 
                          id="city-filter"
                          value={selectedCity} 
                          onChange={(e) => setSelectedCity(e.target.value)}
                          className="bg-transparent text-slate-800 border-none focus:outline-none text-xs font-bold cursor-pointer"
                        >
                          <option value="All" className="bg-white text-slate-800">All India</option>
                          <option value="Delhi" className="bg-white text-slate-800">Delhi NCR</option>
                          <option value="Mumbai" className="bg-white text-slate-800">Mumbai</option>
                          <option value="Bengaluru" className="bg-white text-slate-800">Bengaluru</option>
                          <option value="Pune" className="bg-white text-slate-800">Pune</option>
                          <option value="Chennai" className="bg-white text-slate-800">Chennai</option>
                        </select>
                      </div>
                    </div>

                    {/* Filter controls */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-100/60 p-3 rounded-xl border border-slate-200" id="charger-filters-row">
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                          <Search className="w-3.5 h-3.5" />
                        </span>
                        <input
                          id="search-input"
                          type="text"
                          placeholder="Search landmark, brand..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="bg-white text-slate-800 text-xs rounded-lg pl-8 pr-2.5 py-2 w-full border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium shadow-2xs"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono font-bold">Brand</span>
                        <select
                          id="operator-filter"
                          value={selectedOperator}
                          onChange={(e) => setSelectedOperator(e.target.value)}
                          className="bg-white text-slate-800 text-xs rounded-lg p-2 w-full border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-2xs font-medium"
                        >
                          <option value="All">All Operators</option>
                          <option value="Tata Power">Tata Power</option>
                          <option value="Statiq">Statiq</option>
                          <option value="ChargeZone">ChargeZone</option>
                          <option value="Jio-bp">Jio-bp Pulse</option>
                          <option value="Bolt.Earth">Bolt.Earth</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono font-bold">Type</span>
                        <select
                          id="connector-filter"
                          value={selectedConnector}
                          onChange={(e) => setSelectedConnector(e.target.value)}
                          className="bg-white text-slate-800 text-xs rounded-lg p-2 w-full border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-2xs font-medium"
                        >
                          <option value="All">All Types</option>
                          <option value="DC Fast">DC Super Fast</option>
                          <option value="AC Slow">AC Destination</option>
                        </select>
                      </div>

                      {/* Matching Counter indicator */}
                      <div className="flex items-center justify-end text-xs text-slate-600 font-semibold px-2 self-center">
                        Found <span className="text-emerald-600 font-extrabold mx-1">{filteredStations.length}</span> Active stations
                      </div>
                    </div>
                  </div>

                  {/* MAP VIEW SELECTION TABS */}
                  <div className="flex border-b border-slate-250 bg-slate-50 p-1.5 gap-1.5" id="map-mode-selector">
                    <button
                      type="button"
                      onClick={() => setMapMode("simulated")}
                      className={`flex-1 max-w-[200px] py-1.5 text-center rounded-lg text-xs font-bold transition duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                        mapMode === "simulated"
                          ? "bg-white text-slate-800 shadow-sm border border-slate-200"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      🗺️ Simulated Indian Grid
                    </button>
                    <button
                      type="button"
                      onClick={() => setMapMode("google")}
                      className={`flex-1 max-w-[250px] py-1.5 text-center rounded-lg text-xs font-bold transition duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                        mapMode === "google"
                          ? "bg-white text-emerald-700 shadow-sm border border-emerald-300 font-extrabold animate-pulse"
                          : "text-slate-500 hover:text-emerald-600"
                      }`}
                    >
                      🔌 Live Google Map & Directions
                    </button>
                  </div>

                  {/* LIVE GPS POSITION CONTROL PANEL */}
                  <div className="bg-slate-900 text-slate-100 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs border-b border-slate-800" id="live-gps-hud-bar">
                    <div className="flex items-center gap-2">
                      <span className="flex h-2.5 w-2.5 relative shrink-0">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${locationStatus === 'success' ? 'bg-emerald-400' : 'bg-blue-400'}`}></span>
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${locationStatus === 'success' ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-bold text-[10px] text-white uppercase tracking-wider">Device LIVE GPS Stream</p>
                          {locationStatus === 'success' ? (
                            <span className="bg-emerald-500/10 text-emerald-400 text-[8px] font-extrabold px-1.5 py-0.5 rounded border border-emerald-500/30">Synced</span>
                          ) : locationStatus === 'requesting' ? (
                            <span className="bg-blue-500/15 text-blue-400 text-[8px] font-extrabold px-1.5 py-0.5 rounded border border-blue-500/30 animate-pulse">Requesting</span>
                          ) : (
                            <span className="bg-slate-800 text-slate-400 text-[8px] font-extrabold px-1.5 py-0.5 rounded border border-slate-700">Simulated</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-300 font-mono font-semibold mt-0.5">
                          {userLiveLocation 
                            ? `Lat ${userLiveLocation.lat.toFixed(5)} • Lon ${userLiveLocation.lng.toFixed(5)}` 
                            : 'Waiting for device authorization...'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
                      {/* Teleport / Preset buttons */}
                      <span className="text-[9.5px] text-slate-400 font-semibold font-mono hidden md:inline">Preset Hub:</span>
                      <select
                        id="gps-teleport-presets"
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "device") {
                            requestLiveLocation();
                          } else {
                            const [lat, lng] = val.split(",").map(Number);
                            setUserLiveLocation({ lat, lng });
                            setLocationStatus("success");
                            setLocationError("");
                          }
                        }}
                        className="bg-slate-950 text-slate-200 text-[10px] rounded border border-slate-800 p-1 px-2 font-bold focus:outline-none focus:border-blue-500 cursor-pointer shadow-inner h-7"
                        value={userLiveLocation ? `${userLiveLocation.lat},${userLiveLocation.lng}` : ""}
                      >
                        <option value="device">🔌 Force Browser Real GPS</option>
                        <option value="18.9220,72.8347">🎯 Mumbai Gateway Hub (West)</option>
                        <option value="28.6304,77.2177">🎯 Delhi Connaught Hub (North)</option>
                        <option value="12.9740,77.6101">🎯 Bengaluru MG Road Hub (South)</option>
                        <option value="13.0827,80.2707">🎯 Chennai Beach Road Hub (East)</option>
                        <option value="18.5204,73.8567">🎯 Pune Core Hub</option>
                      </select>

                      <button
                        type="button"
                        onClick={requestLiveLocation}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-2.5 py-1 rounded text-[10px] transition-all flex items-center gap-1 active:scale-95 cursor-pointer shadow-md h-7"
                        title="Re-request actual browser GPS coordinates"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${locationStatus === 'requesting' ? 'animate-spin' : ''}`} />
                        <span>Sync Device GPS</span>
                      </button>
                    </div>
                  </div>

                  {mapMode === "google" ? (
                    <GoogleMapsView
                      filteredStations={filteredStations}
                      selectedStation={selectedStation}
                      onSelectStation={(station) => {
                        setSelectedStation(station);
                        setChargingSoc(userSoc);
                      }}
                      selectedRoutePreset={selectedRoutePreset}
                      userLiveLocation={userLiveLocation}
                    />
                  ) : (
                    /* HIGH-FIDELITY VECTOR INTERACTIVE EV MAP LAYOUT (Mock UI Representation of Google Map with Marker hotspots) */
                    <div className="relative bg-[#F1F3F4] h-80 w-full overflow-hidden border-b border-slate-200" id="google-maps-emulator">
                      <div className="absolute inset-0 opacity-40 pointer-events-none select-none">
                        {/* Generates a gorgeous light-mode map style outline using standard CSS nodes */}
                        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                          <defs>
                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#CBD5E1" strokeWidth="0.5"/>
                            </pattern>
                          </defs>
                          <rect width="100%" height="100%" fill="url(#grid)" />
                          
                          {/* Interactive India highway lines illustration paths */}
                          <path d="M 50,50 Q 150,120 220,180 T 450,220 T 700,280" fill="none" stroke="#059669" strokeWidth="2.5" strokeDasharray="5,5" className="opacity-60" />
                          <path d="M 120,300 C 250,280 400,100 680,80" fill="none" stroke="#0891b2" strokeWidth="2" strokeDasharray="8,4" className="opacity-50" />
                          <path d="M 380,30 L 410,250 L 590,380" fill="none" stroke="#64748B" strokeWidth="1" className="opacity-30" />
                          
                          {/* Animated Radar Pulse circles for regional charging high-densities */}
                          <circle cx="280" cy="180" r="100" fill="none" stroke="#059669" strokeWidth="1.2" className="opacity-20 animate-pulse" />
                          <circle cx="450" cy="100" r="140" fill="none" stroke="#0891b2" strokeWidth="1" className="opacity-15" />
                        </svg>
                      </div>

                      {/* Dynamic Auto-scaling Map bounds generator */}
                      {(() => {
                        let minLon = 72.0;
                        let maxLon = 81.0;
                        let minLat = 11.0;
                        let maxLat = 29.5;

                        if (filteredStations.length > 0) {
                          const lons = filteredStations.map(s => s.longitude);
                          const lats = filteredStations.map(s => s.latitude);
                          const minS_lon = Math.min(...lons);
                          const maxS_lon = Math.max(...lons);
                          const minS_lat = Math.min(...lats);
                          const maxS_lat = Math.max(...lats);

                          const lonSpan = maxS_lon - minS_lon;
                          const latSpan = maxS_lat - minS_lat;

                          if (lonSpan < 0.25) {
                            minLon = minS_lon - 0.2;
                            maxLon = maxS_lon + 0.2;
                          } else {
                            minLon = minS_lon - lonSpan * 0.15;
                            maxLon = maxS_lon + lonSpan * 0.15;
                          }

                          if (latSpan < 0.25) {
                            minLat = minS_lat - 0.2;
                            maxLat = maxS_lat + 0.2;
                          } else {
                            minLat = minS_lat - latSpan * 0.15;
                            maxLat = maxS_lat + latSpan * 0.15;
                          }
                        }

                        return (
                          <>
                            {/* User Live Location Blue Marker in Simulated Indian Grid Map */}
                            {userLiveLocation && (() => {
                              const xPercent = ((userLiveLocation.lng - minLon) / (maxLon - minLon || 1)) * 80 + 10;
                              const yPercent = 100 - (((userLiveLocation.lat - minLat) / (maxLat - minLat || 1)) * 80 + 10);
                              return (
                                <div
                                  className="absolute transform -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-auto"
                                  style={{
                                    left: `${Math.max(5, Math.min(95, xPercent))}%`,
                                    top: `${Math.max(5, Math.min(95, yPercent))}%`
                                  }}
                                  id="simulated-my-location"
                                >
                                  <div className="relative flex items-center justify-center">
                                    <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-blue-500/40"></span>
                                    <div className="relative bg-blue-600 text-white rounded-full h-7 w-7 border-2 border-white flex items-center justify-center shadow-lg group">
                                      <Locate className="w-4 h-4 text-white animate-pulse" />
                                      {/* Tooltip */}
                                      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-900 border border-slate-700 text-white text-[8px] font-bold py-0.5 px-1.5 rounded shadow pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50">
                                        My Live GPS Position
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Animated vector connection mesh connecting active regional terminals */}
                            {filteredStations.length > 1 && (
                              <div className="absolute inset-0 pointer-events-none opacity-30">
                                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                  <path
                                    d={filteredStations.map((station, idx) => {
                                      const xPercent = ((station.longitude - minLon) / (maxLon - minLon || 1)) * 80 + 10;
                                      const yPercent = 100 - (((station.latitude - minLat) / (maxLat - minLat || 1)) * 80 + 10);
                                      return `${idx === 0 ? "M" : "L"} ${xPercent} ${yPercent}`;
                                    }).join(" ")}
                                    fill="none"
                                    stroke="#10B981"
                                    strokeWidth="1"
                                    strokeDasharray="2,2"
                                  />
                                </svg>
                              </div>
                            )}

                            {filteredStations.map((station) => {
                              const xPercent = ((station.longitude - minLon) / (maxLon - minLon || 1)) * 80 + 10;
                              const yPercent = 100 - (((station.latitude - minLat) / (maxLat - minLat || 1)) * 80 + 10);
                              const isSelected = selectedStation.id === station.id;

                              return (
                                <button
                                  key={station.id}
                                  id={`marker-${station.id}`}
                                  onClick={() => {
                                    setSelectedStation(station);
                                    setChargingSoc(userSoc);
                                  }}
                                  className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all p-1 hover:z-30 cursor-pointer focus:outline-none"
                                  style={{ 
                                    left: `${Math.max(5, Math.min(95, xPercent))}%`, 
                                    top: `${Math.max(5, Math.min(95, yPercent))}%` 
                                  }}
                                >
                                  <span className="relative flex items-center justify-center">
                                    
                                    {/* Glowing ring if selected */}
                                    {isSelected && (
                                      <span className="animate-ping absolute inline-flex h-9 w-9 rounded-full bg-emerald-500 opacity-50"></span>
                                    )}
                                    
                                    {/* Fast/Slow charger color code indicator pins */}
                                    <span className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-extrabold shadow-md border-2 transition-all ${
                                      isSelected 
                                        ? "bg-emerald-600 text-white border-white scale-120 z-20 shadow-emerald-200" 
                                        : station.chargerType.includes("DC")
                                          ? "bg-slate-900 text-cyan-300 border-cyan-400 hover:bg-slate-800" 
                                          : "bg-slate-800 text-teal-300 border-teal-400 hover:bg-slate-705"
                                    }`}>
                                      {station.operator === "Tata Power" ? "TP" : station.operator === "Statiq" ? "ST" : "CZ"}
                                    </span>

                                    {/* Hover tooltip label */}
                                    <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-[8px] font-bold border border-slate-700 p-0.5 px-1.5 rounded shadow-sm whitespace-nowrap pointer-events-none text-white font-mono">
                                      ₹{station.pricingInrPerKwh} | {station.powerOutputKw}kW
                                    </span>

                                  </span>
                                </button>
                              );
                            })}
                          </>
                        );
                      })()}

                      {/* Mini HUD map legend overlays */}
                      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md border border-slate-205 p-3 rounded-lg max-w-[210px] pointer-events-none shadow-sm" id="legend">
                        <p className="text-[9px] font-mono text-slate-500 font-extrabold tracking-wider mb-2">NETWORK COVERAGE</p>
                        
                        <div className="flex flex-col gap-1.5 text-[10px]">
                          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                            <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                            <span>DC CCS2 Super Fast Charger</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                            <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                            <span>AC Slow Type-2 Terminal</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex items-center justify-center text-[6px] text-white font-bold">✓</span>
                            <span>Roaming Connected (UPI)</span>
                          </div>
                        </div>
                      </div>

                      {selectedCity === "All" && (
                        <div className="absolute top-[135px] left-3 bg-indigo-50/98 border border-indigo-200/85 w-60 p-3 rounded-lg text-[10px] text-indigo-900 pointer-events-auto shadow-md flex items-start gap-2 animate-fade-in" id="all-india-view-helper">
                          <div className="p-0.5 mt-0.5 rounded bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 w-4 h-4 text-[9px] shrink-0 font-sans">💡</div>
                          <div>
                            <p className="font-extrabold text-indigo-950">National Roaming Grid Active</p>
                            <p className="text-indigo-700 font-medium mt-0.5 leading-relaxed text-[9.5px]">
                              Points are distant as they map Delhi, Mumbai & Bengaluru hubs (1,500+ km apart).
                            </p>
                            <button 
                              type="button"
                              onClick={() => setSelectedCity("Mumbai")}
                              className="bg-indigo-600 hover:bg-indigo-750 text-white font-extrabold px-2.5 py-1 rounded text-[9.5px] mt-2 block transition cursor-pointer"
                            >
                              Zoom into Mumbai-Pune Hub 🔎
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="absolute bottom-3 right-3 bg-white/95 border border-slate-205 p-2 rounded shadow-sm text-[9px] font-mono text-slate-700 flex flex-col items-end gap-0.5" id="map-telemetry">
                        <div className="flex items-center gap-1 text-slate-800 font-bold text-[8.5px]">
                          <span className={`w-1.5 h-1.5 rounded-full ${locationStatus === 'success' ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500 animate-pulse'}`}></span>
                          <span>🛰️ LIVE DEVICE GPS:</span>
                        </div>
                        <div>
                          Lat {userLiveLocation ? userLiveLocation.lat.toFixed(5) : "Searching..."} | Lon {userLiveLocation ? userLiveLocation.lng.toFixed(5) : "Searching..."}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* DISCOVERED CHARGING STATIONS NEARBY SECTION */}
                  <div className="p-6 bg-slate-50 border-y border-slate-200" id="nearby-chargers-grid-panel">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-emerald-600 animate-bounce" />
                          <span>Discovered Nearby Terminals</span>
                          <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                            {filteredStations.length} found
                          </span>
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          Dynamic search auto-adjusts based on your live GPS position.
                        </p>
                      </div>

                      {/* Active Resolution Tracker Badge */}
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full border shadow-3xs flex items-center gap-1.5 ${
                          activeRadius === 25 
                            ? "bg-blue-50 border-blue-200 text-blue-700" 
                            : activeRadius === 50 
                              ? "bg-amber-50 border-amber-200 text-amber-700"
                              : "bg-rose-50 border-rose-200 text-rose-700"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            activeRadius === 25 ? "bg-blue-500" : activeRadius === 50 ? "bg-amber-500" : "bg-rose-500"
                          } animate-pulse`}></span>
                          Sonar Radar: {activeRadius} km Range
                        </span>

                        <span className="text-[10px] bg-slate-150 border border-slate-200 text-slate-600 px-2.5 py-1 rounded-md font-mono font-extrabold">
                          DB Connectors: {healthStations.length}
                        </span>
                      </div>
                    </div>

                    {/* Adaptive notice for why radius was expanded */}
                    {activeRadius > 25 && (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4 text-[11px] text-amber-800 font-medium flex items-start gap-2 animate-fade-in" id="radius-expansion-alert">
                        <span className="mt-0.5">ℹ️</span>
                        <p className="leading-relaxed">
                          <strong className="font-extrabold">Auto-Expansion Activated:</strong> Fewer than {activeRadius === 50 ? "10" : "5"} charging stations were found within the standard 25 km threshold. The sonar grid automatically expanded to <strong className="font-extrabold">{activeRadius} km</strong> to query additional supported networks (Tata Power, Statiq, Jio-bp, ChargeZone, Bolt.Earth).
                        </p>
                      </div>
                    )}

                    {filteredStations.length === 0 ? (
                      <div className="bg-white border border-dashed border-slate-250 rounded-2xl p-8 text-center" id="no-stations-empty-state">
                        <p className="text-xs text-slate-500 font-medium">No valid stations found within search boundaries using active filters.</p>
                        <button 
                          type="button" 
                          onClick={() => {
                            setSearchQuery("");
                            setSelectedCity("All");
                            setSelectedOperator("All");
                            setSelectedConnector("All");
                          }}
                          className="text-[10px] text-emerald-600 font-extrabold underline block mt-2 mx-auto cursor-pointer"
                        >
                          Reset Filters to Expand Discovery 🌐
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in" id="discovered-stations-cards-grid">
                        {filteredStations.map((station) => {
                          const dist = getDistanceKm(userLatForSearch, userLngForSearch, station.latitude, station.longitude);
                          
                          // Custom color pairings for operators
                          const opColor = station.operator === "Tata Power" 
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                            : station.operator === "Statiq"
                              ? "bg-orange-50 border-orange-200 text-orange-850"
                              : station.operator === "ChargeZone"
                                ? "bg-purple-50 border-purple-200 text-purple-800"
                                : station.operator === "Jio-bp"
                                  ? "bg-sky-50 border-sky-200 text-sky-800"
                                  : "bg-indigo-50 border-indigo-200 text-indigo-800";
                            
                          // Status logic matches types & standards: Available, Busy, Offline
                          const isOffline = station.uptimeScore < 91 || station.tempCelsius > 55;
                          const statText = isOffline ? "Offline" : (station.availableConnectors > 0 ? "Available" : "Busy");
                          const statColor = statText === "Available"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-250 font-bold"
                            : statText === "Busy"
                              ? "bg-amber-100 text-amber-800 border-amber-250 font-bold"
                              : "bg-rose-150 text-rose-800 border-rose-250 font-bold";

                          return (
                            <div 
                              key={station.id}
                              onClick={() => {
                                setSelectedStation(station);
                                setChargingSoc(userSoc);
                              }}
                              className={`bg-white border rounded-xl p-4 flex flex-col justify-between hover:scale-[1.015] hover:shadow-xs transition-all cursor-pointer ${
                                selectedStation.id === station.id 
                                  ? "border-emerald-500 ring-2 ring-emerald-500/20" 
                                  : "border-slate-200 hover:border-slate-300"
                              }`}
                              id={`nearby-card-${station.id}`}
                            >
                              <div className="space-y-2">
                                {/* Brand Badge and Status Badging */}
                                <div className="flex items-center justify-between">
                                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${opColor}`}>
                                    {station.operator.toUpperCase()}
                                  </span>
                                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded border flex items-center gap-1 ${statColor}`}>
                                    {statText === "Available" && <span className="w-1 h-1 bg-emerald-600 rounded-full animate-ping"></span>}
                                    {statText}
                                  </span>
                                </div>

                                {/* Station Name */}
                                <h4 className="text-xs font-extrabold text-slate-800 leading-snug line-clamp-2">
                                  {station.name}
                                </h4>

                                {/* Latitude, Longitude, & Distance */}
                                <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono">
                                  <span>{station.latitude.toFixed(5)}N, {station.longitude.toFixed(5)}E</span>
                                  <span className="font-sans font-bold text-slate-900 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded shadow-3xs">
                                    📍 {dist.toFixed(1)} km away
                                  </span>
                                </div>

                                {/* Connectors list & availability */}
                                <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-[10px] text-slate-600 font-medium">
                                  <span>{station.chargerType}</span>
                                  <span className="font-sans font-extrabold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded shadow-3xs">
                                    Ports: {station.availableConnectors}/{station.totalConnectors}
                                  </span>
                                </div>
                              </div>

                              <button 
                                type="button"
                                className={`w-full text-center py-1.5 rounded-lg text-[10px] font-extrabold mt-3 transition-colors cursor-pointer ${
                                  selectedStation.id === station.id
                                    ? "bg-emerald-600 text-white shadow-3xs"
                                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
                                }`}
                              >
                                {selectedStation.id === station.id ? "⚡ Active Selected Station" : "Highlight & Lock Terminal"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* SELECTED CHARGER DETAILS AND ROAMING TRANSACTION TRIGGERS */}
                  <div className="p-6 bg-white" id="charger-roaming-action-panel">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Station details */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-slate-100 border border-slate-205 text-slate-700 px-2.5 py-0.5 rounded font-mono font-bold">
                            {selectedStation.operator.toUpperCase()} NETWORK
                          </span>
                          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span> OCPI Roaming Enabled
                          </span>
                        </div>
                        <h3 className="text-xl font-extrabold text-slate-900 mt-2">
                          {selectedStation.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
                          <span className="font-bold text-slate-700">{selectedStation.city} State Highway Hub</span>
                          <span>•</span>
                          <span>Active 24x7</span>
                        </p>

                        {/* Power ratings specs list */}
                        <div className="grid grid-cols-3 gap-2.5 my-4">
                          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center">
                            <span className="text-[9px] text-slate-500 block font-bold font-mono">POWER SUPPLY</span>
                            <span className="text-sm font-extrabold text-cyan-700 flex items-center justify-center gap-0.5 mt-0.5">
                              <Zap className="w-3.5 h-3.5 text-cyan-600" /> {selectedStation.powerOutputKw} kW
                            </span>
                          </div>
                          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center">
                            <span className="text-[9px] text-slate-500 block font-bold font-mono">CONNECTOR</span>
                            <span className="text-xs font-extrabold text-amber-700 block mt-1 tracking-wide">
                              {selectedStation.chargerType}
                            </span>
                          </div>
                          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center">
                            <span className="text-[9px] text-slate-500 block font-bold font-mono">TRANSPARENT FEE</span>
                            <span className="text-sm font-extrabold text-emerald-700 block mt-0.5">
                              ₹{selectedStation.pricingInrPerKwh}/kWh
                            </span>
                          </div>
                        </div>

                        {/* Queue indicators */}
                        <div className="flex items-center justify-between gap-3 bg-slate-50 p-2.5 px-3.5 rounded-lg border border-slate-200 mb-4" id="station-queue-hud">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-emerald-600 animate-pulse" />
                            <span className="text-xs text-slate-600 font-medium">Wait: <strong className="text-slate-800 font-bold">{selectedStation.avgWaitMins} mins</strong></span>
                          </div>
                          <span className="text-slate-300 font-light">|</span>
                          <div className="flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-cyan-600" />
                            <span className="text-xs text-slate-600 font-medium">Queue: <strong className="text-slate-800 font-bold">{selectedStation.queueLength} Vehicles ahead</strong></span>
                          </div>
                          <span className="text-slate-300 font-light">|</span>
                          <div className="flex items-center gap-1.5">
                            <Info className="w-4 h-4 text-slate-400" />
                            <span className="text-[10px] text-cyan-700 font-bold">Predictive Peak in 4h</span>
                          </div>
                        </div>

                        {/* Amenities lists */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] text-slate-500 font-mono font-bold">NEARBY AMENITIES:</span>
                          {selectedStation.amenities.map((amenity, idx) => (
                            <span key={idx} className="text-[10px] bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium shadow-3xs">
                              {amenity}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* ROAMING CONTROLLER / PLUG AND CHARGE METER SIMULATOR */}
                      <div className="bg-slate-50 rounded-xl p-5 border border-slate-205 flex flex-col justify-between shadow-xs" id="connector-control-dock">
                        <div className="mb-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold font-mono text-slate-500">CONNECTOR LOCK STATUS</span>
                            <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">OCPP 1.6/2.0.1+</span>
                          </div>
                          
                          {/* Hardware check display */}
                          <div className="bg-white rounded border border-slate-200 p-2.5 mt-2 flex items-center justify-between shadow-3xs">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-emerald-600" />
                              <span className="text-xs text-slate-700 font-medium">ISO 15118 Autocharge Handshake</span>
                            </div>
                            <span className="text-[9px] bg-emerald-50 border border-emerald-150 text-emerald-700 font-extrabold px-1.5 py-0.5 rounded">READY</span>
                          </div>

                          <div className="text-xs text-slate-600 mt-4 h-12 overflow-y-auto font-mono text-[10px] bg-white border border-slate-200 p-2.5 rounded shadow-3xs">
                            <p className="text-emerald-700 font-bold">&gt; Remote controller: STANDBY</p>
                            <p className="text-slate-500">&gt; WebClient connected. Ready for secure national QR roaming token handshake.</p>
                          </div>
                        </div>

                        {/* Start Charging trigger buttons */}
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <button
                              id="btn-plug-charge"
                              onClick={handleStartCharging}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <QrCode className="w-5 h-5 text-white animate-pulse" />
                              <span>Plug & Charge Roaming</span>
                            </button>
                            
                            <button
                              id="btn-scan-qr"
                              onClick={() => {
                                addOcppLog("Info", "CameraHandshake", "Custom client hardware QR code scanned successfully. ID: " + selectedStation.id);
                                handleStartCharging();
                              }}
                              className="bg-white hover:bg-slate-100 border border-slate-250 text-slate-700 p-3 rounded-xl transition-all shadow-sm cursor-pointer"
                              title="Scan QR Code to Interoperate"
                            >
                              <QrCode className="w-5 h-5 text-slate-600" />
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-500 text-center font-medium mt-1">
                            Authorized centrally with your secure Bharat EV balance. No need of multiple operator apps!
                          </p>
                        </div>

                      </div>

                    </div>
                  </div>

                </div>
              )}

              {/* PERSPECTIVE 2: FLEET MANAGER DASHBOARD */}
              {currentRole === UserRole.FLEET_MANAGER && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-6" id="fleet-manager-portal-panel">
                  
                  {/* Fleet Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-4">
                    <div>
                      <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" /> Unified Logistics Fleet Telematics Portal
                      </h2>
                      <p className="text-xs text-slate-500 mt-1 font-medium">
                        Monitor state-of-charge, tracking logistics locations, today's offset, and aggregate charging spend metrics.
                      </p>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-2.5 text-xs text-blue-800 font-extrabold self-start sm:self-center shadow-3xs flex items-center gap-2">
                      | Fleet Carbon Saving: <span className="text-emerald-700 font-extrabold">178.0 kg CO₂ Today</span>
                    </div>
                  </div>

                  {/* Grid layout for Fleet vehicle components */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="fleet-vehicles-grid">
                    {FLEET_VEHICLES_DATA.map((vehicle) => {
                      return (
                        <div key={vehicle.id} className="bg-white border border-slate-200 hover:border-blue-300 transition-all rounded-xl p-4 flex flex-col justify-between gap-3 shadow-xs hover:shadow-sm" id={`fleet-card-${vehicle.id}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-extrabold text-slate-600">{vehicle.plateNumber}</span>
                            <span className={`text-[10px] p-1 px-2.5 rounded-full font-extrabold ${
                              vehicle.status === "Charging" 
                                ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                                : vehicle.status === "Transit"
                                  ? "bg-blue-50 border border-blue-200 text-blue-700"
                                  : "bg-slate-100 border border-slate-200 text-slate-600 font-bold"
                            }`}>
                              {vehicle.status}
                            </span>
                          </div>

                          <div>
                            <p className="text-sm font-extrabold text-slate-900">{vehicle.model}</p>
                            <p className="text-xs text-slate-500 mt-0.5 font-medium">Driver: {vehicle.driverName}</p>
                          </div>

                          {/* State of Charge bar indicator info */}
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1 font-medium">
                              <span className="text-slate-500">State of Charge (SoC):</span>
                              <span className={`font-bold ${vehicle.soc < 20 ? "text-red-650 animate-pulse" : "text-emerald-600"}`}>{vehicle.soc}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/50">
                              <div 
                                className={`h-full rounded-full ${
                                  vehicle.soc < 20 
                                    ? "bg-red-500" 
                                    : vehicle.soc < 50 
                                      ? "bg-amber-500" 
                                      : "bg-emerald-500"
                                }`}
                                style={{ width: `${vehicle.soc}%` }}
                              ></div>
                            </div>
                            <p className="text-[10px] text-slate-500 font-bold text-right mt-1.5 font-mono">Est. range remains: ~{vehicle.rangeRemainingKm} km</p>
                          </div>

                          <div className="border-t border-slate-100 pt-2.5 grid grid-cols-2 text-center text-[10px] text-slate-500 font-medium">
                            <div>
                              <span className="block text-slate-400 font-bold">OFFSET TODAY</span>
                              <strong className="text-emerald-700 text-xs font-extrabold">{vehicle.todayCarbonOffsetKg} KGs</strong>
                            </div>
                            <div>
                              <span className="block text-slate-400 font-bold">TARIFF SPENT</span>
                              <strong className="text-slate-800 text-xs font-extrabold">₹{vehicle.todayChargingCostInr}</strong>
                            </div>
                          </div>

                          {/* Quick interactive dispatch action trigger */}
                          <div className="mt-2 text-center">
                            <button
                              id={`route-opt-${vehicle.id}`}
                              onClick={() => {
                                console.log(`Running AI dispatch router algorithm for vehicle ${vehicle.plateNumber}. Sending coordinates to driver terminal to secure priority charger pre-booking.`);
                              }}
                              className="w-full bg-slate-50 hover:bg-slate-100 active:scale-98 text-slate-700 hover:text-emerald-700 text-xs py-2 px-3 border border-slate-200 hover:border-emerald-250 transition-all rounded-lg font-bold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                            >
                              <Navigation className="w-3.5 h-3.5 text-slate-500" /> Re-Optimize Destination Route
                            </button>
                          </div>

                        </div>
                      );
                    })}
                  </div>

                  {/* Operational statistics graphs */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-3xs" id="fleet-carbon-analytics">
                    <h3 className="text-sm font-extrabold tracking-tight text-slate-800 uppercase mb-3 text-emerald-700 flex items-center gap-2">
                       Integrated Fleet Carbon Savings (Weekly Analytics)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="h-44 flex items-end justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                        {/* Interactive vertical histogram of carbon offset */}
                        {[35, 50, 75, 110, 140, 165, 178].map((kg, i) => {
                          const percentHeight = (kg / 180) * 100;
                          return (
                            <div key={i} className="flex flex-col items-center flex-1 group">
                              <span className="text-[10px] text-emerald-600 font-extrabold opacity-0 group-hover:opacity-100 transition-opacity mb-1">{kg}kg</span>
                              <div 
                                className="w-6 md:w-8 bg-gradient-to-t from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 rounded-t-md transition-all cursor-pointer shadow-3xs"
                                style={{ height: `${percentHeight}px` }}
                              ></div>
                              <span className="text-[9px] text-slate-400 font-mono mt-1 font-bold">Day {i + 1}</span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="text-xs text-slate-500 space-y-3 flex flex-col justify-center font-medium">
                        <p className="bg-slate-50 border border-slate-200 p-3 rounded-lg leading-relaxed text-slate-700">
                          📌 <strong className="text-slate-900">AI Green Operations Insight:</strong> Your fleet has reduced reliance on standard diesel mini-truck cargo runs by moving freight to digital EV equivalents. Dynamic route pre-booking has shaved off approximately <strong className="text-emerald-700 font-bold">42 idle wait hours</strong> this paycycle!
                        </p>
                        <ul className="space-y-1.5 text-slate-600 pl-1">
                          <li>• Aggregate CO₂ offset: <strong className="text-emerald-700 font-extrabold">653.2 Kg</strong></li>
                          <li>• Roaming Interop utilization: <strong className="text-emerald-700 font-extrabold">92.4%</strong></li>
                          <li>• Average cost per kWh negotiated: <strong className="text-cyan-700 font-extrabold">₹14.80</strong></li>
                        </ul>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* PERSPECTIVE 3: OPERATOR & TECHNICIAN TELEMETRY HUB */}
              {currentRole === UserRole.OPERATOR && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-6" id="technician-diagnostics-panel">
                  
                  {/* IoT Telemetry Title info */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200/60 pb-4">
                    <div>
                      <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-amber-500" /> IoT Telemetry & Predictive Charger Failure Engine
                      </h2>
                      <p className="text-xs text-slate-500 mt-1 font-medium">
                        Monitor hardware temperature peaks, vibro-acoustic anomaly index scores, and standard live OCPP 2.0.1 stream requests.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500">Track Metric:</span>
                      <div className="bg-slate-100 border border-slate-200 p-0.5 rounded-lg flex text-xs font-semibold shadow-3xs">
                        <button 
                          id="btn-metric-temp"
                          onClick={() => setTechnicianActiveMetric("temp")}
                          className={`px-3 py-1 rounded transition-all cursor-pointer ${technicianActiveMetric === "temp" ? "bg-white text-slate-900 select-none font-bold shadow-2xs" : "text-slate-500 hover:text-slate-800"}`}
                        >
                          Temp Gauge
                        </button>
                        <button 
                          id="btn-metric-anomaly"
                          onClick={() => setTechnicianActiveMetric("anomaly")}
                          className={`px-3 py-1 rounded transition-all cursor-pointer ${technicianActiveMetric === "anomaly" ? "bg-white text-slate-900 select-none font-bold shadow-2xs" : "text-slate-500 hover:text-slate-800"}`}
                        >
                          Anomaly Score
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Stations grid under monitoring */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="operator-stations-telemetry-grid">
                    {healthStations.map((station) => {
                      const tempColor = station.tempCelsius > 50 ? "text-red-600 animate-pulse bg-red-50" : station.tempCelsius > 40 ? "text-amber-600" : "text-emerald-600";
                      const anomalyRating = station.vibrationAnomalyScore;
                      const hasAlert = anomalyRating > 0.4 || station.tempCelsius > 50;
                      const isSelected = selectedStation.id === station.id;

                      return (
                        <div 
                          key={station.id} 
                          id={`op-card-${station.id}`}
                          onClick={() => setSelectedStation(station)}
                          className={`bg-white p-4 rounded-xl border transition-all cursor-pointer ${
                            isSelected 
                              ? "border-amber-500 ring-1 ring-amber-500 shadow-sm bg-amber-50/10" 
                              : "border-slate-200 hover:border-slate-300 shadow-2xs"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono font-bold text-slate-500">{station.operator.toUpperCase()} NETWORK</span>
                            {hasAlert && (
                              <span className="px-1.5 py-0.2 select-none bg-cyan-50 text-cyan-700 text-[8px] rounded border border-cyan-150 font-bold animate-pulse">
                                AI RUNNING
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 truncate">{station.name}</h4>
                          <p className="text-[9px] text-slate-400 mt-0.5">{station.chargerType} • {station.powerOutputKw}kW</p>

                          <div className="mt-3 space-y-2 border-t border-slate-100 pt-2 text-[11px] font-medium">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">IoT Core Temp:</span>
                              <strong className={`${tempColor} font-mono px-1 rounded`}>{station.tempCelsius}°C</strong>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 font-mono">Uptime Score:</span>
                              <strong className="text-emerald-600">{station.uptimeScore}%</strong>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">Vibration Anomaly:</span>
                              <strong className={anomalyRating > 0.4 ? "text-amber-600" : "text-slate-500"}>
                                {anomalyRating.toFixed(2)}
                              </strong>
                            </div>
                          </div>

                          {/* Quick remote hardware action triggers */}
                          <div className="mt-3.5 pt-2 border-t border-slate-100 flex gap-1.5">
                            <button
                              id={`reset-hardware-${station.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                addOcppLog("Call", "Reset.req", `chargerId: "${station.id}", ResetType: "Soft"`);
                                setTimeout(() => {
                                  addOcppLog("CallResult", "Reset.conf", "Status: 'Accepted' - Hardware terminal reboot cycle completed successfully.");
                                }, 1000);
                              }}
                              className="flex-1 bg-white hover:bg-slate-50 border border-slate-205 text-[9px] font-bold text-amber-600 p-1 rounded transition shadow-3xs cursor-pointer"
                            >
                              Soft Reset
                            </button>
                            <button
                              id={`trigger-fan-${station.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                addOcppLog("Info", "AuxCoolOverdrive", `E-Cool active: overload mitigation overrides established. Unit details: ${station.id}`);
                              }}
                              className="text-[9px] bg-white hover:bg-slate-55 text-cyan-700 border border-slate-205 rounded transition px-2 font-bold shadow-3xs cursor-pointer"
                              title="Engage Supplementary Heat Sinks"
                            >
                              Aux Cool
                            </button>
                          </div>

                        </div>
                      );
                    })}
                  </div>

                  {/* Diagnostic details */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200" id="diagnostic-deeper-panel">
                    <h3 className="text-xs font-extrabold tracking-tight text-slate-800 uppercase mb-3 text-cyan-705">
                      Predictive Maintenance & Fault Tree Analysis: {selectedStation.name}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* Health score widget */}
                      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-3xs flex flex-col justify-between align-middle text-center">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Charger Overall Health Score</span>
                        <div className="text-3xl font-extrabold font-mono text-emerald-600 my-2">
                          {selectedStation.id === "lonavala-cz-01" ? "84.2%" : "99.4%"}
                        </div>
                        <div className="text-xs text-slate-500 leading-relaxed font-semibold">
                          {selectedStation.id === "lonavala-cz-01" ? (
                            <span className="text-amber-600">⚠️ Risk identified: Fan heat peak of 58°C with moderate vibracoustic telemetry alerts. Scheduled diagnostic trip in 12 hours.</span>
                          ) : (
                            <span className="text-emerald-600 font-bold">✓ Status Green: Operating inside optimal safety parameters. Diagnostic telemetry reports zero errors.</span>
                          )}
                        </div>
                      </div>

                      {/* Diagnostic Log simulated box */}
                      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-3xs flex flex-col justify-between md:col-span-2">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono">Downtime Analytics & Hardware Fault Log</span>
                        <div className="font-mono text-xs text-slate-700 space-y-1.5 mt-2 bg-slate-50 border border-slate-200 p-2.5 rounded h-28 overflow-y-auto">
                          <p className="text-slate-500">[2026-06-10 10:24] ConnectStatus: Status 'Available' - No active diagnostic faults.</p>
                          <p className="text-slate-500">[2026-06-10 11:05] Hardware status report: Cabin internal fan running normal.</p>
                          {selectedStation.id === "lonavala-cz-01" && (
                            <>
                              <p className="text-red-600 font-bold">[ALERT] Predictive Failure Alert: Temperature 58°C exceeded nominal thresholds (Nominal: 45°C).</p>
                              <p className="text-cyan-700 font-bold">[ACTION] Adaptive power throttle algorithm engaged - restricted power peaks to 150kW dynamically.</p>
                            </>
                          )}
                          <p className="text-slate-500">[2026-06-10 12:12] SelfCheck trigger: Verified current OCPI protocol interoperability checksum. Passed.</p>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>
              )}

              {/* 5. INTERACTIVE TRIP AND OPTIMAL CHARGING ROUTE PLANNER (Always responsive & integrated in main list) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-5 text-slate-800" id="ai-route-planner-section">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200/60 pb-4">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-cyan-600 animate-pulse" /> AI-Powered National Highway Route & Interop Planner
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 font-semibold">
                      Our unified platform computes optimum route stops, predicting state-of-charge, peak wait congestion, and pricing overheads.
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-2 rounded-lg shadow-3xs">
                    <span className="text-[10px] font-mono text-slate-500 font-bold">Weather/Thermal model:</span>
                    <span className="text-xs text-cyan-700 font-extrabold bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">Active (39-44°C)</span>
                  </div>
                </div>

                {/* Left/Right input controls */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
                  
                  {/* Select Route Preset */}
                  <div className="md:col-span-5 flex flex-col gap-1.5">
                    <label className="text-xs text-slate-500 font-bold" htmlFor="route-preset">Configure Expressway Route</label>
                    <select
                      id="route-preset"
                      value={selectedRoutePreset}
                      onChange={(e) => {
                        setSelectedRoutePreset(e.target.value);
                        const match = ROUTE_PLANS.find(r => r.id === e.target.value);
                        if (match) {
                          setSourceRouteInput(match.source);
                          setDestRouteInput(match.destination);
                        }
                      }}
                      className="bg-slate-50 text-slate-800 text-xs md:text-sm p-3 rounded-lg border border-slate-200 focus:outline-none focus:border-cyan-500 w-full font-bold shadow-3xs cursor-pointer"
                    >
                      <option value="mumbai-pune">Mumbai to Pune Highway (NH 48) - 150 km</option>
                      <option value="delhi-agra">Yamuna Expressway (Delhi to Agra) - 230 km</option>
                      <option value="blr-chennai">Bengaluru to Chennai corridor - 340 km</option>
                    </select>
                  </div>

                  {/* Battery SoC percent slider */}
                  <div className="md:col-span-4 flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs text-slate-500 font-bold">
                      <label htmlFor="route-start-soc">Current Vehicle battery (SoC)</label>
                      <span className="text-emerald-700 font-extrabold">{userSoc}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        id="route-start-soc"
                        type="range"
                        min="5"
                        max="100"
                        value={userSoc}
                        onChange={(e) => setUserSoc(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600 border border-slate-200"
                      />
                    </div>
                  </div>

                  {/* Action trigger button */}
                  <div className="md:col-span-3">
                    <button
                      id="btn-compute-route"
                      onClick={handleRouteCalculation}
                      disabled={isComputingRoute}
                      className="w-full text-white font-extrabold bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-xs py-3 rounded-xl transition duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg cursor-pointer"
                    >
                      {isComputingRoute ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>AI Computing...</span>
                        </>
                      ) : (
                        <>
                          <Compass className="w-4 h-4 text-white animate-pulse" />
                          <span>Generate Optimum Stops</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>

                {/* Graphical computed routes result panel */}
                {computedRouteData && (
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 mt-2 flex flex-col gap-5 animate-fade-in" id="route-output-results">
                    
                    {/* Header metrics */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-white p-3 rounded-lg border border-slate-200 shadow-3xs font-medium">
                      <div>
                        <span className="text-slate-500 font-bold">ROUTING:</span> <strong className="text-slate-800 font-extrabold">{computedRouteData.source} ➔ {computedRouteData.destination}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 font-bold">IMPACT CORRIDOR:</span> <strong className="text-amber-700 font-extrabold">{computedRouteData.difficulty}</strong>
                      </div>
                    </div>

                    {/* Timeline visualization */}
                    <div className="relative py-4" id="highway-timeline-track">
                      
                      <div className="absolute top-1/2 left-4 right-4 h-1 bg-slate-200 rounded transform -translate-y-1/2" id="timeline-line"></div>
                      
                      <div className="relative z-10 flex justify-between items-center px-2">
                        
                        {/* Start node */}
                        <div className="flex flex-col items-center bg-slate-50">
                          <div className="w-8 h-8 rounded-full bg-white border-2 border-emerald-600 flex items-center justify-center text-xs text-emerald-700 font-bold shadow-md">
                            A
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono mt-1 text-center font-bold">START</span>
                          <span className="text-[10px] text-slate-700 font-bold">{computedRouteData.source.substring(0,10)}...</span>
                          <span className="text-[10px] text-emerald-700 font-extrabold">{userSoc}% SOC</span>
                        </div>

                        {/* Mid stop recommended nodes */}
                        {computedRouteData.stops.map((stop: any, index: number) => {
                          return (
                            <div key={index} className="flex flex-col items-center bg-slate-50">
                              <div className="w-10 h-10 rounded-full bg-white border-2 border-cyan-500 flex items-center justify-center text-xs text-cyan-600 font-extrabold shadow-md animate-pulse">
                                Stop
                              </div>
                              <span className="text-[10px] text-cyan-600 font-mono mt-1 font-bold">KM {stop.kmMarker} Marker</span>
                              <span className="text-[10px] text-slate-800 font-bold text-center underline max-w-[150px] truncate">{stop.name}</span>
                              <span className="text-[9px] text-slate-500 bg-white border border-slate-200 p-0.5 px-2 rounded-md font-semibold mt-1 shadow-3xs">Wait: {stop.queueWaitTime} • {stop.powerOutputKw}kW</span>
                            </div>
                          );
                        })}

                        {/* Destination node */}
                        <div className="flex flex-col items-center bg-slate-50">
                          <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-400 flex items-center justify-center text-xs text-slate-600 font-bold shadow-md">
                            B
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono mt-1 text-center font-bold">DEST</span>
                          <span className="text-[10px] text-slate-700 font-bold">{computedRouteData.destination.substring(0,12)}...</span>
                          <span className="text-[10px] text-cyan-705 font-extrabold">Est. Remaining SOC: ~42%</span>
                        </div>

                      </div>

                    </div>

                    {/* Estimated stats row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center border-t border-slate-200 pt-4">
                      <div className="bg-white border border-slate-200 shadow-3xs p-2.5 rounded-lg">
                        <span className="text-[9px] text-slate-450 block uppercase font-bold font-mono">Estimated travel time</span>
                        <span className="text-sm font-extrabold text-slate-800 flex items-center justify-center gap-1 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" /> {computedRouteData.baseEtaHours} hours
                        </span>
                      </div>
                      <div className="bg-white border border-slate-200 shadow-3xs p-2.5 rounded-lg">
                        <span className="text-[9px] text-slate-450 block uppercase font-bold font-mono">Total corridor Distance</span>
                        <span className="text-sm font-extrabold text-slate-800 flex items-center justify-center gap-1 mt-0.5">
                          <Navigation className="w-3.5 h-3.5 text-slate-500" /> {computedRouteData.distanceKm} Kilometers
                        </span>
                      </div>
                      <div className="bg-white border border-slate-200 shadow-3xs p-2.5 rounded-lg">
                        <span className="text-[9px] text-slate-450 block uppercase font-bold font-mono">Dynamic Cost Estimation</span>
                        <span className="text-sm font-extrabold text-emerald-700 flex items-center justify-center gap-1 mt-0.5">
                          ₹{selectedVehicle.id === "ioniq-5" ? "420" : "280"} (Unified Roaming pricing)
                        </span>
                      </div>
                    </div>

                    <div className="bg-cyan-50 border border-cyan-100 p-3 rounded-lg flex items-start gap-2 text-xs font-semibold">
                      <Sparkles className="w-4 h-4 text-cyan-600 mt-0.5 shrink-0 animate-pulse" />
                      <p className="text-cyan-800 leading-relaxed">
                        🤖 <strong className="text-cyan-950 font-extrabold">Intelligent Recommendation Engine:</strong> We recommend executing a 15-minute quick top up at Lonavala highway stop to guarantee healthy thermal balance. This mitigates heavy altitude battery drain over the Western-Ghat Sahyadri mountain climbs of NH 48.
                      </p>
                    </div>

                  </div>
                )}

              </div>

            </div>

            {/* 6. RIGHT SIDEBAR PERSISTENT CONVERSATIONAL GEMINI AI ASSISTANT (4 columns) */}
            <div className="lg:col-span-4 flex flex-col gap-6" id="right-conversational-ai-agent">
              
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden sticky top-[95px]" id="integrated-gemini-assistant-panel">
                
                {/* Assistant Tab Header */}
                <div className="p-4 bg-white border-b border-slate-150 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                      <Bot className="w-5 h-5 animate-pulse text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1">
                        Bharat EV AI Twin <Sparkles className="w-3 h-3 text-emerald-600" />
                      </h3>
                      <p className="text-[10px] text-slate-500 font-bold">Powered by Gemini 3.5 Flash</p>
                    </div>
                  </div>

                  {/* Multi-lingual dropdown selection info */}
                  <select
                    id="assistant-lang-selector"
                    value={aiLanguage}
                    onChange={(e) => setAiLanguage(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-[10px] p-1 px-1.5 rounded text-slate-700 font-bold focus:outline-none cursor-pointer shadow-3xs"
                  >
                    <option value="English">English</option>
                    <option value="Hindi/Hinglish">Hindi (हिंदी)</option>
                    <option value="Tamil">Tamil (தமிழ்)</option>
                    <option value="Marathi">Marathi (मराठी)</option>
                  </select>
                </div>

                {/* Info summary ticker */}
                <div className="bg-slate-50 px-3.5 py-2.5 border-b border-slate-150 text-[10px] text-slate-500 font-bold flex items-center justify-between">
                  <span>Context: <strong className="text-emerald-700">{selectedVehicle.name}</strong></span>
                  <span>Standard: <strong className="text-slate-750">{selectedVehicle.chargingStandard}</strong></span>
                  <span>State: <strong className="text-slate-750">{selectedStation.city}</strong></span>
                </div>

                {/* Assistant Conversation logs */}
                <div className="p-4 h-[350px] overflow-y-auto space-y-3 bg-white" id="assistant-chat-stream">
                  {chatHistory.map((msg, index) => {
                    const isAssistant = msg.role === "assistant";
                    return (
                      <div 
                        key={index} 
                        className={`flex gap-2 max-w-[85%] ${isAssistant ? "self-start mr-auto" : "self-end ml-auto flex-row-reverse"}`}
                      >
                        <div className={`p-3 rounded-2xl text-xs leading-relaxed font-semibold ${
                          isAssistant 
                            ? "bg-slate-50 border border-slate-150 text-slate-800 rounded-tl-none shadow-3xs" 
                            : "bg-emerald-600 border border-emerald-705 text-white rounded-tr-none shadow-xs"
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    );
                  })}
                  {isAiTyping && (
                    <div className="flex gap-2 max-w-[80%] self-start mr-auto">
                      <div className="bg-slate-50 border border-slate-150 p-3 rounded-2xl text-xs rounded-tl-none flex items-center gap-1.5 text-slate-500 font-bold shadow-3xs">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-605" />
                        <span>Bharat EV AI twin is speaking...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Quick Presets list buttons */}
                <div className="p-3 bg-slate-50 border-t border-slate-150 flex flex-col gap-1.5" id="agent-presets-list">
                  <p className="text-[9px] text-slate-500 font-mono font-bold">TRUSTED QUICK COMMANDS</p>
                  
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      id="pcmd-nearest"
                      onClick={() => handleQuickPreset("Where is the nearest CCS2 Fast Charger compatible to my vehicle?")}
                      className="text-[9px] bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 p-1.5 rounded font-bold truncate max-w-full text-left shadow-3xs cursor-pointer"
                    >
                      📍 Show Nearest DC Station
                    </button>
                    <button
                      id="pcmd-hindi"
                      onClick={() => {
                        setAiLanguage("Hindi/Hinglish");
                        handleQuickPreset("नमस्ते! चार्जिंग दर क्या है और वॉलेट कैसे काम करता है?");
                      }}
                      className="text-[9px] bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 p-1.5 rounded font-bold truncate max-w-full text-left shadow-3xs cursor-pointer"
                    >
                      🇮🇳 हिंदी में मदद करें (Hinglish/Hindi)
                    </button>
                    <button
                      id="pcmd-ocpp-error"
                      onClick={() => handleQuickPreset("How do I fix an OCPP connector locking error on public terminals?")}
                      className="text-[9px] bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 p-1.5 rounded font-bold truncate max-w-full text-left shadow-3xs cursor-pointer"
                    >
                      🔧 Fix Connector Locking state
                    </button>
                    <button
                      id="pcmd-cheapest"
                      onClick={() => handleQuickPreset("Which Indian charging operators are currently cheapest for highway DC runs?")}
                      className="text-[10px] bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 p-1.5 rounded font-bold truncate max-w-full text-left shadow-3xs cursor-pointer"
                    >
                      💰 Compare national Tariffs
                    </button>
                  </div>
                </div>

                {/* Input Control Box */}
                <div className="p-3 bg-white border-t border-slate-150" id="assistant-input-dock">
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      triggerAssistantResponse(chatInput);
                    }}
                    className="flex gap-2 items-center"
                  >
                    <button
                      type="button"
                      id="btn-voice-sim"
                      onClick={handleVoiceSimulate}
                      className={`p-2 rounded-lg border transition cursor-pointer ${
                        isListening 
                          ? "bg-red-50 text-red-650 border-red-300 animate-pulse" 
                          : "bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-800 hover:bg-slate-100 shadow-3xs"
                        }`}
                      title="Simulate Voice Command with Regional dialect"
                    >
                      {isListening ? <Volume2 className="w-4 h-4" /> : <Mic className="w-4 h-4 text-slate-500" />}
                    </button>
                    
                    <input
                      id="ai-chat-input"
                      type="text"
                      placeholder={isListening ? "Listening dialecally..." : "Ask in English, हिंदी, தமிழ்..."}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 focus:outline-none focus:border-emerald-500 focus:bg-white text-xs text-slate-800 font-medium placeholder-slate-405"
                    />

                    <button
                      type="submit"
                      id="btn-send-chat"
                      className="bg-emerald-600 text-white hover:bg-emerald-55 p-2 rounded-lg transition shadow-sm cursor-pointer"
                    >
                      <Send className="w-4 h-4 text-white" />
                    </button>
                  </form>
                </div>

              </div>

            </div>

          </div>

        </div>
      </section>

      {showGpayTopup && (
        <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-md flex items-center justify-center p-4 selection:bg-emerald-100 animate-fade-in" id="gpay-topup-portal-overlay">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl p-6 relative" id="gpay-topup-card">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-sm">
                  G
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">Google Pay Portal</h4>
                  <p className="text-[10px] text-slate-405 font-bold tracking-wider uppercase">Secure BHIM UPI Gateway</p>
                </div>
              </div>
              <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-mono text-slate-500 font-bold">NPCI Secure</span>
            </div>

            {gpayProcessingState === "idle" && (
              <div className="mt-6 space-y-5">
                <div className="text-center">
                  <p className="text-xs text-slate-500 font-semibold">Select top-up credit amount for your Bharat EV Wallet:</p>
                  
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {[100, 200, 500, 1000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setGpayTopupAmount(amt)}
                        className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          gpayTopupAmount === amt
                            ? "bg-emerald-50 text-emerald-750 border-emerald-400 font-extrabold"
                            : "bg-slate-50 text-slate-705 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between font-medium">
                    <span>Payee Name:</span>
                    <strong className="text-slate-800">Ministry of Power BEV-Core</strong>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>VPA Handle:</span>
                    <strong className="text-slate-800 font-mono">gov.mop.bev@oksbi</strong>
                  </div>
                  <div className="flex justify-between font-medium border-t border-slate-200 pt-1.5 mt-1.5 text-sm">
                    <span className="text-slate-900 font-extrabold">Final Transfer sum:</span>
                    <strong className="text-emerald-700 font-extrabold">₹{gpayTopupAmount.toFixed(2)}</strong>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    id="btn-confirm-gpay-transfer"
                    onClick={() => {
                      setGpayProcessingState("processing");
                      setTimeout(() => {
                        setUserWalletBalance(prev => prev + gpayTopupAmount);
                        setGpayProcessingState("success");
                      }, 1300);
                    }}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-55 text-white font-bold py-2.5 text-xs rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Confirm UPI Transfer
                  </button>
                  <button
                    id="btn-cancel-gpay"
                    onClick={() => setShowGpayTopup(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold py-2.5 text-xs rounded-lg transition-all cursor-pointer text-center"
                  >
                    Cancel & Go Back
                  </button>
                </div>
              </div>
            )}

            {gpayProcessingState === "processing" && (
              <div className="py-12 flex flex-col items-center text-center space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
                <div>
                  <p className="text-xs text-slate-700 font-extrabold animate-pulse">Awaiting NPCI/GPay App authorization...</p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">Please approve the transfer request sent on your linked Google Pay app.</p>
                </div>
              </div>
            )}

            {gpayProcessingState === "success" && (
              <div className="py-6 flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-300">
                  <Check className="w-6 h-6 text-emerald-600 font-black" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-slate-900">Top-up Successful!</p>
                  <p className="text-xs text-slate-505 font-semibold mt-1">
                    Added <strong className="text-emerald-700 font-extrabold">₹{gpayTopupAmount.toFixed(2)}</strong> to your electronic Bharat EV roaming balance.
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono mt-2 font-bold">Rrn Number: MOP-{Math.floor(Math.random() * 89999 + 10000)}</p>
                </div>
                
                <button
                  id="btn-gpay-success-done"
                  onClick={() => setShowGpayTopup(false)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 text-xs rounded-lg transition cursor-pointer"
                >
                  Return to Dashboard
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {showActiveSession && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" id="interop-launcher-modal">
          <div className="bg-white border border-slate-200 w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[500px]" id="session-modal-container">
            
            {/* Left Box: Live Charging telemetry stats */}
            <div className="flex-1 p-6 bg-slate-50 flex flex-col justify-between border-r border-slate-200">
              
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] bg-slate-200 border border-slate-300 text-slate-700 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                    {selectedStation.operator.toUpperCase()} TERMINAL ACTIVE
                  </span>
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>

                <h3 className="text-base font-extrabold text-slate-900">
                  {selectedStation.name}
                </h3>
                <p className="text-xs text-slate-505 mt-1 font-semibold">
                  Unified charging portal for {selectedVehicle.name} ({selectedVehicle.chargingStandard})
                </p>
                
                {/* Circle Progress meter info */}
                <div className="py-6 flex flex-col items-center">
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    
                    {/* SVG ring */}
                    <svg className="w-full h-full transform -rotate-90">
                      <circle 
                        cx="72" 
                        cy="72" 
                        r="60" 
                        className="stroke-slate-200" 
                        strokeWidth="8" 
                        fill="transparent" 
                      />
                      <circle 
                        cx="72" 
                        cy="72" 
                        r="60" 
                        className="stroke-emerald-600 transition-all duration-1000" 
                        strokeWidth="8" 
                        fill="transparent" 
                        strokeDasharray={`${2 * Math.PI * 60}`}
                        strokeDashoffset={`${2 * Math.PI * 60 * (1 - chargingSoc / 100)}`}
                      />
                    </svg>

                    <div className="absolute text-center">
                      <span className="text-3xl font-extrabold font-mono text-slate-800">
                        {chargingSoc}%
                      </span>
                      <span className="block text-[9px] text-slate-400 font-mono font-bold">SOC ESTIMATED</span>
                    </div>
                  </div>

                  <p className="text-[11px] font-bold text-center mt-3 text-cyan-705">
                    {chargingInProgress ? `Supercharging at ${selectedStation.powerOutputKw} kW rate...` : "Stopped. Secure billing locks finalized."}
                  </p>
                </div>
              </div>

              {/* Instant Metering variables box */}
              <div className="grid grid-cols-2 gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-center">
                  <span className="text-[9px] text-slate-400 font-bold block">ENERGY DELIVERED</span>
                  <span className="text-sm font-extrabold font-mono text-slate-800">
                    {energyDeliveredKwh.toFixed(2)} kWh
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-[9px] text-slate-400 font-bold block">RUNNING BILL AMOUNT</span>
                  <span className="text-sm font-extrabold font-mono text-emerald-700">
                    ₹{billAmount.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Action buttons footer */}
              <div className="mt-4 flex flex-col gap-2 w-full">
                {ocppState === "Authorizing" || ocppState === "Booting" || ocppState === "Connecting" ? (
                  <div className="flex flex-col gap-3 w-full items-center text-center p-3 bg-slate-100/60 rounded-xl border border-slate-205">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">Establishing OCPP Core Link</p>
                      <p className="text-[10px] text-slate-500 font-medium">State: {ocppState} Protocol Handshake</p>
                    </div>
                    <button
                      id="btn-abort-initiation"
                      onClick={handleAbortSession}
                      className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2.5 text-xs rounded-lg transition cursor-pointer"
                    >
                      Cancel & Go Back to Map
                    </button>
                  </div>
                ) : chargingInProgress ? (
                  <button
                    id="btn-cancel-charging"
                    onClick={handleStopCharging}
                    className="w-full bg-red-55 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold py-2.5 rounded-lg transition-all cursor-pointer text-center"
                  >
                    Emergency Stop (OCPP Stop)
                  </button>
                ) : (
                  <div className="flex flex-col gap-2 w-full">
                    {!paymentSuccess ? (
                      <>
                        {/* Interactive Payment Method Picker */}
                        <div className="bg-slate-100/80 p-1 rounded-lg border border-slate-200 flex gap-1 mb-1" id="payment-method-selector">
                          <button
                            type="button"
                            onClick={() => setPaymentMethod("upi")}
                            className={`flex-1 py-1.5 text-center rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                              paymentMethod === "upi"
                                ? "bg-white text-slate-800 shadow-3xs"
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            Scan UPI QR
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod("wallet")}
                            className={`flex-1 py-1.5 text-center rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                              paymentMethod === "wallet"
                                ? "bg-white text-slate-800 shadow-3xs"
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            EV Wallet Balance
                          </button>
                        </div>

                        {paymentMethod === "upi" ? (
                          <div className="space-y-2 w-full font-sans">
                            <button
                              id="btn-pay-now-upi"
                              onClick={handlePayInvoice}
                              className="w-full bg-emerald-600 text-white font-bold text-xs py-2.5 rounded-lg hover:bg-emerald-55 transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <IndianRupee className="w-4 h-4 text-white" /> Pay via UPI (₹{(billAmount * 1.18).toFixed(2)})
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2 w-full">
                            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-600 space-y-1">
                              <div className="flex justify-between font-bold">
                                <span>Wallet Balance:</span>
                                <span className={userWalletBalance >= (billAmount * 1.18) ? "text-slate-800 font-extrabold" : "text-red-650 font-extrabold"}>
                                  ₹{userWalletBalance.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between font-bold border-t border-slate-200/50 pt-1">
                                <span>Aggregate Bill (with GST):</span>
                                <span className="text-slate-800 font-extrabold">₹{(billAmount * 1.18).toFixed(2)}</span>
                              </div>
                            </div>
                            
                            {userWalletBalance < (billAmount * 1.18) ? (
                              <div className="space-y-2">
                                <p className="text-[10px] text-red-650 font-bold text-center">
                                  ⚠️ Insufficient balance to pay via wallet.
                                </p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setGpayTopupAmount(500);
                                    setGpayProcessingState("idle");
                                    setShowGpayTopup(true);
                                  }}
                                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                  <Zap className="w-3.5 h-3.5" /> Top Up ₹500 via GPay
                                </button>
                              </div>
                            ) : (
                              <button
                                id="btn-pay-now-wallet"
                                onClick={handlePayViaWallet}
                                className="w-full bg-emerald-600 hover:bg-emerald-55 text-white font-bold text-xs py-2.5 rounded-lg transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                              >
                                <CheckCircle className="w-4 h-4 text-white" /> Deduct & Pay via Wallet (₹{(billAmount * 1.18).toFixed(2)})
                              </button>
                            )}
                          </div>
                        )}

                        <button
                          id="btn-close-session-abort"
                          onClick={() => {
                            setShowActiveSession(false);
                            setPaymentSuccess(false);
                          }}
                          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-705 text-xs font-bold py-2.5 rounded-lg transition-all border border-slate-200 cursor-pointer text-center font-sans"
                        >
                          Cancel & Go Back to Map
                        </button>
                      </>
                    ) : (
                      <button
                        id="btn-close-session"
                        onClick={() => {
                          setShowActiveSession(false);
                          setPaymentSuccess(false);
                        }}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-705 text-xs font-bold py-2.5 rounded-lg transition-all border border-slate-200 cursor-pointer text-center font-sans"
                      >
                        Close Portal (Unlock connector)
                      </button>
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* Right Box: Live OCPP 2.0.1 standard logger for ISO standards verification */}
            <div className="flex-1 bg-white p-6 flex flex-col justify-between border-l border-slate-250 relative">
              
              <div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 mb-3">
                  <span className="text-xs font-mono font-extrabold text-slate-500">OCPP 2.0.1 XML-JSON LOGGER</span>
                  <span className="text-[9px] text-slate-400 font-bold font-mono bg-slate-100 p-0.5 px-2 rounded">Standard OCPP</span>
                </div>
                <p className="text-[10px] text-slate-505 font-semibold">
                  This panel streams the central transaction messages between hardware terminals and the national interoperability gateway:
                </p>

                {/* Simulated message stream logs container */}
                <div className="font-mono text-[9px] text-slate-705 space-y-2.5 mt-3.5 bg-slate-50 border border-slate-200 p-3 rounded-lg h-56 overflow-y-auto" id="ocpp-terminal-logs font-mono">
                  {ocppLogs.length === 0 && (
                    <p className="text-slate-400 italic font-bold">Initiating OCPP physical state handshakes...</p>
                  )}
                  {ocppLogs.map((log, idx) => {
                    const color = log.type === "Call" ? "text-cyan-705" : log.type === "CallResult" ? "text-emerald-705" : log.type === "Error" ? "text-red-650" : "text-slate-550";
                    return (
                      <div key={idx} className="border-b border-slate-200/40 pb-1.5 leading-relaxed font-semibold">
                        <span className="text-slate-400 mr-1">[{log.timestamp}]</span>
                        <span className="text-slate-400 mr-1.5 uppercase font-bold">{log.type}:</span>
                        <strong className={`${color}`}>{log.action}</strong>
                        <p className="text-slate-500 mt-0.5 text-[8.5px] truncate font-medium">{log.payload}</p>
                      </div>
                    );
                  })}
                  <div ref={logEndRef} />
                </div>
              </div>

              {/* UPI QR PAYMENT WIDGET MODAL OVERWRITER SCREEN */}
              {showUpiQrPayment && (
                <div className="absolute inset-0 bg-white/98 backdrop-blur-sm p-6 flex flex-col justify-between items-center text-center animate-fade-in animate-duration-300 z-10" id="upi-qr-overlay">
                  <div>
                    <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
                      BHARAT INTEROPERABLE QR CODES
                    </span>
                    <h4 className="text-base font-extrabold text-slate-900 mt-4">
                      BHARAT EV UNIFIED GATEWAY (UPI)
                    </h4>
                    <p className="text-xs text-slate-505 font-semibold mt-1">
                      Scan with any UPI App (Google Pay, PhonePe, Paytm, BHIM)
                    </p>
                  </div>

                  {/* QR Core placeholder vector */}
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl my-4 select-none flex flex-col items-center">
                    <QrCode className="w-36 h-36 text-slate-800 animate-pulse" />
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-2 font-mono">BHARAT-EV-PAY@ybl</span>
                  </div>

                  <div className="w-full max-w-xs flex flex-col gap-2.5">
                    <div className="text-xs text-slate-605 font-bold flex items-center justify-center gap-1">
                      Total Payable Invoice Amount: <strong className="text-emerald-705 font-extrabold font-mono text-sm">₹{billAmount.toFixed(2)}</strong>
                    </div>
                    <button
                      id="confirm-upi-success"
                      onClick={confirmUpiSuccess}
                      className="w-full bg-emerald-600 hover:bg-emerald-55 text-white font-bold py-2.5 text-xs rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      Simulate UPI Clear Confirmation
                    </button>
                    <button
                      id="cancel-upi-btn"
                      onClick={() => setShowUpiQrPayment(false)}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold py-2.5 text-xs rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      Cancel & Go Back
                    </button>
                  </div>
                </div>
              )}

              {/* Payment Success Invoice Details */}
              {paymentSuccess && (
                <div className="absolute inset-0 bg-white/99 p-6 flex flex-col justify-between" id="invoice-details-card">
                  <div>
                    <div className="text-center">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-250 mx-auto">
                        <CheckCircle className="w-6 h-6 text-emerald-600" />
                      </div>
                      <h4 className="text-base font-extrabold text-slate-900 mt-2">
                        Digital Payment Invoice Generated
                      </h4>
                      <p className="text-xs text-slate-505 font-medium mt-1">
                        Transaction cleared securely under Ministry of Power Unified Interoperability standard.
                      </p>
                    </div>

                    <div className="mt-6 border-t border-b border-slate-200 py-3.5 space-y-2 text-xs font-mono text-slate-605 font-bold" id="invoice-metrics">
                      <div className="flex justify-between">
                        <span>Invoice Number:</span> <strong className="text-slate-800">INV-2026-90281</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Terminal Point:</span> <strong className="text-slate-800 max-w-[140px] truncate">{selectedStation.name}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Energy flow aggregate:</span> <strong className="text-slate-800">{energyDeliveredKwh.toFixed(2)} kWh</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Average Tariff per unit:</span> <strong className="text-slate-800">₹{selectedStation.pricingInrPerKwh} / kWh</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Central CGST + SGST (18%):</span> <strong className="text-slate-800">₹{(billAmount * 0.18).toFixed(2)}</strong>
                      </div>
                      <div className="flex justify-between border-t border-dashed border-slate-200 pt-2 text-sm text-slate-900">
                        <span className="text-slate-505 font-extrabold">Aggregate Paid:</span> <strong className="text-emerald-705 font-extrabold">₹{(billAmount * 1.18).toFixed(2)}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      id="invoice-email-sim"
                      onClick={() => alert(`Sending dynamic transaction invoice to vikash.yadav9911@gmail.com associated with your secure Bharat EV Profile account.`)}
                      className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-705 text-xs font-bold py-2 rounded-lg border border-slate-300 transition flex items-center justify-center gap-1.5 shadow-3xs cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500" /> Email PDF Invoice
                    </button>
                    <button
                      id="close-completed-session"
                      onClick={() => {
                        setShowActiveSession(false);
                        setPaymentSuccess(false);
                      }}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-55 text-white font-bold text-xs py-2 rounded-lg transition cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}

              {/* Bottom diagnostics verification status */}
              <div className="text-[10px] text-slate-450 font-bold text-center flex items-center justify-center gap-1" id="national-security-seal">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Secure payment and OCCP relay certified by BEE & National Power Authority
              </div>

            </div>

          </div>
        </div>
      )}

      {/* 8. STELLAR DESIGNED FOOTER */}
      <footer className="mt-auto bg-slate-50 border-t border-slate-200 py-10 px-6 text-slate-500 text-xs" id="footer-credits">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-left md:max-w-xl">
            <h4 className="text-sm font-extrabold text-slate-800">Bharat EV Charger AI</h4>
            <p className="text-xs text-slate-505 mt-1.5 font-medium leading-relaxed">
              Ministry of New and Renewable Energy Interoperability Prototype Initiative. Designed with Google Maps, UPI QR payment networks, and OCPP failure prediction models.
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-1.5 text-slate-505 font-medium">
            <p className="flex items-center gap-2">
              <span className="text-emerald-500 animate-pulse font-extrabold">●</span> Unified Roaming status: <strong className="text-slate-750">99.88% Global Uptime</strong>
            </p>
            <p className="text-[11px] text-slate-440">
              Assigned Development Port: 3000 • In coordination with Tata Power EZ Net & Statiq Roaming standard.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
