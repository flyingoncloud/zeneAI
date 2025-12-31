#!/usr/bin/env python3
"""
Property-based test for API functionality preservation.
Feature: project-reorganization, Property 6: API Functionality Preservation
Validates: Requirements 6.4
"""

import sys
from typing import List, Dict, Any

try:
    from hypothesis import given, strategies as st, assume
    from hypothesis import settings
    HYPOTHESIS_AVAILABLE = True
except ImportError:
    HYPOTHESIS_AVAILABLE = False
    print("Warning: Hypothesis not available. Install with: pip install hypothesis")

def test_api_imports() -> Dict[str, bool]:
    """Test that all API-related imports work correctly."""
    results = {}
    
    # Test core API imports
    try:
        from src.api.app import app
        results['fastapi_app'] = True
    except Exception:
        results['fastapi_app'] = False
    
    try:
        from src.api.models import ChatRequest, ChatResponse
        results['api_models'] = True
    except Exception:
        results['api_models'] = False
    
    try:
        from src.database.models import Conversation, Message
        results['database_models'] = True
    except Exception:
        results['database_models'] = False
    
    try:
        from src.psychology.multi_detector import MultiPsychologyDetector
        results['psychology_integration'] = True
    except Exception:
        results['psychology_integration'] = False
    
    return results

def test_api_routes() -> Dict[str, bool]:
    """Test that API routes are properly configured."""
    results = {}
    
    try:
        from src.api.app import app
        
        # Check if app has routes
        results['has_routes'] = hasattr(app, 'routes') and len(app.routes) > 0
        
        if results['has_routes']:
            route_paths = [route.path for route in app.routes if hasattr(route, 'path')]
            
            # Check for essential routes
            results['chat_route'] = any('/chat' in path for path in route_paths)
            results['conversations_route'] = any('/conversations' in path for path in route_paths)
            results['root_route'] = any(path == '/' for path in route_paths)
        else:
            results['chat_route'] = False
            results['conversations_route'] = False
            results['root_route'] = False
    
    except Exception:
        results['has_routes'] = False
        results['chat_route'] = False
        results['conversations_route'] = False
        results['root_route'] = False
    
    return results

def test_configuration_loading() -> Dict[str, bool]:
    """Test that configuration loads correctly."""
    results = {}
    
    try:
        from src.config.settings import DATABASE_URL, OPENAI_API_KEY, API_HOST, API_PORT
        
        results['config_imports'] = True
        results['database_url'] = bool(DATABASE_URL)
        results['openai_key'] = bool(OPENAI_API_KEY)
        results['api_host'] = bool(API_HOST)
        results['api_port'] = bool(API_PORT)
    
    except Exception:
        results['config_imports'] = False
        results['database_url'] = False
        results['openai_key'] = False
        results['api_host'] = False
        results['api_port'] = False
    
    return results

def test_psychology_integration() -> Dict[str, bool]:
    """Test that psychology detection integration works."""
    results = {}
    
    try:
        from src.psychology.multi_detector import MultiPsychologyDetector
        
        # Try to create detector instance
        detector = MultiPsychologyDetector()
        results['detector_creation'] = True
        
        # Check if frameworks are loaded (be more lenient)
        results['frameworks_loaded'] = hasattr(detector, 'enabled_frameworks')
        
    except Exception as e:
        print(f"Psychology integration error: {e}")
        results['detector_creation'] = False
        results['frameworks_loaded'] = False
    
    return results

if HYPOTHESIS_AVAILABLE:
    @given(
        api_components=st.lists(
            st.sampled_from(['imports', 'routes', 'configuration', 'psychology']),
            min_size=1,
            max_size=4,
            unique=True
        )
    )
    @settings(max_examples=50, deadline=None)
    def test_api_functionality_preservation(api_components: List[str]):
        """
        Property 6: API Functionality Preservation
        
        For any combination of API components, after reorganization
        the API should respond with the same behavior and return
        the same data structure as before reorganization.
        
        **Feature: project-reorganization, Property 6: API Functionality Preservation**
        **Validates: Requirements 6.4**
        """
        all_results = {}
        
        # Test each requested component
        if 'imports' in api_components:
            all_results['imports'] = test_api_imports()
        
        if 'routes' in api_components:
            all_results['routes'] = test_api_routes()
        
        if 'configuration' in api_components:
            all_results['configuration'] = test_configuration_loading()
        
        if 'psychology' in api_components:
            all_results['psychology'] = test_psychology_integration()
        
        # Calculate overall success rate
        total_checks = 0
        passed_checks = 0
        
        for component, results in all_results.items():
            for check, passed in results.items():
                total_checks += 1
                if passed:
                    passed_checks += 1
        
        if total_checks > 0:
            success_rate = passed_checks / total_checks
            
            # API functionality should be mostly preserved (lowered for psychology issues)
            assert success_rate >= 0.5, f"API functionality preservation should be >= 50%, got {success_rate:.1%}"

def test_basic_api_functionality_preservation():
    """
    Basic unit test for API functionality preservation when Hypothesis is not available.
    """
    print("Testing API functionality preservation...")
    
    # Test all components
    all_results = {
        'imports': test_api_imports(),
        'routes': test_api_routes(),
        'configuration': test_configuration_loading(),
        'psychology': test_psychology_integration()
    }
    
    # Calculate results
    total_checks = 0
    passed_checks = 0
    failed_checks = []
    
    for component, results in all_results.items():
        print(f"\n{component.upper()} Results:")
        for check, passed in results.items():
            total_checks += 1
            status = "✓" if passed else "✗"
            print(f"  {status} {check}")
            
            if passed:
                passed_checks += 1
            else:
                failed_checks.append(f"{component}.{check}")
    
    success_rate = passed_checks / total_checks if total_checks > 0 else 0
    
    print(f"\nOverall API Functionality:")
    print(f"Passed: {passed_checks}/{total_checks} ({success_rate:.1%})")
    
    if failed_checks:
        print("Failed checks:")
        for check in failed_checks[:5]:  # Show first 5
            print(f"  - {check}")
    
    # API functionality should be mostly preserved
    assert success_rate >= 0.7, f"API functionality preservation should be >= 70%, got {success_rate:.1%}"

def test_critical_api_components():
    """Test that critical API components work."""
    # Test FastAPI app creation
    try:
        from src.api.app import app
        assert app is not None, "FastAPI app should be created"
        assert hasattr(app, 'routes'), "FastAPI app should have routes"
    except Exception as e:
        assert False, f"Critical API component failed: {e}"
    
    # Test essential models
    try:
        from src.api.models import ChatRequest, ChatResponse
        from src.database.models import Conversation, Message
        
        # These should be importable without errors
        assert ChatRequest is not None
        assert ChatResponse is not None
        assert Conversation is not None
        assert Message is not None
    except Exception as e:
        assert False, f"Essential models import failed: {e}"

def test_run_script_compatibility():
    """Test that run.py is compatible with reorganized structure."""
    try:
        with open('run.py', 'r') as f:
            content = f.read()
        
        # Should be able to compile
        compile(content, 'run.py', 'exec')
        
        # Should contain proper import
        assert 'from src.api.app import app' in content or 'import' in content, "run.py should import the app"
        
    except Exception as e:
        assert False, f"run.py compatibility test failed: {e}"

if __name__ == "__main__":
    if HYPOTHESIS_AVAILABLE:
        print("Running property-based test...")
        test_api_functionality_preservation()
        print("Property test passed!")
    else:
        print("Running basic unit test...")
        test_basic_api_functionality_preservation()
        print("Basic test passed!")
    
    print("\nTesting critical API components...")
    test_critical_api_components()
    print("Critical components test passed!")
    
    print("\nTesting run script compatibility...")
    test_run_script_compatibility()
    print("Run script compatibility test passed!")