#!/usr/bin/env python3
"""Extract all Python code blocks from the BABIRYE output and syntax-check them."""

import re
import ast
import sys

INPUT_FILE = "/home/z/my-project/download/BABIRYE_v10.0.0_Production_Ready.txt"

with open(INPUT_FILE, "r") as f:
    content = f.read()

# Extract all python code blocks with their section headers
sections = content.split("---")
python_files = []
errors = []

for section in sections:
    # Find section header
    header_match = re.search(r'## (\d+)\.\s+(.+)', section)
    if not header_match:
        continue
    section_num = header_match.group(1)
    section_name = header_match.group(2).strip()
    
    # Find python code blocks
    py_match = re.search(r'```python\n(.*?)```', section, re.DOTALL)
    if not py_match:
        continue
    
    py_code = py_match.group(1)
    python_files.append((section_num, section_name, py_code))
    
    # Syntax check
    try:
        ast.parse(py_code)
        status = "OK"
    except SyntaxError as e:
        status = f"SYNTAX ERROR: line {e.lineno}: {e.msg}"
        errors.append((section_name, str(e)))
    
    print(f"  [{status}] #{section_num} {section_name}")

print(f"\n{'='*60}")
print(f"Total Python files checked: {len(python_files)}")
print(f"Errors: {len(errors)}")

if errors:
    print("\nERRORS FOUND:")
    for name, err in errors:
        print(f"  - {name}: {err}")
    sys.exit(1)
else:
    print("\n[SUCCESS] All Python files pass syntax validation!")