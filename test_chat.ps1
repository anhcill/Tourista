$body = @{"message" = "xin chao"} | ConvertTo-Json -Compress
$headers = @{"Content-Type" = "application/json"}
try {
    $r = Invoke-WebRequest -Uri "http://localhost:8080/api/chat/message" -Method Post -Headers $headers -Body $body -TimeoutSec 30
    Write-Host "Status:" $r.StatusCode
    Write-Host "Response:" $r.Content
} catch {
    Write-Host "Error:" $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $respBody = $reader.ReadToEnd()
        $reader.Close()
        Write-Host "Response:" $respBody
    }
}
