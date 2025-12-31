#!/usr/bin/env python3
"""
Import path updater for reorganized files.
Updates import statements to work with the new directory structure.
"""

import os
import re
from pathlib import Path
from typing import Dict, List

class ImportUpdater:
    """Updates import paths in moved files."""
    
    def __init__(self):
        self.project_root = Path.cwd()
        self.updates_made = []
    
    def calculate_relative_path_to_root(self, file_path: str) -> str:
        """
        Calculate the relative path from a file to the project root.
        
        Args:
            file_path: Path to the file
            
        Returns:
            Relative path string to add to sys.path
        """
        file_path = Path(file_path).resolve()
        
        # Count directory levels from root
        try:
            relative_to_root = file_path.relative_to(self.project_root)
            levels_deep = len(relative_to_root.parts) - 1  # Subtract 1 for the file itself
        except ValueError:
            # File is not in project root, calculate manually
            file_dir = file_path.parent
            levels_deep = len(file_dir.parts) - len(self.project_root.parts)
        
        if levels_deep <= 0:
            return "."
        else:
            return "/".join([".."] * levels_deep)
    
    def update_sys_path_append(self, file_path: str) -> bool:
        """
        Update sys.path.append statements in a file.
        
        Args:
            file_path: Path to the file to update
            
        Returns:
            True if updates were made
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            
            # Pattern to match sys.path.append with dirname/abspath
            pattern = r'sys\.path\.append\(os\.path\.dirname\(os\.path\.abspath\(__file__\)\)\)'
            
            # Calculate correct relative path
            relative_path = self.calculate_relative_path_to_root(file_path)
            
            # Create replacement
            if relative_path == ".":
                replacement = 'sys.path.append(".")'
            else:
                replacement = f'sys.path.append(os.path.join(os.path.dirname(__file__), "{relative_path}"))'
            
            # Replace the pattern
            updated_content = re.sub(pattern, replacement, content)
            
            # Also handle variations with single quotes
            pattern2 = r"sys\.path\.append\(os\.path\.dirname\(os\.path\.abspath\(__file__\)\)\)"
            updated_content = re.sub(pattern2, replacement, updated_content)
            
            # Write back if changes were made
            if updated_content != original_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(updated_content)
                
                self.updates_made.append({
                    'file': file_path,
                    'type': 'sys_path_update',
                    'relative_path': relative_path
                })
                return True
            
            return False
            
        except Exception as e:
            print(f"Error updating {file_path}: {e}")
            return False
    
    def update_relative_imports(self, file_path: str) -> bool:
        """
        Update relative import statements in a file.
        
        Args:
            file_path: Path to the file to update
            
        Returns:
            True if updates were made
        """
        # For this reorganization, most imports are absolute from src/
        # so relative imports shouldn't need major changes
        return False
    
    def update_all_moved_files(self) -> Dict[str, int]:
        """
        Update import statements in all moved files.
        
        Returns:
            Dictionary with update statistics
        """
        stats = {
            'files_processed': 0,
            'files_updated': 0,
            'sys_path_updates': 0,
            'relative_import_updates': 0
        }
        
        # Find all Python files in tests and demos directories
        test_files = list(Path('tests').rglob('*.py'))
        demo_files = list(Path('demos').rglob('*.py'))
        
        all_files = test_files + demo_files
        
        for file_path in all_files:
            stats['files_processed'] += 1
            
            # Update sys.path.append statements
            if self.update_sys_path_append(str(file_path)):
                stats['files_updated'] += 1
                stats['sys_path_updates'] += 1
            
            # Update relative imports
            if self.update_relative_imports(str(file_path)):
                stats['relative_import_updates'] += 1
        
        return stats
    
    def print_update_summary(self):
        """Print summary of updates made."""
        print("=== IMPORT UPDATE SUMMARY ===")
        
        if not self.updates_made:
            print("No import updates were needed.")
            return
        
        print(f"Total updates made: {len(self.updates_made)}")
        
        for update in self.updates_made:
            print(f"  - {update['file']}: {update['type']} (path: {update['relative_path']})")

def main():
    """Main function to update imports."""
    updater = ImportUpdater()
    
    print("Updating import statements in moved files...")
    stats = updater.update_all_moved_files()
    
    print(f"Processed {stats['files_processed']} files")
    print(f"Updated {stats['files_updated']} files")
    print(f"Sys.path updates: {stats['sys_path_updates']}")
    print(f"Relative import updates: {stats['relative_import_updates']}")
    
    updater.print_update_summary()
    
    return updater

if __name__ == "__main__":
    main()