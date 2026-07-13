$src = "C:\Users\Administrator\Desktop\711"
$dest = "C:\Users\Administrator\Desktop\AI-PRO-v5.0.18-full.zip"
Remove-Item $dest -Force -ErrorAction SilentlyContinue
Compress-Archive -Path "$src\*" -DestinationPath $dest -Force
Write-Host "OK:" (Get-Item $dest).Length "bytes"