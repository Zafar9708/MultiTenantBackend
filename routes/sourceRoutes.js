const express = require("express");
const router = express.Router();
const {
  getSources,
  addSource,
  updateSource,
  deleteSource,
} = require("../controllers/sourceController");
const { protect, authorize } = require("../middleware/auth");


router.use(protect); 

router
  .route("/")
  .get(authorize("recruiter", "admin"), getSources)
  .post(authorize("recruiter", "admin"), addSource);

router
  .route("/:id")
  .put(authorize("recruiter", "admin"), updateSource)
  .delete(authorize("recruiter", "admin"), deleteSource);


module.exports = router;