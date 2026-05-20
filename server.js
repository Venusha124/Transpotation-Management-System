const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Attach Socket.IO to the same HTTP server
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Socket.IO connection handler
  io.on('connection', (socket) => {
    console.log(`Socket client connected: ${socket.id}`);

    // Join a specific trip room
    socket.on('join-trip', (tripId) => {
      socket.join(`trip-${tripId}`);
      console.log(`Socket ${socket.id} joined trip room: trip-${tripId}`);
    });

    // Handle telemetry streams from drivers
    socket.on('update-location', (data) => {
      // Expected payload: { tripId, currentLat, currentLng, speed, eta }
      if (data && data.tripId) {
        console.log(`GPS telemetry from driver on trip ${data.tripId}: lat=${data.currentLat}, lng=${data.currentLng}`);
        
        // Broadcast telemetry to everyone in the trip's room (e.g. dispatchers, customers)
        io.to(`trip-${data.tripId}`).emit('location-updated', {
          tripId: data.tripId,
          currentLat: data.currentLat,
          currentLng: data.currentLng,
          speed: data.speed || 0,
          eta: data.eta || "calculating..."
        });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket client disconnected: ${socket.id}`);
    });
  });

  httpServer.listen(port, () => {
    console.log(`> TMS system initialized. Server listening at http://${hostname}:${port}`);
  });
}).catch((err) => {
  console.error('Error starting custom Next.js + Socket.IO server:', err);
  process.exit(1);
});
