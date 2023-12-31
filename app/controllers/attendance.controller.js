const db = require("../models");

var moment = require("moment/moment");

const Attendance = db.attendance;
const User = db.user;
const Vehicle = db.vehicle;
const Op = db.Sequelize.Op;

exports.allAttendances = (req, res) => {
  const idCompany = req.body.idCompany;
  if (idCompany > 0) {
    Attendance.findAll({
      include: [
        {
          model: db.user,
          as: "user",
          include: [
            {
              model: db.company,
              as: "companies",
            },
          ],
        },
      ],
      where: {
        companyId: idCompany,
      },
      order: [["checkIn", "DESC"]],
    })
      .then((attendances) => {
        res.status(200).send(attendances);
      })
      .catch((err) => {
        res.status(500).send({ message: err.message });
      });
  } else {
    Attendance.findAll({
      include: [
        {
          model: db.user,
          as: "user",
          include: [
            {
              model: db.company,
              as: "companies",
            },
          ],
        },
      ],
      order: [["checkIn", "DESC"]],
    })
      .then((attendances) => {
        res.status(200).send(attendances);
      })
      .catch((err) => {
        res.status(500).send({ message: err.message });
      });
  }
};

exports.getAttendance = (req, res) => {
  const idUser = req.body.idUser;
  const TODAY_START = moment().format("YYYY-MM-DD 00:00");
  const NOW = moment().format("YYYY-MM-DD 23:59");

  Attendance.findOne({
    where: {
      userId: idUser,
      checkIn: {
        [Op.between]: [TODAY_START, NOW],
      },
    },
    include: [
      {
        model: db.user,
        as: "user",
        include: [
          {
            model: db.company,
            as: "companies",
          },
        ],
        where: {
          id: idUser,
        },
      },
    ],
  })
    .then((attendance) => {
      if (attendance) {
        res.status(200).send({ foundCheckIn: true, attendance: attendance });
      } else {
        res.status(200).send({ foundCheckIn: false });
      }
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};

exports.getMyAttendances = (req, res) => {
  const idUser = req.body.idUser;

  const startOfMonth = moment()
    .set({ year: req.body.year, month: req.body.month })
    .startOf("month")
    .format("YYYY-MM-DD 00:00");
  const endOfMonth = moment()
    .set({ year: req.body.year, month: req.body.month })
    .endOf("month")
    .format("YYYY-MM-DD 23:59");

  Attendance.findAll({
    where: {
      userId: idUser,
      checkIn: {
        [Op.between]: [startOfMonth, endOfMonth],
      },
    },
    order: [["checkIn", "DESC"]],
  })
    .then((attendances) => {
      res.status(200).send(attendances);
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};

exports.getDataAttendances = (req, res) => {
  let dateTo = moment().format("YYYY-MM-DD 23:59");
  let dateFrom = moment().subtract(5, "d").format("YYYY-MM-DD 00:00");

  let vehiclesNumber = null;
  let usersNumber = null;
  let checkIns = null;
  const idCompany = req.body.idCompany;
  if (idCompany > 0) {
    checkIns = Attendance.findAll({
      where: {
        checkIn: {
          [Op.between]: [dateFrom, dateTo],
        },
        companyId: idCompany,
      },
      attributes: [
        [db.Sequelize.literal(`DATE(checkIn)`), "date"],
        [db.Sequelize.literal(`COUNT(*)`), "count"],
      ],
      group: ["date"],
    });

    usersNumber = User.count({
      include: [
        {
          model: db.company,
          as: "companies",
          where: {
            id: req.body.idCompany,
          },
        },
      ],
    });
    vehiclesNumber = Vehicle.count({
      include: [
        {
          model: db.company,
          as: "company",
          where: {
            id: req.body.idCompany,
          },
        },
      ],
    });
  } else {
    checkIns = Attendance.findAll({
      where: {
        checkIn: {
          [Op.between]: [dateFrom, dateTo],
        },
      },
      attributes: [
        [db.Sequelize.literal(`DATE(checkIn)`), "date"],
        [db.Sequelize.literal(`COUNT(*)`), "count"],
      ],
      group: ["date"],
    });

    usersNumber = User.count({});
    vehiclesNumber = Vehicle.count({});
  }

  Promise.all([vehiclesNumber, usersNumber, checkIns])
    .then((response) => {
      res.status(200).send({
        vehiclesNumber: response[0],
        usersNumber: response[1],
        checkIns: response[2],
      });
    })
    .catch((error) => {
      console.log(error);
    });
  // .then((attendances) => {
  //   res.status(200).send({ checkIns: attendances });
  // })
  // .catch((err) => {
  //   res.status(500).send({ message: err.message });
  // });
};

exports.checkInAttendance = (req, res) => {
  var ItalyZone = "Europe/Rome";
  const CURRENT_MOMENT = moment()
    .locale(ItalyZone)
    .format("YYYY-MM-DD HH:mm:ss");

  const createAttendance = Attendance.create({
    userId: req.body.userId,
    companyId: req.body.companyId,
    placeId: req.body.placeId,
    vehicleId: req.body.vehicleId,
    checkIn: CURRENT_MOMENT,
    status: "Presente",
  })
    .then((attendance) => {
      //Create missing attendance user.

      const idUser = req.body.userId;

      const startOfMonth = moment().startOf("month").format("YYYY-MM-DD 00:00");
      const endOfMonth = moment().endOf("month").format("YYYY-MM-DD 23:59");

      Attendance.findAll({
        where: {
          userId: idUser,
          checkIn: {
            [Op.between]: [startOfMonth, endOfMonth],
          },
        },
        order: [["checkIn", "DESC"]],
      }).then((attendances) => {
        //Fix missing checkout
        for (let attendance of attendances) {
          if (
            !(
              moment(attendance?.checkIn).format("DD") == moment().format("DD")
            ) &&
            (attendance?.checkOut == null || attendance?.checkOut == undefined)
          ) {
            Attendance.update(
              {
                checkOut: moment(attendance?.checkIn)
                  .set({ hour: 18, minute: 0 })
                  .utc()
                  .format(),
                status: "CheckOut?",
              },
              { where: { id: attendance?.id } }
            );
          }
        }
        //Fix missing days of month
        let missingDay = new Array();
        let checkInInMonth = moment()
          .startOf("month")
          .set({ hour: 9, minute: 0 });
        const currentDate = moment().set({ hour: 23, minute: 59 });
        while (checkInInMonth.isSameOrBefore(currentDate)) {
          const found = attendances.find(
            (day) =>
              moment(day.checkIn).format("DD") == checkInInMonth.format("DD")
          );

          if (!found || found == undefined) {
            missingDay.push({
              checkIn: moment(checkInInMonth)
                .set({ hour: 9, minute: 0 })
                .utc()
                .format(),
              checkOut: moment(checkInInMonth)
                .set({ hour: 18, minute: 0 })
                .utc()
                .format(),
            });
          }
          checkInInMonth.add(1, "days");
        }
        for (let index = 0; index < missingDay?.length; index++) {
          Attendance.create({
            userId: req.body.userId,
            companyId: req.body.companyId,
            placeId: req.body.placeId,
            vehicleId: req.body.vehicleId,
            checkIn: missingDay[index].checkIn,
            checkOut: missingDay[index].checkOut,
            status: "Verificare",
          });
        }
      });
      res.status(201).send({ message: "CheckIn aggiunto con successo!" });
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};

exports.checkOutAttendance = (req, res) => {
  var ItalyZone = "Europe/Rome";
  const CURRENT_MOMENT = moment()
    .locale(ItalyZone)
    .format("YYYY-MM-DD HH:mm:ss");

  Attendance.update(
    {
      checkOut: CURRENT_MOMENT,
    },
    { where: { id: req.body.id, userId: req.body.userId } }
  )
    .then((attendance) => {
      res.status(201).send({ message: "CheckOut aggiunto con successo!" });
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};
