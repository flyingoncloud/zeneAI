# Requirements Document

## Introduction

This document specifies the requirements for configuring the Zeneme AI application for production deployment at www.zeneme.ai. The application consists of a Next.js frontend and FastAPI backend, currently configured only for local development. Production deployment requires environment-specific configuration for routing, CORS, and cookie security to ensure proper functionality with HTTPS and cross-origin requests.

## Glossary

- **Frontend**: The Next.js 14 application serving the user interface
- **Backend**: The FastAPI Python application providing the API
- **Production_Environment**: The deployment environment at www.zeneme.ai on EC2
- **Development_Environment**: The local development environment (localhost)
- **CORS**: Cross-Origin Resource Sharing - browser security mechanism for cross-domain requests
- **SameSite**: Cookie attribute controlling cross-site request behavior (None, Lax, or Strict)
- **Secure_Flag**: Cookie attribute requiring HTTPS transmission
- **Environment_Variable**: Configuration value stored in .env files
- **Root_Page**: The application entry point at "/" route
- **Auth_Page**: The login/authentication page
- **Welcome_Page**: The landing page with danmaku animation shown to unauthenticated users

## Requirements

### Requirement 1: Environment Detection

**User Story:** As a developer, I want the application to automatically detect whether it's running in production or development, so that environment-specific configurations are applied correctly.

#### Acceptance Criteria

1. THE Backend SHALL determine environment based on the presence of a PRODUCTION_MODE environment variable
2. THE Frontend SHALL determine environment based on the presence of a NEXT_PUBLIC_PRODUCTION_MODE environment variable
3. WHEN PRODUCTION_MODE is set to "true", THE Backend SHALL apply production-specific configurations
4. WHEN NEXT_PUBLIC_PRODUCTION_MODE is set to "true", THE Frontend SHALL apply production-specific configurations
5. WHEN environment variables are not set or set to "false", THE System SHALL default to development mode

### Requirement 2: Production Root Page Redirect

**User Story:** As a user visiting www.zeneme.ai, I want to be redirected directly to the login page, so that I can quickly access the application without seeing the welcome animation.

#### Acceptance Criteria

1. WHEN a user visits the root page ("/") in production AND authentication status is 'idle', THE Frontend SHALL redirect to the Auth_Page
2. WHEN a user visits the root page ("/") in development AND authentication status is 'idle', THE Frontend SHALL display the Welcome_Page
3. WHEN a user is authenticated (status is 'authenticated'), THE Frontend SHALL display the main application interface regardless of environment
4. THE Frontend SHALL preserve the current welcome page behavior in development mode

### Requirement 3: Production CORS Configuration

**User Story:** As a system administrator, I want the backend to accept requests from the production domain, so that the frontend can communicate with the API in production.

#### Acceptance Criteria

1. THE Backend SHALL read CORS_ORIGINS from environment variables
2. WHEN running in production, THE CORS_ORIGINS SHALL include "https://www.zeneme.ai"
3. WHEN running in development, THE CORS_ORIGINS SHALL include "http://localhost:3000" and "http://localhost:8080"
4. THE Backend SHALL maintain allow_credentials=True for cookie-based authentication
5. THE Backend SHALL allow all HTTP methods and headers as currently configured

### Requirement 4: Production Cookie Security Configuration

**User Story:** As a user accessing the application over HTTPS, I want authentication cookies to work properly, so that I can stay logged in across requests.

#### Acceptance Criteria

1. WHEN running in production, THE Backend SHALL set cookie SameSite attribute to "None"
2. WHEN running in production, THE Backend SHALL set cookie Secure attribute to True
3. WHEN running in development, THE Backend SHALL set cookie SameSite attribute to "Lax"
4. WHEN running in development, THE Backend SHALL set cookie Secure attribute to False
5. THE Backend SHALL apply these settings to all authentication-related cookies (session cookies, OAuth cookies)

### Requirement 5: Frontend API URL Configuration

**User Story:** As a developer, I want the frontend to use the correct API URL for each environment, so that API requests are routed properly.

#### Acceptance Criteria

1. THE Frontend SHALL read API base URL from NEXT_PUBLIC_API_URL environment variable
2. WHEN NEXT_PUBLIC_API_URL is not set, THE Frontend SHALL default to "http://localhost:8000"
3. WHEN running in production, THE Frontend SHALL use the production API URL from environment configuration
4. THE Frontend SHALL use the configured API URL for all backend requests

### Requirement 6: Environment Variable Documentation

**User Story:** As a developer deploying the application, I want clear documentation of required environment variables, so that I can configure the production environment correctly.

#### Acceptance Criteria

1. THE Documentation SHALL list all required environment variables for production deployment
2. THE Documentation SHALL provide example values for each environment variable
3. THE Documentation SHALL explain the purpose of each environment variable
4. THE Documentation SHALL include separate sections for frontend and backend configuration
5. THE Documentation SHALL include instructions for setting environment variables on EC2

### Requirement 7: Cookie Configuration Validation

**User Story:** As a system administrator, I want to verify that cookie settings are applied correctly, so that I can troubleshoot authentication issues.

#### Acceptance Criteria

1. THE Backend SHALL log cookie configuration settings on startup
2. THE Backend SHALL include environment mode in startup logs
3. WHEN cookies are set, THE Backend SHALL log the SameSite and Secure attributes being used
4. THE Logs SHALL clearly indicate whether production or development mode is active

### Requirement 8: Backward Compatibility

**User Story:** As a developer, I want existing development workflows to continue working unchanged, so that local development is not disrupted.

#### Acceptance Criteria

1. WHEN environment variables are not set, THE System SHALL default to development mode behavior
2. THE Development_Environment SHALL continue to work with existing .env files without modification
3. THE System SHALL not require production environment variables to run in development mode
4. THE System SHALL maintain all existing functionality in development mode
