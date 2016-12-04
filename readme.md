# Wsocket.io Server

This is a server-side wrapper for the ws NPM module. It makes it a lot easier to use WebSockets with Node JS by providing a simple to use API. Take a look at [wsocket.io-client](https://github.com/danielkov/wsocket.io-client) or [wsocket.io](https://github.com/danielkov/wsocket.io) for a full integration example.

## Dependencies
Because this is a wrapper for [ws](https://github.com/websockets/ws) it depends on ws.

## Supported methods

### API

### `.constructor([opts: Object])`
Sends the `opts` object into the original ws Server constructor. Defaults to `{port: 8080}`. Example usage:

```js
const WSS = require('wsocket.io-server');

wss = new WSS({port: 4200});
```

For more options refer to the original ws GitHub page or the NPM page.

### `.connect([fn: function <callback>])`
The callback handles each separate incoming connection. It receives a single Socket object (read below). Example usage:

```js
wss.connect( ws => {
  // ws will be the Socket class that gets instantiated by the constructor call on the .connect() method.
})
```

### `.send([name: String], [data: Object])`
Sends the data in the form of a stringified object to each open connection. Example usage:

```js
wss.send('message:all', {message: 'hello everyone'});
```

### `.sendTo([id: String], [name: String], [data: Object])`
Sends the data to the socket with the id provided in the first parameter. Can be used to communicate between specific sockets or socket-specific server messages. Example usage:

```js
wss.connect( ws => {
  ws.on('message', data => {
    wss.sendTo(ws._id, 'reply', {message: 'Thanks for the data.'});
    // ... is equivalent to ...
    ws.send('reply', {message: 'Thanks for the data.'});
  })
})
```

### `.sendExclude([id: String], [name: String], [data: Object])`
Sends the data to all the sockets excluding the one with the id in the first parameter. This is the underlying method of `Socket.broadcast()`. Example usage:

```js
wss.connect( ws => {
  ws.sendExclude(ws._id, 'user:join', {message: 'User joined the channel.'});
  // ... is equivalent to ...
  ws.broadcast('user:join', {message: 'User joined the channel.'});
})
```

While this method exists to expose the method which `Socket.broadcast()` uses, it may find some use cases in some applications, hence why I decided to expose it.

### `.close()`
Closes the server. Example usage:

```js
wss.connect( ws => {
  ws.on('hello', data => {
    if (data.sender === 'Homer') {
      wss.close();
      // Closed all connections and the open socket.
    }
  })
})
```


### Socket

### `.constructor([ws: WebSocket], [id: String], [handler: Object <Server>])`
Creates a new Socket object and assigns an id, which is stored in `Server._sockets` object by id. This gets called automatically each time a new client connects. Note the id can be useful to access other sockets. You can access it via `Socket._id`.

### `.on([name: String], [fn: function <callback>])`
Handles incoming messages matching the name provided in the first parameter. This method supports subscription to multiple events via space-separated names. The callback to execute can be an anonymous or named function, an array of functions or multiple functions as well. Example usage:

```js
ws.on('message login', data => {console.log('User interacted.')}, data => {
  console.log(data);
})
.on('message', data => {
  console.log(`New message: ${data.message}`);
})
```

This method returns `this`, for easy chaining.

### `.send([name: String], [data: Object])`
Sends a message to the socket in the form of a stringified object. Example usage:

```js
ws.send('welcome', {message: `Welcome on our server, dear socket with id: ${ws._id}`});
```

This method returns `this`, for easy chaining.

### `.broadcast([name: String], [data: Object])`
Sends a message to all sockets but the current one, using the server's `sendExclude()` method.

```js
ws.broadcast('userloggedin', {message: `A user with the id: ${ws._id} has logged in.`})
.send('message', {message: 'All user had been notified of your presence.'}) // Note the chaining.
```

This method returns `this`, for easy chaining.

### `.all([fn: Function])`
Subscribes to every message received via websocket. The callback function is different from the rest, because it receives 2 parameters, the name and the data. This helps distinguish the message type, if a custom form of handling is required for a set of events. This method can accept multiple functions as an argument, in which case each of the functions is going to be executed in order. Example usage:

```js
ws.all((name, data) => {
  if (name.startsWith('message')) {
    console.log(`We received a new message: ${data}`);
  }
  else {
    console.log(`We received an unknown WebSocket message: ${data}`);
  }
})
```

You can use this to add middleware for logging all WebSocket requests.

This method returns `this`, for easy chaining.

### `.off([name: String])`
Removes all event handlers associated with the name provided in the parameters. This functions supports removing events from multiple listeners. Example usage:

```js
ws.off('message userloggedin'); // Unsubscribes all messages with the names: 'message' and 'userloggedin'.
```

This method returns `this`, for easy chaining.

### `.offAll()`
Removes all event listeners from the WebSocket connection. Example usage:

```js
ws.offAll(); // Stops listening to events without closing the connection.
```

This method returns `this`, for easy chaining.

### `.close()`
Removes socket from the handled sockets. Triggered automatically when socket closes on the client side. When called, it closes connection with the client. Example usage:

```js
wss.connect( ws => {
  ws.close(); // Haha I never wanted a WebSocket connection with you anyway.
})
```

This method returns `this`, for easy chaining.
