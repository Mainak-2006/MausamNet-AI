import { AlertSeverity, ReportSource, UserRole, VerificationStatus, WeatherEvent } from './enums';
export interface Coordinates {
    lat: number;
    latitude?: number;
    lng: number;
    longitude?: number;
}
export interface Location {
    city: string;
    state: string;
    country: string;
    coordinates: Coordinates;
}
export interface WeatherReport {
    id: string;
    title: string;
    description: string;
    eventType: WeatherEvent;
    source: ReportSource;
    verificationStatus: VerificationStatus;
    credibilityScore: number;
    location: Location;
    userId?: string;
    mediaIds?: string[];
    confidence?: number;
    createdAt: string;
    updatedAt: string;
}
export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    createdAt: string;
    updatedAt: string;
}
export interface Media {
    id: string;
    reportId: string;
    url: string;
    publicId: string;
    mimeType: string;
    createdAt: string;
}
export interface Alert {
    id: string;
    reportId: string;
    severity: AlertSeverity;
    message: string;
    isActive: boolean;
    createdAt: string;
}
export interface ClassificationResult {
    eventType: WeatherEvent;
    confidence: number;
}
export interface CredibilityResult {
    score: number;
    factors: Record<string, number>;
}
export interface DuplicateResult {
    isDuplicate: boolean;
    similarity: number;
    duplicateOf?: string;
}
