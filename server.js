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

  // Envia ao novo usuário conectado todas as mensagens anteriores e a lista de usuários online.
  socket.emit("previousMessages", messages);
  socket.emit("users", users);
  
  // Quando esse usuário conectado enviar uma mensagem
  socket.on("sendMessage", async data => {
    // Salva a mensagem
    messages.push(data);

    // Verifica se esse usuário existe na lista de usuários online e adiciona e tals
    userVerify(data, socket);

    // Envia a mensagem desse novo usuário para os demais usuários online.
    socket.broadcast.emit("receivedMessage", data);
  });

    // Se esse usuário se desconectar
    socket.on('disconnect', data => {

      if (data === 'transport close') {
        // Pega o usuário da lista de usuários online.
        let userOffline;
        users.forEach((user) => {
          if (user.socketId === socket.id) {
            userOffline = user;
          }
        });

        // Atualiza lista de usuários online.
        users = users.filter(item => item.socketId !== socket.id)

        // O BOT irá disparar uma mensagem para todos dizendo que fulano saiu.
        if(userOffline){
          io.emit("receivedMessage", {
            author: users[0].username,
            message: `${userOffline.username} saiu 🙁`,
            userIcon: users[0].userIcon,
            ip: '000.000.000.000'
          });
        }

        // Envia a nova lista de usuários online para todos.
        io.emit("users", users);
      }
  });
});

const userVerify = async (data, socket) => {
  // Verifica se esse usuário já existe na lista de usuários online.
  let userExists = false;
  for(let i = 0; i < users.length; i++) {
      if (users[i].username == data.author) {
          userExists = true;
          break;
      }
  }
  
  // Se não existir, adiciona
  if(userExists === false){
    users.push({username: data.author, userIcon: data.userIcon, socketId: socket.id});
  }
  
  // Envia a nova lista de usuários online para todos.
  io.emit("users", users);
};

const PORT = process.env.PORT || 3000;
server.listen(PORT);
console.log("Server running on port: ", PORT);
