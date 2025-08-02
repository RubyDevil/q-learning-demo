// ========== Type Definitions ===================
// ========== World =============================
class World {
    /** The width of the world. */
    width;
    /** The height of the world. */
    height;
    /** The goal position. */
    goal;
    /** The AIs in the world. */
    ais = [];
    /**
     * Creates a new world with the given dimensions and goal.
     * @param options - The world options.
     */
    constructor(options) {
        this.width = options.width;
        this.height = options.height;
        this.goal = options.goal;
    }
    /**
     * Renders the world responsively within the given bounds.
     * The world is rendered as a grid with the goal highlighted in green.
     * The AIs are rendered as colored circles on the grid.
     * @param ctx The canvas rendering context.
     */
    render(ctx, x, y, width, height) {
        ctx.clearRect(x, y, width, height);
        const cellWidth = width / this.width;
        const cellHeight = height / this.height;
        // Draw grid
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= this.width; i++) {
            ctx.beginPath();
            ctx.moveTo(x + i * cellWidth, y);
            ctx.lineTo(x + i * cellWidth, y + height);
            ctx.stroke();
        }
        for (let j = 0; j <= this.height; j++) {
            ctx.beginPath();
            ctx.moveTo(x, y + j * cellHeight);
            ctx.lineTo(x + width, y + j * cellHeight);
            ctx.stroke();
        }
        // Draw goal
        ctx.fillStyle = 'green';
        ctx.fillRect(x + this.goal.x * cellWidth, y + this.goal.y * cellHeight, cellWidth, cellHeight);
        // Draw AIs
        this.ais.forEach(ai => {
            // Draw AI
            ctx.fillStyle = 'blue';
            ctx.beginPath();
            ctx.arc(x + (ai.position.x + 0.5) * cellWidth, y + (ai.position.y + 0.5) * cellHeight, Math.min(cellWidth, cellHeight) / 3, 0, 2 * Math.PI);
            ctx.fill();
            // Draw spawn point
            ctx.strokeStyle = 'red';
            ctx.lineWidth = cellWidth / 10;
            ctx.beginPath();
            ctx.arc(x + (ai.spawn.x + 0.5) * cellWidth, y + (ai.spawn.y + 0.5) * cellHeight, Math.min(cellWidth, cellHeight) / 3, 0, 2 * Math.PI);
            ctx.stroke();
        });
    }
    /**
     * Adds an AI to the world.
     * @param ai - The AI to add.
     */
    addAI(ai) {
        this.ais.push(ai);
    }
}
// ========== AI ================================
class AI {
    /** The world in which the AI operates. */
    world;
    /** The position of the AI. */
    position = { x: 0, y: 0 };
    /** The last spawn point. */
    spawn = { x: 0, y: 0 };
    /** The episodes completed by the AI. */
    episodes = [];
    /**
     * Creates a new AI in the given world.
     * @param world - The world in which the AI operates.
     * @param options - The AI options.
     */
    constructor(world) {
        this.world = world;
    }
    /**
     * Calculates the Manhattan distance from the AI to the goal.
     * @returns The Manhattan distance.
     */
    manhattanDistanceToGoal() {
        return Math.abs(this.position.x - this.world.goal.x) + Math.abs(this.position.y - this.world.goal.y);
    }
    /**
     * Calculates the Euclidean distance from the AI to the goal.
     * @param fast - Whether to use the fast (squared) distance calculation.
     * @returns The Euclidean distance.
     */
    euclideanDistanceToGoal(fast = false) {
        const dx = this.position.x - this.world.goal.x;
        const dy = this.position.y - this.world.goal.y;
        return fast ? dx * dx + dy * dy : Math.sqrt(dx * dx + dy * dy);
    }
}
/**
 * An AI that uses Q-learning to learn the optimal path to the goal.
 */
class QLearningAI extends AI {
    actions = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
    /** The Q-table mapping state-action pairs to Q-values. */
    qTable = {};
    /** The chance of exploration (choosing a random action). */
    explorationRate;
    /** The learning rate (step size) for updating Q-values. */
    learningRate;
    /** The discount factor for future rewards. */
    discountFactor;
    constructor(world, options) {
        super(world);
        this.explorationRate = options.explorationRate;
        this.learningRate = options.learningRate;
        this.discountFactor = options.discountFactor;
    }
    chooseAction() {
        if (Math.random() < this.explorationRate) {
            // Explore: choose a random action
            return this.actions[Math.floor(Math.random() * this.actions.length)];
        }
        else {
            // Exploit: choose the action with the highest Q-value
            const qStateKey = this.getQStateKey();
            return this.actions.reduce((bestAction, action) => (this.getQValue(qStateKey, action) > this.getQValue(qStateKey, bestAction)
                ? action
                : bestAction), this.actions[0]);
        }
    }
    commitAction(action) {
        // Update the position based on the action taken
        switch (action) {
            case 'UP':
                this.position.y = Math.max(0, this.position.y - 1);
                break;
            case 'DOWN':
                this.position.y = Math.min(this.world.height - 1, this.position.y + 1);
                break;
            case 'LEFT':
                this.position.x = Math.max(0, this.position.x - 1);
                break;
            case 'RIGHT':
                this.position.x = Math.min(this.world.width - 1, this.position.x + 1);
                break;
        }
        return this.position;
    }
    /**
     * Learns from taking an action and receiving a reward.
     */
    learn() {
        // Choose an action based on the current state
        const action = this.chooseAction();
        // Commit the action and get the new position
        const oldPosition = { ...this.position };
        this.commitAction(action);
        // Calculate the reward based on the new position
        const distanceToGoal = this.manhattanDistanceToGoal();
        const reward = (this.position.x === this.world.goal.x && this.position.y === this.world.goal.y)
            ? 100 // Large reward for reaching the goal
            : -distanceToGoal / 10; // Small penalty based on distance
        // Update Q-values based on the reward and the new position
        this.updateQValue(oldPosition, action, reward);
        // Return the action and reward for rendering
        return { action, reward, distanceToGoal, position: { ...this.position } };
    }
    async runEpisode(decisionInterval) {
        return new Promise(resolve => {
            let episode = { startTime: Date.now(), endTime: -1, decisions: [] };
            const interval = setInterval(() => {
                if (ai.position.x === ai.world.goal.x && ai.position.y === ai.world.goal.y) {
                    clearInterval(interval);
                    episode.endTime = Date.now();
                    resolve(episode);
                }
                else {
                    const decision = ai.learn();
                    episode.decisions.push(decision);
                    console.debug(`[Episode ${ai.episodes.length + 1}] Decision : ${decision.action} (${decision.reward})`);
                }
            }, decisionInterval);
        });
    }
    /**
     * Trains the AI by running multiple episodes of learning.
     * @param episodes - The number of episodes to run.
     * @param decisionInterval - The interval between decisions in milliseconds.
     * @param spawnPointGenerator - A function that generates a spawn point for each episode.
     * @returns
     */
    async train(episodes, decisionInterval, spawnPointGenerator, episodeCompletionCallback) {
        return await new Promise(async (resolve) => {
            // Save the start time
            const startTime = Date.now();
            // Run the specified number of episodes
            for (let i = 0; i < episodes; i++) {
                // Reset the AI's position and spawn point
                this.spawn = { ...spawnPointGenerator() };
                this.position = { ...this.spawn };
                // Run an episode
                const episode = await this.runEpisode(decisionInterval);
                // Add the episode to the memory
                this.episodes.push(episode);
                // Call the episode completion callback
                episodeCompletionCallback(episode);
            }
            // Resolve the promise with the elapsed time
            resolve(Date.now() - startTime);
        });
    }
    /**
     * Returns a unique key representing the current state.
     * @returns The state key.
     */
    getQStateKey() {
        return `${this.position.x},${this.position.y}`;
    }
    /**
     * Returns the Q-value for a given state-action pair.
     * @param stateKey - The state key.
     * @param action - The action.
     * @returns The Q-value.
     */
    getQValue(stateKey, action) {
        return (this.qTable[stateKey]?.[action] ?? 0);
    }
    /**
     * Updates the Q-value for a state-action pair based on the reward received.
     * @param oldState - The previous state.
     * @param action - The action taken.
     * @param reward - The reward received.
     */
    updateQValue(oldState, action, reward) {
        const stateKey = `${oldState.x},${oldState.y}`;
        const currentQ = this.getQValue(stateKey, action);
        // Calculate the maximum Q-value for the next state
        const nextStateKey = this.getQStateKey();
        const maxNextQ = Math.max(...this.actions.map(a => this.getQValue(nextStateKey, a)));
        // Q-learning formula
        const newQ = currentQ + this.learningRate * (reward + this.discountFactor * maxNextQ - currentQ);
        if (!this.qTable[stateKey]) {
            this.qTable[stateKey] = { UP: 0, DOWN: 0, LEFT: 0, RIGHT: 0 };
        }
        this.qTable[stateKey][action] = newQ;
    }
}
// ========== Main ==============================
const world = new World({
    width: 11,
    height: 11,
    goal: { x: 5, y: 5 }
});
const ai = new QLearningAI(world, {
    explorationRate: 0.2,
    learningRate: 0.1,
    discountFactor: 0.9
});
world.addAI(ai);
function staticSpawnGenerator(position) {
    return () => position;
}
function randomSpawnGenerator() {
    return () => ({
        x: Math.floor(Math.random() * world.width),
        y: Math.floor(Math.random() * world.height)
    });
}
// ========== UI =================================
// Get the training stats
const stats = document.getElementById('stats');
const episodes = document.getElementById('stat-episodes');
const totalDecisions = document.getElementById('stat-total-decisions');
const averageDecisions = document.getElementById('stat-average-decisions');
const lastDecisions = document.getElementById('stat-last-decisions');
// Get the training params
const episodesInput = document.getElementsByTagName('input').namedItem('param-episodes');
const decisionIntervalInput = document.getElementsByTagName('input').namedItem('param-decision-interval');
const explorationRateInput = document.getElementsByTagName('input').namedItem('param-exploration-rate');
const learningRateInput = document.getElementsByTagName('input').namedItem('param-learning-rate');
const discountFactorInput = document.getElementsByTagName('input').namedItem('param-discount-factor');
// Get the training controls
const startButton = document.getElementsByTagName('button').namedItem('control-start');
const resetButton = document.getElementsByTagName('button').namedItem('control-reset');
// Get the training loaders
const loadButton = document.getElementsByTagName('button').namedItem('control-load');
const downloadButton = document.getElementsByTagName('button').namedItem('control-download');
// Add event listeners
startButton.addEventListener('click', startTraining);
resetButton.addEventListener('click', resetTraining);
let training = false;
let task = null;
function startTraining() {
    const episodes = parseInt(episodesInput.value);
    const decisionInterval = parseInt(decisionIntervalInput.value);
    const explorationRate = parseFloat(explorationRateInput.value);
    const learningRate = parseFloat(learningRateInput.value);
    const discountFactor = parseFloat(discountFactorInput.value);
    if (isNaN(episodes) || isNaN(decisionInterval) || isNaN(explorationRate) || isNaN(learningRate) || isNaN(discountFactor))
        return alert('Please enter valid training parameters');
    if (!training) {
        // Set the training flag
        training = true;
        // Update the UI
        updateUI();
        // Run the training task
        ai.train(episodes, decisionInterval, staticSpawnGenerator({ x: 0, y: 0 }), updateUI).then(elapsedTime => {
            // Reset the training flag
            training = false;
            // Update the UI
            updateUI();
            // Log the elapsed time
            console.log(`Training completed in ${elapsedTime}ms`);
            alert(`Training completed in ${elapsedTime}ms`);
        }).catch(error => {
            // Reset the training flag
            training = false;
            // Update the UI
            updateUI();
            // Log the error
            console.error(error);
        });
    }
}
function resetTraining() {
    // Reset the training data
    ai.qTable = {};
    ai.episodes = [];
    // Set the default values
    episodesInput.value = '10';
    decisionIntervalInput.value = '50';
    explorationRateInput.value = '0.2';
    learningRateInput.value = '0.1';
    discountFactorInput.value = '0.9';
    // Update the UI
    updateUI();
    alert('Training data has been reset');
}
function updateUI() {
    // Update the training stats
    episodes.textContent = ai.episodes.length.toString();
    totalDecisions.textContent = ai.episodes.reduce((sum, e) => sum + e.decisions.length, 0).toString();
    averageDecisions.textContent = ai.episodes.length > 0
        ? (ai.episodes.reduce((sum, e) => sum + e.decisions.length, 0) / ai.episodes.length).toFixed(2)
        : 'N/A';
    lastDecisions.textContent = ai.episodes.length > 0 ? ai.episodes[ai.episodes.length - 1].decisions.length.toString() : 'N/A';
    // Update the training params
    episodesInput.disabled = training;
    decisionIntervalInput.disabled = training;
    explorationRateInput.disabled = training;
    learningRateInput.disabled = training;
    discountFactorInput.disabled = training;
    // Update the training controls
    startButton.disabled = training;
    resetButton.disabled = training;
    // Update the loaders
}
// ========== Rendering =========================
// Get the canvas and rendering context
const canvas = document.getElementsByTagName('canvas')[0];
const ctx = canvas.getContext('2d');
const render = () => {
    // Render the world
    world.render(ctx, 0, 0, canvas.width, canvas.height);
    // Request the next frame
    requestAnimationFrame(render);
};
requestAnimationFrame(render);
//# sourceMappingURL=script.js.map