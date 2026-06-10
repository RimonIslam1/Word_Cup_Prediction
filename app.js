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

// --- OFFICIAL FIFA WORLD CUP 2026 KNOCKOUT BRACKET STRUCTURE ---

/**
 * Maps the Round of 32 pairings matching the official FIFA 2026 schedule path structure.
 */
const ROUND_OF_32_MAPPINGS = [
  { id: "M73", home: "2A", away: "2B" },
  { id: "M74", home: "1E", away: "3_0" }, // Feeds first selected wildcard
  { id: "M75", home: "1F", away: "2C" },
  { id: "M76", home: "1C", away: "2F" },
  { id: "M77", home: "1I", away: "3_1" }, // Feeds second selected wildcard
  { id: "M78", home: "2E", away: "2I" },
  { id: "M79", home: "1A", away: "3_2" }, // Feeds third selected wildcard
  { id: "M80", home: "1L", away: "3_3" }, // Feeds fourth selected wildcard
  { id: "M81", home: "1D", away: "3_4" }, // Feeds fifth selected wildcard
  { id: "M82", home: "1G", away: "3_5" }, // Feeds sixth selected wildcard
  { id: "M83", home: "2K", away: "2L" },
  { id: "M84", home: "1H", away: "2J" },
  { id: "M85", home: "1B", away: "3_6" }, // Feeds seventh selected wildcard
  { id: "M86", home: "1J", away: "2H" },
  { id: "M87", home: "1K", away: "3_7" }, // Feeds eighth selected wildcard
  { id: "M88", home: "2D", away: "2G" }
];

/**
 * Progression matrix where downstream matches are mapped to dependencies.
 * Index numbers correspond to match offsets inside the previous round's array structure.
 */
const SUBSEQUENT_KNOCKOUT_MAPPINGS = {
  r16: [
    { home: { round: "r32", idx: 1 }, away: { round: "r32", idx: 4 } },   // M89: W74 vs W77
    { home: { round: "r32", idx: 0 }, away: { round: "r32", idx: 2 } },   // M90: W73 vs W75
    { home: { round: "r32", idx: 3 }, away: { round: "r32", idx: 5 } },   // M91: W76 vs W78
    { home: { round: "r32", idx: 6 }, away: { round: "r32", idx: 7 } },   // M92: W79 vs W80
    { home: { round: "r32", idx: 10 }, away: { round: "r32", idx: 11 } }, // M93: W83 vs W84
    { home: { round: "r32", idx: 8 }, away: { round: "r32", idx: 9 } },   // M94: W81 vs W82
    { home: { round: "r32", idx: 13 }, away: { round: "r32", idx: 15 } }, // M95: W86 vs W88
    { home: { round: "r32", idx: 12 }, away: { round: "r32", idx: 14 } }  // M96: W85 vs W87
  ],
  qf: [
    { home: { round: "r16", idx: 0 }, away: { round: "r16", idx: 1 } },   // M97: W89 vs W90
    { home: { round: "r16", idx: 4 }, away: { round: "r16", idx: 5 } },   // M98: W93 vs W94
    { home: { round: "r16", idx: 2 }, away: { round: "r16", idx: 3 } },   // M99: W91 vs W92
    { home: { round: "r16", idx: 6 }, away: { round: "r16", idx: 7 } }    // M100: W95 vs W96
  ],
  sf: [
    { home: { round: "qf", idx: 0 }, away: { round: "qf", idx: 1 } },     // M101: W97 vs W98
    { home: { round: "qf", idx: 2 }, away: { round: "qf", idx: 3 } }      // M102: W99 vs W100
  ],
  final: [
    { home: { round: "sf", idx: 0 }, away: { round: "sf", idx: 1 } }      // M104: W101 vs W102
  ]
};

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
  return ROUND_OF_32_MAPPINGS.map(mapping => {
    let homeTeam = null;
    let awayTeam = null;

    // Resolve Home Side placement Code (e.g. "1E", "2A")
    if (mapping.home) {
      const rank = parseInt(mapping.home[0], 10) - 1;
      const grp = mapping.home[1];
      if (groupRankings[grp]) homeTeam = groupRankings[grp][rank];
    }

    // Resolve Away Side placement Code or Wildcard placeholder
    if (mapping.away.startsWith("3_")) {
      const wildcardIndex = parseInt(mapping.away.split("_")[1], 10);
      awayTeam = thirdPicks[wildcardIndex] || null;
    } else {
      const rank = parseInt(mapping.away[0], 10) - 1;
      const grp = mapping.away[1];
      if (groupRankings[grp]) awayTeam = groupRankings[grp][rank];
    }

    return { a: homeTeam, b: awayTeam };
  });
}

function buildNextRound(prevPairs, winners, targetRoundKey) {
  const blueprint = SUBSEQUENT_KNOCKOUT_MAPPINGS[targetRoundKey];
  if (!blueprint) return [];

  return blueprint.map(match => {
    const homeWinnerSourceIdx = match.home.idx;
    const awayWinnerSourceIdx = match.away.idx;

    // Fetch values based on state arrays mapping
    const homeTeam = knockoutWinners[match.home.round][homeWinnerSourceIdx] || null;
    const awayTeam = knockoutWinners[match.away.round][awayWinnerSourceIdx] || null;

    return { a: homeTeam, b: awayTeam };
  });
}

function updateTournamentData() {
  r32Pairs = buildR32();
  r16Pairs = buildNextRound(r32Pairs, knockoutWinners.r32, "r16");
  qfPairs = buildNextRound(r16Pairs, knockoutWinners.r16, "qf");
  sfPairs = buildNextRound(qfPairs, knockoutWinners.qf, "sf");
  finalPair = buildNextRound(sfPairs, knockoutWinners.sf, "final");
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
    
    // Explicitly title matches based on true FIFA numbering schemes
    let displayMatchLabel = `Matchup #${i + 1}`;
    if (roundKey === "r32") {
      displayMatchLabel = `Match ${ROUND_OF_32_MAPPINGS[i].id}`;
    }
    cardHeader.textContent = displayMatchLabel;
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
    // Find dependencies pointing back to this index position
    SUBSEQUENT_KNOCKOUT_MAPPINGS.r16.forEach((m, idx) => {
      if ((m.home.round === "r32" && m.home.idx === index) || (m.away.round === "r32" && m.away.idx === index)) {
        delete knockoutWinners.r16[idx];
        clearDownstreamRounds("r16", idx);
      }
    });
  } else if (purgedRoundKey === "r16") {
    SUBSEQUENT_KNOCKOUT_MAPPINGS.qf.forEach((m, idx) => {
      if ((m.home.round === "r16" && m.home.idx === index) || (m.away.round === "r16" && m.away.idx === index)) {
        delete knockoutWinners.qf[idx];
        clearDownstreamRounds("qf", idx);
      }
    });
  } else if (purgedRoundKey === "qf") {
    SUBSEQUENT_KNOCKOUT_MAPPINGS.sf.forEach((m, idx) => {
      if ((m.home.round === "qf" && m.home.idx === index) || (m.away.round === "qf" && m.away.idx === index)) {
        delete knockoutWinners.sf[idx];
        clearDownstreamRounds("sf", idx);
      }
    });
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