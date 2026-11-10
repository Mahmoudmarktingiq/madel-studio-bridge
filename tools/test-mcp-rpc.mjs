import { spawn } from 'child_process';

const child = spawn('node', ['D:\\MCP\\01-Projects\\Installed\\Adobe-Bridge\\stable-candidate\\dist\\index.js'], {
  env: {
    ...process.env,
    BRAINFERNO_MCP_ALLOW_RAW_SCRIPTS: '0',
    BRAINFERNO_MCP_BRIDGE_INSECURE: '0'
  }
});

let buffer = '';

child.stdout.on('data', (d) => {
  buffer += d.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop(); // keep remainder
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const msg = JSON.parse(line);
      handleMessage(msg);
    } catch (e) {
      console.log('RAW STDOUT:', line);
    }
  }
});

child.stderr.on('data', (d) => {
  console.log('STDERR:', d.toString().trim());
});

function send(req) {
  child.stdin.write(JSON.stringify(req) + '\n');
}

function handleMessage(msg) {
  console.log(`\n[RECV ID ${msg.id}]:`);
  if (msg.id === 1) {
    console.log('Initialize success! Server:', msg.result.serverInfo);
    // Send initialized notification
    send({ jsonrpc: '2.0', method: 'notifications/initialized' });
    // Call cc_connected_apps
    console.log('Calling cc_connected_apps...');
    send({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'cc_connected_apps',
        arguments: {}
      }
    });
  } else if (msg.id === 2) {
    console.log('cc_connected_apps response:', JSON.stringify(msg.result, null, 2));
    setTimeout(() => {
      child.kill();
      process.exit(0);
    }, 500);
  }
}

// Start handshake
send({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'acceptance-verifier', version: '1.0' }
  }
});
