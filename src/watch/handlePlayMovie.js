export async function handlePlayMovie(interaction, videoId, movieTitle) {
  try {
    await interaction.reply({
      content: `🎬 **${movieTitle}**\n working on it`,
      ephemeral: false,
    });
  } catch (error) {
    console.error("Error in movie interaction:", error);
    await interaction.reply({
      content:
        "An error occurred while processing your request. Please try again.",
      ephemeral: true,
    });
  }
}

