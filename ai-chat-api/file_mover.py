#!/usr/bin/env python3
"""
File movement system for project reorganization.
Implements pattern matching and safe file movement operations.
"""

import os
import shutil
import glob
from pathlib import Path
from typing import Dict, List, Tuple
import json

class FileCategorizer:
    """Handles file categorization logic for test and demo files."""
    
    def __init__(self):
        self.test_patterns = {
            'api': ['api'],
            'framework': ['framework'],
            'integration': ['integration'],
            'unit': ['unit']
        }
        
        self.demo_patterns = {
            'reports': ['report'],
            'psychology': ['framework', 'psychology'],
            'system': ['complete', 'final', 'system']
        }
    
    def categorize_test_file(self, filename: str) -> str:
        """
        Categorize a test file based on its name.
        
        Args:
            filename: Name of the test file
            
        Returns:
            Category name ('api', 'framework', 'integration', 'unit', or 'general')
        """
        filename_lower = filename.lower()
        
        for category, patterns in self.test_patterns.items():
            if any(pattern in filename_lower for pattern in patterns):
                return category
        
        return 'general'
    
    def categorize_demo_file(self, filename: str) -> str:
        """
        Categorize a demo file based on its name.
        
        Args:
            filename: Name of the demo file
            
        Returns:
            Category name ('reports', 'psychology', 'system', or 'general')
        """
        filename_lower = filename.lower()
        
        for category, patterns in self.demo_patterns.items():
            if any(pattern in filename_lower for pattern in patterns):
                return category
        
        return 'general'
    
    def create_file_mapping(self) -> Dict[str, Dict]:
        """
        Create mapping of source files to target directories.
        
        Returns:
            Dictionary mapping source files to target information
        """
        mapping = {}
        
        # Find and categorize test files
        test_files = glob.glob("test_*.py")
        for test_file in test_files:
            category = self.categorize_test_file(test_file)
            target_dir = f"tests/{category}" if category != 'general' else "tests"
            
            mapping[test_file] = {
                'source_path': test_file,
                'target_path': f"{target_dir}/{test_file}",
                'file_type': 'test',
                'category': category,
                'target_dir': target_dir
            }
        
        # Find and categorize demo files
        demo_files = glob.glob("demo_*.py")
        for demo_file in demo_files:
            category = self.categorize_demo_file(demo_file)
            target_dir = f"demos/{category}" if category != 'general' else "demos"
            
            mapping[demo_file] = {
                'source_path': demo_file,
                'target_path': f"{target_dir}/{demo_file}",
                'file_type': 'demo',
                'category': category,
                'target_dir': target_dir
            }
        
        return mapping

class FileMover:
    """Handles safe file movement operations."""
    
    def __init__(self):
        self.categorizer = FileCategorizer()
        self.backup_dir = "backup_original_locations"
        self.moved_files = []
    
    def create_backup_record(self, file_mapping: Dict[str, Dict]) -> None:
        """
        Create backup record of original file locations.
        
        Args:
            file_mapping: Dictionary of file mappings
        """
        os.makedirs(self.backup_dir, exist_ok=True)
        
        backup_record = {
            'original_locations': {},
            'timestamp': str(Path().cwd()),
            'mapping': file_mapping
        }
        
        for source_file in file_mapping:
            if os.path.exists(source_file):
                backup_record['original_locations'][source_file] = {
                    'path': source_file,
                    'permissions': oct(os.stat(source_file).st_mode)[-3:],
                    'exists': True
                }
        
        with open(f"{self.backup_dir}/file_locations.json", 'w') as f:
            json.dump(backup_record, f, indent=2)
    
    def move_file_safely(self, source: str, target: str) -> bool:
        """
        Move a file safely, preserving permissions.
        
        Args:
            source: Source file path
            target: Target file path
            
        Returns:
            True if move was successful
        """
        try:
            if not os.path.exists(source):
                print(f"Warning: Source file {source} does not exist")
                return False
            
            # Create target directory if it doesn't exist
            target_dir = os.path.dirname(target)
            os.makedirs(target_dir, exist_ok=True)
            
            # Get original permissions
            original_permissions = os.stat(source).st_mode
            
            # Move the file
            shutil.move(source, target)
            
            # Restore permissions
            os.chmod(target, original_permissions)
            
            self.moved_files.append((source, target))
            print(f"Moved: {source} → {target}")
            return True
            
        except Exception as e:
            print(f"Error moving {source} to {target}: {e}")
            return False
    
    def move_files(self, file_mapping: Dict[str, Dict]) -> bool:
        """
        Move all files according to the mapping.
        
        Args:
            file_mapping: Dictionary of file mappings
            
        Returns:
            True if all moves were successful
        """
        # Create backup record first
        self.create_backup_record(file_mapping)
        
        success_count = 0
        total_files = len(file_mapping)
        
        for source_file, mapping_info in file_mapping.items():
            if self.move_file_safely(source_file, mapping_info['target_path']):
                success_count += 1
        
        print(f"Successfully moved {success_count}/{total_files} files")
        return success_count == total_files

def main():
    """Main function to demonstrate file categorization and movement."""
    categorizer = FileCategorizer()
    mover = FileMover()
    
    # Create file mapping
    file_mapping = categorizer.create_file_mapping()
    
    print("=== FILE MAPPING ===")
    for source, info in file_mapping.items():
        print(f"{source} → {info['target_path']} ({info['category']})")
    
    return file_mapping

if __name__ == "__main__":
    main()