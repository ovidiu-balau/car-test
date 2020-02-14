const express = require("express");
const admin = require("firebase-admin");
const bodyParser = require("body-parser");
const axios = require("axios");
const Joi = require("@hapi/joi");

const port = process.env.PORT || 8675;
const dev = process.env.NODE_ENV !== "production";

admin.initializeApp({
  credential: admin.credential.cert(require("./firebase-admin"))
});

const carSchema = Joi.object().keys({
  make: Joi.string()
    .alphanum()
    .min(1)
    .max(50)
    .required(),
  model: Joi.string()
    .alphanum()
    .min(1)
    .max(50)
    .required(),
  colour: Joi.string()
    .alphanum()
    .min(1)
    .max(50)
    .required(),
  year: Joi.number()
    .integer()
    .min(1885)
    .max(2021)
    .required()
});

const carSchemaOptional = Joi.object().keys({
  make: Joi.string()
    .alphanum()
    .min(1)
    .max(50)
    .optional(),
  model: Joi.string()
    .alphanum()
    .min(1)
    .max(50)
    .optional(),
  colour: Joi.string()
    .alphanum()
    .min(1)
    .max(50)
    .optional(),
  year: Joi.number()
    .integer()
    .min(1885)
    .max(2021)
    .optional()
});

const server = express();
server.use(bodyParser.json());

server.post("/api/new", (req, res) => {
  if (req.body) {
    const { error, value } = carSchema.validate(req.body);
    if (error) {
      res.status(422).json({
        status: "error",
        message: error.details,
        data: req.body
      });
    } else {
      admin
        .firestore()
        .collection("cars")
        .add({
          ...value,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        })
        .then(snap => {
          const carValue = value;
          carValue.id = snap.id;
          res.json({
            status: 201,
            message: "Car added successfully",
            data: carValue
          });
        })
        .catch(err =>
          res.status(500).json({
            status: "error",
            message: err.message,
            data: req.body
          })
        );
    }
  } else {
    res.status(422).json({
      status: "error",
      message: "Invalid request data",
      data: car
    });
  }
});

server.post("/api/modify", (req, res) => {
  const { id, car } = req.body;
  if (id && car) {
    const { error, value } = carSchemaOptional.validate(car);
    if (error) {
      res.status(422).json({
        status: "error",
        message: error.details,
        data: req.body
      });
    } else {
      admin
        .firestore()
        .collection("cars")
        .doc(id)
        .set(car, { merge: true })
        .then(snap => {
          const carValue = value;
          carValue.id = snap.id;
          res.json({
            status: "success",
            message: "Car modified successfully",
            data: carValue
          });
        })
        .catch(err =>
          res.status(500).json({
            status: "error",
            message: err.message,
            data: req.body
          })
        );
    }
  } else {
    res.status(422).json({
      status: "error",
      message: "Invalid request data",
      data: car
    });
  }
});
server.get("/api/get", (req, res) => {
  admin
    .firestore()
    .collection("cars")
    .get()
    .then(snapshot => {
      if (snapshot.size > 0) {
        Promise.all(
          snapshot.docs.map(async doc => {
            const car = doc.data();
            car.id = doc.id;
            return car;
          })
        ).then(cars => res.json({ data: cars, status: "success" }));
      } else {
        res.json({ data: [] });
      }
    });
});

server.get("/api/get/:id", (req, res) => {
  const { id } = req.params;
  admin
    .firestore()
    .collection("cars")
    .doc(id)
    .get()
    .then(doc => {
      if (doc.exists) {
        const car = doc.data();
        car.id = doc.id;
        axios
          .get(`https://api.datamuse.com/words?sl=${car.model}`)
          .then(result => {
            car.soundAlike = "";
            result.data.map((foundWord, i) => {
              if (i < 10) {
                car.soundAlike += foundWord.word + (i != 9 ? " " : "");
              }
            });
            res.send(car);
          })
          .catch(() => {
            res.send(car);
          });
      } else {
        res.status(404).json({
          message: "No ID found",
          data: id
        });
      }
    })
    .catch(err => {
      res.status(500).json({
        status: "error",
        message: err.message,
        data: req.body
      });
    });
});

server.post("/api/remove", (req, res) => {
  const { id } = req.body;
  if (id) {
    admin
      .firestore()
      .collection("cars")
      .doc(id)
      .delete()
      .then(() => {
        res.json({
          status: "success",
          message: "Car removed successfully",
          data: id
        });
      })
      .catch(err =>
        res.status(500).json({
          status: "error",
          message: err.message,
          data: id
        })
      );
  } else {
    res.status(422).json({
      status: "error",
      message: "Invalid request data",
      data: id
    });
  }
});

server.listen(port, err => {
  if (err) throw err;
  console.log(`> Ready on http://localhost:${port}`);
});

module.exports = server;
