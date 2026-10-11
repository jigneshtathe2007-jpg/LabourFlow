
require("dotenv").config();
const bcrypt = require("bcryptjs");
const db = require("./db");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question("Admin full name: ", (name) => {
  rl.question("Admin email: ", (email) => {
    rl.question("Choose admin password: ", async (password) => {
      try {
        if (!name.trim() || !email.trim() || password.length < 8) {
          throw new Error("Enter a name, valid email, and password of at least 8 characters.");
        }

        const hash = await bcrypt.hash(password, 12);

        await db.execute(
          "INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, 'ADMIN')",
          [name.trim(), email.trim().toLowerCase(), hash]
        );

        console.log("Admin account created successfully!");
      } catch (error) {
        console.error("Could not create admin:", error.message);
      } finally {
        await db.end();
        rl.close();
      }
    });
  });
});
