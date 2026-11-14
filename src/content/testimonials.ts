import type { Lang } from "./types";

export interface Testimonial {
  id: string;
  quote: Record<Lang, string>;
  author: string;
  role: Record<Lang, string>;
  link?: string;
  avatar?: string;
  date?: string;
}

// TODO: заменить реальными отзывами (§13). Пустой массив = секция не рендерится.
export const testimonials: Testimonial[] = [
  {
    id: "placeholder-1",
    quote: {
      ru: "Здесь будет реальный отзыв. Пока это заглушка, чтобы проверить вёрстку карусели.",
      en: "A real review goes here. For now this placeholder exists to test the carousel layout.",
    },
    author: "—",
    role: { ru: "заглушка", en: "placeholder" },
  },
];
