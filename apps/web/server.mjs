import { createServer } from 'https';
import { readFileSync } from 'fs';
import { parse } from 'url';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3002', 10);

const httpsOptions = {
  key: readFileSync('../../certs/key.pem'),
  cert: readFileSync('../../certs/cert.pem'),
};

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, hostname, () => {
    console.log(`> HTTPS server ready on https://${hostname}:${port}`);
  });
});
