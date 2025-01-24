import fs from "fs";
import path from "path";
import { Client, GatewayIntentBits, Collection } from "discord.js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname } from "path";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const prefix = process.env.PREFIX;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.commands = new Collection();

async function loadCommands(dir = "commands") {
  try {
    const commandsPath = path.join(__dirname, dir);

    if (!fs.existsSync(commandsPath)) {
      console.error(`Directory not found: ${commandsPath}`);
      return;
    }

    const files = fs.readdirSync(commandsPath);

    for (const file of files) {
      const filePath = path.join(commandsPath, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        await loadCommands(path.join(dir, file));
      } else if (file.endsWith(".js")) {
        try {
          const fileURL = new URL(`file://${filePath}`).href;
          const commandModule = await import(fileURL);
          const command = commandModule.default || commandModule;

          if ("data" in command && "execute" in command) {
            client.commands.set(command.data.name, command);
            console.log(
              `Loaded command: ${command.data.name} from ${dir}/${file}`
            );
          } else {
            console.warn(
              `⚠️ The command at ${dir}/${file} is missing required "data" or "execute" properties.`
            );
          }
        } catch (error) {
          console.error(`Error loading command ${dir}/${file}:`, error);
        }
      }
    }
  } catch (error) {
    console.error(`Error loading commands from ${dir}:`, error);
  }
}

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName);

  if (!command) return;

  try {
    await command.execute(message, args);
  } catch (error) {
    console.error("Error executing command:", error);
    await message
      .reply("An error occurred while executing the command.")
      .catch(console.error);
  }
});

async function initializeBot() {
  try {
    await loadCommands();

    await client.login(process.env.DISCORD_TOKEN);
  } catch (error) {
    console.error("Error initializing bot:", error);
    process.exit(1);
  }
}

initializeBot();
