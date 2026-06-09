$htmlContent = Get-Content -Path "nether_costs.html" -Raw

$assets = @{
    "orb" = "Nether_Orb_Icon.webp";
    "flame" = "Nether_Flame_Icon.webp";
    "crystal" = "Nether_Crystal_Icon.webp";
    "star" = "Nether_Star_Icon.webp";
    "netherling" = "Netherling_Icon.webp";
    "demon" = "Nether_Demon_Icon.webp";
    "mountain" = "Nether_Mountain_Icon.webp"
}

foreach ($key in $assets.Keys) {
    $fileName = $assets[$key]
    $fileBytes = [System.IO.File]::ReadAllBytes("assets/$fileName")
    $expectedB64 = [System.Convert]::ToBase64String($fileBytes)
    
    # Try to find the string in html
    # The format is key: "data:image/webp;base64,B64"
    # Or key: 'data:image/webp;base64,B64'
    $found = $false
    if ($htmlContent -match "$key`:\s*`"data`:image/webp;base64,([^`"]+)`"") {
        $actualB64 = $Matches[1]
        $found = $true
    } elseif ($htmlContent -match "$key`:\s*'data`:image/webp;base64,([^']+)'") {
        $actualB64 = $Matches[1]
        $found = $true
    }
    
    if ($found) {
        if ($actualB64 -eq $expectedB64) {
            Write-Output "$key matches expected base64 exactly."
        } else {
            Write-Output "$key DOES NOT match expected base64!"
            Write-Output "  Length in HTML: $($actualB64.Length)"
            Write-Output "  Length expected: $($expectedB64.Length)"
            Write-Output "  First 30 characters in HTML: $($actualB64.Substring(0, [Math]::Min(30, $actualB64.Length)))"
            Write-Output "  First 30 characters expected: $($expectedB64.Substring(0, [Math]::Min(30, $expectedB64.Length)))"
        }
    } else {
        Write-Output "Could not find base64 for $key in HTML content!"
    }
}
