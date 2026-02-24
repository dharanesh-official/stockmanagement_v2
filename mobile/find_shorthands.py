import os
import re

dir_path = r'd:\Projects\Intern\mobile\src'
for root, dirs, files in os.walk(dir_path):
    for file in files:
        if file.endswith('.js'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                
            for m in re.finditer(r'<([A-Z][a-zA-Z0-9_]*)([^>]*?)>', content):
                component = m.group(1)
                attrs_str = m.group(2)
                
                # match components and attributes
                # Remove strings
                attrs_str = re.sub(r'=\s*\"[^\"]*\"', '', attrs_str)
                attrs_str = re.sub(r'=\s*\'[^\']*\'', '', attrs_str)
                
                # Repeatedly remove balanced {} blocks
                while True:
                    new_attrs_str = re.sub(r'\{[^{}]*\}', '', attrs_str)
                    if new_attrs_str == attrs_str:
                        break
                    attrs_str = new_attrs_str
                    
                # Remove = value assignment (no {})
                attrs_str = re.sub(r'=\s*[^\s]+', '', attrs_str)
                
                words = re.findall(r'\b[a-zA-Z_]+\b', attrs_str)
                # Remove unwanted matches like 'style' if it was leftover or empty string matches
                shorthands = [w for w in words if w not in ('style', 'onPress', 'onChangeText', 'onBlur', 'onFocus', 'size', 'color', 'source')]
                if shorthands:
                    print(f'{filepath} - {component}: {shorthands}')
