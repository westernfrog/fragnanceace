import {
  BASE_URL,
  fetchOptions,
  POSTER_URL,
  YOUTUBE_BASE_URL,
} from "./constants.js";
import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from "discord.js";
import { handleTrailer } from "./handleTrailer.js";
import { handlePlayMovie } from "./handlePlayMovie.js";

export async function displayMovieDetails(movieId, interaction) {
  const response = await fetch(
    `${BASE_URL}/movie/${movieId}?language=en-US&append_to_response=credits,videos`,
    fetchOptions
  );

  if (!response.ok) {
    throw new Error("Failed to fetch movie details from TMDB.");
  }

  const movie = await response.json();
  const director =
    movie.credits?.crew.find((person) => person.job === "Director")?.name ||
    "N/A";
  const cast =
    movie.credits?.cast
      .slice(0, 3)
      .map((actor) => actor.name)
      .join(", ") || "N/A";
  const trailer = movie.videos?.results.find(
    (video) => video.type === "Trailer" && video.site === "YouTube"
  );

  const embed = new EmbedBuilder()
    .setColor("#0099ff")
    .setTitle(`${movie.title} (${movie.release_date.split("-")[0]})`)
    .setDescription(movie.overview || "No overview available.")
    .addFields(
      { name: "🎭 Director", value: director, inline: true },
      {
        name: "⭐ Rating",
        value: `${movie.vote_average?.toFixed(1) || "N/A"}/10`,
        inline: true,
      },
      {
        name: "⏱️ Runtime",
        value: movie.runtime
          ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`
          : "N/A",
        inline: true,
      },
      { name: "🎭 Cast", value: cast, inline: false },
      {
        name: "🎪 Genres",
        value: movie.genres?.map((g) => g.name).join(", ") || "N/A",
        inline: false,
      }
    )
    .addFields({
      name: "💡 Navigation Help",
      value:
        "• Click `Watch Trailer` to view the trailer\n• Click `Play Movie` to watch the full movie\n• Links will expire in 5 minutes",
      inline: false,
    })
    .setFooter({ text: "Data from TMDB" })
    .setTimestamp();

  if (movie.poster_path) {
    embed.setThumbnail(`${POSTER_URL}${movie.poster_path}`);
  }

  const components = [];
  const row = new ActionRowBuilder();

  if (trailer) {
    row.addComponents(
      new ButtonBuilder()
        .setLabel("Play Movie")
        .setStyle(ButtonStyle.Primary)
        .setCustomId(`movie_${trailer.key}`),
      new ButtonBuilder()
        .setLabel("Watch Trailer")
        .setStyle(ButtonStyle.Primary)
        .setCustomId(`trailer_${trailer.key}`),
      new ButtonBuilder()
        .setLabel("YouTube Link")
        .setStyle(ButtonStyle.Link)
        .setURL(`${YOUTUBE_BASE_URL}?v=${trailer.key}`)
    );
  }
  components.push(row);

  const sendResponse = async (opts) => {
    if (interaction.replied || interaction.deferred) {
      return interaction.editReply(opts);
    } else if (interaction.edit) {
      return interaction.edit(opts);
    } else {
      return interaction.reply(opts);
    }
  };

  const messageResponse = await sendResponse({
    embeds: [embed],
    components: components,
  });

  const collector = messageResponse.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 300000,
  });

  collector.on("end", () => {
    messageResponse.edit({ components: [] }).catch(console.error);
  });

  collector.on("collect", async (interaction) => {
    try {
      if (interaction.customId.startsWith("trailer_")) {
        const videoId = interaction.customId.split("_")[1];
        await handleTrailer(interaction, videoId, movie.title);
      } else if (interaction.customId.startsWith("movie_")) {
        const videoId = interaction.customId.split("_")[1];
        await handlePlayMovie(interaction, videoId, movie.title);
      }
    } catch (error) {
      console.error("Error in button interaction:", error);
      await interaction.reply({
        content:
          "An error occurred while processing your request. Please try again.",
        ephemeral: true,
      });
    }
  });
}
