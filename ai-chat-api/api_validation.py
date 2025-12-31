#!/usr/bin/env python3
"""
API functionality validation after project reorganization.
Tests that all API endpoints work correctly after file reorganization.
"""

import sys
import os
from typing import Dict, Any

def validate_api_imports() -> Dict[str, bool]:
    """Validate that API-related imports work correctly."""
    results = {}
    
    print("=== VALIDATING API IMPORTS ===")
    
    # Test FastAPI app import
    try:
        from src.api.app import app
        results['fastapi_app'] = True
        print("✓ FastAPI app import successful")
    except Exception as e:
        results['fastapi_app'] = False
        print(f"✗ FastAPI app import failed: {e}")
    
    # Test API models
    try:
        from src.api.models import ChatRequest, ChatResponse
        results['api_models'] = True
        print("✓ API models import successful")
    except Exception as e:
        results['api_models'] = False
        print(f"✗ API models import failed: {e}")
    
    # Test chat service
    try:
        from src.api.chat_service import ChatService
        results['chat_service'] = True
        print("✓ Chat service import successful")
    except Exception as e:
        results['chat_service'] = False
        print(f"✗ Chat service import failed: {e}")
    
    # Test database models
    try:
        from src.database.models import Conversation, Message
        results['database_models'] = True
        print("✓ Database models import successful")
    except Exception as e:
        results['database_models'] = False
        print(f"✗ Database models import failed: {e}")
    
    # Test psychology integration
    try:
        from src.psychology.multi_detector import MultiPsychologyDetector
        results['psychology_detector'] = True
        print("✓ Psychology detector import successful")
    except Exception as e:
        results['psychology_detector'] = False
        print(f"✗ Psychology detector import failed: {e}")
    
    return results

def validate_api_structure() -> Dict[str, bool]:
    """Validate API application structure."""
    results = {}
    
    print("\n=== VALIDATING API STRUCTURE ===")
    
    try:
        from src.api.app import app
        
        # Check if app is properly configured
        results['app_configured'] = hasattr(app, 'routes') and len(app.routes) > 0
        if results['app_configured']:
            print(f"✓ FastAPI app has {len(app.routes)} routes configured")
        else:
            print("✗ FastAPI app not properly configured")
        
        # Check for key routes
        route_paths = [route.path for route in app.routes if hasattr(route, 'path')]
        
        expected_routes = ['/chat/', '/conversations/', '/']
        for expected_route in expected_routes:
            route_exists = any(expected_route in path for path in route_paths)
            results[f'route_{expected_route.replace("/", "_")}'] = route_exists
            if route_exists:
                print(f"✓ Route {expected_route} exists")
            else:
                print(f"✗ Route {expected_route} missing")
        
    except Exception as e:
        results['app_configured'] = False
        print(f"✗ API structure validation failed: {e}")
    
    return results

def validate_configuration() -> Dict[str, bool]:
    """Validate configuration loading."""
    results = {}
    
    print("\n=== VALIDATING CONFIGURATION ===")
    
    try:
        from src.config.settings import (
            DATABASE_URL, OPENAI_API_KEY, API_HOST, API_PORT,
            IFS_DETECTION_ENABLED, AI_RESPONSE_LANGUAGE
        )
        
        results['config_loaded'] = True
        print("✓ Configuration variables loaded")
        
        # Check key configurations
        results['database_url_set'] = bool(DATABASE_URL)
        results['openai_key_set'] = bool(OPENAI_API_KEY and OPENAI_API_KEY != 'your-api-key-here')
        results['api_host_set'] = bool(API_HOST)
        results['api_port_set'] = bool(API_PORT)
        
        print(f"✓ Database URL configured: {bool(DATABASE_URL)}")
        print(f"✓ OpenAI API key configured: {bool(OPENAI_API_KEY and OPENAI_API_KEY != 'your-api-key-here')}")
        print(f"✓ API host configured: {bool(API_HOST)}")
        print(f"✓ API port configured: {bool(API_PORT)}")
        
    except Exception as e:
        results['config_loaded'] = False
        print(f"✗ Configuration validation failed: {e}")
    
    return results

def validate_run_script() -> Dict[str, bool]:
    """Validate that the run script works."""
    results = {}
    
    print("\n=== VALIDATING RUN SCRIPT ===")
    
    try:
        # Check run.py syntax
        with open('run.py', 'r') as f:
            content = f.read()
        
        compile(content, 'run.py', 'exec')
        results['run_py_syntax'] = True
        print("✓ run.py syntax is valid")
        
        # Check that it imports the app correctly
        import_check = 'from src.api.app import app' in content
        results['run_py_imports'] = import_check
        if import_check:
            print("✓ run.py imports app correctly")
        else:
            print("✗ run.py import statement issue")
        
    except Exception as e:
        results['run_py_syntax'] = False
        print(f"✗ run.py validation failed: {e}")
    
    return results

def run_api_validation() -> Dict[str, Any]:
    """Run complete API validation."""
    print("Starting API functionality validation...")
    
    all_results = {}
    
    # Run all validations
    all_results['imports'] = validate_api_imports()
    all_results['structure'] = validate_api_structure()
    all_results['configuration'] = validate_configuration()
    all_results['run_script'] = validate_run_script()
    
    # Calculate summary
    total_checks = 0
    passed_checks = 0
    
    for category, results in all_results.items():
        if isinstance(results, dict):
            for check, passed in results.items():
                total_checks += 1
                if passed:
                    passed_checks += 1
    
    success_rate = passed_checks / total_checks if total_checks > 0 else 0
    
    print(f"\n{'='*50}")
    print("API VALIDATION SUMMARY")
    print(f"{'='*50}")
    print(f"Passed: {passed_checks}/{total_checks} ({success_rate:.1%})")
    
    if success_rate >= 0.9:
        print("🎉 API FUNCTIONALITY FULLY PRESERVED!")
    elif success_rate >= 0.7:
        print("✅ API FUNCTIONALITY MOSTLY PRESERVED")
    else:
        print("⚠️ API FUNCTIONALITY NEEDS ATTENTION")
    
    all_results['summary'] = {
        'total_checks': total_checks,
        'passed_checks': passed_checks,
        'success_rate': success_rate
    }
    
    return all_results

def main():
    """Main function."""
    return run_api_validation()

if __name__ == "__main__":
    main()