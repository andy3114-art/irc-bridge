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
    console.log('Connected to Vaughn IRC server');
    irc.setKeepAlive(true, 10000);
  });

  irc.setEncoding('utf8');
  let lineBuffer = '';

  ws.on('message', (data) => {
    const str = data.toString();
    console.log('TO IRC:', str.trim());
    irc.write(str);
  });

  irc.on('data', (data) => {
    console.log('RAW FROM IRC:', JSON.stringify(data));
    lineBuffer += data;
    const lines = lineBuffer.split('\r\n');
    lineBuffer = lines.pop();
    lines.forEach(line => {
      if (line) {
        console.log('FROM IRC:', line);
        if (ws.readyState === 1) ws.send(line + '\r\n');
      }
    });
  });

  irc.on('connect', () => console.log('TCP connect fired'));
  irc.on('ready', () => console.log('TCP ready fired'));

  ws.on('close', () => { console.log('WS closed'); irc.destroy(); });
  ws.on('error', (e) => { console.error('WS error:', e.message); irc.destroy(); });
  irc.on('close', (hadError) => { console.log('IRC closed, hadError:', hadError); ws.close(); });
  irc.on('error', (e) => { console.error('IRC error:', e.message); ws.close(); });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log('Bridge on port ' + PORT));
