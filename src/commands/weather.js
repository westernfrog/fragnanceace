import { EmbedBuilder } from "discord.js";
import fetch from "node-fetch";

const API_KEY = process.env.OPENWEATHER_API_KEY;

export const data = {
  name: "weather",
  description: "Get weather forecast for a city",
};

export async function execute(message, args) {
  const loadingMessage = await message.reply("Loading...");

  let city;

  if (!args.length) {
    try {
      const ipResponse = await fetch("http://ip-api.com/json/");
      const ipData = await ipResponse.json();

      if (ipData.status === "success") {
        city = ipData.city;
      } else {
        throw new Error("Could not determine location");
      }
    } catch (error) {
      const helpEmbed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("❌ Weather Command Usage")
        .setDescription(
          "Could not determine your location. Please provide a city name:"
        )
        .addFields({ name: "Example", value: "`weather London`" });
      return message.reply({ embeds: [helpEmbed] });
    }
  } else {
    city = args.join(" ");
  }

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`
    );
    const data = await response.json();

    if (data.cod !== 200) {
      throw new Error(data.message);
    }

    const weatherEmoji = getWeatherEmoji(data.weather[0].main);
    const windDirection = getWindDirection(data.wind.deg);

    const weatherEmbed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle(`${weatherEmoji} Weather in ${data.name}, ${data.sys.country}`)
      .setDescription(`**${data.weather[0].description}**`.toUpperCase())
      .addFields(
        {
          name: "🌡️ Temperature",
          value: `${Math.round(data.main.temp)}°C (Feels like ${Math.round(
            data.main.feels_like
          )}°C)`,
          inline: false,
        },
        {
          name: "💧 Humidity",
          value: `${data.main.humidity}%`,
          inline: false,
        },
        {
          name: "💨 Wind",
          value: `${data.wind.speed} m/s ${windDirection}`,
          inline: false,
        },
        {
          name: "🌅 Sunrise",
          value: `<t:${data.sys.sunrise}:t>`,
          inline: false,
        },
        {
          name: "🌇 Sunset",
          value: `<t:${data.sys.sunset}:t>`,
          inline: false,
        },
        {
          name: "👁️ Visibility",
          value: `${(data.visibility / 1000).toFixed(1)} km`,
          inline: false,
        }
      )
      .setFooter({ text: "Data from OpenWeatherMap" })
      .setTimestamp();

    await loadingMessage.edit({ embeds: [weatherEmbed] });
  } catch (error) {
    console.error("Error in weather command:", error);
    const errorEmbed = new EmbedBuilder()
      .setColor("#FF0000")
      .setTitle("❌ Error")
      .setDescription(
        "Could not find weather data for that city. Please check the spelling and try again."
      );
    await loadingMessage.edit({ embeds: [errorEmbed] });
  }
}

function getWeatherEmoji(weatherMain) {
  const weatherEmojis = {
    Clear: "☀️",
    Clouds: "☁️",
    Rain: "🌧️",
    Drizzle: "🌦️",
    Thunderstorm: "⛈️",
    Snow: "🌨️",
    Mist: "🌫️",
    Smoke: "🌫️",
    Haze: "🌫️",
    Dust: "🌫️",
    Fog: "🌫️",
    Sand: "🌫️",
    Ash: "🌫️",
    Squall: "💨",
    Tornado: "🌪️",
  };
  return weatherEmojis[weatherMain] || "🌡️";
}

function getWindDirection(degrees) {
  const directions = [
    "⬆️ N",
    "↗️ NE",
    "➡️ E",
    "↘️ SE",
    "⬇️ S",
    "↙️ SW",
    "⬅️ W",
    "↖️ NW",
  ];
  return directions[Math.round(degrees / 45) % 8];
}
