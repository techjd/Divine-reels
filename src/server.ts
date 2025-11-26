import { app, env } from './app';

// Entry point that starts the HTTP server.
const PORT = env.port;

app.listen(PORT, () => {
  console.log(`Divine Reels API running on port ${PORT}`);
});
