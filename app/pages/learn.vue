<template>
  <div class="scene">
    <!-- APP BAR -->
    <header class="hud" role="banner">
      <nav class="hud-inner" aria-label="Global">
        <div class="hud-left">
          <!-- 9-Dots App-Icon → Dashboard -->
          <button class="icon-btn" title="Dashboard" @click="panel='hub'">
            <v-icon size="22" class="text-accent">mdi-view-grid</v-icon>
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



    <!-- HUB -->
    <main v-if="panel==='hub'" class="container" role="main">
      <div class="hub-head">
        <h2 class="h2">Training Mission Hub</h2>
        <div class="muted">Start with the ICAO alphabet & numbers, then basics, ground, and more.</div>
      </div>

      <div class="tiles">
        <div
            v-for="m in modules"
            :key="m.id"
            class="tile"
            :class="tileClass(m.id)"
        >
          <div class="tile-media" :style="{ backgroundImage: `url(${m.art})` }">
            <span v-if="isFreshModule(m.id)" class="tile-badge">
              <v-icon size="16">mdi-star</v-icon>
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
    </main>

    <!-- MODULE -->

    <section
        v-if="panel==='module' && current"
        class="container play"
        :class="{ 'has-lesson-actions': moduleStage==='lessons' && activeLesson }"
        aria-label="Module"
    >
      <div class="play-head">
        <div class="crumbs">
          <button class="link" @click="goToHub">
            <v-icon size="16">mdi-arrow-left</v-icon>
            Hub
          </button>
          <span class="muted" v-if="moduleStage==='lessons'">/ {{ current.title }}</span>
          <span class="muted" v-else-if="moduleStage==='setup'">/ Mission setup</span>
          <span class="muted" v-else>/ Mission briefing</span>
        </div>
        <div class="play-tools">
          <div v-if="requiresFlightPlan" class="plan-status" :class="{ 'is-ready': !!currentPlan }">
            <div class="plan-status-icon">
              <v-icon :icon="currentPlan ? 'mdi-check-circle-outline' : 'mdi-alert-circle-outline'" size="22" />
            </div>
            <div class="plan-status-body">
              <span class="plan-status-title">
                {{ currentPlan ? (currentPlan.scenario.callsign || currentPlan.scenario.radioCall) : 'Flight plan pending' }}
              </span>
              <span class="plan-status-sub" v-if="currentPlan">{{ currentPlanRoute }}</span>
              <span class="plan-status-sub muted" v-else>Select or import a flight to launch.</span>
            </div>
            <div v-if="currentPlan && moduleStage==='lessons'" class="plan-status-actions">
              <button class="btn ghost mini" type="button" @click="restartCurrentMission()">
                <v-icon size="16">mdi-refresh</v-icon>
                Plan new flight
              </button>
              <button class="btn ghost mini" type="button" @click="openMissionBriefing()">
                <v-icon size="16">mdi-magnify</v-icon>
                Briefing
              </button>
            </div>
          </div>
          <div v-if="moduleStage==='lessons'" class="stats">
            <span class="stat"><v-icon size="18">mdi-check-circle-outline</v-icon> {{ doneCount(current.id) }}/{{ current.lessons.length }}</span>
            <span class="stat"><v-icon size="18">mdi-star</v-icon> Ø {{ avgScore(current.id) }}%</span>
          </div>
        </div>
      </div>

      <div v-if="moduleStage==='setup'" class="module-stage-panel mission-setup">
        <div class="setup-header">
          <h2 class="h3">Choose your flight</h2>
          <p class="muted small">Lock in a gate-to-gate scenario before the radio work begins.</p>
        </div>
        <div class="plan-modes">
          <button
              v-for="mode in flightPlanModes"
              :key="mode.id"
              type="button"
              class="plan-mode-card"
              :aria-pressed="flightPlanMode === mode.id"
              :class="{ 'is-active': flightPlanMode === mode.id }"
              @click="flightPlanMode = mode.id"
          >
            <div class="plan-mode-icon">
              <v-icon size="22">{{ mode.icon }}</v-icon>
            </div>
            <div class="plan-mode-body">
              <div class="plan-mode-title">{{ mode.title }}</div>
              <div class="muted small">{{ mode.desc }}</div>
            </div>
          </button>
        </div>

        <div v-if="flightPlanMode==='random'" class="plan-panel">
          <div class="plan-summary">
            <img :src="currentBriefingArt" alt="Mission hero" class="plan-hero" />
            <div class="plan-summary-body">
              <span class="plan-tag">Auto flight</span>
              <div class="plan-callout">{{ draftPlanScenario?.radioCall }}</div>
              <div class="plan-route">{{ draftPlanRoute }}</div>
              <div class="muted small">{{ draftPlanTagline }}</div>
            </div>
          </div>
          <div class="plan-actions">
            <button class="btn soft" type="button" @click="rerollRandomPlan">
              <v-icon size="18">mdi-dice-multiple</v-icon>
              Roll another flight
            </button>
            <button class="btn primary" type="button" @click="enterBriefingFromSetup()" :disabled="!draftPlanScenario">
              <v-icon size="18">mdi-clipboard-text-outline</v-icon>
              Lock &amp; brief
            </button>
          </div>
        </div>

        <form v-else-if="flightPlanMode==='manual'" class="plan-panel manual-panel" @submit.prevent="handleManualSubmit">
          <div class="manual-grid">
            <div class="manual-form">
              <div class="manual-card manual-card--intro">
                <div class="manual-card-header">
                  <div class="manual-card-icon">
                    <v-icon size="20">mdi-pencil</v-icon>
                  </div>
                  <div>
                    <div class="manual-card-title">Design your own mission</div>
                    <p class="muted small">Fill in the essentials below. Expand the optional sections when you want to brief gates, taxi routes or procedures.</p>
                  </div>
                </div>
              </div>

              <div class="manual-card manual-card--required">
                <div class="manual-card-header">
                  <div class="manual-card-icon">
                    <v-icon size="20">mdi-airplane</v-icon>
                  </div>
                  <div>
                    <div class="manual-card-title">Core flight data</div>
                    <p class="muted small">We only need a callsign plus departure and destination to spin up a training scenario.</p>
                  </div>
                </div>
                <div class="field-grid required-grid">
                  <label class="field">
                    <span>Airline ICAO<span class="required-dot" aria-hidden="true">•</span></span>
                    <input v-model="manualForm.airlineCode" maxlength="4" placeholder="DLH" />
                  </label>
                  <label class="field">
                    <span>Flight number<span class="required-dot" aria-hidden="true">•</span></span>
                    <input v-model="manualForm.flightNumber" placeholder="400" />
                  </label>
                  <label class="field">
                    <span>Spoken callsign</span>
                    <input v-model="manualForm.airlineCall" placeholder="Lufthansa" />
                  </label>
                  <label class="field">
                    <span>Departure ICAO<span class="required-dot" aria-hidden="true">•</span></span>
                    <input v-model="manualForm.departureIcao" placeholder="EDDF" maxlength="4" />
                  </label>
                  <label class="field">
                    <span>Destination ICAO<span class="required-dot" aria-hidden="true">•</span></span>
                    <input v-model="manualForm.destinationIcao" placeholder="KJFK" maxlength="4" />
                  </label>
                </div>
              </div>

              <div class="manual-card manual-card--optional" :class="{ 'is-open': manualSectionsOpen.departure }">
                <button
                    class="optional-toggle"
                    type="button"
                    @click="toggleManualSection('departure')"
                    :aria-expanded="manualSectionsOpen.departure ? 'true' : 'false'"
                >
                  <div class="manual-card-icon">
                    <v-icon size="20">mdi-airplane-takeoff</v-icon>
                  </div>
                  <div class="optional-body">
                    <div class="manual-card-title">Departure briefing <span class="optional-chip">optional</span></div>
                    <p class="muted small">Gate, taxi route, SID and transition.</p>
                  </div>
                  <v-icon size="18" class="chevron">mdi-chevron-down</v-icon>
                </button>
                <transition name="collapse">
                  <div v-if="manualSectionsOpen.departure" class="optional-fields">
                    <div class="field-grid">
                      <label class="field">
                        <span>City</span>
                        <input v-model="manualForm.departureCity" placeholder="Frankfurt" />
                      </label>
                      <label class="field">
                        <span>Airport name</span>
                        <input v-model="manualForm.departureName" placeholder="Frankfurt/Main" />
                      </label>
                      <label class="field">
                        <span>Stand</span>
                        <input v-model="manualForm.stand" placeholder="A12" />
                      </label>
                      <label class="field">
                        <span>Taxi route</span>
                        <input v-model="manualForm.taxiRoute" placeholder="N3 U4" />
                      </label>
                      <label class="field">
                        <span>Runway</span>
                        <input v-model="manualForm.departureRunway" placeholder="25C" />
                      </label>
                      <label class="field">
                        <span>SID</span>
                        <input v-model="manualForm.sid" placeholder="ANEKI 7S" />
                      </label>
                      <label class="field">
                        <span>Transition</span>
                        <input v-model="manualForm.transition" placeholder="ANEKI" />
                      </label>
                    </div>
                  </div>
                </transition>
              </div>

              <div class="manual-card manual-card--optional" :class="{ 'is-open': manualSectionsOpen.arrival }">
                <button
                    class="optional-toggle"
                    type="button"
                    @click="toggleManualSection('arrival')"
                    :aria-expanded="manualSectionsOpen.arrival ? 'true' : 'false'"
                >
                  <div class="manual-card-icon">
                    <v-icon size="20">mdi-airplane-landing</v-icon>
                  </div>
                  <div class="optional-body">
                    <div class="manual-card-title">Arrival setup <span class="optional-chip">optional</span></div>
                    <p class="muted small">STAR, approach, gate and taxi-in.</p>
                  </div>
                  <v-icon size="18" class="chevron">mdi-chevron-down</v-icon>
                </button>
                <transition name="collapse">
                  <div v-if="manualSectionsOpen.arrival" class="optional-fields">
                    <div class="field-grid">
                      <label class="field">
                        <span>City</span>
                        <input v-model="manualForm.destinationCity" placeholder="New York" />
                      </label>
                      <label class="field">
                        <span>Airport name</span>
                        <input v-model="manualForm.destinationName" placeholder="John F. Kennedy" />
                      </label>
                      <label class="field">
                        <span>Runway</span>
                        <input v-model="manualForm.arrivalRunway" placeholder="22R" />
                      </label>
                      <label class="field">
                        <span>STAR</span>
                        <input v-model="manualForm.arrivalStar" placeholder="ROBER 3" />
                      </label>
                      <label class="field">
                        <span>Transition</span>
                        <input v-model="manualForm.arrivalTransition" placeholder="ROBER" />
                      </label>
                      <label class="field">
                        <span>Approach</span>
                        <input v-model="manualForm.approach" placeholder="ILS 22R" />
                      </label>
                      <label class="field">
                        <span>Arrival stand</span>
                        <input v-model="manualForm.arrivalStand" placeholder="Gate 5" />
                      </label>
                      <label class="field">
                        <span>Taxi-in</span>
                        <input v-model="manualForm.arrivalTaxiRoute" placeholder="B K5" />
                      </label>
                    </div>
                  </div>
                </transition>
              </div>

              <div class="manual-card manual-card--optional" :class="{ 'is-open': manualSectionsOpen.procedures }">
                <button
                    class="optional-toggle"
                    type="button"
                    @click="toggleManualSection('procedures')"
                    :aria-expanded="manualSectionsOpen.procedures ? 'true' : 'false'"
                >
                  <div class="manual-card-icon">
                    <v-icon size="20">mdi-altimeter</v-icon>
                  </div>
                  <div class="optional-body">
                    <div class="manual-card-title">Altitude &amp; codes <span class="optional-chip">optional</span></div>
                    <p class="muted small">Initial altitudes, squawk, push timing and remarks.</p>
                  </div>
                  <v-icon size="18" class="chevron">mdi-chevron-down</v-icon>
                </button>
                <transition name="collapse">
                  <div v-if="manualSectionsOpen.procedures" class="optional-fields">
                    <div class="field-grid">
                      <label class="field">
                        <span>Initial altitude (ft)</span>
                        <input v-model="manualForm.initialAltitude" inputmode="numeric" placeholder="5000" />
                      </label>
                      <label class="field">
                        <span>Climb altitude (ft)</span>
                        <input v-model="manualForm.climbAltitude" inputmode="numeric" placeholder="7000" />
                      </label>
                      <label class="field">
                        <span>Squawk</span>
                        <input v-model="manualForm.squawk" placeholder="4213" />
                      </label>
                      <label class="field">
                        <span>Push delay (min)</span>
                        <input v-model="manualForm.pushDelay" inputmode="numeric" placeholder="5" />
                      </label>
                      <label class="field wide">
                        <span>Briefing notes</span>
                        <input v-model="manualForm.remarks" placeholder="Optional remarks" />
                      </label>
                    </div>
                  </div>
                </transition>
              </div>

              <div v-if="manualErrors.length" class="form-errors">
                <div v-for="error in manualErrors" :key="error" class="form-error">
                  <v-icon size="16">mdi-alert</v-icon>
                  {{ error }}
                </div>
              </div>

              <div class="plan-actions manual-actions">
                <button class="btn ghost" type="button" @click="resetManualForm">
                  <v-icon size="18">mdi-restore</v-icon>
                  Reset
                </button>
                <button class="btn primary" type="submit">
                  <v-icon size="18">mdi-clipboard-text-outline</v-icon>
                  Build mission briefing
                </button>
              </div>
            </div>

            <aside class="manual-preview">
              <div class="preview-card">
                <div class="preview-header">
                  <div class="manual-card-icon">
                    <v-icon size="20">mdi-radar</v-icon>
                  </div>
                  <div>
                    <div class="preview-title">Live mission preview</div>
                    <p class="muted small">See how your ATC readback will sound as you fill in the form.</p>
                  </div>
                </div>
                <div class="preview-section">
                  <span class="preview-label">Callsign</span>
                  <div class="preview-value">{{ manualCallsignPreview }}</div>
                  <div class="preview-sub muted small">{{ manualSpokenPreview }}</div>
                </div>
                <div class="preview-section">
                  <span class="preview-label">Route</span>
                  <div class="preview-value">{{ manualRoutePreview }}</div>
                  <div class="preview-pills">
                    <span class="preview-pill">
                      <v-icon size="14">mdi-airplane-takeoff</v-icon>
                      {{ manualDepartureSummary }}
                    </span>
                    <span class="preview-pill">
                      <v-icon size="14">mdi-airplane-landing</v-icon>
                      {{ manualArrivalSummary }}
                    </span>
                  </div>
                </div>
                <div class="preview-section">
                  <span class="preview-label">Codes</span>
                  <div class="preview-value">{{ manualCodesSummary }}</div>
                  <div class="preview-sub muted small">{{ manualRemarksSummary }}</div>
                </div>
              </div>
            </aside>
          </div>
        </form>

        <div v-else class="plan-panel simbrief-panel">
          <div class="simbrief-hero-card">
            <img src="/img/learn/missions/full-flight/briefing-hero.png" alt="SimBrief import preview" class="simbrief-hero-art" />
            <div class="simbrief-hero-overlay">
              <span class="simbrief-tag">SimBrief import</span>
              <h3 class="simbrief-hero-title">Load your airline dispatch</h3>
              <p class="simbrief-hero-text">
                Sync the exact OFP you're flying with one click. We'll transform it into a mission-ready briefing and readback drill.
              </p>
              <div class="simbrief-hero-highlights">
                <span><v-icon size="16">mdi-airplane-cog</v-icon> Real routes</span>
                <span><v-icon size="16">mdi-clock-fast</v-icon> Instant setup</span>
                <a
                    href="https://www.simbrief.com/home/flight_planning.html"
                    target="_blank"
                    rel="noopener"
                    class="simbrief-link"
                >
                  <v-icon size="16">mdi-open-in-new</v-icon>
                  Open SimBrief dispatch
                </a>
              </div>
            </div>
          </div>
          <div class="simbrief-body">
            <div class="simbrief-step-grid">
              <div class="simbrief-step-card">
                <div class="simbrief-step-head">
                  <span class="step-number">1</span>
                  <span class="simbrief-step-title">Plan in SimBrief</span>
                </div>
                <p>Generate your flight on SimBrief with the aircraft and payload you want to practice.</p>
              </div>
              <div class="simbrief-step-card">
                <div class="simbrief-step-head">
                  <span class="step-number">2</span>
                  <span class="simbrief-step-title">Copy your Pilot ID</span>
                </div>
                <p>Find the ID on the share link of the finished OFP — it's the number we use to fetch your dispatch.</p>
              </div>
              <div class="simbrief-step-card">
                <div class="simbrief-step-head">
                  <span class="step-number">3</span>
                  <span class="simbrief-step-title">Paste &amp; import</span>
                </div>
                <p>Drop the ID below. We'll remember it on this device so future missions load instantly.</p>
              </div>
            </div>

            <form class="simbrief-form" @submit.prevent="loadSimbriefPlan">
              <div class="simbrief-form-row">
                <label class="field simbrief-field">
                  <span>SimBrief Pilot ID</span>
                  <input
                      v-model="simbriefForm.userId"
                      inputmode="numeric"
                      placeholder="11860000"
                  />
                </label>
                <button
                    class="btn primary simbrief-submit"
                    type="submit"
                    :disabled="simbriefForm.loading || !simbriefForm.userId.trim()"
                >
                  <v-icon size="18" :class="{ spin: simbriefForm.loading }">mdi-download</v-icon>
                  Load latest dispatch
                </button>
              </div>
            </form>

            <p class="muted small simbrief-note">
              New to SimBrief? It's a free airline-style dispatch planner that pairs perfectly with OpenSquawk missions.
            </p>

            <div v-if="simbriefForm.loading" class="simbrief-status">
              <v-progress-circular indeterminate color="cyan" size="20" />
              <span class="muted small">Contacting SimBrief…</span>
            </div>
            <div v-if="flightPlanError" class="error-banner">
              <v-icon size="16">mdi-alert</v-icon>
              {{ flightPlanError }}
            </div>
            <div v-if="simbriefPlanMeta" class="simbrief-meta">
              <div class="simbrief-meta-info">
                <v-icon size="18">mdi-airplane</v-icon>
                <span>{{ simbriefPlanMeta.callsign }} · {{ simbriefPlanMeta.route }}</span>
              </div>
              <button class="btn soft mini" type="button" @click="enterBriefingFromSetup()">
                <v-icon size="16">mdi-clipboard-text-outline</v-icon>
                Review briefing
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="moduleStage==='briefing' && briefingSnapshot" class="module-stage-panel mission-briefing">
        <section class="briefing-hero-banner">
          <img :src="currentBriefingArt" alt="Mission hero" class="briefing-hero-bg" />
          <div class="briefing-hero-content">
            <div class="briefing-tag-row">
              <span class="plan-tag">Mission briefing</span>
              <span class="briefing-chip">{{ briefingSnapshot.callsign }}</span>
            </div>
            <h2 class="briefing-hero-title">{{ briefingSnapshot.radioCall }}</h2>
            <div class="briefing-hero-route">{{ briefingSnapshot.route }}</div>
            <p class="muted small briefing-hero-copy">Take a beat to brief the flight deck before the next call.</p>
            <div class="briefing-hero-pills">
              <span class="pill">
                <v-icon size="16">mdi-airplane-takeoff</v-icon>
                {{ briefingSnapshot.departure.icao }} · RWY {{ briefingSnapshot.departure.runway }}
              </span>
              <span class="pill">
                <v-icon size="16">mdi-airplane-landing</v-icon>
                {{ briefingSnapshot.arrival.icao }} · RWY {{ briefingSnapshot.arrival.runway }}
              </span>
              <span class="pill">
                <v-icon size="16">mdi-shield-airplane</v-icon>
                Squawk {{ briefingSnapshot.codes.squawk }}
              </span>
            </div>
            <div class="briefing-hero-details">
              <div class="hero-detail">
                <span class="hero-detail-label">ATIS</span>
                <span class="hero-detail-value">Information {{ briefingSnapshot.departure.atis }}</span>
              </div>
              <div class="hero-detail">
                <span class="hero-detail-label">Delivery</span>
                <span class="hero-detail-value">{{ briefingSnapshot.departure.freq }}</span>
              </div>
              <div class="hero-detail">
                <span class="hero-detail-label">Push</span>
                <span class="hero-detail-value">{{ briefingSnapshot.codes.push }}</span>
              </div>
              <div class="hero-detail">
                <span class="hero-detail-label">Initial altitude</span>
                <span class="hero-detail-value">{{ briefingSnapshot.altitudes.initial }}</span>
              </div>
            </div>
          </div>
        </section>

        <div class="briefing-layout">
          <div class="briefing-main-grid">
            <div class="briefing-card">
              <img src="/img/learn/missions/full-flight/briefing-route.png" alt="Route preview" class="briefing-card-art" />
              <div class="card-title">
                <v-icon size="16">mdi-map-marker-path</v-icon>
                Flight deck setup
              </div>
              <ul class="briefing-list">
                <li><strong>Push</strong>: {{ briefingSnapshot.codes.push }}</li>
                <li><strong>ATIS</strong>: Information {{ briefingSnapshot.departure.atis }}</li>
                <li><strong>Delivery</strong>: {{ briefingSnapshot.departure.freq }} · {{ briefingSnapshot.departure.freqWords }}</li>
              </ul>
            </div>
            <div class="briefing-card">
              <img src="/img/learn/missions/full-flight/briefing-departure.png" alt="Departure" class="briefing-card-art" />
              <div class="card-title">
                <v-icon size="16">mdi-airplane-takeoff</v-icon>
                Departure flow
              </div>
              <ul class="briefing-list">
                <li><strong>Stand</strong>: {{ briefingSnapshot.departure.stand || 'As assigned' }}</li>
                <li><strong>Taxi</strong>: {{ briefingSnapshot.departure.taxiRoute || 'As assigned' }}</li>
                <li><strong>SID</strong>: {{ briefingSnapshot.departure.sid }} · {{ briefingSnapshot.departure.transition }}</li>
                <li><strong>Initial altitude</strong>: {{ briefingSnapshot.altitudes.initial }}</li>
              </ul>
            </div>
            <div class="briefing-card">
              <img src="/img/learn/missions/full-flight/briefing-arrival.png" alt="Arrival" class="briefing-card-art" />
              <div class="card-title">
                <v-icon size="16">mdi-airplane-landing</v-icon>
                Arrival setup
              </div>
              <ul class="briefing-list">
                <li><strong>STAR</strong>: {{ briefingSnapshot.arrival.star }} · {{ briefingSnapshot.arrival.transition }}</li>
                <li><strong>Approach</strong>: {{ briefingSnapshot.arrival.approach }}</li>
                <li><strong>Taxi-in</strong>: {{ briefingSnapshot.arrival.taxiRoute || 'As assigned' }}</li>
                <li><strong>Arrival stand</strong>: {{ briefingSnapshot.arrival.stand || 'As assigned' }}</li>
              </ul>
            </div>
            <div class="briefing-card">
              <img src="/img/learn/missions/full-flight/briefing-weather.png" alt="Weather" class="briefing-card-art" />
              <div class="card-title">
                <v-icon size="16">mdi-weather-cloudy</v-icon>
                Weather snapshot
              </div>
              <ul class="briefing-list">
                <li><strong>Departure wind</strong>: {{ briefingSnapshot.weather.depWind }}</li>
                <li><strong>Departure QNH</strong>: {{ briefingSnapshot.weather.depQnh }}</li>
                <li><strong>Arrival wind</strong>: {{ briefingSnapshot.weather.arrWind }}</li>
                <li><strong>Arrival QNH</strong>: {{ briefingSnapshot.weather.arrQnh }}</li>
              </ul>
            </div>
          </div>
          <aside class="briefing-sidebar">
            <div class="briefing-card briefing-checklist-card">
              <div class="card-title">
                <v-icon size="16">mdi-clipboard-text-outline</v-icon>
                Mission flow
              </div>
              <ol class="briefing-checklist">
                <li>
                  <span class="check-number">1</span>
                  <div>
                    <div class="check-title">Clearance &amp; push</div>
                    <p class="muted small">Tune delivery, confirm ATIS {{ briefingSnapshot.departure.atis }} and expect push {{ briefingSnapshot.codes.push }}.</p>
                  </div>
                </li>
                <li>
                  <span class="check-number">2</span>
                  <div>
                    <div class="check-title">Taxi &amp; departure</div>
                    <p class="muted small">Follow taxi {{ briefingSnapshot.departure.taxiRoute || 'as assigned' }} to RWY {{ briefingSnapshot.departure.runway }} and fly the {{ briefingSnapshot.departure.sid }}.</p>
                  </div>
                </li>
                <li>
                  <span class="check-number">3</span>
                  <div>
                    <div class="check-title">Arrival briefing</div>
                    <p class="muted small">Plan for {{ briefingSnapshot.arrival.star }} leading to {{ briefingSnapshot.arrival.approach }} and taxi to {{ briefingSnapshot.arrival.stand || 'assigned stand' }}.</p>
                  </div>
                </li>
              </ol>
            </div>
          </aside>
        </div>

        <div class="briefing-actions">
          <button
              v-if="briefingReturnStage==='setup'"
              class="btn ghost"
              type="button"
              @click="backToSetupFromBriefing()"
          >
            <v-icon size="18">mdi-arrow-left</v-icon>
            Adjust plan
          </button>
          <button class="btn primary" type="button" @click="handleBriefingConfirm()">
            <v-icon size="18">{{ briefingReturnStage==='setup' ? 'mdi-airplane' : 'mdi-play-circle' }}</v-icon>
            {{ briefingReturnStage==='setup' ? 'Start mission' : 'Return to mission' }}
          </button>
        </div>
      </div>

      <div v-else class="module-content">
        <div class="module-overview">
          <div v-if="current" class="module-overview-header">
            <div class="module-overview-meta">
              <div>
                <span class="module-overview-chip">Mission overview</span>
              </div>
              <h3 class="module-overview-title">{{ current.title }}</h3>
              <p class="module-overview-sub">{{ current.subtitle }}</p>
            </div>
            <div
                class="module-overview-progress"
                role="progressbar"
                aria-label="Mission progress"
                :aria-valuenow="pct(current.id)"
                aria-valuemin="0"
                aria-valuemax="100"
            >
              <span class="module-overview-progress-label">Progress</span>
              <div class="module-overview-progress-bar">
                <div class="module-overview-progress-fill" :style="{ width: pct(current.id) + '%' }"></div>
              </div>
              <span class="module-overview-progress-meta">{{ doneCount(current.id) }}/{{ current.lessons.length }} lessons</span>
            </div>
          </div>
          <div class="lesson-track" ref="lessonTrack">
            <div class="lesson-grid">
              <button
                  v-for="l in current.lessons"
                  :key="l.id"
                  class="lesson"
                  :data-lesson="l.id"
                  :class="{ active: activeLesson && activeLesson.id===l.id, ok: bestScore(current.id,l.id)>=80 }"
                  @click="selectLesson(l)"
              >
                <div class="lesson-top">
                  <div class="lesson-title">
                    <v-icon size="18">mdi-headset</v-icon>
                    {{ l.title }}
                  </div>
                  <span class="lesson-score" :class="lessonScoreClass(current.id, l.id)">
                    <v-icon size="14">{{ lessonScoreIcon(current.id, l.id) }}</v-icon>
                    {{ lessonScoreLabel(current.id, l.id) }}
                  </span>
                </div>
                <div class="muted small">{{ l.desc }}</div>
                <div class="tags">
                  <span v-for="k in l.keywords" :key="k" class="tag">{{ k }}</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div v-if="activeLesson" class="module-detail">
          <div class="console">
            <div v-if="scenario && requiresFlightPlan" class="scenario-bar">
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
                      <span v-if="segment.type === 'text'" class="cloze-chunk cloze-text">
                        {{ typeof segment.text === 'function' && scenario ? segment.text(scenario) : segment.text }}
                      </span>
                      <label
                          v-else
                          class="blank cloze-chunk"
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
    <footer
        class="footer"
        role="contentinfo"
        :class="{ 'has-lesson-actions': panel==='module' && moduleStage==='lessons' && current && activeLesson }"
    >
      <div class="container footer-container">

        <div
            v-if="panel==='module' && moduleStage==='lessons' && current && activeLesson"
            class="lesson-actions"
        >
          <div class="lesson-actions-meta">
            <div v-if="nextLessonMeta" class="lesson-actions-hint">
              Next: {{ nextLessonMeta.lesson.title }} · Lesson {{ nextLessonMeta.position }} of
              {{ nextLessonMeta.total }}
            </div>
            <div v-else-if="nextMissionMeta" class="lesson-actions-hint">
              Next mission: {{ nextMissionMeta.module.title }} · Mission {{ nextMissionMeta.position }} of
              {{ nextMissionMeta.total }}
            </div>
            <div v-else class="lesson-actions-hint">
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

        <div class="footer-meta">
          <span class="muted small">&copy; 2025 OpenSquawk. All rights reserved.</span>
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
import {useRoute, useRouter} from '#imports'
import {useApi} from '~/composables/useApi'
import {createDefaultLearnConfig} from '~~/shared/learn/config'
import type {LearnConfig, LearnProgress, LearnState} from '~~/shared/learn/config'
import {learnModules, seedFullFlightScenario} from '~~/shared/data/learnModules'
import {createBaseScenario, digitsToWords, lettersToNato, runwayToWords, altitudeToWords, minutesToWords} from '~~/shared/learn/scenario'
import type {BlankWidth, Frequency, Lesson, LessonField, ModuleDef, Scenario} from '~~/shared/learn/types'
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

type FlightPlanMode = 'random' | 'manual' | 'simbrief'
type MissionPlanState = { scenario: Scenario; mode: FlightPlanMode; updatedAt: number }
type MissionPlanInput = {
  callsign?: string
  airlineCode?: string
  airlineCall?: string
  flightNumber?: string
  radioCall?: string
  departure?: {
    icao?: string
    name?: string
    city?: string
    runway?: string
    stand?: string
    taxi?: string
    sid?: string
    transition?: string
  }
  destination?: {
    icao?: string
    name?: string
    city?: string
    runway?: string
    stand?: string
    taxi?: string
    star?: string
    transition?: string
    approach?: string
  }
  altitudes?: {
    initial?: number
    climb?: number
  }
  squawk?: string
  pushDelayMinutes?: number
  remarks?: string
}

type ManualForm = {
  airlineCode: string
  airlineCall: string
  flightNumber: string
  departureIcao: string
  departureName: string
  departureCity: string
  departureRunway: string
  stand: string
  taxiRoute: string
  sid: string
  transition: string
  destinationIcao: string
  destinationName: string
  destinationCity: string
  arrivalRunway: string
  arrivalStand: string
  arrivalTaxiRoute: string
  arrivalStar: string
  arrivalTransition: string
  approach: string
  initialAltitude: string
  climbAltitude: string
  squawk: string
  pushDelay: string
  remarks: string
}

const panel = ref<'hub' | 'module'>('hub')
const current = ref<ModuleDef | null>(null)
const activeLesson = ref<Lesson | null>(null)
const scenario = ref<Scenario | null>(null)
const moduleStage = ref<'lessons' | 'setup' | 'briefing'>('lessons')
const flightPlanMode = ref<FlightPlanMode>('random')
const missionPlans = reactive<Record<string, MissionPlanState>>({})
const draftPlanScenario = ref<Scenario | null>(null)
const manualBaseScenario = ref<Scenario | null>(null)
const briefingReturnStage = ref<'setup' | 'lessons'>('setup')
const pendingAutoStart = ref(false)
const SIMBRIEF_STORAGE_KEY = 'opensquawk:last-simbrief-id'

const manualForm = reactive<ManualForm>({
  airlineCode: '',
  airlineCall: '',
  flightNumber: '',
  departureIcao: '',
  departureName: '',
  departureCity: '',
  departureRunway: '',
  stand: '',
  taxiRoute: '',
  sid: '',
  transition: '',
  destinationIcao: '',
  destinationName: '',
  destinationCity: '',
  arrivalRunway: '',
  arrivalStand: '',
  arrivalTaxiRoute: '',
  arrivalStar: '',
  arrivalTransition: '',
  approach: '',
  initialAltitude: '',
  climbAltitude: '',
  squawk: '',
  pushDelay: '',
  remarks: ''
})
const manualErrors = ref<string[]>([])
const flightPlanError = ref<string | null>(null)
const simbriefForm = reactive({ userId: '', loading: false })
const simbriefPlanMeta = ref<{ callsign: string; route: string } | null>(null)
const lessonTrack = ref<HTMLElement | null>(null)
type ManualSection = 'departure' | 'arrival' | 'procedures'
const manualSectionsOpen = reactive<Record<ManualSection, boolean>>({
  departure: false,
  arrival: false,
  procedures: false
})

const router = useRouter()
const route = useRoute()

const ROUTE_STATE_KEYS = ['panel', 'module', 'stage', 'lesson', 'plan'] as const
type RouteStateKey = typeof ROUTE_STATE_KEYS[number]
type RouteQueryLike = Record<string, string | string[] | null | undefined>
const ROUTE_STATE_KEY_SET = new Set<RouteStateKey>(ROUTE_STATE_KEYS)

let isHydratingFromRoute = false
let isSyncingRoute = false
let lastSyncedQuerySignature: string | null = null

const normalizeQueryValue = (value: unknown): string | null => {
  if (Array.isArray(value)) {
    const [first] = value
    if (typeof first === 'string') return first
    if (first == null) return null
    return String(first)
  }
  if (typeof value === 'string') return value
  if (value == null) return null
  return String(value)
}

function normalizeQueryRecord(query: Record<string, unknown>): Record<string, string> {
  const normalized: Record<string, string> = {}
  for (const [key, raw] of Object.entries(query)) {
    const value = normalizeQueryValue(raw)
    if (value !== null) {
      normalized[key] = value
    }
  }
  return normalized
}

function computeQuerySignature(query: Record<string, unknown>): string {
  const normalized = normalizeQueryRecord(query)
  const keys = Object.keys(normalized).sort()
  return keys.map(key => `${key}=${normalized[key]}`).join('&')
}

const isValidStage = (value: string | null): value is 'lessons' | 'setup' | 'briefing' =>
  value === 'lessons' || value === 'setup' || value === 'briefing'

const isValidPlanMode = (value: string | null): value is FlightPlanMode =>
  value === 'random' || value === 'manual' || value === 'simbrief'

function buildStateRouteQuery(): Record<string, string> {
  const state: Record<string, string> = {}
  if (panel.value !== 'module' || !current.value) {
    return state
  }
  state.panel = 'module'
  state.module = current.value.id
  if (moduleStage.value !== 'lessons') {
    state.stage = moduleStage.value
  }
  if (moduleStage.value === 'lessons' && activeLesson.value) {
    state.lesson = activeLesson.value.id
  }
  if (moduleStage.value === 'setup' && flightPlanMode.value !== 'random') {
    state.plan = flightPlanMode.value
  }
  return state
}

function createNextRouteQuery(): Record<string, string> {
  const next: Record<string, string> = {}
  const currentQuery = route.query as RouteQueryLike
  for (const [key, raw] of Object.entries(currentQuery)) {
    if (ROUTE_STATE_KEY_SET.has(key as RouteStateKey)) continue
    const value = normalizeQueryValue(raw)
    if (value !== null) {
      next[key] = value
    }
  }
  return {...next, ...buildStateRouteQuery()}
}

function queriesEqual(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const normalizedA = normalizeQueryRecord(a)
  const normalizedB = normalizeQueryRecord(b)
  const keys = new Set([...Object.keys(normalizedA), ...Object.keys(normalizedB)])
  for (const key of keys) {
    if (normalizedA[key] !== normalizedB[key]) {
      return false
    }
  }
  return true
}

async function syncRouteFromState(): Promise<void> {
  if (typeof window === 'undefined' || isHydratingFromRoute) {
    return
  }
  const nextQuery = createNextRouteQuery()
  if (queriesEqual(route.query as Record<string, unknown>, nextQuery)) {
    lastSyncedQuerySignature = computeQuerySignature(route.query as Record<string, unknown>)
    return
  }
  const signature = computeQuerySignature(nextQuery)
  isSyncingRoute = true
  try {
    await router.replace({query: nextQuery})
    lastSyncedQuerySignature = signature
  } catch (error) {
    console.error('Failed to sync learn route state', error)
  } finally {
    isSyncingRoute = false
  }
}

function applyRouteStateFromQuery(query: RouteQueryLike) {
  isHydratingFromRoute = true
  try {
    const panelParam = normalizeQueryValue(query.panel)
    const moduleParam = normalizeQueryValue(query.module)
    const stageParam = normalizeQueryValue(query.stage)
    const lessonParam = normalizeQueryValue(query.lesson)
    const planParam = normalizeQueryValue(query.plan)

    const targetModuleId = panelParam === 'hub' ? null : moduleParam
    if (targetModuleId) {
      const module = modules.value.find(item => item.id === targetModuleId) || null
      if (!module) {
        goToHub()
      } else {
        panel.value = 'module'
        if (current.value?.id !== module.id) {
          openModule(module.id, {autoStart: false})
        }

        let desiredStage: 'lessons' | 'setup' | 'briefing' = moduleStage.value
        if (stageParam && isValidStage(stageParam)) {
          desiredStage = stageParam
        } else if (!module.meta?.flightPlan) {
          desiredStage = 'lessons'
        }

        const needsPlan = Boolean(module.meta?.flightPlan)
        const storedPlan = missionPlans[module.id]

        if (!needsPlan) {
          desiredStage = 'lessons'
        } else {
          if (desiredStage === 'lessons' && !storedPlan?.scenario) {
            desiredStage = 'setup'
          }
          if (desiredStage === 'briefing') {
            if (storedPlan?.scenario) {
              draftPlanScenario.value = cloneScenarioData(storedPlan.scenario)
              flightPlanMode.value = storedPlan.mode
              briefingReturnStage.value = 'lessons'
            } else if (!draftPlanScenario.value) {
              desiredStage = 'setup'
            }
          }
        }

        const prevStage = moduleStage.value
        if (moduleStage.value !== desiredStage) {
          moduleStage.value = desiredStage
        }

        if (moduleStage.value === 'setup') {
          briefingReturnStage.value = 'setup'
          activeLesson.value = null
          scenario.value = null
          if (planParam && isValidPlanMode(planParam)) {
            flightPlanMode.value = planParam
          }
          if (prevStage !== 'setup' && draftPlanScenario.value) {
            initSetupState(draftPlanScenario.value)
          } else if (!draftPlanScenario.value) {
            initSetupState(null)
          }
        } else if (moduleStage.value === 'lessons') {
          if (lessonParam) {
            const lesson = module.lessons.find(item => item.id === lessonParam)
            if (lesson) {
              activeLesson.value = lesson
            }
          }
          if (!activeLesson.value) {
            startLessonsForCurrent()
          }
        }
      }
    } else {
      if (panel.value !== 'hub' || current.value) {
        goToHub()
      } else {
        panel.value = 'hub'
      }
    }
  } finally {
    isHydratingFromRoute = false
  }
  void syncRouteFromState()
}

if (typeof window !== 'undefined') {
  watch(
    () => [panel.value, current.value?.id ?? null, moduleStage.value, activeLesson.value?.id ?? null, flightPlanMode.value],
    () => {
      void syncRouteFromState()
    }
  )

  watch(
    () => route.query,
    newQuery => {
      if (isSyncingRoute) {
        lastSyncedQuerySignature = computeQuerySignature(newQuery as Record<string, unknown>)
        return
      }
      const signature = computeQuerySignature(newQuery as Record<string, unknown>)
      if (signature === lastSyncedQuerySignature) {
        return
      }
      applyRouteStateFromQuery(newQuery as RouteQueryLike)
    }
  )
}

onMounted(() => {
  applyRouteStateFromQuery(route.query as RouteQueryLike)
})

const manualCallsignPreview = computed(() => {
  const code = sanitizeUpper(manualForm.airlineCode)
  const rawNumber = (manualForm.flightNumber || '').replace(/\s+/g, '')
  if (!code && !rawNumber) return 'Awaiting callsign'
  return `${code}${rawNumber}`.trim() || 'Awaiting callsign'
})

const manualSpokenPreview = computed(() => {
  const call = manualForm.airlineCall?.trim() || sanitizeUpper(manualForm.airlineCode)
  const digits = (manualForm.flightNumber || '').replace(/\s+/g, '')
  if (!call && !digits) {
    return 'We\'ll announce your ICAO code and flight number automatically if you leave this blank.'
  }
  const words = digits ? digitsToWords(digits) : ''
  const speech = [call, words].filter(Boolean).join(' ').trim()
  return speech || 'Radio call will mirror your ICAO code and number.'
})

const manualRoutePreview = computed(() => {
  const dep = sanitizeUpper(manualForm.departureIcao)
  const arr = sanitizeUpper(manualForm.destinationIcao)
  if (!dep && !arr) return 'Add departure and destination'
  return `${dep || '----'} → ${arr || '----'}`
})

const manualDepartureSummary = computed(() => {
  const icao = sanitizeUpper(manualForm.departureIcao)
  const runway = sanitizeUpper(manualForm.departureRunway)
  const city = manualForm.departureCity?.trim()
  if (!icao && !runway && !city) return 'Set departure details'
  const parts = [icao || '----']
  if (runway) parts.push(`RWY ${runway}`)
  if (city) parts.push(city)
  return parts.join(' · ')
})

const manualArrivalSummary = computed(() => {
  const icao = sanitizeUpper(manualForm.destinationIcao)
  const runway = sanitizeUpper(manualForm.arrivalRunway)
  const city = manualForm.destinationCity?.trim()
  if (!icao && !runway && !city) return 'Set arrival details'
  const parts = [icao || '----']
  if (runway) parts.push(`RWY ${runway}`)
  if (city) parts.push(city)
  return parts.join(' · ')
})

const manualCodesSummary = computed(() => {
  const parts: string[] = []
  if (manualForm.initialAltitude) parts.push(`Initial ${manualForm.initialAltitude} ft`)
  if (manualForm.climbAltitude) parts.push(`Climb ${manualForm.climbAltitude} ft`)
  if (manualForm.squawk) parts.push(`Squawk ${sanitizeUpper(manualForm.squawk)}`)
  if (manualForm.pushDelay) parts.push(`Push +${manualForm.pushDelay} min`)
  return parts.join(' • ') || 'Using default training altitudes and codes.'
})

const manualRemarksSummary = computed(() => manualForm.remarks?.trim() || 'Add notes for controllers or leave blank.')

const flightPlanModes: Array<{ id: FlightPlanMode; title: string; icon: string; desc: string }> = [
  {
    id: 'random',
    title: 'Auto-generate',
    icon: 'mdi-dice-multiple',
    desc: 'Spin up a surprise full flight with matching ATC flow.'
  },
  {
    id: 'manual',
    title: 'Manual setup',
    icon: 'mdi-pencil-outline',
    desc: 'Enter your own callsign, airports and procedures.'
  },
  {
    id: 'simbrief',
    title: 'SimBrief import',
    icon: 'mdi-clipboard-text-outline',
    desc: 'Pull your latest SimBrief dispatch and brief it in-game.'
  }
]

watch(
  () => simbriefForm.userId,
  value => {
    if (typeof window === 'undefined') return
    const trimmed = value.trim()
    if (trimmed) {
      window.localStorage.setItem(SIMBRIEF_STORAGE_KEY, trimmed)
    } else {
      window.localStorage.removeItem(SIMBRIEF_STORAGE_KEY)
    }
  }
)

function toggleManualSection(section: ManualSection) {
  manualSectionsOpen[section] = !manualSectionsOpen[section]
}

function cloneScenarioData(source: Scenario | null): Scenario | null {
  if (!source) return null
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(source)
    } catch (error) {
      console.warn('structuredClone failed for scenario clone', error)
    }
  }
  return JSON.parse(JSON.stringify(source)) as Scenario
}

const isNonEmpty = (value?: string | null): value is string => Boolean(value && value.trim().length)

function sanitizeUpper(value?: string): string {
  return (value || '').trim().toUpperCase()
}

function ensureList(list: string[] | undefined, value?: string): string[] {
  if (!list && !value) return []
  const next = Array.isArray(list) ? [...list] : []
  if (value) {
    const trimmed = value.trim()
    if (trimmed && !next.includes(trimmed)) next.push(trimmed)
  }
  return next
}

function scenarioRoute(s: Scenario | null): string {
  if (!s) return ''
  return `${s.airport.icao} → ${s.destination.icao}`
}

function scenarioTagline(s: Scenario | null): string {
  if (!s) return ''
  return `${s.airport.city} → ${s.destination.city}`
}

type BriefingSnapshot = {
  callsign: string
  radioCall: string
  route: string
  tagline: string
  departure: {
    city: string
    icao: string
    runway: string
    stand: string
    sid: string
    transition: string
    atis: string
    freq: string
    freqWords: string
    taxiRoute: string
  }
  arrival: {
    city: string
    icao: string
    runway: string
    stand: string
    star: string
    transition: string
    approach: string
    taxiRoute: string
  }
  altitudes: {
    initial: string
    initialWords: string
    climb: string
    climbWords: string
  }
  codes: {
    squawk: string
    push: string
    pushWords: string
  }
  weather: {
    depWind: string
    depQnh: string
    arrWind: string
    arrQnh: string
  }
}

function buildBriefingSnapshot(s: Scenario | null): BriefingSnapshot | null {
  if (!s) return null
  return {
    callsign: s.callsign,
    radioCall: s.radioCall,
    route: scenarioRoute(s),
    tagline: scenarioTagline(s),
    departure: {
      city: s.airport.city,
      icao: s.airport.icao,
      runway: s.runway,
      stand: s.stand,
      sid: s.sid,
      transition: s.transition,
      atis: s.atisCode,
      freq: s.deliveryFreq,
      freqWords: s.frequencyWords?.DEL || s.deliveryFreq,
      taxiRoute: s.taxiRoute
    },
    arrival: {
      city: s.destination.city,
      icao: s.destination.icao,
      runway: s.arrivalRunway,
      stand: s.arrivalStand,
      star: s.arrivalStar,
      transition: s.arrivalTransition,
      approach: s.approach,
      taxiRoute: s.arrivalTaxiRoute
    },
    altitudes: {
      initial: formatAltitude(s.altitudes.initial),
      initialWords: s.altitudes.initialWords,
      climb: formatAltitude(s.altitudes.climb),
      climbWords: s.altitudes.climbWords
    },
    codes: {
      squawk: s.squawk,
      push: formatPushDelay(s.pushDelayMinutes),
      pushWords: s.pushDelayWords
    },
    weather: {
      depWind: s.windWords || s.wind,
      depQnh: s.qnhWords,
      arrWind: s.arrivalWindWords,
      arrQnh: s.arrivalQnhWords
    }
  }
}

function formatAltitude(value?: number | null): string {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return '—'
  return `${Math.round(value)}ft`
}

function formatPushDelay(minutes?: number | null): string {
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes < 0) return '00:00'
  const totalMinutes = Math.round(minutes)
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

const parseOptionalNumber = (input: string): number | undefined => {
  if (!input) return undefined
  const normalized = input.toString().replace(/[^0-9.-]/g, '')
  const value = Number.parseFloat(normalized)
  return Number.isFinite(value) ? value : undefined
}

function applyPlanToScenario(base: Scenario, plan: MissionPlanInput): Scenario {
  const scenario = cloneScenarioData(base)
  if (!scenario) return base

  const airlineCode = sanitizeUpper(plan.airlineCode) || scenario.airlineCode
  const airlineCall = plan.airlineCall?.trim() || scenario.airlineCall || airlineCode
  const rawFlightNumber = plan.flightNumber?.toString().trim() || scenario.flightNumber
  const normalizedFlightNumber = rawFlightNumber.replace(/\s+/g, '')
  const digitsOnly = normalizedFlightNumber.replace(/[^0-9]/g, '') || normalizedFlightNumber
  const callsign = plan.callsign?.trim().toUpperCase() || `${airlineCode}${normalizedFlightNumber}`.toUpperCase()

  scenario.airlineCode = airlineCode
  scenario.airlineCall = airlineCall || airlineCode
  scenario.flightNumber = digitsOnly
  scenario.flightNumberWords = digitsToWords(digitsOnly)
  scenario.callsign = callsign
  scenario.callsignNato = lettersToNato(airlineCode)
  const numberWords = digitsOnly ? digitsToWords(digitsOnly) : ''
  const computedRadio = [scenario.airlineCall, numberWords].filter(Boolean).join(' ').trim()
  const radioOverride = plan.radioCall?.trim()
  if (radioOverride) {
    scenario.radioCall = radioOverride
  } else if (computedRadio) {
    scenario.radioCall = computedRadio
  }

  const dep = plan.departure || {}
  if (isNonEmpty(dep.icao)) scenario.airport.icao = sanitizeUpper(dep.icao)
  if (isNonEmpty(dep.name)) scenario.airport.name = dep.name.trim()
  if (isNonEmpty(dep.city)) scenario.airport.city = dep.city.trim()
  if (isNonEmpty(dep.runway)) {
    const runway = sanitizeUpper(dep.runway)
    scenario.runway = runway
    scenario.runwayWords = runwayToWords(runway)
    scenario.airport.runways = ensureList(scenario.airport.runways, runway)
  }
  if (isNonEmpty(dep.stand)) {
    scenario.stand = sanitizeUpper(dep.stand)
    scenario.airport.stands = ensureList(scenario.airport.stands, scenario.stand)
  }
  if (isNonEmpty(dep.taxi)) scenario.taxiRoute = dep.taxi.trim()
  if (isNonEmpty(dep.sid)) {
    scenario.sid = sanitizeUpper(dep.sid)
    scenario.airport.sids = ensureList(scenario.airport.sids, scenario.sid)
  }
  if (isNonEmpty(dep.transition)) {
    scenario.transition = sanitizeUpper(dep.transition)
    scenario.airport.transitions = ensureList(scenario.airport.transitions, scenario.transition)
  }
  scenario.airport.taxi = ensureList(scenario.airport.taxi, dep.taxi)

  const dest = plan.destination || {}
  if (isNonEmpty(dest.icao)) scenario.destination.icao = sanitizeUpper(dest.icao)
  if (isNonEmpty(dest.name)) scenario.destination.name = dest.name.trim()
  if (isNonEmpty(dest.city)) scenario.destination.city = dest.city.trim()
  if (isNonEmpty(dest.runway)) {
    const runway = sanitizeUpper(dest.runway)
    scenario.arrivalRunway = runway
    scenario.arrivalRunwayWords = runwayToWords(runway)
    scenario.destination.runways = ensureList(scenario.destination.runways, runway)
  }
  if (isNonEmpty(dest.stand)) {
    scenario.arrivalStand = sanitizeUpper(dest.stand)
    scenario.destination.stands = ensureList(scenario.destination.stands, scenario.arrivalStand)
  }
  if (isNonEmpty(dest.taxi)) scenario.arrivalTaxiRoute = dest.taxi.trim()
  if (isNonEmpty(dest.star)) {
    scenario.arrivalStar = sanitizeUpper(dest.star)
    scenario.destination.stars = ensureList(scenario.destination.stars, scenario.arrivalStar)
  }
  if (isNonEmpty(dest.transition)) {
    scenario.arrivalTransition = sanitizeUpper(dest.transition)
    scenario.destination.arrivalTransitions = ensureList(scenario.destination.arrivalTransitions, scenario.arrivalTransition)
  }
  if (isNonEmpty(dest.approach)) {
    scenario.approach = dest.approach.trim()
    scenario.destination.approaches = ensureList(scenario.destination.approaches, scenario.approach)
  }
  scenario.destination.taxi = ensureList(scenario.destination.taxi, dest.taxi)

  const initialAlt = plan.altitudes?.initial
  if (typeof initialAlt === 'number' && Number.isFinite(initialAlt) && initialAlt > 0) {
    scenario.altitudes.initial = Math.round(initialAlt)
    scenario.altitudes.initialWords = altitudeToWords(scenario.altitudes.initial)
  }
  const climbAlt = plan.altitudes?.climb
  if (typeof climbAlt === 'number' && Number.isFinite(climbAlt) && climbAlt > 0) {
    const rounded = Math.max(Math.round(climbAlt), scenario.altitudes.initial + 100)
    scenario.altitudes.climb = rounded
    scenario.altitudes.climbWords = altitudeToWords(rounded)
  }

  if (isNonEmpty(plan.squawk)) {
    const squawk = plan.squawk.replace(/[^0-7]/g, '')
    if (squawk) {
      scenario.squawk = squawk
      scenario.squawkWords = digitsToWords(squawk)
    }
  }

  if (typeof plan.pushDelayMinutes === 'number' && Number.isFinite(plan.pushDelayMinutes) && plan.pushDelayMinutes > 0) {
    const minutes = Math.max(1, Math.round(plan.pushDelayMinutes))
    scenario.pushDelayMinutes = minutes
    scenario.pushDelayWords = minutesToWords(minutes)
  }

  if (isNonEmpty(plan.remarks)) {
    scenario.remarks = plan.remarks.trim()
  }

  return scenario
}

function hydrateManualForm(base: Scenario) {
  manualForm.airlineCode = base.airlineCode || ''
  manualForm.airlineCall = base.airlineCall || ''
  manualForm.flightNumber = base.flightNumber || ''
  manualForm.departureIcao = base.airport.icao || ''
  manualForm.departureName = base.airport.name || ''
  manualForm.departureCity = base.airport.city || ''
  manualForm.departureRunway = base.runway || ''
  manualForm.stand = base.stand || ''
  manualForm.taxiRoute = base.taxiRoute || ''
  manualForm.sid = base.sid || ''
  manualForm.transition = base.transition || ''
  manualForm.destinationIcao = base.destination.icao || ''
  manualForm.destinationName = base.destination.name || ''
  manualForm.destinationCity = base.destination.city || ''
  manualForm.arrivalRunway = base.arrivalRunway || ''
  manualForm.arrivalStand = base.arrivalStand || ''
  manualForm.arrivalTaxiRoute = base.arrivalTaxiRoute || ''
  manualForm.arrivalStar = base.arrivalStar || ''
  manualForm.arrivalTransition = base.arrivalTransition || ''
  manualForm.approach = base.approach || ''
  manualForm.initialAltitude = base.altitudes.initial.toString()
  manualForm.climbAltitude = base.altitudes.climb.toString()
  manualForm.squawk = base.squawk || ''
  manualForm.pushDelay = base.pushDelayMinutes?.toString() || ''
  manualForm.remarks = base.remarks || ''
}

function resetManualForm() {
  if (manualBaseScenario.value) {
    hydrateManualForm(manualBaseScenario.value)
  } else {
    const base = createBaseScenario()
    manualBaseScenario.value = cloneScenarioData(base)
    hydrateManualForm(base)
  }
  manualErrors.value = []
}

function initSetupState(seed: Scenario | null) {
  const base = cloneScenarioData(seed) || createBaseScenario()
  if (!base) return
  draftPlanScenario.value = cloneScenarioData(base)
  manualBaseScenario.value = cloneScenarioData(base)
  hydrateManualForm(base)
  manualErrors.value = []
  flightPlanError.value = null
  simbriefPlanMeta.value = null
}

function rerollRandomPlan() {
  const rolled = createBaseScenario()
  draftPlanScenario.value = cloneScenarioData(rolled)
  manualBaseScenario.value = cloneScenarioData(rolled)
  hydrateManualForm(rolled)
  flightPlanMode.value = 'random'
}

function enterBriefingFromSetup() {
  if (!draftPlanScenario.value) return
  briefingReturnStage.value = 'setup'
  moduleStage.value = 'briefing'
}

function buildManualScenario(): Scenario | null {
  const errors: string[] = []
  if (!isNonEmpty(manualForm.airlineCode)) errors.push('Airline ICAO required')
  if (!isNonEmpty(manualForm.flightNumber)) errors.push('Flight number required')
  if (!isNonEmpty(manualForm.departureIcao)) errors.push('Departure ICAO required')
  if (!isNonEmpty(manualForm.destinationIcao)) errors.push('Destination ICAO required')

  manualErrors.value = errors
  if (errors.length) return null

  const base = cloneScenarioData(manualBaseScenario.value) || createBaseScenario()
  if (!base) return null

  const plan: MissionPlanInput = {
    airlineCode: manualForm.airlineCode,
    airlineCall: manualForm.airlineCall,
    flightNumber: manualForm.flightNumber,
    departure: {
      icao: manualForm.departureIcao,
      name: manualForm.departureName,
      city: manualForm.departureCity,
      runway: manualForm.departureRunway,
      stand: manualForm.stand,
      taxi: manualForm.taxiRoute,
      sid: manualForm.sid,
      transition: manualForm.transition
    },
    destination: {
      icao: manualForm.destinationIcao,
      name: manualForm.destinationName,
      city: manualForm.destinationCity,
      runway: manualForm.arrivalRunway,
      stand: manualForm.arrivalStand,
      taxi: manualForm.arrivalTaxiRoute,
      star: manualForm.arrivalStar,
      transition: manualForm.arrivalTransition,
      approach: manualForm.approach
    },
    altitudes: {
      initial: parseOptionalNumber(manualForm.initialAltitude),
      climb: parseOptionalNumber(manualForm.climbAltitude)
    },
    squawk: manualForm.squawk,
    pushDelayMinutes: parseOptionalNumber(manualForm.pushDelay),
    remarks: manualForm.remarks
  }

  return applyPlanToScenario(base, plan)
}

async function loadSimbriefPlan() {
  if (!current.value) return
  if (simbriefForm.loading) return
  const userId = simbriefForm.userId.trim()
  if (!userId) {
    flightPlanError.value = 'Please enter your SimBrief ID.'
    return
  }
  flightPlanError.value = null
  manualErrors.value = []
  simbriefForm.loading = true
  try {
    const response = await api.get<{ data: any }>('/api/learn/simbrief', { query: { userId }, auth: true })
    const payload = response?.data
    if (!payload) {
      flightPlanError.value = 'No SimBrief dispatch found.'
      return
    }
    const base = createBaseScenario()
    const plan = normalizeSimbriefPlan(payload)
    const scenario = applyPlanToScenario(base, plan)
    draftPlanScenario.value = cloneScenarioData(scenario)
    manualBaseScenario.value = cloneScenarioData(scenario)
    hydrateManualForm(scenario)
    simbriefPlanMeta.value = {
      callsign: scenario.radioCall,
      route: scenarioRoute(scenario)
    }
    flightPlanMode.value = 'simbrief'
    enterBriefingFromSetup()
  } catch (error: any) {
    flightPlanError.value = error?.data?.message || error?.message || 'Failed to load SimBrief plan.'
  } finally {
    simbriefForm.loading = false
  }
}

function handleManualSubmit() {
  const scenario = buildManualScenario()
  if (!scenario) return
  draftPlanScenario.value = cloneScenarioData(scenario)
  simbriefPlanMeta.value = {
    callsign: scenario.radioCall,
    route: scenarioRoute(scenario)
  }
  enterBriefingFromSetup()
}

function confirmPlanAndEnterMission() {
  if (!current.value || !draftPlanScenario.value) return
  const snapshot = cloneScenarioData(draftPlanScenario.value)
  if (!snapshot) return
  missionPlans[current.value.id] = {
    scenario: snapshot,
    mode: flightPlanMode.value,
    updatedAt: Date.now()
  }
  seedFullFlightScenario(cloneScenarioData(snapshot))
  briefingReturnStage.value = 'lessons'
  moduleStage.value = 'lessons'
  pendingAutoStart.value = false
  startLessonsForCurrent()
}

function handleBriefingConfirm() {
  if (briefingReturnStage.value === 'setup') {
    confirmPlanAndEnterMission()
  } else {
    moduleStage.value = 'lessons'
  }
}

function backToSetupFromBriefing() {
  if (briefingReturnStage.value !== 'setup') {
    moduleStage.value = 'lessons'
    return
  }
  moduleStage.value = 'setup'
  if (draftPlanScenario.value) {
    initSetupState(draftPlanScenario.value)
  }
}

function openMissionBriefing() {
  if (!current.value) return
  const stored = missionPlans[current.value.id]
  if (!stored?.scenario) return
  draftPlanScenario.value = cloneScenarioData(stored.scenario)
  flightPlanMode.value = stored.mode
  briefingReturnStage.value = 'lessons'
  moduleStage.value = 'briefing'
}

function restartCurrentMission() {
  if (!current.value) return
  const moduleId = current.value.id
  if (moduleId && missionPlans[moduleId]) delete missionPlans[moduleId]
  draftPlanScenario.value = null
  manualBaseScenario.value = null
  simbriefPlanMeta.value = null
  scenario.value = null
  flightPlanError.value = null
  manualErrors.value = []
  flightPlanMode.value = 'manual'
  moduleStage.value = 'setup'
  briefingReturnStage.value = 'setup'
  pendingAutoStart.value = false
  initSetupState(null)
}

function startLessonsForCurrent() {
  if (!current.value) return
  const mod = current.value
  const prog = progress.value[mod.id] || {}
  const next = mod.lessons.find(lesson => !(prog[lesson.id]?.done)) || mod.lessons[0]
  activeLesson.value = next || null
}

function goToHub() {
  panel.value = 'hub'
  moduleStage.value = 'lessons'
  current.value = null
  activeLesson.value = null
  scenario.value = null
  seedFullFlightScenario(null)
}

function readProp(source: any, key: string): any {
  if (!source || typeof source !== 'object') return undefined
  if (key in source) return source[key]
  const lower = key.toLowerCase()
  const foundKey = Object.keys(source).find(prop => prop.toLowerCase() === lower)
  return foundKey ? source[foundKey] : undefined
}

function extractPath(source: any, path: string): any {
  return path.split('.').reduce((acc, segment) => readProp(acc, segment), source)
}

function pickString(source: any, ...paths: string[]): string | undefined {
  for (const path of paths) {
    const value = extractPath(source, path)
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }
  return undefined
}

function pickNumber(source: any, ...paths: string[]): number | undefined {
  for (const path of paths) {
    const raw = extractPath(source, path)
    if (typeof raw === 'number' && Number.isFinite(raw)) return raw
    if (typeof raw === 'string') {
      const numeric = Number.parseFloat(raw.replace(/[^0-9.-]/g, ''))
      if (Number.isFinite(numeric)) return numeric
    }
  }
  return undefined
}

function normalizeSimbriefPlan(raw: any): MissionPlanInput {
  const plan: MissionPlanInput = {}

  plan.airlineCode = pickString(raw, 'general.icao_airline', 'general.airline_icao', 'general.icao') || undefined
  plan.airlineCall = pickString(raw, 'general.callsign_name', 'general.airline_name', 'general.airline', 'general.callsign') || undefined
  plan.flightNumber = pickString(raw, 'general.flight_number', 'general.flt_num', 'general.flightnum') || undefined
  plan.callsign = pickString(raw, 'general.callsign') || undefined
  plan.radioCall = pickString(raw, 'general.callsign', 'general.callsign_name') || undefined

  plan.departure = {
    icao: pickString(raw, 'origin.icao_code', 'general.origin', 'plan.origin'),
    name: pickString(raw, 'origin.name', 'origin.airport_name', 'origin.station_name'),
    city: pickString(raw, 'origin.pos_city', 'origin.city'),
    runway: pickString(raw, 'origin.plan_rwy', 'plan.plan_rwy_dept', 'plan.rwy_dep'),
    stand: pickString(raw, 'origin.plan_gate', 'plan.gate'),
    taxi: pickString(raw, 'origin.plan_taxi_route', 'origin.plan_taxiroute'),
    sid: pickString(raw, 'origin.plan_sid', 'plan.plan_sid'),
    transition: pickString(raw, 'origin.plan_sid_trans', 'origin.plan_sid_transition', 'plan.sid_transition')
  }

  plan.destination = {
    icao: pickString(raw, 'destination.icao_code', 'general.destination', 'plan.destination'),
    name: pickString(raw, 'destination.name', 'destination.airport_name', 'destination.station_name'),
    city: pickString(raw, 'destination.pos_city', 'destination.city'),
    runway: pickString(raw, 'destination.plan_rwy', 'plan.plan_rwy_arr', 'plan.rwy_arr'),
    stand: pickString(raw, 'destination.plan_gate', 'plan.arrival_gate'),
    taxi: pickString(raw, 'destination.plan_taxi_route', 'destination.plan_taxiroute'),
    star: pickString(raw, 'destination.plan_star', 'plan.plan_star'),
    transition: pickString(raw, 'destination.plan_star_trans', 'destination.plan_star_transition', 'plan.star_transition'),
    approach: pickString(raw, 'destination.plan_approach', 'plan.plan_approach')
  }

  const initialAlt = pickNumber(raw, 'atc.initial_altitude', 'plan.initial_altitude', 'general.initial_altitude')
  const climbAlt = pickNumber(raw, 'plan.cruise_altitude', 'general.cruise_altitude')
  if (initialAlt || climbAlt) {
    plan.altitudes = {
      initial: initialAlt,
      climb: climbAlt
    }
  }

  plan.squawk = pickString(raw, 'atc.squawk', 'general.squawk', 'plan.squawk') || undefined
  plan.pushDelayMinutes = pickNumber(raw, 'times.taxi_out', 'general.taxi_out')
  plan.remarks = pickString(raw, 'general.remarks', 'plan.remarks') || undefined

  return plan
}
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
const requiresFlightPlan = computed(() => Boolean(current.value?.meta?.flightPlan))
const currentPlan = computed(() => (current.value ? missionPlans[current.value.id] ?? null : null))
const currentPlanRoute = computed(() => scenarioRoute(currentPlan.value?.scenario || null))
const currentPlanTagline = computed(() => scenarioTagline(currentPlan.value?.scenario || null))
const draftPlanRoute = computed(() => scenarioRoute(draftPlanScenario.value))
const draftPlanTagline = computed(() => scenarioTagline(draftPlanScenario.value))
const briefingSnapshot = computed(() => buildBriefingSnapshot(draftPlanScenario.value))
const currentBriefingArt = computed(() => current.value?.meta?.briefingArt || '/img/learn/missions/full-flight/briefing-hero.png')

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
    if (moduleStage.value === 'lessons') {
      rollScenario(true)
    }
    if (lessonTrack.value) {
      void nextTick(() => {
        const el = lessonTrack.value?.querySelector<HTMLElement>(`[data-lesson='${lesson.id}']`)
        el?.scrollIntoView({behavior: 'smooth', block: 'nearest', inline: 'center'})
      })
    }
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

function openModule(id: string, options: { autoStart?: boolean } = {}) {
  const module = modules.value.find(item => item.id === id) || null
  current.value = module
  manualErrors.value = []
  flightPlanError.value = null
  panel.value = module ? 'module' : 'hub'
  pendingAutoStart.value = options.autoStart ?? false
  activeLesson.value = null

  if (!module) {
    activeLesson.value = null
    return
  }

  if (!module.meta?.flightPlan) {
    moduleStage.value = 'lessons'
    seedFullFlightScenario(null)
    startLessonsForCurrent()
    pendingAutoStart.value = false
    return
  }

  const stored = missionPlans[module.id]
  if (stored?.scenario) {
    seedFullFlightScenario(cloneScenarioData(stored.scenario))
    moduleStage.value = 'lessons'
    if (pendingAutoStart.value || !activeLesson.value) {
      startLessonsForCurrent()
    }
    pendingAutoStart.value = false
    return
  }

  moduleStage.value = 'setup'
  activeLesson.value = null
  scenario.value = null
  flightPlanMode.value = stored?.mode ?? 'random'
  initSetupState(null)
}

function quickContinue(id: string) {
  openModule(id, {autoStart: true})
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
  quickContinue(modId)
}

function modulePrimaryLabel(modId: string) {
  if (moduleCompleted(modId)) return 'Replay mission'
  if (!moduleHasProgress(modId)) return 'Launch mission'
  return 'Resume mission'
}

function modulePrimaryIcon(modId: string) {
  if (moduleCompleted(modId)) return 'mdi-history'
  if (!moduleHasProgress(modId)) return 'mdi-rocket'
  return 'mdi-clock-outline'
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
  if (moduleHasProgress(modId)) return 'mdi-timer-sand'
  return 'mdi-rocket-outline'
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
  if (!score) return 'mdi-star-outline'
  if (score >= 80) return 'mdi-star-circle-outline'
  return 'mdi-check-circle-outline'
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
      icon: 'mdi-target',
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
  if (typeof window !== 'undefined') {
    const storedId = window.localStorage.getItem(SIMBRIEF_STORAGE_KEY)
    if (storedId) {
      simbriefForm.userId = storedId
    }
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

/* HUB tiles */
.hub-head {
  margin: 6px 0 10px
}

.tiles {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  align-items: stretch
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
.play.has-lesson-actions {
}

.play .play-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 10px
}

.play-tools {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: flex-end;
  min-height: 44px;
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
  position: relative;
  overflow: visible;
  border-color: color-mix(in srgb, var(--accent) 38%, transparent);
  background:
      radial-gradient(420px 260px at -10% -20%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 70%),
      linear-gradient(150deg, color-mix(in srgb, var(--bg2) 82%, transparent), color-mix(in srgb, var(--text) 6%, transparent));
  --module-overview-gap: 28px;
  --lesson-track-max-height: 400px;
  --lesson-track-opacity: 1;
  --lesson-track-pointer-events: auto;
  --lesson-track-padding-bottom: 12px;
  --lesson-track-offset: 0px;
  display: flex;
  flex-direction: column;
  gap: var(--module-overview-gap);
  border-radius: 28px;
  isolation: isolate;
}

.module-overview::before {
  content: "";
  position: absolute;
  inset: -40% 30% auto 10%;
  height: 320px;
  width: 320px;
  background: radial-gradient(180px 180px at center, color-mix(in srgb, var(--accent2) 24%, transparent), transparent 70%);
  opacity: .4;
  pointer-events: none;
  transform: rotate(-6deg);
  z-index: 0;
}

.module-overview::after {
  content: "";
  position: absolute;
  inset: -20% 0 -60% 40%;
  background: radial-gradient(520px 360px at 110% 100%, color-mix(in srgb, var(--accent2) 28%, transparent), transparent 75%);
  opacity: .35;
  pointer-events: none;
  filter: blur(12px);
  z-index: 0;
}

.module-overview-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
}

.module-overview-meta {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 520px;
}

.module-overview-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 11px;
  letter-spacing: .1em;
  text-transform: uppercase;
  background: color-mix(in srgb, var(--accent) 22%, transparent);
  color: color-mix(in srgb, var(--accent) 80%, white 10%);
}

.module-overview-title {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: .02em;
}

.module-overview-sub {
  margin: 0;
  font-size: 15px;
  color: color-mix(in srgb, var(--t3) 82%, transparent);
  line-height: 1.5;
}

.module-overview-progress {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-end;
  min-width: 220px;
  position: relative;
  z-index: 1;
}

.module-overview-progress-label {
  font-size: 12px;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--t3) 80%, transparent);
}

.module-overview-progress-bar {
  width: 220px;
  height: 6px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--accent) 35%, transparent);
  background: color-mix(in srgb, var(--bg2) 82%, transparent);
  overflow: hidden;
}

.module-overview-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), var(--accent2));
  border-radius: inherit;
}

.module-overview-progress-meta {
  font-size: 12px;
  letter-spacing: .04em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--t3) 70%, transparent);
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

.lesson-track {
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: var(--lesson-track-padding-bottom, 12px);
  margin: 0;
  padding-left: 6px;
  padding-right: 6px;
  scroll-snap-type: x proximity;
  mask-image: linear-gradient(to right, transparent, rgba(0, 0, 0, .9) 20%, rgba(0, 0, 0, .9) 80%, transparent);
  position: relative;
  z-index: 1;
  max-height: var(--lesson-track-max-height, 400px);
  opacity: var(--lesson-track-opacity, 1);
  pointer-events: var(--lesson-track-pointer-events, auto);
  transform: translateY(var(--lesson-track-offset, 0px));
  transition: max-height .3s ease, opacity .3s ease, padding-bottom .3s ease, transform .3s ease;
}

@media (hover: hover) {
  .module-overview {
    --module-overview-gap: 18px;
    --lesson-track-max-height: 0px;
    --lesson-track-opacity: 0;
    --lesson-track-pointer-events: none;
    --lesson-track-padding-bottom: 0px;
    --lesson-track-offset: -12px;
  }

  .module-overview:hover,
  .module-overview:focus-within {
    --module-overview-gap: 28px;
    --lesson-track-max-height: 400px;
    --lesson-track-opacity: 1;
    --lesson-track-pointer-events: auto;
    --lesson-track-padding-bottom: 12px;
    --lesson-track-offset: 0px;
  }
}

.lesson-grid {
  display: flex;
  gap: 12px;
  min-width: max-content;
}

.lesson {
  scroll-snap-align: center;
}

.lesson {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: left;
  border: 1px solid var(--border);
  padding: 20px;
  margin-top: 5px;
  background: color-mix(in srgb, var(--text) 6%, transparent);
  cursor: pointer;
  border-radius: 6px;
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
  box-shadow: 0 10px 20px rgba(0, 0, 0, .18)
}

.lesson:hover {
  box-shadow: 0 14px 26px rgba(0, 0, 0, .22)
}

.lesson.active {
  outline: 1px solid color-mix(in srgb, var(--accent) 50%, transparent);
  box-shadow: 0 1px 12px rgba(34, 211, 238, .22)
}

.lesson.ok {
  border-color: color-mix(in srgb, #22c55e 50%, transparent)
}

.lesson-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.lesson-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  line-height: 1.3;
  flex: 1;
  min-width: 0;
}

.lesson-score {
  position: static;
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
  animation: badgePulse 8s ease-in-out infinite;
  flex-shrink: 0;
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

  .module-overview {
    gap: 20px;
  }

  .module-overview-progress {
    align-items: flex-start;
    min-width: 0;
    width: 100%;
  }

  .module-overview-progress-bar {
    width: 100%;
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
  gap: 18px;
  border: 1px solid color-mix(in srgb, var(--accent) 28%, transparent);
  border-radius: 16px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 16%, transparent), color-mix(in srgb, var(--bg2) 82%, transparent));
  box-shadow: 0 24px 44px rgba(2, 6, 23, .5);
  z-index: 40;
  padding: 16px 24px;
}

.lesson-actions-meta {
  flex: 1 1 280px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.lesson-actions-hint {
  font-size: 13px;
  letter-spacing: .06em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--t3) 80%, transparent);
}

.lesson-actions-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
}

.lesson-actions-buttons .btn {
  min-width: 150px;
  justify-content: center;
}

.row.wrap {
  flex-wrap: wrap;
}

.controls {
  margin-top: 12px;
}


.readback-panel {
  padding: 20px;
  border-radius: 20px;
  border: 1px solid color-mix(in srgb, var(--accent) 22%, transparent);
  background: linear-gradient(145deg, color-mix(in srgb, var(--accent) 12%, transparent), color-mix(in srgb, var(--bg2) 70%, transparent));
  box-shadow: 0 24px 44px rgba(2, 6, 23, .45);
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.cloze {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: stretch;
  line-height: 1.4;
  text-transform: uppercase;
  letter-spacing: .08em;
}

.cloze-chunk {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--text) 18%, transparent);
  background: color-mix(in srgb, var(--text) 6%, transparent);
  min-height: 46px;
  position: relative;
  transition: border-color .2s ease, background .2s ease;
}

.cloze-text {
  font-size: 14px;
  font-weight: 600;
  color: color-mix(in srgb, var(--text) 88%, transparent);
  letter-spacing: .06em;
  white-space: pre-wrap;
}

.blank {
  flex-direction: column;
  align-items: stretch;
  gap: 6px;
  min-width: 120px;
  padding: 10px 14px 12px;
  background: color-mix(in srgb, var(--text) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--text) 20%, transparent);
}

.blank input {
  background: transparent;
  border: 0;
  color: var(--text);
  min-width: 80px;
  font-size: 16px;
  font-weight: 600;
  outline: none;
  letter-spacing: .12em;
  text-transform: uppercase;
}

.blank input::placeholder {
  text-transform: uppercase;
  color: color-mix(in srgb, var(--t3) 80%, transparent);
}

.blank.size-xs {
  min-width: 90px;
}

.blank.size-sm {
  min-width: 120px;
}

.blank.size-md {
  min-width: 160px;
}

.blank.size-lg {
  min-width: 210px;
}

.blank.size-xl {
  min-width: 260px;
}

.blank.ok {
  border-color: color-mix(in srgb, var(--accent) 50%, transparent);
  background: color-mix(in srgb, var(--accent) 12%, transparent);
}

.blank.warn {
  border-color: color-mix(in srgb, #f97316 45%, transparent);
}

.blank-status {
  position: absolute;
  top: 8px;
  right: 8px;
}

.blank-status.ok {
  color: var(--accent);
}

.blank-status.warn {
  color: #f97316;
}

.blank-feedback {
  margin: 0;
  font-size: 11px;
  color: var(--t3);
  text-transform: none;
  letter-spacing: normal;
}

.field-checks {
  margin-top: 12px;
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

.field-check {
  border: 1px solid color-mix(in srgb, var(--text) 14%, transparent);
  padding: 12px;
  border-radius: 14px;
  background: color-mix(in srgb, var(--text) 4%, transparent);
  box-shadow: 0 12px 26px rgba(2, 6, 23, .28);
}

.field-check.ok {
  border-color: color-mix(in srgb, var(--accent) 40%, transparent);
  background: color-mix(in srgb, var(--accent) 10%, transparent);
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
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
    left: 20px;
    right: 20px;
    transform: none;
    bottom: 16px;
    width: auto;
  }

  .lesson-actions-buttons {
    justify-content: stretch;
  }

  .lesson-actions-buttons .btn {
    flex: 1 1 100%;
    min-width: 0;
  }

  .play.has-lesson-actions {
    padding-bottom: 240px;
  }

  .plan-status {
    width: 100%;
    justify-content: flex-start;
  }

  .plan-status-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .plan-status-actions .btn {
    flex: 1 1 100%;
    justify-content: center;
  }

  .footer.has-lesson-actions .footer-meta {
    padding-bottom: 180px;
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
  font-size: 13px;
  color: var(--t3);
}

.footer-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.footer-meta {
  text-align: center;
}

.footer.has-lesson-actions .footer-meta {
  padding-bottom: 120px;
}

.footer a {
  color: var(--accent);
  text-decoration: none;
}

.footer a:hover {
  text-decoration: underline;
}


.plan-status {
  display: inline-flex;
  align-items: center;
  gap: 16px;
  padding: 10px 16px;
  border: 1px solid color-mix(in srgb, var(--text) 12%, transparent);
  border-radius: 14px;
  background: color-mix(in srgb, var(--text) 5%, transparent);
  box-shadow: 0 12px 24px rgba(2, 6, 23, .32);
  flex-wrap: wrap;
}

.plan-status-icon {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--accent) 20%, transparent);
  color: var(--accent);
}

.plan-status-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 160px;
}

.plan-status-title {
  font-weight: 600;
  letter-spacing: .08em;
  text-transform: uppercase;
  font-size: 12px;
}

.plan-status-sub {
  font-size: 12px;
  color: var(--t3);
}

.plan-status-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.plan-status-actions .btn {
  flex: 0 0 auto;
}

.plan-status.is-ready {
  border-color: color-mix(in srgb, var(--accent) 30%, transparent);
  background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 12%, transparent), color-mix(in srgb, var(--bg2) 80%, transparent));
}

.module-stage-panel {
  margin-top: 24px;
  border-radius: 24px;
  border: 1px solid color-mix(in srgb, var(--text) 12%, transparent);
  background: color-mix(in srgb, var(--text) 4%, transparent);
  padding: 28px;
  box-shadow: 0 28px 54px rgba(2, 6, 23, .5);
  backdrop-filter: blur(18px);
}

.mission-setup {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.setup-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.plan-modes {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}

.plan-mode-card {
  flex: 1 1 200px;
  min-width: 220px;
  border-radius: 18px;
  border: 1px solid color-mix(in srgb, var(--text) 12%, transparent);
  background: color-mix(in srgb, var(--text) 4%, transparent);
  padding: 16px;
  display: flex;
  gap: 12px;
  align-items: center;
  transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease;
  box-shadow: 0 12px 32px rgba(2, 6, 23, .4);
}

.plan-mode-card:hover,
.plan-mode-card:focus-visible {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--accent) 40%, transparent);
  box-shadow: 0 16px 38px rgba(34, 211, 238, .25);
  outline: none;
}

.plan-mode-card.is-active {
  border-color: color-mix(in srgb, var(--accent) 55%, transparent);
  background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 16%, transparent), color-mix(in srgb, var(--bg2) 70%, transparent));
}

.plan-mode-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--accent) 20%, transparent);
  color: var(--accent);
}

.plan-mode-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.plan-mode-title {
  font-weight: 600;
  letter-spacing: .06em;
  text-transform: uppercase;
  font-size: 13px;
}

.plan-panel {
  border-radius: 20px;
  border: 1px solid color-mix(in srgb, var(--text) 12%, transparent);
  background: color-mix(in srgb, var(--text) 3%, transparent);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  box-shadow: 0 18px 42px rgba(2, 6, 23, .45);
}

.plan-summary {
  display: flex;
  gap: 16px;
  align-items: center;
}

.plan-hero {
  width: 128px;
  height: 96px;
  object-fit: cover;
  border-radius: 16px;
  border: 1px solid color-mix(in srgb, var(--text) 14%, transparent);
  background: color-mix(in srgb, var(--text) 8%, transparent);
}

.plan-summary-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.plan-callout {
  font-size: 20px;
  font-weight: 600;
}

.plan-route {
  font-size: 14px;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--t3);
}

.plan-tag {
  font-size: 11px;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: var(--t3);
}

.plan-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.plan-actions .btn {
  flex: 1 1 200px;
  justify-content: center;
}

.manual-grid {
  display: grid;
  gap: 20px;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 320px);
  align-items: start;
}

.manual-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.manual-card {
  border-radius: 18px;
  border: 1px solid color-mix(in srgb, var(--text) 12%, transparent);
  background: color-mix(in srgb, var(--text) 4%, transparent);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: 0 16px 34px rgba(2, 6, 23, .4);
}

.manual-card--intro {
  background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 10%, transparent), color-mix(in srgb, var(--bg2) 70%, transparent));
  border-color: color-mix(in srgb, var(--accent) 40%, transparent);
}

.manual-card-header {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.manual-card-icon {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--accent) 22%, transparent);
  color: var(--accent);
}

.manual-card-title {
  font-weight: 600;
  letter-spacing: .08em;
  text-transform: uppercase;
  font-size: 13px;
}

.required-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

.required-dot {
  margin-left: 4px;
  color: var(--accent);
  font-size: 14px;
}

.manual-card--optional .manual-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.optional-chip {
  font-size: 11px;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--t3);
  border: 1px solid color-mix(in srgb, var(--text) 22%, transparent);
  border-radius: 999px;
  padding: 2px 8px;
}

.optional-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: transparent;
  border: 0;
  color: inherit;
  text-align: left;
  padding: 0;
  cursor: pointer;
}

.optional-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.manual-card--optional .chevron {
  transition: transform .2s ease;
}

.manual-card--optional.is-open .chevron {
  transform: rotate(-180deg);
}

.optional-fields {
  padding-top: 8px;
}

.manual-panel .field-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

.field-grid.compact {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

.manual-panel .field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: color-mix(in srgb, var(--text) 4%, transparent);
  border: 1px solid color-mix(in srgb, var(--text) 12%, transparent);
  padding: 10px 12px;
  border-radius: 12px;
}

.manual-panel .field input {
  background: transparent;
  border: 0;
  color: var(--text);
  font-size: 14px;
  font-weight: 500;
}

.manual-panel .field span {
  font-size: 12px;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--t3);
}

.manual-preview {
  position: sticky;
  top: 90px;
}

.preview-card {
  border-radius: 18px;
  border: 1px solid color-mix(in srgb, var(--accent) 28%, transparent);
  background: linear-gradient(160deg, color-mix(in srgb, var(--accent) 12%, transparent), color-mix(in srgb, var(--bg2) 70%, transparent));
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  box-shadow: 0 22px 40px rgba(2, 6, 23, .45);
}

.preview-header {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.preview-title {
  font-weight: 600;
  letter-spacing: .06em;
  text-transform: uppercase;
  font-size: 12px;
}

.preview-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.preview-label {
  font-size: 12px;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--t3);
}

.preview-value {
  font-size: 18px;
  font-weight: 600;
}

.preview-sub {
  line-height: 1.3;
}

.preview-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.preview-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--bg2) 80%, transparent);
  font-size: 12px;
  letter-spacing: .04em;
  text-transform: uppercase;
}

.manual-actions {
  margin-top: 4px;
  justify-content: flex-end;
}

.collapse-enter-active,
.collapse-leave-active {
  transition: all .2s ease;
}

.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.form-errors {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  background: color-mix(in srgb, #f87171 16%, transparent);
  border: 1px solid color-mix(in srgb, #f87171 40%, transparent);
}

.form-error {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.simbrief-panel {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.simbrief-hero-card {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  min-height: 220px;
  border: 1px solid color-mix(in srgb, var(--text) 12%, transparent);
  background: linear-gradient(135deg, color-mix(in srgb, var(--bg2) 80%, transparent), transparent);
  box-shadow: 0 20px 44px rgba(2, 6, 23, .52);
}

.simbrief-hero-art {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(1.1) brightness(.75);
}

.simbrief-hero-overlay {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 28px;
  min-height: 220px;
  background: linear-gradient(160deg, rgba(15, 23, 42, .88), rgba(15, 23, 42, .4) 55%, rgba(15, 23, 42, .18));
  color: var(--text);
}

.simbrief-tag {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--accent) 46%, transparent);
  color: var(--accent);
  font-size: 12px;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.simbrief-hero-title {
  font-size: 28px;
  letter-spacing: .02em;
  font-weight: 700;
}

.simbrief-hero-text {
  max-width: 540px;
  color: color-mix(in srgb, var(--text) 82%, transparent);
  font-size: 15px;
  line-height: 1.5;
}

.simbrief-hero-highlights {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
}

.simbrief-hero-highlights span,
.simbrief-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--text) 6%, transparent);
  font-size: 12px;
  letter-spacing: .06em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--text) 88%, transparent);
}

.simbrief-link {
  border: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
  color: var(--accent);
  text-decoration: none;
}

.simbrief-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.simbrief-step-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.simbrief-step-card {
  border-radius: 16px;
  border: 1px solid color-mix(in srgb, var(--text) 14%, transparent);
  background: color-mix(in srgb, var(--text) 4%, transparent);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: var(--t3);
  box-shadow: 0 12px 30px rgba(2, 6, 23, .35);
}

.simbrief-step-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-weight: 600;
  background: color-mix(in srgb, var(--accent) 24%, transparent);
  color: var(--accent);
}

.simbrief-step-title {
  font-weight: 600;
  letter-spacing: .06em;
  text-transform: uppercase;
  font-size: 12px;
  color: color-mix(in srgb, var(--text) 92%, transparent);
}

.simbrief-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.simbrief-form-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
}

.simbrief-field {
  flex: 1 1 220px;
}

.simbrief-field span {
  font-size: 12px;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--t3);
}

.simbrief-field input {
  width: 100%;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--text) 16%, transparent);
  padding: 12px 14px;
  background: color-mix(in srgb, var(--text) 6%, transparent);
  color: var(--text);
  font-size: 16px;
  letter-spacing: .12em;
  text-transform: uppercase;
}

.simbrief-submit {
  flex: 0 0 auto;
  min-width: 200px;
  justify-content: center;
}

.simbrief-note {
  margin: 0;
  color: var(--t3);
}

.simbrief-status {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--t3);
  font-size: 13px;
}

.simbrief-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-radius: 16px;
  padding: 12px 16px;
  border: 1px solid color-mix(in srgb, var(--accent) 28%, transparent);
  background: color-mix(in srgb, var(--accent) 10%, transparent);
  color: color-mix(in srgb, var(--text) 90%, transparent);
}

.simbrief-meta-info {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.error-banner {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 10px 12px;
  border-radius: 14px;
  background: color-mix(in srgb, #f87171 16%, transparent);
  border: 1px solid color-mix(in srgb, #f87171 35%, transparent);
  font-size: 13px;
}


.mission-briefing {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.briefing-hero-banner {
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  min-height: 260px;
  border: 1px solid color-mix(in srgb, var(--text) 14%, transparent);
  box-shadow: 0 26px 48px rgba(2, 6, 23, .55);
}

.briefing-hero-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(1.1) brightness(.7);
}

.briefing-hero-content {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 32px;
  min-height: 260px;
  background: linear-gradient(120deg, rgba(15, 23, 42, .92), rgba(15, 23, 42, .45) 50%, rgba(15, 23, 42, .2));
  color: #f8fafc;
}

.briefing-tag-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.briefing-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--accent) 18%, transparent);
  color: var(--accent);
  font-size: 12px;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.briefing-hero-title {
  font-size: 32px;
  font-weight: 700;
  letter-spacing: .02em;
}

.briefing-hero-route {
  font-size: 15px;
  text-transform: uppercase;
  letter-spacing: .12em;
  color: color-mix(in srgb, #f8fafc 78%, transparent);
}

.briefing-hero-copy {
  max-width: 540px;
  color: color-mix(in srgb, #f8fafc 72%, transparent);
}

.briefing-hero-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--text) 6%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
  font-size: 12px;
  letter-spacing: .06em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--text) 92%, transparent);
  backdrop-filter: blur(4px);
}

.briefing-hero-details {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
}

.hero-detail {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  border-radius: 16px;
  background: rgba(15, 23, 42, .55);
  border: 1px solid rgba(148, 163, 184, .35);
  color: #e2e8f0;
}

.hero-detail-label {
  font-size: 11px;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: rgba(226, 232, 240, .78);
}

.hero-detail-value {
  font-weight: 600;
  font-size: 14px;
  letter-spacing: .05em;
  text-transform: uppercase;
}

.hero-detail-sub {
  font-size: 12px;
  color: rgba(226, 232, 240, .7);
}

.briefing-summary {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.briefing-summary-card {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 18px;
  padding: 22px;
  border-radius: 24px;
  border: 1px solid color-mix(in srgb, var(--accent) 24%, transparent);
  background: linear-gradient(140deg, color-mix(in srgb, var(--bg2) 82%, transparent), color-mix(in srgb, var(--text) 6%, transparent));
  box-shadow: 0 24px 48px rgba(2, 6, 23, .48);
  overflow: hidden;
}

.briefing-summary-card::after {
  content: "";
  position: absolute;
  inset: 18px 18px auto auto;
  width: 120px;
  height: 120px;
  background: radial-gradient(60px 60px at center, color-mix(in srgb, var(--accent) 26%, transparent), transparent 70%);
  opacity: .25;
  pointer-events: none;
}

.summary-icon {
  width: 52px;
  height: 52px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  font-size: 20px;
  color: white;
  box-shadow: 0 16px 28px rgba(2, 6, 23, .45);
  position: relative;
  z-index: 1;
}

.summary-icon--primary {
  background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 60%, transparent), color-mix(in srgb, var(--accent2) 50%, transparent));
}

.summary-icon--departure {
  background: linear-gradient(135deg, color-mix(in srgb, #60a5fa 60%, transparent), color-mix(in srgb, #2563eb 45%, transparent));
}

.summary-icon--arrival {
  background: linear-gradient(135deg, color-mix(in srgb, #f472b6 60%, transparent), color-mix(in srgb, #db2777 45%, transparent));
}

.summary-icon--codes {
  background: linear-gradient(135deg, color-mix(in srgb, #fbbf24 60%, transparent), color-mix(in srgb, #d97706 45%, transparent));
  color: #1f2937;
}

.summary-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
  z-index: 1;
}

.summary-label {
  font-size: 12px;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--t3) 80%, transparent);
}

.summary-value {
  font-weight: 700;
  font-size: 20px;
  letter-spacing: .04em;
  text-transform: uppercase;
}

.summary-sub {
  font-size: 13px;
  color: color-mix(in srgb, var(--t3) 78%, transparent);
  letter-spacing: .02em;
}

.briefing-layout {
  display: grid;
  gap: 20px;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  align-items: start;
}

.briefing-main-grid {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.briefing-sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: sticky;
  top: 90px;
}

.briefing-card {
  border-radius: 20px;
  border: 1px solid color-mix(in srgb, var(--text) 14%, transparent);
  background: linear-gradient(160deg, color-mix(in srgb, var(--bg2) 78%, transparent), color-mix(in srgb, var(--text) 4%, transparent));
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: 0 24px 44px rgba(2, 6, 23, .5);
}

.briefing-card-art {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 14px;
  border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .08em;
  font-size: 12px;
  color: var(--t2);
}

.briefing-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
  color: var(--t3);
  line-height: 1.5;
}

.briefing-checklist-card {
  height: 100%;
}

.briefing-checklist {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.briefing-checklist li {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.check-number {
  width: 30px;
  height: 30px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-weight: 600;
  background: color-mix(in srgb, var(--accent) 24%, transparent);
  color: var(--accent);
  box-shadow: 0 6px 18px rgba(34, 211, 238, .25);
}

.check-title {
  font-weight: 600;
  letter-spacing: .04em;
  text-transform: uppercase;
  font-size: 12px;
}

.briefing-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: flex-end;
}

.briefing-actions .btn {
  flex: 1 1 220px;
  justify-content: center;
}

@media (max-width: 960px) {
  .plan-mode-card {
    min-width: 180px;
  }
  .plan-summary {
    flex-direction: column;
    align-items: flex-start;
  }
  .plan-hero {
    width: 100%;
    height: 140px;
  }
  .plan-actions .btn,
  .briefing-actions .btn {
    flex: 1 1 100%;
  }
  .manual-grid {
    grid-template-columns: 1fr;
  }
  .manual-preview {
    position: static;
  }
  .briefing-hero-content {
    padding: 24px;
  }
  .briefing-hero-title {
    font-size: 28px;
  }
  .briefing-layout {
    grid-template-columns: 1fr;
  }
  .briefing-sidebar {
    position: static;
  }
}

</style>
