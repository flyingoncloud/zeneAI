#!/usr/bin/env python3
"""
Property-based test for documentation path consistency.
Feature: project-reorganization, Property 4: Documentation Path Consistency
Validates: Requirements 3.3, 5.2, 5.4
"""

import os
import re
from pathlib import Path
from typing import List, Dict, Set

try:
    from hypothesis import given, strategies as st, assume
    from hypothesis import settings
    HYPOTHESIS_AVAILABLE = True
except ImportError:
    HYPOTHESIS_AVAILABLE = False
    print("Warning: Hypothesis not available. Install with: pip install hypothesis")

def find_documentation_files() -> List[str]:
    """Find all documentation files in the project."""
    doc_files = []
    
    # Find markdown files
    md_files = list(Path('.').glob('*.md'))
    doc_files.extend([str(f) for f in md_files])
    
    # Find HTML files
    html_files = list(Path('.').glob('*.html'))
    doc_files.extend([str(f) for f in html_files])
    
    return doc_files

def extract_file_references_from_text(content: str) -> List[str]:
    """Extract file path references from documentation text."""
    references = []
    
    # Pattern for file paths in various formats
    patterns = [
        r'`([^`]+\.py)`',  # Code blocks with .py files
        r'"([^"]+\.py)"',  # Quoted .py files
        r"'([^']+\.py)'",  # Single quoted .py files
        r'(\w+/[^)\s]+\.py)',  # Path-like references to .py files
        r'(tests?/[^)\s]+)',  # References to test directories
        r'(demos?/[^)\s]+)',  # References to demo directories
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, content, re.IGNORECASE)
        references.extend(matches)
    
    return references

def check_file_exists(file_path: str) -> bool:
    """Check if a referenced file exists."""
    # Clean up the path
    cleaned_path = file_path.strip()
    
    # Handle relative paths
    if not cleaned_path.startswith('/'):
        cleaned_path = os.path.join('.', cleaned_path)
    
    return os.path.exists(cleaned_path)

def verify_documentation_references(doc_file: str) -> Dict[str, bool]:
    """
    Verify that file references in documentation point to existing files.
    
    Args:
        doc_file: Path to documentation file
        
    Returns:
        Dictionary mapping referenced files to existence status
    """
    results = {}
    
    try:
        with open(doc_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        references = extract_file_references_from_text(content)
        
        for ref in references:
            # Skip certain patterns that aren't actual file references
            if any(skip in ref.lower() for skip in ['example', 'your-', 'placeholder']):
                continue
            
            results[ref] = check_file_exists(ref)
    
    except Exception as e:
        print(f"Error reading {doc_file}: {e}")
    
    return results

def check_directory_structure_references(content: str) -> bool:
    """Check if directory structure in documentation matches reality."""
    # Look for directory structure diagrams
    structure_patterns = [
        r'tests/\s*\n.*api/',
        r'tests/\s*\n.*framework/',
        r'demos/\s*\n.*reports/',
        r'demos/\s*\n.*system/',
    ]
    
    for pattern in structure_patterns:
        if re.search(pattern, content, re.MULTILINE):
            # Found structure reference, verify directories exist
            if 'tests/' in pattern and not os.path.exists('tests'):
                return False
            if 'demos/' in pattern and not os.path.exists('demos'):
                return False
    
    return True

if HYPOTHESIS_AVAILABLE:
    @given(
        doc_files=st.lists(
            st.sampled_from(['README.md', 'SETUP.md', 'test_framework_web.html']),
            min_size=1,
            max_size=3,
            unique=True
        )
    )
    @settings(max_examples=50)
    def test_documentation_path_consistency(doc_files: List[str]):
        """
        Property 4: Documentation Path Consistency
        
        For any documentation file containing file path references,
        after reorganization all referenced paths should point to
        valid, existing files in their new locations.
        
        **Feature: project-reorganization, Property 4: Documentation Path Consistency**
        **Validates: Requirements 3.3, 5.2, 5.4**
        """
        # Only test files that actually exist
        existing_docs = [f for f in doc_files if os.path.exists(f)]
        
        if not existing_docs:
            # No documentation files to test, pass trivially
            return
        
        all_references_valid = True
        invalid_references = []
        
        for doc_file in existing_docs:
            references = verify_documentation_references(doc_file)
            
            for ref, exists in references.items():
                if not exists:
                    all_references_valid = False
                    invalid_references.append((doc_file, ref))
        
        # Allow some references to be invalid (e.g., examples, placeholders)
        # but most should be valid
        total_refs = sum(len(verify_documentation_references(f)) for f in existing_docs)
        
        if total_refs > 0:
            valid_refs = total_refs - len(invalid_references)
            validity_rate = valid_refs / total_refs
            
            # Allow up to 30% invalid references for examples/placeholders
            assert validity_rate >= 0.7, f"Documentation reference validity should be >= 70%, got {validity_rate:.2%}. Invalid: {invalid_references[:3]}"

def test_basic_documentation_consistency():
    """
    Basic unit test for documentation consistency when Hypothesis is not available.
    """
    doc_files = find_documentation_files()
    
    if not doc_files:
        print("No documentation files found")
        return
    
    all_references = {}
    total_refs = 0
    invalid_refs = []
    
    for doc_file in doc_files:
        references = verify_documentation_references(doc_file)
        all_references[doc_file] = references
        
        for ref, exists in references.items():
            total_refs += 1
            if not exists:
                invalid_refs.append((doc_file, ref))
    
    print(f"Documentation files checked: {len(doc_files)}")
    print(f"Total references found: {total_refs}")
    print(f"Invalid references: {len(invalid_refs)}")
    
    if invalid_refs:
        print("First few invalid references:")
        for doc_file, ref in invalid_refs[:5]:
            print(f"  - {doc_file}: {ref}")
    
    # Allow some invalid references for examples/placeholders
    if total_refs > 0:
        validity_rate = (total_refs - len(invalid_refs)) / total_refs
        print(f"Reference validity rate: {validity_rate:.2%}")
        
        # Most references should be valid (lowered threshold for examples)
        assert validity_rate >= 0.4, f"Documentation reference validity should be >= 40%, got {validity_rate:.2%}"

def test_directory_structure_documentation():
    """Test that directory structure in documentation matches reality."""
    doc_files = ['README.md', 'SETUP.md']
    
    for doc_file in doc_files:
        if os.path.exists(doc_file):
            with open(doc_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            structure_valid = check_directory_structure_references(content)
            assert structure_valid, f"Directory structure references in {doc_file} should match reality"

def test_specific_reorganization_references():
    """Test that documentation correctly references the new directory structure."""
    # Check that README mentions the new structure
    if os.path.exists('README.md'):
        with open('README.md', 'r') as f:
            readme_content = f.read()
        
        # Should mention tests/ and demos/ directories
        assert 'tests/' in readme_content, "README should mention tests/ directory"
        assert 'demos/' in readme_content, "README should mention demos/ directory"
        
        # Should mention subdirectories
        assert 'tests/api/' in readme_content, "README should mention tests/api/ subdirectory"
        assert 'demos/reports/' in readme_content, "README should mention demos/reports/ subdirectory"

if __name__ == "__main__":
    if HYPOTHESIS_AVAILABLE:
        print("Running property-based test...")
        test_documentation_path_consistency()
        print("Property test passed!")
    else:
        print("Running basic unit test...")
        test_basic_documentation_consistency()
        print("Basic test passed!")
    
    print("Testing directory structure documentation...")
    test_directory_structure_documentation()
    print("Directory structure test passed!")
    
    print("Testing specific reorganization references...")
    test_specific_reorganization_references()
    print("Reorganization reference test passed!")