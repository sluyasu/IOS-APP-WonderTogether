#!/usr/bin/env python3
"""
Script to convert Tailwind className props to inline styles in React Native files.
This handles common Tailwind patterns and converts them to React Native style objects.
"""

import re
import sys

def tailwind_to_inline(class_string):
    """Convert Tailwind class string to inline style object."""
    classes = class_string.split()
    styles = {}
    
    # Mapping of common Tailwind classes to React Native styles
    for cls in classes:
        # Flex
        if cls == 'flex-1': styles['flex'] = 1
        elif cls == 'flex-row': styles['flexDirection'] = 'row'
        elif cls == 'flex-col': styles['flexDirection'] = 'column'
        
        # Alignment
        elif cls == 'items-center': styles['alignItems'] = 'center'
        elif cls == 'items-start': styles['alignItems'] = 'flex-start'
        elif cls == 'items-end': styles['alignItems'] = 'flex-end'
        elif cls == 'justify-center': styles['justifyContent'] = 'center'
        elif cls == 'justify-between': styles['justifyContent'] = 'space-between'
        elif cls == 'justify-end': styles['justifyContent'] = 'flex-end'
       
        # Margins
        elif re.match(r'mb-(\d+|0\.5)', cls):
            val = cls.split('-')[1]
            styles['marginBottom'] = 4 * float(val) if '.' not in val else 2
        elif re.match(r'mt-(\d+|0\.5)', cls):
            val = cls.split('-')[1]
            styles['marginTop'] = 4 * float(val) if '.' not in val else 2
        elif re.match(r'mr-(\d+)', cls):
            styles['marginRight'] = 4 * int(cls.split('-')[1])
        elif re.match(r'ml-(\d+)', cls):
            styles['marginLeft'] = 4 * int(cls.split('-')[1])
        
        # Padding
        elif re.match(r'p-(\d+|0\.5)', cls):
            val = cls.split('-')[1]
            styles['padding'] = 4 * float(val) if '.' not in val else 6
        elif re.match(r'px-(\d+|0\.5)', cls):
            val = cls.split('-')[1]
            styles['paddingHorizontal'] = 4 * float(val) if '.' not in val else 6
        elif re.match(r'py-(\d+|0\.5)', cls):
            val = cls.split('-')[1]
            styles['paddingVertical'] = 4 * float(val) if '.' not in val else 6
        
        # Background
        elif cls == 'bg-white': styles['backgroundColor'] = 'white'
        elif cls == 'bg-gray-50': styles['backgroundColor'] = '#f9fafb'
        elif cls == 'bg-gray-100': styles['backgroundColor'] = '#f3f4f6'
        elif cls == 'bg-terracotta': styles['backgroundColor'] = '#e07a5f'
        
        # Border
        elif re.match(r'rounded(-\w+)?', cls):
            if cls == 'rounded': styles['borderRadius'] = 4
            elif cls == 'rounded-lg': styles['borderRadius'] = 8
            elif cls == 'rounded-xl': styles['borderRadius'] = 12
            elif cls == 'rounded-2xl': styles['borderRadius'] 16
            elif cls == 'rounded-full': styles['borderRadius'] = 9999
        
        # Text
        elif cls.startswith('text-'):
            if 'gray-' in cls:
                num = cls.split('-')[-1]
                colors = {'500': '#6b7280', '600': '#4b5563', '700': '#374151', '800': '#1f2937'}
                if num in colors:
                    styles['color'] = colors[num]
            elif cls == 'text-white': styles['color'] = 'white'
            elif cls == 'text-terracotta': styles['color'] = '#e07a5f'
            elif cls.startswith('text-['):
                size = cls.split('[')[1].split('px')[0]
                styles['fontSize'] = int(size)
            elif cls == 'text-xs': styles['fontSize'] = 12
            elif cls == 'text-sm': styles['fontSize'] = 14
            elif cls == 'text-base': styles['fontSize'] = 16
            elif cls == 'text-lg': styles['fontSize'] = 18
            elif cls == 'text-xl': styles['fontSize'] = 20
        
        # Font weight
        elif cls == 'font-bold': styles['fontWeight'] = 'bold'
        elif cls == 'font-medium': styles['fontWeight'] = '500'
        
        # Shadow
        elif cls == 'shadow' or cls == 'shadow-sm':
            styles.update({
                'shadowColor': '#000',
                'shadowOffset': {'width': 0, 'height': 1},
                'shadowOpacity': 0.1,
                'shadowRadius': 2
            })
    
    # Format as inline style
    parts = []
    for key, val in styles.items():
        if isinstance(val, str):
            parts.append(f"{key}: '{val}'")
        elif isinstance(val, dict):
            inner = ', '.join(f"{k}: {v}" for k, v in val.items())
            parts.append(f"{key}: {{ {inner} }}")
        else:
            parts.append(f"{key}: {val}")
    
    return '{{ ' + ', '.join(parts) + ' }}'

# Test
print("Sample conversion:")
print(tailwind_to_inline("flex-row items-center justify-between mb-4 bg-white p-4 rounded-xl shadow"))
