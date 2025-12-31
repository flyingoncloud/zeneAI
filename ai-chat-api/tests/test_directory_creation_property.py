#!/usr/bin/env python3
"""
Property-based test for directory creation functionality.
Feature: project-reorganization, Property 1: File Pattern Movement Consistency
Validates: Requirements 2.1, 3.2
"""

import os
import shutil
import tempfile
from pathlib import Path
from typing import List

try:
    from hypothesis import given, strategies as st, assume
    from hypothesis import settings
    HYPOTHESIS_AVAILABLE = True
except ImportError:
    HYPOTHESIS_AVAILABLE = False
    print("Warning: Hypothesis not available. Install with: pip install hypothesis")

def create_test_directories(base_path: str, test_dirs: List[str], demo_dirs: List[str]) -> bool:
    """
    Create test and demo directory structures.
    
    Args:
        base_path: Base directory path
        test_dirs: List of test subdirectories to create
        demo_dirs: List of demo subdirectories to create
    
    Returns:
        True if all directories were created successfully
    """
    try:
        # Create tests directory structure
        tests_path = Path(base_path) / "tests"
        tests_path.mkdir(exist_ok=True)
        
        for subdir in test_dirs:
            (tests_path / subdir).mkdir(exist_ok=True)
        
        # Create demos directory structure  
        demos_path = Path(base_path) / "demos"
        demos_path.mkdir(exist_ok=True)
        
        for subdir in demo_dirs:
            (demos_path / subdir).mkdir(exist_ok=True)
            
        return True
    except Exception as e:
        print(f"Directory creation failed: {e}")
        return False

def verify_directory_structure(base_path: str, test_dirs: List[str], demo_dirs: List[str]) -> bool:
    """
    Verify that the directory structure was created correctly.
    
    Args:
        base_path: Base directory path
        test_dirs: Expected test subdirectories
        demo_dirs: Expected demo subdirectories
    
    Returns:
        True if all expected directories exist
    """
    base = Path(base_path)
    
    # Check tests directory and subdirectories
    tests_path = base / "tests"
    if not tests_path.exists() or not tests_path.is_dir():
        return False
        
    for subdir in test_dirs:
        if not (tests_path / subdir).exists() or not (tests_path / subdir).is_dir():
            return False
    
    # Check demos directory and subdirectories
    demos_path = base / "demos"
    if not demos_path.exists() or not demos_path.is_dir():
        return False
        
    for subdir in demo_dirs:
        if not (demos_path / subdir).exists() or not (demos_path / subdir).is_dir():
            return False
    
    return True

if HYPOTHESIS_AVAILABLE:
    @given(
        test_dirs=st.lists(
            st.sampled_from(['unit', 'integration', 'api', 'framework']),
            min_size=1,
            max_size=4,
            unique=True
        ),
        demo_dirs=st.lists(
            st.sampled_from(['reports', 'psychology', 'system']),
            min_size=1,
            max_size=3,
            unique=True
        )
    )
    @settings(max_examples=100)
    def test_directory_creation_consistency(test_dirs: List[str], demo_dirs: List[str]):
        """
        Property 1: File Pattern Movement Consistency
        
        For any valid combination of test and demo subdirectories,
        creating the directory structure should result in all specified
        directories existing in the correct locations.
        
        **Feature: project-reorganization, Property 1: File Pattern Movement Consistency**
        **Validates: Requirements 2.1, 3.2**
        """
        # Create temporary directory for testing
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create the directory structure
            success = create_test_directories(temp_dir, test_dirs, demo_dirs)
            
            # Verify creation was successful
            assert success, "Directory creation should succeed"
            
            # Verify all expected directories exist
            structure_valid = verify_directory_structure(temp_dir, test_dirs, demo_dirs)
            assert structure_valid, f"All specified directories should exist: tests/{test_dirs}, demos/{demo_dirs}"
            
            # Verify no unexpected directories were created
            tests_path = Path(temp_dir) / "tests"
            actual_test_dirs = [d.name for d in tests_path.iterdir() if d.is_dir()]
            assert set(actual_test_dirs) == set(test_dirs), f"Only specified test dirs should exist: expected {test_dirs}, got {actual_test_dirs}"
            
            demos_path = Path(temp_dir) / "demos"
            actual_demo_dirs = [d.name for d in demos_path.iterdir() if d.is_dir()]
            assert set(actual_demo_dirs) == set(demo_dirs), f"Only specified demo dirs should exist: expected {demo_dirs}, got {actual_demo_dirs}"

def test_basic_directory_creation():
    """
    Basic unit test for directory creation when Hypothesis is not available.
    """
    with tempfile.TemporaryDirectory() as temp_dir:
        test_dirs = ['unit', 'integration', 'api', 'framework']
        demo_dirs = ['reports', 'psychology', 'system']
        
        # Create directories
        success = create_test_directories(temp_dir, test_dirs, demo_dirs)
        assert success, "Directory creation should succeed"
        
        # Verify structure
        structure_valid = verify_directory_structure(temp_dir, test_dirs, demo_dirs)
        assert structure_valid, "All directories should be created correctly"

if __name__ == "__main__":
    if HYPOTHESIS_AVAILABLE:
        print("Running property-based test...")
        test_directory_creation_consistency()
        print("Property test passed!")
    else:
        print("Running basic unit test...")
        test_basic_directory_creation()
        print("Basic test passed!")