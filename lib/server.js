const WebSocketServer = require('ws').Server;

const genId = require('./utils').genId;
const isFunction = require('./utils').isFunction;
const sortArgsIntoArray = require('./utils').sortArgsIntoArray;

module.exports = class Server {
  constructor(opts) {
    let _opts = opts || {port:8080};
    this.socket = new WebSocketServer(_opts);
    this._sockets = {};
    this.connections = 0;
  }
  connect (fn) {
    this.socket.on('connection', (ws) => {
      this.connections += 1;
      let socketId = genId();
      let newSocket = new Socket(ws, socketId, this);
      this._sockets[socketId] = newSocket;
      fn(newSocket);
    })
  }
  send (name, data) {
    for (let socket in this._sockets) {
      if (this._sockets.hasOwnProperty(socket)) {
       this._sockets[socket].send(name, data);
      }
    }
  }
  sendTo(id, name, data) {
    if (this._sockets.hasOwnProperty(id)) {
      this._sockets[id].send(name, data)
    }
  }
  sendExclude (id, name, data) {
    for (let socket in this._sockets) {
      if (this._sockets.hasOwnProperty(socket) && socket !== id) {
        this._sockets[socket].send(name, data);
      }
    }
  }
  closeSocket (id) {
    if (this._sockets[id]) {
      delete this._sockets[id];
      this.connections -= 1;
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
    this.allHandlers = [];
    this.socket = ws;
    this._id = id;
    this.socket.on('message', (data) => {
      let d = JSON.parse(data);
      let messageName = d.name;
      this.executeHandler(messageName, d.data);
      if (this.allHandlers.length > 0) {
        for (let i = 0; i < this.allHandlers.length; i++) {
          this.allHandlers[i](d.name, d.data)
        }
      }
    })
    this.socket.on('close', () => {
      this.close();
    })
  }
  executeHandler (name, data) {
    if (this.handleFunctions[name] && Array.isArray(this.handleFunctions[name])) {
      for (let i = 0; i < this.handleFunctions[name].length; i++) {
        if (typeof this.handleFunctions[name][i] === 'function') {
          this.handleFunctions[name][i](data);
        }else {
          // throw new Error(errors.notfunc); TODO: implement errors??? @danielkov
        }
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
    return this;
  }
  send (name, data) {
    this.socket.send(JSON.stringify({name:name, data:data}));
    return this;
  }
  broadcast (name, data) {
    this._handler.sendExclude(this._id, name, data);
    return this;
  }
  off (name) {
    let _names = name.split(' ');
    if (_names.length > 1) {
      for (let i = _names.length; i > 0; i--) {
        this.handleFunctions[_names[i]] = null;
      }
    }
    else {
      this.handleFunctions[name] = null;
    }
    return this;
  }
  ofAll () {
    this.handleFunctions = {};
    this.allHandlers = [];
    return this;
  }
  all (...fns) {
    this.allHandlers = this.allHandlers.concat(fns)
    return this;
  }
  close () {
    this._handler.closeSocket(this._id);
    this.executeHandler('close', {id: this._id});
    return this;
  }
  subscribeToEvent (name, fn) {
    if (this.handleFunctions[name]) {
      this.handleFunctions[name] = this.handleFunctions[name].concat(fn);
    }
    else {
      this.handleFunctions[name] = fn;
    }
  }
}
