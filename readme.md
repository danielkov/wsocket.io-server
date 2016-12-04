# Wsocket.io Server

This is a server-side wrapper for the ws NPM module. It makes it a lot easier to use WebSockets with Node JS by providing a simple to use API. Take a look at [https://github.com/danielkov/wsocket.io-client](wsocket.io-client) or [https://github.com/danielkov/wsocket.io](wsocket.io) for a full integration example.

## Supported methods

### API

### `.constructor([opts: Object])`
Sends the `opts` object into the original ws Server constructor. Defaults to `{port: 8080}`.

### `.connect([fn: function <callback>])`
The callback handles each separate incoming connection. It receives a single Socket object (read below).

### `.send([name: String], [data: Object])`
Sends the data in the form of a stringified object to each open connection.

### `.sendTo([id: String], [name: String], [data: Object])`
Sends the data to the socket with the id provided in the first parameter.

### `.sendExclude([id: String], [name: String], [data: Object])`
Sends the data to all the sockets excluding the one with the id in the first parameter. This is the underlying method of `Socket.broadcast()`.

### `.close()`
Closes the server.


### Socket

### `.constructor([ws: WebSocket], [id: String], [handler: Object <Server>])`
Creates a new Socket object and assigns an id, which is stored in `Server._sockets` object by id.

### `.on([name: String], [fn: function <callback>])`
Handles incoming messages matching the name provided in the first parameter.

### `.send([name: String], [data: Object])`
Sends a message to the socket in the form of a stringified object.

### `.broadcast()`
Sends a message to all sockets but the current one, using the server's `sendExclude()` method.

### `.off()`
Removes socket from the handled sockets. Triggered automatically when socket closes on the client side
