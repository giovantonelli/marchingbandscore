#!/usr/bin/env python3
import os

# Read the config template
with open('config.js', 'r') as f:
    content = f.read()

# Use V2 credentials
supabase_url = os.environ.get('SUPABASE_URL_V2', '')
supabase_anon_key = os.environ.get('SUPABASE_ANON_KEY_V2', '')

# Replace placeholders with new credentials
content = content.replace('SUPABASE_URL_PLACEHOLDER', supabase_url)
content = content.replace('SUPABASE_ANON_KEY_PLACEHOLDER', supabase_anon_key)

# Write the updated config
with open('config.js', 'w') as f:
    f.write(content)

print(f"Updated config with new Supabase V2 credentials")
print(f"URL: {supabase_url[:30]}...")
print(f"Key: {supabase_anon_key[:30]}...")
