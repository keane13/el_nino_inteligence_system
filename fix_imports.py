import os
import re

backend_dir = 'backend'

def replace_in_file(filepath, replacements):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content
    for old, new in replacements:
        content = re.sub(old, new, content)
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

replacements = [
    (r'^from data import ', r'from features.data.data import '),
    (r'^import data\b', r'from features.data import data'),
    (r'^from agent import ', r'from features.chat.agent import '),
    (r'^import agent\b', r'from features.chat import agent'),
    (r'^from tools import ', r'from features.chat.tools import '),
    (r'^from state import ', r'from core.state import '),
    (r'^import state\b', r'from core import state'),
    (r'^from redis_client import ', r'from core.redis_client import '),
    (r'^from guards import ', r'from core.guards import ')
]

for d, dirs, files in os.walk(backend_dir):
    if 'venv' in dirs:
        dirs.remove('venv')
    if '__pycache__' in dirs:
        dirs.remove('__pycache__')
    if '.pytest_cache' in dirs:
        dirs.remove('.pytest_cache')
    for file in files:
        if file.endswith('.py'):
            replace_in_file(os.path.join(d, file), replacements)

print('Imports fixed')
