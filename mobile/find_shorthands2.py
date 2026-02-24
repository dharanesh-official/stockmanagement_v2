import os
import re

dir_path = r'd:\Projects\Intern\mobile\src'
with open('results.txt', 'w', encoding='utf-8') as fout:
    for root, dirs, files in os.walk(dir_path):
        for file in files:
            if file.endswith('.js'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                for m in re.finditer(r'<([A-Z][a-zA-Z0-9_]*)([^>]*?)>', content):
                    component = m.group(1)
                    attrs_str = m.group(2)
                    
                    # Store original attributes string
                    original_attrs = attrs_str
                    
                    # Remove anything inside quotes
                    attrs_str = re.sub(r'=\s*\"[^\"]*\"', '', attrs_str)
                    attrs_str = re.sub(r'=\s*\'[^\']*\'', '', attrs_str)
                    
                    # Repeatedly remove anything inside {}
                    while True:
                        new_attrs_str = re.sub(r'\{[^{}]*\}', '', attrs_str)
                        if new_attrs_str == attrs_str:
                            break
                        attrs_str = new_attrs_str
                        
                    # Remove things like prop=value where value doesn't have {} or quotes
                    attrs_str = re.sub(r'=\s*[^\s]+', '', attrs_str)
                    
                    # Only words left should be shorthand props
                    words = re.findall(r'\b[a-zA-Z_]+\b', attrs_str)
                    
                    # Remove common false positives
                    shorthands = [w for w in words if w not in ('style', 'onPress', 'onChangeText', 'onBlur', 'onFocus', 'size', 'color', 'source')]
                    
                    if shorthands:
                        fout.write(f'{filepath} - {component}: {shorthands}\n')
