import { useEffect } from "react";
import { Command } from "cmdk";
import { AnimatePresence, motion } from "framer-motion";
import { links } from "../../content";
import { useSite } from "../../context/site";
import { useToast } from "../Toast/ToastProvider";
import { useScrollSpy } from "../../hooks/useScrollSpy";

type Props = {
  open: boolean;
  onClose: () => void;
};

const SECTION_IDS = ["about", "projects", "stack", "resume", "contact"] as const;

export function CommandPalette({ open, onClose }: Props) {
  const { dict, lang, switchLang, toggleTheme, setSection, pathBase } = useSite();
  const { lockUntilSettled } = useScrollSpy();
  const { toast } = useToast();
  const p = dict.palette;

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const jump = (id: string) => {
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
          className="fixed inset-0 z-[90] grid place-items-center bg-black/40 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={onClose}
          role="presentation"
        >
          <Command
            label={p.nav}
            onKeyDown={(event) => {
              if (event.key === "Escape") onClose();
            }}
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

            <Command.List className="max-h-[52vh] overflow-auto p-2">
              <Command.Empty className="p-6 text-center font-mono text-xs text-[var(--ink-dim)]">
                {p.empty}
              </Command.Empty>

              <Group heading={p.nav}>
                {SECTION_IDS.map((id) => (
                  <Item key={id} value={`${id} ${dict.nav[id]} nav`} onSelect={() => jump(id)}>
                    {dict.nav[id]}
                  </Item>
                ))}
              </Group>

              <Group heading={p.projects}>
                {dict.projects.items.map((project) => (
                  <Item
                    key={project.id}
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
                <Item value={`email copy копировать почта ${links.email}`} onSelect={() => copy(links.email, links.email)}>
                  {p.copyEmail}
                </Item>
                <Item value="resume cv резюме скачать" onSelect={() => external(links.resumePdf)}>
                  {p.downloadResume}
                </Item>
                <Item value="github код code" onSelect={() => external(links.github)}>
                  GitHub
                </Item>
                <Item value="linkedin работа work" onSelect={() => external(links.linkedin)}>
                  LinkedIn
                </Item>
                <Item value="telegram tg связаться" onSelect={() => external(links.telegram)}>
                  Telegram {links.telegramHandle}
                </Item>
                <Item
                  value="ai ask assistant спросить ассистент чат"
                  onSelect={() => {
                    window.dispatchEvent(new CustomEvent("open-ai-chat"));
                    onClose();
                  }}
                >
                  {p.askAi}
                </Item>
                <Item
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
                  value="theme dark light тема тёмная светлая"
                  onSelect={() => {
                    toggleTheme();
                    onClose();
                  }}
                >
                  {p.toggleTheme}
                </Item>
                <Item
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

function Item({ value, onSelect, children }: { value: string; onSelect: () => void; children: React.ReactNode }) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className="cursor-pointer px-3 py-2 font-body text-sm normal-case tracking-normal text-[var(--ink)] data-[selected=true]:bg-[var(--accent)] data-[selected=true]:text-[var(--bg)]"
    >
      {children}
    </Command.Item>
  );
}
