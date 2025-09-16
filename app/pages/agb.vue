<template>
  <div class="min-h-screen bg-[#0b1020] text-white py-12 px-6">
    <div class="mx-auto max-w-4xl space-y-8">
      <header class="space-y-3">
        <NuxtLink to="/" class="inline-flex items-center gap-2 text-sm text-white/60 hover:text-cyan-300">
          <v-icon icon="mdi-arrow-left" size="18" /> Zurück zur Startseite
        </NuxtLink>
        <p class="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Rechtliches</p>
        <h1 class="text-3xl font-semibold">Allgemeine Geschäftsbedingungen (AGB)</h1>
        <p class="text-white/70">Stand: {{ lastUpdated }}</p>
      </header>

      <section v-for="section in sections" :key="section.title" class="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 class="text-xl font-semibold">{{ section.title }}</h2>
        <div class="space-y-2 text-white/70">
          <p v-for="paragraph in section.paragraphs" :key="paragraph">{{ paragraph }}</p>
          <ul v-if="section.list" class="list-disc space-y-1 pl-6">
            <li v-for="item in section.list" :key="item">{{ item }}</li>
          </ul>
        </div>
      </section>

      <footer class="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
        <p>Fragen zu diesen AGB beantworten wir unter legal@opensquawk.dev. Für Enterprise- oder Trainingsprogramme erstellen wir individuelle Verträge.</p>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
const lastUpdated = new Date('2025-01-15').toLocaleDateString('de-DE')

const sections = [
  {
    title: '1. Geltungsbereich',
    paragraphs: [
      'Diese AGB regeln die Nutzung der Plattform OpenSquawk (“Dienst”), betrieben von der OpenSquawk UG (haftungsbeschränkt). Abweichende Bedingungen des Nutzers werden nicht anerkannt, es sei denn, wir stimmen ihrer Geltung ausdrücklich schriftlich zu.',
    ],
  },
  {
    title: '2. Registrierung & Einladungscodes',
    paragraphs: [
      'Ein Nutzerkonto darf nur mit gültigem Einladungscode angelegt werden. Einladungscodes sind personalisiert, zeitlich limitiert und dürfen nicht verkauft oder unbefugt weitergegeben werden.',
    ],
    list: [
      'Wartelistenplätze berechtigen nicht automatisch zur Registrierung.',
      'Aktive Nutzer können frühestens 14 Tage nach Account-Erstellung bis zu zwei Einladungscodes generieren.',
      'OpenSquawk behält sich vor, Einladungscodes nach Missbrauchsverdacht zu sperren.',
    ],
  },
  {
    title: '3. Vertragsgegenstand',
    paragraphs: [
      'OpenSquawk bietet AI-gestützte Kommunikationssimulation für Flugsimulatoren. Funktionen umfassen Push-to-Talk-Verarbeitung, Text-to-Speech, Lernmodule und Integrationen. Der Dienst ist ausschließlich für Ausbildungs- und Trainingszwecke gedacht – nicht für den realen Flugfunk.',
    ],
  },
  {
    title: '4. Pflichten der Nutzer',
    list: [
      'Zugangsdaten vertraulich behandeln und Dritten nicht überlassen.',
      'Keine rechtswidrigen oder beleidigenden Inhalte übertragen.',
      'Systeme nicht übermäßig belasten oder Sicherheitsmechanismen umgehen.',
      'Eigenständige Sicherung lokaler Daten/Audioaufnahmen.',
    ],
    paragraphs: [
      'Wir behalten uns vor, Accounts bei Verstößen temporär oder dauerhaft zu sperren.',
    ],
  },
  {
    title: '5. Logging & Datenanalyse',
    paragraphs: [
      'Zur Qualitätsverbesserung werden sämtliche Funksprüche – sowohl Texteingaben als auch PTT-Transkripte – zusammen mit Metaangaben (z. B. Modul, Entscheidungspfad, Signalstärke) gespeichert und ausgewertet. Mit Nutzung des Dienstes stimmen Sie dieser Verarbeitung zu.',
    ],
  },
  {
    title: '6. Preise & Zahlungsbedingungen',
    paragraphs: [
      'OpenSquawk kann kostenpflichtige Hosted-Pläne anbieten. Preise werden transparent vor Vertragsabschluss angezeigt. Gebühren sind monatlich im Voraus fällig. Erfolgt die Zahlung nicht fristgerecht, kann das Konto gesperrt werden.',
    ],
  },
  {
    title: '7. Laufzeit & Kündigung',
    paragraphs: [
      'Kostenlose Konten können jederzeit ohne Frist gelöscht werden. Bei kostenpflichtigen Tarifen gilt – sofern nichts anderes vereinbart – eine monatliche Laufzeit mit Kündigungsfrist von sieben Tagen zum Monatsende. Kündigungen müssen schriftlich oder per E-Mail erfolgen.',
    ],
  },
  {
    title: '8. Gewährleistung & Haftung',
    paragraphs: [
      'OpenSquawk stellt einen Beta-Dienst bereit. Wir übernehmen keine Gewähr für unterbrechungsfreie Verfügbarkeit oder absolute Richtigkeit der generierten Inhalte. Haftung besteht nur bei Vorsatz, grober Fahrlässigkeit sowie bei Verletzung von Leben, Körper oder Gesundheit.',
    ],
  },
  {
    title: '9. Änderungen der AGB',
    paragraphs: [
      'Wir behalten uns vor, diese AGB bei Bedarf anzupassen. Nutzer werden mindestens 14 Tage vor Inkrafttreten informiert. Widerspricht der Nutzer nicht innerhalb der Frist, gelten die neuen Bedingungen als akzeptiert.',
    ],
  },
  {
    title: '10. Schlussbestimmungen',
    paragraphs: [
      'Es gilt deutsches Recht. Gerichtsstand für Kaufleute ist Berlin. Sollten einzelne Bestimmungen unwirksam sein, bleibt die Wirksamkeit der übrigen Regelungen unberührt.',
    ],
  },
]
</script>

