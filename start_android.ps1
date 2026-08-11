$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:PATH += ";$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator"

Write-Host "Checking for running emulators..."
$running = adb devices | Select-String "emulator"

if ($running) {
    Write-Host "Emulator already running."
} else {
    Write-Host "Starting emulator Pixel_2_API_30..."
    Start-Process -FilePath "emulator" -ArgumentList "@Pixel_2_API_30" -NoNewWindow
    Write-Host "Waiting for emulator to boot..."
    Start-Sleep -Seconds 10
}

Write-Host "Starting App..."
npm start
