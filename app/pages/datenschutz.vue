<template>
  <div class="min-h-screen bg-[#0b1020] text-white py-12 px-6">
    <div class="mx-auto max-w-4xl space-y-8">
      <header class="space-y-3">
        <NuxtLink to="/" class="inline-flex items-center gap-2 text-sm text-white/60 hover:text-cyan-300">
          <v-icon icon="mdi-arrow-left" size="18" /> Zurück zur Startseite
        </NuxtLink>
        <p class="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Rechtliches</p>
        <h1 class="text-3xl font-semibold">Datenschutzerklärung</h1>
        <p class="text-white/70">Stand: {{ lastUpdated }}</p>
      </header>

      <section class="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 class="text-xl font-semibold">1. Verantwortlicher</h2>
        <p class="text-white/70">
          Verantwortlich für die Datenverarbeitung im Sinne der Datenschutz-Grundverordnung (DSGVO) ist die OpenSquawk UG (haftungsbeschränkt), Musterstraße 12, 10115 Berlin, Deutschland. Kontakt: datenschutz@opensquawk.dev.
        </p>
      </section>

      <section class="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 class="text-xl font-semibold">2. Verarbeitete Daten</h2>
        <ul class="list-disc space-y-2 pl-6 text-white/70">
          <li><strong>Warteliste:</strong> Name (optional), E-Mail-Adresse, freiwillige Hinweise, Zeitpunkt des Eintrags, Einwilligungen.</li>
          <li><strong>Feature-Benachrichtigungen:</strong> E-Mail-Adresse, optionaler Name, Opt-in-Zeitpunkt, Zustimmung für Produkt-Updates.</li>
          <li><strong>Nutzerkonto:</strong> Name, E-Mail-Adresse, Passwort-Hash, Einladungsstatus, Erstellungs- und Login-Zeitpunkte, Einladungscode-Historie.</li>
          <li><strong>Roadmap-Vorschläge:</strong> Titel, Beschreibung, optional angegebene Kontaktadresse, Einwilligungen und Zeitstempel.</li>
          <li><strong>Kommunikationsdaten:</strong> Sämtliche eingegebenen oder per Push-to-Talk übermittelten Funksprüche (Transkripte, normalisierte Texte, Metaangaben wie Modul, Lesson-ID, Stärke, Entscheidungskontext).</li>
          <li><strong>Technische Protokolle:</strong> Geräteinformationen (Browser, OS), Zeitstempel, Request-IDs, Fehlerlogs.</li>
        </ul>
        <p class="text-xs text-white/50">Hinweis: Audio-Dateien aus Push-to-Talk werden nur temporär verarbeitet, Transkripte und Kontextdaten speichern wir zur Qualitätsverbesserung.</p>
      </section>

      <section class="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 class="text-xl font-semibold">3. Zwecke und Rechtsgrundlagen</h2>
        <ul class="space-y-3 text-white/70">
          <li><strong>Bereitstellung des Dienstes (Art. 6 Abs. 1 lit. b DSGVO):</strong> Verwaltung von Warteliste, Accounts und Sessions, Ausgabe von Einladungscodes, Abrechnung zukünftiger Tarife.</li>
          <li><strong>Produktverbesserung & Sicherheit (Art. 6 Abs. 1 lit. f DSGVO):</strong> Analyse und Logging sämtlicher Funksprüche, Fehlerüberwachung, Missbrauchsprävention.</li>
          <li><strong>Kommunikation & Community-Feedback (Art. 6 Abs. 1 lit. a DSGVO):</strong> Versand von Wartelisten-Updates und Produkt-News nach ausdrücklicher Einwilligung sowie Auswertung eingereichter Roadmap-Vorschläge inkl. optionaler Kontaktaufnahme.</li>
        </ul>
      </section>

      <section class="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 class="text-xl font-semibold">4. Speicherdauer</h2>
        <ul class="space-y-2 text-white/70">
          <li>Wartelisteneinträge: bis zum Widerruf oder maximal 24 Monate nach letzter Aktivität.</li>
          <li>Feature-Benachrichtigungen: bis zur Abmeldung (Opt-out) oder Widerruf der Einwilligung.</li>
          <li>Roadmap-Vorschläge: bis zur Umsetzung oder spätestens 18 Monate nach Einreichung.</li>
          <li>Accountdaten: solange das Nutzerkonto besteht, anschließend entsprechend gesetzlicher Aufbewahrungspflichten.</li>
          <li>Kommunikationslogs: mindestens 12 Monate zur Qualitätsverbesserung; bei Supportfällen oder Missbrauchsvorwürfen bis zur abschließenden Klärung.</li>
        </ul>
      </section>

      <section class="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 class="text-xl font-semibold">5. Weitergabe & Auftragsverarbeitung</h2>
        <p class="text-white/70">
          Wir hosten OpenSquawk auf europäischen Cloud-Plattformen (derzeit Hetzner Cloud, Deutschland). Kommunikationsdaten werden in unserer MongoDB-Datenbank gespeichert. Externe KI-Dienstleister (z. B. OpenAI) erhalten ausschließlich pseudonymisierte Texte zur Verarbeitung von TTS/LLM-Funktionen. Es gelten entsprechende Auftragsverarbeitungsverträge. Eine Übermittlung in Drittstaaten erfolgt nur unter Nutzung von EU-Standardvertragsklauseln.
        </p>
        <p class="text-xs text-white/60">
          Hinweis: Formularübermittlungen (Warteliste, Feature-Benachrichtigungen, Roadmap-Vorschläge) lösen eine interne Benachrichtigungs-E-Mail an opensquawk@faktorxmensch.com aus, versendet über den konfigurierten SMTP- oder Transaktionsmail-Anbieter. Enthalten sind ausschließlich die von dir eingegebenen Angaben zur zügigen Bearbeitung.
        </p>
      </section>

      <section class="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 class="text-xl font-semibold">6. Rechte der Betroffenen</h2>
        <ul class="list-disc space-y-2 pl-6 text-white/70">
          <li>Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung (Art. 15–18 DSGVO).</li>
          <li>Datenübertragbarkeit (Art. 20 DSGVO).</li>
          <li>Widerspruch gegen Verarbeitung aus berechtigtem Interesse (Art. 21 DSGVO).</li>
          <li>Widerruf erteilter Einwilligungen mit Wirkung für die Zukunft.</li>
          <li>Beschwerderecht bei einer Datenschutzaufsichtsbehörde, z. B. Berliner Beauftragte für Datenschutz und Informationsfreiheit.</li>
        </ul>
      </section>

      <section class="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 class="text-xl font-semibold">7. Kontakt für Datenschutzanfragen</h2>
        <p class="text-white/70">
          Bitte richten Sie Auskunfts- oder Löschersuchen an datenschutz@opensquawk.dev. Zur eindeutigen Zuordnung benötigen wir die bei OpenSquawk registrierte E-Mail-Adresse sowie ggf. weitere Identifikationsmerkmale (z. B. VATSIM-ID).
        </p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
const lastUpdated = new Date('2025-02-20').toLocaleDateString('de-DE')
</script>

<style scoped>
.chip {
  @apply inline-flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-medium text-cyan-200;
}
</style>

