import { BASE_URL, fetchOptions, } from "./constants.js";
import { displayMovieDetails } from "./displayMovieDetails.js";


export async function handleSearch(query, message) {
  const response = await fetch(
    `${BASE_URL}/search/movie?query=${encodeURIComponent(
      query
    )}&include_adult=true&language=en-US&page=1`,
    fetchOptions
  );

  if (!response.ok) {
    throw new Error("Failed to fetch search results from TMDB.");
  }

  const data = await response.json();
  if (!data.results || !data.results.length) {
    throw new Error("No movies found with that name!");
  }

  const movie = data.results[0];
  if (message.replied || message.deferred) {
    await displayMovieDetails(movie.id, message);
  } else {
    await displayMovieDetails(movie.id, {
      editReply: (opts) => message.edit(opts),
      reply: (opts) => message.reply(opts),
      deferReply: () => Promise.resolve(),
    });
  }
}

