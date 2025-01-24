import { EmbedBuilder } from "discord.js";

export const data = {
  name: "progress",
  description: "Shows time remaining until June 1st",
};

export async function execute(message) {
  try {
    const now = new Date();
    const targetDate = new Date(now.getFullYear(), 5, 1);

    if (now > targetDate) {
      targetDate.setFullYear(targetDate.getFullYear() + 1);
    }

    const timeLeft = targetDate - now;
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;
    const weeks = Math.floor(remainingDays / 7);
    const finalDays = remainingDays % 7;
    const hours = Math.floor(
      (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

    const totalDays = 365;
    const daysPassed = Math.floor(
      (now - new Date(now.getFullYear(), 0, 1)) / (1000 * 60 * 60 * 24)
    );
    const progressBarLength = 20;
    const filledBlocks = Math.floor(
      (daysPassed / totalDays) * progressBarLength
    );
    const progressBar =
      "█".repeat(filledBlocks) + "░".repeat(progressBarLength - filledBlocks);

    const embed = new EmbedBuilder()
      .setColor("#FF5733")
      .setTitle("⏰ Time Until June for NET JRF")
      .addFields(
        {
          name: "Time Remaining",
          value: [
            `**${months}** *months* • **${weeks}** *weeks*`,
            `**${finalDays}** *days* • **${hours}** *hours* • **${minutes}** *minutes*`,
          ].join("\n"),
          inline: false,
        },
        {
          name: "Year Progress",
          value: `${progressBar} (${Math.round(
            (daysPassed / totalDays) * 100
          )}%)`,
          inline: false,
        }
      )
      .setFooter({ text: "Counting down the days..." })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  } catch (error) {
    console.error("Error in progress command:", error);
    await message.reply("Failed to calculate time remaining.");
  }
}
