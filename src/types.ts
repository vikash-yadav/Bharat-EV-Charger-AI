export enum UserRole {
  EV_OWNER = "EV Owner",
  FLEET_MANAGER = "Fleet Manager",
  OPERATOR = "Charging Network Operator",
  TECHNICIAN = "Service Technician",
  SYSTEM_ADMIN = "System Administrator"
}

export interface ChargerStation {
  id: string;
  name: string;
  operator: "Tata Power" | "Statiq" | "ChargeZone" | "Jio-bp" | "Bolt.Earth";
  city: "Mumbai" | "Delhi" | "Bengaluru" | "Pune" | "Chennai";
  latitude: number;
  longitude: number;
  totalConnectors: number;
  availableConnectors: number;
  chargerType: "AC Type-2" | "DC CCS2 Fast" | "GB/T Fast";
  powerOutputKw: number; // e.g. 7.2, 22, 60, 120
  pricingInrPerKwh: number;
  queueLength: number;
  avgWaitMins: number;
  uptimeScore: number; // percentage (e.g. 99.4)
  tempCelsius: number;
  vibrationAnomalyScore: number; // 0 to 1 scaling
  amenities: string[];
  ratings: number;
  reviewsCount: number;
}

export interface EVVehicleModel {
  id: string;
  name: string;
  brand: string;
  batteryCapacityKwh: number;
  estimatedRangeKm: number;
  maxDcChargingRateKw: number;
  chargingStandard: "CCS2" | "Type-2" | "GB/T";
}

export interface FleetVehicle {
  id: string;
  plateNumber: string;
  model: string;
  status: "Charging" | "Idle" | "Transit" | "Maintenance";
  soc: number; // State of Charge %
  rangeRemainingKm: number;
  driverName: string;
  todayCarbonOffsetKg: number;
  todayChargingCostInr: number;
}

export interface OCPPLogMessage {
  timestamp: string;
  type: "Call" | "CallResult" | "Info" | "Error";
  action: string;
  payload: string;
}

export interface RouteStop {
  stationId: string;
  stationName: string;
  arrivalSoc: number;
  chargeTimeMins: number;
  costInr: number;
  addedSoc: number;
}
