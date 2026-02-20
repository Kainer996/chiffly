#!/bin/bash
# ChiffTown Comprehensive Upgrade Script
# Feb 13, 2026

set -e

echo "🏗️  ChiffTown Upgrade Starting..."
echo ""

# Backup originals
echo "📦 Creating backups..."
cp lounge.html lounge.html.backup-feb13 2>/dev/null || true
cp main-home-styles.css main-home-styles.css.backup-feb13 2>/dev/null || true

# Update lounge.html color scheme (purple → teal/blue/gold)
echo "🎨 Updating Lounge color scheme..."
sed -i 's/#a78bfa/#0891b2/g' lounge.html  # purple → teal
sed -i 's/#c4b5fd/#06b6d4/g' lounge.html  # lavender → cyan  
sed -i 's/#1e1b4b/#0a2540/g' lounge.html  # deep purple → deep blue
sed -i 's/#312e81/#0f2540/g' lounge.html  # mid purple → mid blue
sed -i 's/#3730a3/#1e3a8a/g' lounge.html  # purple → blue
sed -i 's/#7c3aed/#3b82f6/g' lounge.html  # purple accent → blue accent
sed -i 's/rgba(167,139,250/rgba(8,145,178/g' lounge.html  # purple rgba → teal rgba
sed -i 's/rgba(196,181,253/rgba(6,182,212/g' lounge.html  # lavender rgba → cyan rgba
sed -i 's/rgba(139,92,246/rgba(59,130,246/g' lounge.html  # purple glow → blue glow
sed -i 's/rgba(55, 48, 163/rgba(30, 58, 138/g' lounge.html  # purple gradient → blue gradient
sed -i 's/rgba(49, 46, 129/rgba(15, 37, 64/g' lounge.html
sed -i 's/rgba(30, 27, 75/rgba(10, 37, 64/g' lounge.html
echo "✅ Lounge colors updated (purple → teal/blue)"

# Update main-home-styles.css hotspot colors
echo "🎨 Updating map hotspot colors..."
# Nightclub: cyan instead of pink/purple
sed -i 's/rgba(236, 72, 153/rgba(0, 206, 209/g' main-home-styles.css
# Lounge: teal instead of purple  
sed -i 's/rgba(64, 224, 208/rgba(8, 145, 178/g' main-home-styles.css
sed -i 's/#40E0D0/#0891b2/g' main-home-styles.css
# Update CSS variables
sed -i 's/--nightclub: #00CED1/--nightclub: #00CED1/' main-home-styles.css  # already good
sed -i 's/--lounge: #40E0D0/--lounge: #0891b2/' main-home-styles.css
echo "✅ Hotspot colors updated"

echo ""
echo "🎭 Creating themed streaming rooms..."

# Create nightclub-stream.html
cat > nightclub-stream.html << 'NIGHTCLUB_EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Night Club Stream - Chifftown</title>
    <link rel="stylesheet" href="main-home-styles.css?v=5">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        body {
            background: #050510;
            color: white;
            margin: 0;
            padding: 0;
            font-family: 'Inter', sans-serif;
            overflow-x: hidden;
        }
        
        /* Nightclub themed background */
        body::before {
            content: '';
            position: fixed;
            inset: 0;
            background: linear-gradient(
                180deg,
                rgba(5, 5, 16, 0.95) 0%,
                rgba(8, 45, 82, 0.9) 30%,
                rgba(0, 80, 120, 0.85) 50%,
                rgba(8, 45, 82, 0.9) 70%,
                rgba(5, 5, 16, 0.95) 100%
            );
            z-index: -1;
        }
        
        /* Neon grid floor effect */
        body::after {
            content: '';
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 40%;
            background: 
                linear-gradient(rgba(0, 206, 209, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 206, 209, 0.03) 1px, transparent 1px);
            background-size: 50px 50px;
            transform: perspective(500px) rotateX(60deg);
            transform-origin: bottom;
            z-index: -1;
            opacity: 0.4;
        }
        
        .stream-header {
            background: rgba(0, 206, 209, 0.08);
            border-bottom: 1px solid rgba(0, 206, 209, 0.2);
            padding: 1rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .room-title {
            font-size: 1.3rem;
            font-weight: 700;
            color: #00CED1;
            text-shadow: 0 0 10px rgba(0, 206, 209, 0.5);
        }
    </style>
    <script>
        // Redirect to pub-stream.html with nightclub theme parameter
        const params = new URLSearchParams(window.location.search);
        params.set('type', 'nightclub');
        window.location.href = 'pub-stream.html?' + params.toString();
    </script>
</head>
<body>
    <div class="stream-header">
        <div class="room-title">🎵 Night Club</div>
    </div>
</body>
</html>
NIGHTCLUB_EOF

echo "✅ nightclub-stream.html created"

# Create cinema-stream.html  
cat > cinema-stream.html << 'CINEMA_EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cinema Stream - Chifftown</title>
    <script>
        const params = new URLSearchParams(window.location.search);
        params.set('type', 'cinema');
        window.location.href = 'pub-stream.html?' + params.toString();
    </script>
</head>
<body style="background: #0c0a09; color: white; font-family: sans-serif; text-align: center; padding: 3rem;">
    <h1 style="color: #ef4444;">🎬 Cinema Loading...</h1>
</body>
</html>
CINEMA_EOF

echo "✅ cinema-stream.html created"

# Create arcade-stream.html
cat > arcade-stream.html << 'ARCADE_EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Arcade Stream - Chifftown</title>
    <script>
        const params = new URLSearchParams(window.location.search);
        params.set('type', 'arcade');
        window.location.href = 'pub-stream.html?' + params.toString();
    </script>
</head>
<body style="background: #021a0a; color: #22c55e; font-family: 'Courier New', monospace; text-align: center; padding: 3rem;">
    <h1>🎮 ARCADE LOADING...</h1>
</body>
</html>
ARCADE_EOF

echo "✅ arcade-stream.html created"

# Create lounge-stream.html
cat > lounge-stream.html << 'LOUNGE_EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lounge Stream - Chifftown</title>
    <script>
        const params = new URLSearchParams(window.location.search);
        params.set('type', 'lounge');
        window.location.href = 'pub-stream.html?' + params.toString();
    </script>
</head>
<body style="background: #0a2540; color: #0891b2; font-family: serif; text-align: center; padding: 3rem;">
    <h1 style="color: #06b6d4;">🛋️ Lounge Loading...</h1>
</body>
</html>
LOUNGE_EOF

echo "✅ lounge-stream.html created"

echo ""
echo "✨ Adding building animations to map..."

# Add glowing windows animation CSS
cat >> css/town-animations.css << 'ANIM_EOF'

/* === Enhanced Building Animations === */

/* Glowing windows effect */
@keyframes windowGlow {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
}

.map-hotspot::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at center, currentColor 0%, transparent 60%);
    opacity: 0;
    transition: opacity 0.4s ease;
    pointer-events: none;
    animation: buildingPulse 3s ease-in-out infinite;
}

.map-hotspot:hover::after {
    opacity: 0.15;
}

@keyframes buildingPulse {
    0%, 100% { opacity: 0.05; transform: scale(1); }
    50% { opacity: 0.15; transform: scale(1.05); }
}

/* Subtle building sway */
.map-hotspot {
    animation: buildingSway 6s ease-in-out infinite;
}

@keyframes buildingSway {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-2px); }
}

.map-hotspot:hover {
    animation: none;
    transform: scale(1.08) translateY(-4px) !important;
}

/* Window flicker simulation */
.tavern-hotspot::before,
.nightclub-hotspot::before,
.cinema-hotspot::before,
.arcade-hotspot::before,
.lounge-hotspot::before,
.adventure-hotspot::before {
    content: '';
    position: absolute;
    top: 20%;
    left: 30%;
    width: 3px;
    height: 4px;
    background: currentColor;
    border-radius: 1px;
    opacity: 0;
    animation: windowFlicker 4s ease-in-out infinite;
    box-shadow: 
        8px 0 0 currentColor,
        16px 0 0 currentColor,
        0 8px 0 currentColor,
        8px 8px 0 currentColor,
        16px 8px 0 currentColor;
}

@keyframes windowFlicker {
    0%, 90%, 100% { opacity: 0.6; }
    93%, 97% { opacity: 0.3; }
    95% { opacity: 0.8; }
}

/* Responsive touch feedback */
@media (hover: none) {
    .map-hotspot:active {
        transform: scale(1.05) !important;
        transition: transform 0.1s ease;
    }
}
ANIM_EOF

echo "✅ Building animations added"

echo ""
echo "🎉 All upgrades complete!"
echo ""
echo "📋 Summary:"
echo "  ✓ Nightclub color scheme updated (pink/purple → cyan/teal/blue)"
echo "  ✓ Lounge color scheme updated (purple → teal/blue/gold)"
echo "  ✓ Map hotspot colors corrected"
echo "  ✓ Building animations enhanced (hover, glow, sway, windows)"
echo "  ✓ Themed streaming rooms created (4 new files)"
echo ""
echo "🔄 Restarting PM2 process..."
pm2 restart chiffly
echo ""
echo "✨ ChiffTown upgrade complete! Check http://your-server:3000"
