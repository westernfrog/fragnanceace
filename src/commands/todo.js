import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { EmbedBuilder } from "discord.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const todosPath = path.join(__dirname, "../data/todos.json");

async function ensureDataDir() {
  const dataDir = path.join(__dirname, "../data");
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

async function loadTodos() {
  try {
    await ensureDataDir();
    const data = await fs.readFile(todosPath, "utf8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function saveTodos(todos) {
  await ensureDataDir();
  await fs.writeFile(todosPath, JSON.stringify(todos, null, 2));
}

export const data = {
  name: "todo",
  description: "Manage your todo list. Use add/list/remove/clear commands",
};

export async function execute(message, args) {
  if (!args.length) {
    const helpEmbed = new EmbedBuilder()
      .setColor("#FF0000")
      .setTitle("❌ Todo Command Usage")
      .setDescription("Please use one of these subcommands:")
      .addFields(
        { name: "📝 Add", value: "`todo add <task>`" },
        { name: "📋 List", value: "`todo list`" },
        { name: "🗑️ Remove", value: "`todo remove <number>`" },
        { name: "🧹 Clear", value: "`todo clear`" }
      );
    return message.reply({ embeds: [helpEmbed] });
  }

  const subcommand = args[0].toLowerCase();
  const userId = message.author.id;
  const todos = await loadTodos();

  if (!todos[userId]) {
    todos[userId] = [];
  }

  try {
    switch (subcommand) {
      case "add":
        const todoText = args.slice(1).join(" ");
        if (!todoText) {
          const errorEmbed = new EmbedBuilder()
            .setColor("#FF0000")
            .setTitle("❌ Error")
            .setDescription(
              "Please provide something to add to your todo list!"
            );
          return message.reply({ embeds: [errorEmbed] });
        }
        todos[userId].push(todoText);
        await saveTodos(todos);

        const addEmbed = new EmbedBuilder()
          .setColor("#00FF00")
          .setTitle("✅ Todo Added")
          .setDescription(`Successfully added to your todo list:`)
          .addFields({ name: "New Task", value: todoText });
        await message.reply({ embeds: [addEmbed] });
        break;

      case "list":
        if (todos[userId].length === 0) {
          const emptyEmbed = new EmbedBuilder()
            .setColor("#FFA500")
            .setTitle("📝 Todo List")
            .setDescription("Your todo list is empty!");
          return message.reply({ embeds: [emptyEmbed] });
        }

        const listEmbed = new EmbedBuilder()
          .setColor("#00FF00")
          .setTitle("📝 Your Todo List")
          .setDescription(
            todos[userId]
              .map((todo, index) => `${index + 1}. ${todo}`)
              .join("\n")
          )
          .setFooter({ text: `Total tasks: ${todos[userId].length}` });

        await message.reply({ embeds: [listEmbed] });
        break;

      case "remove":
        const index = parseInt(args[1]) - 1;
        if (isNaN(index) || index < 0 || index >= todos[userId].length) {
          const errorEmbed = new EmbedBuilder()
            .setColor("#FF0000")
            .setTitle("❌ Error")
            .setDescription("Please provide a valid todo number to remove!");
          return message.reply({ embeds: [errorEmbed] });
        }
        const removed = todos[userId].splice(index, 1)[0];
        await saveTodos(todos);

        const removeEmbed = new EmbedBuilder()
          .setColor("#FFA500")
          .setTitle("🗑️ Todo Removed")
          .setDescription("Successfully removed from your todo list:")
          .addFields({ name: "Removed Task", value: removed });
        await message.reply({ embeds: [removeEmbed] });
        break;

      case "clear":
        todos[userId] = [];
        await saveTodos(todos);

        const clearEmbed = new EmbedBuilder()
          .setColor("#FFA500")
          .setTitle("🧹 Todo List Cleared")
          .setDescription("Your todo list has been cleared!");
        await message.reply({ embeds: [clearEmbed] });
        break;

      default:
        const unknownEmbed = new EmbedBuilder()
          .setColor("#FF0000")
          .setTitle("❌ Unknown Command")
          .setDescription(
            "Unknown subcommand. Use `add`, `list`, `remove`, or `clear`"
          );
        await message.reply({ embeds: [unknownEmbed] });
    }
  } catch (error) {
    console.error("Error in todo command:", error);
    const errorEmbed = new EmbedBuilder()
      .setColor("#FF0000")
      .setTitle("❌ Error")
      .setDescription("An error occurred while managing your todo list.");
    await message.reply({ embeds: [errorEmbed] });
  }
}
