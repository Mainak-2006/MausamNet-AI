// Weather event types supported by the platform
export enum WeatherEvent {
  RAINFALL = 'rainfall',
  FLOOD = 'flood',
  THUNDERSTORM = 'thunderstorm',
  HEATWAVE = 'heatwave',
  STRONG_WIND = 'strong_wind',
  CYCLONE = 'cyclone',
  DROUGHT = 'drought',
  OTHER = 'other',
}

export const WEATHER_EVENT_TYPES: WeatherEvent[] = Object.values(WeatherEvent);

// Source of a report
export enum ReportSource {
  CITIZEN = 'citizen',
  OPENWEATHER = 'openweather',
  IMD = 'imd',
}

export const REPORT_SOURCES: ReportSource[] = Object.values(ReportSource);

// Report verification status
export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  UNVERIFIED = 'unverified',
  SUSPICIOUS = 'suspicious',
}

export const VERIFICATION_STATUSES: VerificationStatus[] = Object.values(
  VerificationStatus,
);

// User roles
export enum UserRole {
  CITIZEN = 'citizen',
  ADMIN = 'admin',
}

// Alert severity levels
export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export const ALERT_SEVERITIES: AlertSeverity[] = Object.values(AlertSeverity);
