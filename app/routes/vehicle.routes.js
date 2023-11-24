const { authJwt, verifySignUp } = require("../middleware");
const controller = require("../controllers/vehicle.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });
    
  app.get("/api/vehicle/allVehicles", [authJwt.verifyToken], controller.allVehicles);

};
