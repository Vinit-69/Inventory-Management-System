const http = require('http');
const fs = require('fs');
const path = require('path');
const querystring = require('querystring');

const PORT = 8080;
const sessions = {};

const serveFile = (filePath, contentType, res) => {
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + err.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
};

const generateSessionId = () => {
    return Math.random().toString(36).substring(2, 15);
};

const server = http.createServer((req, res) => {
    if (req.method === 'GET') {
        if (req.url === '/auth-status') {
            const sessionId = req.headers.cookie?.split('=')[1];
            if (sessionId && sessions[sessionId]) {
                const username = sessions[sessionId].username;
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ isLoggedIn: true, username }));
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ isLoggedIn: false }));
            }
        } else if (req.url === '/view-users') {
            fs.readFile(path.join(__dirname, 'users.json'), 'utf-8', (err, data) => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Error reading user data');
                    return;
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(data);
            });
        } else {
            let filePath = path.join(__dirname, req.url === '/' ? 'main.html' : req.url);
            const ext = path.extname(filePath);
            let contentType = 'text/html';

            switch (ext) {
                case '.css':
                    contentType = 'text/css';
                    filePath = path.join(__dirname, 'public', path.basename(filePath));
                    break;
                case '.js':
                    contentType = 'application/javascript';
                    filePath = path.join(__dirname, 'public', path.basename(filePath));
                    break;
            }

            serveFile(filePath, contentType, res);
        }
    } else if (req.method === 'POST') {
        if (req.url === '/register') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });

            req.on('end', () => {
                const { username, email, password, confirmPassword } = querystring.parse(body);

                if (password !== confirmPassword) {
                    res.writeHead(400, { 'Content-Type': 'text/plain' });
                    res.end('Passwords do not match');
                    return;
                }

                fs.readFile(path.join(__dirname, 'users.json'), 'utf-8', (err, data) => {
                    let users = [];
                    if (!err) {
                        users = JSON.parse(data);
                    }

                    const userExists = users.find(user => user.email === email);
                    if (userExists) {
                        res.writeHead(400, { 'Content-Type': 'text/plain' });
                        res.end('User already exists');
                        return;
                    }

                    users.push({ username, email, password });

                    fs.writeFile(path.join(__dirname, 'users.json'), JSON.stringify(users, null, 2), (err) => {
                        if (err) {
                            res.writeHead(500, { 'Content-Type': 'text/plain' });
                            res.end('Error saving user data');
                            return;
                        }

                        res.writeHead(302, { 'Location': '/loginPage.html' });
                        res.end();
                    });
                });
            });
        } else if (req.url === '/login') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });

            req.on('end', () => {
                const { username, password } = querystring.parse(body);

                fs.readFile(path.join(__dirname, 'users.json'), 'utf-8', (err, data) => {
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end('Error reading user data');
                        return;
                    }

                    const users = JSON.parse(data);
                    const user = users.find(user => user.username === username && user.password === password);

                    if (user) {
                        const sessionId = generateSessionId();
                        sessions[sessionId] = { username: user.username };
                        res.writeHead(302, {
                            'Set-Cookie': `sessionId=${sessionId}; Path=/`,
                            'Location': '/'
                        });
                        res.end();
                    } else {
                        res.writeHead(400, { 'Content-Type': 'text/plain' });
                        res.end('Invalid username or password');
                    }
                });
            });
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
        }
    }
});

server.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
