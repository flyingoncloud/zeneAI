# Implementation Plan: Production Deployment Configuration

## Overview

This implementation plan breaks down the production deployment configuration feature into discrete coding tasks. The approach follows a layered strategy:

1. Create environment detection modules (backend and frontend)
2. Update backend configuration (cookies and CORS)
3. Update frontend configuration (routing and API client)
4. Add logging and validation
5. Write tests to verify correctness

Each task builds on previous work, ensuring incremental progress with no orphaned code.

## Tasks

- [ ] 1. Create backend environment detection module
  - Create `ai-chat-api/src/config/environment.py` file
  - Implement `is_production()` function to read PRODUCTION_MODE env var
  - Implement `get_cookie_config()` function returning environment-specific cookie settings
  - Implement `get_cors_origins()` function parsing CORS_ORIGINS env var
  - Implement `log_environment_config()` function for startup logging
  - _Requirements: 1.1, 1.3, 1.5, 3.1, 4.1, 4.2, 4.3, 4.4, 7.1, 7.2_

- [ ]* 1.1 Write property test for environment detection parsing
  - **Property 1: Environment Detection Parsing**
  - **Validates: Requirements 1.1, 1.2**
  - Test that for any environment variable value, only "true" (case-insensitive) returns True
  - Use Hypothesis to generate random strings
  - Minimum 100 iterations

- [ ]* 1.2 Write unit tests for backend environment module
  - Test `is_production()` with "true", "TRUE", "false", "", None
  - Test `get_cookie_config()` returns correct config for production mode
  - Test `get_cookie_config()` returns correct config for development mode
  - Test `get_cors_origins()` parses comma-separated list correctly
  - Test `get_cors_origins()` handles whitespace and empty strings
  - _Requirements: 1.1, 1.3, 1.5, 3.1, 4.1, 4.2, 4.3, 4.4_

- [ ]* 1.3 Write property test for CORS origins parsing
  - **Property 4: CORS Origins Parsing**
  - **Validates: Requirements 3.1**
  - Test that for any comma-separated string, parsing returns correct list with trimmed whitespace
  - Use Hypothesis to generate random comma-separated strings
  - Minimum 100 iterations

- [ ] 2. Update backend CORS configuration
  - Modify `ai-chat-api/src/api/app.py` to import `get_cors_origins` and `log_environment_config`
  - Replace `CORS_ORIGINS` import with call to `get_cors_origins()`
  - Add call to `log_environment_config()` in startup event handler
  - _Requirements: 3.1, 3.2, 3.3, 7.1, 7.2_

- [ ]* 2.1 Write unit tests for CORS configuration
  - Test production mode includes production domain in CORS origins
  - Test development mode includes localhost domains in CORS origins
  - Test CORS middleware is configured with correct origins
  - _Requirements: 3.2, 3.3_

- [ ] 3. Update backend authentication cookie configuration
  - Modify `ai-chat-api/src/api/auth_routes.py` to import `get_cookie_config`
  - Update all `response.set_cookie()` calls to use `**get_cookie_config()`
  - Ensure consistent cookie configuration across all auth routes (login, OAuth callbacks, session refresh)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 3.1 Write property test for cookie configuration consistency
  - **Property 3: Cookie Configuration Consistency**
  - **Validates: Requirements 4.5**
  - Test that for any cookie-setting operation, environment-specific config is applied
  - Verify all cookies use the same configuration
  - Minimum 100 iterations

- [ ]* 3.2 Write unit tests for cookie configuration
  - Test production mode sets SameSite=None and Secure=True
  - Test development mode sets SameSite=Lax and Secure=False
  - Test all auth routes use cookie configuration function
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 4. Checkpoint - Ensure backend tests pass
  - Run all backend tests: `pytest ai-chat-api/tests/`
  - Verify environment detection works correctly
  - Verify CORS and cookie configuration are environment-aware
  - Ask the user if questions arise

- [ ] 5. Create frontend environment detection module
  - Create `zeneme-next/src/lib/environment.ts` file
  - Implement `isProduction()` function to read NEXT_PUBLIC_PRODUCTION_MODE env var
  - Implement `getApiUrl()` function to read NEXT_PUBLIC_API_URL with default
  - Implement `getFrontendUrl()` function to read NEXT_PUBLIC_FRONTEND_URL with default
  - Implement `getEnvironmentConfig()` function returning complete config object
  - Define `EnvironmentConfig` TypeScript interface
  - _Requirements: 1.2, 1.4, 1.5, 5.1, 5.2, 5.3_

- [ ]* 5.1 Write property test for frontend environment detection
  - **Property 1: Environment Detection Parsing** (frontend version)
  - **Validates: Requirements 1.1, 1.2**
  - Test that for any environment variable value, only "true" (case-insensitive) returns true
  - Use fast-check to generate random strings
  - Minimum 100 iterations

- [ ]* 5.2 Write property test for API URL configuration
  - **Property 5: API URL Configuration Reading**
  - **Validates: Requirements 5.1**
  - Test that for any value (including undefined), function returns configured value or default
  - Use fast-check to generate random strings and undefined
  - Minimum 100 iterations

- [ ]* 5.3 Write unit tests for frontend environment module
  - Test `isProduction()` with "true", "TRUE", "false", "", undefined
  - Test `getApiUrl()` returns configured value when set
  - Test `getApiUrl()` returns "http://localhost:8000" when not set
  - Test `getFrontendUrl()` returns configured value or default
  - Test `getEnvironmentConfig()` returns complete config object
  - _Requirements: 1.2, 1.4, 1.5, 5.1, 5.2, 5.3_

- [ ] 6. Update frontend root page routing
  - Modify `zeneme-next/src/app/page.tsx` to import `isProduction` from environment module
  - Update the `status === 'idle'` section to check environment
  - In production mode, render `AuthPage` directly without welcome page option
  - In development mode, preserve existing welcome page behavior
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ]* 6.1 Write property test for authenticated user routing
  - **Property 6: Authenticated User Routing Independence**
  - **Validates: Requirements 2.3**
  - Test that for any environment mode, authenticated users see main app
  - Verify authentication status takes precedence over environment
  - Minimum 100 iterations

- [ ]* 6.2 Write unit tests for root page routing
  - Test production + idle status renders AuthPage
  - Test development + idle status renders WelcomePage
  - Test production + authenticated status renders main app
  - Test development + authenticated status renders main app
  - Use React Testing Library to verify component rendering
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 7. Update frontend API client configuration
  - Modify `zeneme-next/src/lib/api.ts` to import `getApiUrl` from environment module
  - Create `API_BASE_URL` constant using `getApiUrl()`
  - Update all API functions to use `API_BASE_URL` instead of hardcoded URLs
  - Ensure `credentials: 'include'` is set for all requests (cookie support)
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ]* 7.1 Write unit tests for API client configuration
  - Test API client uses configured base URL
  - Test API client defaults to localhost when not configured
  - Test all API functions use the base URL constant
  - Mock fetch to verify correct URLs are called
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 8. Checkpoint - Ensure frontend tests pass
  - Run all frontend tests: `npm test` in zeneme-next directory
  - Verify environment detection works correctly
  - Verify routing is environment-aware
  - Verify API client uses correct base URL
  - Ask the user if questions arise

- [ ] 9. Create environment variable documentation
  - Create `ai-chat-api/.env.production.example` file with production environment variables
  - Create `zeneme-next/.env.local.example` file with frontend environment variables
  - Update `ai-chat-api/README.md` with environment variable documentation
  - Include descriptions, example values, and deployment instructions
  - Document EC2 deployment steps for setting environment variables
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 10. Add startup logging validation
  - Verify `log_environment_config()` is called in backend startup
  - Test that logs include environment mode, cookie config, and CORS origins
  - Add log output examples to documentation
  - _Requirements: 7.1, 7.2_

- [ ]* 10.1 Write unit tests for startup logging
  - Test production mode logs correct values
  - Test development mode logs correct values
  - Test log format includes all required information
  - Use log capture to verify output
  - _Requirements: 7.1, 7.2_

- [ ] 11. Integration testing and validation
  - Test complete flow in development mode (welcome page, localhost API, Lax cookies)
  - Test complete flow in production mode (auth page, production API, Secure cookies)
  - Verify environment switching works correctly
  - Document any issues or edge cases discovered
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 12. Final checkpoint - Ensure all tests pass
  - Run complete test suite for backend: `pytest ai-chat-api/tests/`
  - Run complete test suite for frontend: `npm test` in zeneme-next
  - Verify all property tests pass with 100+ iterations
  - Verify all unit tests pass
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties with minimum 100 iterations
- Unit tests validate specific examples and edge cases
- Environment detection is the foundation - implement it first
- Backend changes are independent of frontend changes - can be done in parallel
- Documentation is created last after implementation is complete
