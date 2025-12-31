#!/usr/bin/env python3
"""
Property-based test for file movement functionality.
Feature: project-reorganization, Property 2: Functionality Preservation
Validates: Requirements 1.3, 2.3, 3.4, 6.1, 6.2, 6.3
"""

import os
import shutil
import tempfile
import stat
from pathlib import Path
from typing import List, Dict

try:
    from hypothesis import given, strategies as st, assume
    from hypothesis import settings
    HYPOTHESIS_AVAILABLE = True
except ImportError:
    HYPOTHESIS_AVAILABLE = False
    print("Warning: Hypothesis not available. Install with: pip install hypothesis")

# Import our file movement classes
import sys
sys.path.append('..')
from file_mover import FileCategorizer, FileMover

def create_test_files(base_dir: str, test_files: List[str], demo_files: List[str]) -> Dict[str, str]:
    """
    Create test files in a temporary directory.
    
    Args:
        base_dir: Base directory to create files in
        test_files: List of test file names to create
        demo_files: List of demo file names to create
    
    Returns:
        Dictionary mapping file names to their content
    """
    file_contents = {}
    
    # Create test files
    for test_file in test_files:
        file_path = os.path.join(base_dir, test_file)
        content = f'# Test file: {test_file}\nprint("This is {test_file}")\n'
        
        with open(file_path, 'w') as f:
            f.write(content)
        
        # Make some files executable
        if 'framework' in test_file:
            os.chmod(file_path, stat.S_IRWXU | stat.S_IRGRP | stat.S_IROTH)
        
        file_contents[test_file] = content
    
    # Create demo files
    for demo_file in demo_files:
        file_path = os.path.join(base_dir, demo_file)
        content = f'# Demo file: {demo_file}\nprint("This is {demo_file}")\n'
        
        with open(file_path, 'w') as f:
            f.write(content)
        
        # Make some files executable
        if 'system' in demo_file:
            os.chmod(file_path, stat.S_IRWXU | stat.S_IRGRP | stat.S_IROTH)
        
        file_contents[demo_file] = content
    
    return file_contents

def verify_file_functionality(base_dir: str, original_contents: Dict[str, str], 
                            file_mapping: Dict[str, Dict]) -> bool:
    """
    Verify that moved files preserve their functionality.
    
    Args:
        base_dir: Base directory
        original_contents: Original file contents
        file_mapping: Mapping of moved files
    
    Returns:
        True if all files preserve functionality
    """
    for original_file, mapping_info in file_mapping.items():
        target_path = os.path.join(base_dir, mapping_info['target_path'])
        
        # Check file exists at new location
        if not os.path.exists(target_path):
            return False
        
        # Check file doesn't exist at old location
        old_path = os.path.join(base_dir, original_file)
        if os.path.exists(old_path):
            return False
        
        # Check content is preserved
        with open(target_path, 'r') as f:
            new_content = f.read()
        
        if new_content != original_contents[original_file]:
            return False
        
        # Check permissions are preserved for executable files
        if 'framework' in original_file or 'system' in original_file:
            file_stat = os.stat(target_path)
            if not (file_stat.st_mode & stat.S_IXUSR):
                return False
    
    return True

if HYPOTHESIS_AVAILABLE:
    @given(
        test_files=st.lists(
            st.sampled_from([
                'test_api_example.py', 'test_framework_demo.py', 
                'test_integration_check.py', 'test_unit_basic.py',
                'test_general_functionality.py'
            ]),
            min_size=1,
            max_size=5,
            unique=True
        ),
        demo_files=st.lists(
            st.sampled_from([
                'demo_report_generation.py', 'demo_psychology_analysis.py',
                'demo_system_complete.py', 'demo_general_example.py'
            ]),
            min_size=1,
            max_size=4,
            unique=True
        )
    )
    @settings(max_examples=100)
    def test_functionality_preservation(test_files: List[str], demo_files: List[str]):
        """
        Property 2: Functionality Preservation
        
        For any set of test and demo files, after moving them to the new
        directory structure, the files should preserve their content,
        permissions, and be accessible at their new locations.
        
        **Feature: project-reorganization, Property 2: Functionality Preservation**
        **Validates: Requirements 1.3, 2.3, 3.4, 6.1, 6.2, 6.3**
        """
        with tempfile.TemporaryDirectory() as temp_dir:
            # Change to temp directory for testing
            original_cwd = os.getcwd()
            os.chdir(temp_dir)
            
            try:
                # Create directory structure
                os.makedirs('tests/api', exist_ok=True)
                os.makedirs('tests/framework', exist_ok=True)
                os.makedirs('tests/integration', exist_ok=True)
                os.makedirs('tests/unit', exist_ok=True)
                os.makedirs('demos/reports', exist_ok=True)
                os.makedirs('demos/psychology', exist_ok=True)
                os.makedirs('demos/system', exist_ok=True)
                
                # Create test files
                original_contents = create_test_files(temp_dir, test_files, demo_files)
                
                # Initialize file mover
                categorizer = FileCategorizer()
                mover = FileMover()
                
                # Create file mapping
                file_mapping = categorizer.create_file_mapping()
                
                # Only test files that actually exist
                existing_mapping = {k: v for k, v in file_mapping.items() 
                                  if os.path.exists(k)}
                
                if not existing_mapping:
                    # No files to move, test passes trivially
                    return
                
                # Move files
                success = mover.move_files(existing_mapping)
                assert success, "File movement should succeed"
                
                # Verify functionality preservation
                functionality_preserved = verify_file_functionality(
                    temp_dir, original_contents, existing_mapping
                )
                assert functionality_preserved, "File functionality should be preserved after movement"
                
            finally:
                os.chdir(original_cwd)

def test_basic_functionality_preservation():
    """
    Basic unit test for functionality preservation when Hypothesis is not available.
    """
    with tempfile.TemporaryDirectory() as temp_dir:
        original_cwd = os.getcwd()
        os.chdir(temp_dir)
        
        try:
            # Create directory structure
            os.makedirs('tests/api', exist_ok=True)
            os.makedirs('tests/framework', exist_ok=True)
            os.makedirs('demos/reports', exist_ok=True)
            os.makedirs('demos/system', exist_ok=True)
            
            # Create test files
            test_files = ['test_api_example.py', 'test_framework_demo.py']
            demo_files = ['demo_report_generation.py', 'demo_system_complete.py']
            
            original_contents = create_test_files(temp_dir, test_files, demo_files)
            
            # Initialize file mover
            categorizer = FileCategorizer()
            mover = FileMover()
            
            # Create and execute file mapping
            file_mapping = categorizer.create_file_mapping()
            success = mover.move_files(file_mapping)
            
            assert success, "File movement should succeed"
            
            # Verify functionality
            functionality_preserved = verify_file_functionality(
                temp_dir, original_contents, file_mapping
            )
            assert functionality_preserved, "File functionality should be preserved"
            
        finally:
            os.chdir(original_cwd)

if __name__ == "__main__":
    if HYPOTHESIS_AVAILABLE:
        print("Running property-based test...")
        test_functionality_preservation()
        print("Property test passed!")
    else:
        print("Running basic unit test...")
        test_basic_functionality_preservation()
        print("Basic test passed!")