require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connect = require("./lib/connect");
const Note = require("./model/Notes");
const User = require("./model/Users");
const { default: mongoose } = require("mongoose");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

app.get("/", async (request, response) => {
  response.json({ message: "Welcome to the note-taking app with MongoDB!" });
});

app.post("/", async (request, response) => {
  await connect();
  const { username } = request.body;

  try {
    const res = await User.create({ name: username });
    response.json({ id: res._id, message: "Successfully created a new user." });
  } catch (error) {
    response.json({ message: "Could NOT create a new user.", error });
  }
});

app.get("/:user", async (request, response) => {
  await connect();
  const { user } = request.params;
  const { search } = request.query;

  const foundUser = await User.findOne({ name: user });

  if (foundUser) {
    try {
      let notes;
      if (search) {
        notes = await Note.find({
          userId: foundUser._id,
          content: { $regex: search, $options: "i" },
        }).populate("userId");
      } else {
        notes = await Note.find({ userId: foundUser._id }).populate("userId");
      }
      response.json(notes);
    } catch (error) {
      response.json({ message: "An error occured", error });
    }
  } else {
    response.json({ message: "Could NOT find the user." });
  }
});

app.post("/:user", async (request, response) => {
  await connect();

  const { user } = request.params;
  const { content } = request.body;
  try {
    const foundUser = await User.findOne({ name: user });
    console.log(foundUser);

    if (foundUser) {
      const res = await Note.create({ content, userId: foundUser._id });
      return response.json({
        id: res._id,
        message: `Successfully created a new note for ${user}.`,
      });
    } else {
      response.json({ message: "Could NOT find the user." });
    }

    response.json(foundUser);
  } catch (error) {
    response.json({ message: "An error occured.", error });
  }
});

app.get("/users", async (request, response) => {
  await connect();

  try {
    const users = await User.find();
    response.json(users);
  } catch (error) {
    response.json({ message: "An error occured.", error });
  }
});

app.get("/:user/:noteId", async (request, response) => {
  await connect();
  const { user, noteId } = request.params;

  try {
    const foundUser = await User.findOne({ name: user });
    if (!foundUser) {
      return response.json({ message: "Benutzer kann nicht gefunden werden." });
    }

    const note = await Note.findById({ _id: noteId }).populate("userId");
    if (!note) {
      return response.json({ message: "Notiz kann nicht gefunden werden." });
    }

    if (note.userId._id.toString() !== foundUser._id.toString()) {
      return response.json({
        message: "Diese Notiz gehört nicht diesem Nutzer.",
      });
    }

    return response.json(note);
  } catch (error) {
    return response.json({ message: "Ein Fehler ist aufgetreten.", error });
  }
});

app.put("/:user/:noteId", async (request, response) => {
  await connect();
  const { user, noteId } = request.params;
  const { newContent } = request.body;

  try {
    const foundUser = await User.findOne({ name: user });
    if (!foundUser) {
      return response.json({ message: "Benutzer kann nicht gefunden werde." });
    }
    const note = await Note.findById({ _id: noteId }).populate("userId");
    if (!note) {
      return response.json({ message: "Notiz kann nicht gefunden werden." });
    } else {
      await Note.findOneAndUpdate({ _id: noteId }, { content: newContent });
    }
    if (note.userId._id.toString() !== foundUser._id.toString()) {
      return response.json({
        message: "Diese Notiz gehört nicht diesem Nutzer.",
      });
    }

    return response.json("Notiz wurde geändert!");
  } catch (error) {
    return response.json({ message: "Ein Fehler ist aufgetreten.", error });
  }
});

app.delete("/:user/:noteId", async (request, response) => {
  await connect();
  const { user, noteId } = request.params;

  try {
    const foundUser = await User.findOne({ name: user });
    if (!foundUser) {
      return response.json({ message: "Benutzer kann nicht gefunden werden." });
    }
    const note = await Note.findById({ _id: noteId }).populate("userId");
    if (!note) {
      return response.json({ message: "Notiz kann nicht gefunden werden." });
    } else {
      if (note.userId._id.toString() !== foundUser._id.toString()) {
        return response.json({
          message: "Diese Notiz gehört nicht diesem Nutzer.",
        });
      }
      await Note.deleteOne({ _id: noteId });
    }

    return response.json("Notiz wurde gelöscht!");
  } catch (error) {
    return response.json({ message: "Ein Fehler ist aufgetreten.", error });
  }
});

const server = app.listen(port, () =>
  console.log(`Express app listening on port ${port}!`)
);

server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 120 * 1000;
