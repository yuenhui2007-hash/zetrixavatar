/**
 * Course Engine v9 — Interactive Segmented Learning
 * Handles segments, quizzes (multiple types), flashcards, progress tracking
 * v9 — New assessment types: matching, sequencing, fill-blanks, true/false
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
      this.initKeyboard();
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

      // Flashcards
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

      // Assessment (quiz or other types)
      if (seg.assessment && !state.completed) {
        html += this.renderAssessment(seg.assessment, idx);
      } else if (seg.assessment && state.completed) {
        html += `<div class="quiz-section passed"><h4>✅ Passed</h4><p>You can proceed to the next segment.</p></div>`;
      }

      // Legacy quiz support
      if (seg.quiz && seg.quiz.length > 0) {
        if (state.quizPassed) {
          html += `<div class="quiz-section passed"><h4>✅ Quiz Passed (${state.quizBestScore}/${seg.quiz.length})</h4><p>You can proceed to the next segment.</p></div>`;
        } else {
          html += this.renderLegacyQuiz(seg.quiz, idx, seg.passThreshold);
        }
      }

      // Interaction
      if (!seg.quiz && !seg.assessment && seg.interaction) {
        if (state.completed) {
          html += `<div class="interaction-completed"><h4>✅ Completed</h4><p>${seg.interaction.completedText || 'You can proceed to the next segment.'}</p></div>`;
        } else {
          html += this.renderInteraction(seg.interaction, idx);
        }
      }

      // Mark complete button (if no assessment/interaction)
      if (!seg.quiz && !seg.assessment && !seg.interaction) {
        if (!state.completed) {
          html += `<div class="interaction-section" style="margin-top:24px;padding:20px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;"><h4>✅ Mark Complete</h4><p>Read through this segment, then click below to mark it complete and unlock the next segment.</p><button class="btn btn-primary" style="margin-top:12px;" onclick="CourseEngine.markSegmentComplete(${idx})">I've read this segment — Mark Complete</button></div>`;
        }
      }

      // Navigation buttons
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
        html += `<button class="btn btn-outline" disabled style="opacity:0.5">🔒 Complete this segment to continue</button>`;
      }
      html += '</div>';

      container.innerHTML = html;
      this.forceReadableText();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    // Ensure text inherits proper color from theme
    forceReadableText() {
      const selectors = '.segment-body, .segment-body p, .segment-body li, .segment-body ol, .segment-body ul, .segment-body h2, .segment-body h3, .segment-body h4, .segment-body strong, .segment-body em, .segment-body b, .segment-body i, .segment-body span, .segment-body div, .segment-header h2';
      document.querySelectorAll(selectors).forEach(el => {
        el.style.color = '';
        el.style.webkitTextFillColor = '';
        el.style.opacity = '';
      });
    },

    // NEW: Render assessment based on type
    renderAssessment(assessment, segIdx) {
      const type = assessment.type || 'mcq';
      switch (type) {
        case 'matching': return this.renderMatching(assessment, segIdx);
        case 'sequencing': return this.renderSequencing(assessment, segIdx);
        case 'fillblank': return this.renderFillBlank(assessment, segIdx);
        case 'truefalse': return this.renderTrueFalse(assessment, segIdx);
        case 'scenario': return this.renderScenario(assessment, segIdx);
        default: return this.renderLegacyQuiz(assessment.questions || [], segIdx, assessment.passThreshold);
      }
    },

    // MATCHING: Connect items on left to items on right
    renderMatching(assessment, segIdx) {
      const pairs = assessment.pairs || [];
      let html = `<div class="matching-section" id="matching-${segIdx}"><h4>🔗 Connect the Dots</h4><p>Click an item on the left, then click its match on the right.</p><div class="matching-grid">`;
      
      // Left column
      html += '<div class="matching-col">';
      pairs.forEach((p, i) => {
        html += `<div class="matching-item" data-key="${i}" onclick="CourseEngine.matchItem(this, ${segIdx})">${p.left}</div>`;
      });
      html += '</div>';
      
      // Right column (shuffled)
      const shuffled = [...pairs].map((p, i) => ({...p, originalIndex: i})).sort(() => Math.random() - 0.5);
      html += '<div class="matching-col">';
      shuffled.forEach((p) => {
        html += `<div class="matching-target" data-key="${p.originalIndex}" onclick="CourseEngine.matchTarget(this, ${segIdx})">${p.right}</div>`;
      });
      html += '</div></div>';
      html += `<div id="matching-result-${segIdx}" class="matching-result"></div>`;
      html += `<button class="btn btn-primary" style="margin-top:12px;" onclick="CourseEngine.submitMatching(${segIdx})">Submit</button>`;
      html += '</div>';
      return html;
    },

    matchItem(el, segIdx) {
      const section = document.getElementById(`matching-${segIdx}`);
      section.querySelectorAll('.matching-item').forEach(e => e.classList.remove('selected'));
      el.classList.add('selected');
      this._selectedMatchItem = el;
    },

    matchTarget(el, segIdx) {
      if (!this._selectedMatchItem) return;
      const key = this._selectedMatchItem.dataset.key;
      if (el.dataset.key === key) {
        this._selectedMatchItem.classList.add('matched');
        el.classList.add('matched');
        this._selectedMatchItem = null;
      } else {
        el.style.animation = 'shake 0.3s';
        setTimeout(() => el.style.animation = '', 300);
      }
      this.checkMatchingComplete(segIdx);
    },

    checkMatchingComplete(segIdx) {
      const section = document.getElementById(`matching-${segIdx}`);
      const total = section.querySelectorAll('.matching-item').length;
      const matched = section.querySelectorAll('.matching-item.matched').length;
      if (matched === total) {
        document.getElementById(`matching-result-${segIdx}`).innerHTML = '<span style="color:#065f46">✅ All matched correctly!</span>';
      }
    },

    submitMatching(segIdx) {
      const section = document.getElementById(`matching-${segIdx}`);
      const total = section.querySelectorAll('.matching-item').length;
      const matched = section.querySelectorAll('.matching-item.matched').length;
      if (matched === total) {
        this.segmentStates[segIdx].completed = true;
        if (segIdx < this.totalSegments - 1) this.segmentStates[segIdx + 1].unlocked = true;
        this.saveProgress();
        setTimeout(() => this.goTo(segIdx + 1), 1500);
      } else {
        document.getElementById(`matching-result-${segIdx}`).innerHTML = '<span style="color:#991b1b">❌ Match all pairs before submitting.</span>';
      }
    },

    // SEQUENCING: Drag items into correct order
    renderSequencing(assessment, segIdx) {
      const items = assessment.items || [];
      let html = `<div class="sequencing-section" id="sequencing-${segIdx}"><h4>📋 Put in Order</h4><p>Drag the steps into the correct sequence.</p>`;
      html += '<div class="sequence-list">';
      items.forEach((item, i) => {
        html += `<div class="sequence-item" draggable="true" data-index="${i}" ondragstart="CourseEngine.seqDragStart(event)" ondragover="CourseEngine.seqDragOver(event)" ondrop="CourseEngine.seqDrop(event, ${segIdx})"><span class="seq-num">${i+1}</span>${item}</div>`;
      });
      html += '</div>';
      html += `<div id="sequencing-result-${segIdx}" class="matching-result"></div>`;
      html += `<button class="btn btn-primary" style="margin-top:12px;" onclick="CourseEngine.submitSequencing(${segIdx})">Submit</button>`;
      html += '</div>';
      return html;
    },

    seqDragStart(e) {
      e.dataTransfer.setData('text/plain', e.target.dataset.index);
      e.target.style.opacity = '0.5';
    },

    seqDragOver(e) {
      e.preventDefault();
    },

    seqDrop(e, segIdx) {
      e.preventDefault();
      const fromIdx = e.dataTransfer.getData('text/plain');
      const toEl = e.target.closest('.sequence-item');
      if (!toEl) return;
      const list = document.getElementById(`sequencing-${segIdx}`).querySelector('.sequence-list');
      const items = Array.from(list.children);
      const fromEl = items.find(el => el.dataset.index === fromIdx);
      if (fromEl && toEl && fromEl !== toEl) {
        const parent = list;
        const fromPos = items.indexOf(fromEl);
        const toPos = items.indexOf(toEl);
        if (fromPos < toPos) {
          parent.insertBefore(fromEl, toEl.nextSibling);
        } else {
          parent.insertBefore(fromEl, toEl);
        }
      }
      if (fromEl) fromEl.style.opacity = '1';
    },

    submitSequencing(segIdx) {
      const assessment = this.segments[segIdx].assessment;
      const list = document.getElementById(`sequencing-${segIdx}`).querySelector('.sequence-list');
      const currentOrder = Array.from(list.children).map(el => parseInt(el.dataset.index));
      const correct = JSON.stringify(currentOrder) === JSON.stringify(assessment.correctOrder);
      if (correct) {
        document.getElementById(`sequencing-result-${segIdx}`).innerHTML = '<span style="color:#065f46">✅ Correct order!</span>';
        this.segmentStates[segIdx].completed = true;
        if (segIdx < this.totalSegments - 1) this.segmentStates[segIdx + 1].unlocked = true;
        this.saveProgress();
        setTimeout(() => this.goTo(segIdx + 1), 1500);
      } else {
        document.getElementById(`sequencing-result-${segIdx}`).innerHTML = '<span style="color:#991b1b">❌ Not quite right. Try again!</span>';
      }
    },

    // FILL IN THE BLANKS
    renderFillBlank(assessment, segIdx) {
      let text = assessment.text || '';
      const answers = assessment.answers || [];
      let blankIndex = 0;
      text = text.replace(/\{blank\}/g, () => {
        return `<input type="text" class="fillblank-input" id="fb-${segIdx}-${blankIndex++}" placeholder="...">`;
      });
      let html = `<div class="fillblank-section" id="fillblank-${segIdx}"><h4>✏️ Fill in the Blanks</h4><p>${assessment.instruction || 'Complete the text below:'}</p>`;
      html += `<div class="fillblank-text">${text}</div>`;
      html += `<div id="fillblank-result-${segIdx}" class="matching-result"></div>`;
      html += `<button class="btn btn-primary" style="margin-top:12px;" onclick="CourseEngine.submitFillBlank(${segIdx})">Submit</button>`;
      html += '</div>';
      return html;
    },

    submitFillBlank(segIdx) {
      const assessment = this.segments[segIdx].assessment;
      const answers = assessment.answers || [];
      let correct = 0;
      answers.forEach((ans, i) => {
        const input = document.getElementById(`fb-${segIdx}-${i}`);
        if (input) {
          const val = input.value.trim().toLowerCase();
          const expected = (Array.isArray(ans) ? ans : [ans]).map(a => a.toLowerCase());
          if (expected.includes(val)) {
            input.classList.add('correct');
            input.classList.remove('wrong');
            correct++;
          } else {
            input.classList.add('wrong');
            input.classList.remove('correct');
          }
        }
      });
      if (correct === answers.length) {
        document.getElementById(`fillblank-result-${segIdx}`).innerHTML = '<span style="color:#065f46">✅ All correct!</span>';
        this.segmentStates[segIdx].completed = true;
        if (segIdx < this.totalSegments - 1) this.segmentStates[segIdx + 1].unlocked = true;
        this.saveProgress();
        setTimeout(() => this.goTo(segIdx + 1), 1500);
      } else {
        document.getElementById(`fillblank-result-${segIdx}`).innerHTML = `<span style="color:#92400e">${correct}/${answers.length} correct. Fix the highlighted blanks.</span>`;
      }
    },

    // TRUE / FALSE
    renderTrueFalse(assessment, segIdx) {
      const statements = assessment.statements || [];
      let html = `<div class="tf-section" id="tf-${segIdx}"><h4>⚖️ True or False</h4><p>Click True or False for each statement, then submit.</p>`;
      statements.forEach((s, i) => {
        html += `<div class="tf-item" id="tf-item-${segIdx}-${i}" data-correct="${s.correct}"><p>${i+1}. ${s.text}</p>`;
        html += `<div class="tf-buttons"><button class="tf-btn" onclick="CourseEngine.tfSelect(${segIdx}, ${i}, true)">True</button><button class="tf-btn" onclick="CourseEngine.tfSelect(${segIdx}, ${i}, false)">False</button></div></div>`;
      });
      html += `<div id="tf-result-${segIdx}" class="matching-result"></div>`;
      html += `<button class="btn btn-primary" style="margin-top:12px;" onclick="CourseEngine.submitTrueFalse(${segIdx})">Submit</button>`;
      html += '</div>';
      return html;
    },

    tfSelect(segIdx, itemIdx, answer) {
      const item = document.getElementById(`tf-item-${segIdx}-${itemIdx}`);
      const buttons = item.querySelectorAll('.tf-btn');
      if (buttons[0].disabled) return; // locked after pass
      buttons.forEach(btn => btn.classList.remove('selected', 'correct', 'wrong'));
      buttons[answer ? 0 : 1].classList.add('selected');
      item.dataset.answer = answer;
    },

    submitTrueFalse(segIdx) {
      const assessment = this.segments[segIdx].assessment;
      const statements = assessment.statements || [];
      const items = document.getElementById(`tf-${segIdx}`).querySelectorAll('.tf-item');
      let correct = 0;
      let allAnswered = true;

      items.forEach((item) => {
        const answer = item.dataset.answer;
        const correctVal = item.dataset.correct === 'true';
        const buttons = item.querySelectorAll('.tf-btn');

        if (answer === undefined) { allAnswered = false; return; }

        const answerBool = answer === 'true';
        buttons.forEach(btn => btn.classList.remove('selected'));

        if (answerBool === correctVal) {
          correct++;
          buttons[answerBool ? 0 : 1].classList.add('correct');
          buttons[answerBool ? 1 : 0].classList.remove('correct', 'wrong');
        } else {
          buttons[answerBool ? 0 : 1].classList.add('wrong');
          buttons[correctVal ? 0 : 1].classList.add('correct');
          buttons[answerBool ? 1 : 0].classList.remove('correct', 'wrong');
        }
      });

      if (!allAnswered) {
        document.getElementById(`tf-result-${segIdx}`).innerHTML = '<span style="color:#92400e">Please answer all statements before submitting.</span>';
        return;
      }

      const pct = (correct / statements.length) * 100;
      const passThreshold = assessment.passThreshold || 80;
      if (pct >= passThreshold) {
        document.getElementById(`tf-result-${segIdx}`).innerHTML = `<span style="color:#065f46">✅ Passed! ${correct}/${statements.length} correct.</span>`;
        items.forEach(item => item.querySelectorAll('.tf-btn').forEach(btn => btn.disabled = true));
        this.segmentStates[segIdx].completed = true;
        if (segIdx < this.totalSegments - 1) this.segmentStates[segIdx + 1].unlocked = true;
        this.saveProgress();
        setTimeout(() => this.goTo(segIdx + 1), 1500);
      } else {
        document.getElementById(`tf-result-${segIdx}`).innerHTML = `<span style="color:#991b1b">❌ ${correct}/${statements.length} correct. Need ${passThreshold}% to pass. Try again!</span>`;
      }
    },

    // SCENARIO: Apply knowledge to a situation
    renderScenario(assessment, segIdx) {
      let html = `<div class="scenario-section" id="scenario-${segIdx}"><h4>🎯 Scenario Challenge</h4>`;
      html += `<div class="scenario-text">${assessment.scenario}</div>`;
      html += `<p><strong>${assessment.question}</strong></p>`;
      html += `<div class="scenario-options">`;
      (assessment.options || []).forEach((opt, i) => {
        html += `<label class="scenario-opt"><input type="radio" name="scenario-${segIdx}" value="${i}"> ${opt}</label>`;
      });
      html += '</div>';
      html += `<div id="scenario-result-${segIdx}" class="matching-result"></div>`;
      html += `<button class="btn btn-primary" style="margin-top:12px;" onclick="CourseEngine.submitScenario(${segIdx})">Submit</button>`;
      html += '</div>';
      return html;
    },

    submitScenario(segIdx) {
      const assessment = this.segments[segIdx].assessment;
      const selected = document.querySelector(`input[name="scenario-${segIdx}"]:checked`);
      if (!selected) {
        document.getElementById(`scenario-result-${segIdx}`).innerHTML = '<span style="color:#92400e">Please select an answer.</span>';
        return;
      }
      const answer = parseInt(selected.value);
      if (answer === assessment.correct) {
        document.getElementById(`scenario-result-${segIdx}`).innerHTML = `<div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;padding:16px;margin-top:12px;"><strong style="color:#065f46">✅ Correct!</strong><p style="color:#065f46;margin:8px 0 0;">${assessment.explanation || ''}</p></div>`;
        this.segmentStates[segIdx].completed = true;
        if (segIdx < this.totalSegments - 1) this.segmentStates[segIdx + 1].unlocked = true;
        this.saveProgress();
        setTimeout(() => this.goTo(segIdx + 1), 2500);
      } else {
        document.getElementById(`scenario-result-${segIdx}`).innerHTML = `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px;margin-top:12px;"><strong style="color:#991b1b">❌ Not quite.</strong><p style="color:#991b1b;margin:8px 0 0;">${assessment.explanation || 'Review the material and try again.'}</p></div>`;
      }
    },

    // Legacy MCQ quiz renderer
    renderLegacyQuiz(quiz, segIdx, passThreshold) {
      let html = '<div class="quiz-section"><h4>📝 Quiz</h4><p>Score at least 80% to unlock the next segment.</p>';
      quiz.forEach((q, i) => {
        html += `<div class="quiz-q" id="qq-${i}"><p><strong>Q${i+1}:</strong> ${q.q}</p>`;
        q.options.forEach((opt, j) => {
          html += `<label class="quiz-opt"><input type="radio" name="q${i}" value="${j}"> ${opt}</label>`;
        });
        html += '</div>';
      });
      html += `<button class="btn btn-primary" onclick="CourseEngine.submitLegacyQuiz(${segIdx})">Submit Quiz</button>`;
      html += '<div id="quiz-result" style="margin-top:16px;font-weight:600;"></div>';
      html += '</div>';
      return html;
    },

    submitLegacyQuiz(segIdx) {
      const seg = this.segments[segIdx];
      let score = 0;
      seg.quiz.forEach((q, i) => {
        const selected = document.querySelector(`input[name="q${i}"]:checked`);
        const qDiv = document.getElementById(`qq-${i}`);
        if (selected && parseInt(selected.value) === q.correct) {
          score++;
          if (qDiv) qDiv.style.background = '#d1fae5';
        } else {
          if (qDiv) qDiv.style.background = '#fee2e2';
        }
      });
      const pct = (score / seg.quiz.length) * 100;
      const resultDiv = document.getElementById('quiz-result');
      const passThreshold = seg.passThreshold || 70;
      if (pct >= passThreshold) {
        resultDiv.innerHTML = this.buildFeedback(score, seg.quiz.length, seg.title);
        this.segmentStates[segIdx].quizPassed = true;
        this.segmentStates[segIdx].completed = true;
        this.segmentStates[segIdx].quizBestScore = Math.max(this.segmentStates[segIdx].quizBestScore, score);
        if (segIdx < this.totalSegments - 1) this.segmentStates[segIdx + 1].unlocked = true;
        this.saveProgress();
        setTimeout(() => {
          if (segIdx < this.totalSegments - 1) this.goTo(segIdx + 1);
          else this.renderSegment(segIdx);
        }, 2500);
      } else {
        resultDiv.innerHTML = `<span style="color:#991b1b">❌ Failed. ${score}/${seg.quiz.length} (${Math.round(pct)}%). Need ${passThreshold}% to pass. Try again!</span>`;
        this.segmentStates[segIdx].quizBestScore = Math.max(this.segmentStates[segIdx].quizBestScore, score);
        this.saveProgress();
      }
    },

    renderInteraction(interaction, segIdx) {
      let html = `<div class="interaction-section"><h4>✏️ ${interaction.title || 'Activity'}</h4>`;
      html += `<p>${interaction.instruction || interaction.prompt || 'Complete the activity below to proceed.'}</p>`;
      if (interaction.type === 'textarea') {
        html += `<textarea id="interaction-input" rows="4" style="width:100%;padding:12px;border-radius:8px;border:1px solid #e2e8f0;margin-top:8px;" placeholder="${interaction.placeholder || 'Type your answer here...'}"></textarea>`;
      } else if (interaction.type === 'checkbox') {
        (interaction.options || []).forEach((opt, j) => {
          html += `<label style="display:block;margin:8px 0;"><input type="checkbox" value="${j}"> ${opt}</label>`;
        });
      }
      html += `<button class="btn btn-primary" style="margin-top:12px;" onclick="CourseEngine.submitInteraction(${segIdx})">Submit</button>`;
      html += '<div id="interaction-result" style="margin-top:12px;"></div>';
      html += '</div>';
      return html;
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
        if (segIdx < this.totalSegments - 1) this.segmentStates[segIdx + 1].unlocked = true;
        this.saveProgress();
        setTimeout(() => {
          if (segIdx < this.totalSegments - 1) this.goTo(segIdx + 1);
          else this.renderSegment(segIdx);
        }, 1200);
      }
    },

    flipCard(i) {
      const fc = document.getElementById(`fc-${i}`);
      if (!fc) return;
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

    buildFeedback(score, total, title) {
      const pct = Math.round((score / total) * 100);
      let msg = '';
      if (pct === 100) {
        msg = `Perfect score! You absolutely nailed <strong>${title}</strong>.`;
      } else if (pct >= 80) {
        msg = `Great work on <strong>${title}</strong>! You scored <strong>${score}/${total}</strong>.`;
      } else {
        msg = `You passed <strong>${title}</strong> with <strong>${score}/${total}</strong>.`;
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
      return this.segments.filter(s => (s.quiz && s.quiz.length > 0) || s.assessment).length;
    },

    initKeyboard() {
      document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        const seg = this.segments[this.currentSegment];
        const state = this.segmentStates[this.currentSegment];
        switch (e.key) {
          case 'ArrowRight':
            if (state.completed && this.currentSegment < this.totalSegments - 1) {
              this.goTo(this.currentSegment + 1);
            }
            break;
          case 'ArrowLeft':
            if (this.currentSegment > 0) {
              this.goTo(this.currentSegment - 1);
            }
            break;
          case ' ':
            if (seg.flashcards && seg.flashcards.length > 0) {
              e.preventDefault();
              this.flipCard(0);
            }
            break;
          case '1': case '2': case '3': case '4':
            const num = parseInt(e.key) - 1;
            const radio = document.querySelector(`input[name="q${this.currentSegment}"][value="${num}"]`);
            if (radio) radio.checked = true;
            break;
        }
      });
    }
  };
})();
