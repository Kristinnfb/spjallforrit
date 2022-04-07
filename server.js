const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const bodyParser = require('body-parser');
const {getRoomUsers, userLeave, getCurrentUser, userJoin} = require("./utils/users");
const app = express();
const server = http.createServer(app);
const io = socketio(server);
const session = require('express-session')

mainPassword = "password"
roomPassword = "ybekkur"

app.use(bodyParser.json());
app.use(session({
  saveUninitialized:true,
  resave: false,
  secret: "SET THIS TO SOMETHING RANDOM",
}));

app.get("/", (req, res) => { // Þegar notandi mætir á svæðið er honum vísað hingað.  
  res.sendFile(path.join(__dirname, "/files/password.html"))
})
app.post("/password", (req, res) => {
  if(mainPassword === req.body.mainPassword) { // nær lykilorð sem notandi slær inn.
    req.session.mainPassword = mainPassword // ef það lykilorð passar við rétta lykilorðið er notandi sendur áfram annars fær hann skilaboð um að hann hafi slegið inn rangt lykilorð.
    res.status(200)
  } else
    res.status(401)
  res.end()
})
app.post("/roomPassword", ((req, res) => { // sama og fyrir ofan nema önnur staðsetning og vegna lykilorðs í leyniherbergið
  if(roomPassword === req.body.roomPassword) {
    req.session.roomPassword = roomPassword
    res.status(200)
  } else
    res.status(401)
  res.end()
}))
app.get("/chat", (req, res) => { // ef lykilorð stemma þá fær notandi að fara í næsta skref.
  if(req.session.mainPassword === mainPassword) {
    if((req.session.roomPassword === roomPassword && req.query.room === "Leynispjallið") || req.query.room === "Almennt spjall")
      res.sendFile(path.join(__dirname, "/files/chat.html"))
    else
      res.redirect("/login") // ef lykilorð er rangt á leyniherbergi fer hann aftur á logi n síðuna.
  } else res.redirect("/") // ef lykilorð er rangt inn  á login sínu fer hann á byrjunarsíðuna.
})
app.get("/login", (req, res) => {
  if(req.session.mainPassword  === mainPassword)
    res.sendFile(path.join(__dirname, "/files/index.html"))
  else
    res.redirect("/")
})
app.use(express.static(path.join(__dirname, 'files')));
const admin = 'Skilaboð að handan:';
innskráðir = 0;


io.on('connection', socket => {
  socket.on('joinRoom', ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    // Bjóða nýja notendur velkomna
    socket.emit('message', formatMessage(admin, 'Velkomin/n í spjallið'));

    // Hækkum fjölda innskráðra
    innskráðir++;
    // Látum aðra notendur vita að fjöldi innskráðra hefur breyst
    io.emit('innskráðir breyttust', innskráðir);


    // láta aðra notendur vita þegar nýr notandi mætir í spjallið
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        formatMessage(admin, `${user.username} hefur heiðrað okkur með nærveru sinni`)
      );

    // sendir upplýsingar um notendur og spjallherbergi
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    });
  });

  // hlustar eftir skilaboðum.
  socket.on('chatMessage', msg => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit('message', formatMessage(user.username, msg));
  });

  // lætur vita þegar notandi yfirgefur svæðið
  socket.on('disconnect', () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        'message',
        formatMessage(admin, `${user.username} hefur yfirgefið spjallið`)
      );

    // Hækkum fjölda innskráðra
    innskráðir--;
    // Látum aðra notendur vita að fjöldi innskráðra hefur breyst
    io.emit('innskráðir breyttust', innskráðir);


      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
