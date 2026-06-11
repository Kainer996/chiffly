// daily-rewards.js — Client-side daily reward system for Chifftown

class DailyRewardSystem {
  constructor() {
    this.username = null;
    this.hasShownToday = false;
    this.socket = null;
  }

  init(socket, username) {
    this.socket = socket;
    this.username = username;
    
    // Listen for daily reward availability
    this.socket.on('daily-reward-available', (data) => {
      if (!this.hasShownToday) {
        this.showDailyRewardPopup(data);
        this.hasShownToday = true;
      }
    });

    // Check if already claimed today via session storage
    const today = new Date().toDateString();
    const lastShown = sessionStorage.getItem('dailyRewardShown');
    
    if (lastShown === today) {
      this.hasShownToday = true;
    }
  }

  showDailyRewardPopup(data) {
    const { streak, nextReward } = data;
    
    // Create popup HTML
    const popup = document.createElement('div');
    popup.id = 'daily-reward-popup';
    popup.innerHTML = `
      <div class="daily-reward-overlay">
        <div class="daily-reward-modal">
          <div class="daily-reward-header">
            <div class="daily-reward-icon">✨</div>
            <h2 class="daily-reward-title">Daily Check-In Reward!</h2>
            <p class="daily-reward-subtitle">Welcome back to Chifftown</p>
          </div>
          
          <div class="daily-reward-content">
            <div class="streak-counter">
              <div class="streak-number">${streak || 0}</div>
              <div class="streak-label">Day Streak</div>
            </div>
            
            <div class="reward-preview">
              <div class="reward-item">
                <span class="reward-icon">💰</span>
                <span class="reward-amount">${nextReward.coins}</span>
                <span class="reward-name">Coins</span>
              </div>
              <div class="reward-item">
                <span class="reward-icon">✨</span>
                <span class="reward-amount">${nextReward.stardust}</span>
                <span class="reward-name">Stardust</span>
              </div>
              <div class="reward-item">
                <span class="reward-icon">⭐</span>
                <span class="reward-amount">${nextReward.xp}</span>
                <span class="reward-name">XP</span>
              </div>
            </div>
            
            <div class="streak-info">
              ${streak > 0 ? `Keep your streak going! Come back tomorrow for Day ${(streak % 7) + 1} rewards.` : 'Start your daily streak today!'}
            </div>
          </div>
          
          <div class="daily-reward-actions">
            <button class="btn-claim-reward" onclick="dailyRewardSystem.claimReward()">
              <span class="btn-icon">🎁</span>
              Claim Reward
            </button>
            <button class="btn-close-popup" onclick="dailyRewardSystem.closePopup()">
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(popup);
    
    // Mark as shown today
    sessionStorage.setItem('dailyRewardShown', new Date().toDateString());
    
    // Add styles if not already present
    if (!document.getElementById('daily-reward-styles')) {
      this.injectStyles();
    }
    
    // Animate in
    setTimeout(() => {
      popup.querySelector('.daily-reward-modal').style.transform = 'scale(1)';
      popup.querySelector('.daily-reward-modal').style.opacity = '1';
    }, 10);
  }

  async claimReward() {
    try {
      const response = await fetch('/api/daily-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: this.username })
      });
      
      const result = await response.json();
      
      if (result.claimed) {
        this.showClaimSuccess(result.reward, result.streak);
      } else if (result.alreadyClaimed) {
        this.showAlreadyClaimed();
      }
    } catch (error) {
      console.error('Error claiming daily reward:', error);
      alert('Failed to claim reward. Please try again.');
    }
  }

  showClaimSuccess(reward, streak) {
    const modal = document.querySelector('.daily-reward-modal');
    
    modal.innerHTML = `
      <div class="daily-reward-header">
        <div class="daily-reward-icon success">🎉</div>
        <h2 class="daily-reward-title">Reward Claimed!</h2>
        <p class="daily-reward-subtitle">Day ${streak} Streak</p>
      </div>
      
      <div class="daily-reward-content">
        <div class="rewards-claimed">
          <div class="claimed-item">
            <span class="claimed-icon">💰</span>
            <span class="claimed-amount">+${reward.coins}</span>
            <span class="claimed-name">Coins</span>
          </div>
          <div class="claimed-item">
            <span class="claimed-icon">✨</span>
            <span class="claimed-amount">+${reward.stardust}</span>
            <span class="claimed-name">Stardust</span>
          </div>
          <div class="claimed-item">
            <span class="claimed-icon">⭐</span>
            <span class="claimed-amount">+${reward.xp}</span>
            <span class="claimed-name">XP</span>
          </div>
        </div>
        
        <p class="success-message">
          Come back tomorrow to continue your streak!
        </p>
      </div>
      
      <div class="daily-reward-actions">
        <button class="btn-claim-reward" onclick="dailyRewardSystem.closePopup()">
          Awesome!
        </button>
      </div>
    `;
  }

  showAlreadyClaimed() {
    alert('You\'ve already claimed your daily reward today. Come back tomorrow!');
    this.closePopup();
  }

  closePopup() {
    const popup = document.getElementById('daily-reward-popup');
    if (popup) {
      popup.querySelector('.daily-reward-modal').style.transform = 'scale(0.9)';
      popup.querySelector('.daily-reward-modal').style.opacity = '0';
      setTimeout(() => popup.remove(), 300);
    }
  }

  injectStyles() {
    const styles = document.createElement('style');
    styles.id = 'daily-reward-styles';
    styles.textContent = `
      .daily-reward-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 1rem;
      }

      .daily-reward-modal {
        background: linear-gradient(135deg, #1a1a3e 0%, #12122a 100%);
        border: 2px solid rgba(244, 197, 66, 0.3);
        border-radius: 20px;
        max-width: 500px;
        width: 100%;
        padding: 2rem;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5),
                    0 0 40px rgba(244, 197, 66, 0.1);
        transform: scale(0.9);
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .daily-reward-header {
        text-align: center;
        margin-bottom: 2rem;
      }

      .daily-reward-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
        animation: bounce 1s infinite;
      }

      .daily-reward-icon.success {
        animation: tada 1s;
      }

      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }

      @keyframes tada {
        0% { transform: scale(1) rotate(0deg); }
        10%, 20% { transform: scale(0.9) rotate(-3deg); }
        30%, 50%, 70%, 90% { transform: scale(1.1) rotate(3deg); }
        40%, 60%, 80% { transform: scale(1.1) rotate(-3deg); }
        100% { transform: scale(1) rotate(0deg); }
      }

      .daily-reward-title {
        font-family: 'Playfair Display', serif;
        font-size: 2rem;
        font-weight: 700;
        color: #f4c542;
        margin: 0 0 0.5rem 0;
      }

      .daily-reward-subtitle {
        font-family: 'Inter', sans-serif;
        font-size: 1rem;
        color: rgba(240, 238, 246, 0.65);
        margin: 0;
      }

      .daily-reward-content {
        margin-bottom: 2rem;
      }

      .streak-counter {
        text-align: center;
        margin-bottom: 2rem;
        padding: 1.5rem;
        background: rgba(244, 197, 66, 0.05);
        border: 1px solid rgba(244, 197, 66, 0.2);
        border-radius: 12px;
      }

      .streak-number {
        font-family: 'Playfair Display', serif;
        font-size: 3rem;
        font-weight: 700;
        color: #f4c542;
        line-height: 1;
      }

      .streak-label {
        font-size: 0.9rem;
        color: rgba(240, 238, 246, 0.65);
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-top: 0.5rem;
      }

      .reward-preview,
      .rewards-claimed {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .reward-item,
      .claimed-item {
        text-align: center;
        padding: 1rem;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        transition: all 0.2s ease;
      }

      .reward-item:hover,
      .claimed-item:hover {
        background: rgba(255, 255, 255, 0.05);
        transform: translateY(-2px);
      }

      .reward-icon,
      .claimed-icon {
        display: block;
        font-size: 2rem;
        margin-bottom: 0.5rem;
      }

      .reward-amount,
      .claimed-amount {
        display: block;
        font-family: 'Playfair Display', serif;
        font-size: 1.5rem;
        font-weight: 700;
        color: #f4c542;
        margin-bottom: 0.25rem;
      }

      .reward-name,
      .claimed-name {
        display: block;
        font-size: 0.75rem;
        color: rgba(240, 238, 246, 0.65);
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .streak-info,
      .success-message {
        text-align: center;
        font-size: 0.9rem;
        color: rgba(240, 238, 246, 0.65);
        line-height: 1.6;
        padding: 1rem;
        background: rgba(255, 255, 255, 0.02);
        border-radius: 8px;
      }

      .daily-reward-actions {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .btn-claim-reward {
        width: 100%;
        padding: 1rem 2rem;
        background: linear-gradient(135deg, #f4c542, #d4a942);
        border: none;
        border-radius: 12px;
        color: #0a0a1a;
        font-family: 'Inter', sans-serif;
        font-size: 1rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
      }

      .btn-claim-reward:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(244, 197, 66, 0.3);
      }

      .btn-claim-reward:active {
        transform: translateY(0);
      }

      .btn-icon {
        font-size: 1.2rem;
      }

      .btn-close-popup {
        width: 100%;
        padding: 0.75rem 2rem;
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        color: rgba(240, 238, 246, 0.65);
        font-family: 'Inter', sans-serif;
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .btn-close-popup:hover {
        background: rgba(255, 255, 255, 0.05);
        color: #f0eef6;
        border-color: rgba(255, 255, 255, 0.2);
      }

      @media (max-width: 600px) {
        .daily-reward-modal {
          padding: 1.5rem;
        }

        .daily-reward-title {
          font-size: 1.5rem;
        }

        .reward-preview,
        .rewards-claimed {
          grid-template-columns: 1fr;
        }
      }
    `;
    document.head.appendChild(styles);
  }
}

// Global instance
const dailyRewardSystem = new DailyRewardSystem();
