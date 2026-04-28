import os
import re

directory = 'frontend/src/pages'
# Look for 'return (' followed by another 'return (' with any amount of whitespace or newlines in between
pattern = re.compile(r'return\s*\(\s*[\r\n\s]*return\s*\(', re.MULTILINE)

for filename in os.listdir(directory):
    if filename.endswith('.jsx'):
        filepath = os.path.join(directory, filename)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                if pattern.search(content):
                    print(f"Found issue in: {filepath}")
        except Exception as e:
            print(f"Error reading {filepath}: {e}")
