#!/usr/bin/env python3
"""
File analyzer for project reorganization.
Scans and categorizes test_*.py and demo_*.py files.
"""

import os
import glob
from typing import Dict, List, Tuple

def analyze_files() -> Tuple[Dict[str, List[str]], Dict[str, List[str]]]:
    """
    Analyze and categorize test and demo files.
    
    Returns:
        Tuple of (test_files_dict, demo_files_dict) where each dict maps
        category to list of file paths.
    """
    
    # Find all test files
    test_files = glob.glob("test_*.py")
    demo_files = glob.glob("demo_*.py")
    
    # Categorize test files
    test_categories = {
        'api': [],
        'framework': [],
        'integration': [],
        'unit': [],
        'general': []
    }
    
    for test_file in test_files:
        if 'api' in test_file.lower():
            test_categories['api'].append(test_file)
        elif 'framework' in test_file.lower():
            test_categories['framework'].append(test_file)
        elif 'integration' in test_file.lower():
            test_categories['integration'].append(test_file)
        elif 'unit' in test_file.lower():
            test_categories['unit'].append(test_file)
        else:
            test_categories['general'].append(test_file)
    
    # Categorize demo files
    demo_categories = {
        'reports': [],
        'psychology': [],
        'system': [],
        'general': []
    }
    
    for demo_file in demo_files:
        if 'report' in demo_file.lower():
            demo_categories['reports'].append(demo_file)
        elif 'framework' in demo_file.lower() or 'psychology' in demo_file.lower():
            demo_categories['psychology'].append(demo_file)
        elif 'complete' in demo_file.lower() or 'final' in demo_file.lower() or 'system' in demo_file.lower():
            demo_categories['system'].append(demo_file)
        else:
            demo_categories['general'].append(demo_file)
    
    return test_categories, demo_categories

def print_analysis():
    """Print the file analysis results."""
    test_cats, demo_cats = analyze_files()
    
    print("=== FILE ANALYSIS RESULTS ===")
    print("\nTEST FILES:")
    for category, files in test_cats.items():
        if files:
            print(f"  {category.upper()}:")
            for file in files:
                print(f"    - {file}")
    
    print("\nDEMO FILES:")
    for category, files in demo_cats.items():
        if files:
            print(f"  {category.upper()}:")
            for file in files:
                print(f"    - {file}")

if __name__ == "__main__":
    print_analysis()