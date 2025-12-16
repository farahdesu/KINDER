const net = require('net');

function killPort(port) {
  const server = net.createServer();
  
  server.once('error', function (err) {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is in use. Attempting to kill...`);
      // Try to make a connection to the port
      const client = new net.Socket();
      client.connect(port, '127.0.0.1', function() {
        client.destroy();
      });
      client.on('error', function(err) {
        console.log(`Error connecting to port ${port}:`, err.message);
      });
    }
  });
  
  server.once('listening', function() {
    server.close();
    console.log(`Port ${port} is now available`);
  });
  
  server.listen(port);
}

killPort(3001);
