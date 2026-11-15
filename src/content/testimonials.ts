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

/**
 * Реальные отзывы от владельца не пришли (блок данных в мандате пуст),
 * поэтому массив пуст: секция Reviews не рендерится вообще.
 * Формат для добавления:
 * { id, quote: { ru, en }, author, role: { ru, en }, link?, date? }
 */
export const testimonials: Testimonial[] = [];
