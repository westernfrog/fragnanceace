import { YOUTUBE_BASE_URL } from "./constants.js";

export async function handleTrailer(interaction, videoId, movieTitle) {
  try {
    await interaction.reply({
      content: `🎬 **${movieTitle}** - Trailer\n${YOUTUBE_BASE_URL}?v=${videoId}`,
      ephemeral: false,
    });
  } catch (error) {
    console.error("Error playing trailer:", error);
    await interaction.reply({
      content: "Sorry, there was an error playing the trailer.",
      ephemeral: true,
    });
  }
}
