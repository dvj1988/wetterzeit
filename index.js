#! /usr/bin/env node

const Conf = require("conf");
const publicIp = require("public-ip");
const iplocation = require("iplocation").default;
const got = require("got");
var prompt = require("prompt");
var colors = require("colors/safe");
prompt.message = "";

const config = new Conf({
  projectName: "wetter-nodejs",
  dsk: {
    type: "string"
  }
});

const dsk = config.get("dsk");
if (!dsk) {
  console.log(
    "Wetter uses Dark Sky API to fetch the accurate weather report. Please follow the following steps to create an account and get the API key"
  );
  console.log(
    "1. Register for a free account at https://darksky.net/dev/register"
  );
  console.log("2. Verify your email id for Dark Sky");
  console.log("3. Paste the secret key here and Wetter on. 🌤");
  startPrompt();
} else {
  fetchWeatherReport(dsk);
}

function startPrompt() {
  prompt.start();
  prompt.get(
    [
      {
        name: "dsk",
        description: "Dark Sky Secret",
        type: "string",
        required: true,
        message: "Please enter a valid Dark Sky Secret"
      }
    ],
    function(err, result) {
      if (err) return;
      const { dsk } = result;

      if (dsk) {
        config.set("dsk", dsk);
        fetchWeatherReport(dsk);
      }
    }
  );
}

async function getLocation() {
  try {
    const ip = await publicIp.v4();
    var { latitude, longitude } = await iplocation(ip);
    return { latitude, longitude };
  } catch (err) {
    console.error(
      "Could not fetch your location. Check your network connectivity."
    );
    return { latitude: null, longitude: null };
  }
}

async function fetchWeatherReport(dsk) {
  if (!dsk) throw new Error("No Dark Sky api key available");

  console.log("Fetching Location . . .\n");
  const { latitude, longitude } = await getLocation();

  if (!longitude || !latitude) return;

  console.log("Fetching the latest weather report . . .\n");
  try {
    const { body } = await got(
      `https://api.darksky.net/forecast/${dsk}/${latitude},${longitude}?units=si`
    );
    const { currently } = JSON.parse(body);
    const {
      temperature,
      apparentTemperature,
      humidity,
      windSpeed,
      cloudCover,
      summary
    } = currently;
    console.log("It is", colors.bgBlue(summary), "outside.");
    console.log("🌡 Temp : ", tempWithUnit(temperature));
    console.log("🤒 Feels Like: ", tempWithUnit(apparentTemperature));
    console.log("💦 Humidity : ", fractionToPercentage(humidity));
    console.log("🎐 Wind Speed : ", windSpeed, "kmph");
    console.log("⛅ Cloud Cover : ", fractionToPercentage(cloudCover));
  } catch (_) {
    console.log(
      "The Dark Sky API seems to be invalid/expired. Please log on to https://darksky.net/dev/account and enter a valid secret.\n"
    );
    startPrompt();
  }
}

function fractionToPercentage(fraction) {
  return (fraction * 100).toFixed(1) + " %";
}

function tempWithUnit(temp, unit = "C") {
  return `${temp}˚${unit.toUpperCase()}`;
}
