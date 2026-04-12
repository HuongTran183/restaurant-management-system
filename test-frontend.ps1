# Frontend Testing Helper Script
# Usage: .\test-frontend.ps1

Write-Host "🧪 Restaurant Management System - Frontend Test Helper" -ForegroundColor Cyan
Write-Host ""

# Check if MySQL is running
Write-Host "📊 Checking MySQL container..." -ForegroundColor Yellow
$mysqlStatus = docker ps --filter "name=mysql" --format "{{.Status}}"
if ($mysqlStatus) {
    Write-Host "✅ MySQL is running" -ForegroundColor Green
} else {
    Write-Host "❌ MySQL not running. Starting..." -ForegroundColor Red
    docker compose up -d mysql
    Write-Host "⏳ Waiting 15 seconds for MySQL to initialize..." -ForegroundColor Yellow
    Start-Sleep -Seconds 15
}

Write-Host ""
Write-Host "🎯 Testing Checklist for P0 Features:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1️⃣  Start Backend (separate terminal):" -ForegroundColor White
Write-Host "   .\mvnw.cmd spring-boot:run" -ForegroundColor Gray
Write-Host ""
Write-Host "2️⃣  Start Frontend (separate terminal):" -ForegroundColor White
Write-Host "   cd frontend" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "3️⃣  Open Browser:" -ForegroundColor White
Write-Host "   Frontend: http://127.0.0.1:15173" -ForegroundColor Gray
Write-Host "   Backend:  http://127.0.0.1:18080" -ForegroundColor Gray
Write-Host ""
Write-Host "4️⃣  Login Credentials:" -ForegroundColor White
Write-Host "   Username: admin" -ForegroundColor Gray
Write-Host "   Password: Admin@123456" -ForegroundColor Gray
Write-Host ""
Write-Host "5️⃣  Test Pages:" -ForegroundColor White
Write-Host "   ✅ /staff/areas   - Area Management" -ForegroundColor Gray
Write-Host "   ✅ /staff/tables  - Table Management" -ForegroundColor Gray
Write-Host "   ✅ /staff/users   - User Management" -ForegroundColor Gray
Write-Host ""
Write-Host "📋 Test Checklist:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Area Management:" -ForegroundColor Yellow
Write-Host "  [ ] Create area (code: A1, name: Main Dining)" -ForegroundColor White
Write-Host "  [ ] Search areas" -ForegroundColor White
Write-Host "  [ ] Filter by status (Active/Inactive)" -ForegroundColor White
Write-Host "  [ ] Edit area" -ForegroundColor White
Write-Host "  [ ] Test duplicate code validation" -ForegroundColor White
Write-Host ""
Write-Host "Table Management:" -ForegroundColor Yellow
Write-Host "  [ ] Create table (code: T01, seats: 4, area: A1)" -ForegroundColor White
Write-Host "  [ ] Select area from dropdown" -ForegroundColor White
Write-Host "  [ ] Filter by status (Available/Occupied/Reserved/Cleaning)" -ForegroundColor White
Write-Host "  [ ] Change table status (color should update)" -ForegroundColor White
Write-Host "  [ ] View QR code" -ForegroundColor White
Write-Host ""
Write-Host "User Management:" -ForegroundColor Yellow
Write-Host "  [ ] Create user (username: testuser, password: TestUser@123)" -ForegroundColor White
Write-Host "  [ ] Test password validation (8+ chars, uppercase, number, special)" -ForegroundColor White
Write-Host "  [ ] Multi-select roles" -ForegroundColor White
Write-Host "  [ ] Edit user (password optional)" -ForegroundColor White
Write-Host "  [ ] Test email validation" -ForegroundColor White
Write-Host "  [ ] Test duplicate username" -ForegroundColor White
Write-Host ""
Write-Host "Permissions:" -ForegroundColor Yellow
Write-Host "  [ ] Login as WAITER → cannot edit areas/tables" -ForegroundColor White
Write-Host "  [ ] Login as WAITER → cannot view /staff/users" -ForegroundColor White
Write-Host ""
Write-Host "💡 Tips:" -ForegroundColor Cyan
Write-Host "  - Use Ctrl+Shift+R for hard refresh" -ForegroundColor Gray
Write-Host "  - Check browser console (F12) for errors" -ForegroundColor Gray
Write-Host "  - Backend logs show API calls in real-time" -ForegroundColor Gray
Write-Host ""
Write-Host "🚀 Ready to test! Good luck!" -ForegroundColor Green
