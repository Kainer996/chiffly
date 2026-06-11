// xp-system.js
// Global lightweight RPG-style XP & leveling helper for Chiffly
(function (global) {
  const STORAGE_KEY = 'chiffly_registered_users';
  const BASE_XP_PER_LEVEL = 100; // XP required to advance each level

  // Simple achievement thresholds (total XP)
  const ACHIEVEMENTS = [
    { id: 'first_steps', xp: 10, name: 'First Steps', item: 'Wooden Mug' },
    { id: 'camera_ready', xp: 100, name: 'Camera Ready', item: 'Bronze Webcam' },
    { id: 'rookie_streamer', xp: 250, name: 'Rookie Broadcaster', item: 'Copper Mic' },
    { id: 'streaming_star', xp: 1000, name: 'Streaming Star', item: 'Silver Trophy' }
  ];

  function loadUsers() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  }

  function saveUsers(users) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }

  function ensureUser(username) {
    if (!username) return null;
    const users = loadUsers();
    if (!users[username]) return null;

    // Initialise XP data if missing
    if (typeof users[username].xp !== 'number') users[username].xp = 0;
    if (!Array.isArray(users[username].achievements)) users[username].achievements = [];
    if (!Array.isArray(users[username].inventory)) users[username].inventory = [];
    return users[username];
  }

  function getLevel(totalXp) {
    // Linear progression for simplicity
    return Math.floor(totalXp / BASE_XP_PER_LEVEL) + 1;
  }

  function addXp(username, amount, reason = '') {
    if (!amount || amount <= 0) return;
    const users = loadUsers();
    const user = ensureUser(username);
    if (!user) return;

    const prevXp = user.xp;
    const prevLevel = getLevel(prevXp);
    user.xp += amount;
    const newLevel = getLevel(user.xp);

    // Save XP gain
    users[username] = user;
    saveUsers(users);

    // Notify XP gain
    notify(`${username} gained ${amount} XP${reason ? ` for ${reason}` : ''}!`);

    // Handle level-up
    if (newLevel > prevLevel) {
      notify(`🎉 ${username} reached Level ${newLevel}!`);
    }

    // Check achievements
    checkAchievements(username, user);
  }

  function checkAchievements(username, user) {
    ACHIEVEMENTS.forEach(a => {
      if (user.xp >= a.xp && !user.achievements.includes(a.id)) {
        user.achievements.push(a.id);
        if (!user.inventory.includes(a.item)) {
          user.inventory.push(a.item);
        }
        notify(`🏆 Achievement Unlocked: ${a.name}! You received: ${a.item}`);
      }
    });
    // Persist any new achievements/inventory
    const users = loadUsers();
    users[username] = user;
    saveUsers(users);
  }

  // Convenience accessor functions
  function getUserData(username) {
    return ensureUser(username);
  }

  function notify(message) {
    if (typeof showNotification === 'function') {
      showNotification(message, 'success');
    } else if (typeof addChatMessage === 'function') {
      addChatMessage('System', message, true);
    } else {
      console.log('[XP]', message);
    }
  }

  // Expose API
  global.xpSystem = {
    addXp,
    getUserData,
    getLevel
  };
})(window); 