const db = require("../models");

var moment = require("moment/moment");

const Permission = db.permission;
const Op = db.Sequelize.Op;

exports.createPermission = (req, res) => {
  var ItalyZone = "Europe/Rome";
  const CURRENT_MOMENT = moment()
    .locale(ItalyZone)
    .format("YYYY-MM-DD HH:mm:ss");

 Permission.create({
    userId: req.body.userId,
    companyId: req.body.companyId,
    typology: req.body.typology,
    dates: req.body.dates,
    status: "In Attesa",
    createdAt: CURRENT_MOMENT,
  })
    .then((permission) => {
        res.status(200).send(permission);
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};

exports.getMyPermissions = (req, res) => {
  const idUser = req.body.idUser;

  const startOfMonth = moment()
    .set({ year: req.body.year, month: req.body.month })
    .startOf("month")
    .format("YYYY-MM-DD 00:00");
  const endOfMonth = moment()
    .set({ year: req.body.year, month: req.body.month })
    .endOf("month")
    .format("YYYY-MM-DD 23:59");

  Permission.findAll({
    where: {
      userId: idUser,
      createdAt: {
        [Op.between]: [startOfMonth, endOfMonth],
      },
    },
    order: [["createdAt", "DESC"]],
  })
    .then((permissions) => {
      res.status(200).send(permissions);
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};

exports.allPermissions = (req, res) => {
  const idCompany = req.body.idCompany;
  if (idCompany > 0) {
    Permission.findAll({
      include: [
        {
          model: db.user,
          as: "user",
        },
      ],
      where: {
        companyId: idCompany,
      },
      order: [["createdAt", "DESC"]],
    })
      .then((permissions) => {
        res.status(200).send(permissions);
      })
      .catch((err) => {
        res.status(500).send({ message: err.message });
      });
  } else {
    Permission.findAll({
      include: [
        {
          model: db.user,
          as: "user",
        },
      ],
      order: [["createdAt", "DESC"]],

    })
      .then((permissions) => {
        res.status(200).send(permissions);
      })
      .catch((err) => {
        res.status(500).send({ message: err.message });
      });
  }
};

exports.approvePermission = (req, res) => {

  Permission.update(
    {
      status: "Approvato",
    },
    { where: { id: req.body.id, userId: req.body.userId } }
  )
    .then((permission) => {
      res.status(201).send({ message: "Permesso approvato con successo!" });
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};

exports.rejectPermission = (req, res) => {

  Permission.update(
    {
      status: "Negato",
    },
    { where: { id: req.body.id, userId: req.body.userId } }
  )
    .then((permission) => {
      res.status(201).send({ message: "Permesso negato con successo!" });
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};