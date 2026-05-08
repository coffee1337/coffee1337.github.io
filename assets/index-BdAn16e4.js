(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})(),document.querySelector(`#app`).innerHTML=`
<div class="min-h-screen bg-[#0d1117] text-white relative overflow-hidden">

  <div class="blur-circle blur-top"></div>
  <div class="blur-circle blur-bottom"></div>

  <section class="px-6 py-32 flex items-center justify-center">

    <div class="max-w-5xl w-full">

      <p class="text-cyan-400 uppercase tracking-[0.3em] text-sm">
        Coffee1337
      </p>

      <h1 class="text-7xl font-bold mt-6 leading-tight">
        Егор Трефилов
      </h1>

      <p class="text-3xl text-gray-400 mt-6">
        AI • Backend • Data Analysis • Automation
      </p>

      <div class="mt-10 max-w-3xl">
        <p class="text-gray-300 text-xl leading-9">
          Self-taught разработчик, занимающийся backend-разработкой,
          AI-интеграциями, автоматизацией и аналитикой данных.
        </p>
      </div>

      <div class="flex gap-5 mt-12 flex-wrap">

        <a
          href="https://github.com/Coffee1337"
          target="_blank"
          class="glow-button px-7 py-4 rounded-2xl bg-cyan-400 text-black font-semibold"
        >
          GitHub
        </a>

        <a
          href="https://github.com/Coffee1337/resume"
          target="_blank"
          class="secondary-button px-7 py-4 rounded-2xl border border-gray-700"
        >
          Resume
        </a>

      </div>

    </div>

  </section>

  <section class="px-6 pb-32">

    <div class="max-w-6xl mx-auto">

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-16">

        <div>

          <p class="text-cyan-400 uppercase tracking-[0.3em] text-sm mb-6">
            About
          </p>

          <h2 class="text-5xl font-bold leading-tight">
            Создаю AI-инструменты,
            backend-системы и проекты
            для автоматизации.
          </h2>

        </div>

        <div>

          <p class="text-gray-400 text-xl leading-9">
            Мне интересно создавать реальные проекты,
            связанные с AI, аналитикой данных,
            backend-разработкой и автоматизацией процессов.
          </p>

          <p class="text-gray-400 text-xl leading-9 mt-8">
            Основной фокус — backend architecture,
            обработка данных, automation systems
            и AI-powered applications.
          </p>

        </div>

      </div>

    </div>

  </section>

  <section class="px-6 pb-32">

    <div class="max-w-6xl mx-auto">

      <p class="text-cyan-400 uppercase tracking-[0.3em] text-sm mb-6">
        Skills
      </p>

      <h2 class="text-5xl font-bold mb-16">
        Технологии и инструменты
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">

        <div class="skill-card p-8 rounded-3xl border border-gray-800 bg-[#111827]/50">

          <h3 class="text-2xl font-semibold mb-6">
            Backend
          </h3>

          <div class="flex flex-wrap gap-3">

            <span class="tech-badge px-4 py-2 rounded-xl bg-cyan-400/10 text-cyan-300">
              Python
            </span>

            <span class="tech-badge px-4 py-2 rounded-xl bg-cyan-400/10 text-cyan-300">
              FastAPI
            </span>

            <span class="tech-badge px-4 py-2 rounded-xl bg-cyan-400/10 text-cyan-300">
              SQL
            </span>

            <span class="tech-badge px-4 py-2 rounded-xl bg-cyan-400/10 text-cyan-300">
              Docker
            </span>

            <span class="tech-badge px-4 py-2 rounded-xl bg-cyan-400/10 text-cyan-300">
              Git
            </span>

          </div>

        </div>

        <div class="skill-card p-8 rounded-3xl border border-gray-800 bg-[#111827]/50">

          <h3 class="text-2xl font-semibold mb-6">
            AI & Data
          </h3>

          <div class="flex flex-wrap gap-3">

            <span class="tech-badge px-4 py-2 rounded-xl bg-cyan-400/10 text-cyan-300">
              Data Analysis
            </span>

            <span class="tech-badge px-4 py-2 rounded-xl bg-cyan-400/10 text-cyan-300">
              Pandas
            </span>

            <span class="tech-badge px-4 py-2 rounded-xl bg-cyan-400/10 text-cyan-300">
              OpenAI API
            </span>

            <span class="tech-badge px-4 py-2 rounded-xl bg-cyan-400/10 text-cyan-300">
              Automation
            </span>

            <span class="tech-badge px-4 py-2 rounded-xl bg-cyan-400/10 text-cyan-300">
              Parsing
            </span>

          </div>

        </div>

        <div class="skill-card p-8 rounded-3xl border border-gray-800 bg-[#111827]/50">

          <h3 class="text-2xl font-semibold mb-6">
            Frontend / Mobile
          </h3>

          <div class="flex flex-wrap gap-3">

            <span class="tech-badge px-4 py-2 rounded-xl bg-cyan-400/10 text-cyan-300">
              Flutter
            </span>

            <span class="tech-badge px-4 py-2 rounded-xl bg-cyan-400/10 text-cyan-300">
              Dart
            </span>

            <span class="tech-badge px-4 py-2 rounded-xl bg-cyan-400/10 text-cyan-300">
              TypeScript
            </span>

            <span class="tech-badge px-4 py-2 rounded-xl bg-cyan-400/10 text-cyan-300">
              TailwindCSS
            </span>

          </div>

        </div>

      </div>

    </div>

  </section>

  <section class="px-6 pb-32">

    <div class="max-w-6xl mx-auto">

      <p class="text-cyan-400 uppercase tracking-[0.3em] text-sm mb-6">
        Projects
      </p>

      <h2 class="text-5xl font-bold mb-16">
        Основные проекты
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">

        <div class="project-card p-8 rounded-3xl border border-gray-800 bg-[#111827]/50 backdrop-blur">

          <h3 class="text-3xl font-semibold">
            💳 TransactionMonitor
          </h3>

          <p class="text-gray-400 mt-5 leading-8">
            Система мониторинга и анализа транзакций
            с backend-архитектурой, логированием
            и обработкой событий.
          </p>

          <div class="flex gap-3 mt-6 flex-wrap">

            <span class="tech-badge px-4 py-2 rounded-xl bg-cyan-400/10 text-cyan-300">
              C#
            </span>

            <span class="tech-badge px-4 py-2 rounded-xl bg-cyan-400/10 text-cyan-300">
              .NET
            </span>

            <span class="tech-badge px-4 py-2 rounded-xl bg-cyan-400/10 text-cyan-300">
              Backend
            </span>

          </div>

          <a
            href="https://github.com/Coffee1337/TransactionMonitor"
            target="_blank"
            class="project-link inline-block mt-8 text-cyan-400"
          >
            Открыть проект →
          </a>

        </div>

        <div class="project-card p-8 rounded-3xl border border-gray-800 bg-[#111827]/50 backdrop-blur">

          <h3 class="text-3xl font-semibold">
            🎓 NGIE University App
          </h3>

          <p class="text-gray-400 mt-5 leading-8">
            Кроссплатформенное Flutter-приложение
            с современным UI/UX и адаптивной архитектурой.
          </p>

          <div class="flex gap-3 mt-6 flex-wrap">

            <span class="tech-badge px-4 py-2 rounded-xl bg-cyan-400/10 text-cyan-300">
              Flutter
            </span>

            <span class="tech-badge px-4 py-2 rounded-xl bg-cyan-400/10 text-cyan-300">
              Dart
            </span>

            <span class="tech-badge px-4 py-2 rounded-xl bg-cyan-400/10 text-cyan-300">
              Mobile
            </span>

          </div>

          <a
            href="https://github.com/Coffee1337/ngieuapp"
            target="_blank"
            class="project-link inline-block mt-8 text-cyan-400"
          >
            Открыть проект →
          </a>

        </div>

      </div>

    </div>

  </section>

  <footer class="px-6 pb-16">

    <div class="max-w-6xl mx-auto border-t border-gray-800 pt-10 flex flex-col md:flex-row justify-between gap-6">

      <div>
        <h3 class="text-2xl font-semibold">
          Coffee1337
        </h3>

        <p class="text-gray-500 mt-3">
          AI • Backend • Data Analysis • Automation
        </p>
      </div>

      <div class="flex gap-6 items-center">

        <a
          href="https://github.com/Coffee1337"
          target="_blank"
          class="footer-link text-gray-400"
        >
          GitHub
        </a>

        <a
          href="https://github.com/Coffee1337/resume"
          target="_blank"
          class="footer-link text-gray-400"
        >
          Resume
        </a>

      </div>

    </div>

  </footer>

</div>
`;