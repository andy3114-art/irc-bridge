const WebSocket = require('ws');
const net = require('net');
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('IRC Bridge running');
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('Client connected');

  const irc = net.connect(80, 'irc-1x04.vaughnsoft.net', () => {
    console.log('Connected to Vaughn IRC');
  });

  ws.on('message', (data) => irc.write(data.toString()));
  irc.on('data', (data) => { if (ws.readyState === 1) ws.send(data.toString()); });
  ws.on('close', () => irc.destroy());
  irc.on('close', () => ws.close());
  irc.on('error', (e) => { console.error(e.message); ws.close(); });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log('Bridge on port ' + PORT));
