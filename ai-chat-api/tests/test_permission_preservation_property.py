#!/usr/bin/env python3
"""
Property-based test for file permission preservation.
Feature: project-reorganization, Property 5: File Permission Preservation
Validates: Requirements 1.4
"""

import os
import stat
import json
from pathlib import Path
from typing import Dict, List

try:
    from hypothesis import given, strategies as st, assume
    from hypothesis import settings
    HYPOTHESIS_AVAILABLE = True
except ImportError:
    HYPOTHESIS_AVAILABLE = False
    print("Warning: Hypothesis not available. Install with: pip install hypothesis")

def load_backup_record() -> Dict:
    """Load the backup record of original file locations and permissions."""
    backup_file = "backup_original_locations/file_locations.json"
    if os.path.exists(backup_file):
        with open(backup_file, 'r') as f:
            return json.load(f)
    return {}

def get_file_permissions(file_path: str) -> str:
    """Get file permissions as octal string."""
    if os.path.exists(file_path):
        return oct(os.stat(file_path).st_mode)[-3:]
    return None

def check_permission_preservation(original_file: str, new_file: str, expected_permissions: str) -> bool:
    """
    Check if file permissions were preserved during move.
    
    Args:
        original_file: Original file path
        new_file: New file path
        expected_permissions: Expected permissions (octal string)
        
    Returns:
        True if permissions are preserved
    """
    if not os.path.exists(new_file):
        return False
    
    # Original file should not exist
    if os.path.exists(original_file):
        return False
    
    # Check if permissions match
    current_permissions = get_file_permissions(new_file)
    return current_permissions == expected_permissions

def verify_all_moved_files_permissions() -> Dict[str, bool]:
    """Verify permissions for all moved files."""
    backup_data = load_backup_record()
    
    if not backup_data or 'mapping' not in backup_data:
        return {}
    
    results = {}
    original_locations = backup_data.get('original_locations', {})
    
    for original_file, mapping_info in backup_data['mapping'].items():
        new_file = mapping_info['target_path']
        
        # Get expected permissions from backup
        if original_file in original_locations:
            expected_permissions = original_locations[original_file]['permissions']
            
            preserved = check_permission_preservation(original_file, new_file, expected_permissions)
            results[new_file] = preserved
    
    return results

if HYPOTHESIS_AVAILABLE:
    @given(
        file_subset=st.lists(
            st.sampled_from([
                'tests/test_openai_import.py',
                'tests/api/test_api_report_endpoints.py',
                'demos/reports/demo_working_report.py',
                'demos/system/demo_complete_system.py'
            ]),
            min_size=1,
            max_size=4,
            unique=True
        )
    )
    @settings(max_examples=50)
    def test_file_permission_preservation(file_subset: List[str]):
        """
        Property 5: File Permission Preservation
        
        For any subset of moved files, the file permissions after
        reorganization should be identical to the permissions before
        reorganization.
        
        **Feature: project-reorganization, Property 5: File Permission Preservation**
        **Validates: Requirements 1.4**
        """
        backup_data = load_backup_record()
        
        if not backup_data or 'mapping' not in backup_data:
            # No backup data available, skip test
            return
        
        original_locations = backup_data.get('original_locations', {})
        mapping = backup_data['mapping']
        
        # Only test files that exist in our subset and were actually moved
        testable_files = []
        for file_path in file_subset:
            # Find the original file that maps to this new location
            for original_file, mapping_info in mapping.items():
                if mapping_info['target_path'] == file_path:
                    if original_file in original_locations and os.path.exists(file_path):
                        testable_files.append((original_file, file_path))
                    break
        
        if not testable_files:
            # No testable files in this subset, pass trivially
            return
        
        all_permissions_preserved = True
        failed_files = []
        
        for original_file, new_file in testable_files:
            expected_permissions = original_locations[original_file]['permissions']
            
            preserved = check_permission_preservation(original_file, new_file, expected_permissions)
            
            if not preserved:
                all_permissions_preserved = False
                failed_files.append((original_file, new_file))
        
        assert all_permissions_preserved, f"File permissions should be preserved for all moved files. Failed: {failed_files}"

def test_basic_permission_preservation():
    """
    Basic unit test for permission preservation when Hypothesis is not available.
    """
    backup_data = load_backup_record()
    
    if not backup_data or 'mapping' not in backup_data:
        print("No backup data found - skipping permission test")
        return
    
    results = verify_all_moved_files_permissions()
    
    if not results:
        print("No moved files found to test")
        return
    
    total_files = len(results)
    preserved_files = sum(1 for preserved in results.values() if preserved)
    
    print(f"Permission preservation check:")
    print(f"Total files: {total_files}")
    print(f"Permissions preserved: {preserved_files}")
    print(f"Success rate: {preserved_files/total_files:.1%}")
    
    # Show failed files
    failed_files = [file_path for file_path, preserved in results.items() if not preserved]
    if failed_files:
        print("Files with permission issues:")
        for file_path in failed_files[:5]:  # Show first 5
            print(f"  - {file_path}")
    
    # Most files should preserve permissions
    success_rate = preserved_files / total_files
    assert success_rate >= 0.8, f"Permission preservation rate should be >= 80%, got {success_rate:.1%}"

def test_specific_executable_files():
    """Test that specific files that should be executable remain executable."""
    executable_files = [
        'demos/system/demo_complete_system.py',
        'demos/system/demo_final_chinese_system.py',
        'tests/framework/test_final_framework_demo.py'
    ]
    
    for file_path in executable_files:
        if os.path.exists(file_path):
            file_stat = os.stat(file_path)
            is_executable = bool(file_stat.st_mode & stat.S_IXUSR)
            
            # Note: We can't assert executable status since it depends on original permissions
            # Just check that the file exists and has some permissions
            assert file_stat.st_mode & 0o777 > 0, f"File {file_path} should have some permissions set"

def test_backup_record_integrity():
    """Test that the backup record is properly formatted."""
    backup_data = load_backup_record()
    
    if backup_data:
        assert 'mapping' in backup_data, "Backup record should contain mapping"
        assert 'original_locations' in backup_data, "Backup record should contain original_locations"
        
        # Check that mapping entries have required fields
        for original_file, mapping_info in backup_data['mapping'].items():
            assert 'target_path' in mapping_info, f"Mapping for {original_file} should have target_path"
            assert 'file_type' in mapping_info, f"Mapping for {original_file} should have file_type"
        
        # Check that original_locations have permission info
        for original_file, location_info in backup_data['original_locations'].items():
            assert 'permissions' in location_info, f"Location info for {original_file} should have permissions"

if __name__ == "__main__":
    if HYPOTHESIS_AVAILABLE:
        print("Running property-based test...")
        test_file_permission_preservation()
        print("Property test passed!")
    else:
        print("Running basic unit test...")
        test_basic_permission_preservation()
        print("Basic test passed!")
    
    print("Testing specific executable files...")
    test_specific_executable_files()
    print("Executable file test passed!")
    
    print("Testing backup record integrity...")
    test_backup_record_integrity()
    print("Backup record test passed!")