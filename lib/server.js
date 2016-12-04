const WebSocketServer = require('ws').Server;

const genId = require('./utils').genId;
const isFunction = require('./utils').isFunction;
const sortArgsIntoArray = require('./utils').sortArgsIntoArray;

module.exports = class Server {
  constructor(opts) {
    let _opts = opts || {port:8080};
    this.socket = new WebSocketServer(_opts);
    this._sockets = {};
  }
  connect (fn) {
    this.socket.on('connection', (ws) => {
      let socketId = genId();
      let newSocket = new Socket(ws, socketId, this);
      this._sockets[socketId] = newSocket;
      fn(newSocket);
    })
  }
  send (name, data) {
    for (socket of this._sockets) {
      socket.send(JSON.stringify({name:name, data:data}));
    }
  }
  sendTo(id, name, data) {
    if (this._sockets.hasOwnProperty(id)) {
      this._sockets[id].send(name, data)
    }
  }
  sendExclude (id, name, data) {
    for (socket of this._sockets) {
      if (socket._id !== id) {
        socket.send(JSON.stringify({name:name, data:data}));
      }
    }
  }
  closeSocket (id) {
    if (this._sockets[id]) {
      this._sockets[id] = null;
    }
  }
  close () {
    this.socket.close();
  }
}

class Socket {
  constructor (ws, id, handler) {
    this._handler = handler;
    this.handleFunctions = {};
    this.socket = ws;
    this._id = id;
    this.socket.on('message', (data) => {
      let d = JSON.parse(data);
      let messageName = d.name;
      this.executeHandler(messageName, data);
    })
    this.socket.on('close', () => {
      this.off();
    })
  }
  executeHandler (name, data) {
    if (this.handleFunctions[name]) {
      for (let i = 0; i < this.handleFunctions[name].length; i++) {
        this.handleFunctions[name][i](data);
      }
    }
  }
  on (name, fn, ...fns) {
    let _names = name.split(' ');
    let _fns = sortArgsIntoArray(fn, fns);
    if (_names.length > 1) {
      for (let i = _names.length; i > 0; i--) {
        this.subscribeToEvent(_names[i], _fns);
      }
    }
    else {
      this.subscribeToEvent(name, _fns);
    }
  }
  send (name, data) {
    this.socket.send(JSON.stringify({name:name, data:data}));
  }
  broadcast (name, data) {
    this._handler.sendExclude(this._id, name, data)
  }
  off () {
    this.executeHandler('close', {id: this._id});
    this._handler.closeSocket(this._id);
    return;
  }
  subscribeToEvent (name, fn) {
    if (this.handleFunctions[name]) {
      this.handleFunctions[name].concat(fn);
    }
    else {
      this.handleFunctions[name] = fn;
    }
  }
}

]