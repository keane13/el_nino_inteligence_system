import os
import shutil
import re

backend_dir = 'backend'
features_dir = os.path.join(backend_dir, 'features')
core_dir = os.path.join(backend_dir, 'core')

os.makedirs(features_dir, exist_ok=True)
os.makedirs(core_dir, exist_ok=True)

# Create features directories
for f in ['chat', 'data', 'elnino', 'webhooks']:
    os.makedirs(os.path.join(features_dir, f), exist_ok=True)

# 1. Move routers to features
routers = {'chat.py': 'chat', 'data.py': 'data', 'elnino.py': 'elnino', 'webhooks.py': 'webhooks'}
for r_file, feature in routers.items():
    src = os.path.join(backend_dir, 'routers', r_file)
    dst = os.path.join(features_dir, feature, 'router.py')
    if os.path.exists(src):
        shutil.move(src, dst)

# 2. Move agent.py and tools.py to features/chat
if os.path.exists(os.path.join(backend_dir, 'agent.py')):
    shutil.move(os.path.join(backend_dir, 'agent.py'), os.path.join(features_dir, 'chat', 'agent.py'))
if os.path.exists(os.path.join(backend_dir, 'tools.py')):
    shutil.move(os.path.join(backend_dir, 'tools.py'), os.path.join(features_dir, 'chat', 'tools.py'))

# 3. Move core files
core_files = ['state.py', 'redis_client.py', 'guards.py']
for c in core_files:
    if os.path.exists(os.path.join(backend_dir, c)):
        shutil.move(os.path.join(backend_dir, c), os.path.join(core_dir, c))

# Move data.py (generation) to features/data
if os.path.exists(os.path.join(backend_dir, 'data.py')):
    shutil.move(os.path.join(backend_dir, 'data.py'), os.path.join(features_dir, 'data', 'data.py'))

# Clean up routers dir
if os.path.exists(os.path.join(backend_dir, 'routers')):
    shutil.rmtree(os.path.join(backend_dir, 'routers'))

# Create __init__.py files
for d, _, _ in os.walk(backend_dir):
    if not os.path.exists(os.path.join(d, '__init__.py')):
        open(os.path.join(d, '__init__.py'), 'w').close()

print('Restructure completed')
