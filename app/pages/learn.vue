<template>
  <div class="scene">
    <!-- APP BAR -->
    <header class="hud" role="banner">
      <nav class="hud-inner" aria-label="Global">
        <div class="hud-left">
          <!-- 9-Dots App-Icon → Dashboard -->
          <button class="icon-btn" title="Dashboard" @click="panel='hub'">
            <v-icon size="22" class="text-accent">mdi-dots-grid</v-icon>
          </button>
          <span class="brand">OpenSquawk</span>
          <span class="sep">|</span>
          <span class="mode">Pilot Voice Prep</span>
        </div>

        <div class="hud-right">

          <!-- ATC Einstellungen -->
          <button class="btn ghost" @click="showSettings=true" title="ATC settings">
            <v-icon size="18">mdi-tune</v-icon>
            ATC
          </button>

          <NuxtLink class="btn ghost" to="/logout" title="Logout">
            <v-icon size="18">mdi-logout</v-icon>
            Logout
          </NuxtLink>
        </div>
      </nav>
    </header>


    <!-- HERO -->
    <section v-if="panel==='hub'" class="hero" role="region" aria-label="Intro">
      <div class="container">
        <div class="panel hero-panel" :style="worldTiltStyle" @mousemove="tilt">
          <div class="hero-left">
            <h1 class="h1">Pilot Comms Trainer</h1>
            <p class="muted hero-sub">
              Build confident pilot readbacks with scenario-driven missions, instant scoring, and badges that react to
              your flying.
            </p>


            <div v-if="missionObjective && !missionObjective.complete" class="objective-callout">
              <div class="objective-body">
                <div class="objective-title-row">
                  <v-icon size="18">{{ missionObjective.icon }}</v-icon>
                  <span class="objective-title">{{ missionObjective.title }}</span>
                </div>
                <p class="muted small">{{ missionObjective.description }}</p>
                <div class="objective-progress">
                  <div class="objective-progress-bar">
                    <div class="objective-progress-fill"
                         :style="{ width: objectiveProgressPct(missionObjective) + '%' }"></div>
                  </div>
                  <div class="objective-progress-meta">{{ missionObjective.status }}</div>
                </div>
              </div>
              <button class="btn primary" type="button" @click="resumeMissionObjective">
                <v-icon size="18">mdi-play</v-icon>
                Resume
              </button>
            </div>
          </div>

          <div class="hero-right">
            <div class="hero-stats">
              <div class="hero-stats-title">
                <v-icon size="18">mdi-chart-line</v-icon>
                Mission stats
              </div>
              <div class="hero-metrics">
                <div class="metric-card">
                  <div class="metric-icon">
                    <v-icon size="20">mdi-headset</v-icon>
                  </div>
                  <div class="metric-main">
                    <div class="metric-value">{{ finishedLessons }}/{{ totalLessons }}</div>
                    <div class="metric-label">Lessons complete</div>
                  </div>
                </div>
                <div class="metric-card">
                  <div class="metric-icon">
                    <v-icon size="20">mdi-target-account</v-icon>
                  </div>
                  <div class="metric-main">
                    <div class="metric-value">{{ missionCompletionPct }}%</div>
                    <div class="metric-label">Mission progress</div>
                  </div>
                </div>
                <div class="metric-card">
                  <div class="metric-icon">
                    <v-icon size="20">mdi-star-shooting</v-icon>
                  </div>
                  <div class="metric-main">
                    <div class="metric-value">{{ finishedLessons ? globalAccuracy + '%' : '—' }}</div>
                    <div class="metric-label">Avg. best score</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- HUB -->
    <main v-if="panel==='hub'" class="container" role="main">
      <div class="hub-head">
        <h2 class="h2">Mission Hub</h2>
        <div class="muted">Start with the ICAO alphabet & numbers, then basics, ground, and more.</div>
      </div>

      <div class="tiles-wrap">
        <div
            class="tiles"
            ref="tilesScroller"
        >
          <div
              v-for="m in modules"
              :key="m.id"
              class="tile"
              :class="tileClass(m.id)"
              :ref="el => registerTile(el, m.id)"
          >
          <div class="tile-media" :style="{ backgroundImage: `url(${m.art})` }">
            <span v-if="isFreshModule(m.id)" class="tile-badge">
              <v-icon size="16">mdi-star-four-points</v-icon>
              New briefing
            </span>
          </div>
          <div class="tile-body">
            <div class="tile-top">
              <div class="tile-title">
                <v-icon size="18">mdi-flag-checkered</v-icon>
                {{ m.title }}
              </div>

            </div>
            <div class="muted small">{{ m.subtitle }}</div>
            <div class="line">
              <div class="line-fill" :style="{ width: pct(m.id)+'%' }"></div>
            </div>
            <div class="tile-progress-meta">
              <span>{{ doneCount(m.id) }}/{{ m.lessons.length }} lessons</span>
              <span>{{ moduleHasProgress(m.id) ? avgScore(m.id) + '%' : '—' }} avg</span>
            </div>
            <div class="tile-actions">
              <button
                  class="btn primary"
                  :disabled="!isModuleUnlocked(m.id)"
                  @click="handleModulePrimary(m.id)"
              >
                <v-icon size="18">{{ modulePrimaryIcon(m.id) }}</v-icon>
                {{ modulePrimaryLabel(m.id) }}
              </button>

            </div>
          </div>
          <div v-if="!isModuleUnlocked(m.id)" class="tile-overlay">
            <div class="tile-overlay-inner">
              <v-icon size="26">mdi-lock-alert</v-icon>
              <div class="tile-overlay-text">
                <div class="tile-overlay-title">Clearance pending</div>
                <div class="tile-overlay-sub">Complete earlier missions to unlock this briefing.</div>
              </div>
            </div>
          </div>
          </div>
        </div>
        <div class="tiles-fade left" v-if="tileScrollState.left"></div>
        <div class="tiles-fade right" v-if="tileScrollState.right"></div>
      </div>
    </main>

    <!-- MODULE -->
    <section v-if="panel==='module' && current" class="container play" aria-label="Module">
      <div class="play-head">
        <div class="crumbs">
          <button class="link" @click="panel='hub'">
            <v-icon size="16">mdi-arrow-left</v-icon>
            Hub
          </button>
          <span class="muted">/ {{ current.title }}</span>
        </div>
        <div class="play-head-right">
          <div class="stats">
            <span class="stat"><v-icon size="18">mdi-progress-check</v-icon> {{
                doneCount(current.id)
              }}/{{ current.lessons.length }}</span>
            <span class="stat"><v-icon size="18">mdi-star</v-icon> Ø {{ avgScore(current.id) }}%</span>
          </div>
          <div
              v-if="current && moduleRequiresContext(current.id)"
              class="module-actions"
          >
            <button
                v-if="currentMissionContext"
                class="btn soft mini"
                type="button"
                @click="openMissionBriefingFromModule"
            >
              <v-icon size="16">mdi-clipboard-text-outline</v-icon>
              Briefing
            </button>
            <button
                class="btn ghost mini"
                type="button"
                @click="openMissionSetupFromModule"
            >
              <v-icon size="16">mdi-airplane-cog</v-icon>
              {{ currentMissionContext ? 'Change flight' : 'Plan flight' }}
            </button>
          </div>
        </div>
      </div>

      <div class="module-content">
        <div class="module-overview">
          <div class="lesson-grid">
            <button
                v-for="l in current.lessons"
                :key="l.id"
                class="lesson"
                :class="{ active: activeLesson && activeLesson.id===l.id, ok: bestScore(current.id,l.id)>=80 }"
                @click="selectLesson(l)"
            >
              <span class="lesson-score" :class="lessonScoreClass(current.id, l.id)">
                <v-icon size="14">{{ lessonScoreIcon(current.id, l.id) }}</v-icon>
                {{ lessonScoreLabel(current.id, l.id) }}
              </span>
              <div class="lesson-top">
                <div class="lesson-title">
                  <v-icon size="18">mdi-headset</v-icon>
                  {{ l.title }}
                </div>
              </div>
              <div class="muted small">{{ l.desc }}</div>
              <div class="tags">
                <span v-for="k in l.keywords" :key="k" class="tag">{{ k }}</span>
              </div>
            </button>
          </div>
        </div>

        <div v-if="activeLesson" class="module-detail">
          <div class="console">
            <div v-if="scenario" class="scenario-bar">
              <div class="scenario-item">
                <span class="scenario-label">Callsign</span>
                <div class="scenario-value">{{ scenario.callsign }}</div>
                <div class="scenario-sub">{{ scenario.radioCall }}</div>
              </div>
              <div class="scenario-item">
                <span class="scenario-label">Airport</span>
                <div class="scenario-value">{{ scenario.airport.icao }}</div>
                <div class="scenario-sub">{{ scenario.airport.name }}</div>
              </div>
              <div class="scenario-item wide">
                <span class="scenario-label">Frequencies</span>
                <div class="freq-chips">
                  <button
                      v-for="freq in scenario.frequencies"
                      :key="freq.type"
                      type="button"
                      class="freq-chip"
                      :class="{ active: activeFrequency && activeFrequency.type === freq.type }"
                      @click="setActiveFrequency(freq)"
                  >
                    {{ freq.label }} {{ freq.value }}
                  </button>
                </div>
                <div v-if="activeFrequency && scenario.frequencyWords[activeFrequency.type]"
                     class="freq-hint muted small">
                  {{ scenario.frequencyWords[activeFrequency.type] }}
                </div>
              </div>
            </div>
            <div class="console-grid">
              <div class="col">
                <div class="label">Briefing</div>
                <div class="panel">
                  <div class="target-row">
                    <div class="target-main">
                      <div class="muted small">{{ activeLesson.desc }}</div>
                      <div
                          class="target-text"
                          :class="{ 'audio-blur': audioContentHidden }"
                          :aria-hidden="audioContentHidden ? 'true' : 'false'"
                      >
                        {{ targetPhrase }}
                      </div>
                      <div v-if="audioContentHidden" class="audio-note muted small">
                        Audio challenge active – listen first.
                      </div>
                    </div>
                    <div class="target-actions">
                      <button
                          class="btn soft mini"
                          type="button"
                          :disabled="!targetPhrase || ttsLoading"
                          :aria-busy="ttsLoading ? 'true' : 'false'"
                          @click="speakTarget()"
                      >
                        <v-icon size="16" :class="{ spin: ttsLoading }">
                          {{ ttsLoading ? 'mdi-loading' : 'mdi-volume-high' }}
                        </v-icon>
                        {{ sayButtonLabel }}
                      </button>
                      <button
                          v-if="audioContentHidden"
                          class="btn ghost mini"
                          type="button"
                          @click="revealAudioContent"
                      >
                        <v-icon size="16">mdi-eye</v-icon>
                        Reveal text
                      </button>
                      <button class="btn ghost mini" type="button" @click="repeatLesson">
                        <v-icon size="16">mdi-dice-5</v-icon>
                        Roll
                      </button>
                    </div>
                  </div>
                </div>
                <div class="hints">
                  <div v-for="hint in activeLesson.hints" :key="hint" class="hint">
                    <v-icon size="16">mdi-lightbulb-on-outline</v-icon>
                    {{ hint }}
                  </div>
                  <div
                      v-for="info in lessonInfo"
                      :key="info"
                      :class="['hint', 'secondary', { 'audio-blur': audioContentHidden }]"
                      :aria-hidden="audioContentHidden ? 'true' : 'false'"
                  >
                    <v-icon size="16">mdi-information-outline</v-icon>
                    {{ info }}
                  </div>
                </div>
              </div>

              <div class="col">
                <div class="label">Your readback</div>
                <div class="panel readback-panel">
                  <div class="cloze">
                    <template v-for="(segment, idx) in activeLesson.readback"
                              :key="segment.type === 'field' ? `f-${segment.key}` : `t-${idx}`">
                      <span v-if="segment.type === 'text'">
                        {{ typeof segment.text === 'function' && scenario ? segment.text(scenario) : segment.text }}
                      </span>
                      <label
                          v-else
                          class="blank"
                          :class="[blankSizeClass(segment.key, segment.width), blankStateClass(segment.key)]"
                      >
                        <span class="sr-only">{{ fieldLabel(segment.key) }}</span>
                        <input
                            v-model="userAnswers[segment.key]"
                            :aria-label="fieldLabel(segment.key)"
                            :placeholder="fieldPlaceholder(segment.key)"
                            :inputmode="fieldInputmode(segment.key)"
                        />
                        <v-icon v-if="fieldPass(segment.key)" size="16" class="blank-status ok">mdi-check</v-icon>
                        <v-icon v-else-if="fieldHasAnswer(segment.key)" size="16" class="blank-status warn">mdi-alert
                        </v-icon>
                        <small v-if="result" class="blank-feedback">
                          Soll: {{ fieldExpectedValue(segment.key) }}
                        </small>
                      </label>
                    </template>
                  </div>
                </div>
                <div class="row wrap controls">
                  <button class="btn primary" type="button" :disabled="evaluating" @click="evaluate">
                    <v-icon size="18">mdi-check</v-icon>
                    Check
                  </button>
                  <button class="btn soft" type="button" @click="clearAnswers">
                    <v-icon size="18">mdi-eraser</v-icon>
                    Reset
                  </button>
                  <button class="btn ghost" type="button" @click="fillSolution">
                    <v-icon size="18">mdi-auto-fix</v-icon>
                    Auto-fill
                  </button>
                </div>
                <div v-if="result" class="score">
                  <div class="score-num">{{ result.score }}%</div>
                  <div class="muted small">
                    Fields correct: {{ result.hits }}/{{ activeLesson.fields.length }} · Similarity:
                    {{ Math.round(result.sim * 100) }}%
                  </div>
                </div>
                <div v-if="result" class="field-checks">
                  <div v-for="field in result.fields" :key="field.key" class="field-check" :class="{ ok: field.pass }">
                    <div class="field-name">{{ field.label }}</div>
                    <div class="field-answer">{{ field.answer || '—' }}</div>
                    <div class="field-expected">Expected: {{ field.expected }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="current" class="lesson-actions">
              <div class="lesson-actions-meta">
                <div v-if="nextLessonMeta" class="muted small">
                  Next: {{ nextLessonMeta.lesson.title }} · Lesson {{ nextLessonMeta.position }} of
                  {{ nextLessonMeta.total }}
                </div>
                <div v-else-if="nextMissionMeta" class="muted small">
                  Next mission: {{ nextMissionMeta.module.title }} · Mission {{ nextMissionMeta.position }} of
                  {{ nextMissionMeta.total }}
                </div>
                <div v-else class="muted small">
                  Last lesson in this mission.
                </div>
              </div>
              <div class="lesson-actions-buttons">
                <button class="btn soft" type="button" @click="repeatLesson">
                  <v-icon size="18">mdi-dice-5</v-icon>
                  New scenario
                </button>
                <button
                    class="btn primary"
                    type="button"
                    :disabled="!nextLessonMeta && !nextMissionMeta"
                    @click="goToNextLesson"
                >
                  <v-icon size="18">mdi-arrow-right</v-icon>
                  {{ nextActionLabel }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- PREFLIGHT SETUP -->
    <section v-if="panel==='setup' && missionSetup.module" class="container preflight" aria-label="Mission setup">
      <div class="preflight-head">
        <button class="link" type="button" @click="closeMissionSetup">
          <v-icon size="16">mdi-arrow-left</v-icon>
          Hub
        </button>
        <div class="preflight-title">
          <span class="preflight-subtitle">Mission prep</span>
          <h2 class="h2">{{ missionSetup.module.title }}</h2>
          <p class="muted small">Choose how you want to seed this gate-to-gate scenario.</p>
        </div>
      </div>

      <div class="mode-select">
        <button class="mode-card" :class="{ active: missionSetup.mode==='random' }" type="button" @click="missionSetup.mode='random'">
          <div class="mode-art" style="background-image: url('/img/learn/briefing/preflight-console.png')"></div>
          <div class="mode-copy">
            <h3>Random flight</h3>
            <p>Generate a cohesive training mission across our supported hubs.</p>
          </div>
        </button>
        <button class="mode-card" :class="{ active: missionSetup.mode==='manual' }" type="button" @click="missionSetup.mode='manual'">
          <div class="mode-art" style="background-image: url('/img/learn/briefing/manual-holo.png')"></div>
          <div class="mode-copy">
            <h3>Manual plan</h3>
            <p>Define airline, procedures, and runways yourself.</p>
          </div>
        </button>
        <button class="mode-card" :class="{ active: missionSetup.mode==='simbrief' }" type="button" @click="missionSetup.mode='simbrief'">
          <div class="mode-art" style="background-image: url('/img/learn/briefing/simbrief-sync.png')"></div>
          <div class="mode-copy">
            <h3>SimBrief import</h3>
            <p>Pull your latest SimBrief OFP and fly it here.</p>
          </div>
        </button>
      </div>

      <div class="preflight-body">
        <div v-if="missionSetup.mode==='random'" class="preflight-panel">
          <h3 class="h3">Randomized training flight</h3>
          <p class="muted small">
            We'll chain clearance, taxi, departure, and arrival into one scenario built from your training hubs.
          </p>
          <button class="btn primary" type="button" :disabled="missionSetup.loading" @click="prepareRandomFlight">
            <v-icon size="18" :class="{ spin: missionSetup.loading }">mdi-dice-multiple</v-icon>
            Roll flight
          </button>
        </div>

        <div v-else-if="missionSetup.mode==='manual'" class="preflight-panel">
          <h3 class="h3">Manual mission plan</h3>
          <p class="muted small">Supported hubs: {{ supportedAirportCodes.join(', ') }}</p>
          <div class="form-grid">
            <label class="field">
              <span>Airline</span>
              <select v-model="missionSetup.manual.airlineCode">
                <option v-for="airline in scenarioAirlines" :key="airline.code" :value="airline.code">
                  {{ airline.code }} · {{ airline.call }}
                </option>
              </select>
            </label>
            <label class="field">
              <span>Flight number</span>
              <input v-model="missionSetup.manual.flightNumber" type="text" inputmode="numeric" placeholder="1234"/>
            </label>
            <label class="field">
              <span>Departure</span>
              <select v-model="missionSetup.manual.departure">
                <option v-for="airport in scenarioAirports" :key="airport.icao" :value="airport.icao">
                  {{ airport.icao }} · {{ airport.city }}
                </option>
              </select>
            </label>
            <label class="field">
              <span>Destination</span>
              <select v-model="missionSetup.manual.destination">
                <option v-for="airport in scenarioAirports" :key="airport.icao" :value="airport.icao">
                  {{ airport.icao }} · {{ airport.city }}
                </option>
              </select>
            </label>
            <label class="field">
              <span>Runway</span>
              <select v-model="missionSetup.manual.runway">
                <option v-for="runway in manualDepartureOptions.runways" :key="runway" :value="runway">{{ runway }}</option>
              </select>
            </label>
            <label class="field">
              <span>Stand</span>
              <select v-model="missionSetup.manual.stand">
                <option v-for="stand in manualDepartureOptions.stands" :key="stand" :value="stand">{{ stand }}</option>
              </select>
            </label>
            <label class="field">
              <span>SID</span>
              <select v-model="missionSetup.manual.sid">
                <option v-for="sid in manualDepartureOptions.sids" :key="sid" :value="sid">{{ sid }}</option>
              </select>
            </label>
            <label class="field">
              <span>Transition</span>
              <select v-model="missionSetup.manual.transition">
                <option v-for="transition in manualDepartureOptions.transitions" :key="transition" :value="transition">{{ transition }}</option>
              </select>
            </label>
            <label class="field">
              <span>Arrival runway</span>
              <select v-model="missionSetup.manual.arrivalRunway">
                <option v-for="runway in manualDestinationOptions.runways" :key="runway" :value="runway">{{ runway }}</option>
              </select>
            </label>
            <label class="field">
              <span>Arrival stand</span>
              <select v-model="missionSetup.manual.arrivalStand">
                <option v-for="stand in manualDestinationOptions.stands" :key="stand" :value="stand">{{ stand }}</option>
              </select>
            </label>
            <label class="field">
              <span>STAR</span>
              <select v-model="missionSetup.manual.arrivalStar">
                <option v-for="star in manualDestinationOptions.stars" :key="star" :value="star">{{ star }}</option>
              </select>
            </label>
            <label class="field">
              <span>Arrival transition</span>
              <select v-model="missionSetup.manual.arrivalTransition">
                <option v-for="transition in manualDestinationOptions.transitions" :key="transition" :value="transition">{{ transition }}</option>
              </select>
            </label>
            <label class="field">
              <span>Approach</span>
              <select v-model="missionSetup.manual.approach">
                <option v-for="approach in manualDestinationOptions.approaches" :key="approach" :value="approach">{{ approach }}</option>
              </select>
            </label>
            <label class="field full">
              <span>Taxi route (optional)</span>
              <input v-model="missionSetup.manual.taxiRoute" type="text" placeholder="e.g. N3 U4" />
            </label>
            <label class="field full">
              <span>Arrival taxi (optional)</span>
              <input v-model="missionSetup.manual.arrivalTaxiRoute" type="text" placeholder="e.g. S N7" />
            </label>
          </div>
          <div class="preflight-actions">
            <button class="btn primary" type="button" :disabled="!manualFlightReady" @click="prepareManualFlight">
              <v-icon size="18">mdi-send-check</v-icon>
              Build mission
            </button>
          </div>
        </div>

        <div v-else class="preflight-panel">
          <h3 class="h3">SimBrief integration</h3>
          <p class="muted small">Fetch your latest OFP from <a href="https://www.simbrief.com/home/" target="_blank" rel="noopener" class="simbrief-link">simbrief.com</a>.</p>
          <div class="simbrief-input">
            <label class="field">
              <span>SimBrief ID</span>
              <input v-model="missionSetup.simbrief.userId" type="text" placeholder="Username or ID" />
            </label>
            <button class="btn primary" type="button" :disabled="missionSetup.simbrief.loading" @click="prepareSimbriefFlight">
              <v-icon size="18" :class="{ spin: missionSetup.simbrief.loading }">mdi-cloud-download</v-icon>
              {{ missionSetup.simbrief.loading ? 'Loading' : 'Fetch plan' }}
            </button>
          </div>
          <p class="muted tiny">Only flights using {{ supportedAirportCodes.join(', ') }} are supported for now.</p>
        </div>
      </div>

      <div v-if="missionSetup.error" class="preflight-error">{{ missionSetup.error }}</div>
      <div v-if="missionSetup.simbrief.error" class="preflight-error">{{ missionSetup.simbrief.error }}</div>

      <div v-if="missionSetup.preview" class="preflight-preview">
        <div class="preview-header">
          <div class="preview-title">
            <span class="preview-badge">{{ missionSourceLabels[missionSetup.preview.source] }}</span>
            <h3>{{ missionSetup.preview.summary.callsign }}</h3>
            <p class="muted small">{{ missionSetup.preview.summary.radioCall }}</p>
          </div>
          <button class="btn ghost mini" type="button" @click="clearMissionPreview">
            <v-icon size="16">mdi-refresh</v-icon>
            Reset
          </button>
        </div>
        <div class="preview-route">{{ missionSetup.preview.summary.route }}</div>
        <div class="preview-grid">
          <div class="preview-card">
            <span class="preview-label">Departure</span>
            <div class="preview-main">{{ missionSetup.preview.summary.departure.icao }} · {{ missionSetup.preview.summary.departure.runway }}</div>
            <span class="preview-sub">Stand {{ missionSetup.preview.summary.departure.stand }} · Taxi {{ missionSetup.preview.summary.departure.taxi }}</span>
          </div>
          <div class="preview-card">
            <span class="preview-label">Arrival</span>
            <div class="preview-main">{{ missionSetup.preview.summary.arrival.icao }} · {{ missionSetup.preview.summary.arrival.runway }}</div>
            <span class="preview-sub">Stand {{ missionSetup.preview.summary.arrival.stand }} · Taxi {{ missionSetup.preview.summary.arrival.taxi }}</span>
          </div>
          <div class="preview-card" v-if="missionSetup.preview.summary.sid || missionSetup.preview.summary.star">
            <span class="preview-label">Procedures</span>
            <div class="preview-main" v-if="missionSetup.preview.summary.sid">SID {{ missionSetup.preview.summary.sid }}</div>
            <div class="preview-main" v-if="missionSetup.preview.summary.star">STAR {{ missionSetup.preview.summary.star }}</div>
          </div>
          <div class="preview-card" v-if="missionSetup.preview.summary.approach">
            <span class="preview-label">Approach</span>
            <div class="preview-main">{{ missionSetup.preview.summary.approach }}</div>
          </div>
        </div>
        <div class="preview-meta" v-if="missionSetup.preview.metadata">
          <span v-for="(value, key) in missionSetup.preview.metadata" :key="key" class="meta-chip">{{ key }}: {{ value }}</span>
        </div>
        <div class="preview-actions">
          <button class="btn primary" type="button" @click="confirmMissionSelection">
            <v-icon size="18">mdi-check</v-icon>
            Continue to briefing
          </button>
        </div>
      </div>
    </section>

    <!-- MISSION BRIEFING -->
    <section v-if="panel==='briefing' && missionBriefing.module && missionBriefing.context" class="container mission-briefing" aria-label="Mission briefing">
      <div class="briefing-head">
        <button class="link" type="button" @click="closeMissionBriefing">
          <v-icon size="16">mdi-arrow-left</v-icon>
          Hub
        </button>
        <div class="briefing-title">
          <span class="preview-badge">{{ missionSourceLabels[missionBriefing.context.source] }}</span>
          <h2 class="h2">{{ missionBriefing.module.title }}</h2>
          <p class="muted small">{{ missionBriefing.module.subtitle }}</p>
        </div>
      </div>
      <div class="briefing-body">
        <div class="briefing-overview">
          <div class="overview-card">
            <span class="overview-label">Callsign</span>
            <div class="overview-value">{{ missionBriefing.context.summary.callsign }}</div>
            <span class="overview-sub">{{ missionBriefing.context.summary.radioCall }}</span>
          </div>
          <div class="overview-card">
            <span class="overview-label">Route</span>
            <div class="overview-value">{{ missionBriefing.context.summary.route }}</div>
          </div>
          <div class="overview-card" v-if="missionBriefing.context.summary.remarks">
            <span class="overview-label">Remarks</span>
            <div class="overview-value">{{ missionBriefing.context.summary.remarks }}</div>
          </div>
          <div class="overview-meta" v-if="missionBriefing.context.metadata">
            <span v-for="(value, key) in missionBriefing.context.metadata" :key="key" class="meta-chip">{{ key }}: {{ value }}</span>
          </div>
        </div>
        <div class="briefing-grid">
          <div class="briefing-card">
            <h3>Departure</h3>
            <p class="muted small">{{ missionBriefing.context.summary.departure.name }} · {{ missionBriefing.context.summary.departure.city }}</p>
            <ul class="briefing-list">
              <li><strong>Runway</strong> {{ missionBriefing.context.summary.departure.runway }}</li>
              <li><strong>Stand</strong> {{ missionBriefing.context.summary.departure.stand }}</li>
              <li><strong>Taxi</strong> {{ missionBriefing.context.summary.departure.taxi }}</li>
              <li v-if="missionBriefing.context.summary.sid"><strong>SID</strong> {{ missionBriefing.context.summary.sid }}</li>
              <li v-if="missionBriefing.context.summary.transition"><strong>Transition</strong> {{ missionBriefing.context.summary.transition }}</li>
            </ul>
          </div>
          <div class="briefing-card">
            <h3>Arrival</h3>
            <p class="muted small">{{ missionBriefing.context.summary.arrival.name }} · {{ missionBriefing.context.summary.arrival.city }}</p>
            <ul class="briefing-list">
              <li><strong>Runway</strong> {{ missionBriefing.context.summary.arrival.runway }}</li>
              <li><strong>Stand</strong> {{ missionBriefing.context.summary.arrival.stand }}</li>
              <li><strong>Taxi</strong> {{ missionBriefing.context.summary.arrival.taxi }}</li>
              <li v-if="missionBriefing.context.summary.star"><strong>STAR</strong> {{ missionBriefing.context.summary.star }}</li>
              <li v-if="missionBriefing.context.summary.arrivalTransition"><strong>Transition</strong> {{ missionBriefing.context.summary.arrivalTransition }}</li>
              <li v-if="missionBriefing.context.summary.approach"><strong>Approach</strong> {{ missionBriefing.context.summary.approach }}</li>
            </ul>
          </div>
        </div>
      </div>
      <div class="briefing-art" style="background-image: url('/img/learn/briefing/mission-brief.png')"></div>
      <div class="briefing-actions">
        <button class="btn ghost" type="button" @click="openMissionSetup(missionBriefing.module, missionBriefing.context.source)">
          <v-icon size="18">mdi-tune</v-icon>
          Change flight
        </button>
        <button class="btn soft" type="button" @click="closeMissionBriefing">
          <v-icon size="18">mdi-arrow-left</v-icon>
          Back
        </button>
        <button class="btn primary" type="button" @click="startMissionFromBriefing">
          <v-icon size="18">mdi-play</v-icon>
          Start mission
        </button>
      </div>
    </section>


    <!-- NEXT OBJECTIVE -->
    <div class="container" v-if="panel==='hub'">
      <h2 class="h2">Your progress</h2>
      <p class="muted">
        Level up by completing lessons and missions. Earn badges as you improve your pilot readbacks.
      </p>
      <div class="hero-highlight" role="region" aria-label="Next objective">
        <div class="hero-orb" :style="{ '--progress': levelProgress + '%' }">
          <div class="hero-orb-core">
            <span class="hero-orb-level">Lvl {{ level }}</span>
            <span class="hero-orb-progress">{{ levelProgress }}%</span>
          </div>
        </div>
        <div class="hero-highlight-meta">
          <span class="hero-tag">Next objective</span>
          <div class="hero-highlight-title">
            {{ primaryObjective ? primaryObjective.title : 'Choose a mission to begin' }}
          </div>
          <p class="muted small">
            {{
              primaryObjective
                  ? primaryObjective.description
                  : 'Open any mission below to start your first readback drills.'
            }}
          </p>
          <div
              v-if="primaryObjective"
              class="hero-highlight-bar"
              role="progressbar"
              :aria-valuenow="primaryObjectiveProgress"
              aria-valuemin="0"
              aria-valuemax="100"
          >
            <div class="hero-highlight-fill" :style="{ width: primaryObjectiveProgress + '%' }"></div>
          </div>
          <p v-if="primaryObjective" class="muted small">{{ primaryObjective.status }}</p>
        </div>
      </div>
    </div>

    <!-- FOOTER -->
    <footer class="footer" role="contentinfo">
      <div class="container">

        <div class="footer-right">
          <span class="muted small">&copy; 2024 OpenSquawk. All rights reserved.</span>
        </div>
      </div>
    </footer>

    <!-- SETTINGS DIALOG -->
    <v-dialog v-model="showSettings" max-width="720">
      <div class="panel dialog">
        <h3 class="h3">ATC settings</h3>

        <div class="settings">
          <div class="set-row">
            <div class="set-info">
              <span>Browser TTS (Web Speech)</span>
              <small class="muted">Runs offline, starts faster, and saves our API calls.</small>
            </div>
            <v-switch v-model="cfg.tts" color="cyan" hide-details inset/>
          </div>

          <div class="set-row">
            <div class="set-info">
              <span>Audio challenge</span>
              <small class="muted">Hides target text & info until you reveal it manually.</small>
            </div>
            <v-switch v-model="cfg.audioChallenge" color="cyan" hide-details inset/>
          </div>

          <div class="set-row">
            <div class="set-info">
              <span>Radio level (1..5)</span>
              <small class="muted">Simulate readability from barely readable to loud and clear.</small>
            </div>
            <v-slider
                hide-details
                v-model="cfg.radioLevel"
                :min="1"
                :max="5"
                :step="1"
                color="cyan"
                thumb-label
            />
          </div>

          <div class="set-row">
            <div class="set-info">
              <span>ATC speaking speed</span>
              <small class="muted">{{ audioSpeedDisplay }}× — slow practice to rapid live traffic.</small>
            </div>
            <v-slider
                hide-details
                v-model="cfg.audioSpeed"
                :min="0.7"
                :max="1.3"
                :step="0.05"
                color="cyan"
                thumb-label
            />
          </div>

          <div class="set-row">
            <span>Test TTS</span>
            <div class="row">
              <button class="btn soft" @click="say('Frankfurt Ground, Lufthansa one two three, request taxi.')">
                <v-icon>mdi-volume-high</v-icon>
                Test
              </button>
              <button class="btn ghost" @click="stopAudio">
                <v-icon>mdi-stop</v-icon>
                Stop
              </button>
            </div>
          </div>

          <div class="set-row reset-row">
            <div class="set-info">
              <span>Reset training data</span>
              <small class="muted">Clears XP, progress, and local settings on this device.</small>
            </div>
            <button class="btn ghost" type="button" @click="resetAll">
              <v-icon size="18">mdi-refresh</v-icon>
              Reset
            </button>
          </div>
        </div>

        <div class="row end">
          <button class="btn soft" @click="showSettings=false">Close</button>
        </div>
      </div>
    </v-dialog>

    <!-- TOAST -->
    <v-snackbar v-model="toast.show" timeout="2200" location="top" color="#22d3ee">
      <v-icon class="mr-2">mdi-trophy</v-icon>
      {{ toast.text }}
    </v-snackbar>
  </div>
</template>


<script setup lang="ts">
import {computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, shallowRef, watch} from 'vue'
import {useApi} from '~/composables/useApi'
import {createDefaultLearnConfig} from '~~/shared/learn/config'
import type {LearnConfig, LearnProgress, LearnState} from '~~/shared/learn/config'
import {learnModules, primeFullFlightScenario, clearFullFlightScenario} from '~~/shared/data/learnModules'
import {createBaseScenario, getScenarioAirport, listScenarioAirlines, listScenarioAirports} from '~~/shared/learn/scenario'
import type {ScenarioOverrides} from '~~/shared/learn/scenario'
import type {BlankWidth, Frequency, Lesson, LessonField, ModuleDef, MissionContext, MissionSource, Scenario} from '~~/shared/learn/types'
import {loadPizzicatoLite} from '~~/shared/utils/pizzicatoLite'
import type {PizzicatoLite} from '~~/shared/utils/pizzicatoLite'
import {createNoiseGenerators, getReadabilityProfile} from '~~/shared/utils/radioEffects'

definePageMeta({middleware: 'require-auth'})

type Objective = {
  id: string
  title: string
  description: string
  progress: number
  goal: number
  status: string
  icon: string
  complete: boolean
  moduleId?: string
}

type FieldState = {
  key: string
  label: string
  expected: string
  answer: string
  similarity: number
  pass: boolean
}

type ScoreResult = {
  score: number
  hits: number
  sim: number
  passed: boolean
  fields: FieldState[]
}

type PanelView = 'hub' | 'module' | 'setup' | 'briefing'

function norm(value: string): string {
  return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[^a-z0-9 ]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
}

function lev(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m
  const dp = new Array(n + 1).fill(0)
  for (let j = 0; j <= n; j++) dp[j] = j
  for (let i = 1; i <= m; i++) {
    let prev = dp[0]
    dp[0] = i
    for (let j = 1; j <= n; j++) {
      const temp = dp[j]
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost)
      prev = temp
    }
  }
  return dp[n]
}

function similarity(a: string, b: string): number {
  if (!a && !b) return 1
  const normA = norm(a)
  const normB = norm(b)
  if (!normA && !normB) return 1
  const distance = lev(normA, normB)
  const maxLen = Math.max(normA.length, normB.length, 1)
  return 1 - distance / maxLen
}

const modules = shallowRef<ModuleDef[]>(learnModules)

const panel = ref<PanelView>('hub')
const setupReturnPanel = ref<PanelView>('hub')
const briefingReturnPanel = ref<PanelView>('hub')
const current = ref<ModuleDef | null>(null)
const activeLesson = ref<Lesson | null>(null)
const scenario = ref<Scenario | null>(null)
const hasSpokenTarget = ref(false)
const pendingAutoSay = ref(false)
const activeFrequency = ref<Frequency | null>(null)
const userAnswers = reactive<Record<string, string>>({})
const result = ref<ScoreResult | null>(null)
const evaluating = ref(false)
const ttsLoading = ref(false)
const audioElement = ref<HTMLAudioElement | null>(null)
let speechContext: AudioContext | null = null
let pizzicatoLiteInstance: PizzicatoLite | null = null
type RadioSoundInstance = Awaited<ReturnType<PizzicatoLite['createSoundFromBase64']>>
let activeRadioSound: RadioSoundInstance | null = null
let activeRadioCleanup: Array<() => void> = []
let radioNoiseContext: AudioContext | null = null
let radioNoiseSource: AudioBufferSourceNode | null = null
type CachedAudio = { base64: string; mime?: string; model?: string | null; speed?: number }
const sayCache = new Map<string, CachedAudio>()
const pendingSayRequests = new Map<string, Promise<CachedAudio>>()
const audioReveal = ref(true)

const toast = ref({show: false, text: ''})
const showSettings = ref(false)
const api = useApi()

const scenarioAirports = listScenarioAirports()
const scenarioAirlines = listScenarioAirlines()
const supportedAirportCodes = scenarioAirports.map(airport => airport.icao)
const supportedAirportsLabel = supportedAirportCodes.join(', ')

const missionGeneratorControls: Record<string, { prime?: (scenario: Scenario) => void; clear?: () => void }> = {
  'full-flight': {
    prime: scenario => primeFullFlightScenario(scenario),
    clear: () => clearFullFlightScenario(),
  },
}

const missionSourceLabels: Record<MissionSource, string> = {
  random: 'Training Generator',
  manual: 'Manual Plan',
  simbrief: 'SimBrief OFP',
}

const missionBriefing = reactive<{ module: ModuleDef | null; context: MissionContext | null }>({
  module: null,
  context: null,
})

const missionSetup = reactive({
  module: null as ModuleDef | null,
  mode: 'random' as MissionSource,
  preview: null as MissionContext | null,
  loading: false,
  error: '',
  manual: {
    airlineCode: scenarioAirlines[0]?.code || '',
    flightNumber: '',
    departure: scenarioAirports[0]?.icao || '',
    destination: scenarioAirports[1]?.icao || scenarioAirports[0]?.icao || '',
    runway: '',
    stand: '',
    taxiRoute: '',
    sid: '',
    transition: '',
    arrivalRunway: '',
    arrivalStand: '',
    arrivalTaxiRoute: '',
    arrivalStar: '',
    arrivalTransition: '',
    approach: '',
  },
  simbrief: {
    userId: '',
    loading: false,
    error: '',
    meta: null as Record<string, string> | null,
  },
})

const tilesScroller = ref<HTMLDivElement | null>(null)
const tileRefs = new Map<string, HTMLElement>()
const tileScrollState = reactive({ left: false, right: false })

const manualDepartureData = computed(() => getScenarioAirport(missionSetup.manual.departure))
const manualDestinationData = computed(() => getScenarioAirport(missionSetup.manual.destination))

const manualDepartureOptions = computed(() => {
  const airport = manualDepartureData.value
  return {
    runways: airport?.runways ?? [],
    stands: airport?.stands ?? [],
    taxi: airport?.taxi ?? [],
    sids: airport?.sids ?? [],
    transitions: airport?.transitions ?? [],
  }
})

const manualDestinationOptions = computed(() => {
  const airport = manualDestinationData.value
  const taxi = airport?.taxiIn && airport.taxiIn.length ? airport.taxiIn : airport?.taxi ?? []
  const stars = airport?.stars && airport.stars.length ? airport.stars : airport?.sids ?? []
  const transitions = airport?.arrivalTransitions && airport.arrivalTransitions.length ? airport.arrivalTransitions : airport?.transitions ?? []
  return {
    runways: airport?.runways ?? [],
    stands: airport?.stands ?? [],
    taxi,
    stars,
    transitions,
    approaches: airport?.approaches ?? [],
  }
})

function syncManualDeparture() {
  const airport = manualDepartureData.value
  if (!airport) return
  if (!airport.runways.includes(missionSetup.manual.runway)) {
    missionSetup.manual.runway = airport.runways[0] || ''
  }
  if (!airport.stands.includes(missionSetup.manual.stand)) {
    missionSetup.manual.stand = airport.stands[0] || ''
  }
  if (!airport.taxi.includes(missionSetup.manual.taxiRoute)) {
    missionSetup.manual.taxiRoute = airport.taxi[0] || ''
  }
  if (!airport.sids.includes(missionSetup.manual.sid)) {
    missionSetup.manual.sid = airport.sids[0] || ''
  }
  if (!airport.transitions.includes(missionSetup.manual.transition)) {
    missionSetup.manual.transition = airport.transitions[0] || ''
  }
}

function syncManualArrival() {
  const airport = manualDestinationData.value
  if (!airport) return
  if (!airport.runways.includes(missionSetup.manual.arrivalRunway)) {
    missionSetup.manual.arrivalRunway = airport.runways[0] || ''
  }
  if (!airport.stands.includes(missionSetup.manual.arrivalStand)) {
    missionSetup.manual.arrivalStand = airport.stands[0] || ''
  }
  const taxiOptions = airport.taxiIn && airport.taxiIn.length ? airport.taxiIn : airport.taxi
  if (!taxiOptions.includes(missionSetup.manual.arrivalTaxiRoute)) {
    missionSetup.manual.arrivalTaxiRoute = taxiOptions[0] || ''
  }
  const starOptions = airport.stars && airport.stars.length ? airport.stars : airport.sids
  if (!starOptions.includes(missionSetup.manual.arrivalStar)) {
    missionSetup.manual.arrivalStar = starOptions[0] || ''
  }
  const transitionOptions = airport.arrivalTransitions && airport.arrivalTransitions.length
    ? airport.arrivalTransitions
    : airport.transitions
  if (!transitionOptions.includes(missionSetup.manual.arrivalTransition)) {
    missionSetup.manual.arrivalTransition = transitionOptions[0] || ''
  }
  if (!airport.approaches.includes(missionSetup.manual.approach)) {
    missionSetup.manual.approach = airport.approaches[0] || ''
  }
}

function prefillManualFromScenario(seed: Scenario) {
  missionSetup.manual.airlineCode = seed.airlineCode
  missionSetup.manual.flightNumber = seed.flightNumber
  missionSetup.manual.departure = seed.airport.icao
  missionSetup.manual.destination = seed.destination.icao
  missionSetup.manual.runway = seed.runway
  missionSetup.manual.stand = seed.stand
  missionSetup.manual.taxiRoute = seed.taxiRoute
  missionSetup.manual.sid = seed.sid
  missionSetup.manual.transition = seed.transition
  missionSetup.manual.arrivalRunway = seed.arrivalRunway
  missionSetup.manual.arrivalStand = seed.arrivalStand
  missionSetup.manual.arrivalTaxiRoute = seed.arrivalTaxiRoute
  missionSetup.manual.arrivalStar = seed.arrivalStar
  missionSetup.manual.arrivalTransition = seed.arrivalTransition
  missionSetup.manual.approach = seed.approach
  syncManualDeparture()
  syncManualArrival()
}

watch(() => missionSetup.manual.departure, value => {
  if (missionSetup.manual.destination === value) {
    const fallback = scenarioAirports.find(airport => airport.icao !== value)
    if (fallback) {
      missionSetup.manual.destination = fallback.icao
    }
  }
  syncManualDeparture()
})

watch(() => missionSetup.manual.destination, () => {
  syncManualArrival()
})

syncManualDeparture()
syncManualArrival()

const manualFlightReady = computed(() => {
  return Boolean(
    missionSetup.manual.airlineCode &&
    missionSetup.manual.flightNumber.trim() &&
    manualDepartureData.value &&
    manualDestinationData.value &&
    missionSetup.manual.runway &&
    missionSetup.manual.arrivalRunway
  )
})

watch(() => missionSetup.mode, () => {
  missionSetup.error = ''
  missionSetup.simbrief.error = ''
  if (missionSetup.mode !== 'simbrief') {
    missionSetup.simbrief.loading = false
  }
  clearMissionPreview()
})

function ensureMissionContextStore(): Record<string, MissionContext> {
  if (!cfg.value.missionContexts) {
    cfg.value = { ...cfg.value, missionContexts: {} as Record<string, MissionContext> }
  }
  return cfg.value.missionContexts
}

function cloneMissionContext(input: MissionContext): MissionContext {
  return {
    source: input.source,
    scenario: JSON.parse(JSON.stringify(input.scenario)) as Scenario,
    summary: JSON.parse(JSON.stringify(input.summary)) as MissionContext['summary'],
    updatedAt: input.updatedAt,
    ...(input.metadata ? { metadata: JSON.parse(JSON.stringify(input.metadata)) as Record<string, unknown> } : {}),
  }
}

function setMissionContext(modId: string, context: MissionContext | null) {
  const store = ensureMissionContextStore()
  const nextStore: Record<string, MissionContext> = { ...store }
  const control = missionGeneratorControls[modId]

  if (context) {
    nextStore[modId] = cloneMissionContext(context)
    control?.prime?.(context.scenario)
  } else {
    delete nextStore[modId]
    control?.clear?.()
  }

  cfg.value = { ...cfg.value, missionContexts: nextStore }
  markConfigDirty()
}

function getMissionContext(modId: string): MissionContext | null {
  const store = cfg.value.missionContexts || {}
  return store[modId] || null
}

const currentMissionContext = computed(() => {
  const module = current.value
  if (!module) return null
  return getMissionContext(module.id)
})

function applyMissionContextGenerators() {
  const store = cfg.value.missionContexts || {}
  for (const [moduleId, context] of Object.entries(store)) {
    if (context?.scenario) {
      missionGeneratorControls[moduleId]?.prime?.(context.scenario)
    }
  }
}

function buildMissionContext(
  seed: Scenario,
  source: MissionSource,
  metadata?: Record<string, string | undefined>,
): MissionContext {
  const departureTaxi = seed.taxiRoute || 'Assigned'
  const arrivalTaxi = seed.arrivalTaxiRoute || 'Assigned'
  const summary = {
    callsign: seed.callsign,
    radioCall: seed.radioCall,
    route: `${seed.airport.icao}/${seed.runway} → ${seed.destination.icao}/${seed.arrivalRunway}`,
    departure: {
      icao: seed.airport.icao,
      name: seed.airport.name,
      city: seed.airport.city,
      runway: seed.runway,
      stand: seed.stand,
      taxi: departureTaxi,
    },
    arrival: {
      icao: seed.destination.icao,
      name: seed.destination.name,
      city: seed.destination.city,
      runway: seed.arrivalRunway,
      stand: seed.arrivalStand,
      taxi: arrivalTaxi,
    },
    sid: seed.sid,
    transition: seed.transition,
    star: seed.arrivalStar,
    arrivalTransition: seed.arrivalTransition,
    approach: seed.approach,
    remarks: metadata?.remarks?.trim() || undefined,
  }

  const cleanedMetadata = metadata
    ? Object.fromEntries(
        Object.entries(metadata)
          .filter(([, value]) => typeof value === 'string' && value && value.trim())
          .map(([key, value]) => [key, (value as string).trim()]),
      )
    : undefined

  return {
    source,
    scenario: seed,
    summary,
    updatedAt: new Date().toISOString(),
    ...(cleanedMetadata && Object.keys(cleanedMetadata).length ? { metadata: cleanedMetadata } : {}),
  }
}

function moduleRequiresContext(modId: string): boolean {
  const module = modules.value.find(item => item.id === modId)
  return Boolean(module?.requiresFlightContext)
}

function registerTile(element: Element | null, id: string) {
  if (!element) {
    tileRefs.delete(id)
    return
  }
  tileRefs.set(id, element as HTMLElement)
}

function updateTileScrollState() {
  const scroller = tilesScroller.value
  if (!scroller) return
  const maxScroll = scroller.scrollWidth - scroller.clientWidth
  tileScrollState.left = scroller.scrollLeft > 12
  tileScrollState.right = scroller.scrollLeft < maxScroll - 12
}

function scrollModuleIntoView(id: string, behavior: ScrollBehavior = 'smooth') {
  const scroller = tilesScroller.value
  const tile = tileRefs.get(id)
  if (!scroller || !tile) return
  const target = tile.offsetLeft - scroller.clientWidth / 2 + tile.offsetWidth / 2
  scroller.scrollTo({ left: Math.max(0, target), behavior })
}

function clearMissionPreview() {
  missionSetup.preview = null
  missionSetup.error = ''
  missionSetup.simbrief.error = ''
  missionSetup.simbrief.meta = null
}

function openMissionSetup(module: ModuleDef, mode?: MissionSource) {
  setupReturnPanel.value = panel.value
  missionSetup.module = module
  missionSetup.mode = mode ?? missionSetup.mode ?? 'random'
  missionSetup.loading = false
  missionSetup.error = ''
  missionSetup.simbrief.error = ''
  missionSetup.simbrief.loading = false
  missionSetup.simbrief.meta = null

  const existing = getMissionContext(module.id)
  missionSetup.preview = existing ? cloneMissionContext(existing) : null
  if (existing) {
    missionSetup.simbrief.meta = (existing.metadata as Record<string, string>) || null
    prefillManualFromScenario(existing.scenario)
  }

  panel.value = 'setup'
}

function closeMissionSetup() {
  missionSetup.module = null
  clearMissionPreview()
  panel.value = setupReturnPanel.value === 'module' ? 'module' : 'hub'
}

function showMissionBriefing(module: ModuleDef, context: MissionContext) {
  briefingReturnPanel.value = panel.value
  missionBriefing.module = module
  missionBriefing.context = cloneMissionContext(context)
  current.value = module
  activeLesson.value = null
  panel.value = 'briefing'
}

function closeMissionBriefing() {
  missionBriefing.module = null
  missionBriefing.context = null
  panel.value = briefingReturnPanel.value === 'module' ? 'module' : 'hub'
}

function startMissionFromBriefing() {
  const module = missionBriefing.module
  if (!module) return
  quickContinue(module.id)
}

function openMissionBriefingFromModule() {
  if (!current.value) return
  const context = getMissionContext(current.value.id)
  if (context) {
    showMissionBriefing(current.value, context)
  } else {
    openMissionSetup(current.value)
  }
}

function openMissionSetupFromModule() {
  if (!current.value) return
  openMissionSetup(current.value)
}

function prepareRandomFlight() {
  missionSetup.loading = true
  try {
    const scenario = createBaseScenario()
    missionSetup.preview = buildMissionContext(scenario, 'random', { remarks: 'Generated training flight' })
    missionSetup.error = ''
    missionSetup.simbrief.meta = null
  } finally {
    missionSetup.loading = false
  }
}

function prepareManualFlight() {
  if (!manualFlightReady.value) {
    missionSetup.error = 'Bitte alle Pflichtfelder ausfüllen.'
    return
  }

  missionSetup.error = ''
  missionSetup.simbrief.error = ''

  const overrides: ScenarioOverrides = {
    airlineCode: missionSetup.manual.airlineCode,
    flightNumber: missionSetup.manual.flightNumber,
    departureIcao: missionSetup.manual.departure,
    destinationIcao: missionSetup.manual.destination,
    runway: missionSetup.manual.runway,
    stand: missionSetup.manual.stand,
    taxiRoute: missionSetup.manual.taxiRoute,
    sid: missionSetup.manual.sid,
    transition: missionSetup.manual.transition,
    arrivalRunway: missionSetup.manual.arrivalRunway,
    arrivalStand: missionSetup.manual.arrivalStand,
    arrivalTaxiRoute: missionSetup.manual.arrivalTaxiRoute,
    arrivalStar: missionSetup.manual.arrivalStar,
    arrivalTransition: missionSetup.manual.arrivalTransition,
    approach: missionSetup.manual.approach,
  }

  const scenario = createBaseScenario(overrides)

  if (
    scenario.airport.icao !== missionSetup.manual.departure ||
    scenario.destination.icao !== missionSetup.manual.destination
  ) {
    missionSetup.error = `Aktuell werden nur Trainingsflughäfen (${supportedAirportsLabel}) unterstützt.`
    missionSetup.preview = null
    return
  }

  prefillManualFromScenario(scenario)
  missionSetup.preview = buildMissionContext(scenario, 'manual', { remarks: 'Custom flight plan' })
  missionSetup.simbrief.meta = null
}

type ParsedSimbriefPlan = {
  overrides: ScenarioOverrides
  metadata: Record<string, string>
}

function parseSimbriefResponse(payload: unknown): ParsedSimbriefPlan | null {
  if (!payload || typeof payload !== 'object') return null
  const ofp = (payload as any).OFP || (payload as any).ofp
  if (!ofp || typeof ofp !== 'object') return null

  const toString = (value: unknown): string | undefined => {
    if (typeof value !== 'string') return undefined
    const trimmed = value.trim()
    return trimmed || undefined
  }

  const departure = toString(ofp.origin_icao ?? ofp.origin ?? ofp.departure)
  const destination = toString(ofp.destination_icao ?? ofp.destination ?? ofp.dest)
  if (!departure || !destination) return null

  const overrides: ScenarioOverrides = {
    departureIcao: departure,
    destinationIcao: destination,
    airlineCode: toString(ofp.airline_icao ?? ofp.icao_airline ?? ofp.airline),
    flightNumber: toString(ofp.flight_number ?? ofp.fltno ?? ofp.flightnum),
    callsign: toString(ofp.atc_callsign ?? ofp.callsign),
    radioTelephony: toString(ofp.atc_airline ?? ofp.callsign_name ?? ofp.callsign_voice),
    radioCall: toString(ofp.atc_cleared_call ?? ofp.atc_call),
    runway: toString(ofp.plan_rwy ?? ofp.plan_rwy_dep ?? ofp.plan_rwy_departure),
    arrivalRunway: toString(ofp.plan_rwy_arrival ?? ofp.plan_rwy_arr ?? ofp.plan_arrival_rwy),
    sid: toString(ofp.plan_sid ?? ofp.sid),
    transition: toString(ofp.plan_transition ?? ofp.sid_transition),
    arrivalStar: toString(ofp.plan_star ?? ofp.star),
    arrivalTransition: toString(ofp.plan_star_transition ?? ofp.star_transition),
    approach: toString(ofp.plan_approach ?? ofp.approach),
  }

  const metadata: Record<string, string> = {}
  const route = toString(ofp.route ?? ofp.plan_route ?? ofp.atc_route)
  if (route) metadata.route = route
  const ete = toString(ofp.ete ?? ofp.est_time_enroute)
  if (ete) metadata.ete = ete
  const cruise = toString(ofp.initial_altitude ?? ofp.cruise_altitude)
  if (cruise) metadata.cruise = cruise
  const aircraft = toString(ofp.aircraft_icao ?? ofp.aircraft_type ?? ofp.icao_aircraft)
  if (aircraft) metadata.aircraft = aircraft
  const dispatcher = toString(ofp.dispatcher ?? ofp.username)
  if (dispatcher) metadata.dispatcher = dispatcher
  const remarks = toString(ofp.remarks)
  if (remarks) metadata.remarks = remarks

  return { overrides, metadata }
}

async function prepareSimbriefFlight() {
  if (!isClient) {
    missionSetup.simbrief.error = 'SimBrief kann nur im Browser geladen werden.'
    return
  }

  const userId = missionSetup.simbrief.userId.trim()
  if (!userId) {
    missionSetup.simbrief.error = 'Bitte SimBrief-ID eingeben.'
    return
  }

  missionSetup.simbrief.loading = true
  missionSetup.simbrief.error = ''
  missionSetup.error = ''

  try {
    const response = await fetch(`https://www.simbrief.com/api/xml.fetcher.php?userid=${encodeURIComponent(userId)}&json=1`)
    if (!response.ok) {
      throw new Error('SimBrief request failed')
    }
    const payload = await response.json()
    const parsed = parseSimbriefResponse(payload)
    if (!parsed) {
      missionSetup.simbrief.error = 'Kein aktueller Flugplan gefunden.'
      missionSetup.preview = null
      return
    }

    const scenario = createBaseScenario(parsed.overrides)
    const requestedDeparture = parsed.overrides.departureIcao?.toUpperCase()
    const requestedDestination = parsed.overrides.destinationIcao?.toUpperCase()

    if (!requestedDeparture || !requestedDestination) {
      missionSetup.simbrief.error = 'Der Flugplan enthält unvollständige Daten.'
      missionSetup.preview = null
      return
    }

    if (scenario.airport.icao !== requestedDeparture || scenario.destination.icao !== requestedDestination) {
      missionSetup.simbrief.error = `Dieser Flugplan nutzt Flughäfen außerhalb unserer Trainingshubs (${supportedAirportsLabel}).`
      missionSetup.preview = null
      return
    }

    const adjustments: string[] = []
    if (parsed.overrides.runway && scenario.runway !== parsed.overrides.runway.toUpperCase()) {
      adjustments.push('Abflugbahn an lokale Trainingsdaten angepasst.')
    }
    if (parsed.overrides.arrivalRunway && scenario.arrivalRunway !== parsed.overrides.arrivalRunway.toUpperCase()) {
      adjustments.push('Ankunftsbahn an verfügbare Optionen angepasst.')
    }

    const metadata = {...parsed.metadata}
    if (adjustments.length) {
      metadata.remarks = adjustments.join(' ')
    }

    missionSetup.preview = buildMissionContext(scenario, 'simbrief', metadata)
    missionSetup.simbrief.meta = metadata
  } catch (err) {
    console.error('Failed to load SimBrief plan', err)
    missionSetup.simbrief.error = 'SimBrief konnte nicht geladen werden.'
    missionSetup.preview = null
  } finally {
    missionSetup.simbrief.loading = false
  }
}

function confirmMissionSelection() {
  if (!missionSetup.module || !missionSetup.preview) return
  const moduleId = missionSetup.module.id
  const module = modules.value.find(item => item.id === moduleId) || missionSetup.module
  setMissionContext(moduleId, missionSetup.preview)
  const stored = getMissionContext(moduleId)
  missionSetup.module = null
  clearMissionPreview()
  if (stored) {
    showMissionBriefing(module, stored)
  }
}

const isClient = typeof window !== 'undefined'
const defaultCfg = createDefaultLearnConfig()
const cfg = ref<LearnConfig>({...defaultCfg})
audioReveal.value = !cfg.value.audioChallenge

const XP_PER_LEVEL = 300
const xp = ref(0)
const progress = ref<LearnProgress>({})
const level = computed(() => 1 + Math.floor(xp.value / XP_PER_LEVEL))
const nextLevel = computed(() => level.value + 1)
const levelProgress = computed(() => Math.min(100, Math.round(((xp.value % XP_PER_LEVEL) / XP_PER_LEVEL) * 100)))
const xpToNextLevel = computed(() => Math.max(0, level.value * XP_PER_LEVEL - xp.value))
type BadgeTier = { id: string; name: string; xp: number; description: string }

const badgeTrack: BadgeTier[] = [
  {id: 'rookie', name: 'Runway Rookie', xp: 0, description: 'Complete your first guided mission.'},
  {id: 'cadet', name: 'Clearance Cadet', xp: 120, description: 'Score three missions with ≥80%.'},
  {id: 'navigator', name: 'Taxi Navigator', xp: 360, description: 'Keep the flow going with solid readbacks.'},
  {id: 'tower', name: 'Tower Pro', xp: 720, description: 'Master departures with confident phraseology.'}
]

const currentBadge = computed(() => {
  let unlocked = badgeTrack[0]
  for (const badge of badgeTrack) {
    if (xp.value >= badge.xp) {
      unlocked = badge
    }
  }
  return unlocked
})

const nextBadge = computed(() => badgeTrack.find(badge => badge.xp > xp.value) || null)

const nextBadgeProgress = computed(() => {
  const upcoming = nextBadge.value
  if (!upcoming) return 100
  const previous = badgeTrack.slice().reverse().find(badge => badge.xp <= xp.value) || badgeTrack[0]
  const span = Math.max(1, upcoming.xp - previous.xp)
  const gained = xp.value - previous.xp
  return Math.min(100, Math.round((gained / span) * 100))
})

const nextBadgeXpRemaining = computed(() => {
  const upcoming = nextBadge.value
  if (!upcoming) return 0
  return Math.max(0, upcoming.xp - xp.value)
})

const totalLessons = computed(() => modules.value.reduce((sum, module) => sum + module.lessons.length, 0))
const finishedLessons = computed(() => modules.value.reduce((sum, module) => sum + doneCount(module.id), 0))
const missionCompletionPct = computed(() => (totalLessons.value ? Math.round((finishedLessons.value / totalLessons.value) * 100) : 0))

const globalAccuracy = computed(() => {
  const scores: number[] = []
  Object.values(progress.value || {}).forEach(module => {
    Object.values(module || {}).forEach(entry => {
      if (entry && typeof entry.best === 'number' && entry.best > 0) {
        scores.push(entry.best)
      }
    })
  })
  if (!scores.length) return 0
  const avg = scores.reduce((acc, value) => acc + value, 0) / scores.length
  return Math.round(avg)
})

const audioContentHidden = computed(() => cfg.value.audioChallenge && !audioReveal.value)
const audioSpeedDisplay = computed(() => (cfg.value.audioSpeed ?? 1).toFixed(2))

type LearnStateResponse = LearnState

let persistTimer: ReturnType<typeof setTimeout> | null = null
const dirtyState = reactive({xp: false, progress: false, config: false})
const savingState = ref(false)
const pendingSave = ref(false)

async function loadLearnState() {
  if (!isClient) return

  try {
    const response = await api.get<LearnStateResponse>('/api/learn/state')
    if (response) {
      xp.value = Number.isFinite(response.xp) ? Math.max(0, Math.round(response.xp)) : 0
      progress.value = (response.progress ?? {}) as LearnProgress
      const incomingConfig = response.config || {}
      cfg.value = {
        ...defaultCfg,
        ...incomingConfig,
        missionContexts: {...(incomingConfig.missionContexts || {})},
      }
    } else {
      xp.value = 0
      progress.value = {} as LearnProgress
      cfg.value = {...defaultCfg, missionContexts: {}}
    }
    dirtyState.xp = false
    dirtyState.progress = false
    dirtyState.config = false
  } catch (err) {
    console.error('Failed to load learn state', err)
    xp.value = 0
    progress.value = {} as LearnProgress
    cfg.value = {...defaultCfg, missionContexts: {}}
  } finally {
    audioReveal.value = !cfg.value.audioChallenge
  }

  applyMissionContextGenerators()
}

function schedulePersist(immediate = false) {
  if (!isClient) return
  if (persistTimer) {
    clearTimeout(persistTimer)
    persistTimer = null
  }
  if (immediate) {
    void persistLearnState(true)
    return
  }
  persistTimer = setTimeout(() => {
    persistTimer = null
    void persistLearnState()
  }, 800)
}

async function persistLearnState(force = false) {
  if (!isClient) return
  if (!force && !dirtyState.xp && !dirtyState.progress && !dirtyState.config) {
    return
  }
  if (savingState.value) {
    pendingSave.value = true
    return
  }
  savingState.value = true
  pendingSave.value = false

  const payload = {
    xp: Math.max(0, Math.round(xp.value)),
    progress: JSON.parse(JSON.stringify(progress.value)),
    config: {...cfg.value},
  }

  try {
    await api.put('/api/learn/state', payload)
    dirtyState.xp = false
    dirtyState.progress = false
    dirtyState.config = false
  } catch (err) {
    console.error('Failed to persist learn state', err)
  } finally {
    savingState.value = false
    if (pendingSave.value) {
      pendingSave.value = false
      void persistLearnState()
    }
  }
}

if (isClient) {
  await loadLearnState()
}

const markConfigDirty = () => {
  dirtyState.config = true
  schedulePersist()
}

if (isClient) {
  watch(progress, () => {
    dirtyState.progress = true
    schedulePersist()
  }, {deep: true})
  watch(xp, () => {
    dirtyState.xp = true
    schedulePersist()
  })
  watch(() => cfg.value.tts, markConfigDirty)
  watch(() => cfg.value.audioChallenge, () => {
    markConfigDirty()
    resetAudioReveal()
  })
  watch(() => cfg.value.radioLevel, (level, previous) => {
    markConfigDirty()
    if (level !== previous) {
      void playRadioNoise(level)
    }
  })
  watch(() => cfg.value.audioSpeed, markConfigDirty)
  watch(() => cfg.value.voice, markConfigDirty)
  watch(() => cfg.value.missionContexts, () => {
    markConfigDirty()
  }, {deep: true})
}

onBeforeUnmount(() => {
  if (persistTimer) {
    clearTimeout(persistTimer)
    persistTimer = null
  }
  if (dirtyState.xp || dirtyState.progress || dirtyState.config) {
    void persistLearnState(true)
  }
  stopAudio()
  stopRadioNoise()
  if (radioNoiseContext) {
    const ctx = radioNoiseContext
    radioNoiseContext = null
    void ctx.close().catch(() => {
    })
  }
  if (speechContext) {
    const ctx = speechContext
    speechContext = null
    void ctx.close().catch(() => {
    })
  }
  if (tilesScroller.value) {
    tilesScroller.value.removeEventListener('scroll', updateTileScrollState)
  }
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updateTileScrollState)
  }
})

const fieldMap = computed<Record<string, LessonField>>(() => {
  const map: Record<string, LessonField> = {}
  if (activeLesson.value) {
    for (const field of activeLesson.value.fields) {
      map[field.key] = field
    }
  }
  return map
})

const fieldStates = computed<Record<string, FieldState>>(() => {
  const map: Record<string, FieldState> = {}
  if (!activeLesson.value || !scenario.value) return map
  for (const field of activeLesson.value.fields) {
    const expected = field.expected(scenario.value).trim()
    const answer = (userAnswers[field.key] ?? '').trim()
    const alternatives = field.alternatives?.(scenario.value) ?? []
    const options = [expected, ...alternatives].map(norm).filter(Boolean)
    const normalizedAnswer = norm(answer)
    const best = options.length ? Math.max(...options.map(option => similarity(normalizedAnswer, option))) : 0
    const pass = answer ? best >= (field.threshold ?? 0.82) : false
    map[field.key] = {
      key: field.key,
      label: field.label,
      expected,
      answer,
      similarity: answer ? best : 0,
      pass
    }
  }
  return map
})

function resetAudioReveal() {
  audioReveal.value = !cfg.value.audioChallenge
}

function revealAudioContent() {
  audioReveal.value = true
}

function blankSizeClass(key: string, override?: BlankWidth): string {
  const field = fieldMap.value[key]
  const size = (override || field?.width || 'md') as BlankWidth
  return `size-${size}`
}

function blankStateClass(key: string): string {
  const state = fieldStates.value[key]
  if (!state) return ''
  if (state.pass) return 'ok'
  if (state.answer) return 'warn'
  return ''
}

function fieldLabel(key: string): string {
  return fieldMap.value[key]?.label ?? 'Field'
}

function fieldPlaceholder(key: string): string {
  return fieldMap.value[key]?.placeholder ?? '…'
}

function fieldInputmode(key: string): 'text' | 'numeric' {
  return fieldMap.value[key]?.inputmode ?? 'text'
}

function fieldPass(key: string): boolean {
  return Boolean(fieldStates.value[key]?.pass)
}

function fieldHasAnswer(key: string): boolean {
  const state = fieldStates.value[key]
  return Boolean(state && state.answer)
}

function fieldExpectedValue(key: string): string {
  return fieldStates.value[key]?.expected ?? ''
}

const targetPhrase = computed(() => (activeLesson.value && scenario.value ? activeLesson.value.phrase(scenario.value) : ''))
const lessonInfo = computed(() => (activeLesson.value && scenario.value ? activeLesson.value.info(scenario.value) : []))
const sayButtonLabel = computed(() => (hasSpokenTarget.value ? 'Say again' : 'Say'))
const nextLessonMeta = computed(() => {
  if (!current.value || !activeLesson.value) return null
  const lessons = current.value.lessons
  const activeId = activeLesson.value.id
  const idx = lessons.findIndex(lesson => lesson.id === activeId)
  if (idx === -1 || idx >= lessons.length - 1) return null
  const nextLesson = lessons[idx + 1]
  return {
    lesson: nextLesson,
    position: idx + 2,
    total: lessons.length
  }
})

const nextMissionMeta = computed(() => {
  if (!current.value) return null
  const currentIndex = modules.value.findIndex(module => module.id === current.value?.id)
  if (currentIndex === -1) return null
  const total = modules.value.length
  for (let idx = currentIndex + 1; idx < modules.value.length; idx++) {
    const module = modules.value[idx]
    if (isModuleUnlocked(module.id)) {
      return {
        module,
        position: idx + 1,
        total
      }
    }
  }
  return null
})

const nextActionLabel = computed(() => {
  if (nextLessonMeta.value) return 'Next lesson'
  if (nextMissionMeta.value) return 'Next mission'
  return 'Next lesson'
})

watch(activeLesson, lesson => {
  if (lesson) {
    rollScenario(true)
  } else {
    scenario.value = null
  }
})

watch(scenario, newScenario => {
  hasSpokenTarget.value = false
  if (!newScenario) {
    pendingAutoSay.value = false
  }
})

function queueAutoSay() {
  pendingAutoSay.value = true
  void nextTick(() => {
    attemptAutoSay()
  })
}

function attemptAutoSay() {
  if (!pendingAutoSay.value) return
  const phrase = targetPhrase.value?.trim()
  if (!phrase) {
    pendingAutoSay.value = false
    return
  }
  if (ttsLoading.value) return
  pendingAutoSay.value = false
  void speakTarget(true)
}

async function speakTarget(auto = false) {
  const phrase = targetPhrase.value?.trim()
  if (!phrase) return
  if (ttsLoading.value) return
  if (!auto) {
    pendingAutoSay.value = false
  }
  hasSpokenTarget.value = true
  await say(phrase)
}

watch(ttsLoading, loading => {
  if (!loading) {
    attemptAutoSay()
  }
})

function rollScenario(clear = false) {
  if (!activeLesson.value) return
  pendingAutoSay.value = false
  stopAudio()
  const generated = activeLesson.value.generate()
  scenario.value = generated
  const defaultType = activeLesson.value.defaultFrequency
  activeFrequency.value = generated.frequencies.find(freq => freq.type === (defaultType || 'DEL')) || generated.frequencies[0] || null
  resetAnswers(true)
  resetAudioReveal()
  if (clear) {
    result.value = null
  }
  queueAutoSay()
}

function repeatLesson() {
  rollScenario(true)
}

function goToNextLesson() {
  const meta = nextLessonMeta.value
  if (meta) {
    activeLesson.value = meta.lesson
    return
  }
  const nextMission = nextMissionMeta.value
  if (nextMission) {
    quickContinue(nextMission.module.id)
  }
}

function setActiveFrequency(freq: Frequency) {
  activeFrequency.value = freq
}

function resetAnswers(clearResult = false) {
  if (!activeLesson.value) return
  const keys = activeLesson.value.fields.map(field => field.key)
  Object.keys(userAnswers).forEach(key => {
    if (!keys.includes(key)) {
      delete userAnswers[key]
    }
  })
  for (const key of keys) {
    userAnswers[key] = ''
  }
  if (clearResult) {
    result.value = null
  }
}

function clearAnswers() {
  resetAnswers(true)
}

function fillSolution() {
  if (!activeLesson.value || !scenario.value) return
  for (const field of activeLesson.value.fields) {
    userAnswers[field.key] = field.expected(scenario.value)
  }
}

function computeScore(): ScoreResult | null {
  if (!activeLesson.value) return null
  const details = activeLesson.value.fields
      .map(field => fieldStates.value[field.key])
      .filter(Boolean) as FieldState[]
  if (!details.length) return null
  const total = details.reduce((sum, item) => sum + item.similarity, 0)
  const hits = details.filter(item => item.pass).length
  const avg = total / details.length
  return {
    score: Math.round(avg * 100),
    hits,
    sim: avg,
    passed: hits === details.length && hits > 0,
    fields: details
  }
}

function evaluate() {
  if (!activeLesson.value || !current.value) return
  evaluating.value = true
  try {
    const summary = computeScore()
    if (!summary) return
    result.value = summary

    const modId = current.value.id
    const lesId = activeLesson.value.id
    if (!progress.value[modId]) progress.value[modId] = {}
    const previous = progress.value[modId][lesId] || {best: 0, done: false}
    const best = Math.max(previous.best || 0, summary.score)
    const passed = summary.passed || summary.score >= 80
    const wasDone = previous.done

    progress.value[modId][lesId] = {best, done: passed}

    let gained = 0
    if (passed && !wasDone) gained += 40
    if (summary.score >= 95 && summary.score > (previous.best || 0)) gained += 15
    if (summary.score >= 80 && summary.score > (previous.best || 0)) gained += 10

    if (gained) {
      xp.value += gained
      toastNow(`+${gained} XP · ${activeLesson.value.title}`)
    }
  } finally {
    evaluating.value = false
  }
}

function isModuleUnlocked(id: string) {
  if (id === 'normalize') return true
  const order = modules.value.findIndex(module => module.id === id)
  const previous = modules.value[order - 1]
  return previous ? pct(previous.id) >= 80 : true
}

function openModule(id: string) {
  current.value = modules.value.find(module => module.id === id) || null
  activeLesson.value = null
  panel.value = 'module'
}

function quickContinue(id: string) {
  openModule(id)
  if (!current.value) return
  const mod = current.value
  const prog = progress.value[mod.id] || {}
  const next = mod.lessons.find(lesson => !(prog[lesson.id]?.done)) || mod.lessons[0]
  activeLesson.value = next
}

function resumeMissionObjective() {
  const objective = missionObjective.value
  if (objective?.moduleId) {
    quickContinue(objective.moduleId)
    return
  }
  panel.value = 'hub'
}

function goToPrimaryObjective() {
  const objective = primaryObjective.value
  if (!objective) return

  if (objective.moduleId) {
    quickContinue(objective.moduleId)
    return
  }

  panel.value = 'hub'
}

function selectLesson(lesson: Lesson) {
  activeLesson.value = lesson
}

function bestScore(modId: string, lesId: string) {
  return progress.value[modId]?.[lesId]?.best || 0
}

function moduleHasProgress(modId: string) {
  const moduleProgress = progress.value[modId]
  if (!moduleProgress) return false
  return Object.values(moduleProgress).some(entry => {
    if (!entry) return false
    return Boolean(entry.done) || (typeof entry.best === 'number' && entry.best > 0)
  })
}

function isFreshModule(modId: string) {
  return isModuleUnlocked(modId) && !moduleHasProgress(modId) && !moduleCompleted(modId)
}

function tileClass(modId: string) {
  return {
    'is-locked': !isModuleUnlocked(modId),
    'is-complete': moduleCompleted(modId),
    'is-active': moduleHasProgress(modId) && !moduleCompleted(modId),
    'is-fresh': isFreshModule(modId),
  }
}

function moduleCompleted(modId: string) {
  const module = modules.value.find(item => item.id === modId)
  if (!module) return false
  if (!module.lessons.length) return false
  return doneCount(modId) >= module.lessons.length
}

function doneCount(modId: string) {
  const module = modules.value.find(item => item.id === modId)
  if (!module) return 0
  const moduleProgress = progress.value[modId] || {}
  return module.lessons.filter(lesson => moduleProgress[lesson.id]?.done).length
}

function pct(modId: string) {
  const module = modules.value.find(item => item.id === modId)
  if (!module) return 0
  return Math.round((doneCount(modId) / module.lessons.length) * 100)
}

function avgScore(modId: string) {
  const module = modules.value.find(item => item.id === modId)
  if (!module) return 0
  const moduleProgress = progress.value[modId] || {}
  const values = module.lessons.map(lesson => moduleProgress[lesson.id]?.best || 0)
  const sum = values.reduce((acc, value) => acc + value, 0)
  return Math.round(sum / (values.length || 1))
}

function handleModulePrimary(modId: string) {
  const module = modules.value.find(item => item.id === modId)
  if (!module) return

  if (moduleRequiresContext(modId)) {
    const context = getMissionContext(modId)
    const hasProgress = moduleHasProgress(modId)
    if (!context && !hasProgress) {
      openMissionSetup(module)
      return
    }
    if (context) {
      showMissionBriefing(module, context)
      return
    }
  }

  quickContinue(modId)
}

function modulePrimaryLabel(modId: string) {
  if (moduleCompleted(modId)) return 'Replay mission'
  if (!moduleHasProgress(modId)) {
    return moduleRequiresContext(modId) ? 'Configure mission' : 'Launch mission'
  }
  return moduleRequiresContext(modId) ? 'Mission briefing' : 'Resume mission'
}

function modulePrimaryIcon(modId: string) {
  if (moduleCompleted(modId)) return 'mdi-history'
  if (!moduleHasProgress(modId)) {
    return moduleRequiresContext(modId) ? 'mdi-clipboard-text' : 'mdi-rocket-launch'
  }
  return moduleRequiresContext(modId) ? 'mdi-clipboard-text' : 'mdi-progress-clock'
}

function moduleSecondaryLabel(modId: string) {
  return moduleHasProgress(modId) ? 'Overview' : 'Preview'
}

function moduleSecondaryIcon(modId: string) {
  return moduleHasProgress(modId) ? 'mdi-view-grid-outline' : 'mdi-information-outline'
}

function moduleStatusText(modId: string) {
  if (!isModuleUnlocked(modId)) return 'Clearance pending'
  if (moduleCompleted(modId)) return 'Mission complete'
  if (moduleHasProgress(modId)) return 'In progress'
  return 'Ready to launch'
}

function moduleStatusIcon(modId: string) {
  if (!isModuleUnlocked(modId)) return 'mdi-lock-alert'
  if (moduleCompleted(modId)) return 'mdi-medal-outline'
  if (moduleHasProgress(modId)) return 'mdi-timer-sand-complete'
  return 'mdi-rocket-launch-outline'
}

function tileStatusClass(modId: string) {
  if (!isModuleUnlocked(modId)) return 'is-locked'
  if (moduleCompleted(modId)) return 'is-complete'
  if (moduleHasProgress(modId)) return 'is-active'
  return 'is-fresh'
}

function lessonScoreLabel(modId: string, lesId: string) {
  const score = bestScore(modId, lesId)
  return score ? `${score}%` : 'New'
}

function lessonScoreIcon(modId: string, lesId: string) {
  const score = bestScore(modId, lesId)
  if (!score) return 'mdi-star-four-points-outline'
  if (score >= 80) return 'mdi-star-circle'
  return 'mdi-progress-check'
}

function lessonScoreClass(modId: string, lesId: string) {
  const score = bestScore(modId, lesId)
  if (!score) return 'is-new'
  if (score >= 80) return 'is-great'
  return 'is-progress'
}

const lessonsWithGreatScore = computed(() => {
  let count = 0
  Object.values(progress.value || {}).forEach(module => {
    Object.values(module || {}).forEach(entry => {
      if (entry && typeof entry.best === 'number' && entry.best >= 80) {
        count += 1
      }
    })
  })
  return count
})

const modulesStartedCount = computed(() => {
  let count = 0
  modules.value.forEach(module => {
    const moduleProgress = progress.value[module.id]
    if (!moduleProgress) return
    const active = Object.values(moduleProgress).some(entry => {
      if (!entry) return false
      return Boolean(entry.done) || (typeof entry.best === 'number' && entry.best > 0)
    })
    if (active) count += 1
  })
  return count
})

const dailyObjectives = computed<Objective[]>(() => {
  const readbacks = lessonsWithGreatScore.value
  const started = modulesStartedCount.value > 0
  const audioPlayed = hasSpokenTarget.value

  return [
    {
      id: 'daily-readbacks',
      title: '3 readbacks ≥80%',
      description: 'Score at least 80% in three different lessons.',
      progress: readbacks,
      goal: 3,
      status: readbacks >= 3 ? 'Goal reached' : `${Math.max(0, 3 - Math.min(readbacks, 3))} more ≥80%`,
      icon: 'mdi-target-account',
      complete: readbacks >= 3
    },
    {
      id: 'daily-module',
      title: 'Start 1 module',
      description: 'Open a mission set and clear the first lesson.',
      progress: started ? 1 : 0,
      goal: 1,
      status: started ? 'Module started' : 'Pick a module to open',
      icon: 'mdi-flag-variant',
      complete: started
    },
    {
      id: 'daily-audio',
      title: 'Play the target phrase',
      description: 'Listen to the controller audio before responding.',
      progress: audioPlayed ? 1 : 0,
      goal: 1,
      status: audioPlayed ? 'Played once today' : 'Play the controller audio',
      icon: 'mdi-volume-high',
      complete: audioPlayed
    }
  ]
})

const missionObjective = computed<Objective | null>(() => {
  const nextModule = modules.value.find(module => !moduleCompleted(module.id))
  if (!nextModule) return null
  const total = nextModule.lessons.length || 1
  const completed = Math.min(total, Math.max(0, doneCount(nextModule.id)))
  const status = completed >= total ? 'Module complete' : `Lesson ${Math.min(completed + 1, total)} of ${total}`
  return {
    id: `module-${nextModule.id}`,
    title: `Continue ${nextModule.title}`,
    description: nextModule.subtitle,
    progress: completed,
    goal: total,
    status,
    icon: 'mdi-flag-checkered',
    complete: completed >= total,
    moduleId: nextModule.id
  }
})

const focusModuleId = computed(() => {
  const mission = missionObjective.value
  if (mission?.moduleId) return mission.moduleId
  const active = modules.value.find(module => moduleHasProgress(module.id) && !moduleCompleted(module.id))
  if (active) return active.id
  const unlocked = modules.value.find(module => isModuleUnlocked(module.id))
  return unlocked?.id || modules.value[0]?.id || ''
})

watch(panel, value => {
  if (value === 'hub') {
    nextTick(() => {
      updateTileScrollState()
      if (focusModuleId.value) {
        scrollModuleIntoView(focusModuleId.value, 'auto')
      }
    })
  }
})

watch(focusModuleId, id => {
  if (panel.value === 'hub' && id) {
    nextTick(() => scrollModuleIntoView(id))
  }
})

const badgeObjective = computed<Objective | null>(() => {
  const upcoming = nextBadge.value
  if (!upcoming) return null
  const previous = badgeTrack.slice().reverse().find(badge => badge.xp <= xp.value) || badgeTrack[0]
  const span = Math.max(1, upcoming.xp - previous.xp)
  const gained = Math.max(0, xp.value - previous.xp)
  return {
    id: `badge-${upcoming.id}`,
    title: `${upcoming.name} badge`,
    description: upcoming.description,
    progress: gained,
    goal: span,
    status: `${nextBadgeXpRemaining.value} XP to unlock`,
    icon: 'mdi-shield-star',
    complete: false
  }
})

const objectiveList = computed(() => {
  const list: Objective[] = []
  if (missionObjective.value) list.push(missionObjective.value)
  list.push(...dailyObjectives.value)
  if (badgeObjective.value) list.push(badgeObjective.value)
  return list
})

const primaryObjective = computed(() => objectiveList.value.find(objective => !objective.complete) || objectiveList.value[0] || null)

const primaryObjectiveProgress = computed(() => (primaryObjective.value ? objectiveProgressPct(primaryObjective.value) : 0))

function objectiveProgressPct(objective: Objective): number {
  if (!objective.goal || objective.goal <= 0) {
    return objective.complete ? 100 : 0
  }
  const clamped = Math.min(objective.goal, Math.max(0, objective.progress))
  return Math.min(100, Math.round((clamped / objective.goal) * 100))
}

function objectiveBadgeLabel(objective: Objective): string {
  if (objective.complete) return 'Completed'
  if (!objective.goal || objective.goal <= 0) return 'Progress'
  const clamped = Math.min(objective.goal, Math.max(0, Math.round(objective.progress)))
  return `${clamped}/${objective.goal}`
}

function toastNow(text: string) {
  toast.value.text = text
  toast.value.show = true
}

function resetAll() {
  if (!isClient) return
  progress.value = {} as LearnProgress
  xp.value = 0
  cfg.value = {...defaultCfg, missionContexts: {}}
  Object.values(missionGeneratorControls).forEach(control => control.clear?.())
  audioReveal.value = !cfg.value.audioChallenge
  dirtyState.progress = true
  dirtyState.xp = true
  dirtyState.config = true
  schedulePersist(true)
}

const worldTiltStyle = ref<any>({})

function tilt(event: MouseEvent) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const dx = (event.clientX - (rect.left + rect.width / 2)) / rect.width
  const dy = (event.clientY - (rect.top + rect.height / 2)) / rect.height
  worldTiltStyle.value = {transform: `perspective(1200px) rotateX(${dy * -3}deg) rotateY(${dx * 3}deg)`}
}

async function ensureSpeechAudioContext(): Promise<AudioContext | null> {
  if (!isClient) return null

  const audioWindow = window as typeof window & { webkitAudioContext?: typeof AudioContext }
  const AudioContextCtor = audioWindow.AudioContext || audioWindow.webkitAudioContext
  if (!AudioContextCtor) return null

  if (!speechContext || speechContext.state === 'closed') {
    speechContext = new AudioContextCtor()
  }

  if (speechContext.state === 'suspended') {
    try {
      await speechContext.resume()
    } catch (err) {
      console.warn('Failed to resume speech audio context', err)
    }
  }

  return speechContext
}

async function ensurePizzicato(ctx: AudioContext | null): Promise<PizzicatoLite | null> {
  if (!ctx) return null
  if (!pizzicatoLiteInstance) {
    pizzicatoLiteInstance = await loadPizzicatoLite()
  }
  return pizzicatoLiteInstance
}

function buildSayCacheKey(text: string, rate: number): string {
  const voice = cfg.value.voice?.trim().toLowerCase() || 'default'
  const radioLevel = cfg.value.radioLevel
  return `${voice}|${radioLevel}|${rate.toFixed(2)}|${text}`
}

async function requestSayAudio(cacheKey: string, payload: Record<string, unknown>): Promise<CachedAudio> {
  const pending = pendingSayRequests.get(cacheKey)
  if (pending) {
    return pending
  }

  const request = (async () => {
    const response: any = await api.post('/api/atc/say', payload)
    const audioData = response?.audio
    if (!audioData?.base64) {
      throw new Error('Missing audio data')
    }
    const model = typeof response?.meta?.model === 'string' ? response.meta.model : null
    const speed = typeof response?.speed === 'number' ? response.speed : undefined
    return {
      base64: audioData.base64 as string,
      mime: audioData.mime || 'audio/wav',
      model,
      speed
    }
  })()

  pendingSayRequests.set(cacheKey, request)

  try {
    const audioPayload = await request
    sayCache.set(cacheKey, audioPayload)
    return audioPayload
  } finally {
    pendingSayRequests.delete(cacheKey)
  }
}

const clampRate = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const providerSupportsNativeSpeed = (model?: string | null) => {
  if (!model) return false
  const normalized = model.toLowerCase()
  if (normalized.includes('piper') || normalized.includes('speaches')) {
    return false
  }
  return normalized.includes('tts')
}

async function playAudioSource(source: CachedAudio, targetRate: number) {
  if (!source?.base64) return

  audioElement.value = null

  const readability = Math.max(1, Math.min(5, cfg.value.radioLevel || 3))
  const mime = source.mime || 'audio/wav'
  const dataUrl = `data:${mime};base64,${source.base64}`

  const desiredRate = clampRate(Number.isFinite(targetRate) ? targetRate : 1, 0.5, 2)
  const supportsNativeSpeed = providerSupportsNativeSpeed(source.model)
  const nativeRate = supportsNativeSpeed
      ? clampRate(typeof source.speed === 'number' && Number.isFinite(source.speed) ? source.speed : desiredRate, 0.5, 2)
      : 1
  const playbackRate = supportsNativeSpeed
      ? clampRate(desiredRate / (nativeRate || 1), 0.5, 2)
      : desiredRate

  const playWithoutEffects = async () => {
    const audio = new Audio(dataUrl)
    audio.playbackRate = playbackRate
    audioElement.value = audio
    audio.onended = () => {
      if (audioElement.value === audio) {
        audioElement.value = null
      }
    }
    audio.onerror = () => {
      if (audioElement.value === audio) {
        audioElement.value = null
      }
    }
    try {
      await audio.play()
    } catch (err) {
      console.error('Audio playback failed', err)
    }
  }

  try {
    const ctx = await ensureSpeechAudioContext()
    const pizzicato = await ensurePizzicato(ctx)
    if (!ctx || !pizzicato) {
      throw new Error('Audio engine unavailable')
    }

    const sound = await pizzicato.createSoundFromBase64(ctx, source.base64)
    sound.setPlaybackRate(playbackRate)
    const profile = getReadabilityProfile(readability)
    const {Effects} = pizzicato

    const highpass = new Effects.HighPassFilter(ctx, {
      frequency: profile.eq.highpass,
      q: profile.eq.highpassQ
    })
    const lowpass = new Effects.LowPassFilter(ctx, {
      frequency: profile.eq.lowpass,
      q: profile.eq.lowpassQ
    })

    sound.addEffect(highpass)
    sound.addEffect(lowpass)

    if (profile.eq.bandpass) {
      sound.addEffect(
          new Effects.BandPassFilter(ctx, {
            frequency: profile.eq.bandpass.frequency,
            q: profile.eq.bandpass.q
          })
      )
    }

    if (profile.presence) {
      sound.addEffect(new Effects.PeakingFilter(ctx, profile.presence))
    }

    profile.distortions.forEach(amount => {
      sound.addEffect(new Effects.Distortion(ctx, {amount}))
    })

    sound.addEffect(new Effects.Compressor(ctx, profile.compressor))

    if (profile.tremolos) {
      profile.tremolos.forEach(tremolo => {
        sound.addEffect(new Effects.Tremolo(ctx, tremolo))
      })
    }

    sound.setVolume(profile.gain)

    const playbackDuration = Math.max(0.1, sound.duration / Math.max(playbackRate, 0.01))
    const noiseStops = createNoiseGenerators(ctx, playbackDuration, profile, readability)

    activeRadioSound = sound
    activeRadioCleanup = noiseStops

    try {
      await sound.play()
    } finally {
      if (activeRadioSound === sound) {
        activeRadioSound = null
      }
      if (activeRadioCleanup === noiseStops) {
        activeRadioCleanup = []
      }
      noiseStops.forEach(stop => {
        try {
          stop()
        } catch {
          // ignore
        }
      })
      sound.clearEffects()
    }
  } catch (err) {
    console.error('Failed to apply radio effect', err)
    await playWithoutEffects()
  }
}

function stopRadioNoise() {
  if (!radioNoiseSource) return
  try {
    radioNoiseSource.stop()
  } catch (err) {
    // ignore stop errors
  }
  try {
    radioNoiseSource.disconnect()
  } catch (err) {
    // ignore disconnect errors
  }
  radioNoiseSource = null
}

async function playRadioNoise(level: number) {
  if (!isClient) return

  const audioWindow = window as typeof window & { webkitAudioContext?: typeof AudioContext }
  const AudioContextCtor = audioWindow.AudioContext || audioWindow.webkitAudioContext
  if (!AudioContextCtor) return

  if (!radioNoiseContext || radioNoiseContext.state === 'closed') {
    radioNoiseContext = new AudioContextCtor()
  }

  const ctx = radioNoiseContext
  if (!ctx) return

  try {
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }
  } catch (err) {
    console.warn('Failed to resume radio noise context', err)
  }

  stopRadioNoise()

  const duration = 0.4
  const length = Math.max(1, Math.floor(ctx.sampleRate * duration))
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)

  const strength = Math.max(1, Math.min(5, level))
  const intensity = (6 - strength) / 5
  const amplitude = 0.025 + intensity * 0.15

  for (let i = 0; i < length; i++) {
    data[i] = (Math.random() * 2 - 1) * amplitude
  }

  const source = ctx.createBufferSource()
  source.buffer = buffer

  const highpass = ctx.createBiquadFilter()
  highpass.type = 'highpass'
  highpass.frequency.value = 320

  const bandpass = ctx.createBiquadFilter()
  bandpass.type = 'bandpass'
  bandpass.frequency.value = 1800
  bandpass.Q.value = 1.2

  const lowpass = ctx.createBiquadFilter()
  lowpass.type = 'lowpass'
  lowpass.frequency.value = 3200

  const gain = ctx.createGain()
  const now = ctx.currentTime
  const endTime = now + duration
  gain.gain.setValueAtTime(amplitude, now)
  gain.gain.exponentialRampToValueAtTime(0.0001, endTime)

  source.connect(highpass)
  highpass.connect(bandpass)
  bandpass.connect(lowpass)
  lowpass.connect(gain)
  gain.connect(ctx.destination)

  source.start(now)
  source.stop(endTime)

  source.onended = () => {
    if (radioNoiseSource === source) {
      radioNoiseSource = null
    }
  }

  radioNoiseSource = source
}

function computeSpeechRate(): number {
  const base =
      typeof cfg.value.audioSpeed === 'number' && Number.isFinite(cfg.value.audioSpeed)
          ? cfg.value.audioSpeed
          : 1
  const adjustment = (cfg.value.radioLevel - 3) * 0.05
  const rate = base + adjustment
  return Math.min(1.4, Math.max(0.7, Math.round(rate * 100) / 100))
}

async function say(text: string) {
  const trimmed = text?.trim()
  if (!trimmed) return

  const normalizedRate = computeSpeechRate()

  const hasBrowserTts = cfg.value.tts && typeof window !== 'undefined' && 'speechSynthesis' in window

  stopAudio()

  if (hasBrowserTts) {
    const synth = window.speechSynthesis
    const utterance = new SpeechSynthesisUtterance(trimmed)
    utterance.rate = normalizedRate
    if (cfg.value.voice) {
      const voiceName = cfg.value.voice.toLowerCase()
      const voice = synth.getVoices().find(item => item.name.toLowerCase().includes(voiceName))
      if (voice) utterance.voice = voice
    }
    synth.cancel()
    synth.speak(utterance)
    return
  }

  if (ttsLoading.value) return

  const payload: Record<string, unknown> = {
    text: trimmed,
    level: cfg.value.radioLevel,
    speed: normalizedRate,
    moduleId: current.value?.id || 'learn',
    lessonId: activeLesson.value?.id || null,
    tag: 'learn-target'
  }

  if (cfg.value.voice) {
    payload.voice = cfg.value.voice
  }

  const cacheKey = buildSayCacheKey(trimmed, normalizedRate)

  ttsLoading.value = true

  try {
    let audioData = sayCache.get(cacheKey)
    if (!audioData) {
      audioData = await requestSayAudio(cacheKey, payload)
    }
    await playAudioSource(audioData, normalizedRate)
  } catch (err) {
    console.error('TTS request failed', err)
  } finally {
    ttsLoading.value = false
  }
}

function stopAudio() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
  if (activeRadioSound) {
    const sound = activeRadioSound
    activeRadioSound = null
    try {
      sound.stop()
    } catch {
      // ignore stop errors
    }
  }
  if (activeRadioCleanup.length) {
    const stops = activeRadioCleanup
    activeRadioCleanup = []
    stops.forEach(stop => {
      try {
        stop()
      } catch {
        // ignore cleanup errors
      }
    })
  }
  if (audioElement.value) {
    try {
      audioElement.value.pause()
      audioElement.value.currentTime = 0
    } catch (err) {
      // ignore pause errors
    }
    audioElement.value = null
  }
}

onMounted(() => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.getVoices()
  }

  if (isClient) {
    nextTick(() => {
      const scroller = tilesScroller.value
      if (scroller) {
        scroller.addEventListener('scroll', updateTileScrollState)
        updateTileScrollState()
      }
    })
    window.addEventListener('resize', updateTileScrollState)
  }
})
</script>

<style scoped>
:root {
  --bg: #0b1020;
  --bg2: #0a0f1c;
  --accent: #22d3ee;
  --accent2: #0ea5e9;
  --text: #ffffff;
  --t2: rgba(255, 255, 255, .80);
  --t3: rgba(255, 255, 255, .60);
  --border: rgba(255, 255, 255, .10);
}

.scene {
  min-height: 100vh;
  background: var(--bg);
  color: var(--text)
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px
}

.h1 {
  font-size: clamp(32px, 5vw, 48px);
  font-weight: 600;
  line-height: 1.2
}

.h2 {
  font-size: clamp(24px, 3.5vw, 32px);
  font-weight: 600;
  line-height: 1.25
}

.h3 {
  font-size: 20px;
  font-weight: 600
}

.muted {
  color: var(--t3)
}

.small {
  font-size: 13px
}

.tiny {
  font-size: 11px;
}

.strong {
  font-weight: 600
}

.text-accent {
  color: var(--accent)
}

/* App Bar */
.hud {
  position: sticky;
  top: 0;
  z-index: 40;
  border-bottom: 1px solid var(--border);
  background: color-mix(in srgb, var(--bg) 85%, transparent)
}

.hud-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px
}

.hud-left {
  display: flex;
  align-items: center;
  gap: 10px
}

.brand {
  font-weight: 600
}

.mode {
  color: var(--t2)
}

.sep {
  color: var(--t3)
}

.hud-right {
  display: flex;
  gap: 8px;
  align-items: center
}

.next-objective {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  padding: 5px 12px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--text) 6%, transparent);
  min-width: 180px;
  max-width: 240px;
  text-align: right;
  color: inherit;
  font: inherit;
  appearance: none;
  cursor: pointer;
  transition: background .2s ease, border-color .2s ease, transform .2s ease;
}

.next-objective:hover,
.next-objective:focus-visible {
  background: color-mix(in srgb, var(--text) 10%, transparent);
  border-color: color-mix(in srgb, var(--text) 18%, transparent);
  outline: none;
}


.next-header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  width: 100%;
}

.next-label {
  font-size: 10px;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: var(--t3);
}

.next-value {
  font-weight: 600;
  color: var(--t2);
  font-size: 14px;
  line-height: 1.1;
}

.next-status {
  font-size: 10px;
  color: var(--t3);
  letter-spacing: .06em;
  text-transform: uppercase;
}

.icon-btn {
  border: 1px solid var(--border);
  background: transparent;
  padding: 6px;
  display: inline-flex;
  align-items: center
}

.icon-btn:hover {
  background: color-mix(in srgb, var(--text) 6%, transparent);
  transform: scale(1.05);
}

/* Chips/Controls */
.chip {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--text) 6%, transparent);
  font-size: 12px;
  white-space: nowrap
}

.chip.inline {
  gap: 8px
}

.chip.inline input[type="range"] {
  width: 120px;
  accent-color: var(--accent);
  background: transparent
}

/* Hero */
.hero {
  background: radial-gradient(800px 400px at 80% -10%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 60%),
  radial-gradient(600px 300px at 10% -5%, color-mix(in srgb, var(--accent2) 15%, transparent), transparent 60%),
  linear-gradient(180deg, var(--bg) 0%, var(--bg) 60%, var(--bg2) 100%);
  margin-top: -3em;
  padding: clamp(14px, 4vw, 24px) 0 clamp(6px, 2.5vw, 16px);
  padding-top: clamp(2em, 6vw, 3.25em);
}

.hero-panel {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, .9fr);
  gap: clamp(14px, 2.5vw, 20px);
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--text) 6%, transparent);
  padding: clamp(14px, 2.8vw, 20px);
  transform-style: preserve-3d;
  border-radius: 24px;
  box-shadow: 0 30px 80px rgba(0, 0, 0, .35)
}

.hero-sub {
  max-width: 520px;
  margin-top: 4px
}

.hero-highlight {
  margin-top: clamp(10px, 2vw, 16px);
  border: 1px solid var(--border);
  background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 18%, transparent), color-mix(in srgb, var(--accent2) 10%, transparent));
  padding: clamp(12px, 2.5vw, 16px);
  border-radius: 20px;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: clamp(12px, 2vw, 16px);
  position: relative;
  overflow: hidden
}

.hero-highlight::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(160% 160% at 0% 100%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 60%);
  opacity: .7;
  pointer-events: none
}

.hero-orb {
  --progress: 0%;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: conic-gradient(var(--accent) var(--progress), color-mix(in srgb, var(--text) 10%, transparent) var(--progress));
  position: relative;
  display: grid;
  place-items: center;
  animation: orbFloat 9s ease-in-out infinite
}

.hero-orb::after {
  content: '';
  position: absolute;
  inset: 8px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--bg) 82%, transparent)
}

.hero-orb-core {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center
}

.hero-orb-level {
  font-weight: 700;
  font-size: 16px;
  text-transform: uppercase
}

.hero-orb-progress {
  font-size: 11px;
  letter-spacing: .18em;
  color: var(--t3)
}

.hero-highlight-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: center
}

.hero-tag {
  font-size: 11px;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: var(--t3)
}

.hero-highlight-title {
  font-size: 22px;
  font-weight: 600;
  color: var(--t2)
}

.hero-highlight-bar {
  height: 8px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--text) 20%, transparent);
  background: color-mix(in srgb, var(--text) 6%, transparent);
  overflow: hidden
}

.hero-highlight-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), var(--accent2));
  transition: width .4s ease
}

.objective-callout {
  margin-top: 16px;
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  background: color-mix(in srgb, var(--text) 6%, transparent);
}

.objective-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.objective-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--t2);
}

.objective-title {
  font-size: 16px;
}

.objective-progress {
  display: flex;
  align-items: center;
  gap: 10px;
}

.objective-progress-bar {
  flex: 1;
  height: 6px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--text) 8%, transparent);
  border: 1px solid var(--border);
  overflow: hidden;
}

.objective-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), var(--accent2));
  transition: width .3s ease;
}

.objective-progress-meta {
  font-size: 12px;
  color: var(--t3);
  white-space: nowrap;
}

.hero-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 12px;
  margin-top: clamp(12px, 2vw, 16px)
}

.metric-card {
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--text) 4%, transparent);
  padding: 14px;
  border-radius: 16px;
  display: flex;
  gap: 12px;
  align-items: center;
  box-shadow: 0 16px 32px rgba(0, 0, 0, .22);
  animation: float 12s ease-in-out infinite
}

.metric-card:nth-child(2) {
  animation-delay: 2s
}

.metric-card:nth-child(3) {
  animation-delay: 4s
}

.metric-icon {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--accent) 18%, transparent);
  color: var(--accent)
}

.metric-main {
  display: flex;
  flex-direction: column;
  gap: 2px
}

.metric-value {
  font-weight: 700;
  font-size: 18px
}

.metric-label {
  font-size: 12px;
  color: var(--t3);
  letter-spacing: .12em;
  text-transform: uppercase
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 16px
}

.hero-right {
  display: flex;
  flex-direction: column;
  gap: clamp(12px, 2vw, 16px)
}

.hero-stats {
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: clamp(14px, 3vw, 20px);
  background: color-mix(in srgb, var(--text) 6%, transparent);
  box-shadow: 0 18px 40px rgba(0, 0, 0, .26);
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: float 16s ease-in-out infinite
}

.hero-stats-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: var(--t3)
}

.hero-right .hero-metrics {
  margin-top: 0
}


/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--text) 6%, transparent);
  color: var(--text);
  font-weight: 600;
  text-decoration: none
}

.btn:hover {
  background: color-mix(in srgb, var(--text) 10%, transparent)
}

.btn.primary {
  background: linear-gradient(180deg, color-mix(in srgb, var(--accent) 90%, transparent), color-mix(in srgb, var(--accent) 70%, transparent));
  color: #061318;
  border-color: color-mix(in srgb, var(--accent) 60%, transparent)
}

.btn.soft {
  background: color-mix(in srgb, var(--text) 8%, transparent)
}

.btn.ghost {
  background: transparent
}

.btn.mini {
  padding: 6px 10px;
  font-size: 12px
}

/* HUB tiles */
.hub-head {
  margin: 6px 0 10px
}

.tiles-wrap {
  position: relative;
  margin-top: 16px;
  padding: 4px 0 18px;
}

.tiles {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  align-items: stretch;
  padding: 8px 12px 18px;
  margin: 0 -12px;
  scroll-behavior: smooth;
  scroll-snap-type: x proximity;
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, var(--text) 14%, transparent) transparent;
  -webkit-overflow-scrolling: touch;
}

.tiles::after {
  content: '';
  flex: 0 0 12px;
}

.tiles::-webkit-scrollbar {
  height: 8px;
}

.tiles::-webkit-scrollbar-track {
  background: color-mix(in srgb, var(--bg2) 75%, transparent);
  border-radius: 999px;
}

.tiles::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--accent) 35%, transparent);
  border-radius: 999px;
}

.tile {
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--text) 6%, transparent);
  display: flex;
  flex-direction: column;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 12px 26px rgba(0, 0, 0, .25);
  transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
  position: relative;
  min-height: 360px;
  flex: 0 0 clamp(260px, 32vw, 320px);
  scroll-snap-align: start;
}

.tiles-fade {
  position: absolute;
  top: 8px;
  bottom: 26px;
  width: 96px;
  pointer-events: none;
  z-index: 2;
  background: linear-gradient(90deg, rgba(11, 16, 32, .9) 0%, rgba(11, 16, 32, 0) 100%);
}

.tiles-fade.right {
  right: 0;
  transform: scaleX(-1);
}

.tiles-fade.left {
  left: 0;
}

.tile.is-fresh {
  border-color: color-mix(in srgb, var(--accent) 32%, transparent)
}

.tile.is-active {
  border-color: color-mix(in srgb, #fbbf24 28%, transparent)
}

.tile.is-complete {
  border-color: color-mix(in srgb, #22c55e 32%, transparent)
}

.tile.is-locked {
  filter: saturate(.7) brightness(.9)
}

.tile:hover {
  box-shadow: 0 18px 40px rgba(0, 0, 0, .3)
}

.tile-media {
  height: 140px;
  background-size: cover;
  background-position: center;
  position: relative
}

.tile-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: linear-gradient(120deg, color-mix(in srgb, var(--accent) 65%, transparent), color-mix(in srgb, var(--accent2) 65%, transparent));
  color: #f8fafc;
  font-size: 12px;
  letter-spacing: .08em;
  text-transform: uppercase;
  box-shadow: 0 6px 18px rgba(2, 6, 23, .4)
}

.tile-body {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1
}

.tile-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px
}

.tile-title {
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px
}

.tile-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  letter-spacing: .08em;
  text-transform: uppercase;
  border: 1px solid color-mix(in srgb, var(--text) 18%, transparent);
  color: var(--t3)
}

.tile-status.is-fresh {
  color: var(--accent);
  border-color: color-mix(in srgb, var(--accent) 35%, transparent);
  background: color-mix(in srgb, var(--accent) 12%, transparent)
}

.tile-status.is-active {
  color: #fbbf24;
  border-color: color-mix(in srgb, #fbbf24 40%, transparent);
  background: color-mix(in srgb, #fbbf24 12%, transparent)
}

.tile-status.is-complete {
  color: #22c55e;
  border-color: color-mix(in srgb, #22c55e 40%, transparent);
  background: color-mix(in srgb, #22c55e 14%, transparent)
}

.tile-status.is-locked {
  color: var(--t3);
  border-color: color-mix(in srgb, var(--text) 14%, transparent);
  background: color-mix(in srgb, var(--text) 4%, transparent)
}

.tile-overlay {
  position: absolute;
  inset: 0;
  background: rgba(6, 12, 34, .82);
  color: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 28px;
  backdrop-filter: blur(4px);
  pointer-events: none
}

.tile-overlay-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  max-width: 240px
}

.tile-overlay-title {
  font-weight: 600;
  letter-spacing: .08em;
  text-transform: uppercase
}

.tile-overlay-sub {
  font-size: 14px;
  color: rgba(248, 250, 252, .75)
}

.line {
  height: 8px;
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--text) 8%, transparent);
  border-radius: 999px;
  overflow: hidden
}

.line-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), var(--accent2))
}

.tile-progress-meta {
  display: flex;
  justify-content: space-between;
  color: var(--t3);
  font-size: 12px;
  letter-spacing: .08em;
  text-transform: uppercase
}

.tile-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: stretch;
  margin-top: auto
}

.tile-actions .btn {
  width: 100%;
  justify-content: center;
}

@media (min-width: 720px) {
  .tile-actions {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .tile-actions .btn {
    flex: 1 1 50%;
  }
}

/* Play */
.play .play-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 10px
}

.crumbs {
  display: flex;
  align-items: center;
  gap: 8px
}

.link {
  background: transparent;
  border: 0;
  color: var(--text);
  display: inline-flex;
  align-items: center;
  gap: 6px
}

.stats {
  display: flex;
  gap: 8px
}

.stat {
  border: 1px solid var(--border);
  padding: 6px 10px;
  background: color-mix(in srgb, var(--text) 6%, transparent)
}

.module-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-top: 20px;
}

.module-overview,
.module-detail {
  position: relative;
  padding: 24px;
  border-radius: 24px;
  border: 1px solid color-mix(in srgb, var(--text) 14%, transparent);
  background: color-mix(in srgb, var(--text) 4%, transparent);
  box-shadow: 0 24px 48px rgba(2, 6, 23, .5);
  backdrop-filter: blur(18px);
}

.module-overview {
  border-color: color-mix(in srgb, var(--accent) 40%, transparent);
  background: linear-gradient(150deg, color-mix(in srgb, var(--accent) 14%, transparent) 0%, color-mix(in srgb, var(--text) 4%, transparent) 100%);
  overflow: hidden;
}

.module-overview::before {
  content: "";
  position: absolute;
  inset: -60% 40% auto -10%;
  height: 240px;
  background: radial-gradient(160px 160px at center, color-mix(in srgb, var(--accent) 28%, transparent), transparent 70%);
  opacity: .5;
  pointer-events: none;
}

.module-detail {
  border-color: color-mix(in srgb, var(--text) 22%, transparent);
  background: linear-gradient(160deg, color-mix(in srgb, var(--text) 6%, transparent) 0%, color-mix(in srgb, var(--bg2) 70%, transparent) 100%);
  overflow: visible;
  display: flex;
  flex-direction: column;
}

.module-detail .console {
  margin-top: 0;
}

.lesson-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 10px
}

.lesson {
  position: relative;
  text-align: left;
  border: 1px solid var(--border);
  padding: 28px 16px 16px;
  background: color-mix(in srgb, var(--text) 5%, transparent);
  cursor: pointer;
  border-radius: 16px;
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
  box-shadow: 0 10px 20px rgba(0, 0, 0, .18)
}

.lesson:hover {
  box-shadow: 0 14px 26px rgba(0, 0, 0, .22)
}

.lesson.active {
  outline: 1px solid color-mix(in srgb, var(--accent) 50%, transparent);
  box-shadow: 0 18px 32px rgba(34, 211, 238, .22)
}

.lesson.ok {
  border-color: color-mix(in srgb, #22c55e 50%, transparent)
}

.lesson-score {
  position: absolute;
  top: 10px;
  right: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  letter-spacing: .08em;
  text-transform: uppercase;
  border: 1px solid color-mix(in srgb, var(--text) 18%, transparent);
  color: var(--t3);
  background: color-mix(in srgb, var(--text) 10%, transparent);
  animation: badgePulse 8s ease-in-out infinite
}

.lesson-score.is-new {
  color: var(--accent);
  border-color: color-mix(in srgb, var(--accent) 40%, transparent);
  background: color-mix(in srgb, var(--accent) 16%, transparent)
}

.lesson-score.is-progress {
  color: #fbbf24;
  border-color: color-mix(in srgb, #fbbf24 40%, transparent);
  background: color-mix(in srgb, #fbbf24 14%, transparent)
}

.lesson-score.is-great {
  color: #22c55e;
  border-color: color-mix(in srgb, #22c55e 40%, transparent);
  background: color-mix(in srgb, #22c55e 14%, transparent)
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px
}

.tag {
  border: 1px dashed color-mix(in srgb, var(--text) 25%, transparent);
  color: var(--t3);
  font-size: 11px;
  padding: 2px 6px
}

.console {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
  flex: 1 1 auto
}

.console-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px
}

.col {
  display: flex;
  flex-direction: column;
  gap: 12px
}

.col .label {
  font-size: 12px;
  letter-spacing: .12em;
  color: var(--t3);
  margin-bottom: 6px
}

.panel {
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--text) 6%, transparent);
  padding: 12px;
  backdrop-filter: blur(10px);
  border-radius: 12px
}

.target-row {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start
}

.target-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px
}

.row {
  display: flex;
  gap: 8px;
  margin-top: 8px
}

.row.between {
  justify-content: space-between
}

.row.end {
  justify-content: flex-end
}

.input :deep(textarea) {
  background: color-mix(in srgb, var(--text) 6%, transparent);
  border: 1px solid var(--border);
  color: var(--text)
}

.score {
  margin-top: 8px
}

.score-num {
  font-size: 28px;
  font-weight: 700
}

/* Responsive */
@media (max-width: 980px) {
  .hero {
    padding-top: clamp(1.75em, 9vw, 2.75em);
  }

  .hero-panel {
    grid-template-columns: 1fr;
    padding: clamp(14px, 5vw, 18px);
    gap: clamp(12px, 4vw, 18px);
  }

  .hero-highlight {
    grid-template-columns: 1fr;
  }

  .module-content {
    gap: 18px;
  }

  .module-overview,
  .module-detail {
    padding: 18px;
  }

  .console-grid {
    grid-template-columns: 1fr
  }

  .stats {
    display: none
  }

  .objective-callout {
    flex-direction: column;
    align-items: flex-start;
  }

  .objective-callout .btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 640px) {
  .hero {
    padding-top: clamp(1.5em, 10vw, 2.25em);
  }

  .hero-panel {
    padding: 14px;
  }

  .hero-right {
    gap: 12px;
  }

  .hero-highlight {
    gap: 12px;
  }

  .hero-highlight-meta {
    align-items: flex-start;
  }

  .objective-progress {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .objective-progress-meta {
    white-space: normal;
  }

  .next-objective {
    align-items: flex-start;
    text-align: left;
  }

  .next-header {
    justify-content: flex-start;
  }

  .next-value,
  .next-status {
    text-align: left;
  }
}


/* Scenario bar & cloze */
.scenario-bar {
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--text) 6%, transparent);
  border-radius: 12px;
}

.scenario-item {
  min-width: 180px;
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--text) 4%, transparent);
  padding: 10px 12px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.scenario-item.wide {
  flex: 1 1 260px;
}

.scenario-label {
  font-size: 11px;
  letter-spacing: .08em;
  color: var(--t3);
  text-transform: uppercase;
}

.scenario-value {
  font-size: 18px;
  font-weight: 600;
}

.scenario-sub {
  color: var(--t3);
  font-size: 13px;
}

.freq-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}

.freq-chip {
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--text) 4%, transparent);
  padding: 6px 10px;
  font-size: 12px;
  letter-spacing: .02em;
}

.freq-chip.active {
  border-color: color-mix(in srgb, var(--accent) 40%, transparent);
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  color: var(--accent);
}

.freq-hint {
  margin-top: 4px;
}

.target-main {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.target-text {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
}

.lesson-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--text) 4%, transparent);
  border-radius: 12px;
  position: sticky;
  bottom: 20px;
  z-index: 5;
  backdrop-filter: blur(12px);
  box-shadow: 0 16px 28px rgba(0, 0, 0, .28)
}

.lesson-actions-meta {
  flex: 1 1 220px;
  color: var(--t3);
  font-size: 12px;
  line-height: 1.4;
}

.lesson-actions-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.play-head-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.module-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.module-actions .btn {
  padding: 6px 12px;
  font-size: 12px;
}

.module-actions .btn .v-icon {
  font-size: 16px;
}

.row.wrap {
  flex-wrap: wrap;
}

.controls {
  margin-top: 12px;
}

.readback-panel {
  padding: 16px;
}

.cloze {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  line-height: 1.6;
  text-transform: uppercase;
  letter-spacing: .06em;
}

.blank {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  background: color-mix(in srgb, var(--text) 4%, transparent);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 6px 10px;
  min-width: 100px;
  vertical-align: middle;
  transition: border-color .2s ease, background .2s ease;
}

.blank input {
  background: transparent;
  border: 0;
  color: var(--text);
  min-width: 60px;
  font-size: 14px;
  outline: none;
  text-transform: uppercase;
}

.blank input::placeholder {
  text-transform: uppercase;
}

.blank.size-xs {
  min-width: 70px;
}

.blank.size-sm {
  min-width: 100px;
}

.blank.size-md {
  min-width: 140px;
}

.blank.size-lg {
  min-width: 190px;
}

.blank.size-xl {
  min-width: 240px;
}

.blank.ok {
  border-color: color-mix(in srgb, var(--accent) 50%, transparent);
  background: color-mix(in srgb, var(--accent) 10%, transparent);
}

.blank.warn {
  border-color: color-mix(in srgb, #f97316 40%, transparent);
}

.blank-status {
  position: absolute;
  top: 6px;
  right: 6px;
}

.blank-status.ok {
  color: var(--accent);
}

.blank-status.warn {
  color: #f97316;
}

.blank-feedback {
  margin-top: 4px;
  font-size: 11px;
  color: var(--t3);
  text-transform: none;
  letter-spacing: normal;
}

.field-checks {
  margin-top: 12px;
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.field-check {
  border: 1px dashed color-mix(in srgb, var(--text) 20%, transparent);
  padding: 10px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--text) 3%, transparent);
}

.field-check.ok {
  border-color: color-mix(in srgb, var(--accent) 40%, transparent);
}

.field-name {
  font-size: 12px;
  letter-spacing: .08em;
  color: var(--t3);
  text-transform: uppercase;
  margin-bottom: 4px;
}

.field-answer {
  font-weight: 600;
}

.field-expected {
  font-size: 12px;
  color: var(--t3);
}

/* Mission setup */
.preflight {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-top: 20px;
}

.preflight-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.preflight-title {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.preflight-subtitle {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: .18em;
  color: var(--t3);
}

.mode-select {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.mode-card {
  position: relative;
  border: 1px solid var(--border);
  border-radius: 22px;
  padding: 22px;
  min-height: 190px;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  align-items: flex-end;
  background: linear-gradient(160deg, color-mix(in srgb, var(--text) 6%, transparent) 0%, color-mix(in srgb, var(--bg2) 82%, transparent) 100%);
  transition: transform .25s ease, border-color .25s ease, box-shadow .25s ease;
}

.mode-card::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 20% 20%, color-mix(in srgb, var(--accent) 24%, transparent), transparent 65%);
  opacity: .65;
  pointer-events: none;
}

.mode-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 36px rgba(2, 6, 23, .45);
}

.mode-card.active {
  border-color: color-mix(in srgb, var(--accent) 55%, transparent);
  box-shadow: 0 20px 48px rgba(34, 211, 238, .35);
}

.mode-art {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  opacity: .5;
  mix-blend-mode: screen;
  transform: scale(1.05);
  transition: transform .4s ease, opacity .4s ease;
}

.mode-card.active .mode-art {
  transform: scale(1.12);
  opacity: .65;
}

.mode-copy {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 240px;
}

.mode-copy h3 {
  font-size: 18px;
  font-weight: 600;
}

.mode-copy p {
  font-size: 14px;
  color: var(--t2);
}

.preflight-body {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
}

.preflight-panel {
  border: 1px solid color-mix(in srgb, var(--text) 16%, transparent);
  border-radius: 26px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  background: linear-gradient(160deg, color-mix(in srgb, var(--text) 8%, transparent) 0%, color-mix(in srgb, var(--bg2) 80%, transparent) 100%);
  box-shadow: 0 26px 46px rgba(3, 7, 18, .55);
}

.form-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field span {
  font-size: 11px;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--t3);
}

.field input,
.field select {
  border: 1px solid color-mix(in srgb, var(--text) 18%, transparent);
  border-radius: 12px;
  background: color-mix(in srgb, var(--text) 6%, transparent);
  color: var(--text);
  padding: 10px 12px;
  font-size: 14px;
}

.field input::placeholder {
  color: var(--t3);
}

.field.full {
  grid-column: 1 / -1;
}

.preflight-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.simbrief-input {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 12px;
}

.simbrief-input .field {
  flex: 1 1 240px;
}

.simbrief-link {
  color: var(--accent);
  text-decoration: none;
}

.simbrief-link:hover {
  text-decoration: underline;
}

.preflight-error {
  border: 1px solid color-mix(in srgb, #f87171 60%, transparent);
  background: color-mix(in srgb, #f87171 18%, transparent);
  color: #fecaca;
  padding: 12px 16px;
  border-radius: 14px;
  font-size: 14px;
}

.preflight-preview {
  border: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
  border-radius: 26px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  background: linear-gradient(160deg, color-mix(in srgb, var(--accent) 14%, transparent) 0%, color-mix(in srgb, var(--bg2) 78%, transparent) 100%);
  box-shadow: 0 30px 58px rgba(14, 165, 233, .35);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.preview-title {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.preview-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 11px;
  letter-spacing: .12em;
  text-transform: uppercase;
  background: linear-gradient(110deg, color-mix(in srgb, var(--accent) 70%, transparent), color-mix(in srgb, var(--accent2) 70%, transparent));
  color: #f8fafc;
  box-shadow: 0 12px 24px rgba(14, 165, 233, .32);
}

.preview-route {
  font-size: 14px;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--t2);
}

.preview-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.preview-card {
  border: 1px solid color-mix(in srgb, var(--text) 16%, transparent);
  border-radius: 16px;
  padding: 14px 16px;
  background: color-mix(in srgb, var(--text) 6%, transparent);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.preview-label,
.overview-label {
  font-size: 11px;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--t3);
}

.preview-main,
.overview-value {
  font-weight: 600;
  font-size: 16px;
}

.preview-sub,
.overview-sub {
  font-size: 12px;
  color: var(--t3);
}

.preview-meta,
.overview-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  letter-spacing: .08em;
  text-transform: uppercase;
  border: 1px solid color-mix(in srgb, var(--text) 18%, transparent);
  background: color-mix(in srgb, var(--text) 8%, transparent);
  color: var(--t3);
}

.preview-actions,
.briefing-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

/* Mission briefing */
.mission-briefing {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-top: 20px;
}

.briefing-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.briefing-title {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.briefing-body {
  display: grid;
  gap: 18px;
  grid-template-columns: minmax(260px, 0.9fr) minmax(320px, 1.1fr);
}

.briefing-overview {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.overview-card {
  border: 1px solid color-mix(in srgb, var(--text) 16%, transparent);
  border-radius: 16px;
  padding: 14px 16px;
  background: color-mix(in srgb, var(--text) 6%, transparent);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.briefing-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.briefing-card {
  border: 1px solid color-mix(in srgb, var(--accent) 20%, transparent);
  border-radius: 18px;
  padding: 18px 20px;
  background: linear-gradient(170deg, color-mix(in srgb, var(--accent) 12%, transparent) 0%, color-mix(in srgb, var(--bg2) 85%, transparent) 100%);
  box-shadow: 0 22px 40px rgba(34, 211, 238, .28);
}

.briefing-card h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

.briefing-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
  color: var(--t2);
}

.briefing-list strong {
  color: var(--text);
  font-weight: 600;
}

.briefing-art {
  border: 1px solid color-mix(in srgb, var(--text) 12%, transparent);
  border-radius: 24px;
  min-height: 220px;
  background-size: cover;
  background-position: center;
  box-shadow: 0 30px 60px rgba(2, 6, 23, .6);
}

.hint.secondary {
  opacity: 0.8;
}

.audio-blur {
  filter: blur(8px);
  pointer-events: none;
  user-select: none;
}

.audio-note {
  margin-top: 6px;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes orbFloat {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes badgePulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(34, 211, 238, .25);
  }
  50% {
    box-shadow: 0 0 18px 0 rgba(34, 211, 238, .35);
  }
}

.settings {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.set-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.set-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 70%;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 720px) {
  .tiles {
    margin: 0 -16px;
    padding: 8px 16px 18px;
    gap: 12px;
  }

  .tiles-fade {
    display: none;
  }

  .play .play-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .play-head-right {
    width: 100%;
    align-items: flex-start;
  }

  .stats {
    width: 100%;
    justify-content: space-between;
  }

  .module-actions {
    justify-content: flex-start;
  }

  .scenario-bar {
    flex-direction: column;
  }

  .scenario-item {
    width: 100%;
  }

  .target-text {
    font-size: 16px;
  }

  .lesson-actions {
    position: static;
    bottom: auto;
    box-shadow: none;
    backdrop-filter: none;
  }

  .mode-select {
    grid-template-columns: 1fr;
  }

  .preflight-body {
    grid-template-columns: 1fr;
  }

  .simbrief-input {
    flex-direction: column;
    align-items: stretch;
  }

  .briefing-body {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-orb,
  .metric-card,
  .badge-card,
  .lesson-score {
    animation: none !important;
  }

  .tile,
  .lesson,
  .challenge-card,
  .hero-orb,
  .metric-card,
  .badge-card,
  .hero-highlight-fill,
  .badge-progress-fill {
    transition: none !important;
  }
}

.footer {
  margin: 40px 0 20px;
  text-align: center;
  font-size: 13px;
  color: var(--t3);
}

.footer a {
  color: var(--accent);
  text-decoration: none;
}

.footer a:hover {
  text-decoration: underline;
}


</style>
