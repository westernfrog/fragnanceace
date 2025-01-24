export const BASE_URL = "https://api.themoviedb.org/3";
export const POSTER_URL = "https://image.tmdb.org/t/p/w500";
export const YOUTUBE_BASE_URL = "https://www.youtube.com/watch";
export const CACHE_DURATION = 5 * 60 * 1000;
export const ITEMS_PER_PAGE = 5;

export const fetchOptions = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${process.env.TMDB_AUTH_TOKEN}`,
  },
};
