/* eslint-disable object-property-newline */
/* eslint-disable no-unused-vars */
/* eslint-disable quote-props */
/* eslint-disable no-shadow */
/**
 * This builds on the webServer of previous projects in that it exports the
 * current directory via webserver listing on a hard code (see portno below)
 * port. It also establishes a connection to the MongoDB named 'project6'.
 *
 * To start the webserver run the command:
 *    node webServer.js
 *
 * Note that anyone able to connect to localhost:portNo will be able to fetch
 * any file accessible to the current user in the current directory or any of
 * its children.
 *
 * This webServer exports the following URLs:
 * /            - Returns a text status message. Good for testing web server
 *                running.
 * /test        - Returns the SchemaInfo object of the database in JSON format.
 *                This is good for testing connectivity with MongoDB.
 * /test/info   - Same as /test.
 * /test/counts - Returns the population counts of the cs collections in the
 *                database. Format is a JSON object with properties being the
 *                collection name and the values being the counts.
 *
 * The following URLs need to be changed to fetch there reply values from the
 * database:
 * /user/list         - Returns an array containing all the User objects from
 *                      the database (JSON format).
 * /user/:id          - Returns the User object with the _id of id (JSON
 *                      format).
 * /photosOfUser/:id  - Returns an array with all the photos of the User (id).
 *                      Each photo should have all the Comments on the Photo
 *                      (JSON format).
 */

const mongoose = require("mongoose");
mongoose.Promise = require("bluebird");

const async = require("async");

const fs = require("fs");

const express = require("express");
const app = express();

const session = require("express-session");
const bodyParser = require("body-parser");
const multer = require("multer");

const processFormBody = multer({ storage: multer.memoryStorage() }).single(
  "uploadedphoto"
);

app.use(
  session({ secret: "secretKey", resave: false, saveUninitialized: false })
);
app.use(bodyParser.json());

// Load the Mongoose schema for User, Photo, and SchemaInfo
const User = require("./schema/user.js");
const Photo = require("./schema/photo.js");
const PhotoInfo = require("./schema/photoInfo");
const SchemaInfo = require("./schema/schemaInfo.js");

// XXX - Your submission should work without this line. Comment out or delete
// this line for tests and before submission!
mongoose.set("strictQuery", false);
mongoose.connect(
  "mongodb+srv://dattasai:dattasai@cluster0.erwon.mongodb.net/project6",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

// We have the express static module
// (http://expressjs.com/en/starter/static-files.html) do all the work for us.
app.use(express.static(__dirname));

function getSessionUserID(request) {
  return request.session.user_id;
  //return session.user._id;
}

function hasNoUserSession(request, response) {
  //return false;
  if (!getSessionUserID(request)) {
    response.status(401).send();
    return true;
  }
  // if (session.user === undefined){
  //   response.status(401).send();
  //   return true;
  // }
  return false;
}

app.get("/", function (request, response) {
  response.send("Simple web server of files from " + __dirname);
});

/**
 * Use express to handle argument passing in the URL. This .get will cause
 * express to accept URLs with /test/<something> and return the something in
 * request.params.p1.
 *
 * If implement the get as follows:
 * /test        - Returns the SchemaInfo object of the database in JSON format.
 *                This is good for testing connectivity with MongoDB.
 * /test/info   - Same as /test.
 * /test/counts - Returns an object with the counts of the different collections
 *                in JSON format.
 */
app.get("/test/:p1", function (request, response) {
  // Express parses the ":p1" from the URL and returns it in the request.params
  // objects.

  const param = request.params.p1 || "info";
  if (param === "info") {
    // Fetch the SchemaInfo. There should only one of them. The query of {} will
    // match it.
    SchemaInfo.find({}, function (err, info) {
      if (err) {
        // Query returned an error. We pass it back to the browser with an
        // Internal Service Error (500) error code.
        console.error("Error in /user/info:", err);
        response.status(500).send(JSON.stringify(err));
        return;
      }
      if (info.length === 0) {
        // Query didn't return an error but didn't find the SchemaInfo object -
        // This is also an internal error return.
        response.status(400).send("Missing SchemaInfo");
        return;
      }

      // We got the object - return it in JSON format.
      response.end(JSON.stringify(info[0]));
    });
  } else if (param === "counts") {
    // In order to return the counts of all the collections we need to do an
    // async call to each collections. That is tricky to do so we use the async
    // package do the work. We put the collections into array and use async.each
    // to do each .count() query.
    const collections = [
      { name: "user", collection: User },
      { name: "photo", collection: Photo },
      { name: "schemaInfo", collection: SchemaInfo },
    ];
    async.each(
      collections,
      function (col, done_callback) {
        col.collection.countDocuments({}, function (err, count) {
          col.count = count;
          done_callback(err);
        });
      },
      function (err) {
        if (err) {
          response.status(500).send(JSON.stringify(err));
        } else {
          const obj = {};
          for (let i = 0; i < collections.length; i++) {
            obj[collections[i].name] = collections[i].count;
          }
          response.end(JSON.stringify(obj));
        }
      }
    );
  } else {
    // If we know understand the parameter we return a (Bad Parameter) (400)
    // status.
    response.status(400).send("Bad param " + param);
  }
});

/**
 * URL /user - adds a new user
 */
app.post("/user", function (request, response) {
  const first_name = request.body.first_name || "";
  const last_name = request.body.last_name || "";
  const location = request.body.location || "";
  const description = request.body.description || "";
  const occupation = request.body.occupation || "";
  const login_name = request.body.login_name || "";
  const password = request.body.password || "";

  if (first_name === "") {
    console.error("Error in /user", first_name);
    response.status(400).send("first_name is required");
    return;
  }
  if (last_name === "") {
    console.error("Error in /user", last_name);
    response.status(400).send("last_name is required");
    return;
  }
  if (login_name === "") {
    console.error("Error in /user", login_name);
    response.status(400).send("login_name is required");
    return;
  }
  if (password === "") {
    console.error("Error in /user", password);
    response.status(400).send("password is required");
    return;
  }

  User.exists({ login_name: login_name }, function (err, returnValue) {
    if (err) {
      console.error("Error in /user", err);
      response.status(500).send();
    } else if (returnValue) {
      console.error("Error in /user", returnValue);
      response.status(400).send();
    } else {
      User.create({
        _id: new mongoose.Types.ObjectId(),
        first_name: first_name,
        last_name: last_name,
        location: location,
        description: description,
        occupation: occupation,
        login_name: login_name,
        password: password,
      })
        .then((user) => {
          request.session.user_id = user._id;
          session.user_id = user._id;
          response.end(JSON.stringify(user));
        })
        .catch((err) => {
          console.error("Error in /user", err);
          response.status(500).send();
        });
    }
  });
});

/**
 * URL /photos/new - adds a new photo for the current user
 */
app.post("/photos/new", function (request, response) {
  if (hasNoUserSession(request, response)) return;
  const user_id = getSessionUserID(request) || "";
  if (user_id === "") {
    console.error("Error in /photos/new", user_id);
    response.status(400).send("user_id required");
    return;
  }
  processFormBody(request, response, function (err) {
    if (err || !request.file) {
      console.error("Error in /photos/new", err);
      response.status(400).send("photo required");
      return;
    }
    const timestamp = new Date().valueOf();
    const filename = "U" + String(timestamp) + request.file.originalname;
    fs.writeFile("./images/" + filename, request.file.buffer, function (err) {
      if (err) {
        console.error("Error in /photos/new", err);
        response.status(400).send("error writing photo");
        return;
      }
      Photo.create({
        _id: new mongoose.Types.ObjectId(),
        file_name: filename,
        date_time: new Date(),
        user_id: new mongoose.Types.ObjectId(user_id),
        comment: [],
      })
        .then(() => {
          response.end();
        })
        .catch((err) => {
          console.error("Error in /photos/new", err);
          response.status(500).send(JSON.stringify(err));
        });
    });
  });
});

/**
 * URL /commentsOfPhoto/:photo_id - adds a new comment on photo for the current user
 */
app.post("/commentsOfPhoto/:photo_id", function (request, response) {
  if (hasNoUserSession(request, response)) return;
  const id = request.params.photo_id || "";
  const user_id = getSessionUserID(request) || "";
  const comment = request.body.comment || "";
  if (id === "") {
    response.status(400).send("id required");
    return;
  }
  if (user_id === "") {
    response.status(400).send("user_id required");
    return;
  }
  if (comment === "") {
    response.status(400).send("comment required");
    return;
  }
  Photo.updateOne(
    { _id: new mongoose.Types.ObjectId(id) },
    {
      $push: {
        comments: {
          comment: comment,
          date_time: new Date(),
          user_id: new mongoose.Types.ObjectId(user_id),
          _id: new mongoose.Types.ObjectId(),
        },
      },
    },
    function (err, returnValue) {
      if (err) {
        // Query returned an error. We pass it back to the browser with an
        // Internal Service Error (500) error code.
        console.error("Error in /commentsOfPhoto/:photo_id", err);
        response.status(500).send(JSON.stringify(err));
        return;
      }
      response.end();
    }
  );
});

/**
 * URL /admin/login - Returns user object on successful login
 */
app.post("/admin/login", function (request, response) {
  const login_name = request.body.login_name || "";
  const password = request.body.password || "";
  User.find(
    {
      login_name: login_name,
      password: password,
    },
    { __v: 0 },
    function (err, user) {
      if (err) {
        // Query returned an error. We pass it back to the browser with an
        // Internal Service Error (500) error code.
        console.error("Error in /admin/login", err);
        response.status(500).send(JSON.stringify(err));
        return;
      }
      if (user.length === 0) {
        // Query didn't return an error but didn't find the user object -
        // This is also an internal error return.
        response.status(400).send();
        return;
      }
      request.session.user_id = user[0]._id;
      session.user_id = user[0]._id;
      //session.user = user;
      //response.cookie('user',user);
      // We got the object - return it in JSON format.
      response.end(JSON.stringify(user[0]));
    }
  );
});

/**
 * URL /admin/logout - clears user session
 */
app.post("/admin/logout", function (request, response) {
  //session.user = undefined;
  //response.clearCookie('user');
  request.session.destroy(() => {
    session.user_id = undefined;
    response.end();
  });
});

/**
 * URL /user/list - Returns all the User objects.
 */
app.get("/user/list", function (request, response) {
  if (hasNoUserSession(request, response)) return;
  User.find({}, { _id: 1, first_name: 1, last_name: 1 }, function (err, users) {
    if (err) {
      // Query returned an error. We pass it back to the browser with an
      // Internal Service Error (500) error code.
      console.error("Error in /user/list", err);
      response.status(500).send(JSON.stringify(err));
      return;
    }
    if (users.length === 0) {
      // Query didn't return an error but didn't find the SchemaInfo object -
      // This is also an internal error return.
      response.status(400).send();
      return;
    }
    // We got the object - return it in JSON format.
    response.end(JSON.stringify(users));
  });
});

/**
 * URL /user/:id - Returns the information for User (id).
 */
app.get("/user/:id", function (request, response) {
  if (hasNoUserSession(request, response)) return;
  const id = request.params.id;
  User.findById(id, { __v: 0, login_name: 0, password: 0 })
    .then((user) => {
      if (user === null) {
        // Query didn't return an error but didn't find the SchemaInfo object -
        // This is also an internal error return.
        console.error("User not found - /user/:id", id);
        response.status(400).send();
      }
      response.end(JSON.stringify(user));
    })
    .catch((err) => {
      // Query returned an error. We pass it back to the browser with an
      // Internal Service Error (500) error code.
      console.error("Error in /user/:id", err.reason);
      if (err.reason.toString().startsWith("BSONTypeError:"))
        response.status(400).send();
      else response.status(500).send();
      return null;
    });
});

/**
 * URL /photosOfUser/:id - Returns the Photos for User (id).
 */
app.get("/photosOfUser/:id", async (request, response) => {
  try {
    if (hasNoUserSession(request, response)) return;

    const id = request.params.id;

    const user = await User.findById(id, {
      __v: 0,
      login_name: 0,
      password: 0,
    });

    if (user === null) {
      console.error("User not found - /user/:id", id);
      return response.status(400).send();
    }

    const photos = await Photo.aggregate([
      { $match: { user_id: { $eq: new mongoose.Types.ObjectId(id) } } },
      { $addFields: { comments: { $ifNull: ["$comments", []] } } },
      {
        $lookup: {
          from: "users",
          localField: "comments.user_id",
          foreignField: "_id",
          as: "users",
        },
      },
      {
        $addFields: {
          comments: {
            $map: {
              input: "$comments",
              in: {
                $mergeObjects: [
                  "$$this",
                  {
                    user: {
                      $arrayElemAt: [
                        "$users",
                        { $indexOfArray: ["$users._id", "$$this.user_id"] },
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $project: {
          users: 0,
          __v: 0,
          "comments.__v": 0,
          "comments.user_id": 0,
          "comments.user.location": 0,
          "comments.user.description": 0,
          "comments.user.occupation": 0,
          "comments.user.login_name": 0,
          "comments.user.password": 0,
          "comments.user.__v": 0,
        },
      },
    ]);

    if (photos.length === 0 && typeof photos === "object") {
      return response.json([]);
    }

    const photosWithLikes = await Promise.all(
      photos.map(async (photo) => {
        const likes = await PhotoInfo.find({
          userId: request.session.user_id,
          photoId: photo._id,
          type: "type1",
        });

        return {
          ...photo,
          userLiked: likes.length > 0,
        };
      })
    );

    response.json(photosWithLikes);
  } catch (error) {
    console.error("Error in /photosOfUser/:id", error);
    response.status(500).json(error);
  }
});

app.get("/user/details/:id", function (request, response) {
  if (hasNoUserSession(request, response)) return;
  const userId = request.params.id;
  console.log("///////////////////////");
  console.log(userId);
  console.log("///////////////////////");
  User.findById(userId, { __v: 0, login_name: 0, password: 0 })
    .then((user) => {
      return Photo.findOne({ user_id: userId }).sort({ date_time: -1 });
    })
    .then((mostRecentPhoto) => {
      return Photo.aggregate([
        { $match: { user_id: mongoose.Types.ObjectId(userId) } },
        { $unwind: "$comments" },
        {
          $group: {
            _id: "$_id",
            commentsCount: { $sum: 1 },
            mostCommentedPhoto: { $first: "$$ROOT" },
          },
        },
        { $sort: { commentsCount: -1 } },
        { $limit: 1 },
      ]);
    })
    .then((results) => {
      const userDetails = {
        user: results[0],
        mostRecentPhoto: mostRecentPhoto,
        mostCommentedPhoto: results[0].mostCommentedPhoto,
      };
      response.end(JSON.stringify(userDetails));
    })
    .catch((error) => {
      console.error("Error fetching user details:", error);
      response.status(500).send(JSON.stringify(error));
    });
});

app.delete("/photo/delete/:photoId", async (req, res) => {
  const userId = req.session.user_id;
  const photoId = req.params.photoId;
  try {
    const deletedPhoto = await Photo.deletePhoto(photoId, userId);
    if (deletedPhoto) {
      res.status(200).send({ message: "Photo deleted successfully" });
    } else {
      res
        .status(404)
        .send({ error: "Photo not found or user does not own the photo" });
    }
  } catch (error) {
    console.error("Error deleting photo:", error);
    res.status(500).send({ error: "Internal server error" });
  }
});

app.get("/auth/user", async (req, res) => {
  const userId = req.session.user_id;
  try {
    const user = await User.findById(userId);
    if (user) {
      res.status(200).send(user);
    } else {
      res.status(404).send({ error: "User not found" });
    }
  } catch (error) {
    console.error("Error getting session user:", error);
    res.status(500).send({ error: "Internal server error" });
  }
});

app.delete("/dcomment/photos/deleteComment/:commentId", async (req, res) => {
  const { commentId } = req.params;
  try {
    const photo = await Photo.findOne({
      "comments._id": commentId,
    });
    if (!photo) {
      return res.status(404).json({ error: "Photo or comment not found." });
    }
    await Photo.deleteComment(commentId);

    res
      .status(200)
      .json({ success: true, message: "Comment deleted successfully." });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.delete("/user/delete/:userId", async (req, res) => {
  const userId = req.params.userId;
  try {
    await User.deleteUserAccount(userId);
    req.session.destroy();
    res.status(200).send({ message: "User account deleted successfully" });
  } catch (error) {
    console.error("Error deleting user account:", error);
    res.status(500).send({ error: "Internal server error" });
  }
});

app.post("/like/photo/:photoId", async (req, res) => {
  const userId = req.session.user_id;
  const photoId = req.params.photoId;
  const type = "type1";
  try {
    const info = await PhotoInfo.findOne({
      userId: userId,
      photoId: photoId,
      type: type,
    });
    if (info) {
      info.active = !info.active;
      await info.save();

      const likesCount = await PhotoInfo.countDocuments({
        photoId: photoId,
        active: true,
      });

      return res.status(200).json({
        error: false,
        title: info.active ? "Liked" : "Unliked",
        likesCount: likesCount,
      });
    } else if (!info) {
      const data = await PhotoInfo.create({
        userId: userId,
        photoId: photoId,
        type: type,
      });

      const likesCount = await PhotoInfo.countDocuments({
        photoId: photoId,
        active: true,
      });

      res.status(200).json({
        error: false,
        data,
        title: "Liked",
        likesCount: likesCount,
      });
    }
  } catch (err) {
    res.status(200).json({
      error: true,
      err,
      title: "Internal Server Error",
    });
  }
});

app.get("/photos/:photoId/likes", async (req, res) => {
  const photoId = req.params.photoId;

  try {
    const likesCount = await PhotoInfo.countDocuments({
      photoId: photoId,
      type: "type1",
      active: true,
    });

    res.status(200).json({
      error: false,
      likesCount: likesCount,
    });
  } catch (err) {
    res.status(500).json({
      error: true,
      err,
      title: "Internal Server Error",
    });
  }
});

app.get("/favorite/photo/:photoId", async (req, res) => {
  const photoId = req.params.photoId;

  try {
    const isFavorited = await isPhotoFavorited(req.session.user_id, photoId);
    res.status(200).json({
      isFavorited: isFavorited,
      error: false,
    });
  } catch (err) {
    console.error("Error checking favorite status:", err);
    res.status(500).json({
      error: true,
      err,
      title: "Internal Server Error",
    });
  }
});

async function isPhotoFavorited(userId, photoId) {
  try {
    const photoInfo = await PhotoInfo.findOne({
      userId: userId,
      photoId: photoId,
      type: "type2",
      active: true,
    });

    return !!photoInfo;
  } catch (error) {
    console.error("Error checking favorite status:", error);
    throw error;
  }
}
app.post("/favorite/photo/:photoId", async (req, res) => {
  const userId = req.session.user_id;
  const photoId = req.params.photoId;
  const type = "type2";
  try {
    const info = await PhotoInfo.findOne({
      userId: userId,
      photoId: photoId,
      type: type,
    });
    if (info) {
      info.active = !info.active;
      await info.save();
      return res.status(200).json({
        error: false,
        title: info.active ? "Added to Favorites" : "Removed from Favorites",
      });
    } else if (!info) {
      const data = await PhotoInfo.create({
        userId: userId,
        photoId: photoId,
        type: type,
      });

      res.status(200).json({
        error: false,
        data,
        title: "Added to Favorites",
      });
    }
  } catch (err) {
    res.status(200).json({
      error: true,
      err,
      title: "Internal Server Error",
    });
  }
});

app.get("/favorite/photos", async (req, res) => {
  const userId = req.session.user_id;
  const type = "type2";

  try {
    const favorites = await PhotoInfo.find({
      userId,
      type,
      active: true,
    }).populate("photoId");

    res.status(200).json({
      error: false,
      favorites: favorites.map((favorite) => favorite.photoId),
    });
  } catch (err) {
    console.error("Error fetching favorites:", err);
    res.status(500).json({
      error: true,
      title: "Internal Server Error",
    });
  }
});

app.post("/fav/remove/:photoId", async (req, res) => {
  const userId = req.session.user_id;
  const photoId = req.params.photoId;
  const type = "type2";
  try {
    const photoInfo = await PhotoInfo.findOne({
      userId: userId,
      photoId: photoId,
      type: type,
    });
    if (photoInfo) {
      photoInfo.active = false;
      await photoInfo.save();
    }
    return res.status(200).json({
      error: false,
      title: "Removed from Favorites",
    });
  } catch (err) {
    res.status(200).json({
      error: true,
      err,
      title: "Internal Server Error",
    });
  }
});

const server = app.listen(4000, function () {
  const port = server.address().port;
  console.log(
    "Listening at http://localhost:" +
      port +
      " exporting the directory " +
      __dirname
  );
});
