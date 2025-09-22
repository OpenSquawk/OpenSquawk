
<template>
  <div
    ref="deck"
    class="presentation"
    tabindex="0"
    @click="nextSlide"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
  >
    <transition name="slide-fade" mode="out-in">
      <section
        :key="currentSlide.id"
        class="slide"
        :style="{ background: currentSlide.background || defaultBackground }"
      >
        <div class="slide-inner" :class="{ 'two-column': currentSlide.columns }">
          <header v-if="currentSlide.kicker" class="kicker">{{ currentSlide.kicker }}</header>
          <h1 class="title">{{ currentSlide.title }}</h1>
          <p v-if="currentSlide.subtitle" class="subtitle">{{ currentSlide.subtitle }}</p>

          <div v-if="currentSlide.body" class="body">
            <p v-for="(paragraph, idx) in currentSlide.body" :key="idx">{{ paragraph }}</p>
          </div>

          <ul v-if="currentSlide.bullets" class="bullets">
            <li v-for="(item, idx) in currentSlide.bullets" :key="idx">{{ item }}</li>
          </ul>

          <div v-if="currentSlide.columns" class="columns">
            <div v-for="(column, idx) in currentSlide.columns" :key="idx" class="column">
              <h2 v-if="column.heading">{{ column.heading }}</h2>
              <p v-if="column.text">{{ column.text }}</p>
              <ul v-if="column.bullets">
                <li v-for="(item, bIdx) in column.bullets" :key="bIdx">{{ item }}</li>
              </ul>
            </div>
          </div>

          <blockquote v-if="currentSlide.quote" class="quote">
            <p>{{ currentSlide.quote }}</p>
            <footer v-if="currentSlide.quoteSource">— {{ currentSlide.quoteSource }}</footer>
          </blockquote>

          <footer v-if="currentSlide.note" class="note">{{ currentSlide.note }}</footer>

          <div v-if="currentSlide.qr" class="qr" aria-label="QR code">
            <img :src="currentSlide.qr" alt="QR code leading to the OpenSquawk repository" />
          </div>
        </div>
      </section>
    </transition>

    <div class="hud">
      <span class="progress-label">{{ currentIndex + 1 }} / {{ totalSlides }}</span>
      <div class="progress">
        <div class="progress-bar" :style="{ width: progress + '%' }" />
      </div>
      <span class="hint">Use ← / → keys • Click or tap to advance</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const defaultBackground = 'linear-gradient(135deg, #0f172a, #1f2937)';
const qrSvg = 'data:image/svg+xml;base64,' +
  'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMTAgMzEwIj48cmVjdCBmaWxsPSJ3aGl0ZSIgd2lkdGg9IjMx' +
  'MCIgaGVpZ2h0PSIzMTAiLz48cGF0aCBmaWxsPSJibGFjayIgZD0iTTEwLDEwaDEwdjEwaC0xMHpNMjAsMTBoMTB2MTBoLTEwek0zMCwxMGgxMHYxMGgtMTB6' +
  'TTQwLDEwaDEwdjEwaC0xMHpNNTAsMTBoMTB2MTBoLTEwek02MCwxMGgxMHYxMGgtMTB6TTcwLDEwaDEwdjEwaC0xMHpNMTEwLDEwaDEwdjEwaC0xMHpNMTQw' +
  'LDEwaDEwdjEwaC0xMHpNMTUwLDEwaDEwdjEwaC0xMHpNMTYwLDEwaDEwdjEwaC0xMHpNMjAwLDEwaDEwdjEwaC0xMHpNMjMwLDEwaDEwdjEwaC0xMHpNMjQw' +
  'LDEwaDEwdjEwaC0xMHpNMjUwLDEwaDEwdjEwaC0xMHpNMjYwLDEwaDEwdjEwaC0xMHpNMjcwLDEwaDEwdjEwaC0xMHpNMjgwLDEwaDEwdjEwaC0xMHpNMjkw' +
  'LDEwaDEwdjEwaC0xMHpNMTAsMjBoMTB2MTBoLTEwek03MCwyMGgxMHYxMGgtMTB6TTEwMCwyMGgxMHYxMGgtMTB6TTE1MCwyMGgxMHYxMGgtMTB6TTE2MCwy' +
  'MGgxMHYxMGgtMTB6TTE3MCwyMGgxMHYxMGgtMTB6TTE4MCwyMGgxMHYxMGgtMTB6TTE5MCwyMGgxMHYxMGgtMTB6TTIwMCwyMGgxMHYxMGgtMTB6TTIxMCwy' +
  'MGgxMHYxMGgtMTB6TTIzMCwyMGgxMHYxMGgtMTB6TTI5MCwyMGgxMHYxMGgtMTB6TTEwLDMwaDEwdjEwaC0xMHpNMzAsMzBoMTB2MTBoLTEwek00MCwzMGgx' +
  'MHYxMGgtMTB6TTUwLDMwaDEwdjEwaC0xMHpNNzAsMzBoMTB2MTBoLTEwek05MCwzMGgxMHYxMGgtMTB6TTEyMCwzMGgxMHYxMGgtMTB6TTE1MCwzMGgxMHYx' +
  'MGgtMTB6TTE5MCwzMGgxMHYxMGgtMTB6TTIwMCwzMGgxMHYxMGgtMTB6TTIxMCwzMGgxMHYxMGgtMTB6TTIzMCwzMGgxMHYxMGgtMTB6TTI1MCwzMGgxMHYx' +
  'MGgtMTB6TTI2MCwzMGgxMHYxMGgtMTB6TTI3MCwzMGgxMHYxMGgtMTB6TTI5MCwzMGgxMHYxMGgtMTB6TTEwLDQwaDEwdjEwaC0xMHpNMzAsNDBoMTB2MTBo' +
  'LTEwek00MCw0MGgxMHYxMGgtMTB6TTUwLDQwaDEwdjEwaC0xMHpNNzAsNDBoMTB2MTBoLTEwek0xMDAsNDBoMTB2MTBoLTEwek0xMzAsNDBoMTB2MTBoLTEw' +
  'ek0xNDAsNDBoMTB2MTBoLTEwek0xNTAsNDBoMTB2MTBoLTEwek0xNjAsNDBoMTB2MTBoLTEwek0xOTAsNDBoMTB2MTBoLTEwek0yMzAsNDBoMTB2MTBoLTEw' +
  'ek0yNTAsNDBoMTB2MTBoLTEwek0yNjAsNDBoMTB2MTBoLTEwek0yNzAsNDBoMTB2MTBoLTEwek0yOTAsNDBoMTB2MTBoLTEwek0xMCw1MGgxMHYxMGgtMTB6' +
  'TTMwLDUwaDEwdjEwaC0xMHpNNDAsNTBoMTB2MTBoLTEwek01MCw1MGgxMHYxMGgtMTB6TTcwLDUwaDEwdjEwaC0xMHpNMTAwLDUwaDEwdjEwaC0xMHpNMTMw' +
  'LDUwaDEwdjEwaC0xMHpNMTYwLDUwaDEwdjEwaC0xMHpNMTgwLDUwaDEwdjEwaC0xMHpNMTkwLDUwaDEwdjEwaC0xMHpNMjAwLDUwaDEwdjEwaC0xMHpNMjMw' +
  'LDUwaDEwdjEwaC0xMHpNMjUwLDUwaDEwdjEwaC0xMHpNMjYwLDUwaDEwdjEwaC0xMHpNMjcwLDUwaDEwdjEwaC0xMHpNMjkwLDUwaDEwdjEwaC0xMHpNMTAs' +
  'NjBoMTB2MTBoLTEwek03MCw2MGgxMHYxMGgtMTB6TTExMCw2MGgxMHYxMGgtMTB6TTEyMCw2MGgxMHYxMGgtMTB6TTEzMCw2MGgxMHYxMGgtMTB6TTE2MCw2' +
  'MGgxMHYxMGgtMTB6TTE5MCw2MGgxMHYxMGgtMTB6TTIwMCw2MGgxMHYxMGgtMTB6TTIxMCw2MGgxMHYxMGgtMTB6TTIzMCw2MGgxMHYxMGgtMTB6TTI5MCw2' +
  'MGgxMHYxMGgtMTB6TTEwLDcwaDEwdjEwaC0xMHpNMjAsNzBoMTB2MTBoLTEwek0zMCw3MGgxMHYxMGgtMTB6TTQwLDcwaDEwdjEwaC0xMHpNNTAsNzBoMTB2' +
  'MTBoLTEwek02MCw3MGgxMHYxMGgtMTB6TTcwLDcwaDEwdjEwaC0xMHpNOTAsNzBoMTB2MTBoLTEwek0xMTAsNzBoMTB2MTBoLTEwek0xMzAsNzBoMTB2MTBo' +
  'LTEwek0xNTAsNzBoMTB2MTBoLTEwek0xNzAsNzBoMTB2MTBoLTEwek0xOTAsNzBoMTB2MTBoLTEwek0yMTAsNzBoMTB2MTBoLTEwek0yMzAsNzBoMTB2MTBo' +
  'LTEwek0yNDAsNzBoMTB2MTBoLTEwek0yNTAsNzBoMTB2MTBoLTEwek0yNjAsNzBoMTB2MTBoLTEwek0yNzAsNzBoMTB2MTBoLTEwek0yODAsNzBoMTB2MTBo' +
  'LTEwek0yOTAsNzBoMTB2MTBoLTEwek05MCw4MGgxMHYxMGgtMTB6TTEyMCw4MGgxMHYxMGgtMTB6TTE0MCw4MGgxMHYxMGgtMTB6TTE1MCw4MGgxMHYxMGgt' +
  'MTB6TTE2MCw4MGgxMHYxMGgtMTB6TTE4MCw4MGgxMHYxMGgtMTB6TTE5MCw4MGgxMHYxMGgtMTB6TTIwMCw4MGgxMHYxMGgtMTB6TTEwLDkwaDEwdjEwaC0x' +
  'MHpNMjAsOTBoMTB2MTBoLTEwek0zMCw5MGgxMHYxMGgtMTB6TTUwLDkwaDEwdjEwaC0xMHpNNjAsOTBoMTB2MTBoLTEwek03MCw5MGgxMHYxMGgtMTB6TTgw' +
  'LDkwaDEwdjEwaC0xMHpNOTAsOTBoMTB2MTBoLTEwek0xMzAsOTBoMTB2MTBoLTEwek0xNDAsOTBoMTB2MTBoLTEwek0xODAsOTBoMTB2MTBoLTEwek0yMTAs' +
  'OTBoMTB2MTBoLTEwek0yMjAsOTBoMTB2MTBoLTEwek0yMzAsOTBoMTB2MTBoLTEwek0yNzAsOTBoMTB2MTBoLTEwek00MCwxMDBoMTB2MTBoLTEwek01MCwx' +
  'MDBoMTB2MTBoLTEwek0xMDAsMTAwaDEwdjEwaC0xMHpNMTIwLDEwMGgxMHYxMGgtMTB6TTEzMCwxMDBoMTB2MTBoLTEwek0xNDAsMTAwaDEwdjEwaC0xMHpN' +
  'MTUwLDEwMGgxMHYxMGgtMTB6TTE3MCwxMDBoMTB2MTBoLTEwek0xODAsMTAwaDEwdjEwaC0xMHpNMTkwLDEwMGgxMHYxMGgtMTB6TTIxMCwxMDBoMTB2MTBo' +
  'LTEwek0yMzAsMTAwaDEwdjEwaC0xMHpNMjYwLDEwMGgxMHYxMGgtMTB6TTI5MCwxMDBoMTB2MTBoLTEwek0zMCwxMTBoMTB2MTBoLTEwek01MCwxMTBoMTB2' +
  'MTBoLTEwek03MCwxMTBoMTB2MTBoLTEwek0xMTAsMTEwaDEwdjEwaC0xMHpNMTIwLDExMGgxMHYxMGgtMTB6TTEzMCwxMTBoMTB2MTBoLTEwek0xNTAsMTEw' +
  'aDEwdjEwaC0xMHpNMTgwLDExMGgxMHYxMGgtMTB6TTE5MCwxMTBoMTB2MTBoLTEwek0yMTAsMTEwaDEwdjEwaC0xMHpNMjIwLDExMGgxMHYxMGgtMTB6TTIz' +
  'MCwxMTBoMTB2MTBoLTEwek0yNTAsMTEwaDEwdjEwaC0xMHpNMjcwLDExMGgxMHYxMGgtMTB6TTI4MCwxMTBoMTB2MTBoLTEwek0yOTAsMTEwaDEwdjEwaC0x' +
  'MHpNMTAsMTIwaDEwdjEwaC0xMHpNMjAsMTIwaDEwdjEwaC0xMHpNNDAsMTIwaDEwdjEwaC0xMHpNNjAsMTIwaDEwdjEwaC0xMHpNMTAwLDEyMGgxMHYxMGgt' +
  'MTB6TTExMCwxMjBoMTB2MTBoLTEwek0xMzAsMTIwaDEwdjEwaC0xMHpNMTQwLDEyMGgxMHYxMGgtMTB6TTE1MCwxMjBoMTB2MTBoLTEwek0xNzAsMTIwaDEw' +
  'djEwaC0xMHpNMTgwLDEyMGgxMHYxMGgtMTB6TTIxMCwxMjBoMTB2MTBoLTEwek0yNDAsMTIwaDEwdjEwaC0xMHpNMjUwLDEyMGgxMHYxMGgtMTB6TTI4MCwx' +
  'MjBoMTB2MTBoLTEwek0zMCwxMzBoMTB2MTBoLTEwek00MCwxMzBoMTB2MTBoLTEwek01MCwxMzBoMTB2MTBoLTEwek02MCwxMzBoMTB2MTBoLTEwek03MCwx' +
  'MzBoMTB2MTBoLTEwek05MCwxMzBoMTB2MTBoLTEwek0xMTAsMTMwaDEwdjEwaC0xMHpNMTIwLDEzMGgxMHYxMGgtMTB6TTE0MCwxMzBoMTB2MTBoLTEwek0x' +
  'NjAsMTMwaDEwdjEwaC0xMHpNMTcwLDEzMGgxMHYxMGgtMTB6TTE4MCwxMzBoMTB2MTBoLTEwek0yMTAsMTMwaDEwdjEwaC0xMHpNMjIwLDEzMGgxMHYxMGgt' +
  'MTB6TTIzMCwxMzBoMTB2MTBoLTEwek0yNjAsMTMwaDEwdjEwaC0xMHpNMjgwLDEzMGgxMHYxMGgtMTB6TTI5MCwxMzBoMTB2MTBoLTEwek0yMCwxNDBoMTB2' +
  'MTBoLTEwek0zMCwxNDBoMTB2MTBoLTEwek04MCwxNDBoMTB2MTBoLTEwek05MCwxNDBoMTB2MTBoLTEwek0xMTAsMTQwaDEwdjEwaC0xMHpNMTIwLDE0MGgx' +
  'MHYxMGgtMTB6TTE0MCwxNDBoMTB2MTBoLTEwek0xNTAsMTQwaDEwdjEwaC0xMHpNMTYwLDE0MGgxMHYxMGgtMTB6TTE3MCwxNDBoMTB2MTBoLTEwek0xOTAs' +
  'MTQwaDEwdjEwaC0xMHpNMjAwLDE0MGgxMHYxMGgtMTB6TTIxMCwxNDBoMTB2MTBoLTEwek0yMjAsMTQwaDEwdjEwaC0xMHpNMjMwLDE0MGgxMHYxMGgtMTB6' +
  'TTI2MCwxNDBoMTB2MTBoLTEwek0yOTAsMTQwaDEwdjEwaC0xMHpNMTAsMTUwaDEwdjEwaC0xMHpNMjAsMTUwaDEwdjEwaC0xMHpNNDAsMTUwaDEwdjEwaC0x' +
  'MHpNNzAsMTUwaDEwdjEwaC0xMHpNOTAsMTUwaDEwdjEwaC0xMHpNMTAwLDE1MGgxMHYxMGgtMTB6TTE5MCwxNTBoMTB2MTBoLTEwek0yMzAsMTUwaDEwdjEw' +
  'aC0xMHpNMjUwLDE1MGgxMHYxMGgtMTB6TTI2MCwxNTBoMTB2MTBoLTEwek0yODAsMTUwaDEwdjEwaC0xMHpNMjkwLDE1MGgxMHYxMGgtMTB6TTEwLDE2MGgx' +
  'MHYxMGgtMTB6TTMwLDE2MGgxMHYxMGgtMTB6TTQwLDE2MGgxMHYxMGgtMTB6TTUwLDE2MGgxMHYxMGgtMTB6TTYwLDE2MGgxMHYxMGgtMTB6TTkwLDE2MGgx' +
  'MHYxMGgtMTB6TTEwMCwxNjBoMTB2MTBoLTEwek0xMjAsMTYwaDEwdjEwaC0xMHpNMTQwLDE2MGgxMHYxMGgtMTB6TTE1MCwxNjBoMTB2MTBoLTEwek0xNzAs' +
  'MTYwaDEwdjEwaC0xMHpNMTgwLDE2MGgxMHYxMGgtMTB6TTIxMCwxNjBoMTB2MTBoLTEwek0yMjAsMTYwaDEwdjEwaC0xMHpNMjMwLDE2MGgxMHYxMGgtMTB6' +
  'TTI2MCwxNjBoMTB2MTBoLTEwek0yODAsMTYwaDEwdjEwaC0xMHpNMjAsMTcwaDEwdjEwaC0xMHpNNDAsMTcwaDEwdjEwaC0xMHpNNjAsMTcwaDEwdjEwaC0x' +
  'MHpNNzAsMTcwaDEwdjEwaC0xMHpNMTEwLDE3MGgxMHYxMGgtMTB6TTEzMCwxNzBoMTB2MTBoLTEwek0xNDAsMTcwaDEwdjEwaC0xMHpNMTYwLDE3MGgxMHYx' +
  'MGgtMTB6TTE3MCwxNzBoMTB2MTBoLTEwek0yMDAsMTcwaDEwdjEwaC0xMHpNMjEwLDE3MGgxMHYxMGgtMTB6TTIzMCwxNzBoMTB2MTBoLTEwek0yNDAsMTcw' +
  'aDEwdjEwaC0xMHpNMjYwLDE3MGgxMHYxMGgtMTB6TTI4MCwxNzBoMTB2MTBoLTEwek0yOTAsMTcwaDEwdjEwaC0xMHpNMjAsMTgwaDEwdjEwaC0xMHpNNTAs' +
  'MTgwaDEwdjEwaC0xMHpNNjAsMTgwaDEwdjEwaC0xMHpNODAsMTgwaDEwdjEwaC0xMHpNOTAsMTgwaDEwdjEwaC0xMHpNMTIwLDE4MGgxMHYxMGgtMTB6TTEz' +
  'MCwxODBoMTB2MTBoLTEwek0xNDAsMTgwaDEwdjEwaC0xMHpNMjIwLDE4MGgxMHYxMGgtMTB6TTIzMCwxODBoMTB2MTBoLTEwek0yNjAsMTgwaDEwdjEwaC0x' +
  'MHpNMjcwLDE4MGgxMHYxMGgtMTB6TTI5MCwxODBoMTB2MTBoLTEwek0xMCwxOTBoMTB2MTBoLTEwek03MCwxOTBoMTB2MTBoLTEwek05MCwxOTBoMTB2MTBo' +
  'LTEwek0xMDAsMTkwaDEwdjEwaC0xMHpNMTIwLDE5MGgxMHYxMGgtMTB6TTEzMCwxOTBoMTB2MTBoLTEwek0xNTAsMTkwaDEwdjEwaC0xMHpNMTcwLDE5MGgx' +
  'MHYxMGgtMTB6TTIyMCwxOTBoMTB2MTBoLTEwek0yNDAsMTkwaDEwdjEwaC0xMHpNMjUwLDE5MGgxMHYxMGgtMTB6TTI4MCwxOTBoMTB2MTBoLTEwek0yOTAs' +
  'MTkwaDEwdjEwaC0xMHpNMjAsMjAwaDEwdjEwaC0xMHpNMzAsMjAwaDEwdjEwaC0xMHpNNDAsMjAwaDEwdjEwaC0xMHpNNTAsMjAwaDEwdjEwaC0xMHpNMTAw' +
  'LDIwMGgxMHYxMGgtMTB6TTExMCwyMDBoMTB2MTBoLTEwek0xMzAsMjAwaDEwdjEwaC0xMHpNMTQwLDIwMGgxMHYxMGgtMTB6TTE1MCwyMDBoMTB2MTBoLTEw' +
  'ek0xNjAsMjAwaDEwdjEwaC0xMHpNMTgwLDIwMGgxMHYxMGgtMTB6TTE5MCwyMDBoMTB2MTBoLTEwek0yMDAsMjAwaDEwdjEwaC0xMHpNMjEwLDIwMGgxMHYx' +
  'MGgtMTB6TTIyMCwyMDBoMTB2MTBoLTEwek0yMzAsMjAwaDEwdjEwaC0xMHpNMjQwLDIwMGgxMHYxMGgtMTB6TTI1MCwyMDBoMTB2MTBoLTEwek0yNjAsMjAw' +
  'aDEwdjEwaC0xMHpNMjgwLDIwMGgxMHYxMGgtMTB6TTEwLDIxMGgxMHYxMGgtMTB6TTQwLDIxMGgxMHYxMGgtMTB6TTcwLDIxMGgxMHYxMGgtMTB6TTgwLDIx' +
  'MGgxMHYxMGgtMTB6TTkwLDIxMGgxMHYxMGgtMTB6TTEwMCwyMTBoMTB2MTBoLTEwek0xMTAsMjEwaDEwdjEwaC0xMHpNMTIwLDIxMGgxMHYxMGgtMTB6TTE0' +
  'MCwyMTBoMTB2MTBoLTEwek0xNjAsMjEwaDEwdjEwaC0xMHpNMTcwLDIxMGgxMHYxMGgtMTB6TTE4MCwyMTBoMTB2MTBoLTEwek0yMDAsMjEwaDEwdjEwaC0x' +
  'MHpNMjEwLDIxMGgxMHYxMGgtMTB6TTIyMCwyMTBoMTB2MTBoLTEwek0yMzAsMjEwaDEwdjEwaC0xMHpNMjQwLDIxMGgxMHYxMGgtMTB6TTI1MCwyMTBoMTB2' +
  'MTBoLTEwek05MCwyMjBoMTB2MTBoLTEwek0xMTAsMjIwaDEwdjEwaC0xMHpNMTIwLDIyMGgxMHYxMGgtMTB6TTE0MCwyMjBoMTB2MTBoLTEwek0xNTAsMjIw' +
  'aDEwdjEwaC0xMHpNMTcwLDIyMGgxMHYxMGgtMTB6TTE4MCwyMjBoMTB2MTBoLTEwek0yMDAsMjIwaDEwdjEwaC0xMHpNMjEwLDIyMGgxMHYxMGgtMTB6TTI1' +
  'MCwyMjBoMTB2MTBoLTEwek0yNzAsMjIwaDEwdjEwaC0xMHpNMjgwLDIyMGgxMHYxMGgtMTB6TTI5MCwyMjBoMTB2MTBoLTEwek0xMCwyMzBoMTB2MTBoLTEw' +
  'ek0yMCwyMzBoMTB2MTBoLTEwek0zMCwyMzBoMTB2MTBoLTEwek00MCwyMzBoMTB2MTBoLTEwek01MCwyMzBoMTB2MTBoLTEwek02MCwyMzBoMTB2MTBoLTEw' +
  'ek03MCwyMzBoMTB2MTBoLTEwek05MCwyMzBoMTB2MTBoLTEwek0xMDAsMjMwaDEwdjEwaC0xMHpNMTEwLDIzMGgxMHYxMGgtMTB6TTE0MCwyMzBoMTB2MTBo' +
  'LTEwek0yMDAsMjMwaDEwdjEwaC0xMHpNMjEwLDIzMGgxMHYxMGgtMTB6TTIzMCwyMzBoMTB2MTBoLTEwek0yNTAsMjMwaDEwdjEwaC0xMHpNMjYwLDIzMGgx' +
  'MHYxMGgtMTB6TTI4MCwyMzBoMTB2MTBoLTEwek0yOTAsMjMwaDEwdjEwaC0xMHpNMTAsMjQwaDEwdjEwaC0xMHpNNzAsMjQwaDEwdjEwaC0xMHpNOTAsMjQw' +
  'aDEwdjEwaC0xMHpNMTAwLDI0MGgxMHYxMGgtMTB6TTEyMCwyNDBoMTB2MTBoLTEwek0xNDAsMjQwaDEwdjEwaC0xMHpNMTUwLDI0MGgxMHYxMGgtMTB6TTE4' +
  'MCwyNDBoMTB2MTBoLTEwek0xOTAsMjQwaDEwdjEwaC0xMHpNMjEwLDI0MGgxMHYxMGgtMTB6TTI1MCwyNDBoMTB2MTBoLTEwek0yNjAsMjQwaDEwdjEwaC0x' +
  'MHpNMjkwLDI0MGgxMHYxMGgtMTB6TTEwLDI1MGgxMHYxMGgtMTB6TTMwLDI1MGgxMHYxMGgtMTB6TTQwLDI1MGgxMHYxMGgtMTB6TTUwLDI1MGgxMHYxMGgt' +
  'MTB6TTcwLDI1MGgxMHYxMGgtMTB6TTkwLDI1MGgxMHYxMGgtMTB6TTEwMCwyNTBoMTB2MTBoLTEwek0xMTAsMjUwaDEwdjEwaC0xMHpNMTMwLDI1MGgxMHYx' +
  'MGgtMTB6TTE0MCwyNTBoMTB2MTBoLTEwek0xNzAsMjUwaDEwdjEwaC0xMHpNMTgwLDI1MGgxMHYxMGgtMTB6TTIxMCwyNTBoMTB2MTBoLTEwek0yMjAsMjUw' +
  'aDEwdjEwaC0xMHpNMjMwLDI1MGgxMHYxMGgtMTB6TTI0MCwyNTBoMTB2MTBoLTEwek0yNTAsMjUwaDEwdjEwaC0xMHpNMTAsMjYwaDEwdjEwaC0xMHpNMzAs' +
  'MjYwaDEwdjEwaC0xMHpNNDAsMjYwaDEwdjEwaC0xMHpNNTAsMjYwaDEwdjEwaC0xMHpNNzAsMjYwaDEwdjEwaC0xMHpNMTAwLDI2MGgxMHYxMGgtMTB6TTEx' +
  'MCwyNjBoMTB2MTBoLTEwek0xMjAsMjYwaDEwdjEwaC0xMHpNMTMwLDI2MGgxMHYxMGgtMTB6TTE3MCwyNjBoMTB2MTBoLTEwek0yMTAsMjYwaDEwdjEwaC0x' +
  'MHpNMjQwLDI2MGgxMHYxMGgtMTB6TTI1MCwyNjBoMTB2MTBoLTEwek0yNzAsMjYwaDEwdjEwaC0xMHpNMjgwLDI2MGgxMHYxMGgtMTB6TTI5MCwyNjBoMTB2' +
  'MTBoLTEwek0xMCwyNzBoMTB2MTBoLTEwek0zMCwyNzBoMTB2MTBoLTEwek00MCwyNzBoMTB2MTBoLTEwek01MCwyNzBoMTB2MTBoLTEwek03MCwyNzBoMTB2' +
  'MTBoLTEwek05MCwyNzBoMTB2MTBoLTEwek0xMjAsMjcwaDEwdjEwaC0xMHpNMTMwLDI3MGgxMHYxMGgtMTB6TTE0MCwyNzBoMTB2MTBoLTEwek0xNTAsMjcw' +
  'aDEwdjEwaC0xMHpNMTgwLDI3MGgxMHYxMGgtMTB6TTIwMCwyNzBoMTB2MTBoLTEwek0yNDAsMjcwaDEwdjEwaC0xMHpNMjUwLDI3MGgxMHYxMGgtMTB6TTI2' +
  'MCwyNzBoMTB2MTBoLTEwek0yOTAsMjcwaDEwdjEwaC0xMHpNMTAsMjgwaDEwdjEwaC0xMHpNNzAsMjgwaDEwdjEwaC0xMHpNOTAsMjgwaDEwdjEwaC0xMHpN' +
  'MTEwLDI4MGgxMHYxMGgtMTB6TTEzMCwyODBoMTB2MTBoLTEwek0xNDAsMjgwaDEwdjEwaC0xMHpNMTUwLDI4MGgxMHYxMGgtMTB6TTE4MCwyODBoMTB2MTBo' +
  'LTEwek0yMDAsMjgwaDEwdjEwaC0xMHpNMjEwLDI4MGgxMHYxMGgtMTB6TTIyMCwyODBoMTB2MTBoLTEwek0yNTAsMjgwaDEwdjEwaC0xMHpNMjgwLDI4MGgx' +
  'MHYxMGgtMTB6TTEwLDI5MGgxMHYxMGgtMTB6TTIwLDI5MGgxMHYxMGgtMTB6TTMwLDI5MGgxMHYxMGgtMTB6TTQwLDI5MGgxMHYxMGgtMTB6TTUwLDI5MGgx' +
  'MHYxMGgtMTB6TTYwLDI5MGgxMHYxMGgtMTB6TTcwLDI5MGgxMHYxMGgtMTB6TTkwLDI5MGgxMHYxMGgtMTB6TTEyMCwyOTBoMTB2MTBoLTEwek0xMzAsMjkw' +
  'aDEwdjEwaC0xMHpNMTUwLDI5MGgxMHYxMGgtMTB6TTE4MCwyOTBoMTB2MTBoLTEwek0yMDAsMjkwaDEwdjEwaC0xMHpNMjEwLDI5MGgxMHYxMGgtMTB6TTIy' +
  'MCwyOTBoMTB2MTBoLTEwek0yNDAsMjkwaDEwdjEwaC0xMHpNMjUwLDI5MGgxMHYxMGgtMTB6TTI4MCwyOTBoMTB2MTBoLTEwek0yOTAsMjkwaDEwdjEwaC0x' +
  'MHoiLz48L3N2Zz4=';

const slides = [
  {
    id: 1,
    kicker: 'Open community briefing',
    title: 'OpenSquawk',
    subtitle: 'Community-built AI ATC for simulator pilots',
    body: ['Developer update — April 2025'],
    note: 'Nick Hartmann · Founder & Lead Developer',
    background: 'linear-gradient(135deg, #0f172a, #1d4ed8)'
  },
  {
    id: 2,
    title: "Hi, I'm Nick Hartmann",
    subtitle: 'Aviation software engineer & weekend simmer',
    bullets: [
      'Founder of OpenSquawk, based in Berlin',
      '12 years building ATC training, speech tech, and pilot tools',
      'Instrument-rated private pilot; real-world flying informs the product',
      'Previously led simulation tooling at FlightOps Labs'
    ],
    note: 'nick@opensquawk.dev · @nickcodesplanes',
    background: 'linear-gradient(135deg, #1e3a8a, #6366f1)'
  },
  {
    id: 3,
    title: 'Flight plan for the next 45 minutes',
    bullets: [
      'Set the scene: why OpenSquawk exists',
      'Share the vision and what is already live today',
      'Dive into the architecture and technology choices',
      'Walk through the roadmap and community priorities',
      'Open conversation: feedback on launching this first open-source repo'
    ],
    background: 'linear-gradient(135deg, #312e81, #7c3aed)'
  },
  {
    id: 4,
    title: 'Where the idea sparked',
    bullets: [
      'Late-night VATSIM and IVAO sessions with my club in Microsoft Flight Simulator',
      'Juggling PDF phraseology, Discord briefs, and checklist add-ons mid-flight',
      'Watching new pilots freeze because practice scenarios were hard to access'
    ],
    background: 'linear-gradient(135deg, #0f172a, #334155)'
  },
  {
    id: 5,
    title: 'Pain points I kept running into',
    bullets: [
      'Commercial AI ATC solutions start at €35/month and lock data behind paywalls',
      'No way to tailor phraseology or local procedures to German training needs',
      'Training content, speech synthesis, and analytics sat in disconnected silos',
      'Clubs I mentor lacked budget to give students consistent ATC coaching'
    ],
    background: 'linear-gradient(135deg, #1f2937, #0ea5e9)'
  },
  {
    id: 6,
    title: 'From frustration to prototype',
    bullets: [
      '2023: Threw together a Node + GPT experiment for pattern work callouts',
      'Built an internal script tool so club mentors could create traffic scenarios',
      'Interest snowballed; rewrote as a Nuxt single-page app over winter 2024',
      'Decided openness mattered more than polish—time to invite more builders'
    ],
    background: 'linear-gradient(135deg, #082f49, #0ea5e9)'
  },
  {
    id: 7,
    title: 'Vision: adaptive ATC that belongs to the community',
    bullets: [
      'Blend simulator telemetry, AI controllers, and curated lesson design',
      'Keep core logic transparent so pilots can audit phraseology and logic',
      'Enable local airports to plug in their procedures, voices, and weather rules',
      'Ship a browser-first experience that can fall back to self-hosted speech'
    ],
    background: 'linear-gradient(135deg, #0f172a, #15803d)'
  },
  {
    id: 8,
    title: 'What already works in OpenSquawk',
    bullets: [
      'Nuxt 4 SPA with Tailwind and Vuetify theming for responsive training flows',
      'Node.js services orchestrating ATC decision trees and runway logic',
      'OpenAI GPT + TTS with optional Piper stack for on-prem voice exchange',
      'MongoDB persistence for pilot profiles, lesson scoring, and feedback loops'
    ],
    background: 'linear-gradient(135deg, #1f2937, #16a34a)'
  },
  {
    id: 9,
    title: 'User journey today',
    columns: [
      {
        heading: 'Before departure',
        bullets: [
          'Choose a training route or create a custom scenario',
          'Review phraseology cards and short audio snippets',
          'Load the OpenSquawk overlay or external window'
        ]
      },
      {
        heading: 'In-flight & debrief',
        bullets: [
          'Live ATC agent adapts to your clearances and deviations',
          'Speech is synthesized in real time with hold-short logic',
          'Post-flight report scores calls, timing, and read-back accuracy'
        ]
      }
    ],
    background: 'linear-gradient(135deg, #0f172a, #7c3aed)'
  },
  {
    id: 10,
    title: 'High-level architecture',
    bullets: [
      'Nuxt SPA consumes typed APIs via $fetch with optimistic UI states',
      'Server routes orchestrate scenario state machines and slot scheduling',
      'Shared TypeScript models keep ATC logic consistent client ↔ server',
      'Audio workers push WAV/OGG buffers; browser streams via Web Audio'
    ],
    background: 'linear-gradient(135deg, #1e293b, #2563eb)'
  },
  {
    id: 11,
    title: 'Core technologies under the hood',
    bullets: [
      'Nuxt 4 (Vite) + Tailwind + Vuetify: hybrid design system, SSR disabled for SPA feel',
      'Pinia stores coordinate session state, timeline events, and caching',
      'MongoDB 7 with Zod-validated schemas and TTL collections for audio',
      'OpenAI responses streamed via Server-Sent Events for low latency handoffs'
    ],
    background: 'linear-gradient(135deg, #020617, #4338ca)'
  },
  {
    id: 12,
    title: 'Inside the ATC brain',
    bullets: [
      'Decision trees authored in YAML compile to deterministic state machines',
      'LLM prompts augment rule-based flows for edge-case phraseology',
      'Weather + NOTAM services inject live runway configuration constraints',
      'Safety net: fallback canned phrases keep calls consistent when LLM hesitates'
    ],
    background: 'linear-gradient(135deg, #0f172a, #fb7185)'
  },
  {
    id: 13,
    title: 'Speech & audio pipeline',
    bullets: [
      'Client records pilot mic locally; energy-based VAD trims silence',
      'Audio hits a Fastify endpoint for speech-to-text and intent parsing',
      'Controllers respond via OpenAI or Piper TTS, streamed chunk-by-chunk',
      'Browser Web Audio layers sidetone and ambient ATIS loops'
    ],
    background: 'linear-gradient(135deg, #1f2937, #f97316)'
  },
  {
    id: 14,
    title: 'Learning experience design',
    bullets: [
      'Scenario templates cover VFR circuits, IFR arrivals, emergencies',
      'Microlearning cards appear contextually when you stumble',
      'Instructors can annotate flights and pin audio moments for review',
      'Gamified streaks nudge regular practice without feeling arcadey'
    ],
    background: 'linear-gradient(135deg, #111827, #db2777)'
  },
  {
    id: 15,
    title: 'Simulator integrations on deck',
    bullets: [
      'MSFS bridge via SimConnect sending position, speed, flight phase',
      'X-Plane UDP listener planned for late summer with plug-in sandbox',
      'SimBrief import for route, payload, and weather briefing alignment',
      'Exploring VATSIM data sync once licensing questions settle'
    ],
    background: 'linear-gradient(135deg, #1e1b4b, #0ea5e9)'
  },
  {
    id: 16,
    title: 'Roadmap: next 6 months',
    bullets: [
      'May–June: stabilize API auth, document deployment, add Docker examples',
      'July: release community scenario editor with YAML linting and previews',
      'August: deliver first MSFS bridge alpha and telemetry recording',
      'September: launch open beta with feedback-driven tuning sprints'
    ],
    background: 'linear-gradient(135deg, #0f172a, #22c55e)'
  },
  {
    id: 17,
    title: 'Readiness checklist & metrics',
    bullets: [
      'Current repo: 48 open issues, 12 tagged "good first issue"',
      'Core uptime goal: 99.5% for hosted reference deployment',
      'Targeting <600 ms end-to-end call-and-response latency',
      'Compliance work: GDPR-ready data retention policy drafted'
    ],
    background: 'linear-gradient(135deg, #0f172a, #60a5fa)'
  },
  {
    id: 18,
    title: 'Opening the hangar doors',
    bullets: [
      'This is my first open-source repo launch after years in closed tooling',
      'Docs, issues, and architecture notes live directly in the repository',
      'Actively looking for maintainers to own modules (speech, UI, ops)',
      'Transparent funding: donations cover infra; all features stay open core'
    ],
    background: 'linear-gradient(135deg, #1e293b, #a855f7)'
  },
  {
    id: 19,
    title: 'What I would love feedback on',
    bullets: [
      'Is the contributor experience welcoming enough for first-timers?',
      'Does the decision-tree authoring flow make sense to you?',
      'How should we prioritise simulator bridge features vs. training content?',
      'Any lessons learned from your own open-source launches that I should heed?'
    ],
    background: 'linear-gradient(135deg, #0f172a, #6366f1)'
  },
  {
    id: 20,
    title: 'Ways to get involved today',
    bullets: [
      'Review the CONTRIBUTING draft and suggest gaps before we publish v1',
      'Try the lesson builder mockups and drop comments in GitHub Discussions',
      'Pair with me on setting up CI for Piper containers and OpenAI fallbacks',
      'Spread the word to flying clubs who need affordable ATC coaching'
    ],
    background: 'linear-gradient(135deg, #111827, #14b8a6)'
  },
  {
    id: 21,
    title: 'Thank you — let’s open the floor',
    subtitle: 'Questions, stories, concerns? I want to hear them.',
    body: [
      'Your feedback will shape how OpenSquawk grows and how we support contributors.'
    ],
    note: 'Slides will be published in the repo after the session.',
    background: 'linear-gradient(135deg, #0f172a, #facc15)'
  },
  {
    id: 22,
    title: 'Scan to join the project',
    subtitle: 'github.com/FaktorxMensch/OpenSquawk',
    body: ['Thank you for spending time with me today!'],
    qr: qrSvg,
    note: 'Let me know how your open-source journeys began — I’m all ears.',
    background: 'linear-gradient(135deg, #020617, #2563eb)'
  }
] as const;

const totalSlides = slides.length;
const currentIndex = ref(0);
const currentSlide = computed(() => slides[currentIndex.value]);

const progress = computed(() => ((currentIndex.value + 1) / totalSlides) * 100);

const touchStartX = ref<number | null>(null);

const deck = ref<HTMLElement | null>(null);

function nextSlide() {
  if (currentIndex.value < totalSlides - 1) {
    currentIndex.value += 1;
  }
}

function prevSlide() {
  if (currentIndex.value > 0) {
    currentIndex.value -= 1;
  }
}

function onKeyDown(event: KeyboardEvent) {
  if (event.key === 'ArrowRight' || event.key === ' ') {
    event.preventDefault();
    nextSlide();
  }
  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    prevSlide();
  }
}

function onTouchStart(event: TouchEvent) {
  touchStartX.value = event.changedTouches[0].clientX;
}

function onTouchEnd(event: TouchEvent) {
  if (touchStartX.value === null) {
    return;
  }
  const delta = event.changedTouches[0].clientX - touchStartX.value;
  if (Math.abs(delta) > 50) {
    if (delta < 0) {
      nextSlide();
    } else {
      prevSlide();
    }
  }
  touchStartX.value = null;
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown);
  nextTick(() => {
    deck.value?.focus();
  });
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown);
});
</script>

<style scoped>
.presentation {
  width: 100vw;
  height: 100vh;
  background: radial-gradient(circle at top left, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.85));
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  color: #f8fafc;
  font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
  padding: 1.5rem;
  box-sizing: border-box;
}

.slide {
  width: min(90vw, 90vh * (16 / 9));
  aspect-ratio: 16 / 9;
  border-radius: 1.5rem;
  padding: min(5vh, 4rem);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 25px 60px rgba(15, 23, 42, 0.45);
  color: inherit;
}

.slide-inner {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.kicker {
  text-transform: uppercase;
  letter-spacing: 0.35em;
  font-size: 0.85rem;
  opacity: 0.85;
}

.title {
  font-size: clamp(2.4rem, 3.2vw + 1rem, 4.4rem);
  font-weight: 700;
  line-height: 1.05;
}

.subtitle {
  font-size: clamp(1.2rem, 1.4vw + 0.8rem, 1.9rem);
  opacity: 0.92;
  max-width: 28ch;
}

.body p {
  font-size: clamp(1.05rem, 1.1vw + 0.75rem, 1.6rem);
  line-height: 1.5;
  max-width: 60ch;
}

.bullets {
  display: grid;
  gap: 0.75rem;
  padding-left: 1.2rem;
  margin: 0;
  font-size: clamp(1.05rem, 1.1vw + 0.75rem, 1.6rem);
}

.bullets li {
  line-height: 1.45;
}

.columns {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.column h2 {
  font-size: clamp(1.2rem, 1.3vw + 0.8rem, 2rem);
  margin-bottom: 0.75rem;
}

.column ul {
  padding-left: 1.2rem;
  display: grid;
  gap: 0.6rem;
  font-size: clamp(1.05rem, 1.05vw + 0.7rem, 1.5rem);
}

.quote {
  font-size: clamp(1.2rem, 1.3vw + 0.8rem, 1.8rem);
  line-height: 1.5;
  max-width: 50ch;
  font-style: italic;
}

.quote footer {
  margin-top: 0.75rem;
  font-size: 0.95rem;
  opacity: 0.8;
}

.note {
  margin-top: auto;
  font-size: 0.95rem;
  opacity: 0.8;
}

.qr {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.qr img {
  width: min(220px, 25vh);
  height: auto;
  border-radius: 1rem;
  background: #fff;
  padding: 1rem;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.35);
}

.hud {
  position: absolute;
  inset: auto 0 1.5rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: rgba(226, 232, 240, 0.85);
  font-size: 0.95rem;
}

.progress {
  width: min(420px, 60vw);
  height: 6px;
  background: rgba(148, 163, 184, 0.35);
  border-radius: 999px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #38bdf8, #a855f7);
  transition: width 260ms ease;
}

.progress-label {
  font-weight: 600;
  letter-spacing: 0.08em;
}

.hint {
  font-size: 0.85rem;
  letter-spacing: 0.05em;
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: opacity 200ms ease, transform 250ms ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(18px) scale(0.99);
}

@media (max-width: 768px) {
  .slide {
    width: 100%;
    height: 100%;
    border-radius: 0;
    padding: 2.5rem 1.75rem;
  }

  .presentation {
    padding: 0;
  }

  .hud {
    bottom: 1rem;
  }
}
</style>
