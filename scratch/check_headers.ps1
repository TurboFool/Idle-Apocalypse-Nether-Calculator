$files = Get-ChildItem -Path "assets" -Filter "*.webp"
foreach ($f in $files) {
    $bytes = [System.IO.File]::ReadAllBytes($f.FullName)
    $hex = [System.BitConverter]::ToString($bytes, 0, [Math]::Min(16, $bytes.Length))
    Write-Output "$($f.Name)`tsize: $($bytes.Length)`thex: $hex"
}
