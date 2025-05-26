# Social Hub - Multi-Section Streaming Platform

A real-time streaming platform featuring multiple themed sections including Questing IRL (outdoor adventures) and Virtual Pub (social conversations). Built with Node.js, Socket.IO, and WebRTC for live video streaming and chat.

## Features

- **Multi-Section Platform**: Questing IRL and Virtual Pub themed areas
- **Live Video Streaming**: WebRTC-based peer-to-peer streaming
- **Real-time Chat**: Socket.IO powered messaging
- **Room Management**: Create and join streaming rooms
- **Responsive Design**: Works on desktop and mobile
- **User Management**: Handle broadcasters and participants

## Tech Stack

- **Backend**: Node.js, Express.js
- **Real-time Communication**: Socket.IO, WebRTC
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Styling**: Custom CSS with modern design

## Local Development

### Prerequisites
- Node.js (v16 or higher)
- npm (v8 or higher)

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd cvlog
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

## Deployment

### Environment Variables

Create a `.env` file based on `env.example`:

```bash
NODE_ENV=production
DOMAIN_URL=yourdomain.com
PORT=3000
```

### Deployment Options

#### Option 1: DigitalOcean Droplet

1. Create a DigitalOcean droplet with Node.js
2. Upload your code via Git or SCP
3. Install dependencies: `npm install --production`
4. Start with PM2: `pm2 start server.js --name "social-hub"`

#### Option 2: Railway

1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on push

#### Option 3: Render

1. Connect your GitHub repository to Render
2. Set build command: `npm install`
3. Set start command: `npm start`

### Domain Setup

1. Purchase a domain from a registrar (Namecheap, Cloudflare, etc.)
2. Point your domain to your hosting provider:
   - **A Record**: Point to your server's IP address
   - **CNAME**: Point to your hosting provider's URL
3. Update your `.env` file with your domain
4. Enable HTTPS (most hosting providers offer free SSL)

## File Structure

```
cvlog/
├── public/
│   ├── index.html          # Main homepage
│   ├── questing.html       # Questing IRL section
│   ├── pub.html           # Virtual Pub section
│   ├── stream.html        # Streaming interface
│   ├── styles.css         # Main styles
│   ├── app.js            # Main application logic
│   └── ...               # Other assets
├── server.js             # Express server
├── package.json          # Dependencies
└── README.md            # This file
```

## API Endpoints

- `GET /` - Main homepage
- `GET /questing` - Questing IRL section
- `GET /pub` - Virtual Pub section
- `GET /stream` - Streaming interface
- `GET /api/stats` - Platform statistics

## Socket Events

### Client to Server
- `join-room` - Join a streaming room
- `leave-room` - Leave a streaming room
- `chat-message` - Send chat message
- `webrtc-offer` - WebRTC offer
- `webrtc-answer` - WebRTC answer
- `ice-candidate` - ICE candidate

### Server to Client
- `room-joined` - Confirmation of room join
- `user-joined` - New user joined room
- `user-left` - User left room
- `chat-message` - Broadcast chat message
- `webrtc-offer` - Forward WebRTC offer
- `webrtc-answer` - Forward WebRTC answer
- `ice-candidate` - Forward ICE candidate

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support, please open an issue on GitHub or contact the development team.

---

**Live Demo**: [Your Domain Here]
**Documentation**: [Link to detailed docs]
**Issues**: [GitHub Issues Link] 