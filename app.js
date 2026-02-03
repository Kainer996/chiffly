class CVLogApp {
    constructor() {
        this.socket = null;
        this.localStream = null;
        this.peerConnections = new Map();
        this.currentUser = null;
        this.currentRoom = null;
        this.isStreamer = false;
        this.isCameraOn = false;
        this.isMicOn = false;
        // ICE servers for WebRTC (STUN + TURN)
        this.iceServers = [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ];
        
        this.init();
    }

    async init() {
        // Fetch TURN server credentials first
        await this.fetchTurnCredentials();
        this.setupSocketConnection();
        this.setupEventListeners();
        this.checkUrlParameters();
    }

    async fetchTurnCredentials() {
        try {
            const response = await fetch('/api/turn-credentials');
            const iceServers = await response.json();
            if (iceServers && iceServers.length > 0) {
                this.iceServers = iceServers;
                console.log('✅ TURN credentials loaded:', iceServers.length, 'servers');
            }
        } catch (error) {
            console.warn('⚠️ Could not fetch TURN credentials, using STUN only:', error);
        }
    }

    checkUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const roomId = urlParams.get('roomId');
        const username = urlParams.get('username');
        const isStreamer = urlParams.get('isStreamer') === 'true';

        if (roomId && username) {
            // Auto-fill and join
            document.getElementById('roomId').value = roomId;
            document.getElementById('username').value = username;
            document.getElementById('isStreamer').checked = isStreamer;
            
            // Auto-join after a short delay
            setTimeout(() => {
                this.joinRoom();
            }, 500);
        } else {
            this.showJoinModal();
        }
    }

    setupSocketConnection() {
        this.socket = io();
        
        this.socket.on('connect', () => {
            this.updateStatus('Connected', 'connected');
            console.log('Connected to server');
        });

        this.socket.on('disconnect', () => {
            this.updateStatus('Disconnected', 'disconnected');
            console.log('Disconnected from server');
        });

        this.socket.on('room-state', (data) => {
            this.handleRoomState(data);
        });

        this.socket.on('user-joined', (data) => {
            this.handleUserJoined(data);
        });

        this.socket.on('user-left', (data) => {
            this.handleUserLeft(data);
        });

        this.socket.on('chat-message', (message) => {
            this.displayChatMessage(message);
        });

        // WebRTC signaling
        this.socket.on('offer', (data) => {
            this.handleOffer(data);
        });

        this.socket.on('answer', (data) => {
            this.handleAnswer(data);
        });

        this.socket.on('ice-candidate', (data) => {
            this.handleIceCandidate(data);
        });
    }

    setupEventListeners() {
        // Join form
        document.getElementById('joinForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.joinRoom();
        });

        // Chat
        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChatMessage();
            }
        });

        document.getElementById('sendMessage').addEventListener('click', () => {
            this.sendChatMessage();
        });

        // Controls
        document.getElementById('toggleCamera').addEventListener('click', () => {
            this.toggleCamera();
        });

        document.getElementById('toggleMic').addEventListener('click', () => {
            this.toggleMicrophone();
        });

        document.getElementById('leaveRoom').addEventListener('click', () => {
            this.leaveRoom();
        });
    }

    showJoinModal() {
        document.getElementById('joinModal').style.display = 'flex';
        // Generate random room ID if empty
        const roomIdInput = document.getElementById('roomId');
        if (!roomIdInput.value) {
            roomIdInput.value = this.generateRoomId();
        }
    }

    hideJoinModal() {
        document.getElementById('joinModal').style.display = 'none';
    }

    generateRoomId() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    async joinRoom() {
        const username = document.getElementById('username').value.trim();
        const roomId = document.getElementById('roomId').value.trim();
        const isStreamer = document.getElementById('isStreamer').checked;

        if (!username || !roomId) {
            alert('Please enter both username and room ID');
            return;
        }

        this.currentUser = { username, roomId, isStreamer };
        this.currentRoom = roomId;
        this.isStreamer = isStreamer;

        try {
            // Get user media
            await this.setupLocalStream();
            
            // Join the room
            this.socket.emit('join-room', {
                roomId,
                username,
                isStreamer
            });

            this.hideJoinModal();
            this.updateStatus('Connected', 'connected');
            
        } catch (error) {
            console.error('Error joining room:', error);
            alert('Failed to access camera/microphone. Please check permissions.');
        }
    }

    async setupLocalStream() {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });

            this.isCameraOn = true;
            this.isMicOn = true;

            if (this.isStreamer) {
                // Show streamer video in main area
                const mainVideo = document.getElementById('mainVideo');
                mainVideo.srcObject = this.localStream;
                mainVideo.muted = true; // Prevent feedback
            } else {
                // Add participant video
                this.addParticipantVideo(this.socket.id, this.currentUser.username, this.localStream);
            }

            this.updateControlButtons();

        } catch (error) {
            console.error('Error accessing media devices:', error);
            throw error;
        }
    }

    handleRoomState(data) {
        const { streamer, participants, messages } = data;
        
        // Update streamer info
        if (streamer) {
            document.getElementById('streamerName').textContent = streamer.username;
        }

        // Update viewer count
        const viewerCount = participants.length + (streamer ? 1 : 0);
        document.getElementById('viewerCount').innerHTML = `<i class="fas fa-eye"></i> ${viewerCount} viewers`;
        document.getElementById('onlineCount').textContent = `${viewerCount} online`;

        // Display existing messages
        messages.forEach(message => {
            this.displayChatMessage(message);
        });

        // Setup WebRTC connections for existing participants
        participants.forEach(participant => {
            if (participant.id !== this.socket.id) {
                this.createPeerConnection(participant.id);
            }
        });
    }

    handleUserJoined(data) {
        const { userId, username, isStreamer } = data;
        
        if (isStreamer) {
            document.getElementById('streamerName').textContent = username;
        }

        // Update viewer count
        this.updateViewerCount();

        // Create peer connection for new user
        if (userId !== this.socket.id) {
            this.createPeerConnection(userId);
        }

        // Show join notification
        this.showNotification(`${username} joined the stream`);
    }

    handleUserLeft(data) {
        const { userId, username } = data;
        
        // Remove participant video
        this.removeParticipantVideo(userId);
        
        // Close peer connection
        if (this.peerConnections.has(userId)) {
            this.peerConnections.get(userId).close();
            this.peerConnections.delete(userId);
        }

        // Update viewer count
        this.updateViewerCount();

        // Show leave notification
        this.showNotification(`${username} left the stream`);
    }

    createPeerConnection(userId) {
        const peerConnection = new RTCPeerConnection({
            iceServers: this.iceServers
        });
        console.log('🔗 Creating peer connection with', this.iceServers.length, 'ICE servers');

        this.peerConnections.set(userId, peerConnection);

        // Add local stream to peer connection
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, this.localStream);
            });
        }

        // Handle remote stream
        peerConnection.ontrack = (event) => {
            const [remoteStream] = event.streams;
            this.addParticipantVideo(userId, `User ${userId.substring(0, 6)}`, remoteStream);
        };

        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.socket.emit('ice-candidate', {
                    target: userId,
                    candidate: event.candidate
                });
            }
        };

        // Create offer if this is the initiator
        if (this.socket.id < userId) {
            this.createOffer(userId, peerConnection);
        }

        return peerConnection;
    }

    async createOffer(userId, peerConnection) {
        try {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            
            this.socket.emit('offer', {
                target: userId,
                offer: offer
            });
        } catch (error) {
            console.error('Error creating offer:', error);
        }
    }

    async handleOffer(data) {
        const { offer, sender } = data;
        const peerConnection = this.peerConnections.get(sender) || this.createPeerConnection(sender);

        try {
            await peerConnection.setRemoteDescription(offer);
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            this.socket.emit('answer', {
                target: sender,
                answer: answer
            });
        } catch (error) {
            console.error('Error handling offer:', error);
        }
    }

    async handleAnswer(data) {
        const { answer, sender } = data;
        const peerConnection = this.peerConnections.get(sender);

        if (peerConnection) {
            try {
                await peerConnection.setRemoteDescription(answer);
            } catch (error) {
                console.error('Error handling answer:', error);
            }
        }
    }

    async handleIceCandidate(data) {
        const { candidate, sender } = data;
        const peerConnection = this.peerConnections.get(sender);

        if (peerConnection) {
            try {
                await peerConnection.addIceCandidate(candidate);
            } catch (error) {
                console.error('Error handling ICE candidate:', error);
            }
        }
    }

    addParticipantVideo(userId, username, stream) {
        const participantVideos = document.getElementById('participantVideos');
        
        // Remove existing video if any
        this.removeParticipantVideo(userId);

        const videoContainer = document.createElement('div');
        videoContainer.className = 'participant-video';
        videoContainer.id = `participant-${userId}`;

        const video = document.createElement('video');
        video.srcObject = stream;
        video.autoplay = true;
        video.muted = userId === this.socket.id; // Mute own video to prevent feedback
        video.playsinline = true;

        const nameLabel = document.createElement('div');
        nameLabel.className = 'participant-name';
        nameLabel.textContent = username;

        videoContainer.appendChild(video);
        videoContainer.appendChild(nameLabel);
        participantVideos.appendChild(videoContainer);
    }

    removeParticipantVideo(userId) {
        const videoElement = document.getElementById(`participant-${userId}`);
        if (videoElement) {
            videoElement.remove();
        }
    }

    sendChatMessage() {
        const chatInput = document.getElementById('chatInput');
        const message = chatInput.value.trim();

        if (message) {
            this.socket.emit('chat-message', { text: message });
            chatInput.value = '';
        }
    }

    displayChatMessage(message) {
        const chatMessages = document.getElementById('chatMessages');
        
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${message.isStreamer ? 'streamer' : ''}`;

        const timestamp = new Date(message.timestamp).toLocaleTimeString();

        messageElement.innerHTML = `
            <div class="chat-message-header">
                <span class="chat-username ${message.isStreamer ? 'streamer' : ''}">${message.username}</span>
                <span class="chat-timestamp">${timestamp}</span>
            </div>
            <div class="chat-text">${this.escapeHtml(message.text)}</div>
        `;

        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    toggleCamera() {
        if (this.localStream) {
            const videoTrack = this.localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                this.isCameraOn = videoTrack.enabled;
                this.updateControlButtons();
            }
        }
    }

    toggleMicrophone() {
        if (this.localStream) {
            const audioTrack = this.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                this.isMicOn = audioTrack.enabled;
                this.updateControlButtons();
            }
        }
    }

    updateControlButtons() {
        const cameraBtn = document.getElementById('toggleCamera');
        const micBtn = document.getElementById('toggleMic');

        cameraBtn.innerHTML = this.isCameraOn 
            ? '<i class="fas fa-video"></i> Camera' 
            : '<i class="fas fa-video-slash"></i> Camera';
        
        micBtn.innerHTML = this.isMicOn 
            ? '<i class="fas fa-microphone"></i> Mic' 
            : '<i class="fas fa-microphone-slash"></i> Mic';

        cameraBtn.className = this.isCameraOn ? 'btn btn-primary' : 'btn btn-danger';
        micBtn.className = this.isMicOn ? 'btn btn-primary' : 'btn btn-danger';
    }

    updateViewerCount() {
        // This would be updated from server data in a real implementation
        const participantCount = document.getElementById('participantVideos').children.length;
        const hasStreamer = document.getElementById('streamerName').textContent !== 'No Broadcaster';
        const totalCount = participantCount + (hasStreamer ? 1 : 0);
        
        document.getElementById('viewerCount').innerHTML = `<i class="fas fa-eye"></i> ${totalCount} viewers`;
        document.getElementById('onlineCount').textContent = `${totalCount} online`;
    }

    updateStatus(message, status) {
        const statusIndicator = document.getElementById('statusIndicator');
        statusIndicator.className = `status-indicator ${status}`;
        statusIndicator.querySelector('span').textContent = message;
    }

    showNotification(message) {
        // Create a simple notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 120px;
            right: 2rem;
            background: rgba(0, 212, 255, 0.9);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            z-index: 1001;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    leaveRoom() {
        // Stop local stream
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }

        // Close all peer connections
        this.peerConnections.forEach(pc => pc.close());
        this.peerConnections.clear();

        // Disconnect from socket
        if (this.socket) {
            this.socket.disconnect();
        }

        // Reset UI
        document.getElementById('mainVideo').srcObject = null;
        document.getElementById('participantVideos').innerHTML = '';
        document.getElementById('chatMessages').innerHTML = '';
        document.getElementById('streamerName').textContent = 'No Broadcaster';
        document.getElementById('viewerCount').innerHTML = '<i class="fas fa-eye"></i> 0 viewers';
        document.getElementById('onlineCount').textContent = '0 online';

        // Show join modal again
        this.showJoinModal();
        
        // Reconnect socket
        this.setupSocketConnection();
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CVLogApp();
}); 