@echo off
cd /d C:\Users\Administrator\Desktop\711
powershell -Command "Compress-Archive -Path 'C:\Users\Administrator\Desktop\711\*' -DestinationPath 'C:\Users\Administrator\Desktop\AI-PRO-v5.2.0-full.zip' -Force"
echo Done