export default function manifest() {
  return {
    name: "Aman Inns",
    short_name: "AmanInns",
    description: "Book luxury hotel stays with Aman Inns",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#FF385C",
    icons: [
      {
        src: "/bbb.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
