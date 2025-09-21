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

      <div class="tile-region">
        <button
            v-if="tileHasOverflow"
            class="carousel-nav prev"
            type="button"
            :disabled="!tileShadows.left"
            @click="scrollTiles('prev')"
            aria-label="Scroll missions back"
        >
          <v-icon size="22">mdi-chevron-left</v-icon>
        </button>

        <div class="tile-carousel" ref="tileScroller" @scroll="onTileScroll">
          <div class="tiles">
            <div
                v-for="m in modules"
                :key="m.id"
                class="tile"
                :class="tileClass(m.id)"
                :ref="el => setModuleTileRef(el, m.id)"
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
        </div>

        <button
            v-if="tileHasOverflow"
            class="carousel-nav next"
            type="button"
            :disabled="!tileShadows.right"
            @click="scrollTiles('next')"
            aria-label="Scroll missions forward"
        >
          <v-icon size="22">mdi-chevron-right</v-icon>
        </button>

        <div class="carousel-shadow left" :class="{ visible: tileShadows.left }"></div>
        <div class="carousel-shadow right" :class="{ visible: tileShadows.right }"></div>
      </div>
    </main>

    <section v-if="panel==='mission-config' && current" class="container mission-config" aria-label="Flight setup">
      <div class="config-shell">
        <div class="config-head">
          <button class="link" type="button" @click="panel='hub'">
            <v-icon size="16">mdi-arrow-left</v-icon>
            Hub
          </button>
          <div class="config-title">{{ current.title }}</div>
          <p class="muted small">Pick how you want to generate this gate-to-gate mission.</p>
        </div>

        <div class="config-modes">
          <button
              v-for="mode in ['random', 'manual', 'simbrief']"
              :key="mode"
              type="button"
              class="config-mode"
              :class="{ active: missionSetupMode === mode }"
              :aria-pressed="missionSetupMode === mode ? 'true' : 'false'"
              @click="selectMissionSetup(mode as FlightSetupMode)"
          >
            <v-icon size="18">{{ mode === 'random' ? 'mdi-dice-5' : mode === 'manual' ? 'mdi-airplane-cog' : 'mdi-cloud-download' }}</v-icon>
            <span>{{ mode === 'random' ? 'Instant flight' : mode === 'manual' ? 'Manual flight' : 'SimBrief import' }}</span>
          </button>
        </div>

        <div class="config-body">
          <div v-if="missionSetupMode==='random'" class="config-panel">
            <div class="config-card">
              <h3 class="config-card-title">Instant mission</h3>
              <p class="muted small">We roll a fresh scenario and lock it across every call.</p>
              <button class="btn primary" type="button" @click="rollRandomFlight">
                <v-icon size="18">mdi-dice-multiple</v-icon>
                Generate flight
              </button>
            </div>
          </div>

          <div v-else-if="missionSetupMode==='manual'" class="config-panel">
            <div class="config-grid">
              <div class="config-section wide">
                <h4 class="section-title">Flight profile</h4>
                <div class="field">
                  <label>Callsign</label>
                  <input v-model="manualPlan.callsign" type="text" placeholder="DLH4AB"/>
                </div>
                <div class="field">
                  <label>Airline telephony</label>
                  <input v-model="manualPlan.airlineCall" type="text" placeholder="Lufthansa"/>
                </div>
                <div class="field">
                  <label>Route string</label>
                  <input v-model="manualPlan.route" type="text" placeholder="TOBAK 5Q, UNOKO transition"/>
                </div>
                <div class="field">
                  <label>Briefing notes</label>
                  <textarea v-model="manualPlan.notes" rows="2" placeholder="Anything special for this flight?"/>
                </div>
              </div>

              <div class="config-section">
                <h4 class="section-title">Departure</h4>
                <div class="field">
                  <label>Airport</label>
                  <select v-model="manualPlan.departure">
                    <option v-for="airport in availableAirports" :key="`dep-${airport.icao}`" :value="airport.icao">
                      {{ airport.icao }} · {{ airport.city }}
                    </option>
                  </select>
                </div>
                <div class="field" v-if="manualDepartureAirport?.runways?.length">
                  <label>Runway</label>
                  <select v-model="manualPlan.runway">
                    <option v-for="rwy in manualDepartureAirport.runways" :key="`dep-rwy-${rwy}`" :value="rwy">{{ rwy }}</option>
                  </select>
                </div>
                <div class="field" v-else>
                  <label>Runway</label>
                  <input v-model="manualPlan.runway" type="text" placeholder="25C"/>
                </div>
                <div class="field">
                  <label>Stand</label>
                  <input v-model="manualPlan.stand" type="text" placeholder="A12"/>
                </div>
                <div class="field">
                  <label>Taxi route</label>
                  <input v-model="manualPlan.taxiRoute" type="text" placeholder="N3 · U4"/>
                </div>
                <div class="field">
                  <label>SID</label>
                  <input v-model="manualPlan.sid" type="text" placeholder="TOBAK 5Q"/>
                </div>
                <div class="field">
                  <label>Transition</label>
                  <input v-model="manualPlan.transition" type="text" placeholder="UNOKO"/>
                </div>
                <div class="field two">
                  <label>Initial altitude</label>
                  <input v-model.number="manualPlan.initialAltitude" type="number" min="0" step="500"/>
                </div>
                <div class="field two">
                  <label>Climb altitude</label>
                  <input v-model.number="manualPlan.climbAltitude" type="number" min="0" step="500"/>
                </div>
                <div class="field">
                  <label>Squawk</label>
                  <input v-model="manualPlan.squawk" type="text" placeholder="4273"/>
                </div>
                <div class="field two">
                  <label>QNH</label>
                  <input v-model.number="manualPlan.qnh" type="number" min="900" max="1100"/>
                </div>
                <div class="field two">
                  <label>ATIS</label>
                  <input v-model="manualPlan.atis" type="text" maxlength="1" placeholder="A"/>
                </div>
              </div>

              <div class="config-section">
                <h4 class="section-title">Arrival</h4>
                <div class="field">
                  <label>Airport</label>
                  <select v-model="manualPlan.destination">
                    <option v-for="airport in availableAirports" :key="`arr-${airport.icao}`" :value="airport.icao">
                      {{ airport.icao }} · {{ airport.city }}
                    </option>
                  </select>
                </div>
                <div class="field" v-if="manualDestinationAirport?.runways?.length">
                  <label>Runway</label>
                  <select v-model="manualPlan.arrivalRunway">
                    <option v-for="rwy in manualDestinationAirport.runways" :key="`arr-rwy-${rwy}`" :value="rwy">{{ rwy }}</option>
                  </select>
                </div>
                <div class="field" v-else>
                  <label>Runway</label>
                  <input v-model="manualPlan.arrivalRunway" type="text" placeholder="24"/>
                </div>
                <div class="field">
                  <label>STAR</label>
                  <input v-model="manualPlan.arrivalStar" type="text" placeholder="UNOKO 1S"/>
                </div>
                <div class="field">
                  <label>Transition</label>
                  <input v-model="manualPlan.arrivalTransition" type="text" placeholder="UNOKO"/>
                </div>
                <div class="field">
                  <label>Approach</label>
                  <input v-model="manualPlan.approach" type="text" placeholder="ILS Z 25C"/>
                </div>
                <div class="field">
                  <label>Taxi-in</label>
                  <input v-model="manualPlan.arrivalTaxiRoute" type="text" placeholder="S · N7"/>
                </div>
                <div class="field">
                  <label>Stand</label>
                  <input v-model="manualPlan.arrivalStand" type="text" placeholder="G5"/>
                </div>
              </div>
            </div>

            <div class="config-actions">
              <button class="btn primary" type="button" @click="buildManualFlight">
                <v-icon size="18">mdi-rocket-launch</v-icon>
                Lock mission
              </button>
              <button class="btn ghost" type="button" @click="resetManualPlan">
                <v-icon size="18">mdi-refresh</v-icon>
                Reset
              </button>
            </div>
          </div>

          <div v-else class="config-panel">
            <div class="config-card">
              <h3 class="config-card-title">SimBrief import</h3>
              <p class="muted small">Paste your pilot ID to pull the latest OFP.</p>
              <div class="field">
                <label for="simbrief-id">SimBrief ID</label>
                <input
                    id="simbrief-id"
                    v-model="simbriefForm.userId"
                    type="text"
                    placeholder="11860000"
                    inputmode="numeric"
                    :disabled="missionLoading"
                    @keyup.enter="loadSimbriefPlan"
                />
              </div>
              <div class="config-actions">
                <button
                    class="btn primary"
                    type="button"
                    :disabled="missionLoading"
                    :aria-busy="missionLoading ? 'true' : 'false'"
                    @click="loadSimbriefPlan"
                >
                  <v-icon size="18" :class="{ spin: missionLoading }">{{ missionLoading ? 'mdi-loading' : 'mdi-download' }}</v-icon>
                  <span v-if="missionLoading">Importing...</span>
                  <span v-else>Import latest plan</span>
                </button>
                <a class="btn ghost" href="https://www.simbrief.com/home/" target="_blank" rel="noopener">
                  <v-icon size="18">mdi-open-in-new</v-icon>
                  SimBrief
                </a>
              </div>
              <p v-if="simbriefForm.planName" class="muted tiny">Last plan: {{ simbriefForm.planName }}<span v-if="simbriefForm.fetchedAt"> · {{ formatBriefTimestamp(simbriefForm.fetchedAt) }}</span></p>
            </div>
          </div>
        </div>

        <p v-if="missionError" class="config-error">{{ missionError }}</p>
      </div>
    </section>

    <section v-if="panel==='mission-brief' && current && missionScenario" class="container mission-brief" aria-label="Mission briefing">
      <div class="brief-shell">
        <div class="brief-head">
          <button class="link" type="button" @click="reopenMissionConfig">
            <v-icon size="16">mdi-arrow-left</v-icon>
            Flight setup
          </button>
          <div class="brief-title">Mission briefing</div>
          <p class="muted small">One linked scenario before the radio check.</p>
        </div>

        <div class="brief-hero">
          <div class="callsign-chip">{{ missionScenario.radioCall }}</div>
          <div class="brief-route">{{ missionScenario.airport.icao }} → {{ missionScenario.destination.icao }}</div>
          <div class="brief-source">
            <span class="badge">{{ missionSourceLabel }}</span>
            <span v-if="missionPlanTitle" class="source-label">{{ missionPlanTitle }}</span>
            <span v-if="missionPlanTime" class="muted tiny"> · {{ missionPlanTime }}</span>
          </div>
          <p v-if="missionPlanRoute" class="muted small">Route: {{ missionPlanRoute }}</p>
          <p v-if="missionPlanNotes" class="muted small">Notes: {{ missionPlanNotes }}</p>
          <a v-if="missionSimbriefLink" class="btn ghost mini" :href="missionSimbriefLink" target="_blank" rel="noopener">
            <v-icon size="16">mdi-open-in-new</v-icon>
            Open SimBrief
          </a>
        </div>

        <div class="brief-grid">
          <div class="brief-section" v-if="missionBriefingFacts?.departure?.length">
            <h4>Departure</h4>
            <dl>
              <div v-for="fact in missionBriefingFacts.departure" :key="`dep-${fact.label}`" class="fact-row">
                <dt>{{ fact.label }}</dt>
                <dd>{{ fact.value }}</dd>
              </div>
            </dl>
          </div>
          <div class="brief-section" v-if="missionBriefingFacts?.enroute?.length">
            <h4>Enroute</h4>
            <dl>
              <div v-for="fact in missionBriefingFacts.enroute" :key="`en-${fact.label}`" class="fact-row">
                <dt>{{ fact.label }}</dt>
                <dd>{{ fact.value }}</dd>
              </div>
            </dl>
          </div>
          <div class="brief-section" v-if="missionBriefingFacts?.arrival?.length">
            <h4>Arrival</h4>
            <dl>
              <div v-for="fact in missionBriefingFacts.arrival" :key="`arr-${fact.label}`" class="fact-row">
                <dt>{{ fact.label }}</dt>
                <dd>{{ fact.value }}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div class="brief-frequencies" v-if="missionFrequencyGroups.length">
          <h4>Frequencies</h4>
          <div class="freq-columns">
            <div class="freq-card" v-for="group in missionFrequencyGroups" :key="group.title">
              <div class="freq-title">{{ group.title }}</div>
              <ul>
                <li v-for="freq in group.items" :key="freq.type">
                  <span class="freq-label">{{ freq.label }}</span>
                  <span class="freq-value">{{ freq.value }}</span>
                  <span class="freq-speech muted tiny">{{ freq.speech }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div class="brief-actions">
          <button class="btn soft" type="button" @click="reopenMissionConfig">
            <v-icon size="18">mdi-airplane-cog</v-icon>
            Adjust flight
          </button>
          <button class="btn primary" type="button" @click="launchMissionFromBrief">
            <v-icon size="18">mdi-play</v-icon>
            Start mission
          </button>
        </div>
      </div>
    </section>


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
        <div class="stats">
          <span class="stat"><v-icon size="18">mdi-progress-check</v-icon> {{
              doneCount(current.id)
            }}/{{ current.lessons.length }}</span>
          <span class="stat"><v-icon size="18">mdi-star</v-icon> Ø {{ avgScore(current.id) }}%</span>
        </div>
        <button
            v-if="moduleSupportsFlightConfig(current)"
            class="btn ghost mini"
            type="button"
            @click="current && prepareMissionConfig(current)"
        >
          <v-icon size="16">mdi-airplane-cog</v-icon>
          Change flight
        </button>
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
import {configureFullFlightScenario, learnModules, resetFullFlightScenario} from '~~/shared/data/learnModules'
import {createBaseScenario, createScenarioFromPlan, getScenarioAirport, listScenarioAirports} from '~~/shared/learn/scenario'
import type {BlankWidth, Frequency, Lesson, LessonField, ModuleDef, Scenario} from '~~/shared/learn/types'
import type {FlightPlanOverrides} from '~~/shared/learn/scenario'
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

type PanelView = 'hub' | 'module' | 'mission-config' | 'mission-brief'
type FlightSetupMode = 'random' | 'manual' | 'simbrief'
type MissionPlanDetails = {
  mode: FlightSetupMode
  route?: string
  notes?: string
  planLabel?: string
  simbriefId?: string
  simbriefUrl?: string
  fetchedAt?: string
}

type ManualPlanForm = {
  callsign: string
  airlineCall: string
  route: string
  notes: string
  departure: string
  destination: string
  runway: string
  stand: string
  taxiRoute: string
  sid: string
  transition: string
  approach: string
  initialAltitude: number
  climbAltitude: number
  squawk: string
  qnh: number
  atis: string
  arrivalRunway: string
  arrivalStand: string
  arrivalTaxiRoute: string
  arrivalStar: string
  arrivalTransition: string
}

type SimBriefFormState = {
  userId: string
  route: string
  planName: string
  fetchedAt: string
}

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

const missionScenario = ref<Scenario | null>(null)
const missionPlanDetails = ref<MissionPlanDetails | null>(null)
const missionSetupMode = ref<FlightSetupMode>('random')
const missionError = ref<string | null>(null)
const missionLoading = ref(false)
const availableAirports = listScenarioAirports()
const manualPlan = reactive<ManualPlanForm>({
  callsign: '',
  airlineCall: '',
  route: '',
  notes: '',
  departure: availableAirports[0]?.icao || '',
  destination: availableAirports[1]?.icao || availableAirports[0]?.icao || '',
  runway: '',
  stand: '',
  taxiRoute: '',
  sid: '',
  transition: '',
  approach: '',
  initialAltitude: 5000,
  climbAltitude: 7000,
  squawk: '',
  qnh: 1015,
  atis: 'A',
  arrivalRunway: '',
  arrivalStand: '',
  arrivalTaxiRoute: '',
  arrivalStar: '',
  arrivalTransition: ''
})
const simbriefForm = reactive<SimBriefFormState>({
  userId: '',
  route: '',
  planName: '',
  fetchedAt: ''
})
const toast = ref({show: false, text: ''})
const showSettings = ref(false)
const api = useApi()

const manualDepartureAirport = computed(() => (manualPlan.departure ? getScenarioAirport(manualPlan.departure) || null : null))
const manualDestinationAirport = computed(() => (manualPlan.destination ? getScenarioAirport(manualPlan.destination) || null : null))

const tileScroller = ref<HTMLElement | null>(null)
const tileHasOverflow = ref(false)
const tileShadows = reactive({left: false, right: false})
const moduleTileRefs = new Map<string, HTMLElement>()
const lastModuleId = ref<string | null>(null)

watch(
    () => manualPlan.departure,
    () => {
      const airport = manualDepartureAirport.value
      if (!airport) return
      if (!airport.runways.includes(manualPlan.runway)) {
        manualPlan.runway = airport.runways[0] || manualPlan.runway
      }
      if (airport.stands.length && !airport.stands.includes(manualPlan.stand)) {
        manualPlan.stand = airport.stands[0]
      }
      if (airport.taxi.length && !airport.taxi.includes(manualPlan.taxiRoute)) {
        manualPlan.taxiRoute = airport.taxi[0]
      }
      if (airport.sids?.length && !airport.sids.includes(manualPlan.sid)) {
        manualPlan.sid = airport.sids[0]
      }
      if (airport.transitions?.length && !airport.transitions.includes(manualPlan.transition)) {
        manualPlan.transition = airport.transitions[0]
      }
    },
    {immediate: true}
)

watch(
    () => manualPlan.destination,
    () => {
      const airport = manualDestinationAirport.value
      if (!airport) return
      if (!airport.runways.includes(manualPlan.arrivalRunway)) {
        manualPlan.arrivalRunway = airport.runways[0] || manualPlan.arrivalRunway
      }
      if (airport.stands.length && !airport.stands.includes(manualPlan.arrivalStand)) {
        manualPlan.arrivalStand = airport.stands[0]
      }
      if (airport.taxiIn?.length && !airport.taxiIn.includes(manualPlan.arrivalTaxiRoute)) {
        manualPlan.arrivalTaxiRoute = airport.taxiIn[0]
      }
      if (airport.stars?.length && !airport.stars.includes(manualPlan.arrivalStar)) {
        manualPlan.arrivalStar = airport.stars[0]
      }
      if (airport.arrivalTransitions?.length && !airport.arrivalTransitions.includes(manualPlan.arrivalTransition)) {
        manualPlan.arrivalTransition = airport.arrivalTransitions[0]
      }
    },
    {immediate: true}
)

watch(
    () => manualPlan.atis,
    value => {
      const normalized = value ? value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 1) : ''
      if (normalized !== value) {
        manualPlan.atis = normalized
      }
    }
)

watch(
    () => manualPlan.initialAltitude,
    value => {
      if (value > manualPlan.climbAltitude) {
        manualPlan.climbAltitude = Math.max(value + 1000, manualPlan.climbAltitude)
      }
    }
)

function pickString(...values: Array<unknown>): string | undefined {
  for (const value of values) {
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (trimmed) return trimmed
    }
  }
  return undefined
}

function pickNumber(...values: Array<unknown>): number | undefined {
  for (const value of values) {
    const numeric = typeof value === 'number' ? value : Number(value)
    if (Number.isFinite(numeric)) {
      return numeric
    }
  }
  return undefined
}

function formatBriefTimestamp(value?: string | null): string | null {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toLocaleString(undefined, {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'})
}

function setModuleTileRef(el: Element | null, id: string) {
  if (!el) {
    moduleTileRefs.delete(id)
    return
  }
  moduleTileRefs.set(id, el as HTMLElement)
}

function updateTileShadows() {
  const scroller = tileScroller.value
  if (!scroller) {
    tileShadows.left = false
    tileShadows.right = false
    return
  }
  const {scrollLeft, clientWidth, scrollWidth} = scroller
  tileShadows.left = scrollLeft > 8
  tileShadows.right = scrollLeft + clientWidth < scrollWidth - 8
}

function checkTileOverflow() {
  const scroller = tileScroller.value
  if (!scroller) {
    tileHasOverflow.value = false
    tileShadows.left = false
    tileShadows.right = false
    return
  }
  tileHasOverflow.value = scroller.scrollWidth > scroller.clientWidth + 4
  updateTileShadows()
}

function scrollTiles(direction: 'prev' | 'next') {
  const scroller = tileScroller.value
  if (!scroller) return
  const offset = direction === 'next' ? scroller.clientWidth * 0.8 : scroller.clientWidth * -0.8
  scroller.scrollBy({left: offset, behavior: 'smooth'})
}

function scrollModuleIntoView(id: string) {
  const scroller = tileScroller.value
  const tile = moduleTileRefs.get(id)
  if (!scroller || !tile) return
  const offsetLeft = tile.offsetLeft
  const offsetRight = offsetLeft + tile.offsetWidth
  const viewLeft = scroller.scrollLeft
  const viewRight = viewLeft + scroller.clientWidth
  if (offsetLeft < viewLeft || offsetRight > viewRight) {
    scroller.scrollTo({left: Math.max(0, offsetLeft - scroller.clientWidth * 0.1), behavior: 'smooth'})
  }
}

const onTileScroll = () => updateTileShadows()

function onWindowResize() {
  checkTileOverflow()
}

watch(
    () => panel.value,
    value => {
      if (value === 'hub') {
        nextTick(() => {
          checkTileOverflow()
          if (lastModuleId.value) {
            scrollModuleIntoView(lastModuleId.value)
          }
        })
      }
    }
)

watch(
    () => modules.value.length,
    () => {
      nextTick(() => checkTileOverflow())
    }
)

watch(
    () => tileScroller.value,
    () => {
      nextTick(() => checkTileOverflow())
    }
)

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
      cfg.value = {...defaultCfg, ...(response.config || {})}
    } else {
      xp.value = 0
      progress.value = {} as LearnProgress
      cfg.value = {...defaultCfg}
    }
    dirtyState.xp = false
    dirtyState.progress = false
    dirtyState.config = false
  } catch (err) {
    console.error('Failed to load learn state', err)
    xp.value = 0
    progress.value = {} as LearnProgress
    cfg.value = {...defaultCfg}
  } finally {
    audioReveal.value = !cfg.value.audioChallenge
  }
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
  if (isClient) {
    window.removeEventListener('resize', onWindowResize)
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
  lastModuleId.value = id
  nextTick(() => scrollModuleIntoView(id))
}

function quickContinue(id: string, force = false) {
  const module = modules.value.find(item => item.id === id)
  if (!module) return
  if (!force && module.missionOptions?.flightConfigurable && !moduleHasProgress(module.id)) {
    prepareMissionConfig(module)
    return
  }
  openModule(module.id)
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
    'is-focused': current.value?.id === modId && panel.value !== 'hub'
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
  quickContinue(modId)
}

function modulePrimaryLabel(modId: string) {
  if (moduleCompleted(modId)) return 'Replay mission'
  if (!moduleHasProgress(modId)) return 'Launch mission'
  return 'Resume mission'
}

function modulePrimaryIcon(modId: string) {
  if (moduleCompleted(modId)) return 'mdi-history'
  if (!moduleHasProgress(modId)) return 'mdi-rocket-launch'
  return 'mdi-progress-clock'
}

function moduleSecondaryLabel(modId: string) {
  return moduleHasProgress(modId) ? 'Overview' : 'Preview'
}

function moduleSecondaryIcon(modId: string) {
  return moduleHasProgress(modId) ? 'mdi-view-grid-outline' : 'mdi-information-outline'
}

function moduleSupportsFlightConfig(module?: ModuleDef | null) {
  return Boolean(module?.missionOptions?.flightConfigurable)
}

function resetManualPlan() {
  const departureDefault = availableAirports[0]?.icao || ''
  const destinationDefault = availableAirports[1]?.icao || departureDefault
  manualPlan.callsign = ''
  manualPlan.airlineCall = ''
  manualPlan.route = ''
  manualPlan.notes = ''
  manualPlan.initialAltitude = 5000
  manualPlan.climbAltitude = 7000
  manualPlan.squawk = ''
  manualPlan.qnh = 1015
  manualPlan.atis = 'A'
  manualPlan.departure = ''
  manualPlan.destination = ''
  manualPlan.runway = ''
  manualPlan.stand = ''
  manualPlan.taxiRoute = ''
  manualPlan.sid = ''
  manualPlan.transition = ''
  manualPlan.approach = ''
  manualPlan.arrivalRunway = ''
  manualPlan.arrivalStand = ''
  manualPlan.arrivalTaxiRoute = ''
  manualPlan.arrivalStar = ''
  manualPlan.arrivalTransition = ''
  manualPlan.departure = departureDefault
  manualPlan.destination = destinationDefault
}

function resetMissionSetup(mode: FlightSetupMode = 'random') {
  missionScenario.value = null
  missionPlanDetails.value = null
  missionError.value = null
  missionLoading.value = false
  missionSetupMode.value = mode
}

function prepareMissionConfig(module: ModuleDef) {
  current.value = module
  lastModuleId.value = module.id
  resetMissionSetup('random')
  resetManualPlan()
  simbriefForm.userId = ''
  simbriefForm.route = ''
  simbriefForm.planName = ''
  simbriefForm.fetchedAt = ''
  panel.value = 'mission-config'
  resetFullFlightScenario()
  nextTick(() => {
    checkTileOverflow()
    scrollModuleIntoView(module.id)
  })
}

function selectMissionSetup(mode: FlightSetupMode) {
  missionSetupMode.value = mode
  missionError.value = null
}

function beginMission(mode: FlightSetupMode, mission: Scenario, details: Partial<MissionPlanDetails> = {}) {
  missionScenario.value = mission
  missionSetupMode.value = mode
  const timestamp = details.fetchedAt || new Date().toISOString()
  missionPlanDetails.value = {
    mode,
    route: details.route ?? `${mission.airport.icao} → ${mission.destination.icao}`,
    notes: details.notes,
    planLabel: details.planLabel ?? (mode === 'random' ? 'Generated flight plan' : details.planLabel),
    simbriefId: details.simbriefId,
    simbriefUrl: details.simbriefUrl,
    fetchedAt: timestamp
  }
  missionError.value = null
  missionLoading.value = false
  resetFullFlightScenario()
  configureFullFlightScenario(() => mission)
  panel.value = 'mission-brief'
}

function rollRandomFlight() {
  missionError.value = null
  const mission = createBaseScenario()
  beginMission('random', mission, {planLabel: 'Generated flight plan'})
}

function buildManualFlight() {
  missionError.value = null
  if (!manualPlan.callsign.trim()) {
    missionError.value = 'Add a callsign before launching the mission.'
    return
  }
  const overrides: FlightPlanOverrides = {
    callsign: manualPlan.callsign,
    airlineCall: manualPlan.airlineCall,
    departure: {
      icao: manualPlan.departure,
      name: manualDepartureAirport.value?.name,
      city: manualDepartureAirport.value?.city
    },
    destination: {
      icao: manualPlan.destination,
      name: manualDestinationAirport.value?.name,
      city: manualDestinationAirport.value?.city
    },
    runway: manualPlan.runway,
    stand: manualPlan.stand,
    taxiRoute: manualPlan.taxiRoute,
    sid: manualPlan.sid,
    transition: manualPlan.transition,
    approach: manualPlan.approach,
    initialAltitude: manualPlan.initialAltitude,
    climbAltitude: manualPlan.climbAltitude,
    squawk: manualPlan.squawk,
    qnh: manualPlan.qnh,
    atisCode: manualPlan.atis,
    arrivalRunway: manualPlan.arrivalRunway,
    arrivalTaxiRoute: manualPlan.arrivalTaxiRoute,
    arrivalStand: manualPlan.arrivalStand,
    arrivalStar: manualPlan.arrivalStar,
    arrivalTransition: manualPlan.arrivalTransition
  }
  const mission = createScenarioFromPlan(overrides)
  beginMission('manual', mission, {
    route: manualPlan.route || undefined,
    notes: manualPlan.notes || undefined,
    planLabel: 'Custom gate-to-gate flight'
  })
}

async function loadSimbriefPlan() {
  const userId = simbriefForm.userId.trim()
  if (!userId) {
    missionError.value = 'Enter your SimBrief pilot ID first.'
    return
  }
  missionError.value = null
  missionLoading.value = true
  try {
    const response: any = await api.get('/api/simbrief/plan', {query: {userId}})
    const plan = response?.flightplan ?? response
    if (!plan) {
      throw new Error('No flight plan returned')
    }
    const general = plan.general ?? {}
    const origin = plan.origin ?? plan.departure ?? {}
    const destination = plan.destination ?? {}
    const atc = plan.atc ?? {}

    const overrides: FlightPlanOverrides = {
      callsign: pickString(general.callsign, general.icao_callsign, general.flt_id, general.icao_airline && general.icao_flight_number ? `${general.icao_airline}${general.icao_flight_number}` : undefined),
      airlineCode: pickString(general.icao_airline),
      airlineCall: pickString(general.airline, general.callsign?.replace(/[0-9]/g, '')), 
      flightNumber: pickString(general.icao_flight_number, general.flight_number),
      departure: {
        icao: pickString(origin.icao_code, origin.icao, origin.id) ?? undefined,
        name: pickString(origin.name, origin.plan_name),
        city: pickString(origin.pos_name, origin.city)
      },
      destination: {
        icao: pickString(destination.icao_code, destination.icao, destination.id) ?? undefined,
        name: pickString(destination.name, destination.plan_name),
        city: pickString(destination.pos_name, destination.city)
      },
      runway: pickString(origin.plan_rwy, origin.plan_runway, origin.departure_rwy, origin.runway),
      stand: pickString(origin.gate, origin.gate_id, origin.stand),
      taxiRoute: pickString(origin.taxi_route),
      sid: pickString(origin.sid, atc.sid),
      transition: pickString(origin.transition, atc.transition),
      approach: pickString(destination.approach, atc.approach),
      initialAltitude: pickNumber(atc.initial_altitude, atc.initial_alt, plan.initial_altitude),
      climbAltitude: pickNumber(atc.final_altitude, atc.cruise_altitude, plan.final_altitude, plan.cruise_altitude),
      squawk: pickString(plan.squawk, atc.squawk),
      qnh: pickNumber(origin.qnh, plan.qnh),
      atisCode: pickString(plan.atis_code, origin.atis_code),
      arrivalRunway: pickString(destination.plan_rwy, destination.plan_runway, destination.arrival_rwy, destination.runway),
      arrivalTaxiRoute: pickString(destination.taxi_route),
      arrivalStand: pickString(destination.gate, destination.stand),
      arrivalStar: pickString(destination.star, atc.star),
      arrivalTransition: pickString(destination.transition, atc.arrival_transition),
      arrivalQnh: pickNumber(destination.qnh),
      arrivalWind: pickString(destination.wind),
      pushDelayMinutes: pickNumber(plan.push_time, plan.push_delay),
      speedRestriction: pickNumber(plan.speed_restriction, atc.speed_restriction),
      vectorHeading: pickString(plan.vector_heading, atc.vector_heading),
      emergencyHeading: pickString(plan.emergency_heading, atc.emergency_heading),
      remarks: pickString(plan.remarks, general.remarks)
    }

    const mission = createScenarioFromPlan(overrides)
    const fetchedAt = new Date().toISOString()
    simbriefForm.planName = pickString(general.callsign, general.flight_number, general.icao_flight_number) || 'SimBrief flight'
    simbriefForm.route = pickString(atc.route, plan.route, general.route) || ''
    simbriefForm.fetchedAt = fetchedAt

    beginMission('simbrief', mission, {
      route: simbriefForm.route || undefined,
      planLabel: simbriefForm.planName || 'SimBrief plan',
      simbriefId: userId,
      simbriefUrl: `https://www.simbrief.com/home/?id=${encodeURIComponent(userId)}`,
      fetchedAt
    })
  } catch (error: any) {
    missionError.value = error?.data?.message || error?.message || 'Could not load the latest SimBrief plan.'
  } finally {
    missionLoading.value = false
  }
}

function launchMissionFromBrief() {
  if (!current.value) return
  quickContinue(current.value.id, true)
}

function reopenMissionConfig() {
  if (!current.value) return
  panel.value = 'mission-config'
  missionError.value = null
}

const missionSourceLabel = computed(() => {
  const details = missionPlanDetails.value
  if (!details) return ''
  if (details.mode === 'manual') return 'Custom flight'
  if (details.mode === 'simbrief') return 'SimBrief import'
  return 'Generated mission'
})

const missionPlanTitle = computed(() => missionPlanDetails.value?.planLabel || missionSourceLabel.value)
const missionPlanRoute = computed(() => missionPlanDetails.value?.route?.trim() || '')
const missionPlanNotes = computed(() => missionPlanDetails.value?.notes?.trim() || '')
const missionPlanTime = computed(() => formatBriefTimestamp(missionPlanDetails.value?.fetchedAt))
const missionSimbriefLink = computed(() => missionPlanDetails.value?.simbriefUrl || (missionPlanDetails.value?.simbriefId ? `https://www.simbrief.com/home/?id=${encodeURIComponent(missionPlanDetails.value.simbriefId)}` : null))

const missionBriefingFacts = computed(() => {
  if (!missionScenario.value) return null
  const mission = missionScenario.value
  const format = (items: Array<{label: string; value?: string | null}>) =>
    items
        .map(item => ({label: item.label, value: item.value?.toString().trim()}))
        .filter(item => Boolean(item.value)) as Array<{label: string; value: string}>
  return {
    departure: format([
      {label: 'Airport', value: `${mission.airport.icao} · ${mission.airport.name}`},
      {label: 'Stand', value: mission.stand},
      {label: 'Runway', value: mission.runway},
      {label: 'SID', value: mission.sid},
      {label: 'Transition', value: mission.transition},
      {label: 'Initial altitude', value: `${mission.altitudes.initial} ft`},
      {label: 'Squawk', value: mission.squawk}
    ]),
    enroute: format([
      {label: 'Climb altitude', value: `${mission.altitudes.climb} ft`},
      {label: 'Speed restriction', value: mission.speedRestriction ? `${mission.speedRestriction} kt` : undefined},
      {label: 'Vector heading', value: mission.vectorHeading},
      {label: 'Push delay', value: mission.pushDelayMinutes ? `${mission.pushDelayMinutes} min` : undefined},
      {label: 'ATIS', value: mission.atisCode ? `Information ${mission.atisCode}` : undefined},
      {label: 'QNH', value: mission.qnh ? `QNH ${mission.qnh}` : undefined}
    ]),
    arrival: format([
      {label: 'Airport', value: `${mission.destination.icao} · ${mission.destination.name}`},
      {label: 'Runway', value: mission.arrivalRunway},
      {label: 'STAR', value: mission.arrivalStar},
      {label: 'Transition', value: mission.arrivalTransition},
      {label: 'Approach', value: mission.approach},
      {label: 'Stand', value: mission.arrivalStand},
      {label: 'Taxi-in', value: mission.arrivalTaxiRoute}
    ])
  }
})

const missionFrequencyGroups = computed(() => {
  if (!missionScenario.value) return []
  const mission = missionScenario.value
  const groups = [
    {title: 'Ground Ops', keys: ['ATIS', 'DEL', 'GND']},
    {title: 'Tower', keys: ['TWR', 'DEP']},
    {title: 'Approach', keys: ['APP', 'CTR']}
  ]
  return groups
      .map(group => ({
        title: group.title,
        items: mission.frequencies
            .filter(freq => group.keys.includes(freq.type))
            .map(freq => ({
              ...freq,
              speech: mission.frequencyWords[freq.type]
            }))
      }))
      .filter(group => group.items.length)
})

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
  cfg.value = {...defaultCfg}
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
  nextTick(() => checkTileOverflow())
  if (isClient) {
    window.addEventListener('resize', onWindowResize)
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

/* Mission setup */
.mission-config {
  position: relative;
  padding-top: 20px;
}

.mission-config::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 18%, transparent), color-mix(in srgb, var(--accent2) 18%, transparent)), url('/img/learn/missions/full-flight-config.jpg');
  background-size: cover;
  background-position: center;
  filter: blur(60px);
  opacity: .55;
  transform: scale(1.05);
}

.mission-config .config-shell {
  position: relative;
  z-index: 1;
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--text) 6%, transparent);
  border-radius: 24px;
  padding: clamp(18px, 4vw, 28px);
  display: flex;
  flex-direction: column;
  gap: 22px;
  box-shadow: 0 30px 80px rgba(2, 6, 23, .45);
}

.config-head {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.config-title {
  font-size: clamp(22px, 3.5vw, 28px);
  font-weight: 600;
}

.config-modes {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.config-mode {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--text) 4%, transparent);
  color: var(--t2);
  transition: border-color .2s ease, background .2s ease, color .2s ease;
}

.config-mode.active {
  border-color: color-mix(in srgb, var(--accent) 45%, transparent);
  background: color-mix(in srgb, var(--accent) 18%, transparent);
  color: var(--accent);
}

.config-body {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.config-panel {
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: clamp(16px, 3vw, 22px);
  background: color-mix(in srgb, var(--text) 6%, transparent);
}

.config-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.config-card-title {
  font-size: 20px;
  font-weight: 600;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 18px;
}

.config-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  border: 1px solid color-mix(in srgb, var(--text) 6%, transparent);
  border-radius: 18px;
  padding: 16px;
  background: color-mix(in srgb, var(--text) 4%, transparent);
}

.config-section.wide {
  grid-column: span 2;
}

.config-section .section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--t2);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field label {
  font-size: 12px;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--t3);
}

.field input,
.field select,
.field textarea {
  background: color-mix(in srgb, var(--text) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--text) 12%, transparent);
  border-radius: 12px;
  padding: 10px 12px;
  color: var(--text);
  font: inherit;
}

.field textarea {
  resize: vertical;
  min-height: 72px;
}

.field.two {
  max-width: 180px;
}

.config-actions {
  margin-top: 10px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.config-error {
  color: #f87171;
  font-weight: 600;
}

/* Mission briefing */
.mission-brief {
  position: relative;
  padding-top: 20px;
}

.mission-brief::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, color-mix(in srgb, var(--accent2) 18%, transparent), color-mix(in srgb, var(--bg2) 20%, transparent)), url('/img/learn/missions/full-flight-brief.jpg');
  background-size: cover;
  background-position: center;
  filter: blur(70px);
  opacity: .5;
  transform: scale(1.05);
}

.mission-brief .brief-shell {
  position: relative;
  z-index: 1;
  border: 1px solid var(--border);
  border-radius: 24px;
  background: color-mix(in srgb, var(--text) 8%, transparent);
  padding: clamp(18px, 4vw, 28px);
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-shadow: 0 30px 70px rgba(2, 6, 23, .5);
}

.brief-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.brief-title {
  font-size: clamp(22px, 3.2vw, 30px);
  font-weight: 600;
}

.brief-hero {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.callsign-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: linear-gradient(120deg, color-mix(in srgb, var(--accent) 45%, transparent), color-mix(in srgb, var(--accent2) 40%, transparent));
  color: #0f172a;
  font-weight: 600;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.brief-route {
  font-size: clamp(20px, 3vw, 28px);
  font-weight: 600;
}

.brief-source {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.brief-source .badge {
  background: color-mix(in srgb, var(--accent) 30%, transparent);
  color: var(--accent);
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  letter-spacing: .1em;
  text-transform: uppercase;
}

.source-label {
  font-size: 14px;
  color: var(--t2);
}

.brief-grid {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

.brief-section {
  border: 1px solid color-mix(in srgb, var(--text) 10%, transparent);
  border-radius: 18px;
  padding: 14px;
  background: color-mix(in srgb, var(--text) 5%, transparent);
}

.brief-section h4 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
}

.fact-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 14px;
  padding: 6px 0;
  border-bottom: 1px solid color-mix(in srgb, var(--text) 8%, transparent);
}

.fact-row:last-child {
  border-bottom: none;
}

.fact-row dt {
  color: var(--t3);
  font-size: 12px;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.fact-row dd {
  margin: 0;
  color: var(--t2);
  font-weight: 500;
}

.brief-frequencies {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.freq-columns {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.freq-card {
  border: 1px solid color-mix(in srgb, var(--text) 8%, transparent);
  border-radius: 16px;
  padding: 12px;
  background: color-mix(in srgb, var(--text) 4%, transparent);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.freq-title {
  font-size: 13px;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: var(--t3);
}

.freq-label {
  font-weight: 600;
}

.freq-value {
  font-family: 'JetBrains Mono', monospace;
}

.freq-speech {
  display: block;
}

.brief-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.callsign-chip v-icon {
  color: #0f172a;
}

/* HUB tiles */
.hub-head {
  margin: 6px 0 10px
}

.tiles {
  display: flex;
  gap: 16px;
  padding: 10px 4px 18px;
  min-width: max-content;
  scroll-snap-type: x mandatory
}

.tile {
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--text) 6%, transparent);
  display: flex;
  flex-direction: column;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 12px 26px rgba(0, 0, 0, .25);
  transition: transform .25s ease, box-shadow .25s ease;
  position: relative;
  min-height: 360px
}

.tile-region {
  position: relative;
  display: flex;
  align-items: stretch;
  gap: 12px;
}

.tile-carousel {
  overflow-x: auto;
  flex: 1;
  scroll-behavior: smooth;
}

.tile-carousel::-webkit-scrollbar {
  height: 8px;
}

.tile-carousel::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 999px;
}

.tile {
  scroll-snap-align: center;
  flex: 0 0 280px;
}

.tile.is-focused {
  border-color: color-mix(in srgb, var(--accent) 50%, transparent);
  box-shadow: 0 20px 48px rgba(34, 211, 238, .25);
}

.carousel-nav {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--text) 6%, transparent);
  color: var(--t2);
  transition: background .2s ease, border-color .2s ease;
}

.carousel-nav:disabled {
  opacity: .45;
  cursor: not-allowed;
}

.carousel-nav:not(:disabled):hover {
  border-color: color-mix(in srgb, var(--accent) 35%, transparent);
  color: var(--accent);
}

.carousel-shadow {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 48px;
  pointer-events: none;
  opacity: 0;
  transition: opacity .2s ease;
}

.carousel-shadow.left {
  left: 0;
  background: linear-gradient(90deg, var(--bg) 0%, transparent 100%);
}

.carousel-shadow.right {
  right: 0;
  background: linear-gradient(270deg, var(--bg) 0%, transparent 100%);
}

.carousel-shadow.visible {
  opacity: 1;
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

  .config-shell {
    padding: 18px;
  }

  .config-grid {
    grid-template-columns: 1fr;
  }

  .config-section.wide {
    grid-column: span 1;
  }

  .brief-shell {
    padding: 18px;
  }

  .brief-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .brief-actions {
    justify-content: flex-start;
  }

  .freq-columns {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
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

  .config-modes {
    flex-direction: column;
  }

  .config-mode {
    width: 100%;
    justify-content: center;
  }

  .config-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .config-actions .btn {
    width: 100%;
    justify-content: center;
  }

  .brief-hero {
    align-items: flex-start;
  }

  .brief-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .brief-actions .btn {
    width: 100%;
    justify-content: center;
  }

  .freq-columns {
    grid-template-columns: 1fr;
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
