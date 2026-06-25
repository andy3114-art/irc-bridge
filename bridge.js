const WebSocket = require('ws');
const net = require('net');
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*'
  });
  res.end('IRC Bridge OK');
});

const wss = new WebSocket.Server({ 
  server,
  handleProtocols: (protocols) => {
    if (protocols.has('binary')) return 'binary';
    if (protocols.has('base64')) return 'base64';
    return false;
  }
});

wss.on('connection', (ws, req) => {
  console.log('Client connected from:', req.socket.remoteAddress);

  const irc = net.connect({ 
    host: 'irc-1x04.vaughnsoft.net', 
    port: 80,
    family: 4
  });

  irc.setEncoding('utf8');
  irc.setKeepAlive(true, 5000);
  irc.setTimeout(60000);

  let buffer = '';

  irc.on('connect', () => {
    console.log('IRC TCP connected');
  });

  irc.on('data', (data) => {
    buffer += data;
    const lines = buffer.split('\r\n');
    buffer = lines.pop();
    lines.forEach(line => {
      if (line) {
        console.log('FROM IRC:', line);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(line + '\r\n');
        }
      }
    });
  });

  ws.on('message', (data) => {
    const str = data.toString();
    str.split('\r\n').filter(Boolean).forEach(line => {
      console.log('TO IRC:', line);
      irc.write(line + '\r\n');
    });
  });

  irc.on('timeout', () => {
    console.log('IRC timeout - sending PING');
    irc.write('PING :keepalive\r\n');
  });

  irc.on('error', (e) => { console.error('IRC error:', e.message); ws.close(); });
  irc.on('close', () => { console.log('IRC closed'); ws.close(); });
  ws.on('error', (e) => { console.error('WS error:', e.message); irc.destroy(); });
  ws.on('close', () => { console.log('WS closed'); irc.destroy(); });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log('Bridge on port ' + PORT));
