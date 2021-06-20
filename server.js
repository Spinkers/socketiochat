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
let users = ['🤖 Alisha [BOT]'];

io.on("connection", socket => {
  console.log(`Socket conectado: ${socket.id}`);

  socket.emit("previousMessages", messages);
  socket.emit("users", users);
  
  socket.on("sendMessage", data => {
    console.log(data);
    messages.push(data);
    
    if(!users.includes(data.author)){
      users.push(data.author);
    }

    io.emit("users", users);
    socket.broadcast.emit("receivedMessage", data);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT);
console.log("Server running on port: ", PORT);
