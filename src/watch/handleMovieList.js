import { BASE_URL, fetchOptions, ITEMS_PER_PAGE } from "./constants.js";
import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from "discord.js";
import { movieCache } from "./movieCache.js";
import { handleButtonInteraction } from "./handleButtonInteraction.js";

export async function handleMovieList(endpoint, title, message, page = 1) {
  if (page < 1) page = 1;

  const response = await fetch(
    `${BASE_URL}/${endpoint}?language=en-US&page=${page}`,
    fetchOptions
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch ${title.toLowerCase()} from TMDB.`);
  }

  const data = await response.json();
  const totalPages = Math.min(data.total_pages, 5);
  const startIdx = (page - 1) * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;
  const movies = data.results.slice(startIdx, endIdx) || [];

  const cacheKey = `${endpoint}_${page}`;
  movieCache.set(cacheKey, {
    movies,
    timestamp: Date.now(),
  });

  const embed = createMovieListEmbed(movies, title, page, totalPages);
  const components = createPaginationButtons(page, totalPages, movies);

  const messageResponse = await message.edit({
    embeds: [embed],
    components,
  });

  movieCache.set(`list_state_${message.id}`, {
    embed: embed,
    components: components,
    endpoint: endpoint,
    title: title,
    page: page,
    timestamp: Date.now(),
  });

  const collector = messageResponse.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 300000,
  });

  collector.on("end", () => {
    messageResponse.edit({ components: [] }).catch(console.error);
  });

  collector.on("collect", async (interaction) => {
    await handleButtonInteraction(interaction, endpoint, title, totalPages);
  });
}

function createMovieListEmbed(movies, title, currentPage, totalPages) {
  const description = movies
    .map((movie, index) => {
      const year = movie.release_date?.split("-")[0] || "N/A";
      const rating = movie.vote_average?.toFixed(1) || "N/A";
      const overview = movie.overview
        ? movie.overview.length > 100
          ? movie.overview.substring(0, 100) + "..."
          : movie.overview
        : "No overview available";
      return `**${index + 1}. ${
        movie.title
      }** (${year}) - ⭐ ${rating}\n${overview}`;
    })
    .join("\n\n");

  return new EmbedBuilder()
    .setColor("#0099ff")
    .setTitle(title)
    .setDescription(description)
    .setFooter({ text: `Page ${currentPage}/${totalPages} • Data from TMDB` })
    .setTimestamp();
}

function createPaginationButtons(currentPage, totalPages, movies) {
  const row = new ActionRowBuilder();

  row.addComponents(
    new ButtonBuilder()
      .setCustomId("first")
      .setLabel("⏪")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(currentPage === 1),
    new ButtonBuilder()
      .setCustomId("prev")
      .setLabel("◀️")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(currentPage === 1),
    new ButtonBuilder()
      .setCustomId("next")
      .setLabel("▶️")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(currentPage === totalPages),
    new ButtonBuilder()
      .setCustomId("last")
      .setLabel("⏩")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(currentPage === totalPages)
  );

  const movieRow = new ActionRowBuilder();
  movies.slice(0, 5).forEach((_, index) => {
    movieRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`movie_${index}`)
        .setLabel(`${index + 1}`)
        .setStyle(ButtonStyle.Secondary)
    );
  });

  return [row, movieRow];
}
