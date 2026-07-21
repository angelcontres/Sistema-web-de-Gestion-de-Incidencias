import os
import glob
import re

replacements = {
    '/usuarios': '/users',
    '/roles': '/roles',
    '/permisos': '/permissions',
    '/paises': '/countries',
    '/territorios': '/territories',
    '/direcciones': '/addresses',
    '/categorias-incidencia': '/incident-categories',
    '/incidencias': '/incidents',
    '/instituciones': '/institutions',
    '/prioridades': '/priorities',
    '/opciones-menu': '/menu-options',
    '/catalogos/paises': '/catalogs/countries',
    '/catalogos/territorios': '/catalogs/territories',
    '/catalogos/direcciones': '/catalogs/addresses',
    '/catalogos/categorias-incidencia': '/catalogs/incident-categories',
    '/catalogos/instituciones': '/catalogs/institutions',
    '/geocodificacion/reversa': '/geocoding/reverse',
}

files_to_check = []
for root, _, files in os.walk('frontend/js'):
    for file in files:
        if file.endswith('.js'):
            files_to_check.append(os.path.join(root, file))

for filepath in files_to_check:
    if 'api.js' in filepath:
        continue # don't touch core api.js unless needed
    try:
        with open(filepath, 'r') as f:
            content = f.read()
            
        new_content = content
        for k, v in replacements.items():
            # Replace exactly /path inside quotes or backticks to avoid breaking HTML routing
            # It replaces "/usuarios" and `/usuarios`
            new_content = new_content.replace(f"'{k}'", f"'{v}'")
            new_content = new_content.replace(f"\"{k}\"", f"\"{v}\"")
            new_content = new_content.replace(f"`{k}", f"`{v}")
            new_content = new_content.replace(f"'{k}?", f"'{v}?")
            new_content = new_content.replace(f"\"{k}?", f"\"{v}?")
            
        if new_content != content:
            with open(filepath, 'w') as f:
                f.write(new_content)
            print(f"Updated {filepath}")
    except Exception as e:
        print(f"Error reading {filepath}: {e}")

