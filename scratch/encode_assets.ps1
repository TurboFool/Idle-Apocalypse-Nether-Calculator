$assets = Get-ChildItem -Path "assets" -Filter "*.webp"
$output = @()
foreach ($file in $assets) {
    $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
    $b64 = [System.Convert]::ToBase64String($bytes)
    $output += "$($file.Name)`tdata:image/webp;base64,$b64"
}
$output | Out-File -FilePath "scratch/base64_icons.txt" -Encoding utf8
Write-Output "Successfully encoded $($assets.Count) assets to scratch/base64_icons.txt"
