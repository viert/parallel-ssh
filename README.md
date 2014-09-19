parallel-ssh
============

node.js module for parallel command execution on multiple hosts via ssh

Usage
-----

```javascript
var Parallel = require('parallel-ssh');
var fs = require('fs');
var hosts, executer, command, intTimeout;

hosts = [ 'server1.example.com', 'server2.example.com' ];
command = "uptime";
executer = new Parallel(hosts, command, { username: 'user', privateKey: fs.readFileSync('/home/user/.ssh/id_rsa') });

intTimeout = setTimeout(function() { executer.interrupt(); });
executer.on("data", function(host, data) {
  console.log(host + ": " + data);
});

executer.exec(function(results) {
  console.log(results);
  clearTimeout(intTimeout);
});
```

API
---

**constructor**(hostList, command, options)
  inits the executer with hostlist, command and options. Options are merged objects of mscdex/ssh2 Connection options and connect method options objects. Additionally there is maxThreads option which limits the number of simultaneous connections.

**exec**(callback)
  executes the command on the list of hosts, then calls the callback with results which is an array of objects like `{ host: server1.example.com, code: 0 }` where `code` is the exit code of program executed
  
**interrupt**()
  stops everything. hosts which didn't finish job have an error: 'interrupted' in result.
