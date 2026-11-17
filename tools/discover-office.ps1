Write-Host "=== CHECKING OFFICE EXECUTABLES & APP PATHS ==="
$apps = @("winword.exe", "excel.exe", "powerpnt.exe")
foreach ($app in $apps) {
    $path = (Get-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\$app" -ErrorAction SilentlyContinue).'(default)'
    if (-not $path) {
        $path = (Get-ItemProperty -Path "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\$app" -ErrorAction SilentlyContinue).'(default)'
    }
    Write-Host "AppPath [$app]: $path"
    if ($path -and (Test-Path $path)) {
        $ver = (Get-Item $path).VersionInfo
        Write-Host "   File: $path"
        Write-Host "   ProductVersion: $($ver.ProductVersion)"
        Write-Host "   FileVersion: $($ver.FileVersion)"
    }
}

Write-Host "`n=== CHECKING COM PROGIDS ==="
$progids = @("Word.Application", "Excel.Application", "PowerPoint.Application")
foreach ($progid in $progids) {
    $clsid = (Get-ItemProperty -Path "Registry::HKEY_CLASSES_ROOT\$progid\CLSID" -ErrorAction SilentlyContinue).'(default)'
    Write-Host "ProgID [$progid]: CLSID = $clsid"
    if ($clsid) {
        $server = (Get-ItemProperty -Path "Registry::HKEY_CLASSES_ROOT\CLSID\$clsid\LocalServer32" -ErrorAction SilentlyContinue).'(default)'
        Write-Host "   LocalServer32: $server"
    }
}

Write-Host "`n=== CHECKING COMMON INSTALL DIRS ==="
$commonDirs = @(
    "C:\Program Files\Microsoft Office\root\Office16",
    "C:\Program Files (x86)\Microsoft Office\root\Office16",
    "C:\Program Files\Microsoft Office\Office16",
    "C:\Program Files (x86)\Microsoft Office\Office16",
    "C:\Program Files\Microsoft Office\Office15",
    "C:\Program Files (x86)\Microsoft Office\Office15"
)
foreach ($dir in $commonDirs) {
    if (Test-Path $dir) {
        Write-Host "Directory EXISTS: $dir"
        Get-ChildItem -Path $dir -Filter "*.exe" | Where-Object { $_.Name -match "WINWORD|EXCEL|POWERPNT" } | Select-Object Name, Length, LastWriteTime
    }
}

Write-Host "`n=== CHECKING RUNNING OFFICE PROCESSES ==="
Get-Process | Where-Object { $_.ProcessName -match "WINWORD|EXCEL|POWERPNT" } | Select-Object Id, ProcessName, Path
