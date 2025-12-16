# Test script for Xendit Mock API (PowerShell)
# This script tests all endpoints of the Xendit mock API

param(
    [string]$MockoonUrl = "http://localhost:3000",
    [string]$ApiKey = "test_api_key"
)

Write-Host "🧪 Testing Xendit Mock API at $MockoonUrl" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Test 1: Create Invoice
Write-Host "`nTest 1: Create Invoice" -ForegroundColor Yellow
Write-Host "POST $MockoonUrl/v2/invoices"

$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$body = @{
    external_id = "order_test_$timestamp"
    amount = 100000
    payer_email = "customer@example.com"
    description = "Event: Test Event - Order: ABC123"
    invoice_duration = 86400
    currency = "IDR"
    items = @(
        @{
            name = "Event Tickets"
            quantity = 1
            price = 100000
        }
    )
    customer = @{
        given_names = "John Doe"
        email = "customer@example.com"
    }
} | ConvertTo-Json -Depth 10

$base64Auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${ApiKey}:"))
$headers = @{
    "Authorization" = "Basic $base64Auth"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-WebRequest -Uri "$MockoonUrl/v2/invoices" -Method Post -Headers $headers -Body $body -UseBasicParsing
    Write-Host "✓ Success (HTTP $($response.StatusCode))" -ForegroundColor Green
    
    $responseData = $response.Content | ConvertFrom-Json
    $invoiceId = $responseData.id
    Write-Host "Invoice ID: $invoiceId"
    Write-Host "Response: $($response.Content.Substring(0, [Math]::Min(200, $response.Content.Length)))..."
} catch {
    Write-Host "✗ Failed (HTTP $($_.Exception.Response.StatusCode.value__))" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)"
}

# Test 2: Get Invoice
if ($invoiceId) {
    Write-Host "`nTest 2: Get Invoice" -ForegroundColor Yellow
    Write-Host "GET $MockoonUrl/v2/invoices/$invoiceId"
    
    try {
        $response = Invoke-WebRequest -Uri "$MockoonUrl/v2/invoices/$invoiceId" -Method Get -Headers $headers -UseBasicParsing
        Write-Host "✓ Success (HTTP $($response.StatusCode))" -ForegroundColor Green
        Write-Host "Response: $($response.Content.Substring(0, [Math]::Min(200, $response.Content.Length)))..."
    } catch {
        Write-Host "✗ Failed (HTTP $($_.Exception.Response.StatusCode.value__))" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)"
    }
} else {
    Write-Host "`nTest 2: Get Invoice" -ForegroundColor Yellow
    Write-Host "⊘ Skipped (no invoice ID from previous test)" -ForegroundColor Yellow
}

# Test 3: Expire Invoice
if ($invoiceId) {
    Write-Host "`nTest 3: Expire Invoice" -ForegroundColor Yellow
    Write-Host "POST $MockoonUrl/invoices/$invoiceId/expire"
    
    try {
        $response = Invoke-WebRequest -Uri "$MockoonUrl/invoices/$invoiceId/expire" -Method Post -Headers $headers -UseBasicParsing
        Write-Host "✓ Success (HTTP $($response.StatusCode))" -ForegroundColor Green
        Write-Host "Response: $($response.Content)"
    } catch {
        Write-Host "✗ Failed (HTTP $($_.Exception.Response.StatusCode.value__))" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)"
    }
} else {
    Write-Host "`nTest 3: Expire Invoice" -ForegroundColor Yellow
    Write-Host "⊘ Skipped (no invoice ID from previous test)" -ForegroundColor Yellow
}

# Test 4: Mock Payment Page
Write-Host "`nTest 4: Mock Payment Page" -ForegroundColor Yellow
Write-Host "GET $MockoonUrl/mock-payment/test-payment-id"

try {
    $response = Invoke-WebRequest -Uri "$MockoonUrl/mock-payment/test-payment-id" -Method Get -UseBasicParsing
    Write-Host "✓ Success (HTTP $($response.StatusCode))" -ForegroundColor Green
    Write-Host "Payment page is accessible"
    Write-Host "URL: $MockoonUrl/mock-payment/test-payment-id"
} catch {
    Write-Host "✗ Failed (HTTP $($_.Exception.Response.StatusCode.value__))" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)"
}

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "🎉 Testing completed!" -ForegroundColor Cyan
Write-Host ""
Write-Host "To test the payment page in browser, visit:"
Write-Host "$MockoonUrl/mock-payment/test-payment-id" -ForegroundColor Green
