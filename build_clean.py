import zipfile, os, shutil

src = r'C:\Users\Administrator\.qwenpaw\plugins\team_chat'
dst = r'C:\Users\Administrator\.qwenpaw\plugins\team_chat_clean_build'

# Remove existing
if os.path.exists(dst):
    shutil.rmtree(dst)

# Copy excluding user data
shutil.copytree(src, dst, ignore=shutil.ignore_patterns(
    'data', '__pycache__', '*.db', 'avatars', 'files'
))

# Also remove email_backend/data
email_data = os.path.join(dst, 'email_backend', 'data')
if os.path.exists(email_data):
    shutil.rmtree(email_data)

# Create zip
zip_path = r'C:\Users\Administrator\.qwenpaw\plugins\teamchat-clean-v5.0.16'
shutil.make_archive(zip_path, 'zip', dst)
print('Zip created:', zip_path + '.zip')

# Clean up temp
shutil.rmtree(dst)
print('Done')
