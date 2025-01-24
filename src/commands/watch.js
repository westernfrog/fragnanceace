import { EmbedBuilder } from "discord.js";
import { handleSearch } from "../watch/handleSearch.js";
import { handleMovieList } from "../watch/handleMovieList.js";

export const data = {
  name: "watch",
  description: "Search for movies on Supawatch",
};

export async function execute(message, args) {
  if (!args.length) {
    const helpEmbed = new EmbedBuilder()
      .setColor("#FF0000")
      .setTitle("🎬 Supawatch Command Usage")
      .setDescription("Search for movies using the following commands:")
      .addFields(
        { name: "🔍 Search", value: "`watch search <movie name>`" },
        { name: "🎯 Popular", value: "`watch popular`" },
        { name: "⭐ Top Rated", value: "`watch top`" },
        { name: "🆕 Now Playing", value: "`watch now`" }
      );
    return message.reply({ embeds: [helpEmbed] });
  }

  const loadingMessage = await message.reply("Loading...");

  const subcommand = args[0].toLowerCase();

  try {
    switch (subcommand) {
      case "search":
        const query = args.slice(1).join(" ");
        if (!query) {
          throw new Error("Please provide a movie name to search!");
        }
        await handleSearch(query, loadingMessage);
        break;

      case "popular":
        await handleMovieList(
          "movie/popular",
          "Popular Movies 🔥",
          loadingMessage,
          1
        );
        break;

      case "top":
        await handleMovieList(
          "movie/top_rated",
          "Top Rated Movies ⭐",
          loadingMessage
        );
        break;

      case "now":
        await handleMovieList(
          "movie/now_playing",
          "Now Playing 🎬",
          loadingMessage
        );
        break;

      default:
        throw new Error(
          "Invalid subcommand! Use `search`, `popular`, `top`, or `now`."
        );
    }
  } catch (error) {
    console.error("Error in TMDB command:", error);
    const errorEmbed = new EmbedBuilder()
      .setColor("#FF0000")
      .setTitle("❌ Error")
      .setDescription(
        error.message || "An error occurred while fetching movie data."
      );
    await loadingMessage.edit({ embeds: [errorEmbed] });
  }
}
