<template>
  <div class="min-h-screen bg-[#0b1020] text-white py-12 px-6">
    <div class="mx-auto max-w-5xl space-y-10">
      <header class="space-y-3">
        <NuxtLink to="/" class="inline-flex items-center gap-2 text-sm text-white/60 hover:text-cyan-300">
          <v-icon icon="mdi-arrow-left" size="18" /> Zurück zur Startseite
        </NuxtLink>
        <p class="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Developer</p>
        <h1 class="text-3xl font-semibold">OpenSquawk API – Dokumentation</h1>
        <p class="text-white/70">Alle Endpunkte sind JSON-basiert und laufen über HTTPS. Standard-Response enthält <code class="bg-white/10 px-1">success</code> oder ein Fehlerobjekt mit <code class="bg-white/10 px-1">statusMessage</code>.</p>
      </header>

      <section class="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <h2 class="text-xl font-semibold">Authentifizierung</h2>
        <p class="text-white/70">
          Nach erfolgreichem Login wird ein JWT (Bearer-Token) zurückgegeben und ein HTTP-only-Refresh-Cookie gesetzt. Für alle geschützten Endpunkte muss der Header <code class="bg-white/10 px-1">Authorization: Bearer &lt;token&gt;</code> gesetzt werden. Tokens laufen nach 15 Minuten ab und können über <code>/api/service/auth/refresh</code> erneuert werden.
        </p>
        <p class="text-white/70">Nicht authentifizierte Endpunkte befinden sich im Namensraum <code class="bg-white/10 px-1">/api/service/*</code>.</p>
      </section>

      <section class="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
        <h2 class="text-xl font-semibold">Öffentliche Endpunkte</h2>
        <div class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead class="uppercase tracking-[0.2em] text-white/50">
              <tr>
                <th class="px-3 py-2">Methode</th>
                <th class="px-3 py-2">Pfad</th>
                <th class="px-3 py-2">Beschreibung</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/10">
              <tr v-for="row in publicEndpoints" :key="row.path">
                <td class="px-3 py-2 font-mono text-cyan-300">{{ row.method }}</td>
                <td class="px-3 py-2 font-mono">{{ row.path }}</td>
                <td class="px-3 py-2 text-white/70">{{ row.description }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
        <h2 class="text-xl font-semibold">Geschützte Endpunkte</h2>
        <div class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead class="uppercase tracking-[0.2em] text-white/50">
              <tr>
                <th class="px-3 py-2">Methode</th>
                <th class="px-3 py-2">Pfad</th>
                <th class="px-3 py-2">Beschreibung</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/10">
              <tr v-for="row in protectedEndpoints" :key="row.path">
                <td class="px-3 py-2 font-mono text-cyan-300">{{ row.method }}</td>
                <td class="px-3 py-2 font-mono">{{ row.path }}</td>
                <td class="px-3 py-2 text-white/70">{{ row.description }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <h2 class="text-xl font-semibold">Antwort- und Fehlerformat</h2>
        <pre class="overflow-x-auto rounded-xl bg-black/60 p-4 text-sm text-white/80">
{
  "success": true,
  "data": { ... }
}

// Fehler
{
  "statusCode": 401,
  "statusMessage": "Authentication required"
}
        </pre>
        <p class="text-white/70">Weitere Felder wie <code class="bg-white/10 px-1">joinedAt</code> oder <code class="bg-white/10 px-1">invitationStatus</code> werden jeweils im Response dokumentiert.</p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
const publicEndpoints = [
  { method: 'POST', path: '/api/service/waitlist', description: 'Person auf die Warteliste setzen. Erfordert Zustimmung zu AGB & Datenschutz.' },
  { method: 'GET', path: '/api/service/waitlist', description: 'Aggregierte Wartelistenstatistiken mit Gesamtanzahl, Wachstum und sichtbarem Puffer abrufen.' },
  { method: 'POST', path: '/api/service/updates', description: 'E-Mail für Produkt-Updates und neue Features eintragen (Einwilligung erforderlich).' },
  { method: 'GET', path: '/api/service/roadmap', description: 'Roadmap-Items inklusive Community-Durchschnitt, Gesamtstimmen und letzter Aktivität auslesen.' },
  { method: 'POST', path: '/api/service/roadmap', description: 'Wichtigkeit (1–5) für einzelne Roadmap-Punkte voten; speichert jeden Vote mit Zeitstempel.' },
  { method: 'POST', path: '/api/service/roadmap-suggestions', description: 'Neuen Roadmap-Vorschlag mit optionaler Kontaktadresse einreichen.' },
  { method: 'POST', path: '/api/service/auth/login', description: 'Login mit E-Mail & Passwort. Gibt JWT zurück und setzt Refresh-Cookie.' },
  { method: 'POST', path: '/api/service/auth/register', description: 'Registrierung mit Einladungscode und Einwilligungen.' },
  { method: 'POST', path: '/api/service/auth/refresh', description: 'Access-Token anhand des Refresh-Cookies erneuern.' },
  { method: 'GET', path: '/api/service/invitations/{code}', description: 'Einladungscode prüfen (gültig, abgelaufen, verwendet).' },
  { method: 'POST', path: '/api/service/invitations/bootstrap', description: 'Bootstrap-Einladungscode generieren (aktiv bis 01.07.2024, optionales Label).' },
]

const protectedEndpoints = [
  { method: 'GET', path: '/api/auth/me', description: 'Profil des aktuellen Nutzers abrufen.' },
  { method: 'POST', path: '/api/auth/logout', description: 'Aktive Session invalidieren und Refresh-Cookie löschen.' },
  { method: 'GET', path: '/api/auth/invitations', description: 'Eigene erstellte Einladungscodes auflisten.' },
  { method: 'POST', path: '/api/auth/invitations', description: 'Neuen Einladungscode generieren (nach 14 Tagen, max. 2).' },
  { method: 'POST', path: '/api/atc/say', description: 'ATC-Sprachausgabe erzeugen (TTS) – mit Logging des Textes.' },
  { method: 'POST', path: '/api/atc/ptt', description: 'Push-to-Talk Audio verarbeiten, transkribieren und loggen.' },
  { method: 'POST', path: '/api/llm/decide', description: 'LLM-gestützte Entscheidungslogik für den aktuellen Flugzustand.' },
  { method: 'GET', path: '/api/vatsim/flightplans', description: 'Gefilterte VATSIM-Flugpläne für eine CID abrufen.' },
]
</script>

