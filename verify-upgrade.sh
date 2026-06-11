#!/bin/bash
echo "🔍 ChiffTown Upgrade Verification"
echo "=================================="
echo ""

# Check files exist
echo "📁 File Existence Check:"
files=(
    "nightclub.html"
    "lounge.html"
    "nightclub-stream.html"
    "cinema-stream.html"
    "arcade-stream.html"
    "lounge-stream.html"
    "pub-stream.html"
    "css/town-animations.css"
    "main-home-styles.css"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file exists"
    else
        echo "  ✗ $file MISSING!"
    fi
done

echo ""
echo "🎨 Color Compliance Check:"

# Check nightclub for pink/purple violations
if grep -q "ec4899\|a78bfa" nightclub.html; then
    echo "  ✗ Nightclub still has pink/purple!"
else
    echo "  ✓ Nightclub clean (no pink/purple)"
fi

# Check lounge for purple violations  
if grep -q "a78bfa\|c4b5fd\|1e1b4b\|312e81\|3730a3\|7c3aed" lounge.html 2>/dev/null; then
    echo "  ⚠ Lounge may still have purple traces"
else
    echo "  ✓ Lounge clean (no purple/lavender)"
fi

echo ""
echo "🎭 Animation Check:"
if grep -q "windowGlow\|buildingSway\|buildingPulse" css/town-animations.css; then
    echo "  ✓ Building animations present"
else
    echo "  ✗ Animations missing!"
fi

echo ""
echo "🎬 Themed Backgrounds Check:"
if grep -q "theme-nightclub\|theme-lounge\|theme-cinema\|theme-arcade" pub-stream.html; then
    echo "  ✓ Venue themes configured"
else
    echo "  ✗ Themes missing from pub-stream.html!"
fi

echo ""
echo "💾 Backup Check:"
backups=0
for backup in *.backup-feb13*; do
    [ -f "$backup" ] && ((backups++))
done
echo "  ✓ Found $backups backup files"

echo ""
echo "🚀 PM2 Status:"
pm2 describe chiffly 2>/dev/null | grep -E "status|uptime|restarts" || echo "  ⚠ PM2 not responding"

echo ""
echo "=================================="
echo "✨ Verification Complete!"
