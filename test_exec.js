var Parallel = require('./index');
var hosts = ['filestore5d.narod.yandex.net'];

var executer = new Parallel(hosts, 'uptime', { username: 'root', privateKey: require('fs').readFileSync('/Users/viert/.ssh/id_rsa') });
var _timeout = setTimeout(function() { executer.interrupt(); }, 5000);

executer.on("data", function(host, data) {
    data = data.toString();
    data = data.replace(/^/g, host + ": ");
    console.log(data);
});
executer.exec(function(results) {
    console.log(results);
    clearTimeout(_timeout);
});

