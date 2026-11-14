# Роль: ГЛОБАЛЬНЫЕ КОМПОНЕНТЫ (фаза 2)

Читай: `AGENTS.md` → `docs/PROMPT.md` §3.1–3.3, §3.5–3.6, §11 → существующие
`src/components/Header/Header.tsx`, `src/components/Footer/Footer.tsx`, `src/components/CopyButton.tsx`,
`src/hooks/useScrollSpy.ts`, `src/hooks/useSmoothScroll.ts`, `src/styles/tokens.css`,
`src/content/{en,ru}.ts`, `src/App.tsx`.

Фаза 1 уже закрыта: палитра, шрифты (Bricolage/Epilogue/JetBrains/Onest), `html.js`, фиксыreveal
и нумерации. Не переделывай их, работай поверх.

Ты делаешь фазу 2. Секции, hero-canvas и сплэш не трогай.

## Задачи

1. **`ScrambleHeading` (§3.1).** Компонент `src/components/Scramble/ScrambleHeading.tsx`.
   - Только h2 секций и заголовок hero. Пропсы: `text`, `as` (по умолчанию `h2`), `speed`, `stagger`.
   - Запуск один раз при входе в вьюпорт (IntersectionObserver, threshold 0.4).
   - Символы из набора `#/8}~%*01<>_[]=+`, тик ~35ms, фиксация слева направо со смещением ~25ms,
     общая длительность 600–900ms.
   - Без сдвига вёрстки: финальный текст рендерится невидимым и задаёт размеры, анимированный
     слой `position:absolute; inset:0; aria-hidden="true"`.
   - `prefers-reduced-motion` → сразу финальный текст, без анимации.
   - В пререндере сразу финальный текст (компонент не должен давать пустой SSR-вывод).
2. **Шапка-пилюля (§3.2).** Переписать `Header.tsx`.
   - `fixed top-4 left-1/2 -translate-x-1/2`, `backdrop-blur-md`, `bg-[color-mix(in_srgb,var(--bg-2)_70%,transparent)]`,
     обводка `--line`, `border-radius: 999px`.
   - Логотип `coffee1337` с терракотовой точкой → ссылки `About · Projects · Stack · Reviews · Contact`
     (uppercase mono 12px) → `⌘K` → `EN | RU` segmented с бегущим бейджем (framer-motion `layoutId`) →
     кнопка темы с морфингом солнце/луна.
   - Активная секция подсвечивается scroll-spy, подложка переезжает через `layoutId`.
   - Сжатие при скролле вниз; скрытие при быстром скролле вниз, появление при скролле вверх
     (порог > 8px/кадр). Не дёргай layout: только transform/padding/opacity.
   - Мобильная версия (≤768px): логотип + `⌘` + `MENU`, открывает существующее полноэкранное
     меню; пункты `01…07`, новая стилистика, focus trap, `Esc`, возврат фокуса на кнопку.
3. **Cmd+K (§3.3).** `cmdk` + `framer-motion`. Модалка по центру, blur фона, острые углы, ввод
   моноширинный с префиксом `>`. Группы: Навигация / Проекты / Действия (резюме, копировать email,
   GitHub, LinkedIn, Telegram, «Спросить AI-ассистента», «Написать мне») / Настройки (тема, язык).
   Fuzzy-поиск по RU и EN синонимам (`keywords` в контенте). Футер палитры: `↑↓ навигация · ↵ открыть · esc закрыть`.
   Focus trap, `Esc`, восстановление фокуса. Пункт «Спросить AI» пока вызывает заглушку-событие
   `window.dispatchEvent(new CustomEvent("open-ai-chat"))` — чат появится в фазе 5.
4. **Тосты и копирование (§3.5).** `src/components/Toast/ToastProvider.tsx` (framer-motion,
   2.5s, свайп вниз закрывает, `role="status"`), хук `useToast()`. Все копирования (email,
   `git clone`, ссылки) идут через него; текст `✓ Скопировано: <что>` из контента (RU/EN).
   `CopyButton` переписать на этот провайдер, сохранив текущее поведение и доступность.
5. **Футер (§3.6).** Переписать `Footer.tsx`.
   - Водяной знак `COFFEE1337` на всю ширину через SVG `<text textLength>` (outline или opacity 0.05),
     появление при скролле снизу.
   - 3 колонки: (1) логотип, одна строка о себе, бейдж `● OPEN TO WORK`; (2) GitHub, LinkedIn,
     Telegram, Email (копирование), Резюме PDF, `llms.txt`; (3) локация, живые часы `HH:MM:SS` по
     Москве (`Intl.DateTimeFormat("ru-RU",{timeZone:"Europe/Moscow"})`, `tabular-nums`,
     обновление раз в секунду, в пререндере плейсхолдер `--:--:--`), кнопка `Say hello ↗`.
   - Нижняя строка моно 11px: `© 2026 Egor Trefilov (coffee1337)` · `Built with React 19 · Vite · Three.js` · `⌘K`.
   - Часы не должны вызывать hydration mismatch: рендер времени только после монтирования.

## Приёмка

`./brigade/gate.sh` exit 0 при `PHASE=2` (включает checks фазы 1 — не ломай их).
Клавиатура: Tab по шапке, Cmd+K, стрелки в палитре, Esc. Проверь на 360 и 1440.

## Отчёт

`brigade/logs/02-globals.report.md` по шаблону `AGENTS.md`.
