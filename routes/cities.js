// Var
var express = require('express');
var router = express.Router();
var OfferModel = require('../models').Offer;

// Routes
router.get('/:city', function(req, res) {
    var city = req.params.city
        // console.log(city);

    OfferModel.find({ city: city }, function(err, offers) {
        if (err !== null) {
            console.log("erreur", err);
        } else {
            // console.log(offers)
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

// Export
module.exports = router;