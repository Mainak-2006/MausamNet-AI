import type {
  AlertSeverity,
  ReportSource,
  UserRole,
  VerificationStatus,
  WeatherEvent,
  WeatherCurrent,
  WeatherForecastDay,
  WeatherLocation,
  WeatherProvider,
  WeatherResponse,
  WeatherSourceResult,
} from '@mausamnet/shared';

export type {
  WeatherCurrent,
  WeatherForecastDay,
  WeatherLocation,
  WeatherProvider,
  WeatherResponse,
  WeatherSourceResult,
};

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface User extends AuthUser {
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  id: string;
  userId: string;
  title: string;
  description: string;
  eventType: WeatherEvent;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  country: string;
  source: ReportSource;
  sourceUrl: string | null;
  reportDate: string;
  verificationStatus: VerificationStatus;
  credibilityScore: number;
  isDuplicate: boolean;
  duplicateOfId: string | null;
  createdAt: string;
  updatedAt: string;
  user?: User;
  media?: Media[];
  verifications?: Verification[];
  alerts?: Alert[];
}

export interface PaginatedReports {
  data: Report[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ReportFilters {
  page?: number;
  limit?: number;
  eventType?: WeatherEvent;
  verificationStatus?: VerificationStatus;
  city?: string;
  state?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface CreateReportDto {
  title: string;
  description: string;
  eventType: WeatherEvent;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  country?: string;
  source?: ReportSource;
  sourceUrl?: string;
  reportDate: string;
}

export interface NearbyReport {
  reportId: string;
  reportTitle: string;
  reportLatitude: number;
  reportLongitude: number;
  reportEventType: string;
  reportCity: string;
  reportState: string;
  distance: number;
}

export interface Verification {
  id: string;
  reportId: string;
  userId: string;
  status: VerificationStatus;
  notes: string | null;
  createdAt: string;
  user?: User;
}

export interface CreateVerificationDto {
  reportId: string;
  status: VerificationStatus;
  notes?: string;
}

export interface Alert {
  id: string;
  reportId: string;
  title: string;
  message: string;
  eventType: WeatherEvent;
  severity: AlertSeverity;
  isActive: boolean;
  createdAt: string;
  report?: Report;
}

export interface CreateAlertDto {
  reportId: string;
  title: string;
  message: string;
  severity?: AlertSeverity;
}

export interface ClassificationInput {
  text: string;
  reportId?: string;
}

export interface ClassificationResult {
  eventType: WeatherEvent;
  confidence: number;
  probabilities: Record<string, number>;
}

export interface CredibilityInput {
  text: string;
  source: ReportSource;
  hasMedia?: boolean;
  hasLocation?: boolean;
  reportId?: string;
}

export interface CredibilityResult {
  score: number;
  factors: Record<string, number>;
}

export interface DuplicateResult {
  isDuplicate: boolean;
  similarToIndex: number | null;
  similarityScore: number;
  duplicateOf: string | null;
  duplicateOfId: string | null;
}

export interface Media {
  id: string;
  reportId: string;
  type: 'photo' | 'video';
  url: string;
  cloudinaryId: string;
  createdAt: string;
}

export interface ApiError {
  status: number;
  message: string;
}