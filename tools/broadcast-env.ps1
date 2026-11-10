# Broadcast Environment Change & Verify UV Resolution
$ErrorActionPreference = 'Stop'

# 1. Check registry
$regVal = (Get-ItemProperty -Path 'HKCU:\Environment' -Name 'UV_CACHE_DIR' -ErrorAction SilentlyContinue).UV_CACHE_DIR
Write-Host "Registry HKCU:\Environment UV_CACHE_DIR: $regVal"

# 2. Check uv cache dir with explicit env
$env:UV_CACHE_DIR = $regVal
Write-Host "Process env: $env:UV_CACHE_DIR"
$uvResolved = (& uv cache dir)
Write-Host "uv cache dir with process env: $uvResolved"

# 3. Broadcast WM_SETTINGCHANGE
$code = @"
using System;
using System.Runtime.InteropServices;

public class WinEnv {
    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern IntPtr SendMessageTimeout(
        IntPtr hWnd,
        uint Msg,
        UIntPtr wParam,
        string lParam,
        uint fuFlags,
        uint uTimeout,
        out IntPtr lpdwResult
    );

    public static void Broadcast() {
        IntPtr result;
        SendMessageTimeout((IntPtr)0xffff, 0x001A, UIntPtr.Zero, "Environment", 2, 5000, out result);
    }
}
"@

Add-Type -TypeDefinition $code -Language CSharp
[WinEnv]::Broadcast()
Write-Host "WM_SETTINGCHANGE broadcast successfully sent to all top-level windows."

# 4. Also check Machine level vs User level
$machineVal = [Environment]::GetEnvironmentVariable('UV_CACHE_DIR', 'Machine')
$userVal    = [Environment]::GetEnvironmentVariable('UV_CACHE_DIR', 'User')
Write-Host "User Env:    $userVal"
Write-Host "Machine Env: $machineVal"
