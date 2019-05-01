require("dotenv").config();
const { darkSkyKey } = process.env;
const publicIp = require("public-ip");
const iplocation = require("iplocation").default;
const got = require("got");

async function init() {
  if (!darkSkyKey) throw new Error("No Dark Sky api key available");

  const ip = await publicIp.v4();
  const { latitude, longitude } = await iplocation(ip);
  const { body } = await got(
    `https://api.darksky.net/forecast/${darkSkyKey}/${latitude},${longitude}?units=si`
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
  console.log("Temp: ", tempWithUnit(temperature));
  console.log("Feels Like: ", tempWithUnit(apparentTemperature));
  console.log("Humidity : ", fractionToPercentage(humidity));
  console.log("Wind Speed : ", windSpeed, "kmph");
  console.log("Cloud Cover : ", fractionToPercentage(cloudCover));
  console.log("Summary : ", summary);
}

function fractionToPercentage(fraction) {
  return (fraction * 100).toFixed(1) + " %";
}

function tempWithUnit(temp, unit = "C") {
  return `${temp}˚${unit.toUpperCase()}`;
}

init();
