# 👥 Social Features Guide

## Neighbors Sidebar
The new **Neighbors Sidebar** provides a social hub for Chifftown citizens.

### How to Use
1.  **Toggle:** Click the "Group" icon button in the bottom-right corner.
2.  **My Circle:** View users you have interacted with.
    *   **Bar:** Shows progress toward the next friendship level.
    *   **Status:** See if they are online and which room they are in.
3.  **Online Now:** View a list of everyone currently online.
4.  **Join:** Click the "Join Room" button on a friend's card to teleport to them instantly.

### Friendship Levels
Points are earned by chatting, tipping, and hanging out in the same room.
- **Stranger:** 0-9 points
- **Acquaintance:** 10-29 points
- **Friend:** 30-59 points
- **Close Friend:** 60-99 points
- **Best Friend:** 100+ points

### Technical Details
- **Frontend:** `js/social-system.js` manages the UI and Socket.IO events.
- **Styles:** `css/social-sidebar.css` provides the glassmorphism theme.
- **Backend:** Integrated with existing `user-system.js` API endpoints.

**Status:** Live as of Feb 18, 2026.
