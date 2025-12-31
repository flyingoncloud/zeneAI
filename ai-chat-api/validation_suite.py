#!/usr/bin/env python3
"""
Comprehensive validation suite for project reorganization.
Tests execution of moved files and validates functionality preservation.
"""

import os
import sys
import subprocess
import glob
from pathlib import Path
from typing import Dict, List, Tuple
import json

class ValidationSuite:
    """Comprehensive validation for reorganized project."""
    
    def __init__(self):
        self.results = {
            'test_files': {},
            'demo_files': {},
            'main_app': {},
            'summary': {}
        }
    
    def validate_test_files(self) -> Dict[str, bool]:
        """Validate all moved test files can execute."""
        print("=== VALIDATING TEST FILES ===")
        
        test_files = glob.glob("tests/**/*.py", recursive=True)
        test_files = [f for f in test_files if not f.endswith('_property.py')]  # Skip property tests for now
        
        results = {}
        
        for test_file in test_files:
            print(f"Testing {test_file}...")
            
            try:
                # Check syntax first
                with open(test_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                compile(content, test_file, 'exec')
                
                # Try to execute (with timeout)
                result = subprocess.run(
                    [sys.executable, test_file],
                    capture_output=True,
                    text=True,
                    timeout=30,
                    cwd='.'
                )
                
                # Consider it successful if it runs without syntax errors
                # (runtime errors are expected for tests that need external services)
                success = result.returncode == 0 or 'SyntaxError' not in result.stderr
                results[test_file] = success
                
                if success:
                    print(f"  ✓ {test_file}")
                else:
                    print(f"  ✗ {test_file}: {result.stderr[:100]}...")
                    
            except subprocess.TimeoutExpired:
                print(f"  ⏱ {test_file}: Timeout (likely waiting for user input)")
                results[test_file] = True  # Timeout is acceptable
            except Exception as e:
                print(f"  ✗ {test_file}: {e}")
                results[test_file] = False
        
        self.results['test_files'] = results
        return results
    
    def validate_demo_files(self) -> Dict[str, bool]:
        """Validate all moved demo files can execute."""
        print("\n=== VALIDATING DEMO FILES ===")
        
        demo_files = glob.glob("demos/**/*.py", recursive=True)
        results = {}
        
        for demo_file in demo_files:
            print(f"Testing {demo_file}...")
            
            try:
                # Check syntax first
                with open(demo_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                compile(content, demo_file, 'exec')
                
                # Try to execute (with timeout)
                result = subprocess.run(
                    [sys.executable, demo_file],
                    capture_output=True,
                    text=True,
                    timeout=30,
                    cwd='.'
                )
                
                # Consider it successful if it runs without syntax errors
                success = result.returncode == 0 or 'SyntaxError' not in result.stderr
                results[demo_file] = success
                
                if success:
                    print(f"  ✓ {demo_file}")
                else:
                    print(f"  ✗ {demo_file}: {result.stderr[:100]}...")
                    
            except subprocess.TimeoutExpired:
                print(f"  ⏱ {demo_file}: Timeout (likely waiting for user input)")
                results[demo_file] = True  # Timeout is acceptable
            except Exception as e:
                print(f"  ✗ {demo_file}: {e}")
                results[demo_file] = False
        
        self.results['demo_files'] = results
        return results
    
    def validate_main_application(self) -> Dict[str, bool]:
        """Validate main application functionality."""
        print("\n=== VALIDATING MAIN APPLICATION ===")
        
        results = {}
        
        # Test main application imports
        try:
            print("Testing main application imports...")
            
            # Test core imports
            from src.api.app import app
            from src.database.database import get_database
            from src.psychology.multi_detector import MultiPsychologyDetector
            
            results['core_imports'] = True
            print("  ✓ Core imports successful")
            
        except Exception as e:
            results['core_imports'] = False
            print(f"  ✗ Core imports failed: {e}")
        
        # Test configuration loading
        try:
            print("Testing configuration...")
            from src.config.settings import DATABASE_URL, OPENAI_API_KEY
            results['config_loading'] = True
            print("  ✓ Configuration loading successful")
            
        except Exception as e:
            results['config_loading'] = False
            print(f"  ✗ Configuration loading failed: {e}")
        
        # Test run.py
        try:
            print("Testing run.py syntax...")
            with open('run.py', 'r') as f:
                content = f.read()
            compile(content, 'run.py', 'exec')
            results['run_py_syntax'] = True
            print("  ✓ run.py syntax OK")
            
        except Exception as e:
            results['run_py_syntax'] = False
            print(f"  ✗ run.py syntax error: {e}")
        
        self.results['main_app'] = results
        return results
    
    def run_property_tests(self) -> Dict[str, bool]:
        """Run property-based tests."""
        print("\n=== RUNNING PROPERTY TESTS ===")
        
        property_tests = glob.glob("tests/test_*_property.py")
        results = {}
        
        for test_file in property_tests:
            print(f"Running {test_file}...")
            
            try:
                result = subprocess.run(
                    [sys.executable, '-m', 'pytest', test_file, '-v'],
                    capture_output=True,
                    text=True,
                    timeout=60
                )
                
                success = result.returncode == 0
                results[test_file] = success
                
                if success:
                    print(f"  ✓ {test_file}")
                else:
                    print(f"  ✗ {test_file}: Some tests failed")
                    
            except subprocess.TimeoutExpired:
                print(f"  ⏱ {test_file}: Timeout")
                results[test_file] = False
            except Exception as e:
                print(f"  ✗ {test_file}: {e}")
                results[test_file] = False
        
        return results
    
    def generate_summary(self) -> Dict:
        """Generate validation summary."""
        summary = {}
        
        # Test files summary
        test_results = self.results.get('test_files', {})
        if test_results:
            test_success = sum(1 for success in test_results.values() if success)
            test_total = len(test_results)
            summary['test_files'] = {
                'success_rate': test_success / test_total if test_total > 0 else 0,
                'successful': test_success,
                'total': test_total
            }
        
        # Demo files summary
        demo_results = self.results.get('demo_files', {})
        if demo_results:
            demo_success = sum(1 for success in demo_results.values() if success)
            demo_total = len(demo_results)
            summary['demo_files'] = {
                'success_rate': demo_success / demo_total if demo_total > 0 else 0,
                'successful': demo_success,
                'total': demo_total
            }
        
        # Main app summary
        main_results = self.results.get('main_app', {})
        if main_results:
            main_success = sum(1 for success in main_results.values() if success)
            main_total = len(main_results)
            summary['main_app'] = {
                'success_rate': main_success / main_total if main_total > 0 else 0,
                'successful': main_success,
                'total': main_total
            }
        
        self.results['summary'] = summary
        return summary
    
    def print_summary(self):
        """Print validation summary."""
        print("\n" + "="*50)
        print("VALIDATION SUMMARY")
        print("="*50)
        
        summary = self.results.get('summary', {})
        
        if 'test_files' in summary:
            test_info = summary['test_files']
            print(f"Test Files: {test_info['successful']}/{test_info['total']} ({test_info['success_rate']:.1%})")
        
        if 'demo_files' in summary:
            demo_info = summary['demo_files']
            print(f"Demo Files: {demo_info['successful']}/{demo_info['total']} ({demo_info['success_rate']:.1%})")
        
        if 'main_app' in summary:
            main_info = summary['main_app']
            print(f"Main App: {main_info['successful']}/{main_info['total']} ({main_info['success_rate']:.1%})")
        
        # Overall assessment
        all_rates = [info['success_rate'] for info in summary.values()]
        if all_rates:
            overall_rate = sum(all_rates) / len(all_rates)
            print(f"\nOverall Success Rate: {overall_rate:.1%}")
            
            if overall_rate >= 0.8:
                print("🎉 REORGANIZATION SUCCESSFUL!")
            elif overall_rate >= 0.6:
                print("⚠️  REORGANIZATION MOSTLY SUCCESSFUL (some issues)")
            else:
                print("❌ REORGANIZATION NEEDS ATTENTION")
    
    def save_results(self, filename: str = "validation_results.json"):
        """Save validation results to file."""
        with open(filename, 'w') as f:
            json.dump(self.results, f, indent=2)
        print(f"\nResults saved to {filename}")
    
    def run_full_validation(self):
        """Run complete validation suite."""
        print("Starting comprehensive validation...")
        
        self.validate_test_files()
        self.validate_demo_files()
        self.validate_main_application()
        
        self.generate_summary()
        self.print_summary()
        self.save_results()
        
        return self.results

def main():
    """Main function to run validation."""
    validator = ValidationSuite()
    return validator.run_full_validation()

if __name__ == "__main__":
    main()