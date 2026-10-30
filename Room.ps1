param(
    [Parameter(Mandatory = $true)][string]$Browser,
    [Parameter(Mandatory = $true)][string]$Url,
    [int]$Width = 960,
    [int]$Height = 720,
    [int]$Top = 56
)

$ErrorActionPreference = 'SilentlyContinue'

Add-Type -AssemblyName System.Windows.Forms

if (-not ('RoomWin32' -as [type])) {
    Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;

public class RoomWin32
{
    [StructLayout(LayoutKind.Sequential)]
    public struct RECT
    {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }

    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);

    [DllImport("user32.dll")]
    public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);
}
'@
}

$area = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea

$w = [Math]::Min($Width, $area.Width)
$h = [Math]::Min($Height, $area.Height - $Top)
if ($h -lt 420) { $h = [Math]::Min($Height, $area.Height) }
$x = $area.X + [int](($area.Width - $w) / 2)
$y = $area.Y + $Top

$processName = [System.IO.Path]::GetFileNameWithoutExtension($Browser)
$flags = 0x0004 -bor 0x0010  # SWP_NOZORDER | SWP_NOACTIVATE

# Abrir Room en modo aplicacion (sin barra de direcciones ni pestanas)
Start-Process -FilePath $Browser -ArgumentList "--app=$Url"

# Chrome crea la ventana y despues restaura los bounds guardados, asi que
# se reposiciona varias veces hasta que la ventana queda donde corresponde.
$deadline = (Get-Date).AddSeconds(15)
$stable = 0

while ((Get-Date) -lt $deadline) {
    $window = Get-Process -Name $processName |
        Where-Object { $_.MainWindowHandle -ne [IntPtr]::Zero -and $_.MainWindowTitle -match 'Room' } |
        Select-Object -First 1

    if ($window) {
        $handle = $window.MainWindowHandle
        [void][RoomWin32]::SetWindowPos($handle, [IntPtr]::Zero, $x, $y, $w, $h, $flags)

        $rect = New-Object RoomWin32+RECT
        [void][RoomWin32]::GetWindowRect($handle, [ref]$rect)

        if ([Math]::Abs($rect.Left - $x) -le 2 -and
            [Math]::Abs($rect.Top - $y) -le 2 -and
            [Math]::Abs(($rect.Right - $rect.Left) - $w) -le 2 -and
            [Math]::Abs(($rect.Bottom - $rect.Top) - $h) -le 2) {
            $stable++
            if ($stable -ge 3) { break }
        } else {
            $stable = 0
        }
    }

    Start-Sleep -Milliseconds 150
}
