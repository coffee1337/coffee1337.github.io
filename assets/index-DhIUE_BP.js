(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})(),document.querySelector(`#app`).innerHTML=`
<div class="min-h-screen bg-[#0d1117] text-white">

  <!-- Navigation -->
  <nav class="px-6 py-6">
    <div class="max-w-6xl mx-auto flex items-center justify-between">

      <a
        href="#"
        class="text-lg font-semibold"
      >
        Coffee1337
      </a>

      <div class="flex gap-6 text-sm text-gray-400">
        <a href="#projects" class="nav-link">Projects</a>
        <a href="#stack" class="nav-link">Stack</a>

        <a
          href="https://github.com/Coffee1337"
          target="_blank"
          rel="noopener noreferrer"
          class="nav-link"
        >
          GitHub
        </a>
      </div>

    </div>
  </nav>


  <!-- Hero -->
  <section class="px-6 pt-24 pb-32">

    <div class="max-w-6xl mx-auto">

      <p class="text-cyan-400 uppercase tracking-[0.3em] text-sm">
        Backend · AI · Automation
      </p>

      <h1 class="text-5xl md:text-7xl font-bold mt-6 leading-tight max-w-5xl">
        Егор Трефилов
      </h1>

      <h2 class="text-3xl md:text-5xl font-semibold text-gray-400 mt-5 max-w-5xl">
        Python Backend & AI Automation Developer
      </h2>

      <p class="text-gray-400 text-lg md:text-xl leading-8 mt-8 max-w-3xl">
        Создаю backend-системы, AI-powered приложения и инструменты
        автоматизации на Python, FastAPI, PostgreSQL и Docker.
      </p>

      <div class="flex flex-wrap gap-4 mt-10">

        <a
          href="#projects"
          class="glow-button px-7 py-4 rounded-xl bg-cyan-400 text-black font-semibold"
        >
          Смотреть проекты
        </a>

        <a
          href="https://github.com/Coffee1337"
          target="_blank"
          rel="noopener noreferrer"
          class="secondary-button px-7 py-4 rounded-xl border border-gray-700"
        >
          GitHub
        </a>

        <a
          href="https://github.com/Coffee1337/resume"
          target="_blank"
          rel="noopener noreferrer"
          class="secondary-button px-7 py-4 rounded-xl border border-gray-700"
        >
          Resume
        </a>

      </div>

    </div>

  </section>


  <!-- Focus -->
  <section class="px-6 pb-32">

    <div class="max-w-6xl mx-auto">

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-14">

        <div>

          <p class="section-label">
            Focus
          </p>

          <h2 class="text-4xl md:text-5xl font-bold leading-tight mt-5">
            От идеи до работающей системы.
          </h2>

        </div>

        <div class="space-y-6 text-gray-400 text-lg leading-8">

          <p>
            Основной фокус — backend architecture, API,
            работа с данными, AI/LLM integrations
            и автоматизация процессов.
          </p>

          <p>
            Мне интересны системы, где важны не только интерфейс
            и функциональность, но и архитектура, надёжность,
            тестирование и эксплуатация.
          </p>

        </div>

      </div>

    </div>

  </section>


  <!-- Projects -->
  <section
    id="projects"
    class="px-6 pb-32"
  >

    <div class="max-w-6xl mx-auto">

      <p class="section-label">
        Selected work
      </p>

      <h2 class="text-4xl md:text-5xl font-bold mt-5 mb-14">
        Основные проекты
      </h2>


      <!-- Main project -->
      <article class="project-card featured-project p-8 md:p-10 rounded-3xl border border-gray-800">

        <div class="flex flex-col lg:flex-row lg:justify-between gap-10">

          <div class="max-w-3xl">

            <div class="flex gap-3 items-center flex-wrap">

              <span class="project-number">
                01
              </span>

              <span class="text-cyan-400 text-sm uppercase tracking-widest">
                Featured Project
              </span>

            </div>

            <h3 class="text-3xl md:text-4xl font-bold mt-5">
              🧠 AI Python Mentor
            </h3>

            <p class="text-gray-400 text-lg leading-8 mt-6">
              Full-stack платформа для изучения Python и backend-разработки
              с AI-наставником, RAG, персонализированным roadmap,
              практическими заданиями и системой отслеживания прогресса.
            </p>

            <p class="text-gray-500 leading-7 mt-4">
              В проекте реализованы authentication, PostgreSQL migrations,
              фоновые задачи, AI usage accounting, Telegram/email integrations,
              billing infrastructure, CI и отдельная архитектура
              безопасного исполнения пользовательского Python-кода.
            </p>

            <div class="flex gap-3 flex-wrap mt-7">

              <span class="tech-badge">Python</span>
              <span class="tech-badge">FastAPI</span>
              <span class="tech-badge">PostgreSQL</span>
              <span class="tech-badge">Next.js</span>
              <span class="tech-badge">RAG</span>
              <span class="tech-badge">Docker</span>

            </div>

            <a
              href="https://github.com/Coffee1337/ai-python-mentor"
              target="_blank"
              rel="noopener noreferrer"
              class="project-link inline-block mt-8"
            >
              View repository →
            </a>

          </div>

        </div>

      </article>


      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">


        <!-- NGIE -->
        <article class="project-card p-8 rounded-3xl border border-gray-800">

          <span class="project-number">
            02
          </span>

          <h3 class="text-3xl font-semibold mt-4">
            🎓 NGIE University App
          </h3>

          <p class="text-gray-400 mt-5 leading-8">
            Кроссплатформенное университетское приложение
            с расписанием, offline storage, уведомлениями
            и нативными Android/iOS widgets.
          </p>

          <div class="flex gap-3 flex-wrap mt-6">

            <span class="tech-badge">Flutter</span>
            <span class="tech-badge">Riverpod</span>
            <span class="tech-badge">SQLite</span>
            <span class="tech-badge">Swift</span>
            <span class="tech-badge">WidgetKit</span>

          </div>

          <a
            href="https://github.com/Coffee1337/ngieuapp"
            target="_blank"
            rel="noopener noreferrer"
            class="project-link inline-block mt-8"
          >
            View repository →
          </a>

        </article>


        <!-- TransactionMonitor -->
        <article class="project-card p-8 rounded-3xl border border-gray-800">

          <span class="project-number">
            03
          </span>

          <h3 class="text-3xl font-semibold mt-4">
            💳 TransactionMonitor
          </h3>

          <p class="text-gray-400 mt-5 leading-8">
            Desktop-система мониторинга транзакций
            с risk scoring, аналитическим dashboard,
            управлением клиентами и SQL Server.
          </p>

          <div class="flex gap-3 flex-wrap mt-6">

            <span class="tech-badge">C#</span>
            <span class="tech-badge">.NET 8</span>
            <span class="tech-badge">WinUI 3</span>
            <span class="tech-badge">SQL Server</span>

          </div>

          <a
            href="https://github.com/Coffee1337/TransactionMonitor"
            target="_blank"
            rel="noopener noreferrer"
            class="project-link inline-block mt-8"
          >
            View repository →
          </a>

        </article>


        <!-- KNN -->
        <article class="project-card p-8 rounded-3xl border border-gray-800 md:col-span-2">

          <span class="project-number">
            04
          </span>

          <h3 class="text-3xl font-semibold mt-4">
            📐 K-Nearest Neighbors
          </h3>

          <p class="text-gray-400 mt-5 leading-8 max-w-3xl">
            Реализация алгоритма k-NN с нуля на C++17
            с несколькими distance metrics, нормализацией данных,
            weighted voting и desktop GUI.
          </p>

          <div class="flex gap-3 flex-wrap mt-6">

            <span class="tech-badge">C++17</span>
            <span class="tech-badge">CMake</span>
            <span class="tech-badge">WinAPI</span>
            <span class="tech-badge">Machine Learning</span>

          </div>

          <a
            href="https://github.com/Coffee1337/k-nearest-neighbors"
            target="_blank"
            rel="noopener noreferrer"
            class="project-link inline-block mt-8"
          >
            View repository →
          </a>

        </article>

      </div>

    </div>

  </section>


  <!-- Stack -->
  <section
    id="stack"
    class="px-6 pb-32"
  >

    <div class="max-w-6xl mx-auto">

      <p class="section-label">
        Technology
      </p>

      <h2 class="text-4xl md:text-5xl font-bold mt-5 mb-14">
        Основной стек
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">


        <div class="skill-card">

          <h3 class="skill-title">
            Backend
          </h3>

          <div class="flex flex-wrap gap-3">

            <span class="tech-badge">Python</span>
            <span class="tech-badge">FastAPI</span>
            <span class="tech-badge">PostgreSQL</span>
            <span class="tech-badge">SQLAlchemy</span>
            <span class="tech-badge">Alembic</span>
            <span class="tech-badge">REST API</span>

          </div>

        </div>


        <div class="skill-card">

          <h3 class="skill-title">
            AI & Data
          </h3>

          <div class="flex flex-wrap gap-3">

            <span class="tech-badge">LLM APIs</span>
            <span class="tech-badge">RAG</span>
            <span class="tech-badge">Pandas</span>
            <span class="tech-badge">Data Processing</span>
            <span class="tech-badge">Automation</span>

          </div>

        </div>


        <div class="skill-card">

          <h3 class="skill-title">
            Infrastructure
          </h3>

          <div class="flex flex-wrap gap-3">

            <span class="tech-badge">Docker</span>
            <span class="tech-badge">Git</span>
            <span class="tech-badge">GitHub Actions</span>
            <span class="tech-badge">Linux</span>
            <span class="tech-badge">CI</span>

          </div>

        </div>


        <div class="skill-card md:col-span-3">

          <h3 class="skill-title">
            Additional
          </h3>

          <div class="flex flex-wrap gap-3">

            <span class="tech-badge">Next.js</span>
            <span class="tech-badge">TypeScript</span>
            <span class="tech-badge">Flutter</span>
            <span class="tech-badge">Dart</span>
            <span class="tech-badge">C#</span>
            <span class="tech-badge">C++</span>
            <span class="tech-badge">Swift</span>

          </div>

        </div>

      </div>

    </div>

  </section>


  <!-- CTA -->
  <section class="px-6 pb-32">

    <div class="max-w-6xl mx-auto">

      <div class="cta-card rounded-3xl p-8 md:p-12 border border-gray-800">

        <p class="section-label">
          Contact
        </p>

        <h2 class="text-4xl md:text-5xl font-bold mt-5">
          Подробнее о моей работе
        </h2>

        <p class="text-gray-400 text-lg mt-6 max-w-2xl leading-8">
          Исходный код, техническая документация и история разработки
          доступны в моём GitHub.
        </p>

        <div class="flex flex-wrap gap-4 mt-8">

          <a
            href="https://github.com/Coffee1337"
            target="_blank"
            rel="noopener noreferrer"
            class="glow-button px-7 py-4 rounded-xl bg-cyan-400 text-black font-semibold"
          >
            GitHub
          </a>

          <a
            href="https://github.com/Coffee1337/resume"
            target="_blank"
            rel="noopener noreferrer"
            class="secondary-button px-7 py-4 rounded-xl border border-gray-700"
          >
            Resume
          </a>

        </div>

      </div>

    </div>

  </section>


  <!-- Footer -->
  <footer class="px-6 pb-12">

    <div class="max-w-6xl mx-auto border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between gap-4">

      <p class="text-gray-500">
        © ${new Date().getFullYear()} Egor Trefilov
      </p>

      <p class="text-gray-600">
        Python Backend · AI · Automation
      </p>

    </div>

  </footer>

</div>
`;