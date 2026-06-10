// --- Complete 48 Team Initial Groups Structure ---
const GROUPS = {
  A: ["Mexico", "South Korea", "South Africa", "Czechia"],
  B: ["Canada", "Switzerland", "Qatar", "Bosnia and Herzegovina"],
  C: ["Brazil", "Morocco", "Scotland", "Haiti"],
  D: ["USA", "Australia", "Paraguay", "Türkiye"],
  E: ["Germany", "Ecuador", "Ivory Coast", "Curaçao"],
  F: ["Netherlands", "Japan", "Tunisia", "Sweden"],
  G: ["Belgium", "Iran", "Egypt", "New Zealand"],
  H: ["Spain", "Uruguay", "Saudi Arabia", "Cape Verde"],
  I: ["France", "Senegal", "Norway", "Iraq"],
  J: ["Argentina", "Austria", "Algeria", "Jordan"],
  K: ["Portugal", "Colombia", "Uzbekistan", "DR Congo"],
  L: ["England", "Croatia", "Panama", "Ghana"],
};

// --- ISO Codes Mapping Matrix ---
const ISO = {
  "Mexico":"mx","South Korea":"kr","South Africa":"za","Czechia":"cz",
  "Canada":"ca","Switzerland":"ch","Qatar":"qa","Bosnia and Herzegovina":"ba",
  "Brazil":"br","Morocco":"ma","Scotland":"gb-sct","Haiti":"ht",
  "USA":"us","Australia":"au","Paraguay":"py","Türkiye":"tr",
  "Germany":"de","Ecuador":"ec","Ivory Coast":"ci","Curaçao":"cw",
  "Netherlands":"nl","Japan":"jp","Tunisia":"tn","Sweden":"se",
  "Belgium":"be","Iran":"ir","Egypt":"eg","New Zealand":"nz",
  "Spain":"es","Uruguay":"uy","Saudi Arabia":"sa","Cape Verde":"cv",
  "France":"fr","Senegal":"sn","Norway":"no","Iraq":"iq",
  "Argentina":"ar","Austria":"at","Algeria":"dz","Jordan":"jo",
  "Portugal":"pt","Colombia":"co","Uzbekistan":"uz","DR Congo":"cd",
  "England":"gb-eng","Croatia":"hr","Panama":"pa","Ghana":"gh",
};

const STEPS = ["groups", "r32", "r16", "qf", "sf", "final", "done"];
const STEP_LABELS = {
  groups: "Groups", r32: "Round of 32", r16: "Round of 16",
  qf: "Quarterfinals", sf: "Semifinals", final: "Final", done: "Summary"
};

// --- Application Core State Container ---
let currentStep = "groups";
let groupRankings = {};
let thirdPicks = [];
let knockoutWinners = {
  r32: {},
  r16: {},
  qf: {},
  sf: {},
  final: null
};

// Dyn-allocated matches pairs matching caches
let r32Pairs = [];
let r16Pairs = [];
let qfPairs = [];
let sfPairs = [];
let finalPair = [];

// --- Flag CDN Asset Injection Resolver ---
function getFlagUrl(team) {
  const code = ISO[team];
  return code ? `https://flagcdn.com/w40/${code}.png` : "";
}

function createFlagImg(team) {
  const img = document.createElement("img");
  img.src = getFlagUrl(team);
  img.width = 20;
  img.height = 14;
  img.alt = team;
  img.className = "flag-img";
  return img;
}

// --- Bracket Assembly Engine ---
function buildR32() {
  const firsts = Object.values(groupRankings).map(t => t[0]);
  const seconds = Object.values(groupRankings).map(t => t[1]);
  const seeded = [...firsts, ...seconds, ...thirdPicks];
  
  const pairs = [];
  for (let i = 0; i < 16; i++) {
    pairs.push({ a: seeded[i], b: seeded[31 - i] });
  }
  return pairs;
}

function buildNextRound(prevPairs, winners) {
  const ws = prevPairs.map((_, i) => winners[i] || null);
  if (ws.some(w => !w)) return [];
  const pairs = [];
  for (let i = 0; i < ws.length; i += 2) {
    pairs.push({ a: ws[i], b: ws[i + 1] });
  }
  return pairs;
}

function updateTournamentData() {
  r32Pairs = buildR32();
  r16Pairs = buildNextRound(r32Pairs, Object.values(knockoutWinners.r32));
  qfPairs = buildNextRound(r16Pairs, Object.values(knockoutWinners.r16));
  sfPairs = buildNextRound(qfPairs, Object.values(knockoutWinners.qf));
  finalPair = buildNextRound(sfPairs, Object.values(knockoutWinners.sf));
}

// --- Controller Actions ---
function init() {
  currentStep = "groups";
  thirdPicks = [];
  knockoutWinners = { r32: {}, r16: {}, qf: {}, sf: {}, final: null };
  groupRankings = {};
  
  Object.entries(GROUPS).forEach(([g, teams]) => {
    groupRankings[g] = [...teams];
  });
  
  renderProgressBar();
  renderStep();
}

function setStep(nextStep) {
  currentStep = nextStep;
  updateTournamentData();
  renderProgressBar();
  renderStep();
  window.scrollTo(0, 0);
}

// --- Stepper Render Layout ---
function renderProgressBar() {
  const bar = document.getElementById("progressBar");
  bar.innerHTML = "";
  
  const idx = STEPS.indexOf(currentStep);
  
  STEPS.forEach((s, i) => {
    const isDone = i < idx;
    const isActive = s === currentStep;
    
    const node = document.createElement("div");
    node.className = "progress-node";
    
    const content = document.createElement("div");
    content.className = "node-content";
    
    const circle = document.createElement("div");
    circle.className = `node-circle ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`;
    circle.textContent = isDone ? "✓" : (i + 1);
    
    const span = document.createElement("span");
    span.className = `node-label ${isActive ? 'active' : ''}`;
    span.textContent = STEP_LABELS[s];
    
    content.appendChild(circle);
    content.appendChild(span);
    node.appendChild(content);
    
    if (i < STEPS.length - 1) {
      const line = document.createElement("div");
      line.className = `progress-line ${i < idx ? 'done' : ''}`;
      node.appendChild(line);
    }
    
    bar.appendChild(node);
  });
}

function renderStep() {
  const container = document.getElementById("stepContainer");
  container.innerHTML = "";
  
  if (currentStep === "groups") renderGroupStage(container);
  else if (currentStep === "r32") renderKnockoutRound(container, "r32", "Round of 32", "Select winners to fill out the remaining bracket slots", r32Pairs, "r16", "groups");
  else if (currentStep === "r16") renderKnockoutRound(container, "r16", "Round of 16", "Decide who moves into the final 8", r16Pairs, "qf", "r32");
  else if (currentStep === "qf") renderKnockoutRound(container, "qf", "Quarterfinals", "Choose your top four semifinalists", qfPairs, "sf", "r16");
  else if (currentStep === "sf") renderKnockoutRound(container, "sf", "Semifinals", "Determine the ultimate World Cup final matchup", sfPairs, "final", "qf");
  else if (currentStep === "final") renderFinalStep(container);
  else if (currentStep === "done") renderResultSummary(container);
}

// --- Interactive View Layer Renderers ---

// Group Stage Module (Featuring Drag and Drop Reordering)
function renderGroupStage(container) {
  updateTournamentData();

  const h = document.createElement("h2"); h.className = "step-heading"; h.textContent = "Arrange Group Placements";
  const p = document.createElement("p"); p.className = "step-subtitle"; p.textContent = "Drag and drop teams up or down to set your predicted standings. Top 2 auto-qualify.";
  container.appendChild(h); container.appendChild(p);
  
  const grid = document.createElement("div");
  grid.className = "groups-grid";
  
  Object.entries(groupRankings).forEach(([grp, teams]) => {
    const card = document.createElement("div");
    card.className = "group-card";
    
    const header = document.createElement("div");
    header.className = "group-header";
    header.innerHTML = `<span>Group ${grp}</span><span class="group-header-hint">Drag to reorder</span>`;
    card.appendChild(header);
    
    const labels = ["1st", "2nd", "3rd", "4th"];
    const colors = ["#2f855a", "#3182ce", "#4a5568", "#a0aec0"];
    
    teams.forEach((team, i) => {
      const row = document.createElement("div");
      row.className = "team-row";
      row.draggable = true;
      row.dataset.index = i;
      row.dataset.group = grp;
      
      const posSpan = document.createElement("span");
      posSpan.className = "pos-label";
      posSpan.style.color = colors[i];
      posSpan.textContent = labels[i];
      
      const nameSpan = document.createElement("span");
      nameSpan.className = "team-name";
      nameSpan.textContent = team;
      
      const dragIndicator = document.createElement("div");
      dragIndicator.className = "drag-icon";
      dragIndicator.innerHTML = "☰";
      
      row.appendChild(posSpan);
      row.appendChild(createFlagImg(team));
      row.appendChild(nameSpan);
      row.appendChild(dragIndicator);

      // --- Drag & Drop Core System Logic ---
      row.addEventListener("dragstart", (e) => {
        row.classList.add("dragging");
        e.dataTransfer.setData("text/plain", JSON.stringify({ index: i, group: grp }));
        e.dataTransfer.effectAllowed = "move";
      });

      row.addEventListener("dragover", (e) => {
        e.preventDefault();
        row.classList.add("drag-over");
      });

      row.addEventListener("dragleave", () => {
        row.classList.remove("drag-over");
      });

      row.addEventListener("drop", (e) => {
        e.preventDefault();
        row.classList.remove("drag-over");
        
        try {
          const dragData = JSON.parse(e.dataTransfer.getData("text/plain"));
          
          // Enforce drag constraints (Only drag within the same group card layout)
          if (dragData.group === grp && dragData.index !== i) {
            const arr = groupRankings[grp];
            
            // Re-order calculation array mutation swap
            const [movedTeam] = arr.splice(dragData.index, 1);
            arr.splice(i, 0, movedTeam);
            
            // Safeguard cleanup: reset wildcard selections if re-ranked context shifted
            thirdPicks = thirdPicks.filter(t => t !== team && t !== movedTeam);
            
            renderStep();
          }
        } catch (err) {
          console.error("Drag data extraction failed", err);
        }
      });

      row.addEventListener("dragend", () => {
        row.classList.remove("dragging");
      });
      
      card.appendChild(row);
    });
    
    grid.appendChild(card);
  });
  
  container.appendChild(grid);
  
  // Wildcard selection engine segment
  const thirdsBlock = document.createElement("div");
  thirdsBlock.className = "thirds-container";
  thirdsBlock.innerHTML = `<div class="thirds-heading">Select 8 Best Third-Place Wildcards <span class="thirds-count">(${thirdPicks.length}/8)</span></div>`;
  
  const subText = document.createElement("div");
  subText.className = "thirds-subtext";
  subText.textContent = "Pick exactly 8 of the third-place finishers listed below to complete the bracket.";
  thirdsBlock.appendChild(subText);
  
  const chipsWrapper = document.createElement("div");
  chipsWrapper.className = "thirds-chips";
  
  Object.entries(groupRankings).forEach(([g, t]) => {
    const candidateTeam = t[2]; 
    const isSelected = thirdPicks.includes(candidateTeam);
    const isDisabled = !isSelected && thirdPicks.length >= 8;
    
    const chip = document.createElement("button");
    chip.className = `third-btn ${isSelected ? 'selected' : ''}`;
    chip.disabled = isDisabled;
    
    const labelSpan = document.createElement("span");
    labelSpan.textContent = candidateTeam;
    
    const contextSpan = document.createElement("span");
    contextSpan.className = "third-context";
    contextSpan.textContent = `Grp ${g}`;
    
    chip.appendChild(createFlagImg(candidateTeam));
    chip.appendChild(labelSpan);
    chip.appendChild(contextSpan);
    
    chip.addEventListener("click", () => {
      if (thirdPicks.includes(candidateTeam)) {
        thirdPicks = thirdPicks.filter(item => item !== candidateTeam);
      } else if (thirdPicks.length < 8) {
        thirdPicks.push(candidateTeam);
      }
      renderStep();
    });
    
    chipsWrapper.appendChild(chip);
  });
  
  thirdsBlock.appendChild(chipsWrapper);
  container.appendChild(thirdsBlock);
  
  const canAdvance = thirdPicks.length === 8;
  renderNavControls({
    container: container,
    canAdvance: canAdvance,
    onNext: () => setStep("r32"),
    onBack: null,
    nextLabel: "Unlock Round of 32 Bracket",
    notice: !canAdvance ? `Please select ${8 - thirdPicks.length} more third-place team(s) to continue.` : null
  });
}

// Knockout Matchups System Module
function renderKnockoutRound(container, roundKey, label, subtitle, pairs, nextStep, prevStep) {
  const isReady = pairs.length > 0 && pairs.every(p => p.a && p.b);
  if (!isReady) {
    container.innerHTML = `
      <div style="text-align:center; padding:3rem;">
        <button id="koFallbackBack" class="btn-back">← Go back and verify dependencies</button>
      </div>`;
    document.getElementById("koFallbackBack").addEventListener("click", () => setStep(prevStep));
    return;
  }
  
  const h = document.createElement("h2"); h.className = "step-heading"; h.textContent = label;
  const p = document.createElement("p"); p.className = "step-subtitle"; p.textContent = subtitle;
  container.appendChild(h); container.appendChild(p);
  
  const grid = document.createElement("div");
  grid.className = pairs.length <= 4 ? "knockout-grid-1" : "knockout-grid-2";
  
  pairs.forEach((match, i) => {
    const currentWinner = knockoutWinners[roundKey][i];
    const card = document.createElement("div");
    card.className = `match-card ${currentWinner ? 'decided' : ''}`;
    
    const cardHeader = document.createElement("div");
    cardHeader.className = "match-header";
    cardHeader.textContent = `Matchup #${i + 1}`;
    card.appendChild(cardHeader);
    
    const cardBody = document.createElement("div");
    cardBody.className = "match-body";
    
    [match.a, match.b].forEach(team => {
      const isWinner = currentWinner === team;
      const btn = document.createElement("button");
      btn.className = `match-team-btn ${isWinner ? 'winner' : ''}`;
      
      const lbl = document.createElement("span");
      lbl.textContent = team;
      
      btn.appendChild(createFlagImg(team));
      btn.appendChild(lbl);
      if (isWinner) {
        const check = document.createElement("span");
        check.className = "check-icon";
        check.textContent = "✓";
        btn.appendChild(check);
      }
      
      btn.addEventListener("click", () => {
        knockoutWinners[roundKey][i] = team;
        clearDownstreamRounds(roundKey, i);
        updateTournamentData();
        renderStep();
      });
      
      cardBody.appendChild(btn);
    });
    
    card.appendChild(cardBody);
    grid.appendChild(card);
  });
  
  container.appendChild(grid);
  
  const currentCount = Object.keys(knockoutWinners[roundKey]).length;
  const canAdvance = currentCount === pairs.length;
  
  renderNavControls({
    container: container,
    canAdvance: canAdvance,
    onNext: () => setStep(nextStep),
    onBack: () => setStep(prevStep),
    nextLabel: `Advance to next round`,
    notice: !canAdvance ? `Please resolve all match winners (${currentCount}/${pairs.length} decided).` : null
  });
}

function clearDownstreamRounds(purgedRoundKey, index) {
  if (purgedRoundKey === "r32") {
    delete knockoutWinners.r16[Math.floor(index / 2)];
    delete knockoutWinners.qf[Math.floor(index / 4)];
    delete knockoutWinners.sf[Math.floor(index / 8)];
    knockoutWinners.final = null;
  } else if (purgedRoundKey === "r16") {
    delete knockoutWinners.qf[Math.floor(index / 2)];
    delete knockoutWinners.sf[Math.floor(index / 4)];
    knockoutWinners.final = null;
  } else if (purgedRoundKey === "qf") {
    delete knockoutWinners.sf[Math.floor(index / 2)];
    knockoutWinners.final = null;
  } else if (purgedRoundKey === "sf") {
    knockoutWinners.final = null;
  }
}

// World Cup Grand Finale Screen Module
function renderFinalStep(container) {
  const match = finalPair[0];
  if (!match || !match.a || !match.b) {
    container.innerHTML = `<div style="text-align:center; padding:3rem;"><button id="finalFallbackBack" class="btn-back">← Go back to Semifinals</button></div>`;
    document.getElementById("finalFallbackBack").addEventListener("click", () => setStep("sf"));
    return;
  }
  
  const headBlock = document.createElement("div");
  headBlock.className = "final-header-block";
  headBlock.innerHTML = `
    <div class="final-trophy">🏆</div>
    <h2 class="step-heading">The World Cup Final</h2>
    <p class="step-subtitle">July 19 &middot; MetLife Stadium, New York/New Jersey</p>
  `;
  container.appendChild(headBlock);
  
  const matchupGrid = document.createElement("div");
  matchupGrid.className = "final-matchup";
  
  const currentWinner = knockoutWinners.final;
  
  [match.a, match.b].forEach((team, i) => {
    const isWinner = currentWinner === team;
    
    const btn = document.createElement("button");
    btn.className = `final-team-btn ${isWinner ? 'winner' : ''}`;
    
    const wrapper = document.createElement("div");
    wrapper.className = "final-flag-frame";
    const fImg = document.createElement("img");
    fImg.src = getFlagUrl(team);
    fImg.alt = team;
    wrapper.appendChild(fImg);
    
    const nameSpan = document.createElement("span");
    nameSpan.textContent = team;
    
    btn.appendChild(wrapper);
    btn.appendChild(nameSpan);
    
    btn.addEventListener("click", () => {
      knockoutWinners.final = team;
      renderStep();
    });
    
    matchupGrid.appendChild(btn);
    if (i === 0) {
      const vsDiv = document.createElement("div");
      vsDiv.className = "final-vs";
      vsDiv.textContent = "vs";
      matchupGrid.appendChild(vsDiv);
    }
  });
  
  container.appendChild(matchupGrid);
  
  if (currentWinner) {
    const alertDiv = document.createElement("div");
    alertDiv.className = "banner-alert";
    alertDiv.textContent = `👑 Congratulations! ${currentWinner} are your projected world champions!`;
    container.appendChild(alertDiv);
  }
  
  const canAdvance = !!currentWinner;
  renderNavControls({
    container: container,
    canAdvance: canAdvance,
    onNext: () => setStep("done"),
    onBack: () => setStep("sf"),
    nextLabel: "Generate Prediction Summary",
    notice: !canAdvance ? "Select a team to declare them World Cup Winner." : null
  });
}

// Summary Result Presentation Dashboard Module
function renderResultSummary(container) {
  const champion = knockoutWinners.final;
  const match = finalPair[0];
  const runnerUp = champion === match.a ? match.b : match.a;
  
  const champCard = document.createElement("div");
  champCard.className = "summary-champion-card";
  champCard.innerHTML = `
    <div class="champ-tag">2026 FIFA Champion</div>
    <div class="champ-flag-frame">
      <img src="${getFlagUrl(champion)}" style="object-fit:cover; width:100%; height:100%;" alt="${champion}">
    </div>
    <div class="champ-name">${champion}</div>
  `;
  container.appendChild(champCard);
  
  const podiumGrid = document.createElement("div");
  podiumGrid.className = "podium-grid";
  podiumGrid.innerHTML = `
    <div class="podium-box">
      <div class="podium-flag-frame"><img src="${getFlagUrl(runnerUp)}" style="object-fit:cover; width:100%; height:100%;" alt="${runnerUp}"></div>
      <div>
        <div class="podium-title">🥈 Second Place</div>
        <div class="podium-name">${runnerUp}</div>
      </div>
    </div>
    <div class="podium-box">
      <div style="font-size:24px;">🏟️</div>
      <div>
        <div class="podium-title">Final Venue</div>
        <div class="podium-name" style="font-size:13px; font-weight:500;">MetLife Stadium, NJ</div>
      </div>
    </div>
  `;
  container.appendChild(podiumGrid);
  
  // Group metrics block
  const sectionTitle1 = document.createElement("div");
  sectionTitle1.className = "summary-section-title";
  sectionTitle1.textContent = "Group Standings Strategy Map";
  container.appendChild(sectionTitle1);
  
  const gGrid = document.createElement("div");
  gGrid.className = "summary-groups-grid";
  
  Object.entries(groupRankings).forEach(([grp, teams]) => {
    const card = document.createElement("div");
    card.className = "summary-group-card";
    
    const hDiv = document.createElement("div");
    hDiv.className = "summary-group-header";
    hDiv.textContent = `Group ${grp}`;
    card.appendChild(hDiv);
    
    teams.forEach((team, i) => {
      const row = document.createElement("div");
      row.className = "summary-team-row";
      
      const isQualifiedNormal = i < 2;
      const isQualifiedThird = i === 2 && thirdPicks.includes(team);
      
      const posSpan = document.createElement("span");
      posSpan.className = "pos-label";
      posSpan.textContent = ["1st", "2nd", "3rd", "4th"][i];
      
      row.appendChild(posSpan);
      row.appendChild(createFlagImg(team));
      row.appendChild(document.createTextNode(team));
      
      if (isQualifiedNormal) row.innerHTML += `<span class="badge-adv">ADV</span>`;
      if (isQualifiedThird) row.innerHTML += `<span class="badge-third">WC</span>`;
      
      card.appendChild(row);
    });
    gGrid.appendChild(card);
  });
  container.appendChild(gGrid);
  
  // Logs of knockout matches paths
  const displayRounds = [
    { label: "Round of 32 Review", pairs: r32Pairs, winners: knockoutWinners.r32 },
    { label: "Round of 16 Review", pairs: r16Pairs, winners: knockoutWinners.r16 },
    { label: "Quarterfinals Review", pairs: qfPairs, winners: knockoutWinners.qf },
    { label: "Semifinals Review", pairs: sfPairs, winners: knockoutWinners.sf }
  ];
  
  displayRounds.forEach(round => {
    const rTitle = document.createElement("div");
    rTitle.className = "summary-section-title";
    rTitle.textContent = round.label;
    container.appendChild(rTitle);
    
    const rGrid = document.createElement("div");
    rGrid.className = "summary-ko-grid";
    
    round.pairs.forEach((p, i) => {
      const matchItem = document.createElement("div");
      matchItem.className = "summary-match-item";
      
      [p.a, p.b].forEach(team => {
        const isWinner = round.winners[i] === team;
        const row = document.createElement("div");
        row.className = `summary-match-row ${isWinner ? 'winner' : ''}`;
        row.appendChild(createFlagImg(team));
        row.appendChild(document.createTextNode(team));
        matchItem.appendChild(row);
      });
      rGrid.appendChild(matchItem);
    });
    container.appendChild(rGrid);
  });
  
  // Sticky footer override actions panel
  const footerNav = document.createElement("div");
  footerNav.className = "nav-buttons";
  footerNav.style.marginTop = "2rem";
  
  const bBtn = document.createElement("button");
  bBtn.className = "btn-back";
  bBtn.textContent = "Change Finalist Pick";
  bBtn.addEventListener("click", () => setStep("final"));
  
  const rBtn = document.createElement("button");
  rBtn.className = "btn-next";
  rBtn.style.backgroundColor = "#e53e3e";
  rBtn.textContent = "Reset Bracket Data";
  rBtn.addEventListener("click", () => init());
  
  footerNav.appendChild(bBtn);
  footerNav.appendChild(rBtn);
  container.appendChild(footerNav);
}

// --- Universal Dynamic Sticky Dock Menu Control Engine ---
function renderNavControls({ container, canAdvance, onNext, onBack, nextLabel, notice }) {
  const dock = document.createElement("div");
  dock.className = "bottom-nav-dock";
  
  const wrapper = document.createElement("div");
  wrapper.className = "dock-wrapper";
  
  if (notice && !canAdvance) {
    const banner = document.createElement("div");
    banner.className = "notice-banner";
    banner.textContent = notice;
    wrapper.appendChild(banner);
  }
  
  const buttonsRow = document.createElement("div");
  buttonsRow.className = "nav-buttons";
  
  if (onBack) {
    const backBtn = document.createElement("button");
    backBtn.className = "btn-back";
    backBtn.textContent = "← Back";
    backBtn.addEventListener("click", onBack);
    buttonsRow.appendChild(backBtn);
  }
  
  const nextBtn = document.createElement("button");
  nextBtn.className = "btn-next";
  nextBtn.textContent = nextLabel;
  nextBtn.disabled = !canAdvance;
  if (canAdvance && onNext) {
    nextBtn.addEventListener("click", onNext);
  }
  buttonsRow.appendChild(nextBtn);
  
  wrapper.appendChild(buttonsRow);
  dock.appendChild(wrapper);
  container.appendChild(dock);
}

// Bootstrap Initialization
document.addEventListener("DOMContentLoaded", init);