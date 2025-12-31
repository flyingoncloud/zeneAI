#!/usr/bin/env python3
"""
Import dependency analyzer for project reorganization.
Scans Python files for import statements and identifies dependencies.
"""

import os
import ast
import glob
from pathlib import Path
from typing import Dict, List, Set, Tuple
import json

class ImportAnalyzer:
    """Analyzes import dependencies in Python files."""
    
    def __init__(self):
        self.dependencies = {}
        self.moved_files = self._load_moved_files()
    
    def _load_moved_files(self) -> Dict[str, str]:
        """Load information about moved files from backup record."""
        backup_file = "backup_original_locations/file_locations.json"
        if os.path.exists(backup_file):
            with open(backup_file, 'r') as f:
                backup_data = json.load(f)
                return {
                    old_path: info['target_path'] 
                    for old_path, info in backup_data['mapping'].items()
                }
        return {}
    
    def extract_imports_from_file(self, file_path: str) -> List[Dict]:
        """
        Extract import statements from a Python file.
        
        Args:
            file_path: Path to the Python file
            
        Returns:
            List of import information dictionaries
        """
        imports = []
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            tree = ast.parse(content)
            
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        imports.append({
                            'type': 'import',
                            'module': alias.name,
                            'alias': alias.asname,
                            'line': node.lineno
                        })
                
                elif isinstance(node, ast.ImportFrom):
                    module = node.module or ''
                    for alias in node.names:
                        imports.append({
                            'type': 'from_import',
                            'module': module,
                            'name': alias.name,
                            'alias': alias.asname,
                            'level': node.level,
                            'line': node.lineno
                        })
        
        except Exception as e:
            print(f"Error parsing {file_path}: {e}")
        
        return imports
    
    def find_all_python_files(self) -> List[str]:
        """Find all Python files in the project."""
        python_files = []
        
        # Find files in src directory
        src_files = glob.glob("src/**/*.py", recursive=True)
        python_files.extend(src_files)
        
        # Find files in tests directory
        test_files = glob.glob("tests/**/*.py", recursive=True)
        python_files.extend(test_files)
        
        # Find files in demos directory
        demo_files = glob.glob("demos/**/*.py", recursive=True)
        python_files.extend(demo_files)
        
        # Find root level Python files
        root_files = glob.glob("*.py")
        python_files.extend(root_files)
        
        return python_files
    
    def analyze_dependencies(self) -> Dict[str, Dict]:
        """
        Analyze import dependencies across all Python files.
        
        Returns:
            Dictionary mapping file paths to their import information
        """
        all_files = self.find_all_python_files()
        dependencies = {}
        
        for file_path in all_files:
            imports = self.extract_imports_from_file(file_path)
            dependencies[file_path] = {
                'imports': imports,
                'needs_update': self._needs_import_update(file_path, imports),
                'references_moved_files': self._references_moved_files(imports)
            }
        
        return dependencies
    
    def _needs_import_update(self, file_path: str, imports: List[Dict]) -> bool:
        """Check if a file needs import updates."""
        # Check if file itself was moved
        if any(old_path in file_path for old_path in self.moved_files.keys()):
            return True
        
        # Check if it imports any moved files
        return self._references_moved_files(imports)
    
    def _references_moved_files(self, imports: List[Dict]) -> bool:
        """Check if imports reference any moved files."""
        for imp in imports:
            if imp['type'] == 'import':
                # Check if importing a moved module
                module_parts = imp['module'].split('.')
                if any(part in self.moved_files for part in module_parts):
                    return True
            
            elif imp['type'] == 'from_import':
                # Check relative imports
                if imp['level'] > 0:  # Relative import
                    return True
                
                # Check if importing from a moved module
                if imp['module'] in self.moved_files:
                    return True
        
        return False
    
    def generate_update_plan(self) -> Dict[str, List[Dict]]:
        """
        Generate a plan for updating import statements.
        
        Returns:
            Dictionary mapping file paths to list of required updates
        """
        dependencies = self.analyze_dependencies()
        update_plan = {}
        
        for file_path, info in dependencies.items():
            if info['needs_update']:
                updates = []
                
                for imp in info['imports']:
                    update = self._plan_import_update(file_path, imp)
                    if update:
                        updates.append(update)
                
                if updates:
                    update_plan[file_path] = updates
        
        return update_plan
    
    def _plan_import_update(self, file_path: str, import_info: Dict) -> Dict:
        """Plan an update for a specific import statement."""
        if import_info['type'] == 'from_import' and import_info['level'] > 0:
            # Handle relative imports
            return {
                'line': import_info['line'],
                'type': 'relative_import_update',
                'original': import_info,
                'action': 'update_relative_path'
            }
        
        # For now, return None for other cases
        # In a full implementation, we'd handle absolute imports to moved modules
        return None
    
    def print_analysis(self):
        """Print the dependency analysis results."""
        dependencies = self.analyze_dependencies()
        update_plan = self.generate_update_plan()
        
        print("=== IMPORT DEPENDENCY ANALYSIS ===")
        
        files_needing_updates = [f for f, info in dependencies.items() if info['needs_update']]
        
        print(f"\nFiles needing import updates: {len(files_needing_updates)}")
        for file_path in files_needing_updates:
            print(f"  - {file_path}")
        
        print(f"\nFiles with update plans: {len(update_plan)}")
        for file_path, updates in update_plan.items():
            print(f"  - {file_path}: {len(updates)} updates needed")
        
        print(f"\nMoved files tracked: {len(self.moved_files)}")
        for old_path, new_path in self.moved_files.items():
            print(f"  - {old_path} → {new_path}")

def main():
    """Main function to run import analysis."""
    analyzer = ImportAnalyzer()
    analyzer.print_analysis()
    return analyzer

if __name__ == "__main__":
    main()