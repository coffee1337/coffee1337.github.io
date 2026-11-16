import { useEffect, useRef } from "react";
import { Command } from "cmdk";
import { AnimatePresence, motion } from "framer-motion";
import { links } from "../../content";
import { useSite } from "../../context/site";
import { useToast } from "../Toast/ToastProvider";
import { useScrollSpy } from "../../hooks/useScrollSpy";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import { useScrollLock } from "../../hooks/useScrollLock";
import { trackEvent } from "../../analytics";

type Props = {
  open: boolean;
  onClose: () => void;
};

const SECTION_IDS = ["about", "stack", "projects", "resume", "contact"] as const;

export function CommandPalette({ open, onClose }: Props) {
  const { dict, lang, switchLang, toggleTheme, setSection, pathBase, route } = useSite();
  const { lockUntilSettled } = useScrollSpy();
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, open);
  useScrollLock(open);
  const { toast } = useToast();
  const p = dict.palette;

  useEffect(() => {
    if (!open) return;
    trackEvent("cmdk", { action: "open" });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const jump = (id: string) => {
    if (route.kind !== "home") {
      // На странице проекта/404 секций главной в DOM нет — уходим на главную с якорем.
      window.location.href = `${pathBase}/#${id}`;
      return;
    }
    setSection(id);
    lockUntilSettled();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    onClose();
  };

  const copy = (value: string, label: string) => {
    void navigator.clipboard.writeText(value).then(() => toast(`✓ ${dict.contact.copied}: ${label}`));
    onClose();
  };

  const external = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={dialogRef}
          className="fixed inset-0 z-[90] grid place-items-center bg-black/40 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={p.nav}
        >
          <Command
            label={p.nav}
            className="w-full max-w-xl border border-[var(--line)] bg-[var(--bg-2)] shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center border-b border-[var(--line)] px-4">
              <span className="font-mono text-[var(--accent)]">&gt;</span>
              <Command.Input
                autoFocus
                placeholder={p.search}
                className="w-full bg-transparent px-3 py-4 font-mono text-sm outline-none placeholder:text-[var(--ink-faint)]"
              />
            </div>

            <Command.List className="max-h-[52vh] overflow-auto overscroll-contain p-2" data-lenis-prevent>
              <Command.Empty className="p-6 text-center font-mono text-xs text-[var(--ink-dim)]">
                {p.empty}
              </Command.Empty>

              <Group heading={p.nav}>
                {SECTION_IDS.map((id) => (
                  <Item key={id} id={`nav-${id}`} group="nav" value={`${id} ${dict.nav[id]} nav`} onSelect={() => jump(id)}>
                    {dict.nav[id]}
                  </Item>
                ))}
              </Group>

              <Group heading={p.projects}>
                {dict.projects.items.map((project) => (
                  <Item
                    key={project.id}
                    id={`project-${project.id}`}
                    group="projects"
                    value={`${project.id} ${project.name} project проект`}
                    onSelect={() => {
                      window.location.href = `${pathBase}/projects/${project.id}/`;
                    }}
                  >
                    {project.name}
                  </Item>
                ))}
              </Group>

              <Group heading={p.actions}>
                <Item id="copy-email" group="actions" value={`email copy копировать почта ${links.email}`} onSelect={() => copy(links.email, links.email)}>
                  {p.copyEmail}
                </Item>
                <Item id="download-resume" group="actions" value="resume cv резюме скачать" onSelect={() => external(links.resumePdf)}>
                  {p.downloadResume}
                </Item>
                <Item id="open-github" group="actions" value="github код code" onSelect={() => external(links.github)}>
                  GitHub
                </Item>
                <Item id="open-linkedin" group="actions" value="linkedin работа work" onSelect={() => external(links.linkedin)}>
                  LinkedIn
                </Item>
                <Item id="open-telegram" group="actions" value="telegram tg связаться" onSelect={() => external(links.telegram)}>
                  Telegram {links.telegramHandle}
                </Item>
                <Item
                  id="ask-ai"
                  group="actions"
                  value="ai ask assistant спросить ассистент чат"
                  onSelect={() => {
                    window.dispatchEvent(new CustomEvent("open-ai-chat"));
                    onClose();
                  }}
                >
                  {p.askAi}
                </Item>
                <Item
                  id="write-email"
                  group="actions"
                  value="write contact написать письмо"
                  onSelect={() => {
                    window.location.href = links.mailto;
                    onClose();
                  }}
                >
                  {p.writeMe}
                </Item>
              </Group>

              <Group heading={p.settings}>
                <Item
                  id="toggle-theme"
                  group="settings"
                  value="theme dark light тема тёмная светлая"
                  onSelect={() => {
                    toggleTheme();
                    onClose();
                  }}
                >
                  {p.toggleTheme}
                </Item>
                <Item
                  id="switch-lang"
                  group="settings"
                  value={`language lang язык ${lang === "ru" ? "en english" : "ru русский"}`}
                  onSelect={() => {
                    switchLang(lang === "ru" ? "en" : "ru");
                    onClose();
                  }}
                >
                  {p.switchLang}
                </Item>
              </Group>
            </Command.List>

            <div className="border-t border-[var(--line)] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-faint)]">
              {p.hints}
            </div>
          </Command>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Group({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <Command.Group
      heading={heading}
      className="px-2 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-faint)]"
    >
      {children}
    </Command.Group>
  );
}

function Item({
  value,
  onSelect,
  id,
  group,
  children,
}: {
  value: string;
  onSelect: () => void;
  id: string;
  group: "nav" | "projects" | "actions" | "settings";
  children: React.ReactNode;
}) {
  return (
    <Command.Item
      value={value}
      onSelect={() => {
        trackEvent("cmdk", { action: "select", command: id, group });
        onSelect();
      }}
      className="cursor-pointer px-3 py-2 font-body text-sm normal-case tracking-normal text-[var(--ink)] data-[selected=true]:bg-[var(--accent)] data-[selected=true]:text-[var(--bg)]"
    >
      {children}
    </Command.Item>
  );
}
