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

      <div class="tiles">
        <div
            v-for="m in modules"
            :key="m.id"
            class="tile"
            :class="tileClass(m.id)"
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
    </main>

    <!-- MISSION SETUP -->
    <section v-if="panel==='mission-setup' && current" class="container mission-setup" aria-label="Flight setup">
      <div class="setup-wrapper">
        <div class="crumbs">
          <button class="link" @click="panel='hub'">
            <v-icon size="16">mdi-arrow-left</v-icon>
            Hub
          </button>
          <span class="muted">/ {{ current.title }}</span>
        </div>

        <div class="setup-header">
          <h2 class="h2">Configure your linked flight</h2>
          <p class="muted">Pick how this gate-to-gate mission should be generated before you enter the radio calls.</p>
        </div>

        <div v-if="missionSetup.mode==='menu'" class="setup-menu">
          <div v-if="currentBinding" class="setup-current">
            <div class="current-main">
              <div class="current-title">{{ currentBinding.scenario.radioCall }}</div>
              <div class="muted small">{{ currentBinding.scenario.airport.icao }} → {{ currentBinding.scenario.destination.icao }}</div>
            </div>
            <div class="current-tags">
              <span class="chip small">{{ bindingSourceLabel(currentBinding.source) }}</span>
              <span class="chip small">{{ currentBinding.scenario.airlineCode }}{{ currentBinding.scenario.flightNumber }}</span>
            </div>
            <div class="current-actions">
              <button class="chip ghost" type="button" @click="reviewCurrentBriefing">
                <v-icon size="16">mdi-information-outline</v-icon>
                Briefing ansehen
              </button>
              <button class="chip ghost" type="button" @click="changeCurrentFlight('manual')">
                <v-icon size="16">mdi-pencil</v-icon>
                Anpassen
              </button>
            </div>
          </div>

          <div class="setup-cards">
            <button class="mode-card" type="button" @click="handleRandomFlight">
              <span class="mode-badge">Quick start</span>
              <h3>Generate a random flight</h3>
              <p>We build a cohesive clearance-to-taxi scenario with fresh weather and ATC data.</p>
              <div class="mode-meta">
                <v-icon size="20">mdi-dice-5</v-icon>
                <span>Instant launch</span>
              </div>
            </button>

            <button class="mode-card" type="button" @click="missionSetup.mode='manual'">
              <span class="mode-badge">Custom</span>
              <h3>Enter flight details</h3>
              <p>Craft the exact departure, route, and arrival you want to practise.</p>
              <div class="mode-meta">
                <v-icon size="20">mdi-airplane-cog</v-icon>
                <span>Full control</span>
              </div>
            </button>

            <div class="mode-card simbrief">
              <span class="mode-badge">Import</span>
              <h3>Load latest SimBrief plan</h3>
              <p>Pull your most recent SimBrief dispatch straight into the mission briefing.</p>
              <div class="mode-meta">
                <v-icon size="20">mdi-cloud-download</v-icon>
                <span>SimBrief API</span>
              </div>
              <a class="simbrief-link" href="https://www.simbrief.com/system/dispatch.php" target="_blank" rel="noopener">
                Open SimBrief ↗
              </a>
              <button class="btn primary block" type="button" @click="missionSetup.mode='simbrief'">
                <v-icon size="18">mdi-arrow-right</v-icon>
                Connect plan
              </button>
            </div>
          </div>
        </div>

        <div v-else-if="missionSetup.mode==='manual'" class="setup-form">
          <div class="form-head">
            <button class="chip ghost" type="button" @click="missionSetup.mode='menu'">
              <v-icon size="16">mdi-arrow-left</v-icon>
              Back
            </button>
            <h3>Manual flight plan</h3>
          </div>

          <div class="form-section">
            <div class="section-title">Callsign</div>
            <div class="form-grid three">
              <label class="field">
                <span>Airline ICAO</span>
                <select v-model="missionSetup.manual.airlineCode">
                  <option v-for="airline in availableAirlines" :key="airline.code" :value="airline.code">
                    {{ airline.code }} · {{ airline.call }}
                  </option>
                </select>
              </label>
              <label class="field">
                <span>Telephony</span>
                <input v-model="missionSetup.manual.airlineCallsign" type="text" />
              </label>
              <label class="field">
                <span>Flight number</span>
                <input v-model="missionSetup.manual.flightNumber" inputmode="numeric" maxlength="4" />
              </label>
            </div>
          </div>

          <div class="form-section">
            <div class="section-title">Departure</div>
            <div class="form-grid four">
              <label class="field">
                <span>Airport</span>
                <select v-model="missionSetup.manual.departureIcao">
                  <option v-for="airport in availableAirports" :key="airport.icao" :value="airport.icao">
                    {{ airport.icao }} · {{ airport.city }}
                  </option>
                </select>
              </label>
              <label class="field">
                <span>Runway</span>
                <select v-model="missionSetup.manual.runway">
                  <option v-for="runway in manualDepartureRunways" :key="runway" :value="runway">{{ runway }}</option>
                </select>
              </label>
              <label class="field">
                <span>Stand</span>
                <select v-model="missionSetup.manual.stand">
                  <option v-for="stand in manualDepartureStands" :key="stand" :value="stand">{{ stand }}</option>
                </select>
              </label>
              <label class="field">
                <span>Taxi route</span>
                <select v-model="missionSetup.manual.taxiRoute">
                  <option v-for="route in manualDepartureTaxiRoutes" :key="route" :value="route">{{ route }}</option>
                </select>
              </label>
            </div>
            <div class="form-grid two">
              <label class="field">
                <span>SID</span>
                <select v-model="missionSetup.manual.sid">
                  <option v-for="sid in manualDepartureSids" :key="sid" :value="sid">{{ sid }}</option>
                </select>
              </label>
              <label class="field">
                <span>Transition</span>
                <select v-model="missionSetup.manual.transition">
                  <option v-for="transition in manualDepartureTransitions" :key="transition" :value="transition">{{ transition }}</option>
                </select>
              </label>
            </div>
          </div>

          <div class="form-section">
            <div class="section-title">Arrival</div>
            <div class="form-grid four">
              <label class="field">
                <span>Airport</span>
                <select v-model="missionSetup.manual.destinationIcao">
                  <option v-for="airport in availableAirports" :key="airport.icao" :value="airport.icao">
                    {{ airport.icao }} · {{ airport.city }}
                  </option>
                </select>
              </label>
              <label class="field">
                <span>Runway</span>
                <select v-model="missionSetup.manual.arrivalRunway">
                  <option v-for="runway in manualDestinationRunways" :key="runway" :value="runway">{{ runway }}</option>
                </select>
              </label>
              <label class="field">
                <span>Stand</span>
                <select v-model="missionSetup.manual.arrivalStand">
                  <option v-for="stand in manualDestinationStands" :key="stand" :value="stand">{{ stand }}</option>
                </select>
              </label>
              <label class="field">
                <span>Taxi-in</span>
                <select v-model="missionSetup.manual.arrivalTaxiRoute">
                  <option v-for="route in manualDestinationTaxiRoutes" :key="route" :value="route">{{ route }}</option>
                </select>
              </label>
            </div>
            <div class="form-grid three">
              <label class="field">
                <span>STAR</span>
                <select v-model="missionSetup.manual.arrivalStar">
                  <option v-for="star in manualDestinationStars" :key="star" :value="star">{{ star }}</option>
                </select>
              </label>
              <label class="field">
                <span>Transition</span>
                <select v-model="missionSetup.manual.arrivalTransition">
                  <option v-for="transition in manualDestinationTransitions" :key="transition" :value="transition">{{ transition }}</option>
                </select>
              </label>
              <label class="field">
                <span>Approach</span>
                <select v-model="missionSetup.manual.approach">
                  <option v-for="approach in manualDestinationApproaches" :key="approach" :value="approach">{{ approach }}</option>
                </select>
              </label>
            </div>
          </div>

          <div class="form-section">
            <div class="section-title">Clearance &amp; weather</div>
            <div class="form-grid four">
              <label class="field">
                <span>ATIS code</span>
                <input v-model="missionSetup.manual.atisCode" maxlength="1" />
              </label>
              <label class="field">
                <span>QNH</span>
                <input v-model.number="missionSetup.manual.qnh" type="number" min="900" max="1100" />
              </label>
              <label class="field">
                <span>Initial altitude (ft)</span>
                <input v-model.number="missionSetup.manual.initialAltitude" type="number" step="100" min="1000" />
              </label>
              <label class="field">
                <span>Climb altitude (ft)</span>
                <input v-model.number="missionSetup.manual.climbAltitude" type="number" step="100" min="1000" />
              </label>
            </div>
            <div class="form-grid four">
              <label class="field">
                <span>Squawk</span>
                <input v-model="missionSetup.manual.squawk" inputmode="numeric" maxlength="4" />
              </label>
              <label class="field">
                <span>Push delay (min)</span>
                <input v-model.number="missionSetup.manual.pushDelay" type="number" min="0" max="30" />
              </label>
              <label class="field">
                <span>Approach altitude (ft)</span>
                <input v-model.number="missionSetup.manual.approachAltitude" type="number" step="100" min="0" />
              </label>
              <label class="field">
                <span>Arrival QNH</span>
                <input v-model.number="missionSetup.manual.arrivalQnh" type="number" min="900" max="1100" />
              </label>
            </div>
          </div>

          <p v-if="missionSetup.feedback" class="feedback error">{{ missionSetup.feedback }}</p>

          <div class="form-actions">
            <button class="btn ghost" type="button" @click="missionSetup.mode='menu'">
              <v-icon size="18">mdi-arrow-left</v-icon>
              Back
            </button>
            <button class="btn primary" type="button" @click="confirmManualFlight">
              <v-icon size="18">mdi-check</v-icon>
              Lock flight
            </button>
          </div>
        </div>

        <div v-else-if="missionSetup.mode==='simbrief'" class="setup-form">
          <div class="form-head">
            <button class="chip ghost" type="button" @click="missionSetup.mode='menu'">
              <v-icon size="16">mdi-arrow-left</v-icon>
              Back
            </button>
            <h3>SimBrief import</h3>
          </div>

          <p class="muted small">Enter your SimBrief user ID to load the most recent dispatch for this mission.</p>

          <form class="simbrief-fetch" @submit.prevent="fetchSimbriefPlan">
            <label class="field">
              <span>User ID</span>
              <input v-model="missionSetup.simbrief.userId" type="text" placeholder="11860000" />
            </label>
            <button class="btn primary" type="submit" :disabled="missionSetup.simbrief.loading">
              <v-icon size="18" :class="{ spin: missionSetup.simbrief.loading }">
                {{ missionSetup.simbrief.loading ? 'mdi-loading' : 'mdi-download' }}
              </v-icon>
              {{ missionSetup.simbrief.loading ? 'Loading…' : 'Fetch plan' }}
            </button>
          </form>

          <p v-if="missionSetup.simbrief.error" class="feedback error">{{ missionSetup.simbrief.error }}</p>

          <div v-if="missionSetup.simbrief.plan" class="simbrief-summary">
            <div class="summary-row">
              <div class="summary-title">
                {{ missionSetup.simbrief.plan.callsign || missionSetup.simbrief.plan.airlineCode || 'Flight plan' }}
              </div>
              <div class="muted small">
                {{ missionSetup.simbrief.plan.departure.icao || '—' }} → {{ missionSetup.simbrief.plan.destination.icao || '—' }}
              </div>
            </div>
            <dl>
              <div>
                <dt>Runways</dt>
                <dd>{{ missionSetup.simbrief.plan.departure.runway || '—' }} · {{ missionSetup.simbrief.plan.destination.runway || '—' }}</dd>
              </div>
              <div>
                <dt>SID / STAR</dt>
                <dd>{{ missionSetup.simbrief.plan.departure.sid || '—' }} · {{ missionSetup.simbrief.plan.destination.star || '—' }}</dd>
              </div>
              <div>
                <dt>Initial altitude</dt>
                <dd>{{ missionSetup.simbrief.plan.initialAltitude || '—' }} ft</dd>
              </div>
              <div>
                <dt>Squawk</dt>
                <dd>{{ missionSetup.simbrief.plan.squawk || '—' }}</dd>
              </div>
              <div>
                <dt>Route</dt>
                <dd class="muted">{{ missionSetup.simbrief.plan.route || '—' }}</dd>
              </div>
            </dl>
            <div v-if="missionSetup.simbrief.plan.ofpUrl" class="simbrief-link-row">
              <a :href="missionSetup.simbrief.plan.ofpUrl" target="_blank" rel="noopener">
                View SimBrief OFP ↗
              </a>
            </div>
          </div>

          <p v-if="missionSetup.feedback" class="feedback error">{{ missionSetup.feedback }}</p>

          <div class="form-actions">
            <button class="btn ghost" type="button" @click="missionSetup.mode='menu'">
              <v-icon size="18">mdi-arrow-left</v-icon>
              Back
            </button>
            <button class="btn primary" type="button" :disabled="!missionSetup.simbrief.plan" @click="applySimbriefPlan">
              <v-icon size="18">mdi-airplane-check</v-icon>
              Use plan
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- MISSION BRIEFING -->
    <section v-if="panel==='mission-briefing' && missionBriefing" class="container mission-briefing" aria-label="Mission briefing">
      <div class="brief-wrapper">
        <div class="crumbs">
          <button class="link" @click="startMissionSetup(missionBriefing.module.id)">
            <v-icon size="16">mdi-arrow-left</v-icon>
            Setup
          </button>
          <span class="muted">/ {{ missionBriefing.module.title }}</span>
        </div>

        <div class="brief-head">
          <h2 class="h2">Mission briefing</h2>
          <p class="muted">Review the linked flight information before stepping into the comms timeline.</p>
        </div>

        <div class="brief-grid" v-if="missionBriefing.binding">
          <div class="brief-card hero">
            <div class="hero-callsign">{{ missionBriefing.binding.scenario.radioCall }}</div>
            <div class="hero-route">{{ missionBriefing.binding.scenario.airport.icao }} → {{ missionBriefing.binding.scenario.destination.icao }}</div>
            <div class="hero-tags">
              <span class="chip small">{{ bindingSourceLabel(missionBriefing.binding.source) }}</span>
              <span class="chip small">{{ missionBriefing.binding.scenario.airlineCode }}{{ missionBriefing.binding.scenario.flightNumber }}</span>
            </div>
            <div class="hero-meta">
              <div>
                <span class="label">Stand</span>
                <span>{{ missionBriefing.binding.scenario.stand }}</span>
              </div>
              <div>
                <span class="label">Push</span>
                <span>{{ missionBriefing.binding.scenario.pushDelayWords }}</span>
              </div>
              <div>
                <span class="label">Squawk</span>
                <span>{{ missionBriefing.binding.scenario.squawk }}</span>
              </div>
            </div>
            <div class="hero-meta">
              <div>
                <span class="label">Initial climb</span>
                <span>{{ missionBriefing.binding.scenario.altitudes.initial }} ft</span>
              </div>
              <div>
                <span class="label">Approach</span>
                <span>{{ missionBriefing.binding.scenario.approach }}</span>
              </div>
              <div>
                <span class="label">Arrival stand</span>
                <span>{{ missionBriefing.binding.scenario.arrivalStand }}</span>
              </div>
            </div>
          </div>

          <div class="brief-card">
            <div class="card-title">Departure</div>
            <ul class="brief-list">
              <li><strong>Runway</strong> {{ missionBriefing.binding.scenario.runway }}</li>
              <li><strong>SID</strong> {{ missionBriefing.binding.scenario.sid }}</li>
              <li><strong>Transition</strong> {{ missionBriefing.binding.scenario.transition }}</li>
              <li><strong>Taxi</strong> {{ missionBriefing.binding.scenario.taxiRoute }}</li>
            </ul>
          </div>

          <div class="brief-card">
            <div class="card-title">Arrival</div>
            <ul class="brief-list">
              <li><strong>Runway</strong> {{ missionBriefing.binding.scenario.arrivalRunway }}</li>
              <li><strong>STAR</strong> {{ missionBriefing.binding.scenario.arrivalStar }}</li>
              <li><strong>Transition</strong> {{ missionBriefing.binding.scenario.arrivalTransition }}</li>
              <li><strong>Taxi-in</strong> {{ missionBriefing.binding.scenario.arrivalTaxiRoute }}</li>
            </ul>
          </div>

          <div class="brief-card">
            <div class="card-title">Clearance</div>
            <ul class="brief-list">
              <li><strong>ATIS</strong> {{ missionBriefing.binding.scenario.atisCode }}</li>
              <li><strong>QNH</strong> {{ missionBriefing.binding.scenario.qnh }}</li>
              <li><strong>Approach alt</strong> {{ missionBriefing.binding.scenario.approachAltitude }} ft</li>
              <li><strong>Arrival QNH</strong> {{ missionBriefing.binding.scenario.arrivalQnh }}</li>
            </ul>
          </div>

          <div class="brief-card wide">
            <div class="card-title">Frequencies</div>
            <div class="freq-list">
              <span v-for="freq in missionBriefing.binding.scenario.frequencies" :key="freq.type" class="freq-pill">
                {{ freq.label }} {{ freq.value }}
              </span>
            </div>
            <div class="brief-route-text">
              <strong>Route</strong>
              <span>{{ missionBriefing.binding.meta?.route || missionBriefing.binding.scenario.sid + ' · ' + missionBriefing.binding.scenario.arrivalStar }}</span>
            </div>
            <div v-if="missionBriefing.binding.meta?.link" class="brief-link">
              <a :href="missionBriefing.binding.meta.link" target="_blank" rel="noopener">Open flight plan ↗</a>
            </div>
            <div v-if="missionBriefing.binding.meta?.aircraft || missionBriefing.binding.meta?.generatedAt" class="brief-meta-row">
              <span v-if="missionBriefing.binding.meta?.aircraft" class="muted small">Aircraft {{ missionBriefing.binding.meta.aircraft }}</span>
              <span v-if="missionBriefing.binding.meta?.generatedAt" class="muted small">{{ missionBriefing.binding.meta.generatedAt }}</span>
            </div>
          </div>
        </div>

        <div class="brief-actions">
          <button class="btn ghost" type="button" @click="changeCurrentFlight('manual')">
            <v-icon size="18">mdi-pencil</v-icon>
            Adjust flight
          </button>
          <button class="btn primary" type="button" @click="proceedToMission">
            <v-icon size="18">mdi-headset</v-icon>
            Enter mission
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
        <div class="play-actions" v-if="current?.bindsFlight">
          <button class="chip ghost" type="button" @click="reviewCurrentBriefing">
            <v-icon size="16">mdi-information-outline</v-icon>
            Briefing
          </button>
          <button class="chip ghost" type="button" @click="changeCurrentFlight()">
            <v-icon size="16">mdi-airplane-sync</v-icon>
            Change flight
          </button>
        </div>
      </div>

      <div class="module-content">
        <div class="module-overview">
          <div class="track-head">
            <div class="track-title">Mission timeline</div>
            <button class="chip ghost small" type="button" @click="missionLessonView = missionLessonView === 'compact' ? 'expanded' : 'compact'">
              <v-icon size="16">{{ missionLessonView === 'compact' ? 'mdi-view-grid-outline' : 'mdi-timeline-clock-outline' }}</v-icon>
              {{ missionLessonView === 'compact' ? 'Show details' : 'Compact view' }}
            </button>
          </div>
          <div class="lesson-rail" :class="['view-' + missionLessonView]" ref="lessonRail">
            <button
                v-for="l in current.lessons"
                :key="l.id"
                :data-lesson-id="l.id"
                class="lesson"
                :class="[
                  missionLessonView === 'compact' ? 'compact' : '',
                  { active: activeLesson && activeLesson.id===l.id, ok: bestScore(current.id,l.id)>=80 }
                ]"
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
              <div class="muted small" v-if="missionLessonView==='expanded'">{{ l.desc }}</div>
              <div class="tags" v-if="missionLessonView==='expanded'">
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
            <div v-if="current?.bindsFlight && currentBinding" class="flight-brief">
              <div class="flight-route">{{ currentBinding.scenario.airport.icao }} → {{ currentBinding.scenario.destination.icao }}</div>
              <div class="flight-tags">
                <span class="chip small">{{ bindingSourceLabel(currentBinding.source) }}</span>
                <span class="muted small">{{ currentBinding.scenario.sid }} · {{ currentBinding.scenario.arrivalStar }}</span>
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
import {learnModules, overrideFullFlightScenario} from '~~/shared/data/learnModules'
import {applyScenarioOverrides, createBaseScenario, listScenarioAirlines, listScenarioAirports} from '~~/shared/learn/scenario'
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

type FlightSource = 'random' | 'manual' | 'simbrief'

type MissionBindingMeta = {
  headline: string
  note?: string
  route?: string | null
  link?: string | null
  aircraft?: string | null
  generatedAt?: string | null
}

type MissionBinding = {
  moduleId: string
  source: FlightSource
  scenario: Scenario
  createdAt: string
  meta?: MissionBindingMeta
}

type SimbriefPlanSummary = {
  callsign: string | null
  airlineCode: string | null
  airlineCallsign: string | null
  flightNumber: string | null
  route: string | null
  departure: {
    icao: string | null
    name: string | null
    runway: string | null
    sid: string | null
    transition: string | null
  }
  destination: {
    icao: string | null
    name: string | null
    runway: string | null
    star: string | null
    transition: string | null
    approach: string | null
  }
  initialAltitude: number | null
  cruiseAltitude: number | null
  squawk: string | null
  generatedAt: string | null
  aircraft: string | null
  ofpUrl: string | null
}

type ManualSetupState = {
  airlineCode: string
  airlineCallsign: string
  flightNumber: string
  departureIcao: string
  runway: string
  sid: string
  transition: string
  stand: string
  taxiRoute: string
  atisCode: string
  qnh: number
  initialAltitude: number
  climbAltitude: number
  squawk: string
  pushDelay: number
  destinationIcao: string
  arrivalRunway: string
  arrivalStar: string
  arrivalTransition: string
  arrivalTaxiRoute: string
  arrivalStand: string
  approach: string
  approachAltitude: number
  arrivalQnh: number
}

type SimbriefSetupState = {
  userId: string
  loading: boolean
  error: string
  plan: SimbriefPlanSummary | null
}

type MissionSetupState = {
  moduleId: string
  mode: 'menu' | 'manual' | 'simbrief'
  manual: ManualSetupState
  simbrief: SimbriefSetupState
  feedback: string
}

type MissionBriefingState = {
  module: ModuleDef
  binding: MissionBinding
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

const availableAirports = listScenarioAirports()
const availableAirlines = listScenarioAirlines()

function findAirport(icao: string): typeof availableAirports[number] | undefined {
  const code = icao?.toUpperCase()
  return availableAirports.find(entry => entry.icao === code)
}

function findAirline(code: string): typeof availableAirlines[number] | undefined {
  const normalized = code?.toUpperCase()
  return availableAirlines.find(entry => entry.code === normalized)
}

function createManualDefaults(): ManualSetupState {
  const defaultDeparture = availableAirports[0]
  const defaultDestination = availableAirports[1] || availableAirports[0]
  const defaultAirline = availableAirlines[0]
  return {
    airlineCode: defaultAirline?.code ?? 'DLH',
    airlineCallsign: defaultAirline?.call ?? 'Lufthansa',
    flightNumber: '431',
    departureIcao: defaultDeparture?.icao ?? '',
    runway: defaultDeparture?.runways?.[0] ?? '',
    sid: defaultDeparture?.sids?.[0] ?? '',
    transition: defaultDeparture?.transitions?.[0] ?? '',
    stand: defaultDeparture?.stands?.[0] ?? '',
    taxiRoute: defaultDeparture?.taxi?.[0] ?? '',
    atisCode: 'A',
    qnh: 1015,
    initialAltitude: 5000,
    climbAltitude: 7000,
    squawk: '4271',
    pushDelay: 5,
    destinationIcao: defaultDestination && defaultDestination !== defaultDeparture ? defaultDestination.icao : availableAirports[1]?.icao ?? availableAirports[0]?.icao ?? '',
    arrivalRunway: defaultDestination?.runways?.[0] ?? '',
    arrivalStar: defaultDestination?.stars?.[0] ?? '',
    arrivalTransition: defaultDestination?.arrivalTransitions?.[0] ?? '',
    arrivalTaxiRoute: (defaultDestination?.taxiIn?.[0] ?? defaultDestination?.taxi?.[0]) ?? '',
    arrivalStand: defaultDestination?.stands?.[0] ?? '',
    approach: defaultDestination?.approaches?.[0] ?? '',
    approachAltitude: 3000,
    arrivalQnh: 1013,
  }
}

function createSimbriefDefaults(): SimbriefSetupState {
  return {
    userId: '',
    loading: false,
    error: '',
    plan: null,
  }
}

const modules = shallowRef<ModuleDef[]>(learnModules)

const panel = ref<'hub' | 'module' | 'mission-setup' | 'mission-briefing'>('hub')
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
const missionBindings = reactive<Record<string, MissionBinding | undefined>>({})
const missionBriefing = ref<MissionBriefingState | null>(null)
const missionLessonView = ref<'expanded' | 'compact'>('expanded')
const lessonRail = ref<HTMLElement | null>(null)
const missionSetup = reactive<MissionSetupState>({
  moduleId: '',
  mode: 'menu',
  manual: createManualDefaults(),
  simbrief: createSimbriefDefaults(),
  feedback: '',
})

const manualDepartureAirport = computed(() => findAirport(missionSetup.manual.departureIcao) || availableAirports[0])
const manualDestinationAirport = computed(() => findAirport(missionSetup.manual.destinationIcao) || availableAirports.find(airport => airport.icao !== manualDepartureAirport.value?.icao) || availableAirports[1] || availableAirports[0])

const manualDepartureRunways = computed(() => manualDepartureAirport.value?.runways ?? [])
const manualDepartureSids = computed(() => manualDepartureAirport.value?.sids ?? [])
const manualDepartureTransitions = computed(() => manualDepartureAirport.value?.transitions ?? [])
const manualDepartureStands = computed(() => manualDepartureAirport.value?.stands ?? [])
const manualDepartureTaxiRoutes = computed(() => manualDepartureAirport.value?.taxi ?? [])

const manualDestinationRunways = computed(() => manualDestinationAirport.value?.runways ?? [])
const manualDestinationStars = computed(() => manualDestinationAirport.value?.stars ?? [])
const manualDestinationTransitions = computed(() => manualDestinationAirport.value?.arrivalTransitions ?? manualDestinationAirport.value?.transitions ?? [])
const manualDestinationTaxiRoutes = computed(() => manualDestinationAirport.value?.taxiIn ?? manualDestinationAirport.value?.taxi ?? [])
const manualDestinationStands = computed(() => manualDestinationAirport.value?.stands ?? [])
const manualDestinationApproaches = computed(() => manualDestinationAirport.value?.approaches ?? [])

const currentBinding = computed(() => (current.value ? missionBindings[current.value.id] : undefined))
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

watch(() => missionSetup.manual.departureIcao, icao => {
  const airport = findAirport(icao)
  if (!airport) return
  if (!airport.runways.includes(missionSetup.manual.runway)) {
    missionSetup.manual.runway = airport.runways[0] ?? ''
  }
  if (!airport.sids?.includes(missionSetup.manual.sid)) {
    missionSetup.manual.sid = airport.sids?.[0] ?? ''
  }
  if (!airport.transitions?.includes(missionSetup.manual.transition)) {
    missionSetup.manual.transition = airport.transitions?.[0] ?? ''
  }
  if (!airport.stands?.includes(missionSetup.manual.stand)) {
    missionSetup.manual.stand = airport.stands?.[0] ?? ''
  }
  if (!airport.taxi?.includes(missionSetup.manual.taxiRoute)) {
    missionSetup.manual.taxiRoute = airport.taxi?.[0] ?? ''
  }
}, { immediate: true })

watch(() => missionSetup.manual.destinationIcao, icao => {
  const airport = findAirport(icao)
  if (!airport) return
  if (!airport.runways?.includes(missionSetup.manual.arrivalRunway)) {
    missionSetup.manual.arrivalRunway = airport.runways?.[0] ?? ''
  }
  const starOptions = airport.stars ?? []
  if (!starOptions.includes(missionSetup.manual.arrivalStar)) {
    missionSetup.manual.arrivalStar = starOptions[0] ?? ''
  }
  const transitionOptions = airport.arrivalTransitions ?? airport.transitions ?? []
  if (!transitionOptions.includes(missionSetup.manual.arrivalTransition)) {
    missionSetup.manual.arrivalTransition = transitionOptions[0] ?? ''
  }
  const taxiOptions = airport.taxiIn?.length ? airport.taxiIn : airport.taxi
  if (!taxiOptions?.includes(missionSetup.manual.arrivalTaxiRoute)) {
    missionSetup.manual.arrivalTaxiRoute = taxiOptions?.[0] ?? ''
  }
  if (!airport.stands?.includes(missionSetup.manual.arrivalStand)) {
    missionSetup.manual.arrivalStand = airport.stands?.[0] ?? ''
  }
  if (!airport.approaches?.includes(missionSetup.manual.approach)) {
    missionSetup.manual.approach = airport.approaches?.[0] ?? ''
  }
}, { immediate: true })

watch(() => missionSetup.manual.airlineCode, (code, previous) => {
  const preset = findAirline(code)
  if (!preset) {
    missionSetup.manual.airlineCode = code?.toUpperCase() ?? ''
    return
  }
  const previousPreset = previous ? findAirline(previous) : null
  const currentCall = missionSetup.manual.airlineCallsign?.trim()
  if (!currentCall || (previousPreset && currentCall === previousPreset.call)) {
    missionSetup.manual.airlineCallsign = preset.call
  }
  if (missionSetup.manual.airlineCode !== preset.code) {
    missionSetup.manual.airlineCode = preset.code
  }
})

watch(() => missionSetup.manual.atisCode, value => {
  const upper = (value || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 1)
  if (upper !== value) {
    missionSetup.manual.atisCode = upper
  }
})

watch(() => missionSetup.manual.flightNumber, value => {
  const sanitized = (value || '').replace(/[^0-9]/g, '').slice(0, 4)
  if (sanitized !== value) {
    missionSetup.manual.flightNumber = sanitized
  }
})

watch(() => missionSetup.manual.squawk, value => {
  const sanitized = (value || '').replace(/[^0-7]/g, '').slice(0, 4)
  if (sanitized !== value) {
    missionSetup.manual.squawk = sanitized
  }
})

watch(current, module => {
  if (!module) return
  missionLessonView.value = module.lessons.length > 6 ? 'compact' : 'expanded'
  if (panel.value === 'module') {
    nextTick(() => scrollActiveLesson(false))
  }
})

watch(panel, value => {
  if (value === 'module') {
    nextTick(() => scrollActiveLesson(false))
  }
})

function moduleRequiresBinding(id: string): boolean {
  const module = modules.value.find(entry => entry.id === id)
  return Boolean(module?.bindsFlight)
}

function getModuleById(id: string): ModuleDef | undefined {
  return modules.value.find(entry => entry.id === id)
}

function scrollActiveLesson(smooth = true) {
  if (!lessonRail.value || !activeLesson.value) return
  const container = lessonRail.value
  const target = container.querySelector<HTMLElement>(`[data-lesson-id="${activeLesson.value.id}"]`)
  if (!target) return
  const offset = target.offsetLeft - (container.clientWidth - target.clientWidth) / 2
  container.scrollTo({ left: Math.max(0, offset), behavior: smooth ? 'smooth' : 'auto' })
}

function bindingSourceLabel(source: FlightSource): string {
  if (source === 'manual') return 'Manuelle Flugplanung'
  if (source === 'simbrief') return 'SimBrief Import'
  return 'Zufallsmission'
}

function hydrateManualFromScenario(base: Scenario) {
  missionSetup.manual.airlineCode = base.airlineCode
  missionSetup.manual.airlineCallsign = base.airlineCall
  missionSetup.manual.flightNumber = base.flightNumber
  missionSetup.manual.departureIcao = base.airport.icao
  missionSetup.manual.runway = base.runway
  missionSetup.manual.sid = base.sid
  missionSetup.manual.transition = base.transition
  missionSetup.manual.stand = base.stand
  missionSetup.manual.taxiRoute = base.taxiRoute
  missionSetup.manual.atisCode = base.atisCode
  missionSetup.manual.qnh = base.qnh
  missionSetup.manual.initialAltitude = base.altitudes.initial
  missionSetup.manual.climbAltitude = base.altitudes.climb
  missionSetup.manual.squawk = base.squawk
  missionSetup.manual.pushDelay = base.pushDelayMinutes
  missionSetup.manual.destinationIcao = base.destination.icao
  missionSetup.manual.arrivalRunway = base.arrivalRunway
  missionSetup.manual.arrivalStar = base.arrivalStar
  missionSetup.manual.arrivalTransition = base.arrivalTransition
  missionSetup.manual.arrivalTaxiRoute = base.arrivalTaxiRoute
  missionSetup.manual.arrivalStand = base.arrivalStand
  missionSetup.manual.approach = base.approach
  missionSetup.manual.approachAltitude = base.approachAltitude
  missionSetup.manual.arrivalQnh = base.arrivalQnh
}

function startMissionSetup(
  moduleId: string,
  mode: 'menu' | 'manual' | 'simbrief' = 'menu',
  options: { prefillScenario?: Scenario | null } = {},
) {
  const module = getModuleById(moduleId)
  if (!module) return
  current.value = module
  missionSetup.moduleId = moduleId
  missionSetup.feedback = ''
  missionSetup.mode = mode

  if (options.prefillScenario) {
    hydrateManualFromScenario(options.prefillScenario)
  } else if (!currentBinding.value || currentBinding.value.moduleId !== moduleId) {
    Object.assign(missionSetup.manual, createManualDefaults())
  }

  if (mode === 'manual' && !options.prefillScenario && currentBinding.value?.scenario && currentBinding.value.moduleId === moduleId) {
    hydrateManualFromScenario(currentBinding.value.scenario)
  }

  Object.assign(missionSetup.simbrief, createSimbriefDefaults())
  panel.value = 'mission-setup'
}

function finalizeMissionBinding(binding: MissionBinding) {
  missionBindings[binding.moduleId] = binding
  if (binding.moduleId === 'full-flight') {
    overrideFullFlightScenario(binding.scenario)
  }
  const module = getModuleById(binding.moduleId)
  if (!module) {
    panel.value = 'hub'
    return
  }
  missionBriefing.value = { module, binding }
  current.value = module
  panel.value = 'mission-briefing'
}

function proceedToMission() {
  if (!missionBriefing.value) return
  const module = missionBriefing.value.module
  current.value = module
  panel.value = 'module'
  const prog = progress.value[module.id] || {}
  const next = module.lessons.find(lesson => !(prog[lesson.id]?.done)) || module.lessons[0]
  activeLesson.value = next
  nextTick(() => scrollActiveLesson(false))
}

function handleRandomFlight() {
  if (!missionSetup.moduleId) return
  const module = getModuleById(missionSetup.moduleId)
  if (!module) return
  const scenarioData = createBaseScenario()
  const binding: MissionBinding = {
    moduleId: module.id,
    source: 'random',
    scenario: scenarioData,
    createdAt: new Date().toISOString(),
    meta: {
      headline: scenarioData.radioCall,
      note: `${scenarioData.airport.icao} → ${scenarioData.destination.icao}`,
      route: `${scenarioData.sid} · ${scenarioData.arrivalStar}`,
    },
  }
  finalizeMissionBinding(binding)
}

function confirmManualFlight() {
  if (!missionSetup.moduleId) return
  const module = getModuleById(missionSetup.moduleId)
  if (!module) return
  missionSetup.feedback = ''

  const departure = findAirport(missionSetup.manual.departureIcao)
  const destination = findAirport(missionSetup.manual.destinationIcao)

  if (!departure) {
    missionSetup.feedback = 'Bitte wähle einen Abflughafen.'
    return
  }
  if (!destination) {
    missionSetup.feedback = 'Bitte wähle einen Zielflughafen.'
    return
  }
  if (departure.icao === destination.icao) {
    missionSetup.feedback = 'Abflug und Ziel dürfen nicht identisch sein.'
    return
  }

  const airlineCode = (missionSetup.manual.airlineCode || departure.icao.slice(0, 3)).toUpperCase()
  const airlineCall = missionSetup.manual.airlineCallsign?.trim() || findAirline(airlineCode)?.call || 'Flight'
  const flightNumber = missionSetup.manual.flightNumber || '431'
  const initialAltitude = Number.isFinite(missionSetup.manual.initialAltitude)
    ? missionSetup.manual.initialAltitude
    : 5000
  const climbAltitude = Number.isFinite(missionSetup.manual.climbAltitude)
    ? Math.max(initialAltitude, missionSetup.manual.climbAltitude)
    : initialAltitude + 2000

  const base = createBaseScenario()
  const scenarioData = applyScenarioOverrides(base, {
    airlineCode,
    airlineCall,
    flightNumber,
    airport: departure,
    destination,
    runway: missionSetup.manual.runway,
    sid: missionSetup.manual.sid,
    transition: missionSetup.manual.transition,
    stand: missionSetup.manual.stand,
    taxiRoute: missionSetup.manual.taxiRoute,
    atisCode: missionSetup.manual.atisCode || base.atisCode,
    qnh: missionSetup.manual.qnh,
    altitudes: {
      initial: initialAltitude,
      climb: climbAltitude,
    },
    squawk: missionSetup.manual.squawk || base.squawk,
    pushDelayMinutes: missionSetup.manual.pushDelay,
    approach: missionSetup.manual.approach,
    approachAltitude: missionSetup.manual.approachAltitude,
    arrivalRunway: missionSetup.manual.arrivalRunway,
    arrivalStar: missionSetup.manual.arrivalStar,
    arrivalTransition: missionSetup.manual.arrivalTransition,
    arrivalTaxiRoute: missionSetup.manual.arrivalTaxiRoute,
    arrivalStand: missionSetup.manual.arrivalStand,
    arrivalQnh: missionSetup.manual.arrivalQnh,
  })

  const binding: MissionBinding = {
    moduleId: module.id,
    source: 'manual',
    scenario: scenarioData,
    createdAt: new Date().toISOString(),
    meta: {
      headline: scenarioData.radioCall,
      note: `${scenarioData.airport.icao} → ${scenarioData.destination.icao}`,
      route: `${scenarioData.sid} · ${scenarioData.arrivalStar}`,
    },
  }

  finalizeMissionBinding(binding)
}

async function fetchSimbriefPlan() {
  missionSetup.simbrief.error = ''
  missionSetup.feedback = ''
  missionSetup.simbrief.plan = null
  const userId = missionSetup.simbrief.userId.trim()
  if (!userId) {
    missionSetup.simbrief.error = 'Bitte SimBrief User-ID eingeben.'
    return
  }
  missionSetup.simbrief.loading = true
  try {
    const response = await api.get<{ plan: SimbriefPlanSummary }>('/api/learn/simbrief', {
      query: { userid: userId },
      auth: false,
    })
    missionSetup.simbrief.plan = response.plan
  } catch (error: any) {
    missionSetup.simbrief.error = error?.data?.statusMessage || error?.statusMessage || 'Plan konnte nicht geladen werden.'
  } finally {
    missionSetup.simbrief.loading = false
  }
}

function applySimbriefPlan() {
  if (!missionSetup.simbrief.plan || !missionSetup.moduleId) return
  const module = getModuleById(missionSetup.moduleId)
  if (!module) return
  missionSetup.feedback = ''

  const plan = missionSetup.simbrief.plan
  const departure = plan.departure.icao ? findAirport(plan.departure.icao) : undefined
  const destination = plan.destination.icao ? findAirport(plan.destination.icao) : undefined

  if (!departure || !destination) {
    missionSetup.feedback = 'Dieser Flug nutzt derzeit nicht unterstützte Flughäfen.'
    return
  }

  if (departure.icao === destination.icao) {
    missionSetup.feedback = 'SimBrief-Plan hat identische Start- und Zielflughäfen.'
    return
  }

  const callsign = plan.callsign?.toUpperCase() || ''
  let airlineCode = plan.airlineCode?.toUpperCase() || ''
  let flightNumber = plan.flightNumber || ''

  if ((!airlineCode || !flightNumber) && callsign) {
    const match = callsign.match(/^([A-Z]{2,3})([0-9]{1,4})$/)
    if (match) {
      if (!airlineCode) airlineCode = match[1]
      if (!flightNumber) flightNumber = match[2]
    }
  }

  if (!airlineCode) {
    airlineCode = departure.icao.slice(0, 3)
  }
  if (!flightNumber) {
    flightNumber = createBaseScenario().flightNumber
  }

  const presetAirline = findAirline(airlineCode)
  const airlineCall = plan.airlineCallsign || presetAirline?.call || callsign.replace(/\d+/g, '').trim() || 'Flight'
  const initialAltitude = plan.initialAltitude ?? 5000
  const climbAltitude = Math.max(initialAltitude + 2000, plan.cruiseAltitude ?? initialAltitude + 2000)

  const base = createBaseScenario()
  const scenarioData = applyScenarioOverrides(base, {
    airlineCode,
    airlineCall,
    flightNumber,
    airport: departure,
    destination,
    runway: plan.departure.runway || departure.runways?.[0] || base.runway,
    sid: plan.departure.sid || departure.sids?.[0] || base.sid,
    transition: plan.departure.transition || departure.transitions?.[0] || base.transition,
    stand: departure.stands?.[0] ?? base.stand,
    taxiRoute: departure.taxi?.[0] ?? base.taxiRoute,
    altitudes: {
      initial: initialAltitude,
      climb: climbAltitude,
    },
    squawk: plan.squawk || base.squawk,
    approach: plan.destination.approach || destination.approaches?.[0] || base.approach,
    arrivalRunway: plan.destination.runway || destination.runways?.[0] || base.arrivalRunway,
    arrivalStar: plan.destination.star || destination.stars?.[0] || base.arrivalStar,
    arrivalTransition: plan.destination.transition || destination.arrivalTransitions?.[0] || base.arrivalTransition,
    arrivalTaxiRoute: (destination.taxiIn?.[0] ?? destination.taxi?.[0]) ?? base.arrivalTaxiRoute,
    arrivalStand: destination.stands?.[0] ?? base.arrivalStand,
  })

  const binding: MissionBinding = {
    moduleId: module.id,
    source: 'simbrief',
    scenario: scenarioData,
    createdAt: new Date().toISOString(),
    meta: {
      headline: plan.callsign || scenarioData.radioCall,
      note: `${scenarioData.airport.icao} → ${scenarioData.destination.icao}`,
      route: plan.route,
      link: plan.ofpUrl,
      aircraft: plan.aircraft,
      generatedAt: plan.generatedAt,
    },
  }

  finalizeMissionBinding(binding)
}

function changeCurrentFlight(mode: 'menu' | 'manual' = 'menu') {
  if (!current.value) return
  const binding = currentBinding.value
  startMissionSetup(current.value.id, mode, { prefillScenario: binding?.scenario || null })
}

function reviewCurrentBriefing() {
  if (!current.value) return
  const binding = currentBinding.value
  if (!binding) {
    startMissionSetup(current.value.id)
    return
  }
  missionBriefing.value = { module: current.value, binding }
  panel.value = 'mission-briefing'
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
    rollScenario(true)
    nextTick(() => scrollActiveLesson())
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

function openModule(id: string, options: { skipBriefing?: boolean } = {}) {
  const module = getModuleById(id)
  current.value = module || null
  activeLesson.value = null

  if (!module) {
    panel.value = 'hub'
    return
  }

  if (module.bindsFlight) {
    const binding = missionBindings[module.id]
    if (!binding) {
      startMissionSetup(module.id)
      return
    }
    if (!options.skipBriefing) {
      missionBriefing.value = { module, binding }
      panel.value = 'mission-briefing'
      return
    }
  }

  panel.value = 'module'
}

function quickContinue(id: string) {
  const module = getModuleById(id)
  const skipBriefing = module ? moduleHasProgress(module.id) : false
  openModule(id, { skipBriefing })
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
  quickContinue(modId)
}

function modulePrimaryLabel(modId: string) {
  const module = getModuleById(modId)
  if (module?.bindsFlight && !missionBindings[modId]) return 'Brief flight'
  if (moduleCompleted(modId)) return 'Replay mission'
  if (!moduleHasProgress(modId)) return 'Launch mission'
  return 'Resume mission'
}

function modulePrimaryIcon(modId: string) {
  const module = getModuleById(modId)
  if (module?.bindsFlight && !missionBindings[modId]) return 'mdi-airplane-clock'
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

function moduleStatusText(modId: string) {
  if (!isModuleUnlocked(modId)) return 'Clearance pending'
  const module = getModuleById(modId)
  if (module?.bindsFlight && !missionBindings[modId]) return 'Flight briefing required'
  if (moduleCompleted(modId)) return 'Mission complete'
  if (moduleHasProgress(modId)) return 'In progress'
  return 'Ready to launch'
}

function moduleStatusIcon(modId: string) {
  if (!isModuleUnlocked(modId)) return 'mdi-lock-alert'
  const module = getModuleById(modId)
  if (module?.bindsFlight && !missionBindings[modId]) return 'mdi-airplane-alert'
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
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--text) 18%, transparent);
  background: color-mix(in srgb, var(--text) 6%, transparent);
  font-size: 12px;
  letter-spacing: .08em;
  text-transform: uppercase;
  font-weight: 600;
  white-space: nowrap;
  color: var(--t2);
  transition: background .2s ease, border-color .2s ease, transform .2s ease
}

.chip.small {
  font-size: 10px;
  letter-spacing: .14em;
  padding: 4px 8px;
  color: var(--t3)
}

.chip.ghost {
  background: transparent;
  border-color: color-mix(in srgb, var(--text) 24%, transparent);
  color: var(--t3)
}

.chip.ghost:hover {
  background: color-mix(in srgb, var(--text) 10%, transparent);
  color: var(--text)
}

.chip.inline {
  gap: 8px
}

.chip.inline input[type="range"] {
  width: 120px;
  accent-color: var(--accent);
  background: transparent
}

button.chip {
  cursor: pointer
}

button.chip:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--accent) 50%, transparent);
  outline-offset: 2px
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

.play-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
  margin-left: auto;
}

.play-actions .chip {
  font-size: 11px;
  letter-spacing: .12em;
  padding-inline: 10px;
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

/* Mission setup */
.mission-setup,
.mission-briefing {
  padding: clamp(18px, 4vw, 32px) 0;
}

.setup-wrapper,
.brief-wrapper {
  position: relative;
  border-radius: 28px;
  border: 1px solid color-mix(in srgb, var(--text) 18%, transparent);
  background: linear-gradient(160deg, color-mix(in srgb, var(--text) 6%, transparent) 0%, color-mix(in srgb, var(--bg2) 70%, transparent) 100%);
  box-shadow: 0 32px 56px rgba(2, 6, 23, .55);
  backdrop-filter: blur(18px);
  padding: clamp(22px, 4vw, 32px);
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow: hidden;
}

.setup-wrapper::before,
.brief-wrapper::before {
  content: "";
  position: absolute;
  inset: -40% 35% 35% -15%;
  background-size: cover;
  background-position: center;
  opacity: .32;
  filter: saturate(1.1);
  pointer-events: none;
}

.setup-wrapper::before {
  background-image: url('/img/learn/missions/setup-hud.jpg');
}

.brief-wrapper::before {
  background-image: url('/img/learn/missions/briefing-deck.jpg');
}

.setup-wrapper::after,
.brief-wrapper::after {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at top right, color-mix(in srgb, var(--accent) 22%, transparent) 0%, transparent 65%);
  opacity: .6;
  pointer-events: none;
}

.setup-wrapper > *,
.brief-wrapper > * {
  position: relative;
  z-index: 1;
}

.setup-header,
.brief-head {
  max-width: 640px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setup-menu,
.setup-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.setup-form {
  padding: 24px;
  border-radius: 24px;
  border: 1px solid color-mix(in srgb, var(--text) 18%, transparent);
  background: color-mix(in srgb, var(--text) 6%, transparent);
  box-shadow: 0 24px 40px rgba(2, 6, 23, .42);
}

.setup-current {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 20px;
  border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
  background: color-mix(in srgb, var(--accent) 10%, transparent);
  box-shadow: 0 18px 30px rgba(20, 184, 166, .25);
}

.current-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 200px;
}

.current-title {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: .04em;
  text-transform: uppercase;
}

.current-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.current-actions {
  margin-left: auto;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.setup-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.mode-card {
  position: relative;
  border: 1px solid color-mix(in srgb, var(--text) 18%, transparent);
  border-radius: 22px;
  padding: 22px 20px;
  background: linear-gradient(165deg, color-mix(in srgb, var(--text) 6%, transparent) 0%, color-mix(in srgb, var(--bg2) 55%, transparent) 100%);
  color: var(--text);
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 12px;
  cursor: pointer;
  transition: transform .25s ease, border-color .25s ease, box-shadow .25s ease;
  box-shadow: 0 20px 36px rgba(2, 6, 23, .4);
}

.mode-card::after {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at top right, color-mix(in srgb, var(--accent2) 18%, transparent) 0%, transparent 70%);
  opacity: .4;
  pointer-events: none;
}

.mode-card:hover {
  transform: translateY(-6px);
  border-color: color-mix(in srgb, var(--accent) 50%, transparent);
  box-shadow: 0 26px 44px rgba(14, 165, 233, .35);
}

.mode-card h3 {
  font-size: 18px;
  letter-spacing: .04em;
  text-transform: uppercase;
  font-weight: 700;
}

.mode-card p {
  font-size: 14px;
  color: var(--t3);
}

.mode-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: auto;
  font-size: 12px;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--t3);
}

.mode-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 10px;
  letter-spacing: .18em;
  text-transform: uppercase;
  background: color-mix(in srgb, var(--text) 12%, transparent);
  color: var(--t3);
  border: 1px solid color-mix(in srgb, var(--text) 18%, transparent);
}

.mode-card.simbrief {
  background: linear-gradient(170deg, color-mix(in srgb, var(--accent2) 18%, transparent) 0%, color-mix(in srgb, var(--bg2) 65%, transparent) 100%);
  border-color: color-mix(in srgb, var(--accent2) 30%, transparent);
}

.mode-card.simbrief::after {
  background: radial-gradient(circle at top left, color-mix(in srgb, var(--accent) 28%, transparent) 0%, transparent 70%);
}

.mode-card.simbrief .btn {
  margin-top: 14px;
}

.mode-card.simbrief .simbrief-link {
  align-self: flex-start;
  font-size: 12px;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--accent) 70%, white);
}

.mode-card.simbrief .simbrief-link:hover {
  text-decoration: underline;
}

button.mode-card {
  appearance: none;
}

button.mode-card:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--accent) 50%, transparent);
  outline-offset: 2px;
}

.form-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  font-size: 12px;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: var(--t3);
}

.form-grid {
  display: grid;
  gap: 12px;
}

.form-grid.two {
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

.form-grid.three {
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}

.form-grid.four {
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: color-mix(in srgb, var(--text) 4%, transparent);
  border: 1px solid color-mix(in srgb, var(--text) 18%, transparent);
  border-radius: 16px;
  padding: 12px 14px;
}

.field span {
  font-size: 11px;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--t3);
}

.field input,
.field select {
  border: 0;
  background: transparent;
  color: var(--text);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: .02em;
  outline: none;
}

.field input {
  text-transform: uppercase;
}

.field select {
  appearance: none;
  padding-right: 24px;
  cursor: pointer;
}

.field input:focus,
.field select:focus {
  color: var(--text);
}

.form-actions {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: space-between;
}

.feedback.error {
  border: 1px solid color-mix(in srgb, #f97316 45%, transparent);
  background: color-mix(in srgb, #f97316 18%, transparent);
  color: #fecaca;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 13px;
  letter-spacing: .04em;
}

.simbrief-fetch {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
}

.simbrief-fetch .field {
  flex: 1 1 200px;
}

.simbrief-summary {
  border: 1px solid color-mix(in srgb, var(--text) 18%, transparent);
  background: color-mix(in srgb, var(--text) 6%, transparent);
  border-radius: 18px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 16px 28px rgba(2, 6, 23, .35);
}

.summary-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.summary-title {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: .04em;
  text-transform: uppercase;
}

.simbrief-summary dl {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.simbrief-summary dt {
  font-size: 10px;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: var(--t3);
}

.simbrief-summary dd {
  margin: 2px 0 0;
  font-weight: 600;
}

.simbrief-link-row {
  text-align: right;
  margin-top: 4px;
}

.simbrief-link-row a {
  font-size: 12px;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--accent) 70%, white);
}

.simbrief-link-row a:hover {
  text-decoration: underline;
}

.brief-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.brief-card {
  position: relative;
  border: 1px solid color-mix(in srgb, var(--text) 18%, transparent);
  border-radius: 22px;
  padding: 20px 18px;
  background: color-mix(in srgb, var(--text) 6%, transparent);
  box-shadow: 0 18px 34px rgba(2, 6, 23, .42);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.brief-card.hero {
  grid-column: span 2;
  padding: 26px 24px;
  background: linear-gradient(170deg, color-mix(in srgb, var(--accent) 14%, transparent) 0%, color-mix(in srgb, var(--bg2) 70%, transparent) 100%);
  border-color: color-mix(in srgb, var(--accent) 45%, transparent);
  overflow: hidden;
}

.brief-card.hero::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(150deg, rgba(15, 23, 42, .1) 0%, rgba(15, 23, 42, .8) 70%), url('/img/learn/missions/briefing-flightdeck.jpg') center/cover no-repeat;
  opacity: .45;
  pointer-events: none;
}

.brief-card.hero > * {
  position: relative;
  z-index: 1;
}

.hero-callsign {
  font-size: clamp(26px, 4vw, 32px);
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.hero-route {
  font-size: 16px;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--t3);
}

.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
}

.hero-meta {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.hero-meta .label {
  font-size: 11px;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: var(--t3);
}

.hero-meta span:last-child {
  font-weight: 600;
  color: var(--text);
}

.brief-card .card-title {
  font-size: 13px;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: var(--t3);
}

.brief-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
}

.brief-list li strong {
  font-weight: 600;
  letter-spacing: .04em;
  text-transform: uppercase;
  color: var(--t3);
  margin-right: 6px;
}

.brief-card.wide {
  grid-column: 1 / -1;
}

.freq-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.freq-pill {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--text) 22%, transparent);
  background: color-mix(in srgb, var(--text) 8%, transparent);
  font-size: 12px;
  letter-spacing: .06em;
  text-transform: uppercase;
  color: var(--t3);
}

.brief-route-text {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
}

.brief-route-text strong {
  font-size: 11px;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: var(--t3);
}

.brief-link {
  margin-top: 10px;
  text-align: right;
}

.brief-link a {
  font-size: 12px;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--accent) 70%, white);
}

.brief-link a:hover {
  text-decoration: underline;
}

.brief-meta-row {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  color: var(--t3);
  font-size: 12px;
}

.brief-actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
}

.flight-brief {
  border: 1px solid color-mix(in srgb, var(--text) 18%, transparent);
  background: color-mix(in srgb, var(--text) 6%, transparent);
  border-radius: 16px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.flight-route {
  font-size: 14px;
  letter-spacing: .1em;
  text-transform: uppercase;
  font-weight: 700;
}

.flight-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
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

.lesson-rail {
  position: relative;
  display: flex;
  align-items: stretch;
  gap: 14px;
  overflow-x: auto;
  padding: 6px 8px 16px;
  margin: 0 -8px;
  scroll-snap-type: x proximity;
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, var(--accent) 40%, transparent) transparent;
}

.lesson-rail::-webkit-scrollbar {
  height: 8px;
}

.lesson-rail::-webkit-scrollbar-track {
  background: transparent;
}

.lesson-rail::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--accent) 35%, transparent);
  border-radius: 999px;
}

.lesson {
  position: relative;
  flex: 0 0 clamp(240px, 30vw, 320px);
  min-height: 180px;
  text-align: left;
  border: 1px solid color-mix(in srgb, var(--text) 18%, transparent);
  padding: 26px 18px 18px;
  background: linear-gradient(170deg, color-mix(in srgb, var(--text) 5%, transparent) 0%, color-mix(in srgb, var(--bg2) 55%, transparent) 100%);
  cursor: pointer;
  border-radius: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  scroll-snap-align: start;
  box-shadow: 0 18px 32px rgba(2, 6, 23, .35);
  transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
}

.lesson.compact {
  flex: 0 0 clamp(200px, 24vw, 260px);
  min-height: 150px;
  padding: 22px 16px 16px;
}

.lesson:hover {
  transform: translateY(-6px);
  box-shadow: 0 26px 44px rgba(2, 6, 23, .45);
}

.lesson.active {
  border-color: color-mix(in srgb, var(--accent) 55%, transparent);
  box-shadow: 0 30px 52px rgba(45, 212, 191, .28);
}

.lesson.ok {
  border-color: color-mix(in srgb, #22c55e 45%, transparent);
}

.lesson-score {
  position: absolute;
  top: 14px;
  right: 16px;
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
  background: color-mix(in srgb, var(--text) 12%, transparent);
  animation: badgePulse 8s ease-in-out infinite;
}

.lesson.compact .lesson-score {
  top: 12px;
  right: 12px;
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

  .setup-wrapper,
  .brief-wrapper {
    padding: 20px;
    border-radius: 24px;
  }

  .setup-form {
    padding: 20px;
  }

  .setup-cards {
    grid-template-columns: 1fr;
  }

  .setup-current {
    flex-direction: column;
    align-items: flex-start;
  }

  .current-actions {
    margin-left: 0;
  }

  .play-actions {
    justify-content: flex-start;
    margin-left: 0;
  }

  .form-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .form-actions {
    justify-content: flex-start;
  }

  .simbrief-summary dl {
    grid-template-columns: 1fr;
  }

  .brief-grid {
    grid-template-columns: 1fr;
  }

  .brief-card.hero {
    grid-column: 1 / -1;
  }

  .brief-actions {
    justify-content: flex-start;
  }

  .lesson-rail {
    margin: 0;
    padding: 6px 0 14px;
  }

  .lesson {
    flex: 0 0 80vw;
  }

  .lesson.compact {
    flex-basis: 68vw;
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

  .setup-wrapper,
  .brief-wrapper {
    padding: 16px;
    border-radius: 20px;
  }

  .setup-form {
    padding: 16px;
  }

  .mode-card {
    padding: 18px;
  }

  .form-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .form-actions .btn {
    width: 100%;
    justify-content: center;
  }

  .simbrief-fetch {
    flex-direction: column;
    align-items: stretch;
  }

  .simbrief-fetch .btn {
    width: 100%;
  }

  .brief-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .brief-actions .btn {
    width: 100%;
    justify-content: center;
  }

  .lesson {
    flex: 0 0 92vw;
  }

  .lesson.compact {
    flex-basis: 88vw;
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
