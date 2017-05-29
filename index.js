process.chdir(__dirname);

require('babel-register');
require('babel-polyfill');
require('./app.js');
