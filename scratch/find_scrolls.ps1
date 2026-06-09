$c = Get-Content -Path 'C:\Users\turbo\.gemini\antigravity\brain\8d036474-ed2b-4cf9-965e-d2584467752a\.system_generated\steps\257\content.md'
for ($i=0; $i -lt $c.Length; $i++) {
    if ($c[$i] -match 'Scroll of Nature|Scroll of Plenty|Scroll of Industry|Scroll of Might|Dark Scroll|Magic Scroll|Unending Scroll|Scroll of Growth|Scroll of the Dead|Scroll of the Troll|Scroll of Scales|Scroll of Time|Nether Scroll') {
        Write-Output '--------------------'
        Write-Output ("LINE " + $i + ": " + $c[$i].Trim())
        for ($j=1; $j -le 5; $j++) {
            if ($i+$j -lt $c.Length) {
                Write-Output ("  +" + $j + ": " + $c[$i+$j].Trim())
            }
        }
    }
}
