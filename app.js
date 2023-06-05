const express = require("express");
const { open } = require("sqlite");
const sqlite = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "./userData.db");
let db = null;

const initializeServerAndDB = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at 3000");
    });
  } catch (e) {
    console.log(`DB GOT AN ERROR${e.message}`);
    process.exit(1);
  }
};

initializeServerAndDB();

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;

  const query = `SELECT * FROM user 
    WHERE username = '${username}';`;

  const checkUSER = await db.get(query);

  if (checkUSER === undefined) {
    if (password.length >= 5) {
      const hashedPass = await bcrypt.hash(password, 10);
      const registerQuery = `INSERT INTO user (username, name, password, gender, location) VALUES ('${username}', '${name}', '${hashedPass}', '${gender}', '${location}')`;
      const result = await db.run(registerQuery);
      response.status(200);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const checkUSER = await db.get(
    `select * from user where username = '${username}'`
  );
  if (checkUSER === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const checkPASS = await bcrypt.compare(password, checkUSER.password);
    if (checkPASS) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const checkUSER = await db.get(
    `select * from user where username = '${username}'`
  );

  const checkPass = await bcrypt.compare(oldPassword, checkUSER.password);
  if (checkPass) {
    if (newPassword.length >= 5) {
      const hashedPASS = await bcrypt.hash(newPassword, 10);
      const passChangeQuery = `UPDATE user SET password = '${hashedPASS}' WHERE username = '${username}';`;
      const result = await db.run(passChangeQuery);
      response.status(200);
      response.send("Password updated");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
