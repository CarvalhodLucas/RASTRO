$file = 'c:\Users\Lucas de Carvalho\Documents\Sites\RASTRO\src\app\asset\[ticker]\page.tsx'
$lines = [System.IO.File]::ReadAllLines($file)

$insertAfter = -1
for ($i = 0; $i -lt $lines.Length; $i++) {
    if ($lines[$i] -match '^\s*\}, \[ticker\]\);' -and $i -gt 1680 -and $i -lt 1700) {
        $insertAfter = $i
        break
    }
}

if ($insertAfter -eq -1) {
    Write-Host "Target line not found"
    exit 1
}

Write-Host "Inserting after line $insertAfter"

$newLines = New-Object System.Collections.Generic.List[string]
for ($i = 0; $i -lt $lines.Length; $i++) {
    $newLines.Add($lines[$i])
    if ($i -eq $insertAfter) {
        $newLines.Add('')
        $newLines.Add('    // GATILHO STAGGERED DE IA: Dispara analises apos asset + htmlReport estarem prontos')
        $newLines.Add('    useEffect(() => {')
        $newLines.Add('        if (!asset?.ticker) return;')
        $newLines.Add('        const runAiFetches = async () => {')
        $newLines.Add("            console.log('IA staggered para: ' + asset.ticker);")
        $newLines.Add('            fetchFundamentalRating(asset, false, false);')
        $newLines.Add('            await sleep(1500);')
        $newLines.Add('            fetchAiAnalysis(false);')
        $newLines.Add('            await sleep(1500);')
        $newLines.Add('            fetchMarketSentiment(asset, false, false);')
        $newLines.Add('            await sleep(1500);')
        $newLines.Add('            fetchAiHealth(false);')
        $newLines.Add('            await sleep(1500);')
        $newLines.Add('            fetchAiPulse(asset, false, false);')
        $newLines.Add('        };')
        $newLines.Add('        runAiFetches();')
        $newLines.Add('    // eslint-disable-next-line react-hooks/exhaustive-deps')
        $newLines.Add('    }, [asset?.ticker, htmlReport]);')
    }
}

[System.IO.File]::WriteAllLines($file, $newLines.ToArray(), [System.Text.Encoding]::UTF8)
Write-Host "SUCCESS"
