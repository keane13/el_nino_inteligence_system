import json
import sys
sys.path.insert(0, 'backend')
from features.data.data import generate_complaints
data = generate_complaints(500)
data.to_json('complaints_data.json', orient='records', date_format='iso', indent=2)
print('Exported complaints to complaints_data.json')
