const db = require("../models");
const User = db.user;
const Company = db.company;
const Role = db.role;
var moment = require("moment/moment");

const Op = db.Sequelize.Op;
var bcrypt = require("bcryptjs");

exports.allCeos = (req, res) => {
  User.findAll({
    include: [
      {
        model: db.role,
        where: [{ id: 4 }],
        attributes: ["id", "name", "label"],
        as: "roles",
      },
      {
        model: db.company,
        as: "companies",
      },
    ],
    attributes: { include: ["id", "name", "surname"], exclude: ["password"] },
  })
    .then((users) => {
      res.status(200).send(users);
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};

exports.allCeosByCompany = (req, res) => {
  User.findAll({
    include: [
      {
        model: db.role,
        where: [{ id: 4 }],
        attributes: ["id", "name", "label"],
        as: "roles",
      },
      {
        model: db.company,
        where: [{ id: req.params.id }],

        as: "companies",
      },
    ],
    attributes: { include: ["id", "name", "surname"], exclude: ["password"] },
  })
    .then((users) => {
      res.status(200).send(users);
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};

exports.allUsers = (req, res) => {
  const idCompany = req.body.idCompany;
  if (idCompany > 0) {

  User.findAll({
    include: [
      {
        model: db.role,
        attributes: {
          include: ["id", "name", "label"],
          order: [["label", "ASC"]],
        },
        as: "roles",
      },
      {
        model: db.company,
        as: "companies",
        order: [["name", "ASC"]],
        where: {
          id: idCompany,
        },
      },
    ],
    attributes: { exclude: ["password"] },
  })
    .then((users) => {
      res.status(200).send(users);
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
  }else{
    User.findAll({
      include: [
        {
          model: db.role,
          attributes: {
            include: ["id", "name", "label"],
            order: [["label", "ASC"]],
          },
          as: "roles",
        },
        {
          model: db.company,
          as: "companies",
          order: [["name", "ASC"]],
        },
      ],
      attributes: { exclude: ["password"] },
    })
      .then((users) => {
        res.status(200).send(users);
      })
      .catch((err) => {
        res.status(500).send({ message: err.message });
      });
  }
};

exports.allUsersWithAttendances = (req, res) => {

  var ItalyZone = "Europe/Rome";
  const idCompany = req.body.idCompany;

  const startOfMonth = moment()
  .set({ year: req.body.year, month: req.body.month })
  .startOf("month")
  .format("YYYY-MM-DD 00:00");

const endOfMonth = moment()
  .set({ year: req.body.year, month: req.body.month })
  .endOf("month")
  .format("YYYY-MM-DD 23:59");

  if (idCompany > 0) {

  User.findAll({
    include: [
      {
        model: db.role,
        attributes: {
          include: ["id", "name", "label"],
        },
        as: "roles",
      },
      {
        model: db.company,
        as: "companies",

        where: {
          id: idCompany,
        },
      },
      {
        model: db.attendance,
        as: "attendances",
        include: [
          {
            model: db.attendanceImage,
            as: "attendanceImages",
          },
        ],
        where: {
          checkIn: {
            [Op.between]: [startOfMonth, endOfMonth],
          },
        },
      },
    ],
    attributes: { exclude: ["password"] },
    order: [[{ model: db.attendance, as: "attendances" }, "checkIn", "DESC"]],
  })
    .then((users) => {
      res.status(200).send(users);
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
  }else{
    User.findAll({
      include: [
        {
          model: db.role,
          attributes: {
            include: ["id", "name", "label"],
          },
          as: "roles",
        },
        {
          model: db.company,
          as: "companies",
        },
        {
          model: db.attendance,
          as: "attendances",
          include: [
            {
              model: db.attendanceImage,
              as: "attendanceImages",
            },
          ],
          where: {
            checkIn: {
              [Op.between]: [startOfMonth, endOfMonth],
            },
          },
        },
      ],
      attributes: { exclude: ["password"] },
      order: [[{ model: db.attendance, as: "attendances" }, "checkIn", "DESC"]],
    })
      .then((users) => {
        res.status(200).send(users);
      })
      .catch((err) => {
        res.status(500).send({ message: err.message });
      });
  }
};


exports.createUser = (req, res) => {
  // Save User to Database
  User.create({
    fiscalCode: req.body.fiscalCode,
    password: bcrypt.hashSync(req.body.password, 8),
    name: req.body.name,
    surname: req.body.surname,
    email: req.body.email,
    fiscalCode: req.body.fiscalCode,
    workerNumber: req.body.workerNumber,
    position: req.body.position,
    status: req.body.status,
  })
    .then((user) => {
      user.addRole(req.body.roleId);
      user.addCompany(req.body.companyId);
      res.status(201).send({ message: "Utente aggiunto con successo!" });
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};

exports.deleteUser = (req, res) => {
  // Delete User
  User.destroy({
    where: { id: req.params.id },
  })
    .then((user) => {
      res.status(201).send({ message: "Utente eliminato con successo!" });
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};

exports.getUser = (req, res) => {
  // Get User
  User.findOne({
    where: { id: req.params.id },
    include: [
      {
        model: db.role,
        attributes: ["id", "name", "label"],
        as: "roles",
      },
      {
        model: db.company,
        as: "companies",
        include: [
          {
            model: db.place,
            as: "places",
          },
          {
            model: db.vehicle,
            as: "vehicles",
          },
        ],
      },
    ],
  })
    .then((user) => {
      if (user) {
        res.status(200).send(user);
      } else {
        res.status(500).send({ message: "Utente non trovata" });
      }
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};

exports.patchUser = (req, res) => {
  // Save User to Database
  User.update(
    {
      fiscalCode: req.body.fiscalCode,
      name: req.body.name,
      surname: req.body.surname,
      email: req.body.email,
      fiscalCode: req.body.fiscalCode,
      workerNumber: req.body.workerNumber,
      position: req.body.position,
      status: req.body.status,
    },
    { where: { id: req.params.id } }
  )
    .then((user) => {
      res.send({ message: "User registered successfully!" });
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};


// exports.allAccess = (req, res) => {
//   res.status(200).send("Public Content.");
// };

// exports.userBoard = (req, res) => {
//   res.status(200).send("User Content.");
// };

// exports.adminBoard = (req, res) => {
//   res.status(200).send("Admin Content.");
// };

// exports.moderatorBoard = (req, res) => {
//   res.status(200).send("Moderator Content.");
// };
