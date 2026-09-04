"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALERT_SEVERITIES = exports.AlertSeverity = exports.UserRole = exports.VERIFICATION_STATUSES = exports.VerificationStatus = exports.REPORT_SOURCES = exports.ReportSource = exports.WEATHER_EVENT_TYPES = exports.WeatherEvent = void 0;
var WeatherEvent;
(function (WeatherEvent) {
    WeatherEvent["RAINFALL"] = "rainfall";
    WeatherEvent["FLOOD"] = "flood";
    WeatherEvent["THUNDERSTORM"] = "thunderstorm";
    WeatherEvent["HEATWAVE"] = "heatwave";
    WeatherEvent["STRONG_WIND"] = "strong_wind";
    WeatherEvent["CYCLONE"] = "cyclone";
    WeatherEvent["DROUGHT"] = "drought";
    WeatherEvent["OTHER"] = "other";
})(WeatherEvent || (exports.WeatherEvent = WeatherEvent = {}));
exports.WEATHER_EVENT_TYPES = Object.values(WeatherEvent);
var ReportSource;
(function (ReportSource) {
    ReportSource["CITIZEN"] = "citizen";
    ReportSource["OPENWEATHER"] = "openweather";
    ReportSource["IMD"] = "imd";
})(ReportSource || (exports.ReportSource = ReportSource = {}));
exports.REPORT_SOURCES = Object.values(ReportSource);
var VerificationStatus;
(function (VerificationStatus) {
    VerificationStatus["PENDING"] = "pending";
    VerificationStatus["VERIFIED"] = "verified";
    VerificationStatus["UNVERIFIED"] = "unverified";
    VerificationStatus["SUSPICIOUS"] = "suspicious";
})(VerificationStatus || (exports.VerificationStatus = VerificationStatus = {}));
exports.VERIFICATION_STATUSES = Object.values(VerificationStatus);
var UserRole;
(function (UserRole) {
    UserRole["CITIZEN"] = "citizen";
    UserRole["ADMIN"] = "admin";
})(UserRole || (exports.UserRole = UserRole = {}));
var AlertSeverity;
(function (AlertSeverity) {
    AlertSeverity["LOW"] = "low";
    AlertSeverity["MEDIUM"] = "medium";
    AlertSeverity["HIGH"] = "high";
    AlertSeverity["CRITICAL"] = "critical";
})(AlertSeverity || (exports.AlertSeverity = AlertSeverity = {}));
exports.ALERT_SEVERITIES = Object.values(AlertSeverity);
//# sourceMappingURL=enums.js.map