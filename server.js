const express = require("express");
const path = require("path");

const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);

app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "public"));
app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");

app.use("/", (req, res) => {
  res.render("index.html");
});

let messages = [];
let users = [{username: 'Alisha [BOT]', userIcon: '🤖', socketId: '0'}];

io.on("connection", socket => {
  console.log(`Socket conectado: ${socket.id}`);

  socket.emit("previousMessages", messages);
  socket.emit("users", users);
  
  socket.on("sendMessage", data => {
    console.log(data);
    messages.push(data);

    let userExists = false;
    for(let i = 0; i < users.length; i++) {
        if (users[i].username == data.author) {
            userExists = true;
            break;
        }
    }

    if(userExists === false){
      users.push({username: data.author, userIcon: data.userIcon, socketId: socket.id});
    }

    io.emit("users", users);
    socket.broadcast.emit("receivedMessage", data);
  });

  socket.on('disconnect', data => {
    console.log('############### ', users);
    if (data === 'transport close') {
      
      let userOffline;
      users.forEach((user) => {
        if (user.socketId === socket.id) {
          userOffline = user;
        }
      });

      users = users.filter(item => item.socketId !== socket.id)

      if(userOffline){
        io.emit("receivedMessage", {
          author: users[0].username,
          message: `${userOffline.username} saiu 🙁`,
          userIcon: users[0].userIcon,
          ip: '000.000.000.000'
        });
      }

      io.emit("users", users);
    }
});
});

const PORT = process.env.PORT || 3000;
server.listen(PORT);
console.log("Server running on port: ", PORT);
