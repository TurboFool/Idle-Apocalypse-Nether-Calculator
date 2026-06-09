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
    
    $found = $false
    if ($htmlContent -match "$key`:\s*`"data`:image/webp;base64,([^`"]+)`"") {
        $actualB64 = $Matches[1]
        $found = $true
    }
    
    if ($found) {
        if ($actualB64 -eq $expectedB64) {
            # matches
        } else {
            Write-Output "--- $key Diff ---"
            # Find the first index where they differ
            $minLen = [Math]::Min($actualB64.Length, $expectedB64.Length)
            $diffIdx = -1
            for ($i = 0; $i -lt $minLen; $i++) {
                if ($actualB64[$i] -ne $expectedB64[$i]) {
                    $diffIdx = $i
                    break
                }
            }
            if ($diffIdx -ne -1) {
                Write-Output "First difference at index $diffIdx"
                Write-Output "HTML:     $($actualB64.Substring($diffIdx, [Math]::Min(20, $actualB64.Length - $diffIdx)))"
                Write-Output "Expected: $($expectedB64.Substring($diffIdx, [Math]::Min(20, $expectedB64.Length - $diffIdx)))"
            } else {
                Write-Output "No character difference up to min length, but lengths differ: HTML=$($actualB64.Length), Expected=$($expectedB64.Length)"
            }
        }
    }
}
