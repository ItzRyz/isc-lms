export const siteConfig = {
  name: "ISC LMS",
  description: "Study Club LMS & Organization Platform — UI/UX, Web Development, Machine Learning",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  divisions: [
    { id: "uiux", name: "UI/UX Design", slug: "uiux" },
    { id: "web", name: "Web Development", slug: "web" },
    { id: "ml", name: "Machine Learning", slug: "ml" },
  ] as const,
};
