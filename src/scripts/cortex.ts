import '../styles/cortex.css'


const MAX_UNIQUE_WORDS = 35;
  const MAX_WORD_LENGTH = 30;
  const UNIT_CAP = 300;

  // --- INTERFACES & GAME STATE ---
  interface WordBox {
    element: HTMLElement;
    word: string;
    isGhost: boolean;
    x: number;
    y: number;
    dx: number;
    dy: number;
  }
  interface Particle {
    x: number;
    y: number;
    dx: number;
    dy: number;
    radius: number;
    color: string;
    lifespan: number;
    maxLifespan: number;
  }
  let particles: Particle[] = [];
  let wordInstances: WordBox[] = [];
  let uniqueWords = new Set<string>();
  let wordCounts = new Map<string, number>();
  let totalUnits = 0;
  let ghostWordCount = 0;
  let mutatedWordCount = 0;
  let isInputBoxActive = false;
  let inactivityTimer: number | null = null;
  let hasInteracted = false;
  let gameHasStarted = false;
  let gameStartTime = 0;
  let currentLoop: HTMLAudioElement | null = null;

  // --- AUDIO MANAGER ---
  function playOneShot(soundName: string) {
    const audio = new Audio(`/sounds/${soundName}`);
    audio
      .play()
      .catch((error) => console.error(`Audio Error: ${soundName}`, error));
  }
  function startLoop(soundName: string, startMuted = false) {
    if (currentLoop && currentLoop.src.includes(soundName)) return;
    if (currentLoop) currentLoop.pause();
    currentLoop = new Audio(`/sounds/${soundName}`);
    currentLoop.loop = true;
    //  currentLoop.muted = startMuted;
    currentLoop
      .play()
      .catch((error) => console.error(`Audio Error: ${soundName}`, error));
  }
  function stopAllLoops() {
    if (currentLoop) {
      currentLoop.pause();
      currentLoop = null;
    }
  }
  function unmuteCurrentLoop() {
    if (currentLoop) currentLoop.muted = false;
  }

  // --- DEBUG FUNCTION ---
  function updateDebugInfo() {
    const params = new URLSearchParams(window.location.search);
    const isDebugMode = params.get("debug") === "true";
    if (!isDebugMode) return;
    const debugPanel = document.getElementById("debug-panel") as HTMLElement;
    const uniqueWordCountSpan = document.getElementById(
      "unique-word-count"
    ) as HTMLElement;
    const totalUnitCountSpan = document.getElementById(
      "total-unit-count"
    ) as HTMLElement;
    const ghostWordCountSpan = document.getElementById(
      "ghost-word-count"
    ) as HTMLElement;
    const mutatedWordCountSpan = document.getElementById(
      "mutated-word-count"
    ) as HTMLElement;
    if (debugPanel) debugPanel.style.display = "block";
    if (uniqueWordCountSpan)
      uniqueWordCountSpan.textContent = uniqueWords.size.toString();
    if (totalUnitCountSpan)
      totalUnitCountSpan.textContent = totalUnits.toString();
    if (ghostWordCountSpan)
      ghostWordCountSpan.textContent = ghostWordCount.toString();
    if (mutatedWordCountSpan)
      mutatedWordCountSpan.textContent = mutatedWordCount.toString();
  }
  const clot = document.getElementById("clot") as HTMLElement;
  clot.addEventListener("click", startGame, { once: true });
  startLoop("clotPulse.m4a", true);

  // --- AESTHETICS & ANIMATION ---
  function updateOrganicState() {
    const container = document.getElementById(
      "cortex-container"
    ) as HTMLElement;
    if (!container) return;
    const STAGE_2_THRESHOLD = 100;
    const STAGE_3_THRESHOLD = 220;
    const stage1Img = document.getElementById("brain-stage-1") as HTMLElement;
    const stage2Img = document.getElementById("brain-stage-2") as HTMLElement;
    const stage3Img = document.getElementById("brain-stage-3") as HTMLElement;
    if (!stage1Img || !stage2Img || !stage3Img) return;
    let currentStage = 1;
    let nextSizeClass = "state-1-size";
    if (totalUnits >= STAGE_3_THRESHOLD) {
      currentStage = 3;
      nextSizeClass = "state-3-size";
      startLoop("brainStage3.m4a");
    } else if (totalUnits >= STAGE_2_THRESHOLD) {
      currentStage = 2;
      nextSizeClass = "state-2-size";
      startLoop("brainStage2.m4a");
    } else if (gameHasStarted) {
      startLoop("brainStage1.m4a");
    }
    if (!container.classList.contains(nextSizeClass)) {
      container.classList.remove(
        "state-1-size",
        "state-2-size",
        "state-3-size"
      );
      container.classList.add(nextSizeClass);
    }
    stage1Img.classList.toggle("visible", currentStage === 1);
    stage2Img.classList.toggle("visible", currentStage === 2);
    stage3Img.classList.toggle("visible", currentStage === 3);
  }

  // --- In src/main.ts ---

function triggerExplosion() {
    const container = document.getElementById('cortex-container') as HTMLElement;
    const flashOverlay = document.getElementById('explosion-flash-overlay') as HTMLElement;
    if (!container || !flashOverlay) return;

    // --- THIS IS THE CRITICAL FIX ---
    // 1. FIRST, get the position of the container WHILE IT IS STILL VISIBLE.
    const rect = container.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // 2. NOW that we have the coordinates, we can hide the container.
    container.style.display = 'none';
    flashOverlay.classList.add('visible');

    // 3. Stop sounds and create particles at the CORRECT coordinates.
    stopAllLoops();
    playOneShot('Explosion.m4a');
    
    for (let i = 0; i < 200; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 2;
        const colorPalette = ['#800000', '#ff0000', '#ffd700'];
        particles.push({
            x: centerX,
            y: centerY, // Use the correct coordinates
            dx: Math.cos(angle) * speed,
            dy: Math.sin(angle) * speed,
            radius: Math.random() * 3 + 1,
            color: colorPalette[Math.floor(Math.random() * colorPalette.length)],
            lifespan: 100,
            maxLifespan: 100,
        });
    }

    const explosionCanvas = document.getElementById('explosion-canvas') as HTMLCanvasElement;
    const explosionCtx = explosionCanvas.getContext('2d')!;
    explosionCanvas.width = window.innerWidth;
    explosionCanvas.height = window.innerHeight;
    animateParticles(explosionCtx);
    
    setTimeout(() => location.reload(), 3000);
}

  function animateParticles(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    particles.forEach((p, index) => {
      p.x += p.dx;
      p.y += p.dy;
      p.lifespan--;
      if (p.lifespan <= 0) particles.splice(index, 1);
      else {
        ctx.globalAlpha = p.lifespan / p.maxLifespan;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }
    });
    if (particles.length > 0)
      requestAnimationFrame(() => animateParticles(ctx));
    else ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  function animate() {
    const container = document.getElementById(
      "cortex-container"
    ) as HTMLElement;
    if (!gameHasStarted || !container) {
      requestAnimationFrame(animate);
      return;
    }
    wordInstances.forEach((box) => {
      box.x += box.dx;
      box.y += box.dy;
      const { clientWidth, clientHeight } = container;
      const boxWidth = box.element.offsetWidth;
      const boxHeight = box.element.offsetHeight;
      if (box.x <= 0 || box.x + boxWidth >= clientWidth) box.dx *= -1;
      if (box.y <= 0 || box.y + boxHeight >= clientHeight) box.dy *= -1;
      box.x = Math.max(0, Math.min(box.x, clientWidth - boxWidth));
      box.y = Math.max(0, Math.min(box.y, clientHeight - boxHeight));
      box.element.style.left = `${box.x}px`;
      box.element.style.top = `${box.y}px`;
    });
    requestAnimationFrame(animate);
  }

  // --- GAMEPLAY LOGIC ---
  function checkUnitCap() {
    if (totalUnits >= UNIT_CAP && gameHasStarted) {
      gameHasStarted = false;
      if (inactivityTimer) clearTimeout(inactivityTimer);
      storeGhostWords();
      triggerExplosion();
    }
  }
  function handleEmptyState() {
    const container = document.getElementById(
      "cortex-container"
    ) as HTMLElement;
    if (!container) return;
    container.classList.add("dissolve");
    container.addEventListener("animationend", () => location.reload(), {
      once: true,
    });
  }
  function popWordBox(box: WordBox) {
    box.element.remove();
    const index = wordInstances.indexOf(box);
    if (index > -1) wordInstances.splice(index, 1);
    totalUnits -= box.isGhost ? 10 : 1;
    if (box.isGhost) ghostWordCount--;
    const currentCount = (wordCounts.get(box.word) || 1) - 1;
    if (currentCount <= 0) {
      wordCounts.delete(box.word);
      uniqueWords.delete(box.word);
    } else {
      wordCounts.set(box.word, currentCount);
    }
    updateAllStats();
    if (gameHasStarted && totalUnits <= 0 && wordInstances.length === 0) {
      handleEmptyState();
    }
  }
  function handleInteraction(box: WordBox) {
    resetInactivityTimer();
    const probabilities = getProbabilities(box.isGhost);
    const rand = Math.random();
    if (rand < probabilities.P_DUPLICATE)
      createWordBox(box.word, box.x, box.y, box.isGhost);
    else if (rand < probabilities.P_DUPLICATE + probabilities.P_POP)
      popWordBox(box);
    else if (
      rand <
      probabilities.P_DUPLICATE + probabilities.P_POP + probabilities.P_MUTATE
    )
      triggerMutation(box.x, box.y);
    else if (!isInputBoxActive && totalUnits < UNIT_CAP)
      createFloatingInputBox(box.x, box.y);
  }
  function updateAllStats() {
    updateDebugInfo();
    updateOrganicState();
    checkUnitCap();
  }
  function getProbabilities(isGhost: boolean) {
    if (isGhost)
      return {
        P_DUPLICATE: 0.85,
        P_POP: 0.05,
        P_NEW_INPUT: 0.05,
        P_MUTATE: 0.05,
      };
    if (uniqueWords.size < 5)
      return {
        P_DUPLICATE: 0.45,
        P_NEW_INPUT: 0.45,
        P_POP: 0.08,
        P_MUTATE: 0.02,
      };
    if (totalUnits < 50)
      return {
        P_DUPLICATE: 0.8,
        P_NEW_INPUT: 0.1,
        P_POP: 0.05,
        P_MUTATE: 0.05,
      };
    if (totalUnits < 200)
      return {
        P_DUPLICATE: 0.7,
        P_NEW_INPUT: 0.15,
        P_POP: 0.1,
        P_MUTATE: 0.05,
      };
    return {
      P_DUPLICATE: 0.65,
      P_POP: 0.28,
      P_NEW_INPUT: 0.05,
      P_MUTATE: 0.02,
    };
  }
  function createWordBox(
    word: string,
    x: number,
    y: number,
    isGhost = false,
    isMutation = false
  ) {
    const container = document.getElementById(
      "cortex-container"
    ) as HTMLElement;
    if (!container || totalUnits >= UNIT_CAP) return;
    if (!uniqueWords.has(word) && uniqueWords.size >= MAX_UNIQUE_WORDS) return;
    const unitsToAdd = isGhost ? 10 : 1;
    totalUnits += unitsToAdd;
    if (isGhost) ghostWordCount++;
    if (isMutation) mutatedWordCount++;
    uniqueWords.add(word);
    wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    const wordBoxElement = document.createElement("div");
    wordBoxElement.className = isGhost ? "word-box ghost-box" : "word-box";
    wordBoxElement.textContent = word;
    container.appendChild(wordBoxElement);
    const { offsetWidth: boxWidth, offsetHeight: boxHeight } = wordBoxElement;
    let newX = x - boxWidth / 2;
    let newY = y - boxHeight / 2;
    newX = Math.max(0, Math.min(newX, container.clientWidth - boxWidth));
    newY = Math.max(0, Math.min(newY, container.clientHeight - boxHeight));
    wordBoxElement.style.left = `${newX}px`;
    wordBoxElement.style.top = `${newY}px`;
    const newWordBox: WordBox = {
      element: wordBoxElement,
      word,
      isGhost,
      x: newX,
      y: newY,
      dx: (Math.random() - 0.5) * 0.47,
      dy: (Math.random() - 0.5) * 0.47,
    };
    wordInstances.push(newWordBox);
    wordBoxElement.addEventListener("click", () =>
      handleInteraction(newWordBox)
    );
    updateAllStats();
  }
  function setupInitialInput(fadeIn = false) {
    const container = document.getElementById(
      "cortex-container"
    ) as HTMLElement;
    if (!container) return;
    const initialForm = document.createElement("form");
    initialForm.id = "initial-input-container";
    if (fadeIn) initialForm.classList.add("fade-in");
    initialForm.noValidate = true;
    const initialInput = document.createElement("input");
    initialInput.type = "text";
    initialInput.id = "word-input";
    initialInput.placeholder = "A word? A symbol?";
    initialInput.maxLength = MAX_WORD_LENGTH;
    initialForm.appendChild(initialInput);
    container.appendChild(initialForm);
    initialInput.focus();
    initialForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const word = initialInput.value.trim();
      if (word && !word.includes(" ")) {
        initialForm.remove();
        const { clientWidth, clientHeight } = container;
        createWordBox(word, clientWidth / 2, clientHeight / 2);
        resetInactivityTimer();
      }
    });
  }
  function createFloatingInputBox(x: number, y: number) {
    const container = document.getElementById(
      "cortex-container"
    ) as HTMLElement;
    if (!container) return;
    isInputBoxActive = true;
    const inputForm = document.createElement("form");
    inputForm.className = "floating-input-container";
    inputForm.noValidate = true;
    inputForm.style.top = `${y}px`;
    inputForm.style.left = `${x}px`;
    inputForm.style.transform = `translate(-50%, -50%)`;
    const tempInput = document.createElement("input");
    tempInput.type = "text";
    tempInput.className = "editable-input";
    tempInput.maxLength = MAX_WORD_LENGTH;
    tempInput.placeholder = "more...";
    inputForm.appendChild(tempInput);
    container.appendChild(inputForm);
    tempInput.focus();
    inputForm.addEventListener("submit", (e) => {
      e.preventDefault();
      resetInactivityTimer();
      const word = tempInput.value.trim();
      if (word && !word.includes(" ")) {
        if (!uniqueWords.has(word) && uniqueWords.size >= MAX_UNIQUE_WORDS) {
          tempInput.value = "";
          tempInput.placeholder = "Unique word limit!";
        } else {
          createWordBox(word, x, y);
          inputForm.remove();
          isInputBoxActive = false;
        }
      }
    });
  }
  function triggerMutation(x: number, y: number) {
    const timeSinceStart = gameHasStarted
      ? (Date.now() - gameStartTime) / 1000
      : 0;
    if (timeSinceStart < 150 || uniqueWords.size < 5 || totalUnits < 50) return;
    if (wordCounts.size < 2) return;
    const sortedWords = [...wordCounts.entries()].sort((a, b) => a[1] - b[1]);
    const leastDuplicatedWord = sortedWords[0][0];
    const highlyDuplicatedWord = sortedWords[sortedWords.length - 1][0];
    if (leastDuplicatedWord === highlyDuplicatedWord) return;
    const mutatedWord =
      `${highlyDuplicatedWord}_${leastDuplicatedWord}`.substring(
        0,
        MAX_WORD_LENGTH
      );
    createWordBox(mutatedWord, x, y, false, true);
    storeGhostWords();
  }
  function storeGhostWords() {
    if (wordCounts.size < 2) return;
    const sortedWords = [...wordCounts.entries()].sort((a, b) => a[1] - b[1]);
    const ghostData = {
      leastFrequent: sortedWords[0][0],
      mostFrequent: sortedWords[sortedWords.length - 1][0],
    };
    document.cookie = `cortexGhostWords=${JSON.stringify(
      ghostData
    )}; max-age=259200; path=/`;
  }
  function loadGhostWords() {
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("cortexGhostWords="));
    if (!cookie) return;
    try {
      const data = JSON.parse(cookie.split("=")[1]);
      const words = [data.leastFrequent, data.mostFrequent].filter(Boolean);
      if (words.length > 0) {
        const ghostSpawnDelay = 40000;
        setTimeout(() => {
          if (totalUnits >= UNIT_CAP) return;
          const container = document.getElementById(
            "cortex-container"
          ) as HTMLElement;
          if (!container) return;
          const wordToSpawn = words[Math.floor(Math.random() * words.length)];
          const x = Math.random() * container.clientWidth;
          const y = Math.random() * container.clientHeight;
          createWordBox(wordToSpawn, x, y, true);
        }, ghostSpawnDelay);
      }
    } catch (e) {
      console.error("Failed to parse ghost word cookie:", e);
    }
  }
  function resetInactivityTimer() {
    if (totalUnits >= UNIT_CAP || !gameHasStarted) return;
    if (inactivityTimer) clearTimeout(inactivityTimer);
    const initialWait = 10000;
    const subsequentMinWait = 15000;
    const subsequentMaxWait = 30000;
    const waitTime = hasInteracted
      ? Math.random() * (subsequentMaxWait - subsequentMinWait) +
        subsequentMinWait
      : initialWait;
    hasInteracted = true;
    inactivityTimer = setTimeout(triggerInactivityAction, waitTime);
  }
  function triggerInactivityAction() {
    if (wordInstances.length === 0 || totalUnits >= UNIT_CAP) return;
    const maxWordsToDuplicate = 5;
    const maxUnitsToGenerate = 50;
    let unitsGenerated = 0;
    const wordsToDuplicate = [...wordInstances]
      .sort(() => 0.5 - Math.random())
      .slice(0, maxWordsToDuplicate);
    for (const box of wordsToDuplicate) {
      if (
        unitsGenerated >= maxUnitsToGenerate ||
        totalUnits + unitsGenerated >= UNIT_CAP
      )
        break;
      createWordBox(box.word, box.x, box.y, box.isGhost);
      unitsGenerated += box.isGhost ? 10 : 1;
    }
    resetInactivityTimer();
  }

  // --- GAME STARTUP SEQUENCE ---
  function startGame() {
    if (gameHasStarted) return;
    unmuteCurrentLoop();
    gameHasStarted = true;
    gameStartTime = Date.now();
    stopAllLoops();
    playOneShot("clot_clicked.m4a");
    const clot = document.getElementById("clot") as HTMLElement;
    clot.classList.add("expand");
    clot.addEventListener(
      "transitionend",
      () => {
        const openingSequenceContainer = document.getElementById(
          "opening-sequence"
        ) as HTMLElement;
        const app = document.getElementById("app") as HTMLElement;
        openingSequenceContainer.classList.add("hidden");
        app.classList.remove("hidden");
        updateAllStats();
        setupInitialInput(true);
        loadGhostWords();
        resetInactivityTimer();
        animate();
      },
      { once: true }
    );
  }

  // Initial listener for the game part
  //const clot = document.getElementById('clot') as HTMLElement;
  clot.addEventListener("click", startGame, { once: true });
  startLoop("clotPulse.m4a", true);