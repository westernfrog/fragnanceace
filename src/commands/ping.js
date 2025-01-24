export const data = {
  name: "ping",
  description: "Replies with Pong!",
};

export async function execute(message, args) {
  message.reply(`Pong! Hello, ${message.author.username} ${args}`);
}
