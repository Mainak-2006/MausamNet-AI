export declare enum WeatherEvent {
    RAINFALL = "rainfall",
    FLOOD = "flood",
    THUNDERSTORM = "thunderstorm",
    HEATWAVE = "heatwave",
    STRONG_WIND = "strong_wind",
    CYCLONE = "cyclone",
    DROUGHT = "drought",
    OTHER = "other"
}
export declare const WEATHER_EVENT_TYPES: WeatherEvent[];
export declare enum ReportSource {
    CITIZEN = "citizen",
    OPENWEATHER = "openweather",
    IMD = "imd"
}
export declare const REPORT_SOURCES: ReportSource[];
export declare enum VerificationStatus {
    PENDING = "pending",
    VERIFIED = "verified",
    UNVERIFIED = "unverified",
    SUSPICIOUS = "suspicious"
}
export declare const VERIFICATION_STATUSES: VerificationStatus[];
export declare enum UserRole {
    CITIZEN = "citizen",
    ADMIN = "admin"
}
export declare enum AlertSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare const ALERT_SEVERITIES: AlertSeverity[];
