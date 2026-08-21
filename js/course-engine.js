/**
 * Course Engine — Interactive Segmented Learning
 * Handles segments, quizzes, flashcards, progress tracking
 * v6 — Pass threshold: 80%
 */
(function() {
  'use strict';

  window.CourseEngine = {
    courseId: '',
    totalSegments: 0,
    currentSegment: 0,
    storageKey: '',

    init(courseId, segments) {
      this.courseId = courseId;
      this.segments = segments;
      this.totalSegments = segments.length;
      this.storageKey = `course_${courseId}_progress`;
      this.loadProgress();
      this.renderSidebar();
      this.renderSegment(this.currentSegment);
      this.updateOverallProgress();
    },

    loadProgress() {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        try {
          const data = JSON.parse(saved);
          this.currentSegment = Math.min(data.currentSegment || 0, this.totalSegments - 1);
          this.segmentStates = data.segmentStates || this.makeEmptyStates();
        } catch (e) {
          this.segmentStates = this.makeEmptyStates();
        }
      } else {
        this.segmentStates = this.makeEmptyStates();
      }
    },

    makeEmptyStates() {
      return this.segments.map((s, i) => ({
        unlocked: i === 0,
        completed: false,
        quizPassed: false,
        quizBestScore: 0,
        flashcardsSeen: false
      }));
    },

    saveProgress() {
      localStorage.setItem(this.storageKey, JSON.stringify({
        currentSegment: this.currentSegment,
        segmentStates: this.segmentStates
      }));
      this.updateOverallProgress();
      this.renderSidebar();
    },

    updateOverallProgress() {
      const completed = this.segmentStates.filter(s => s.completed).length;
      const pct = Math.round((completed / this.totalSegments) * 100);
      const bar = document.getElementById('overall-progress');
      if (bar) bar.style.width = pct + '%';
      const text = document.getElementById('overall-progress-text');
      if (text) text.textContent = `${completed}/${this.totalSegments} segments`;
      if (pct === 100) {
        localStorage.setItem(`course_${this.courseId}_completed`, 'true');
      }
    },

    renderSidebar() {
      const nav = document.getElementById('segment-nav');
      if (!nav) return;
      nav.innerHTML = '';
      this.segments.forEach((seg, i) => {
        const state = this.segmentStates[i];
        const div = document.createElement('div');
        div.className = 'nav-item';
        if (i === this.currentSegment) div.classList.add('active');
        if (state.completed) div.classList.add('completed');
        if (!state.unlocked) div.classList.add('locked');
        div.innerHTML = `
          <span class="nav-num">${state.completed ? '✓' : i + 1}</span>
          <span class="nav-title">${seg.title}</span>
          ${!state.unlocked ? '<span class="nav-lock">🔒</span>' : ''}
        `;
        if (state.unlocked) {
          div.onclick = () => { this.currentSegment = i; this.renderSegment(i); this.renderSidebar(); };
        }
        nav.appendChild(div);
      });
    },

    renderSegment(idx) {
      const container = document.getElementById('segment-content');
      if (!container) return;
      if (idx < 0 || idx >= this.totalSegments) { idx = 0; this.currentSegment = 0; }
      const seg = this.segments[idx];
      if (!seg) return;
      const state = this.segmentStates[idx];

      let html = `<div class="segment-header"><span class="seg-num">Segment ${idx+1} of ${this.totalSegments}</span><h2>${seg.title}</h2></div>`;
      html += `<div class="segment-body">${seg.content}</div>`;

      if (seg.flashcards && seg.flashcards.length > 0) {
        html += '<div class="flashcard-section"><h4>🃏 Flashcards</h4>';
        seg.flashcards.forEach((fc, i) => {
          html += `
            <div class="flashcard" id="fc-${i}">
              <div class="flashcard-front" onclick="CourseEngine.flipCard(${i})">
                <p>${fc.q}</p>
                <small>Click to reveal</small>
              </div>
              <div class="flashcard-back" style="display:none">
                <p>${fc.a}</p>
              </div>
            </div>`;
        });
        html += '</div>';
      }

      if (seg.quiz && seg.quiz.length > 0) {
        if (state.quizPassed) {
          html += `<div class="quiz-section passed">
            <h4>✅ Quiz Passed (${state.quizBestScore}/${seg.quiz.length})</h4>
            <p>You can proceed to the next segment.</p>
          </div>`;
        } else {
          html += '<div class="quiz-section"><h4>📝 Quiz</h4><p>Score at least 80% to unlock the next segment.</p>';
          seg.quiz.forEach((q, i) => {
            html += `<div class="quiz-q" id="qq-${i}"><p><strong>Q${i+1}:</strong> ${q.q}</p>`;
            q.options.forEach((opt, j) => {
              html += `<label class="quiz-opt"><input type="radio" name="q${i}" value="${j}"> ${opt}</label>`;
            });
            html += '</div>';
          });
          html += `<button class="btn btn-primary" onclick="CourseEngine.submitQuiz(${idx})">Submit Quiz</button>`;
          html += '<div id="quiz-result" style="margin-top:16px;font-weight:600;"></div>';
          html += '</div>';
        }
      }

      if (!seg.quiz && seg.interaction) {
        if (state.completed) {
          html += `<div class="interaction-completed"><h4>✅ Completed</h4><p>${seg.interaction.completedText || 'You can proceed to the next segment.'}</p></div>`;
        } else {
          html += `<div class="interaction-section"><h4>✏️ ${seg.interaction.title || 'Activity'}</h4>`;
          html += `<p>${seg.interaction.instruction || seg.interaction.prompt || 'Complete the activity below to proceed.'}</p>`;
          if (seg.interaction.type === 'textarea') {
            html += `<textarea id="interaction-input" rows="4" style="width:100%;padding:12px;border-radius:8px;border:1px solid #e2e8f0;margin-top:8px;" placeholder="${seg.interaction.placeholder || 'Type your answer here...'}"></textarea>`;
          } else if (seg.interaction.type === 'checkbox') {
            seg.interaction.options.forEach((opt, j) => {
              html += `<label style="display:block;margin:8px 0;"><input type="checkbox" value="${j}"> ${opt}</label>`;
            });
          }
          html += `<button class="btn btn-primary" style="margin-top:12px;" onclick="CourseEngine.submitInteraction(${idx})">Submit</button>`;
          html += '<div id="interaction-result" style="margin-top:12px;"></div>';
          html += '</div>';
        }
      }

      if (!seg.quiz && !seg.interaction) {
        if (!state.completed) {
          html += `<div class="interaction-section" style="margin-top:24px;padding:20px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;"><h4>✅ Mark Complete</h4><p>Read through this segment, then click below to mark it complete and unlock the next segment.</p><button class="btn btn-primary" style="margin-top:12px;" onclick="CourseEngine.markSegmentComplete(${idx})">I've read this segment — Mark Complete</button></div>`;
        }
      }

      html += '<div class="segment-nav-buttons">';
      if (idx > 0) {
        html += `<button class="btn btn-outline" onclick="CourseEngine.goTo(${idx-1})">← Previous</button>`;
      } else {
        html += '<span></span>';
      }
      if (state.completed) {
        if (idx < this.totalSegments - 1) {
          html += `<button class="btn btn-primary" onclick="CourseEngine.goTo(${idx+1})">Next →</button>`;
        } else {
          html += `<a href="course-complete.html?course=${encodeURIComponent(this.courseId)}&segments=${this.totalSegments}&quizzes=${this.countQuizzes()}" class="btn btn-primary">Finish Course →</a>`;
        }
      } else {
        if (idx < this.totalSegments - 1) {
          html += `<button class="btn btn-outline" disabled style="opacity:0.5">🔒 Complete this segment to continue</button>`;
        } else {
          html += `<button class="btn btn-outline" disabled style="opacity:0.5">🔒 Complete this segment to finish</button>`;
        }
      }
      html += '</div>';

      container.innerHTML = html;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.initMatchOS();
      this.initDragDropSort();
    },

    flipCard(i) {
      const fc = document.getElementById(`fc-${i}`);
      const front = fc.querySelector('.flashcard-front');
      const back = fc.querySelector('.flashcard-back');
      if (back.style.display === 'none') {
        front.style.display = 'none';
        back.style.display = 'block';
      } else {
        front.style.display = 'block';
        back.style.display = 'none';
      }
    },

    submitQuiz(segIdx) {
      const seg = this.segments[segIdx];
      let score = 0;
      seg.quiz.forEach((q, i) => {
        const selected = document.querySelector(`input[name="q${i}"]:checked`);
        const qDiv = document.getElementById(`qq-${i}`);
        if (selected && parseInt(selected.value) === q.correct) {
          score++;
          qDiv.style.background = '#d1fae5';
        } else {
          qDiv.style.background = '#fee2e2';
        }
      });

      const pct = (score / seg.quiz.length) * 100;
      const resultDiv = document.getElementById('quiz-result');
      const passThreshold = seg.passThreshold || 70;

      if (pct >= passThreshold) {
        const feedback = this.buildFeedback(score, seg.quiz.length, seg.title);
        resultDiv.innerHTML = feedback;
        this.segmentStates[segIdx].quizPassed = true;
        this.segmentStates[segIdx].completed = true;
        this.segmentStates[segIdx].quizBestScore = Math.max(this.segmentStates[segIdx].quizBestScore, score);
        if (segIdx < this.totalSegments - 1) {
          this.segmentStates[segIdx + 1].unlocked = true;
        }
        this.saveProgress();
        const delay = 2500;
        if (segIdx < this.totalSegments - 1) {
          setTimeout(() => this.goTo(segIdx + 1), delay);
        } else {
          setTimeout(() => this.renderSegment(segIdx), delay);
        }
      } else {
        resultDiv.innerHTML = `<span style="color:#991b1b">❌ Failed. ${score}/${seg.quiz.length} (${Math.round(pct)}%). Need ${passThreshold}% to pass. Try again!</span>`;
        this.segmentStates[segIdx].quizBestScore = Math.max(this.segmentStates[segIdx].quizBestScore, score);
        this.saveProgress();
      }
    },

    submitInteraction(segIdx) {
      const seg = this.segments[segIdx];
      const input = document.getElementById('interaction-input');
      const resultDiv = document.getElementById('interaction-result');
      let valid = true;

      if (seg.interaction.type === 'textarea') {
        if (!input || input.value.trim().length < (seg.interaction.minLength || 10)) {
          valid = false;
          resultDiv.innerHTML = `<span style="color:#92400e">Please write at least ${seg.interaction.minLength || 10} characters.</span>`;
        }
      } else if (seg.interaction.type === 'checkbox') {
        const checked = Array.from(document.querySelectorAll('.interaction-section input[type="checkbox"]:checked')).map(cb => parseInt(cb.value));
        if (checked.length === 0) {
          valid = false;
          resultDiv.innerHTML = '<span style="color:#92400e">Please select at least one option.</span>';
        } else if (seg.interaction.correctIndices) {
          const correct = seg.interaction.correctIndices;
          const allCorrect = correct.every(idx => checked.includes(idx)) && checked.every(idx => correct.includes(idx));
          if (!allCorrect) {
            valid = false;
            resultDiv.innerHTML = '<span style="color:#991b1b">❌ Not quite. Review the scenario and try again.</span>';
          }
        }
      }

      if (valid) {
        resultDiv.innerHTML = '<span style="color:#065f46">✅ Completed! You can proceed.</span>';
        this.segmentStates[segIdx].completed = true;
        if (segIdx < this.totalSegments - 1) {
          this.segmentStates[segIdx + 1].unlocked = true;
        }
        this.saveProgress();
        if (segIdx < this.totalSegments - 1) {
          setTimeout(() => this.goTo(segIdx + 1), 1200);
        } else {
          setTimeout(() => this.renderSegment(segIdx), 1200);
        }
      }
    },

    buildFeedback(score, total, title) {
      const pct = Math.round((score / total) * 100);
      let msg = '';
      if (pct === 100) {
        msg = `Perfect score! You absolutely nailed <strong>${title}</strong>. The Zetrix Avatar is impressed — you're building a rock-solid foundation for your one-person company.`;
      } else if (pct >= 80) {
        msg = `Great work on <strong>${title}</strong>! You scored <strong>${score}/${total}</strong>. A couple of gaps to tighten up, but you're clearly getting the hang of this. The Avatar sees strong progress.`;
      } else {
        msg = `You passed <strong>${title}</strong> with <strong>${score}/${total}</strong>. The Zetrix Avatar suggests revisiting the key concepts — small tweaks now will save hours later.`;
      }
      return `
        <div style="background:linear-gradient(135deg,#dcfce7 0%,#d1fae5 100%);border:1px solid #86efac;border-radius:16px;padding:20px;margin-top:12px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
            <span style="font-size:1.5rem;">🤖</span>
            <strong style="color:#065f46;font-size:1.05rem;">Zetrix Avatar Feedback</strong>
          </div>
          <p style="color:#065f46;margin:0;line-height:1.6;">${msg}</p>
          <div style="margin-top:12px;padding-top:12px;border-top:1px solid #86efac;">
            <small style="color:#15803d;">✅ Quiz Passed — moving you to the next segment...</small>
          </div>
        </div>`;
    },

    markSegmentComplete(segIdx) {
      this.segmentStates[segIdx].completed = true;
      if (segIdx < this.totalSegments - 1) {
        this.segmentStates[segIdx + 1].unlocked = true;
        this.currentSegment = segIdx + 1;
      }
      this.saveProgress();
      if (segIdx < this.totalSegments - 1) {
        this.renderSegment(segIdx + 1);
      } else {
        this.renderSegment(segIdx);
      }
    },

    goTo(idx) {
      this.currentSegment = idx;
      this.renderSegment(idx);
      this.renderSidebar();
    },

    countQuizzes() {
      return this.segments.filter(s => s.quiz && s.quiz.length > 0).length;
    },

    initMatchOS() {
      const items = document.querySelectorAll('#match-os .match-item');
      const targets = document.querySelectorAll('#match-os .match-target');
      const result = document.getElementById('match-os-result');
      if (!items.length || !targets.length) return;
      let selected = null, correct = 0, total = items.length;
      items.forEach(it => {
        it.addEventListener('click', function() {
          if (this.style.pointerEvents === 'none') return;
          items.forEach(x => { if (x.style.pointerEvents !== 'none') x.style.background = ''; });
          selected = this;
          this.style.background = '#e0f0ff';
        });
      });
      targets.forEach(tg => {
        tg.addEventListener('click', function() {
          if (!selected || this.style.pointerEvents === 'none') return;
          if (selected.dataset.key === this.dataset.key) {
            this.style.background = '#d4edda';
            selected.style.background = '#d4edda';
            this.style.pointerEvents = 'none';
            selected.style.pointerEvents = 'none';
            this.style.textDecoration = 'line-through';
            selected.style.textDecoration = 'line-through';
            this.style.opacity = '0.6';
            selected.style.opacity = '0.6';
            this.insertBefore(document.createTextNode('✓ '), this.firstChild);
            selected.insertBefore(document.createTextNode('✓ '), selected.firstChild);
            correct++;
          } else {
            this.style.background = '#f8d7da';
            setTimeout(() => { if (this.style.pointerEvents !== 'none') this.style.background = ''; }, 800);
          }
          selected = null;
          if (correct === total && result) {
            result.textContent = '✅ Perfect! You matched all components correctly.';
          }
        });
      });
    },

    initDragDropSort() {
      const docs = document.querySelectorAll('#sort-docs .sort-doc');
      const folders = document.querySelectorAll('#sort-docs .sort-folder');
      const result = document.getElementById('sort-docs-result');
      if (!docs.length || !folders.length) return;
      let selectedDoc = null, correct = 0, total = docs.length;
      docs.forEach(d => {
        d.addEventListener('click', function() {
          if (this.style.pointerEvents === 'none') return;
          docs.forEach(x => { if (x.style.pointerEvents !== 'none') x.style.background = ''; });
          selectedDoc = this;
          this.style.background = '#e0f0ff';
        });
      });
      folders.forEach(f => {
        f.addEventListener('click', function() {
          if (!selectedDoc || this.style.pointerEvents === 'none') return;
          if (selectedDoc.dataset.folder === this.dataset.folder) {
            this.style.background = '#d4edda';
            selectedDoc.style.background = '#d4edda';
            this.style.pointerEvents = 'none';
            selectedDoc.style.pointerEvents = 'none';
            this.style.textDecoration = 'line-through';
            selectedDoc.style.textDecoration = 'line-through';
            this.style.opacity = '0.6';
            selectedDoc.style.opacity = '0.6';
            this.insertBefore(document.createTextNode('✓ '), this.firstChild);
            selectedDoc.insertBefore(document.createTextNode('✓ '), selectedDoc.firstChild);
            correct++;
          } else {
            this.style.background = '#f8d7da';
            setTimeout(() => { if (this.style.pointerEvents !== 'none') this.style.background = ''; }, 800);
          }
          selectedDoc = null;
          if (correct === total && result) {
            result.textContent = '✅ Excellent! All documents sorted correctly.';
          }
        });
      });
    }
  };
})();
