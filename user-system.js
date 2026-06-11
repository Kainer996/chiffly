// user-system.js — Server-side user & XP management for Chifftown
const fs = require('fs').promises;
const path = require('path');

const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const ACTIVITY_FILE = path.join(__dirname, 'data', 'activity.json');

// XP Rewards
const XP_REWARDS = {
  JOIN_ROOM: 10,
  CHAT_MESSAGE: 2,
  TIP_SENT: 5,
  TIP_RECEIVED: 3,
  STREAMING_SESSION: 20,
  ARCADE_GAME: 5,
  DAILY_LOGIN: 15,
  PROFILE_COMPLETE: 25
};

// Achievements
const ACHIEVEMENTS = [
  // --- Exploration ---
  { id: 'first_steps', name: 'First Steps', desc: 'Join your first room', icon: '👋', category: 'exploration', tier: 'bronze',
    check: (u) => u.stats.roomsJoined >= 1, progress: (u) => ({ current: u.stats.roomsJoined, target: 1 }), xpReward: 50, coinReward: 25 },
  { id: 'social_butterfly', name: 'Social Butterfly', desc: 'Visit 5 different venues', icon: '🦋', category: 'exploration', tier: 'silver',
    check: (u) => (u.stats.venuesVisited || []).length >= 5, progress: (u) => ({ current: (u.stats.venuesVisited || []).length, target: 5 }), xpReward: 200, coinReward: 100 },
  { id: 'globetrotter', name: 'Globetrotter', desc: 'Visit all 9 venues', icon: '🌍', category: 'exploration', tier: 'gold',
    check: (u) => (u.stats.venuesVisited || []).length >= 9, progress: (u) => ({ current: (u.stats.venuesVisited || []).length, target: 9 }), xpReward: 500, coinReward: 250 },
  { id: 'room_regular', name: 'Room Regular', desc: 'Join 50 rooms', icon: '🚪', category: 'exploration', tier: 'silver',
    check: (u) => u.stats.roomsJoined >= 50, progress: (u) => ({ current: u.stats.roomsJoined, target: 50 }), xpReward: 300, coinReward: 150 },

  // --- Social ---
  { id: 'chatterer', name: 'Chatterer', desc: 'Send 50 messages', icon: '💬', category: 'social', tier: 'bronze',
    check: (u) => u.stats.messagesSent >= 50, progress: (u) => ({ current: u.stats.messagesSent, target: 50 }), xpReward: 100, coinReward: 50 },
  { id: 'motormouth', name: 'Motormouth', desc: 'Send 500 messages', icon: '🗣️', category: 'social', tier: 'silver',
    check: (u) => u.stats.messagesSent >= 500, progress: (u) => ({ current: u.stats.messagesSent, target: 500 }), xpReward: 400, coinReward: 200 },
  { id: 'generous_tipper', name: 'Generous Tipper', desc: 'Send 10 tips', icon: '💰', category: 'social', tier: 'silver',
    check: (u) => u.stats.tipsSent >= 10, progress: (u) => ({ current: u.stats.tipsSent, target: 10 }), xpReward: 300, coinReward: 150 },
  { id: 'tip_magnet', name: 'Tip Magnet', desc: 'Receive 25 tips', icon: '🧲', category: 'social', tier: 'gold',
    check: (u) => u.stats.tipsReceived >= 25, progress: (u) => ({ current: u.stats.tipsReceived, target: 25 }), xpReward: 500, coinReward: 250 },

  // --- Streaming ---
  { id: 'streaming_star', name: 'Streaming Star', desc: 'Stream 5 sessions', icon: '⭐', category: 'streaming', tier: 'silver',
    check: (u) => u.stats.streamingSessions >= 5, progress: (u) => ({ current: u.stats.streamingSessions, target: 5 }), xpReward: 400, coinReward: 200 },
  { id: 'broadcast_legend', name: 'Broadcast Legend', desc: 'Stream 25 sessions', icon: '📡', category: 'streaming', tier: 'gold',
    check: (u) => u.stats.streamingSessions >= 25, progress: (u) => ({ current: u.stats.streamingSessions, target: 25 }), xpReward: 800, coinReward: 400 },

  // --- Arcade ---
  { id: 'arcade_rookie', name: 'Arcade Rookie', desc: 'Play 5 arcade games', icon: '🕹️', category: 'arcade', tier: 'bronze',
    check: (u) => u.stats.gamesPlayed >= 5, progress: (u) => ({ current: u.stats.gamesPlayed, target: 5 }), xpReward: 100, coinReward: 50 },
  { id: 'arcade_master', name: 'Arcade Master', desc: 'Play 50 arcade games', icon: '🎮', category: 'arcade', tier: 'silver',
    check: (u) => u.stats.gamesPlayed >= 50, progress: (u) => ({ current: u.stats.gamesPlayed, target: 50 }), xpReward: 400, coinReward: 200 },
  { id: 'arcade_legend', name: 'Arcade Legend', desc: 'Play 200 arcade games', icon: '🏆', category: 'arcade', tier: 'gold',
    check: (u) => u.stats.gamesPlayed >= 200, progress: (u) => ({ current: u.stats.gamesPlayed, target: 200 }), xpReward: 1000, coinReward: 500 },

  // --- Progression ---
  { id: 'town_veteran', name: 'Town Veteran', desc: 'Reach level 10', icon: '🏅', category: 'progression', tier: 'silver',
    check: (u, lvl) => lvl >= 10, progress: (u, lvl) => ({ current: lvl, target: 10 }), xpReward: 0, coinReward: 500 },
  { id: 'legend', name: 'Chifftown Legend', desc: 'Reach level 25', icon: '👑', category: 'progression', tier: 'gold',
    check: (u, lvl) => lvl >= 25, progress: (u, lvl) => ({ current: lvl, target: 25 }), xpReward: 0, coinReward: 1000 },
  { id: 'coin_collector', name: 'Coin Collector', desc: 'Accumulate 1,000 coins', icon: '💎', category: 'progression', tier: 'silver',
    check: (u) => (u.coins || 0) >= 1000, progress: (u) => ({ current: u.coins || 0, target: 1000 }), xpReward: 200, coinReward: 0 },
  { id: 'millionaire', name: 'Millionaire', desc: 'Accumulate 10,000 coins', icon: '🤑', category: 'progression', tier: 'gold',
    check: (u) => (u.coins || 0) >= 10000, progress: (u) => ({ current: u.coins || 0, target: 10000 }), xpReward: 500, coinReward: 0 },
];

// Level calculation
function calculateLevel(xp) {
  // Progressive leveling: level 1 = 0-99 XP, level 2 = 100-249, level 3 = 250-449, etc.
  // Formula: XP needed for level N = 100 * N * (N-1) / 2
  let level = 1;
  let xpNeeded = 0;
  while (xp >= xpNeeded) {
    xpNeeded += level * 100;
    if (xp >= xpNeeded) level++;
  }
  return {
    level,
    currentXp: xp,
    xpInLevel: xp - (xpNeeded - level * 100),
    xpForNextLevel: level * 100
  };
}

class UserSystem {
  constructor() {
    this.users = {};
    this.activity = [];
    this.loaded = false;
  }

  async init() {
    try {
      // Ensure data directory exists
      await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
      
      // Load users
      try {
        const userData = await fs.readFile(USERS_FILE, 'utf8');
        this.users = JSON.parse(userData);
      } catch (err) {
        if (err.code !== 'ENOENT') throw err;
        this.users = {};
      }

      // Load activity
      try {
        const activityData = await fs.readFile(ACTIVITY_FILE, 'utf8');
        this.activity = JSON.parse(activityData);
      } catch (err) {
        if (err.code !== 'ENOENT') throw err;
        this.activity = [];
      }

      this.loaded = true;
      console.log(`✅ User system loaded: ${Object.keys(this.users).length} users`);
    } catch (error) {
      console.error('❌ Error loading user system:', error);
      this.users = {};
      this.activity = [];
      this.loaded = true;
    }
  }

  async saveUsers() {
    try {
      await fs.writeFile(USERS_FILE, JSON.stringify(this.users, null, 2));
    } catch (error) {
      console.error('Error saving users:', error);
    }
  }

  async saveActivity() {
    try {
      // Keep only last 1000 activities
      if (this.activity.length > 1000) {
        this.activity = this.activity.slice(-1000);
      }
      await fs.writeFile(ACTIVITY_FILE, JSON.stringify(this.activity, null, 2));
    } catch (error) {
      console.error('Error saving activity:', error);
    }
  }

  getOrCreateUser(username, socketId) {
    if (!username) return null;
    
    if (!this.users[username]) {
      this.users[username] = {
        username,
        xp: 0,
        level: 1,
        coins: 100, // Starting coins for casino
        stardust: 0, // Premium currency
        createdAt: Date.now(),
        lastSeen: Date.now(),
        stats: {
          roomsJoined: 0,
          messagesSent: 0,
          tipsSent: 0,
          tipsReceived: 0,
          streamingSessions: 0,
          gamesPlayed: 0,
          venuesVisited: []
        },
        achievements: [],
        inventory: [],
        socketId
      };
      this.saveUsers();
    } else {
      this.users[username].lastSeen = Date.now();
      this.users[username].socketId = socketId;
      // Ensure coins exist for existing users
      if (this.users[username].coins === undefined) {
        this.users[username].coins = 100;
      }
      // Ensure stardust exists for existing users
      if (this.users[username].stardust === undefined) {
        this.users[username].stardust = 0;
      }
    }

    return this.users[username];
  }

  async addXP(username, amount, reason, io) {
    if (!this.users[username]) return null;

    const user = this.users[username];
    const oldLevel = calculateLevel(user.xp).level;
    
    user.xp += amount;
    const newLevelData = calculateLevel(user.xp);
    user.level = newLevelData.level;

    // Log activity
    this.activity.push({
      username,
      type: 'xp_gain',
      amount,
      reason,
      timestamp: Date.now()
    });

    // Check for level up
    if (newLevelData.level > oldLevel) {
      this.activity.push({
        username,
        type: 'level_up',
        level: newLevelData.level,
        timestamp: Date.now()
      });
      
      // Notify user of level up
      if (io && user.socketId) {
        io.to(user.socketId).emit('level-up', {
          level: newLevelData.level,
          username
        });
      }
      
      // Broadcast level-up globally for activity feed
      if (io) {
        io.emit('activity', {
          id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'level_up',
          data: { user: username, level: newLevelData.level },
          timestamp: Date.now()
        });
      }
    }

    // Check achievements
    this.checkAchievements(username, io);

    await this.saveUsers();
    await this.saveActivity();

    // Notify user of XP gain
    if (io && user.socketId) {
      io.to(user.socketId).emit('xp-gained', {
        amount,
        reason,
        newXp: user.xp,
        levelData: newLevelData
      });
    }

    return { user, levelData: newLevelData, leveledUp: newLevelData.level > oldLevel };
  }

  checkAchievements(username, io) {
    if (!this.users[username]) return;

    const user = this.users[username];
    let newAchievements = [];

    const userLevel = calculateLevel(user.xp).level;
    ACHIEVEMENTS.forEach(achievement => {
      if (!user.achievements.includes(achievement.id) && achievement.check(user, userLevel)) {
        user.achievements.push(achievement.id);
        newAchievements.push(achievement);
        
        // Grant rewards
        if (achievement.xpReward) user.xp += achievement.xpReward;
        if (achievement.coinReward) user.coins = (user.coins || 0) + achievement.coinReward;
        
        // Add achievement item to inventory
        if (!user.inventory.includes(achievement.name)) {
          user.inventory.push(achievement.name);
        }

        // Log achievement
        this.activity.push({
          username,
          type: 'achievement',
          achievementId: achievement.id,
          achievementName: achievement.name,
          timestamp: Date.now()
        });

        // Notify user
        if (io && user.socketId) {
          io.to(user.socketId).emit('achievement-unlocked', achievement);
        }
        
        // Broadcast achievement globally for activity feed
        if (io) {
          io.emit('activity', {
            id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'achievement',
            data: { user: username, achievement: achievement.name },
            timestamp: Date.now()
          });
        }
      }
    });

    return newAchievements;
  }

  getUserStats(username) {
    const user = this.users[username];
    if (!user) return null;

    const levelData = calculateLevel(user.xp);
    const userAchievements = ACHIEVEMENTS.filter(a => user.achievements.includes(a.id));

    return {
      username: user.username,
      xp: user.xp,
      level: levelData.level,
      levelData,
      coins: user.coins || 100,
      stardust: user.stardust || 0,
      achievements: userAchievements,
      stats: user.stats,
      inventory: user.inventory,
      apartmentData: user.apartmentData || null,
      createdAt: user.createdAt,
      lastSeen: user.lastSeen
    };
  }

  getAchievementProgress(username) {
    const user = this.users[username];
    if (!user) return null;
    const userLevel = calculateLevel(user.xp).level;
    return ACHIEVEMENTS.map(a => {
      const prog = a.progress(user, userLevel);
      return {
        id: a.id, name: a.name, desc: a.desc, icon: a.icon,
        category: a.category, tier: a.tier,
        xpReward: a.xpReward, coinReward: a.coinReward,
        unlocked: user.achievements.includes(a.id),
        current: Math.min(prog.current, prog.target),
        target: prog.target,
        percent: Math.min(100, Math.round((prog.current / prog.target) * 100))
      };
    });
  }

  getLeaderboard(limit = 10, category = 'xp') {
    const users = Object.values(this.users);
    let sorted;
    switch (category) {
      case 'coins':
        sorted = users.sort((a, b) => (b.coins || 0) - (a.coins || 0)); break;
      case 'achievements':
        sorted = users.sort((a, b) => b.achievements.length - a.achievements.length); break;
      case 'messages':
        sorted = users.sort((a, b) => (b.stats.messagesSent || 0) - (a.stats.messagesSent || 0)); break;
      case 'games':
        sorted = users.sort((a, b) => (b.stats.gamesPlayed || 0) - (a.stats.gamesPlayed || 0)); break;
      default:
        sorted = users.sort((a, b) => b.xp - a.xp);
    }
    return sorted.slice(0, limit).map((user, i) => ({
      rank: i + 1,
      username: user.username,
      xp: user.xp,
      level: calculateLevel(user.xp).level,
      coins: user.coins || 0,
      achievements: user.achievements.length,
      messagesSent: user.stats.messagesSent || 0,
      gamesPlayed: user.stats.gamesPlayed || 0,
      roomsJoined: user.stats.roomsJoined || 0
    }));
  }

  getRecentActivity(username, limit = 20) {
    return this.activity
      .filter(a => a.username === username)
      .slice(-limit)
      .reverse();
  }

  getAllActivity(limit = 50) {
    return this.activity.slice(-limit).reverse();
  }

  // Stat tracking methods
  trackRoomJoin(username, roomType) {
    if (!this.users[username]) return;
    this.users[username].stats.roomsJoined++;
    
    if (!this.users[username].stats.venuesVisited.includes(roomType)) {
      this.users[username].stats.venuesVisited.push(roomType);
    }
    
    this.saveUsers();
  }

  trackMessage(username) {
    if (!this.users[username]) return;
    this.users[username].stats.messagesSent++;
    this.saveUsers();
  }

  trackTipSent(username) {
    if (!this.users[username]) return;
    this.users[username].stats.tipsSent++;
    this.saveUsers();
  }

  trackTipReceived(username) {
    if (!this.users[username]) return;
    this.users[username].stats.tipsReceived++;
    this.saveUsers();
  }

  trackStreamingSession(username) {
    if (!this.users[username]) return;
    this.users[username].stats.streamingSessions++;
    this.saveUsers();
  }

  trackGamePlayed(username) {
    if (!this.users[username]) return;
    this.users[username].stats.gamesPlayed++;
    this.saveUsers();
  }

  updateCoins(username, amount, absolute = false) {
    if (!this.users[username]) return;
    
    if (absolute) {
      // Set coins to exact amount
      this.users[username].coins = amount;
    } else {
      // Add/subtract coins
      this.users[username].coins = (this.users[username].coins || 100) + amount;
    }
    
    // Ensure coins don't go negative
    if (this.users[username].coins < 0) {
      this.users[username].coins = 0;
    }
    
    this.saveUsers();
    return this.users[username].coins;
  }

  getCoins(username) {
    if (!this.users[username]) return 100;
    return this.users[username].coins || 100;
  }

  updateStardust(username, amount, absolute = false) {
    if (!this.users[username]) return;
    
    if (absolute) {
      // Set stardust to exact amount
      this.users[username].stardust = amount;
    } else {
      // Add/subtract stardust
      this.users[username].stardust = (this.users[username].stardust || 0) + amount;
    }
    
    // Ensure stardust doesn't go negative
    if (this.users[username].stardust < 0) {
      this.users[username].stardust = 0;
    }
    
    this.saveUsers();
    return this.users[username].stardust;
  }

  getStardust(username) {
    if (!this.users[username]) return 0;
    return this.users[username].stardust || 0;
  }
}

module.exports = { UserSystem, XP_REWARDS, ACHIEVEMENTS, calculateLevel };
