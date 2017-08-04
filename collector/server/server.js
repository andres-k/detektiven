const http = require('http');
const { StringDecoder } = require('string_decoder');
const decoder = new StringDecoder('ascii');


function dummy(a,u,b) {
  console.dir(a);
  console.dir(u);
  console.dir(b.split('\n'));
}

function flicsv(api,user,body) {
  var bites = api.split('?')
  var url = bites[0]
  var urlparams = bites.length > 1 ? bites[1] : '';
  var params = urlparams.split('&');
  var meta = {}
  params.forEach(function(param){
      var kv = param.split('=');
      meta[kv[0]] = kv[1] || true;
  })
  console.dir(meta)

}

var routes = {
                  '/api/v0/fli/csv': {
                      'POST': flicsv
                  },
                  '/api/v0/fli/meta': {
                      'POST': dummy,
                      'GET': dummy,
                      'PUT': dummy
                  }
              }

server = http.createServer( function(req, res) {
    var remoteAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    var userAgent = req.headers['user-agent'] || 'undefined';
    var authorization = req.headers['authorization'] || remoteAddress + userAgent ;
    console.log('Request started',remoteAddress,req.method,req.url,userAgent);
    var bites = req.url.split('?')
    var url = bites[0]
    var urlparams = bites.length > 1 ? bites[1] : '';

    if ( ! (routes[url] && routes[url][req.method] && routes[url][req.method] instanceof Function)){
        console.error('not implemented',remoteAddress,req.method,url,userAgent);
        res.writeHead(501);
        res.end('Not Implemented');
        return
    }
    var body = '';
    var total = 0;
    req.on('data', function (data) {
        total += data.length;
        if (total > 268393408)  {
          console.error('Request Entity Too Large',remoteAddress,req.method,req.url,userAgent,total);
          res.writeHead(413);
          res.end('Request Entity Too Large');
          req.destroy();
        } else {
          body += decoder.write(data);
        }
    });
    req.on('end', function () {
        res.writeHead(202);
        res.end('Accepted');
        console.log('Request Accepted',remoteAddress,req.method,req.url,userAgent,total);
        body += decoder.end();
        routes[url][req.method](req.url, authorization, body);
    });
});

port = 3000;
host = '127.0.0.1';
server.listen(port, host);
console.log('server started ' + host + ':' + port);
