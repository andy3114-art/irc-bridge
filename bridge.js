const WebSocket = require('ws');
const net = require('net');

const wss = new WebSocket.Server({ port: process.env.PORT || 8080 });

wss.on('connection', (ws) => {
  const irc = net.connect(80, 'irc-1x04.vaughnsoft.net');
  ws.on('message', (data) => irc.write(data.toString()));
  irc.on('data', (data) => { if (ws.readyState === 1) ws.send(data.toString()); });
  ws.on('close', () => irc.destroy());
  irc.on('close', () => ws.close());
  irc.on('error', () => ws.close());
});

console.log('Bridge running');