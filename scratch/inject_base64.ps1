$htmlPath = "nether_costs.html"
$htmlContent = [System.IO.File]::ReadAllText($htmlPath, [System.Text.Encoding]::UTF8)


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
    $b64 = [System.Convert]::ToBase64String($fileBytes)
    $dataUrl = "data:image/webp;base64,$b64"
    
    $placeholder = "PLACEHOLDER_" + $key.ToUpper()
    $htmlContent = $htmlContent.Replace($placeholder, $dataUrl)
}

# Ensure UTF-8 output
[System.IO.File]::WriteAllText($htmlPath, $htmlContent, [System.Text.Encoding]::UTF8)
Write-Output "Successfully injected actual base64 strings into $htmlPath"
