# MausamNet-AI – Complete Features

## National Weather Big Data Analytics Platform

### 1. Overview

MausamNet-AI is an AI-powered National Weather Big Data Analytics Platform designed to collect, process, verify, analyse, and visualize weather-related information from multiple sources.

The platform combines official weather information, weather APIs, citizen reports, internet-based sources, social-media-style reports, geospatial information, and AI/ML models to create a centralized system for real-time weather monitoring and analysis.

The system focuses on identifying weather events, detecting misinformation and duplicate reports, determining report credibility, visualizing affected regions, and allowing administrators to verify information before it is treated as trusted data.

---

# 2. User Roles

The platform contains three major user roles.

## 2.1 Public User

A public user can:

* View current weather information
* View weather events
* View verified weather reports
* Search weather reports
* Filter reports
* View reports on a map
* View weather alerts
* View city-wise weather conditions
* Submit citizen weather reports
* Upload weather-related photos
* Upload weather-related videos
* Add location information
* Track submitted reports
* View verification status
* View credibility information
* Receive weather notifications

---

## 2.2 Registered Citizen

Registered citizens receive additional functionality.

They can:

* Create an account
* Login securely
* Manage their profile
* Submit weather reports
* Edit reports before verification
* Delete their own reports
* Upload images and videos
* Add GPS location
* Select weather event category
* Add description
* Track report verification
* View submission history
* Receive weather alerts
* Report incorrect information
* Provide additional evidence for existing reports
* View nearby weather incidents

---

## 2.3 Administrator

Administrators manage the entire platform.

Admin functionality includes:

* Admin login
* Admin dashboard
* User management
* Weather report management
* Report verification
* Fake report detection
* Duplicate report management
* Credibility score review
* Weather event monitoring
* Alert management
* Analytics dashboard
* Map monitoring
* Data source monitoring
* System health monitoring
* Report approval
* Report rejection
* Report flagging
* User banning
* User suspension
* Audit logs
* Platform statistics

---

# 3. Authentication System

The platform provides secure authentication for users and administrators.

Features include:

* User registration
* User login
* User logout
* Admin login
* Email verification
* Password hashing
* JWT authentication
* Access token
* Refresh token
* Role-based access control
* Protected API routes
* Session management
* Forgot password
* Reset password
* Email-based password recovery
* Account verification
* Token expiration
* Token refresh
* Secure authentication middleware

OAuth authentication can also be supported.

OAuth providers may include:

* Google
* GitHub
* Other supported identity providers

---

# 4. User Profile Management

Every registered user can maintain a profile.

Profile information can contain:

* User ID
* Name
* Username
* Email
* Profile image
* Phone number
* City
* State
* Preferred language
* Account creation date
* Number of reports submitted
* Number of verified reports
* User credibility score

Users can:

* View profile
* Edit profile
* Change profile image
* Update location
* Change password
* Manage notification preferences

---

# 5. Weather Data Collection

MausamNet-AI collects weather-related data from multiple sources.

Possible sources include:

* IMD weather data
* OpenWeather API
* Public weather APIs
* Government weather datasets
* Citizen reports
* News sources
* Public websites
* Internet-based weather reports
* Social-media-style reports
* IoT weather stations in future versions

The collected data may contain:

* Temperature
* Humidity
* Atmospheric pressure
* Wind speed
* Wind direction
* Rainfall
* Visibility
* Weather condition
* Geographic location
* City
* State
* Latitude
* Longitude
* Date
* Time
* Data source

---

# 6. Citizen Weather Reporting

Users can submit weather events occurring around them.

Each report can contain:

* Report title
* Description
* Weather event category
* Date
* Time
* City
* State
* Latitude
* Longitude
* GPS location
* Photo
* Video
* Source
* Severity
* Additional information

Example:

Event: Flood

Location: Siliguri, West Bengal

Description: Heavy rainfall has caused waterlogging on several roads.

Image: Attached

Location: GPS coordinates

Time: Current timestamp

The report is then passed through the AI verification pipeline.

---

# 7. Weather Event Classification

The AI/ML model automatically identifies the type of weather event described in a report.

Supported categories can include:

* Rainfall
* Heavy Rainfall
* Flood
* Flash Flood
* Thunderstorm
* Lightning
* Cyclone
* Heatwave
* Cold Wave
* Fog
* Dense Fog
* Dust Storm
* Strong Wind
* Hailstorm
* Snowfall
* Drought
* Landslide
* Cloudburst
* Waterlogging

The MVP can initially focus on major categories such as:

* Rainfall
* Flood
* Thunderstorm
* Heatwave
* Cyclone
* Fog
* Strong Wind

---

# 8. AI-Based Text Classification

The AI system analyses report text and predicts the corresponding weather event.

The ML pipeline includes:

Input Report

↓

Text Cleaning

↓

Text Preprocessing

↓

Feature Extraction

↓

Machine Learning Model

↓

Weather Category Prediction

↓

Confidence Score

The system can use technologies such as:

* Python
* Scikit-learn
* NumPy
* Pandas
* NLP
* TF-IDF Vectorization

The trained model can be stored using:

* classifier.joblib
* vectorizer.joblib

---

# 9. AI Confidence Score

Each AI classification contains a confidence score.

Example:

Weather Event: Flood

AI Confidence: 96%

The confidence score helps determine how certain the machine-learning model is about its classification.

Reports with very low confidence can automatically be sent to administrators for manual review.

---

# 10. Report Credibility Score

Every submitted report can receive a credibility score.

Example:

Credibility Score: 87/100

The credibility score can be calculated using multiple factors.

Factors may include:

* Source reliability
* User reliability
* AI confidence
* GPS availability
* Image evidence
* Video evidence
* Similar nearby reports
* Official weather information
* Location consistency
* Time consistency
* Duplicate detection result
* Historical user behaviour

The score can be categorized as:

0–30: Low Credibility

31–60: Moderate Credibility

61–80: High Credibility

81–100: Very High Credibility

The credibility score assists administrators and users but does not automatically guarantee that a report is true.

---

# 11. Fake or Misleading Report Detection

The platform uses multiple checks to identify potentially misleading reports.

Detection mechanisms include:

* AI classification
* Source checking
* Location validation
* Time validation
* Duplicate detection
* Similar-report comparison
* Weather API comparison
* User credibility
* Content analysis

Suspicious reports can automatically receive:

Status: Suspicious

They can then be sent to administrators for manual verification.

---

# 12. Duplicate Report Detection

Multiple users may report the same weather event.

Instead of treating every report as a separate incident, the system attempts to identify duplicates.

Duplicate detection can consider:

* Text similarity
* Event category
* GPS location
* City
* Time difference
* Image similarity in future versions

Example:

Report A:
Heavy flooding near Hill Cart Road at 4:05 PM.

Report B:
Road flooded near Hill Cart Road at 4:10 PM.

The system can determine that both reports may describe the same incident.

---

# 13. Location Validation

The platform validates the geographic information provided with weather reports.

Location information includes:

* Latitude
* Longitude
* City
* State
* GPS location

The system can compare:

Citizen Location

vs

Weather Event Location

vs

Weather API Information

This helps identify reports containing incorrect or suspicious location information.

---

# 14. Interactive Weather Map

Weather events are displayed using an interactive map.

Technology:

* Leaflet
* OpenStreetMap

Map functionality includes:

* Weather event markers
* Event location
* Event category
* Severity
* Verification status
* Report details
* Zoom controls
* Map movement
* City-wise events
* State-wise events
* Nearby incidents

Marker information may display:

Event: Flood

Location: Siliguri

Status: Verified

Credibility: 91%

Reported: 20 minutes ago

---

# 15. Map Marker Categories

Different markers can represent different weather events.

Examples:

Rainfall – Rain marker

Flood – Flood marker

Heatwave – Temperature marker

Thunderstorm – Storm marker

Cyclone – Cyclone marker

Fog – Visibility marker

Strong Wind – Wind marker

The marker can also represent verification status.

---

# 16. Weather Heatmap

The system can generate a weather-event heatmap.

The heatmap can indicate areas containing high concentrations of:

* Flood reports
* Rainfall reports
* Heatwave reports
* Storm reports
* Weather alerts

This provides administrators with a quick geographical overview of affected areas.

---

# 17. Weather Dashboard

The main dashboard provides an overview of weather activity.

Dashboard information can include:

* Total reports
* Verified reports
* Pending reports
* Suspicious reports
* Active weather events
* Current weather
* Recent alerts
* AI classified reports
* High-risk locations
* Reports received today
* City-wise statistics
* State-wise statistics

---

# 18. Dashboard Statistics

Dashboard cards can include:

Total Reports

Verified Reports

Pending Reports

Suspicious Reports

Active Events

Today's Reports

High Severity Events

Registered Users

The dashboard can update dynamically when new reports arrive.

---

# 19. Weather Report Filtering

Users and administrators can filter reports.

Available filters include:

* Date
* Date range
* Event category
* State
* City
* Verification status
* Credibility score
* Severity
* Data source

Example:

State: West Bengal

Event: Flood

Status: Verified

Date: Today

The dashboard will display only matching reports.

---

# 20. Search System

Users can search weather information using keywords.

Search examples:

Flood Siliguri

Rainfall Kolkata

Heatwave Delhi

Cyclone Odisha

Search results can contain:

* Weather reports
* Weather events
* Cities
* Locations
* Alerts

---

# 21. Weather Report Details Page

Each weather report has a detailed view.

The page can display:

* Event name
* Event category
* Description
* Reported by
* Date
* Time
* Location
* Map position
* Images
* Videos
* AI prediction
* AI confidence
* Credibility score
* Verification status
* Source
* Similar reports

---

# 22. Verification Status

Each weather report contains a verification state.

Available statuses include:

Pending

Verified

Unverified

Suspicious

Rejected

The status is visible on the dashboard and report details page.

---

# 23. Admin Verification System

Administrators can manually verify reports.

Admin actions include:

* Review report
* Review AI prediction
* Review credibility score
* View location
* View uploaded evidence
* Compare similar reports
* Compare API weather information
* Mark report as verified
* Mark report as suspicious
* Reject report
* Add verification notes

---

# 24. Report Severity

Weather reports can contain severity levels.

Possible levels:

Low

Moderate

High

Severe

Critical

Severity can depend on:

* Weather event category
* Report description
* Number of nearby reports
* Weather API information
* Administrator verification

---

# 25. Weather Alert System

The platform can generate alerts for significant weather events.

Alert categories can include:

* Heavy Rain Alert
* Flood Alert
* Thunderstorm Alert
* Heatwave Alert
* Cyclone Alert
* Strong Wind Alert
* Fog Alert

An alert contains:

* Event type
* Location
* Severity
* Alert message
* Start time
* Date
* Source
* Verification status

---

# 26. Location-Based Alerts

Users can receive alerts based on their selected location.

Example:

User Location:

Siliguri, West Bengal

Alert:

"Heavy rainfall and possible waterlogging reported in Siliguri."

The user does not need to browse the complete national map to discover relevant incidents.

---

# 27. Notification System

Notifications can inform users about:

* New weather alerts
* Severe events
* Nearby weather incidents
* Report verification
* Report rejection
* Report status updates
* Important admin announcements

Notification types can include:

* In-app notification
* Browser notification
* Email notification in future versions
* SMS notification in future versions

---

# 28. Real-Time Updates

The platform can support near-real-time updates.

When a new weather report is received:

Report Submitted

↓

Backend Processes Report

↓

AI Model Classifies Event

↓

Credibility Score Generated

↓

Database Updated

↓

Dashboard Updated

↓

Admin Receives Report

This minimizes the delay between report submission and visualization.

---

# 29. Admin Dashboard

The admin dashboard acts as the platform's main control center.

Admin dashboard modules include:

* Overview
* Reports
* Users
* Weather Events
* Verification Queue
* Suspicious Reports
* Alerts
* Analytics
* Map
* Data Sources
* System Logs

---

# 30. User Management

Administrators can manage users.

Admin actions include:

* View users
* Search users
* View user profile
* View user reports
* View user credibility
* Suspend user
* Ban user
* Reactivate user
* Change user role

---

# 31. User Credibility System

Users can have a credibility score based on their previous reports.

Factors include:

* Number of reports
* Number of verified reports
* Number of rejected reports
* Number of fake reports
* Evidence quality
* Account history

A user consistently submitting verified reports can receive a higher trust level.

---

# 32. Data Source Management

Administrators can monitor data sources.

Possible sources include:

* IMD
* OpenWeather
* Citizen Reports
* Government datasets
* Public APIs
* Selected internet sources

Admin can see:

* Source name
* Source status
* Number of reports
* Last synchronization
* Reliability information

---

# 33. Weather API Integration

The backend connects with weather APIs to retrieve weather data.

Data may contain:

* Current temperature
* Feels-like temperature
* Humidity
* Pressure
* Wind speed
* Rainfall
* Visibility
* Weather description

Weather API information can also assist report verification.

---

# 34. Centralized Database

All weather-related information is stored in a centralized database.

Technology:

PostgreSQL

Prisma ORM

Supabase/PostgreSQL infrastructure if used

Stored entities can include:

* Users
* Reports
* Weather events
* Alerts
* Locations
* Verification records
* Media
* Notifications
* AI predictions
* Credibility scores
* Data sources
* Audit logs

---

# 35. Prisma ORM

Prisma can provide communication between the NestJS backend and PostgreSQL database.

Benefits include:

* Type-safe database queries
* Schema management
* Database migrations
* Relationship management
* Easier backend development
* Generated Prisma Client

---

# 36. Media Upload System

Users can attach images or videos as evidence.

Supported functionality includes:

* Image upload
* Video upload
* File validation
* File size limits
* Media preview
* Secure storage
* Media URL generation

Media can be associated with individual weather reports.

---

# 37. Data Preprocessing

Before AI classification, incoming text can be cleaned.

Processing can include:

* Lowercase conversion
* URL removal
* Special-character removal
* Unnecessary whitespace removal
* Tokenization
* Stop-word handling
* Text normalization

This prepares reports for machine-learning classification.

---

# 38. Machine Learning Model

The weather classification model can be trained using labelled weather-event data.

Example training categories:

* Cyclone
* Drought
* Flood
* Heatwave
* Rainfall
* Thunderstorm
* Fog
* Strong Wind

The model learns patterns within weather-related text.

---

# 39. Model Evaluation

The AI model can be evaluated using:

* Accuracy
* Precision
* Recall
* F1 Score
* Confusion Matrix
* Validation dataset

This allows developers to monitor classification quality.

---

# 40. AI Model API

The Python ML service exposes APIs to the main backend.

Example:

NestJS Backend

↓

Python ML API

↓

Vectorizer

↓

Classifier

↓

Prediction

↓

NestJS Backend

Possible response:

Event: flood

Confidence: 0.97

---

# 41. Analytics Module

The platform can generate analytics from collected reports.

Analytics include:

* Event distribution
* Reports per day
* Reports per city
* Reports per state
* Most common event
* Verified vs suspicious reports
* User contribution statistics
* Weather trends

---

# 42. Event-Wise Analytics

The system can show statistics for each weather category.

Example:

Rainfall – 420 reports

Flood – 210 reports

Thunderstorm – 165 reports

Heatwave – 95 reports

Cyclone – 35 reports

This information can be represented using graphs and charts.

---

# 43. Location-Wise Analytics

Administrators can analyse weather activity based on geographic regions.

Examples:

Reports by state

Reports by city

Most affected cities

Most affected states

High-risk regions

---

# 44. Time-Based Analytics

Weather reports can be analysed according to time.

Available periods can include:

* Today
* Last 24 hours
* Last 7 days
* Last 30 days
* Custom date range

This makes it easier to identify trends.

---

# 45. Weather Trend Analysis

The platform can identify increasing or decreasing weather activity.

Example:

If flood-related reports suddenly increase within a specific geographic region, the system can flag the area for closer observation.

---

# 46. API Backend

The NestJS backend exposes APIs for:

* Authentication
* Users
* Weather reports
* Weather data
* AI predictions
* Alerts
* Admin functions
* Analytics
* Media
* Notifications

Example API structure:

/api/auth

/api/users

/api/reports

/api/weather

/api/events

/api/alerts

/api/admin

/api/analytics

/api/ml

---

# 47. Role-Based Access Control

The system controls features according to roles.

USER:

* View reports
* Create report
* Manage own reports
* View alerts

ADMIN:

* Manage reports
* Verify reports
* Manage users
* Create alerts
* View analytics

SUPER_ADMIN:

* All admin permissions
* Manage administrators
* Manage system configuration
* Manage data sources
* View system logs

---

# 48. API Security

Backend security measures can include:

* JWT authentication
* Role guards
* Input validation
* DTO validation
* Password hashing
* API rate limiting
* CORS configuration
* Helmet security headers
* Request sanitization
* File upload validation
* Authorization checks

---

# 49. Rate Limiting

API rate limiting protects the platform against:

* Spam
* Bot requests
* Brute-force attacks
* Excessive report submissions
* API abuse

Different limits can be applied to authentication and normal API endpoints.

---

# 50. Input Validation

All submitted information is validated.

Examples:

* Email format
* Password requirements
* Valid latitude
* Valid longitude
* Supported event categories
* Allowed image formats
* Allowed video formats
* Maximum upload size
* Required report fields

---

# 51. Audit Logging

Important administrative actions can be logged.

Logs may include:

* Admin login
* Report verification
* Report rejection
* User suspension
* Alert creation
* Role change
* Data deletion

Each audit record can store:

* Admin
* Action
* Target
* Time
* Date
* IP information if required

---

# 52. Error Handling

The backend provides standardized error responses.

Examples:

* Invalid login
* Unauthorized request
* Report not found
* Invalid location
* File upload failed
* AI service unavailable
* Weather API unavailable

This makes the system more stable and easier to debug.

---

# 53. Health Monitoring

The platform can provide system health endpoints.

The system can monitor:

* Backend status
* Database status
* ML service status
* Weather API status
* Storage status

Example:

Backend: Online

Database: Online

ML Model: Online

Weather API: Online

---

# 54. Responsive Web Interface

The web application is designed to work across:

* Desktop
* Laptop
* Tablet
* Mobile browser

The dashboard automatically adapts to different screen sizes.

---

# 55. Accessibility

Basic accessibility features can include:

* Keyboard navigation
* Readable text
* High contrast
* Accessible form labels
* Alternative text for images
* Semantic HTML

---

# 56. Performance Optimization

Performance improvements can include:

* API caching
* Database indexing
* Pagination
* Lazy loading
* Image optimization
* Query optimization
* Response compression
* Efficient Prisma queries

---

# 57. Pagination

Large datasets are divided into pages.

For example:

Page 1

Reports 1–20

Page 2

Reports 21–40

This prevents thousands of weather reports from being loaded simultaneously.

---

# 58. Database Indexing

Frequently searched fields can be indexed.

Examples:

* City
* State
* Event category
* Created date
* Verification status
* Latitude
* Longitude

This improves query performance.

---

# 59. Caching

Frequently requested weather information can be temporarily cached.

Examples:

* Current city weather
* Dashboard statistics
* Common weather queries

Caching reduces unnecessary API and database requests.

---

# 60. Logging System

Application logs can record:

* API requests
* Errors
* Authentication events
* ML service failures
* Database errors
* External API failures

Logs help developers monitor and debug the platform.

---

# 61. API Documentation

Backend APIs can be documented using Swagger/OpenAPI.

Swagger documentation provides:

* API endpoints
* Request format
* Response format
* Authentication requirements
* DTO information
* Error codes

---

# 62. Deployment

The application can be deployed using:

Frontend:

Next.js hosting platform

Backend:

Prisma Compute or compatible cloud infrastructure

Database:

PostgreSQL

ORM:

Prisma

ML Service:

Python-compatible deployment environment

Media:

Cloud/object storage bucket

---

# 63. Scalability

The MVP uses a relatively simple architecture.

As traffic increases, the architecture can later include:

* Apache Kafka
* Apache Spark
* Distributed processing
* Redis
* Microservices
* Load balancers
* Multiple API servers
* Distributed databases
* Object storage
* CDN
* Container orchestration

---

# 64. Kafka Integration – Future Scope

Apache Kafka can later handle real-time weather-data streams.

Example:

Weather Sources

↓

Kafka

↓

Weather Processing Services

↓

AI Verification

↓

Database

↓

Dashboard

This architecture can process large numbers of weather events.

---

# 65. Apache Spark – Future Scope

Apache Spark can be used to process very large datasets.

Possible uses:

* Historical weather analytics
* Large-scale weather trend analysis
* Event clustering
* Batch processing
* Big-data ML operations

---

# 66. Redis – Future Scope

Redis can later provide:

* API caching
* Session caching
* Rate limiting
* Real-time data caching
* Notification queues

---

# 67. Microservices – Future Scope

As the platform grows, individual modules can become separate services.

Possible services:

Authentication Service

Weather Ingestion Service

AI Service

Verification Service

Notification Service

Analytics Service

Media Service

Admin Service

---

# 68. Multilingual Weather Reports – Future Scope

Future versions can analyse reports written in multiple Indian languages.

Possible languages:

* English
* Hindi
* Bengali
* Marathi
* Tamil
* Telugu
* Gujarati
* Punjabi
* Malayalam
* Kannada

AI can translate or directly classify multilingual weather reports.

---

# 69. Image-Based Weather Verification – Future Scope

Computer vision models can analyse uploaded images.

Example detection:

* Flooded roads
* Heavy rainfall
* Dark storm clouds
* Waterlogging
* Snow
* Hail
* Damaged infrastructure

This can provide additional evidence for report verification.

---

# 70. Video Analysis – Future Scope

Uploaded weather videos can be analysed using computer vision.

The system may detect:

* Flood conditions
* Storm activity
* Heavy rainfall
* Strong winds
* Infrastructure damage

---

# 71. Satellite Data Integration – Future Scope

Satellite information can eventually be integrated.

Possible uses:

* Cyclone monitoring
* Cloud movement
* Rainfall estimation
* Flood detection
* Storm tracking

---

# 72. IoT Weather Station Integration – Future Scope

IoT sensors can provide direct weather observations.

Sensors may collect:

* Temperature
* Humidity
* Atmospheric pressure
* Rainfall
* Wind speed
* Wind direction

Sensor information can complement citizen reports.

---

# 73. Predictive Weather Risk Analysis – Future Scope

Historical and real-time information can be combined to estimate weather-event risks.

Example:

High rainfall

*

Increasing citizen flood reports

*

River-level information

↓

Possible Flood Risk

This could help authorities monitor developing situations.

---

# 74. Disaster Management Integration – Future Scope

The platform can potentially integrate with:

* Disaster management authorities
* Municipal authorities
* Emergency services
* Government agencies

Verified weather information can help support faster response decisions.

---

# 75. Complete MVP Workflow

Weather APIs
+
Citizen Reports
+
Public Sources

↓

Data Ingestion

↓

Data Validation

↓

Data Preprocessing

↓

Duplicate Detection

↓

AI Weather Event Classification

↓

AI Confidence Score

↓

Location Verification

↓

Credibility Analysis

↓

Database Storage

↓

Admin Verification

↓

Verified Weather Dataset

↓

Dashboard

↓

Interactive Map

↓

Analytics

↓

Weather Alerts

↓

Users

---

# 76. MVP Core Features

For the initial SIH MVP, the highest-priority features are:

1. User Authentication
2. Admin Authentication
3. Citizen Weather Reporting
4. Weather API Integration
5. AI Weather Classification
6. AI Confidence Score
7. Basic Credibility Score
8. Duplicate Detection
9. Report Verification
10. Interactive Map
11. Weather Dashboard
12. Date-Wise Filtering
13. Event-Wise Filtering
14. Location-Wise Filtering
15. Verification Status Filtering
16. Admin Dashboard
17. Weather Alerts
18. Image Upload
19. GPS Location
20. Basic Analytics

---

# 77. MVP Architecture

Frontend

Next.js

↓

Backend API

NestJS

↓

Database Layer

Prisma ORM

↓

Supabase PostgreSQL Database

↓

Prisma ORM

↓

NestJS Backend API

↓

AI Service

Python + Scikit-learn

↓

External Services

Weather APIs + Map Services + Media Storage

---

# 78. Core Innovation

The main innovation of MausamNet-AI is that it does not depend only on conventional weather APIs.

It combines:

Official Weather Information

*

Citizen Intelligence

*

AI Classification

*

Credibility Analysis

*

Duplicate Detection

*

Geospatial Visualization

*

Human Administrator Verification

This creates a hybrid weather intelligence platform where large amounts of publicly available and citizen-generated information can be transformed into structured and useful weather-event data.

---

# 79. One-Line Feature Summary

MausamNet-AI collects real-time weather information from APIs, citizens and internet-based sources, uses AI to classify and analyse reports, detects suspicious and duplicate information, assigns credibility scores, enables administrator verification, and visualizes trusted weather intelligence through dashboards, analytics, alerts and interactive maps.

---

# 80. Final MVP Objective

The MVP should successfully demonstrate the complete journey of a weather report:

Report Submitted

↓

Weather Event Automatically Detected

↓

AI Confidence Calculated

↓

Duplicate Check Performed

↓

Credibility Score Generated

↓

Report Stored

↓

Admin Reviews Report

↓

Report Verified

↓

Report Appears on Dashboard

↓
Report Appears on Map

↓

Relevant Users Receive Weather Information

This demonstrates the core concept of MausamNet-AI while keeping the initial implementation practical, scalable and achievable within the SIH development timeline.