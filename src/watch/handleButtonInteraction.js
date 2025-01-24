import { displayMovieDetails } from "./displayMovieDetails.js";
import { CACHE_DURATION } from "./constants.js";
import { movieCache } from "./movieCache.js";
import { handleMovieList } from "./handleMovieList.js";

export async function handleButtonInteraction(
  interaction,
  endpoint,
  title,
  totalPages
) {
  try {
    await interaction.deferUpdate().catch(console.error);

    if (!interaction.message.embeds[0]?.footer?.text) {
      await interaction.followUp({
        content: "An error occurred. Please try the command again.",
        ephemeral: true,
      });
      return;
    }

    const currentPage = parseInt(
      interaction.message.embeds[0].footer.text.match(/Page (\d+)/)[1]
    );
    let newPage = currentPage;

    if (interaction.customId.startsWith("movie_")) {
      const movieIndex = parseInt(interaction.customId.split("_")[1]);
      const cacheKey = `${endpoint}_${currentPage}`;
      const cachedData = movieCache.get(cacheKey);

      if (!cachedData || Date.now() - cachedData.timestamp >= CACHE_DURATION) {
        await interaction.followUp({
          content: "This movie list has expired. Please run the command again.",
          ephemeral: true,
        });
        return;
      }

      const movie = cachedData.movies[movieIndex];
      if (!movie) {
        await interaction.followUp({
          content: "Movie not found. Please try again.",
          ephemeral: true,
        });
        return;
      }

      await displayMovieDetails(movie.id, {
        reply: (opts) => interaction.followUp(opts),
        editReply: (opts) => interaction.editReply(opts),
        deferReply: () => Promise.resolve(),
      });
      return;
    }

    switch (interaction.customId) {
      case "first":
        newPage = 1;
        break;
      case "prev":
        newPage = Math.max(1, currentPage - 1);
        break;
      case "next":
        newPage = Math.min(totalPages, currentPage + 1);
        break;
      case "last":
        newPage = totalPages;
        break;
      default:
        break;
    }

    if (newPage !== currentPage) {
      await handleMovieList(endpoint, title, interaction.message, newPage);
    }
  } catch (error) {
    console.error("Error handling button interaction:", error);
    await interaction
      .followUp({
        content: "An error occurred while processing your request.",
        ephemeral: true,
      })
      .catch(console.error);
  }
}
