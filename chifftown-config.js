// Chifftown.com Deployment Configuration
module.exports = {
  // Production environment settings
  NODE_ENV: 'production',
  
  // Domain configuration
  DOMAIN_URL: 'chifftown.com',
  
  // Server configuration
  PORT: process.env.PORT || 3000,
  
  // CORS settings for production
  corsOptions: {
    origin: [
      'https://chifftown.com',
      'https://www.chifftown.com',
      'http://chifftown.com',
      'http://www.chifftown.com'
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
  
  // Socket.IO configuration
  socketOptions: {
    cors: {
      origin: [
        'https://chifftown.com',
        'https://www.chifftown.com',
        'http://chifftown.com',
        'http://www.chifftown.com'
      ],
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling']
  }
}; 