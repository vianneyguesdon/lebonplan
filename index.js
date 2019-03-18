// Instantiation
var express = require("express");
var exphbs = require("express-handlebars");
var expressSession = require("express-session");
var MongoStore = require("connect-mongo")(expressSession);
var mongoose = require("mongoose");
var passport = require("passport");
var bodyParser = require("body-parser");
var LocalStrategy = require("passport-local");
var User = require("./models").User;
var OfferModel = require('./models').Offer;
var fs = require('fs');
var multer = require('multer');
var upload = multer({ dest: 'public/uploads/' });

var port = process.env.PORT || 3000;

var app = express();

app.use(express.static("public"));

// Connexion à la base de données
mongoose.connect(
    process.env.MONGODB_URI ||
    "mongodb://localhost:27017/lebonplan", {
        useNewUrlParser: true,
        useCreateIndex: true
    }
);

// Configuration
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");
app.use(bodyParser.urlencoded({ extended: false }));

// Routes
app.get('/', function(req, res) {
    res.render("home");
});

app.get('/cities/:city', function(req, res) {
    var city = req.params.city
    console.log(city);

    OfferModel.find({ city: city }, function(err, offers) {
        if (err !== null) {
            console.log("erreur", err);
        } else {
            console.log(offers)
                // Map est une boucle qui parcours l'objet offers. On écrit newPluriel = pluriel.map(function(singulier))
            var newOffers = offers.map(function(offer) {
                return {
                    price: offer.price,
                    description: offer.description,
                    firstImage: offer.images[0],
                    title: offer.title,
                    id: offer.id
                };
            });
            // console.log(newOffers);
            res.render("offers", {
                newOffers: newOffers
            });
        };
    });
});

app.get('/offers/:id', function(req, res) {
    var id = req.params.id;
    console.log(id);

    // OfferModel.findOne({ id: id }, function(err, offer) {
    //     if (err !== null) {
    //         console.log("erreur, err")
    //     } else {
    //         console.log(offer)
    //         var displayedOffer = {
    //             title: offer.title,
    //             price: offer.price,
    //             description: offer.description,
    //             city: offer.city,
    //             images: offer.images,
    //             id: offer.id
    //         }

    OfferModel
        .findOne({ id: id })
        .populate('user') // Ici, on note la clef qui fait le lien entre les 2 collections
        .exec(function(err, offer) {
            console.log(offer);
            console.log('The creator is', offer.user.firstName);
            console.log('The family name', offer.user.surname);
            console.log('Mon moto : ', offer.user.description);
            console.log('Ma photo : ', offer.user.thumbnail);

            res.render('offer', {
                // displayedOffer: displayedOffer,
                displayedOffer: offer,
            });
        });
    // console.log(displayedOffer.city)
    // }
    // })
});

// enable session management
app.use(
    expressSession({
        secret: "konexioasso07",
        resave: false,
        saveUninitialized: false,
        store: new MongoStore({ mongooseConnection: mongoose.connection })
    })
);

// enable Passport
app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser()); // JSON.stringify
passport.deserializeUser(User.deserializeUser()); // JSON.parse

app.get("/", function(req, res) {
    res.render("home");
});

app.get("/admin", function(req, res) {
    if (req.isAuthenticated()) {
        console.log('req.user', req.user);
        var welcomeUser = req.user.firstName
        console.log('welcomeUser : ', welcomeUser)
        res.render("admin", {
            welcomeUser: welcomeUser
        });
    } else {
        res.redirect("/");
    }
});

app.get("/signup", function(req, res) {
    if (req.isAuthenticated()) {
        res.redirect("/admin");
    } else {
        res.render("signup");
    }
});

app.post("/signup", function(req, res) {
    // create a user with the defined model with
    // req.body.username, req.body.password

    // WITHOUT PASSPORT

    // var username = req.body.username;
    // var password = req.body.password;

    // User.findOne({username: username}, function(user) {
    //   if (user === null) {
    //     var newUser = new User({
    //       username: username,
    //       password: password,
    //     });
    //     newUser.save(function(err, obj) {
    //       if (err) {
    //         console.log('/signup user save err', err);
    //         res.render('500');
    //       } else {
    //         // Save a collection session with a token session and
    //         // a session cookie in the browser
    //       }
    //     });
    //   }
    // });

    // console.log("will signup");

    var username = req.body.username;
    var password = req.body.password;
    var passwordConf = req.body.passwordConf;
    var firstName = req.body.firstName;
    var surName = req.body.surName;
    var dateOfBirth = req.body.dateOfBirth;
    console.log('username :', username)
    console.log('password :', password)
    console.log('passwordConf:', passwordConf)
    console.log('firstName :', firstName)
    console.log('surName :', surName)
    console.log('dateOfBirth :', dateOfBirth)

    if (password === passwordConf) {
        console.log("OK. Passwords match !")
    } else {
        console.log("Nope ! Passwords don't match !")
    }

    User.register(
        new User({
            username: username,
            firstName: firstName,
            surName: surName,
            dateOfBirth: dateOfBirth,

            // other fields can be added here
        }),
        password, // password will be hashed
        function(err, user) {
            if (err) {
                console.log("/signup user register err", err);
                return res.render("register");
            } else {
                passport.authenticate("local")(req, res, function() {
                    res.redirect("/admin");
                });
            }
        }
    );
});

app.get("/login", function(req, res) {
    if (req.isAuthenticated()) {
        res.redirect("/admin");
    } else {
        res.render("login");
    }
});

app.post(
    "/login",
    passport.authenticate("local", {
        successRedirect: "/admin",
        failureRedirect: "/login"
    })
);

// Without Passport

// app.post("/login", function(req, res) {
//   var md5 = require("md5"); // there for education purpose, if using this method, put it in the top of your file
//   User.find(
//     {
//       username: req.body.username,
//       password: md5(req.body.password)
//     },
//     function(users) {
//       // create a session cookie in the browser
//       // if the password is good
//       // and redirect to /admin
//     }
//   );
//   res.send("login");
// });

app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
});

app.get("/upload", function(req, res) {
    res.render("upload");
});

app.post('/upload', upload.single('image'), function(req, res) {
    console.log(req.file);
    console.log(req.body.username);
    console.log(req.body.firstName);
    console.log(req.body.surName);

    // On rename la photo dans le upload
    var pictureName = "public/uploads/" + req.body.username + ".jpg";
    console.log(pictureName)
    fs.rename(req.file.path, pictureName, function(err) {
        if (err) {
            console.log("il y a une erreur", err)
        }
        var newOffer = new OfferModel({
            title: req.body.title,
            description: req.body.description,
            city: req.body.city,
            firstName: req.body.firstName,
            price: req.body.price,
            images: "/uploads/" + req.body.username + ".jpg",
        });

        // Save the user in the database
        newOffer.save(function(err, offer) {
            if (err) {
                res.send("Il y a eu une erreur, veuillez recommencer")
            }
            var successMess = newOffer.firstName + " , your offer has been saved !";
            res.render("offer-posted");
        });
    });
});

// Listen Server 
app.listen(port, function() {
    console.log("Server starter on port : ", port);
});