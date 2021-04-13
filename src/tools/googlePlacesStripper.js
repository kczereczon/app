const axios = require("axios");
const fs = require("fs");
const dotenv = require("dotenv");
import { taggorizeUrl } from "../core/imagga";
import exit from "process";
import { initDatabase } from "../core/database";
import { Place } from "../models/Place";

dotenv.config();

var myArgs = process.argv.slice(2);
console.log('cities file', myArgs[0]);

fs.readFile(myArgs[0], 'utf8', async function (err, data) {
    if (err) {
        return console.log(err);
    }
    var cities = data.split(',');
    let regex = /\/(\w*).txt/
    let matches = myArgs[0].match(regex);
    var voivodeship = matches[1];

    try {
        initDatabase();
    } catch (error) {
        throw error;
    }

    for (let index = 0; index < cities.length; index++) {
        const element = cities[index];
        let response = await axios.get(`https://maps.googleapis.com/maps/api/place/textsearch/json`, {
            params: {
                query: `atrakcje+w+${element}+${voivodeship}`,
                key: process.env.GOOGLE_PLACES_API_KEY
            }
        });

        for (let index2 in response.data.results) {
            let element2 = response.data.results[index2];
            console.log(`Fetching ${index2} element with name ${element2.name} in city ${element}`);
            try {
                var photoReference = element2.photos[0].photo_reference;
            } catch (error) {
                var photoReference = "";
            }

            if (photoReference) {
                let photoReferenceResponse = await axios.get("https://maps.googleapis.com/maps/api/place/photo", {
                    params:
                    {
                        maxwidth: 600,
                        photoreference: photoReference,
                        key: process.env.GOOGLE_PLACES_API_KEY
                    }
                })

                let existingPlace = await Place.findOne({
                    name: element2.name,
                    lat: element2.geometry.location.lat,
                    lng: element2.geometry.location.lng,
                });

                if (existingPlace) { continue; }

                await sleep(1000);
                let aiTags = await taggorizeUrl(photoReferenceResponse.request.res.responseUrl);

                var tags = [];
                var otherTags = [];
                aiTags.result.tags.forEach(({ tag, confidence }) => {
                    if (confidence > 50) {
                        tags.push(tag.en)
                    } else {
                        otherTags.push(tag.en)
                    }
                })

                let newPlaceObject = {
                    name: element2.name,
                    lat: element2.geometry.location.lat,
                    lng: element2.geometry.location.lng,
                    rating: element2.rating,
                    tags: tags,
                    other_tags: otherTags,
                    address: stripAddress(element2.formatted_address),
                    image: photoReferenceResponse.request.res.responseUrl
                }

                const place = new Place(newPlaceObject);

                try {
                    const newPlace = await place.save();
                } catch (error) {
                    console.error(error)
                }
            }
            console.log(`Ending fetching ${index2} element.`);
        }
    }
});

const stripAddress = (address) => {
    let addressArray = address.split(', ');

    var address = { postal_code: '', city: '', street: '', number: '' };

    if (addressArray.length == 3) {
        address = stripStreet(addressArray[0], address);
        address = stripPostalAndCity(addressArray[1], address);
    } else if (addressArray.length == 2) {
        address = stripPostalAndCity(addressArray[0], address);
    }

    return address;
}

const stripStreet = (streetString, address) => {
    let reg = /^([A-Ż][a-ż].*) ([0-9].*)$/
    let match = streetString.match(reg);

    if (match) {
        address.street = match[1];
        address.number = match[2];
        return address;
    }

    reg = /([A-Ż][a-ż].*)/
    match = streetString.match(reg);

    if (match) {
        address.street = match[1];
        address.number = ""
        return address;
    }

    return address;
}

const stripPostalAndCity = (postalAndCityString, address) => {
    let reg = /(\w{2}-\w{3}) ([A-Ż][a-ż].*)$/
    let match = postalAndCityString.match(reg);

    if (match) {
        address.postal_code = match[1];
        address.city = match[2];

        return address;
    }

    reg = /(\w{2}-\w{3})$/
    match = postalAndCityString.match(reg);

    if (match) {
        address.postal_code = match[1];
        address.city = ''
        return address;
    }

    reg = /([A-Ż][a-ż].*)$/
    match = postalAndCityString.match(reg);

    if (match) {
        address.postal_code = '';
        address.city = match[1];
        return address;
    }

    return address;
}

async function sleep(millis) {
    return new Promise(resolve => setTimeout(resolve, millis));
}