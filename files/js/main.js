const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');

// Ná í notendanafn og link á spjallherbergi
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const socket = io();

// Join-a spjallherbergi
socket.emit('joinRoom', { username, room });

// sækja spjallherbergi og notendur
socket.on('roomUsers', ({ room, users }) => {
  outputRoomName(room);
  outputUsers(users);
});

socket.on('innskráðir breyttust', (innskráðir) => {
  document.getElementById('innskráðir_notendur').textContent = innskráðir;
});

// Skilaboð frá servernum
socket.on('message', (message) => {
  outputMessage(message);

  // Skrunar skilaboð
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Senda skilaboðin
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();

  // sækir innihald skilaboðanna
  let msg = e.target.elements.msg.value;

  msg = msg.trim();

  if (!msg) {
    return false;
  }

  // Emittar skilaboðunum á serverinn
  socket.emit('chatMessage', msg);

  // hreinsar input reitinn okkar eftir að skilaboðin hafa verið send út.
  e.target.elements.msg.value = '';
  e.target.elements.msg.focus();
});

// Svona viljum við sjá skilaboðin birtast notendum.
function outputMessage(message) {
  const div = document.createElement('div');
  div.classList.add('message');
  const p = document.createElement('p');
  p.classList.add('meta');
  p.innerText = message.username;
  p.innerHTML += `<span>${message.time}</span>`;
  div.appendChild(p);
  const para = document.createElement('p');
  para.classList.add('text');
  para.innerText = message.text;
  div.appendChild(para);
  document.querySelector('.chat-messages').appendChild(div);
}

// lætur notendur vita í hvaða spjallherbergi þeir eru inni í.
function outputRoomName(room) {
  roomName.innerText = room;
}

// Bætir notendum við í lista.
function outputUsers(users) {
  userList.innerHTML = '';
  users.forEach((user) => {
    const li = document.createElement('li');
    li.innerText = user.username;
    userList.appendChild(li);
  });
}

//Spyr notanda hvort hann sé viss um að vilja yfirgefa spjallið
document.getElementById('leave-btn').addEventListener('click', () => {
  const leaveRoom = confirm('Ertu viss um að þú viljir yfirgefa þetta æðislega spjall?');
  if (leaveRoom) {
    window.location = '../password.html';
  } else {
  }
});
