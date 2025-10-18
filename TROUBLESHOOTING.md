# Troubleshooting Guide

## ✅ Common Issues & Solutions

### Issue 1: "Cannot find module 'babel-preset-expo'"

**Status**: ✅ FIXED

**Solution**:
```bash
npm install --legacy-peer-deps babel-preset-expo
```

**What happened**: After upgrading to Expo SDK 54, babel-preset-expo needed to be explicitly installed.

---

### Issue 2: "Project is incompatible with this version of Expo Go"

**Status**: ✅ FIXED

**Solution**: The app has been upgraded to Expo SDK 54 to match your Expo Go version.

**Verification**:
```bash
# Check package.json shows:
grep '"expo"' package.json
# Should show: "expo": "~54.0.0"
```

---

### Issue 3: Bundle fails or cache errors

**Solution**:
```bash
# Clear all caches
rm -rf node_modules/.cache .expo
npm start -- --clear
```

---

### Issue 4: Module resolution errors

**Solution**:
```bash
# Reinstall dependencies
rm -rf node_modules
npm install --legacy-peer-deps
```

---

### Issue 5: "Cannot connect to backend"

**Checklist**:
- [ ] Backend is running: `cd backend && python main.py`
- [ ] Backend health check works: `curl http://localhost:8000/api/v1/health`
- [ ] Correct URL for platform:
  - iOS Simulator: `http://localhost:8000` ✅ Automatic
  - Android Emulator: `http://10.0.2.2:8000` ✅ Automatic
  - Physical Device: Update IP in `src/services/backendApi.ts`

**Test Backend**:
```bash
curl http://localhost:8000/api/v1/health
# Should return: {"status":"healthy",...}
```

---

### Issue 6: TypeScript errors

**Solution**:
```bash
# Clear TypeScript cache
rm -rf .expo
npx tsc --noEmit
```

---

### Issue 7: Metro bundler won't start

**Solution**:
```bash
# Kill any existing Metro processes
pkill -f "react-native"
pkill -f "expo"

# Restart
npm start -- --clear
```

---

### Issue 8: App crashes on startup

**Solution**:
```bash
# Check for syntax errors
npm run tsc

# Restart with clean cache
npm start -- --clear --reset-cache
```

---

## 🔧 Quick Fixes

### Reset Everything:
```bash
# Full clean reinstall
rm -rf node_modules .expo
npm install --legacy-peer-deps
npm start -- --clear
```

### Test Backend Connection:
```bash
# In browser or curl
curl http://localhost:8000/api/v1/health

# Should return:
# {
#   "status": "healthy",
#   "services": {
#     "ble_simulator": true,
#     "timesystems": true,
#     "ifrs": true,
#     "clarity": true,
#     "lia": true
#   }
# }
```

### Verify Versions:
```bash
# Check Expo version
npx expo --version
# Should be: 54.x.x

# Check Node version
node --version
# Should be: 18.x or higher

# Check npm version
npm --version
# Should be: 9.x or higher
```

---

## 📱 Platform-Specific Issues

### iOS Simulator:
**Issue**: Cannot connect to backend
**Solution**: URL should be `http://localhost:8000` (automatic in backendApi.ts)

### Android Emulator:
**Issue**: Cannot connect to backend
**Solution**: URL should be `http://10.0.2.2:8000` (automatic in backendApi.ts)

### Physical Device:
**Issue**: Cannot connect to backend
**Steps**:
1. Find your computer's IP:
   ```bash
   # On Linux/Mac:
   ifconfig | grep "inet "

   # On Windows:
   ipconfig
   ```

2. Update `src/services/backendApi.ts`:
   ```typescript
   BASE_URL: 'http://YOUR_IP:8000'  // e.g., http://192.168.1.100:8000
   ```

3. Ensure both devices on same WiFi network

4. Check firewall allows port 8000

---

## 🐛 Debug Mode

### Enable Verbose Logging:
```bash
# Start with debug info
EXPO_DEBUG=true npm start
```

### Check Metro Bundler:
- Watch the terminal for errors
- Red text = errors
- Yellow text = warnings
- Check for module not found errors

### Check React Native Debugger:
- Shake device/simulator
- Select "Debug"
- Open Chrome DevTools
- Check Console for errors

---

## ✅ Verification Checklist

After fixing issues, verify:

- [ ] `npm start` runs without errors
- [ ] QR code appears in terminal
- [ ] Can open in Expo Go (SDK 54)
- [ ] App loads without crashes
- [ ] Can navigate in app
- [ ] Backend connection works (if backend running)
- [ ] LiveDataScreen accessible (after adding to navigation)

---

## 🆘 Still Having Issues?

### Check Logs:
```bash
# Metro bundler logs
# Already visible in terminal

# Expo logs
npx expo start --clear

# Backend logs
# Check terminal where backend is running
```

### Common Log Patterns:

**"Cannot find module"**:
- Missing dependency
- Run: `npm install --legacy-peer-deps`

**"ERESOLVE"**:
- Peer dependency conflict
- Always use: `--legacy-peer-deps` flag

**"Bundling failed"**:
- Syntax error in code
- Check the file mentioned in error
- Run: `npm start -- --clear`

**"Network request failed"**:
- Backend not running
- Wrong IP address
- Firewall blocking

---

## 📋 Pre-Flight Checklist

Before starting app:

1. **Backend Running**:
   ```bash
   cd backend && python main.py
   # Should see: "Backend ready to accept connections"
   ```

2. **Dependencies Installed**:
   ```bash
   cd BLE-wearable-App
   ls node_modules | wc -l
   # Should show: >500
   ```

3. **No Port Conflicts**:
   ```bash
   # Check port 8000 (backend)
   lsof -i :8000

   # Check port 8081 (Metro)
   lsof -i :8081
   ```

4. **Expo Go Updated**:
   - Open Expo Go app
   - Check it says "SDK 54"

---

## 🔍 Quick Diagnostics

### Test Backend:
```bash
curl http://localhost:8000/api/v1/health
```
✅ Should return JSON with "status": "healthy"

### Test Mobile Dependencies:
```bash
npm list expo
```
✅ Should show: expo@54.x.x

### Test Babel:
```bash
npm list babel-preset-expo
```
✅ Should show: babel-preset-expo@54.x.x

---

## 📞 Support Resources

- **Integration Guide**: `INTEGRATION_GUIDE.md`
- **SDK Upgrade**: `SDK_54_UPGRADE.md`
- **Backend Docs**: `../backend/TECHNICAL_DOCUMENTATION.md`
- **Quick Reference**: `../QUICK_REFERENCE.md`

---

**Most Common Solution**: Clear cache and restart
```bash
rm -rf .expo node_modules/.cache
npm start -- --clear
```

**Second Most Common**: Reinstall dependencies
```bash
rm -rf node_modules
npm install --legacy-peer-deps
```

**Third Most Common**: Backend not running
```bash
cd ../backend && python main.py
```
