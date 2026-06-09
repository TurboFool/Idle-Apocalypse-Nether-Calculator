# Read shared strings XML
[xml]$ssXml = Get-Content 'scratch/extracted_xlsx/xl/sharedStrings.xml' -Encoding UTF8
$ns = New-Object System.Xml.XmlNamespaceManager($ssXml.NameTable)
$ns.AddNamespace("x", "http://schemas.openxmlformats.org/spreadsheetml/2006/main")
$sharedStrings = @()
$siNodes = $ssXml.SelectNodes("//x:si", $ns)
foreach ($si in $siNodes) {
    $tNodes = $si.SelectNodes(".//x:t", $ns)
    $text = ""
    foreach ($t in $tNodes) { $text += $t.InnerText }
    $sharedStrings += $text
}

function Get-CellValue($cell) {
    if ($null -eq $cell) { return "" }
    $vNode = $cell.SelectSingleNode("x:v", $ns)
    if ($null -eq $vNode) { return "" }
    $val = $vNode.InnerText
    if ($cell.GetAttribute("t") -eq "s") {
        return $sharedStrings[[int]$val]
    }
    return $val
}

function Parse-Sheet($sheetPath, $sheetName) {
    Write-Output "================ $sheetName ================"
    [xml]$sheetXml = Get-Content $sheetPath -Encoding UTF8
    $sheetNs = New-Object System.Xml.XmlNamespaceManager($sheetXml.NameTable)
    $sheetNs.AddNamespace("x", "http://schemas.openxmlformats.org/spreadsheetml/2006/main")
    
    $rows = $sheetXml.SelectNodes("//x:row", $sheetNs)
    foreach ($row in $rows) {
        $cells = $row.SelectNodes("x:c", $sheetNs)
        $line = ""
        foreach ($c in $cells) {
            $coord = $c.GetAttribute("r")
            $val = Get-CellValue $c
            $line += "$coord`: $val | "
        }
        Write-Output $line
    }
}

Parse-Sheet 'scratch/extracted_xlsx/xl/worksheets/sheet1.xml' 'Targets'
Parse-Sheet 'scratch/extracted_xlsx/xl/worksheets/sheet2.xml' 'Nether Creatures'
Parse-Sheet 'scratch/extracted_xlsx/xl/worksheets/sheet3.xml' 'Variable Upgrades'
