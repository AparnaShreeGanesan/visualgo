function randomArray(size = 8, min = 3, max = 24) {
  return Array.from({ length: size }, () => Math.floor(Math.random() * (max - min + 1)) + min);
}

function renderArray(container, values, highlights = {}, useBars = false) {
  container.innerHTML = '';
  values.forEach((value, index) => {
    const item = document.createElement('div');
    item.className = 'array-item' + (useBars ? ' bar' : '');
    if (highlights.active?.includes(index)) item.classList.add('active');
    if (highlights.compare?.includes(index)) item.classList.add('compare');
    if (highlights.swap?.includes(index)) item.classList.add('swap');
    if (highlights.found?.includes(index)) item.classList.add('found');
    if (useBars) {
      item.style.height = `${value * 4 + 20}px`;
      item.textContent = value;
    } else {
      item.textContent = value;
    }
    container.appendChild(item);
  });
}

// Enhanced createStepper with pause/resume, speed control, and progress tracking
function createStepper({ stepFn, resetFn, logEl, renderFn, progressEl, counterEl, phaseEl, totalSteps = null, interval = 600 }) {
  let timer = null;
  let paused = false;
  let currentStep = 0;
  let isRunning = false;
  let speedMultiplier = 1;

  const getSpeedLabel = (value) => {
    if (value <= 2) return 'Very Slow';
    if (value <= 4) return 'Slow';
    if (value <= 6) return 'Normal';
    if (value <= 8) return 'Fast';
    return 'Very Fast';
  };

  const updateProgress = (stepResult) => {
    if (progressEl && totalSteps) {
      const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;
      progressEl.style.width = `${Math.min(progress, 100)}%`;
    }
    if (counterEl && totalSteps) {
      counterEl.textContent = `Step ${currentStep} / ${totalSteps}`;
    }
    if (phaseEl && stepResult?.phase) {
      phaseEl.textContent = stepResult.phase;
      phaseEl.classList.add('active');
    }
  };

  const runStep = () => {
    if (paused) return;

    const result = stepFn();
    currentStep++;

    if (result?.log && logEl) logEl.textContent = result.log;
    if (renderFn) renderFn(result);
    updateProgress(result);

    if (result?.done) {
      if (timer) clearInterval(timer);
      timer = null;
      isRunning = false;
      if (counterEl) counterEl.textContent = `Step ${totalSteps || currentStep} / ${totalSteps || currentStep}`;
    }
  };

  return {
    step: () => {
      if (timer) return;
      currentStep = 0;
      runStep();
    },
    run: () => {
      if (timer && !paused) return;
      if (timer && paused) {
        paused = false;
        return;
      }
      isRunning = true;
      paused = false;
      const baseInterval = interval;
      const adjustedInterval = baseInterval / speedMultiplier;
      timer = setInterval(runStep, Math.max(100, adjustedInterval));
    },
    pause: () => {
      paused = true;
      if (phaseEl) phaseEl.classList.remove('active');
    },
    reset: () => {
      if (timer) clearInterval(timer);
      timer = null;
      paused = false;
      currentStep = 0;
      isRunning = false;
      resetFn();
      const result = stepFn(true);
      if (result?.log && logEl) logEl.textContent = result.log;
      if (renderFn) renderFn(result);
      if (progressEl) progressEl.style.width = '0%';
      if (counterEl) counterEl.textContent = `Step 0 / ${totalSteps || '?'}`;
      if (phaseEl) {
        phaseEl.textContent = '';
        phaseEl.classList.remove('active');
      }
    },
    setSpeed: (value) => {
      speedMultiplier = value / 5;
      if (timer) {
        clearInterval(timer);
        const baseInterval = interval;
        const adjustedInterval = baseInterval / speedMultiplier;
        timer = setInterval(runStep, Math.max(100, adjustedInterval));
      }
    },
    isRunning: () => isRunning && !paused,
    isPaused: () => paused && !!timer
  };
}

// Speed slider handler
function initSpeedControl() {
  const speedSlider = document.getElementById('speedSlider');
  const speedLabel = document.getElementById('speedLabel');
  if (!speedSlider || !speedLabel) return;

  speedSlider.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    speedLabel.textContent = ['Very Slow', 'Slow', 'Normal', 'Fast', 'Very Fast'][Math.floor(value / 2) - 1] || 'Normal';
  });
}

// Keyboard shortcuts
function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Don't trigger if user is typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.code === 'Space') {
      e.preventDefault();
      // Trigger step on all algorithms
      document.querySelectorAll('[id$="Step"]').forEach(btn => {
        if (!btn.closest('.visualizer')?.querySelector('[id$="Run"]')) return;
        btn.click();
      });
    } else if (e.code === 'Enter') {
      e.preventDefault();
      // Toggle run/pause on all algorithms
      document.querySelectorAll('[id$="Run"]').forEach(btn => {
        const visualizer = btn.closest('.visualizer');
        if (!visualizer) return;
        const pauseBtn = visualizer.querySelector('[id$="Pause"]');
        if (pauseBtn) {
          if (btn.classList.contains('running')) {
            pauseBtn.click();
          } else {
            btn.click();
          }
        }
      });
    }
  });
}

// Global controls
function initGlobalControls() {
  document.getElementById('globalRun')?.addEventListener('click', () => {
    document.querySelectorAll('[id$="Run"]').forEach(btn => btn.click());
  });
  document.getElementById('globalStep')?.addEventListener('click', () => {
    document.querySelectorAll('[id$="Step"]').forEach(btn => btn.click());
  });
  document.getElementById('globalPause')?.addEventListener('click', () => {
    document.querySelectorAll('[id$="Pause"]').forEach(btn => btn.click());
  });
  document.getElementById('globalReset')?.addEventListener('click', () => {
    document.querySelectorAll('[id$="Reset"]').forEach(btn => btn.click());
  });
}

function initLinearSearch() {
  const container = document.querySelector('#linearArray');
  if (!container) return;
  const targetInput = document.querySelector('#linearTarget');
  const logEl = document.querySelector('#linearLog');
  const progressEl = document.querySelector('#linearProgress');
  const counterEl = document.querySelector('#linearCounter');
  const phaseEl = document.querySelector('#linearPhase');
  let state = {};

  function reset() {
    state = {
      arr: randomArray(10, 1, 30),
      idx: 0,
      found: false,
      done: false
    };
    targetInput.value = state.arr[Math.floor(Math.random() * state.arr.length)];
  }

  function step(firstRender = false) {
    if (firstRender) {
      return {
        done: false,
        log: 'Linear search checks each item one by one from left to right.',
        phase: 'Ready'
      };
    }
    if (state.done) return { done: true, log: 'Search completed.', phase: 'Done' };
    const target = Number(targetInput.value);
    const currentIndex = state.idx;
    const current = state.arr[currentIndex];
    const log = `Check index ${currentIndex}. If ${current} is the target, we stop.`;
    if (current === target) {
      state.found = true;
      state.done = true;
      return {
        done: true,
        log: `Found ${target} at index ${currentIndex}.`,
        highlights: { found: [currentIndex] },
        phase: 'Found!'
      };
    }
    state.idx += 1;
    if (state.idx >= state.arr.length) {
      state.done = true;
      return { done: true, log: `We reached the end. ${target} is not in the array.`, phase: 'Not Found' };
    }
    return {
      done: false,
      log,
      highlights: { active: [currentIndex] },
      phase: 'Scanning...'
    };
  }

  function render(result) {
    const highlights = result?.highlights ?? { active: [state.idx] };
    renderArray(container, state.arr, highlights, false);
  }

  reset();
  render({ highlights: { active: [0] } });

  const stepper = createStepper({
    stepFn: step,
    resetFn: reset,
    logEl,
    renderFn: render,
    progressEl,
    counterEl,
    phaseEl,
    totalSteps: state.arr.length + 1,
    interval: 500
  });

  // Pause button handler
  document.querySelector('#linearPause')?.addEventListener('click', () => stepper.pause());

  document.querySelector('#linearGenerate').addEventListener('click', () => {
    reset();
    render({ highlights: { active: [0] } });
    logEl.textContent = 'New array generated.';
    counterEl.textContent = 'Step 0 / ' + (state.arr.length + 1);
    progressEl.style.width = '0%';
  });
  document.querySelector('#linearStep').addEventListener('click', () => stepper.step());
  document.querySelector('#linearRun').addEventListener('click', () => stepper.run());
  document.querySelector('#linearReset').addEventListener('click', () => stepper.reset());

  // Set speed control
  document.getElementById('speedSlider')?.addEventListener('input', (e) => {
    stepper.setSpeed(parseInt(e.target.value));
  });

  setTimeout(() => stepper.run(), 800);
}

function initBinarySearch() {
  const container = document.querySelector('#binaryArray');
  if (!container) return;
  const targetInput = document.querySelector('#binaryTarget');
  const logEl = document.querySelector('#binaryLog');
  const progressEl = document.querySelector('#binaryProgress');
  const counterEl = document.querySelector('#binaryCounter');
  const phaseEl = document.querySelector('#binaryPhase');
  let state = {};
  let totalPossibleSteps = 0;

  function reset() {
    state = {
      arr: randomArray(10, 1, 40).sort((a, b) => a - b),
      low: 0,
      high: 9,
      done: false
    };
    targetInput.value = state.arr[Math.floor(Math.random() * state.arr.length)];
    totalPossibleSteps = Math.ceil(Math.log2(state.arr.length)) + 1;
  }

  function step(firstRender = false) {
    if (firstRender) {
      return { done: false, log: 'Binary search always checks the middle of a sorted array.', phase: 'Ready' };
    }
    if (state.done) return { done: true, log: 'Search completed.', phase: 'Done' };
    if (state.low > state.high) {
      state.done = true;
      return { done: true, log: `Low passed high. ${targetInput.value} is not in this sorted list.`, phase: 'Not Found' };
    }
    const mid = Math.floor((state.low + state.high) / 2);
    const target = Number(targetInput.value);
    const value = state.arr[mid];
    if (value === target) {
      state.done = true;
      return {
        done: true,
        log: `Found ${target} at index ${mid}.`,
        highlights: { found: [mid] },
        phase: 'Found!'
      };
    }
    if (value < target) {
      state.low = mid + 1;
      return {
        done: false,
        log: `${value} is smaller than ${target}. Ignore the left half and go right.`,
        highlights: { active: [mid], compare: [state.low, state.high] },
        phase: 'Go Right'
      };
    }
    state.high = mid - 1;
    return {
      done: false,
      log: `${value} is larger than ${target}. Ignore the right half and go left.`,
      highlights: { active: [mid], compare: [state.low, state.high] },
      phase: 'Go Left'
    };
  }

  function render(result) {
    const highlights = result?.highlights ?? { active: [] };
    renderArray(container, state.arr, highlights, false);
  }

  reset();
  render({});

  const stepper = createStepper({
    stepFn: step,
    resetFn: reset,
    logEl,
    renderFn: render,
    progressEl,
    counterEl,
    phaseEl,
    totalSteps: totalPossibleSteps,
    interval: 600
  });

  document.querySelector('#binaryPause')?.addEventListener('click', () => stepper.pause());

  document.querySelector('#binaryGenerate').addEventListener('click', () => {
    reset();
    render({});
    logEl.textContent = 'New sorted array generated.';
    counterEl.textContent = 'Step 0 / ' + totalPossibleSteps;
    progressEl.style.width = '0%';
  });
  document.querySelector('#binaryStep').addEventListener('click', () => stepper.step());
  document.querySelector('#binaryRun').addEventListener('click', () => stepper.run());
  document.querySelector('#binaryReset').addEventListener('click', () => stepper.reset());

  document.getElementById('speedSlider')?.addEventListener('input', (e) => {
    stepper.setSpeed(parseInt(e.target.value));
  });

  setTimeout(() => stepper.run(), 800);
}

function createSortSteps(arr, algorithm) {
  const steps = [];
  const values = arr.slice();

  function pushStep(highlights = {}, log = '') {
    steps.push({ snapshot: values.slice(), highlights, log });
  }

  if (algorithm === 'bubble') {
    for (let i = 0; i < values.length; i += 1) {
      for (let j = 0; j < values.length - i - 1; j += 1) {
        pushStep({ compare: [j, j + 1] }, `Compare neighbors ${values[j]} and ${values[j + 1]}.`);
        if (values[j] > values[j + 1]) {
          [values[j], values[j + 1]] = [values[j + 1], values[j]];
          pushStep({ swap: [j, j + 1] }, `Swap because the left value is bigger.`);
        }
      }
    }
  }

  if (algorithm === 'insertion') {
    for (let i = 1; i < values.length; i += 1) {
      const key = values[i];
      let j = i - 1;
      pushStep({ active: [i] }, `Pick ${key} and insert it into the correct spot on the left.`);
      while (j >= 0 && values[j] > key) {
        values[j + 1] = values[j];
        pushStep({ swap: [j, j + 1] }, `Shift ${values[j]} right to make space.`);
        j -= 1;
      }
      values[j + 1] = key;
      pushStep({ active: [j + 1] }, `Place ${key} into its final spot.`);
    }
  }

  if (algorithm === 'quick') {
    const stack = [{ low: 0, high: values.length - 1 }];
    while (stack.length) {
      const { low, high } = stack.pop();
      if (low >= high) continue;
      const pivot = values[high];
      let i = low;
      pushStep({ active: [high] }, `Choose pivot ${pivot}.`);
      for (let j = low; j < high; j += 1) {
        pushStep({ compare: [j, high] }, `Compare ${values[j]} with pivot ${pivot}.`);
        if (values[j] < pivot) {
          [values[i], values[j]] = [values[j], values[i]];
          pushStep({ swap: [i, j] }, `Move smaller value to the left side.`);
          i += 1;
        }
      }
      [values[i], values[high]] = [values[high], values[i]];
      pushStep({ swap: [i, high] }, `Place pivot in its correct position.`);
      stack.push({ low, high: i - 1 });
      stack.push({ low: i + 1, high });
    }
  }

  if (algorithm === 'heap') {
    const n = values.length;

    function heapify(size, root) {
      let largest = root;
      const left = 2 * root + 1;
      const right = 2 * root + 2;
      if (left < size && values[left] > values[largest]) largest = left;
      if (right < size && values[right] > values[largest]) largest = right;
      if (largest !== root) {
        [values[root], values[largest]] = [values[largest], values[root]];
        pushStep({ swap: [root, largest] }, `Heapify: swap to keep the largest on top.`);
        heapify(size, largest);
      }
    }

    for (let i = Math.floor(n / 2) - 1; i >= 0; i -= 1) {
      heapify(n, i);
    }

    for (let i = n - 1; i > 0; i -= 1) {
      [values[0], values[i]] = [values[i], values[0]];
      pushStep({ swap: [0, i] }, `Move the largest value to the end (index ${i}).`);
      heapify(i, 0);
    }
  }

  pushStep({}, 'Sorting complete.');
  return steps;
}

function createSortSection(prefix, algorithm) {
  const container = document.querySelector(`#${prefix}Array`);
  if (!container) return;
  const logEl = document.querySelector(`#${prefix}Log`);
  const progressEl = document.querySelector(`#${prefix}Progress`);
  const counterEl = document.querySelector(`#${prefix}Counter`);
  const phaseEl = document.querySelector(`#${prefix}Phase`);
  let state = {
    arr: [],
    steps: [],
    stepIndex: 0
  };

  function reset() {
    state.arr = randomArray(10, 2, 25);
    state.steps = createSortSteps(state.arr, algorithm);
    state.stepIndex = 0;
  }

  function step(firstRender = false) {
    if (firstRender) {
      return { log: 'Ready to sort.', phase: 'Ready' };
    }
    if (state.stepIndex >= state.steps.length) return { done: true, log: 'Sorting completed.', phase: 'Done' };
    const data = state.steps[state.stepIndex];
    state.stepIndex += 1;
    return {
      done: state.stepIndex >= state.steps.length,
      log: data.log,
      snapshot: data.snapshot,
      highlights: data.highlights,
      phase: state.stepIndex >= state.steps.length ? 'Complete' : 'Sorting...'
    };
  }

  function render(result) {
    const snapshot = result?.snapshot ?? state.arr;
    renderArray(container, snapshot, result?.highlights ?? {}, true);
  }

  reset();
  render({ snapshot: state.arr });

  const stepper = createStepper({
    stepFn: step,
    resetFn: reset,
    logEl,
    renderFn: render,
    progressEl,
    counterEl,
    phaseEl,
    totalSteps: state.steps.length,
    interval: 500
  });

  document.querySelector(`#${prefix}Pause`)?.addEventListener('click', () => stepper.pause());

  document.querySelector(`#${prefix}Generate`).addEventListener('click', () => {
    reset();
    render({ snapshot: state.arr });
    logEl.textContent = 'New array generated.';
    counterEl.textContent = 'Step 0 / ' + state.steps.length;
    progressEl.style.width = '0%';
  });
  document.querySelector(`#${prefix}Step`).addEventListener('click', () => stepper.step());
  document.querySelector(`#${prefix}Run`).addEventListener('click', () => stepper.run());
  document.querySelector(`#${prefix}Reset`).addEventListener('click', () => stepper.reset());

  document.getElementById('speedSlider')?.addEventListener('input', (e) => {
    stepper.setSpeed(parseInt(e.target.value));
  });

  setTimeout(() => stepper.run(), 800);
}

function initRecursion() {
  const stackEl = document.querySelector('#recursionStack');
  const treeEl = document.querySelector('#recursionTree');
  const inputEl = document.querySelector('#recursionInput');
  const logEl = document.querySelector('#recursionLog');
  const editor = document.querySelector('#recursionEditor');
  const runBtn = document.querySelector('#runUserCode');
  const progressEl = document.querySelector('#recursionProgress');
  const counterEl = document.querySelector('#recursionCounter');
  const phaseEl = document.querySelector('#recursionPhase');

  if (!stackEl || !treeEl) return;

  let steps = [];
  let index = 0;

  class RecursionTracer {
    constructor() {
      this.events = [];
      this.callIdCounter = 0;
    }

    reset() {
      this.events = [];
      this.callIdCounter = 0;
    }

    // This function will be called by the user's code
    traceCall(fnName, args, depth) {
      const id = this.callIdCounter++;
      this.events.push({ type: 'CALL', id, fnName, args, depth });
      return id;
    }

    traceReturn(id, returnValue, depth) {
      this.events.push({ type: 'RETURN', id, returnValue, depth });
    }
  }

  const tracer = new RecursionTracer();

  // Helper to visualize the tree from events up to a certain point
  function buildTreeState(events, limitIndex) {
    const nodes = [];
    const edges = [];
    const activeStack = []; // Stack of node IDs
    const nodesMap = new Map();

    for (let i = 0; i <= limitIndex; i++) {
      const e = events[i];
      if (e.type === 'CALL') {
        const node = {
          id: e.id,
          label: `f(${e.args.join(', ')})`,
          depth: e.depth,
          status: 'active', // active, done, returning
          x: 0,
          y: e.depth * 80 + 50,
          parentId: activeStack.length > 0 ? activeStack[activeStack.length - 1] : null
        };

        // Calculate X Position (Basic Layout)
        // A simple way is to shift siblings based on count. 
        // Better: use a global counter per depth or simple breadth shift
        // For this version: shift right for every new node at depth, reuse space if parent is different?
        // Let's use a simple per-depth counter.
        if (!nodesMap.has(e.depth)) nodesMap.set(e.depth, 0);
        const offset = nodesMap.get(e.depth);
        node.x = offset * 70 + (e.depth % 2 === 0 ? 0 : 35); // Stagger
        nodesMap.set(e.depth, offset + 1);

        // Center alignment attempt:
        // Adjust X by parent's X? 
        // Implementing a proper Reingold-Tilford is too complex for this snippet.
        // Simplified: Just place strictly by call order and depth for now, visuals will be a bit "list-like" but structural.
        // Let's try: X = (index_at_depth * 80) + (depth * 20)
        node.x = nodesMap.get(e.depth) * 80;

        nodes.push(node);
        activeStack.push(e.id);

        if (node.parentId !== null) {
          edges.push({ from: node.parentId, to: e.id });
        }
      } else if (e.type === 'RETURN') {
        const node = nodes.find(n => n.id === e.id);
        if (node) {
          node.status = 'returning';
          node.result = e.returnValue;
          node.label += `\n→ ${e.returnValue}`;
        }
        activeStack.pop();
      }
    }

    // Highlight the very last action
    const lastEvent = events[limitIndex];
    const log = lastEvent.type === 'CALL'
      ? `Called f(${lastEvent.args})`
      : `Returned ${lastEvent.returnValue}`;

    // Mark top of stack active
    const activeId = lastEvent.type === 'CALL' ? lastEvent.id : (activeStack.length > 0 ? activeStack[activeStack.length - 1] : null);

    return { nodes, edges, log, activeId, stack: nodes.filter(n => n.status === 'active') };
  }

  function executeUserCode() {
    const rawCode = editor.value;
    const inputVal = Number(inputEl.value) || 4;

    try {
      tracer.reset();

      // 1. Extract function name
      const match = rawCode.match(/function\s+(\w+)/);
      if (!match) throw new Error("Could not find function name. Please use 'function name() { ... }'");
      const fnName = match[1];

      // 2. Instrument Code
      // Replace function calls: name(...) -> _trace_name(...)
      // We wrap the body to inject the tracer.
      // Actually, best way: Rename user function to _internal_name
      // Create a wrapper 'name' that calls _internal_name
      // Inside _internal_name, replace recursive calls to 'name' with wrapper.

      // Simpler: Regex replace all `fnName(` with `__tracked_${fnName}(`
      // And inject the definition of `__tracked_...`

      const instrumName = `__act_${fnName}`;

      // This regex is naive but works for `fn(` calls. 
      // Need to be careful not to replace `function fn(`.
      // Negative lookbehind isn't fully supported in all browsers, so we use a simpler approach.
      let instrumentedBody = rawCode.replace(new RegExp(`\\b${fnName}\\s*\\(`, 'g'), `${instrumName}(`);

      // Fix the declaration back
      instrumentedBody = instrumentedBody.replace(`function ${instrumName}`, `function ${instrumName}`);

      // Inject Try/Finally for return logging
      // This requires parsing braces. Too risky with regex.
      // ALTERNATIVE:
      // Assume user writes standard JS. We append a wrapper.
      // We override the function name in the scope.

      const wrapperCode = `
            const _orig_${fnName} = ${rawCode}; // User's code as function expression? No, straightforward definition.
            
            // We need to re-eval the user code so it references OUR wrapper for recursion.
            // To do this, we wrap it all in a closure where we define the function name.
            
            return (function() {
                let _depth = -1;
                
                ${rawCode} // Defines function fnName(...) {}
                
                const _real_${fnName} = ${fnName};
                
                // Override
                ${fnName} = function(...args) {
                    _depth++;
                    const _id = tracer.traceCall('${fnName}', args, _depth);
                    try {
                        const res = _real_${fnName}.apply(this, args);
                        tracer.traceReturn(_id, res, _depth);
                        _depth--;
                        return res;
                    } catch (e) {
                         _depth--;
                        throw e;
                    }
                };
                
                // Start
                return ${fnName}(${inputVal});
            })();
        `;

      // Execution
      // We use new Function to create a scope with 'tracer'.
      const runner = new Function('tracer', wrapperCode);
      runner(tracer);

      // Generate Steps from Tracer Events
      steps = tracer.events.map((_, i) => buildTreeState(tracer.events, i));
      index = 0;

      logEl.textContent = `Execution successful. Generated ${steps.length} steps.`;
      logEl.style.color = 'var(--text-muted)';

    } catch (err) {
      logEl.textContent = `Error: ${err.message}`;
      logEl.style.color = 'var(--danger)';
      console.error(err);
      steps = [];
    }
  }

  function render(step) {
    if (!step) return;

    // Render Logic Log
    logEl.textContent = step.log;

    // Render Stack (List View)
    stackEl.innerHTML = '';
    // Reverse stack for "top is top" visual
    [...step.stack].reverse().forEach((item, idx) => {
      const div = document.createElement('div');
      div.className = 'stack-item';
      if (item.id === step.activeId) div.classList.add('top');
      div.textContent = item.label;
      stackEl.appendChild(div);
    });

    // Render Tree (Nodes + Edges)
    treeEl.innerHTML = '';

    // SVG Container for edges
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute('class', 'tree-edge');
    // Set explicit size large enough
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    treeEl.appendChild(svg);

    // Calculate centering offset
    // Find min/max X to center the tree in the view
    if (step.nodes.length > 0) {
      const minX = Math.min(...step.nodes.map(n => n.x));
      const maxX = Math.max(...step.nodes.map(n => n.x));
      const treeWidth = maxX - minX;
      const containerWidth = treeEl.clientWidth || 600;
      const offsetX = (containerWidth - treeWidth) / 2 - minX;

      step.edges.forEach(edge => {
        const from = step.nodes.find(n => n.id === edge.from);
        const to = step.nodes.find(n => n.id === edge.to);
        if (from && to) {
          const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
          line.setAttribute('x1', from.x + 25 + offsetX);
          line.setAttribute('y1', from.y + 25);
          line.setAttribute('x2', to.x + 25 + offsetX);
          line.setAttribute('y2', to.y + 25);
          line.setAttribute('class', 'edge-path' + (to.id === step.activeId ? ' active' : ''));
          svg.appendChild(line);
        }
      });

      step.nodes.forEach(node => {
        const div = document.createElement('div');
        div.className = `tree-node ${node.status}`;
        if (node.id === step.activeId) div.classList.add('active');
        div.style.left = `${node.x + offsetX}px`;
        div.style.top = `${node.y}px`;
        div.innerText = node.status === 'returning' ? node.result : node.label.replace('f(', '').replace(')', '');
        // Tooltip for full label
        div.title = node.label;
        treeEl.appendChild(div);
      });
    }
  }

  // Initial Run
  executeUserCode();
  render(steps[0]);

  const stepper = createStepper({
    stepFn: () => {
      if (index >= steps.length) return { done: true, log: 'Complete.', phase: 'Done' };
      const step = steps[index];
      index += 1;
      render(step);
      return { done: index >= steps.length, log: step.log, phase: index >= steps.length ? 'Complete' : 'Running...' };
    },
    resetFn: () => {
      index = 0;
      render(steps[0]);
    },
    // We handle custom rendering in the stepFn wrapper or here?
    // The createStepper expects renderFn to be called.
    renderFn: null, // We called it manually above
    logEl,
    progressEl,
    counterEl,
    phaseEl,
    totalSteps: steps.length, // Dynamic!
    interval: 800
  });

  // Re-hook Run Button
  runBtn.addEventListener('click', () => {
    executeUserCode();
    stepper.reset(); // Effectively resets with new steps length
    // Need to update totalSteps in stepper? createStepper doesn't expose it easily.
    // We'll just recreate the stepper or ignore totalSteps limit (it uses .length on check).
    // Actually createStepper reads totalSteps from options once. 
    // A quick fix is to update the counter manually or restart navigation.
    // For this simplified implementation, we just reset the index.
    counterEl.textContent = `Step 0 / ${steps.length}`;
    logEl.textContent = "New code loaded. Click Run.";
  });

  document.querySelector('#recursionPause')?.addEventListener('click', () => stepper.pause());
  document.querySelector('#recursionRun').addEventListener('click', () => stepper.run());
  document.querySelector('#recursionStep').addEventListener('click', () => stepper.step());
  document.querySelector('#recursionReset').addEventListener('click', () => stepper.reset());
}

function initBacktracking() {
  const boardEl = document.querySelector('#backtrackingBoard');
  const stackEl = document.querySelector('#backtrackingStack');
  if (!boardEl) return;
  const logEl = document.querySelector('#backtrackingLog');
  const codeEl = document.querySelector('#backtrackingCode');
  const phaseEl = document.querySelector('#backtrackingPhase');
  let steps = [];
  let index = 0;
  const size = 4;

  function buildSteps() {
    const board = Array.from({ length: size }, () => Array(size).fill(0));
    const newSteps = [];

    function solve(row, currentStack) {
      // 1. Enter function
      const stackEntry = `solve(${row})`;
      const stack = [...currentStack, stackEntry];

      newSteps.push({
        board: board.map(r => r.slice()),
        stack: stack,
        log: `Called solve(${row}). Check if row == N.`,
        active: [row, -1], // Highlight row
        line: 1,
        phase: 'Recursion'
      });

      // 2. Base case check
      if (row === size) {
        newSteps.push({
          board: board.map(r => r.slice()),
          stack: stack,
          log: `Row ${row} == N. Solution found!`,
          line: 2,
          phase: 'Found!'
        });
        return true;
      }

      // 3. Loop through columns
      for (let col = 0; col < size; col += 1) {
        newSteps.push({
          board: board.map(r => r.slice()),
          stack: stack,
          log: `Try placing Queen at (${row}, ${col}).`,
          active: [row, col],
          line: 3,
          phase: 'Try Place'
        });

        // 4. Check safety
        newSteps.push({
          board: board.map(r => r.slice()),
          stack: stack,
          log: `Is (${row}, ${col}) safe?`,
          active: [row, col],
          line: 4,
          phase: 'Check Safe'
        });

        if (isSafe(board, row, col)) {
          // 5. Place Queen
          board[row][col] = 1;
          newSteps.push({
            board: board.map(r => r.slice()),
            stack: stack,
            log: `Safe! Place Q at (${row}, ${col}). Recurse to row ${row + 1}.`,
            active: [row, col],
            line: 5,
            phase: 'Place & Recurse'
          });

          // 6. Recurse
          if (solve(row + 1, stack)) {
            return true;
          }

          // 7. Backtrack
          board[row][col] = 0;
          newSteps.push({
            board: board.map(r => r.slice()),
            stack: stack,
            log: `Backtrack from row ${row + 1}. Remove Q at (${row}, ${col}).`,
            active: [row, col],
            line: 7,
            phase: 'Backtrack'
          });
        }
      }

      // 8. Return False
      newSteps.push({
        board: board.map(r => r.slice()),
        stack: stack,
        log: `No valid column in row ${row}. Return False.`,
        line: 8,
        phase: 'Return False'
      });
      return false;
    }

    solve(0, []);
    return newSteps;
  }

  function isSafe(board, row, col) {
    for (let i = 0; i < row; i++) if (board[i][col]) return false;
    for (let i = row - 1, j = col - 1; i >= 0 && j >= 0; i--, j--) if (board[i][j]) return false;
    for (let i = row - 1, j = col + 1; i >= 0 && j < size; i--, j++) if (board[i][j]) return false;
    return true;
  }

  function reset() {
    steps = buildSteps();
    index = 0;
  }

  function render(step) {
    // Render Board
    boardEl.innerHTML = '';
    step.board.forEach((row, r) => {
      const rowEl = document.createElement('div');
      rowEl.style.display = 'flex';
      rowEl.style.gap = '4px';
      row.forEach((cell, c) => {
        const cellEl = document.createElement('div');
        cellEl.className = 'glass';
        cellEl.style.width = '40px';
        cellEl.style.height = '40px';
        cellEl.style.display = 'flex';
        cellEl.style.justifyContent = 'center';
        cellEl.style.alignItems = 'center';
        cellEl.style.fontSize = '1.2rem';

        // Checkerboard pattern opacity
        if ((r + c) % 2 === 1) cellEl.style.background = 'rgba(255,255,255,0.05)';

        if (cell === 1) {
          cellEl.textContent = '♛';
          cellEl.style.color = '#fff';
          cellEl.style.background = 'rgba(16, 185, 129, 0.5)'; // Success green for placed queen
          cellEl.style.boxShadow = '0 0 10px rgba(16, 185, 129, 0.5)';
        }

        if (step.active && step.active[0] === r && step.active[1] === c) {
          cellEl.style.borderColor = 'var(--primary)';
          if (cell !== 1) cellEl.style.background = 'rgba(14, 165, 233, 0.3)';
        }

        rowEl.appendChild(cellEl);
      });
      boardEl.appendChild(rowEl);
    });

    // Render Stack
    if (stackEl) {
      stackEl.innerHTML = '';
      // Reverse stack to show top-down
      [...step.stack].reverse().forEach(call => {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.style.padding = '8px';
        div.style.borderLeft = '2px solid var(--primary)';
        div.style.background = 'rgba(255,255,255,0.05)';
        div.textContent = call;
        stackEl.appendChild(div);
      });
    }

    // Render Log & Phase
    logEl.textContent = step.log;
    if (phaseEl) phaseEl.textContent = step.phase;

    // Highlight Code
    if (codeEl) {
      codeEl.querySelectorAll('.code-line').forEach(l => {
        l.classList.remove('active');
        l.style.background = 'transparent';
      });
      if (step.line) {
        const activeLine = codeEl.querySelector(`[data-line="${step.line}"]`);
        if (activeLine) {
          activeLine.classList.add('active');
          activeLine.setAttribute('style', 'background: rgba(14, 165, 233, 0.15); border-left: 2px solid var(--primary); display: block; width: 100%;');
        }
      }
    }
  }

  reset();
  render(steps[0]);

  const stepper = createStepper({
    stepFn: () => {
      if (index >= steps.length - 1) return { done: true, log: 'Complete.', phase: 'Done' };
      index++;
      render(steps[index]);
      return { done: false, log: steps[index].log };
    },
    resetFn: reset,
    logEl,
    interval: 800
  });

  document.querySelector('#backtrackingStep')?.addEventListener('click', () => stepper.step());
  document.querySelector('#backtrackingRun')?.addEventListener('click', () => stepper.run());
  document.querySelector('#backtrackingPause')?.addEventListener('click', () => stepper.pause());
  document.querySelector('#backtrackingReset')?.addEventListener('click', () => stepper.reset());
}

function initLinkedList() {
  const listEl = document.querySelector('#linkedList');
  if (!listEl) return;
  const inputEl = document.querySelector('#linkedInput');
  const logEl = document.querySelector('#linkedLog');
  let list = [5, 12, 7];

  function render(highlightValue) {
    listEl.innerHTML = '';
    list.forEach((value, index) => {
      const node = document.createElement('div');
      node.className = 'list-item';
      node.textContent = value;
      if (highlightValue === value) node.style.background = 'rgba(159, 232, 112, 0.4)';
      listEl.appendChild(node);
      if (index < list.length - 1) {
        const arrow = document.createElement('div');
        arrow.textContent = '→';
        arrow.style.textAlign = 'center';
        listEl.appendChild(arrow);
      }
    });
  }

  function add() {
    const value = Number(inputEl.value);
    if (Number.isNaN(value)) return;
    list.push(value);
    logEl.textContent = `Inserted ${value} at tail.`;
    render();
    addXP(5, 'Linked list insert');
  }

  function remove() {
    const value = Number(inputEl.value);
    const index = list.indexOf(value);
    if (index === -1) {
      logEl.textContent = `${value} not found in list.`;
      return;
    }
    list.splice(index, 1);
    logEl.textContent = `Removed ${value} from list.`;
    render();
  }

  function search() {
    const value = Number(inputEl.value);
    const found = list.includes(value);
    logEl.textContent = found ? `Found ${value} in list.` : `${value} not in list.`;
    render(found ? value : null);
  }

  render();
  document.querySelector('#linkedAdd').addEventListener('click', add);
  document.querySelector('#linkedRemove').addEventListener('click', remove);
  document.querySelector('#linkedSearch').addEventListener('click', search);
}

function initStackQueue() {
  const stackEl = document.querySelector('#stackView');
  const queueEl = document.querySelector('#queueView');
  if (!stackEl || !queueEl) return;
  const inputEl = document.querySelector('#stackQueueInput');
  const stackLog = document.querySelector('#stackLog');
  const queueLog = document.querySelector('#queueLog');
  const coachEl = document.querySelector('#stackCoach');
  const stack = [3, 7, 11];
  const queue = [2, 4, 6];
  let lastAction = '';

  function render() {
    stackEl.innerHTML = '';
    [...stack].forEach((item, idx) => {
      const div = document.createElement('div');
      div.className = 'stack-item';
      if (idx === stack.length - 1) {
        div.classList.add('top');
        if (lastAction === 'push') div.classList.add('enter');
        if (lastAction === 'pop') div.classList.add('pop');
      }
      div.textContent = item;
      stackEl.appendChild(div);
    });
    queueEl.innerHTML = '';
    queue.forEach((item) => {
      const div = document.createElement('div');
      div.className = 'list-item';
      div.textContent = item;
      queueEl.appendChild(div);
    });
  }

  function pushStack() {
    const value = Number(inputEl.value);
    if (Number.isNaN(value)) return;
    stack.push(value);
    stackLog.textContent = `Push ${value}.`;
    if (coachEl) coachEl.textContent = `Coach: ${value} is added on top. Last in, first out.`;
    lastAction = 'push';
    render();
    setTimeout(() => {
      lastAction = '';
      render();
    }, 360);
  }

  function popStack() {
    if (stack.length === 0) return;
    const value = stack[stack.length - 1];
    stackLog.textContent = `Pop ${value}.`;
    if (coachEl) coachEl.textContent = `Coach: ${value} was on top, so it leaves first.`;
    lastAction = 'pop';
    render();
    setTimeout(() => {
      stack.pop();
      lastAction = '';
      render();
    }, 360);
  }

  function enqueue() {
    const value = Number(inputEl.value);
    if (Number.isNaN(value)) return;
    queue.push(value);
    queueLog.textContent = `Enqueue ${value}.`;
    if (coachEl) coachEl.textContent = `Coach: Queue adds to the back. First in, first out.`;
    render();
  }

  function dequeue() {
    if (queue.length === 0) return;
    const value = queue.shift();
    queueLog.textContent = `Dequeue ${value}.`;
    if (coachEl) coachEl.textContent = `Coach: ${value} leaves from the front of the queue.`;
    render();
  }

  render();
  document.querySelector('#stackPush').addEventListener('click', pushStack);
  document.querySelector('#stackPop').addEventListener('click', popStack);
  document.querySelector('#queueEnqueue').addEventListener('click', enqueue);
  document.querySelector('#queueDequeue').addEventListener('click', dequeue);
}

function initTrees() {
  const treeEl = document.querySelector('#treeView');
  if (!treeEl) return;
  const inputEl = document.querySelector('#treeInput');
  const logEl = document.querySelector('#treeLog');
  let root = null;

  function insert(value) {
    if (!root) {
      root = { value, left: null, right: null };
      return;
    }
    let node = root;
    while (node) {
      if (value < node.value) {
        if (!node.left) {
          node.left = { value, left: null, right: null };
          return;
        }
        node = node.left;
      } else {
        if (!node.right) {
          node.right = { value, left: null, right: null };
          return;
        }
        node = node.right;
      }
    }
  }

  function search(value) {
    let node = root;
    while (node) {
      if (node.value === value) return true;
      node = value < node.value ? node.left : node.right;
    }
    return false;
  }

  function render() {
    treeEl.innerHTML = '';
    if (!root) return;
    const queue = [{ node: root, level: 0 }];
    const levels = [];
    while (queue.length) {
      const { node, level } = queue.shift();
      if (!levels[level]) levels[level] = [];
      levels[level].push(node.value);
      if (node.left) queue.push({ node: node.left, level: level + 1 });
      if (node.right) queue.push({ node: node.right, level: level + 1 });
    }
    levels.forEach((values) => {
      const row = document.createElement('div');
      row.className = 'tree-level';
      values.forEach((value) => {
        const nodeEl = document.createElement('div');
        nodeEl.className = 'node';
        nodeEl.textContent = value;
        row.appendChild(nodeEl);
      });
      treeEl.appendChild(row);
    });
  }

  [15, 8, 20, 5, 10, 18, 25].forEach(insert);
  render();

  document.querySelector('#treeInsert').addEventListener('click', () => {
    const value = Number(inputEl.value);
    if (Number.isNaN(value)) return;
    insert(value);
    logEl.textContent = `Inserted ${value} into BST.`;
    render();
  });

  document.querySelector('#treeSearch').addEventListener('click', () => {
    const value = Number(inputEl.value);
    const found = search(value);
    logEl.textContent = found ? `Found ${value} in BST.` : `${value} not found.`;
  });
}

window.addEventListener('DOMContentLoaded', () => {
  // Initialize global controls
  initGlobalControls();

  // Initialize speed control
  initSpeedControl();

  // Initialize keyboard shortcuts
  initKeyboardShortcuts();

  // Initialize algorithms
  initLinearSearch();
  initBinarySearch();
  createSortSection('bubble', 'bubble');
  createSortSection('insertion', 'insertion');
  createSortSection('quick', 'quick');
  createSortSection('heap', 'heap');
  initRecursion();
  initBacktracking();
  initLinkedList();
  initStackQueue();
  initTrees();
});
