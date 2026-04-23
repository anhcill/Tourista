$csv = Import-Csv -Path 'C:\xampp\htdocs\Tourista\data\hotels_users_ratings.csv' -Encoding Default
$locations = $csv | Select-Object -ExpandProperty Location -Unique | Sort-Object
$locations | ForEach-Object { Write-Host $_ }
Write-Host ""
Write-Host "Total unique locations:" $locations.Count
