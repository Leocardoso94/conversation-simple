require('dotenv').config({ silent: true });

const server = require('./app');

const port = process.env.PORT || process.env.VCAP_APP_PORT || 3001;

server.listen(port, () => {
  // eslint-disable-next-line
  console.log('Server running on port: %d', port);
});
