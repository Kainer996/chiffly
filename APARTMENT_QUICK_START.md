# 🏠 Apartment System - Quick Start Guide

## ✅ Status: LIVE AND READY

**URL:** https://chifftown.com/apartment.html  
**Server:** Running on port 3000 via PM2  
**Backup:** Old system saved as `apartment-old.html`

---

## 🎮 How to Use (As a User)

### Adding Furniture
1. Open the furniture panel on the right side
2. Drag any item onto the isometric room
3. It automatically snaps to grid and saves

### Moving Furniture
- Just drag already-placed items to new positions
- Hover over item → Click the **×** button to remove

### Changing Themes
1. Click **"Themes"** button in top bar
2. Choose from:
   - 🪵 **Cozy Cabin** (warm browns)
   - 🏙️ **Modern Loft** (cool greys)
   - 🌊 **Ocean Breeze** (teal & sandy)

### Sharing Your Apartment
1. Click **"Share"** button
2. Link copied automatically
3. Friends can visit but can't edit

### Level Requirements
- **Level 1:** Sofa, Bed, Table, Lamp, Plant, Rug
- **Level 2:** Bookshelf, TV, Fish Tank, Fireplace
- **Level 3:** Jukebox (neon lights!)
- **Level 5:** Disco Ball (rotating!)

---

## 🎨 What Makes It Cool

### Animated Furniture
- **💡 Lamp** - Glows and pulses
- **🔥 Fireplace** - Flames flicker
- **🐠 Fish Tank** - Fish swim around
- **🪩 Disco Ball** - Rotates with light spots
- **🎵 Jukebox** - Color-cycling neon lights
- **📺 TV** - Screen flickers

### Pure CSS
- No images loaded
- All furniture is CSS/HTML
- Smooth 60fps animations
- Fast page load

---

## 🔧 For Developers

### Restart Server
```bash
cd /home/ubuntu/chiffly && pm2 restart chiffly
```

### Check Logs
```bash
pm2 logs chiffly
```

### View Status
```bash
pm2 status
```

### Files Changed
- `apartment.html` - Main apartment page (completely rewritten)
- `server.js` - Added socket handlers for apartment data
- `user-system.js` - Added apartmentData to user profiles
- `apartment-old.html` - Backup of original system

### Data Storage
Apartment data saved in: `/home/ubuntu/chiffly/data/users.json`

Format:
```json
{
  "username": {
    "apartmentData": {
      "furniture": {
        "sofa": { "x": 100, "y": 150 },
        "lamp": { "x": 200, "y": 100 }
      },
      "theme": "cabin"
    }
  }
}
```

---

## 🚀 Deployment Status

✅ Server running on PM2  
✅ Port 3000 active  
✅ Socket.io connected  
✅ User system integrated  
✅ Data persistence working  
✅ Visit mode functional  
✅ Level checks enabled  

---

## 🎯 Test It

1. Go to https://chifftown.com/apartment.html
2. Drag a sofa onto the room
3. Change the theme
4. Click share and visit your own link
5. Verify it's read-only in visit mode

---

## 💡 Tips

- **Grid Snap:** Items snap to 50px grid for clean alignment
- **Remove Items:** Hover over placed furniture to see remove button
- **Level Up:** Play games and chat to unlock more furniture
- **Themes:** Try all 3 themes to see which feels best
- **Share:** Your apartment URL never changes, so share once

---

## 🐛 If Something Breaks

```bash
# Restart the server
cd /home/ubuntu/chiffly && pm2 restart chiffly

# Check for errors
pm2 logs chiffly --err

# Restore old version if needed
cp apartment-old.html apartment.html
pm2 restart chiffly
```

---

**Built:** Feb 12, 2026 by Ava  
**Style:** Disney Dreamlight Valley inspired  
**Tech:** Pure CSS isometric with Socket.io  

🎉 Enjoy your cartoony apartment!
