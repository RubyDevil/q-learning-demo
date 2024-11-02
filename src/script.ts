// ========== Type Definitions ===================

type Position = { x: number, y: number };

type Decision = { action: string, reward: number, distanceToGoal: number, position: Position };

type Episode = { startTime: number, endTime: number, decisions: Decision[] };

// ========== World =============================

class World {

   /** The width of the world. */
   width: number;

   /** The height of the world. */
   height: number;

   /** The goal position. */
   goal: Position;

   /** The AIs in the world. */
   ais: AI[] = [];

   /**
    * Creates a new world with the given dimensions and goal.
    * @param options - The world options.
    */
   constructor(options: {
      width: number;
      height: number;
      goal: Position;
   }) {
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
   render(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
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
   addAI(ai: AI) {
      this.ais.push(ai);
   }
}

// ========== AI ================================

abstract class AI {

   /** The possible actions for the AI. */
   abstract actions: Readonly<string[]>;

   /** The world in which the AI operates. */
   world: World;

   /** The position of the AI. */
   position: Position = { x: 0, y: 0 };

   /** The last spawn point. */
   spawn: Position = { x: 0, y: 0 };

   /** The episodes completed by the AI. */
   episodes: Episode[] = [];

   /**
    * Creates a new AI in the given world.
    * @param world - The world in which the AI operates.
    * @param options - The AI options.
    */
   constructor(world: World) {
      this.world = world;
   }

   /**
    * Calculates the Manhattan distance from the AI to the goal.
    * @returns The Manhattan distance.
    */
   protected manhattanDistanceToGoal() {
      return Math.abs(this.position.x - this.world.goal.x) + Math.abs(this.position.y - this.world.goal.y);
   }

   /**
    * Calculates the Euclidean distance from the AI to the goal.
    * @param fast - Whether to use the fast (squared) distance calculation.
    * @returns The Euclidean distance.
    */
   protected euclideanDistanceToGoal(fast: boolean = false) {
      const dx = this.position.x - this.world.goal.x;
      const dy = this.position.y - this.world.goal.y;
      return fast ? dx * dx + dy * dy : Math.sqrt(dx * dx + dy * dy);
   }

   /**
    * Chooses an action based on the current state.
    * @returns The chosen action.
    */
   protected abstract chooseAction(): string;

   /**
    * Updates the AI's data based on the chosen action.
    * @param action - The action to take.
    * @returns The new position.
    */
   protected abstract commitAction(action: string): Position;

   /**
    * Learns from taking an action and receiving a reward.
    */
   protected abstract learn(): { action: string, reward: number };

   /**
    * Trains the AI by running multiple episodes of learning.
    * @param episodes - The number of episodes to run.
    * @param decisionInterval - The interval between decisions in milliseconds.
    */
   abstract train(episodes: number, decisionInterval: number, spawnPointGenerator: () => Position): Promise<number>;
}

/**
 * An AI that uses Q-learning to learn the optimal path to the goal.
 */
class QLearningAI extends AI {

   actions = ['UP', 'DOWN', 'LEFT', 'RIGHT'] as const;

   /** The Q-table mapping state-action pairs to Q-values. */
   qTable: Record<string, Record<typeof this.actions[number], number>> = {};

   /** The chance of exploration (choosing a random action). */
   explorationRate: number;

   /** The learning rate (step size) for updating Q-values. */
   learningRate: number;

   /** The discount factor for future rewards. */
   discountFactor: number;

   constructor(world: World, options: {
      explorationRate: number;
      learningRate: number;
      discountFactor: number;
   }) {
      super(world);
      this.explorationRate = options.explorationRate;
      this.learningRate = options.learningRate;
      this.discountFactor = options.discountFactor;
   }

   override chooseAction(): string {
      if (Math.random() < this.explorationRate) {
         // Explore: choose a random action
         return this.actions[Math.floor(Math.random() * this.actions.length)];
      } else {
         // Exploit: choose the action with the highest Q-value
         const qStateKey = this.getQStateKey();
         return this.actions.reduce(
            (bestAction, action) => (
               this.getQValue(qStateKey, action) > this.getQValue(qStateKey, bestAction)
                  ? action
                  : bestAction
            ), this.actions[0]
         );
      }
   }

   override commitAction(action: string): Position {
      // Update the position based on the action taken
      switch (action) {
         case 'UP': this.position.y = Math.max(0, this.position.y - 1); break;
         case 'DOWN': this.position.y = Math.min(this.world.height - 1, this.position.y + 1); break;
         case 'LEFT': this.position.x = Math.max(0, this.position.x - 1); break;
         case 'RIGHT': this.position.x = Math.min(this.world.width - 1, this.position.x + 1); break;
      }

      return this.position;
   }

   /**
    * Learns from taking an action and receiving a reward.
    */
   override learn(): Decision {
      // Choose an action based on the current state
      const action = this.chooseAction();

      // Commit the action and get the new position
      const oldPosition = { ...this.position };
      this.commitAction(action);

      // Calculate the reward based on the new position
      const distanceToGoal = this.manhattanDistanceToGoal();
      const reward = (this.position.x === this.world.goal.x && this.position.y === this.world.goal.y)
         ? 100                              // Large reward for reaching the goal
         : -distanceToGoal / 10;            // Small penalty based on distance

      // Update Q-values based on the reward and the new position
      this.updateQValue(oldPosition, action, reward);

      // Return the action and reward for rendering
      return { action, reward, distanceToGoal, position: { ...this.position } };
   }

   private async runEpisode(decisionInterval: number): Promise<Episode> {
      return new Promise(resolve => {
         let episode: Episode = { startTime: Date.now(), endTime: -1, decisions: [] };
         const interval = setInterval(() => {
            if (ai.position.x === ai.world.goal.x && ai.position.y === ai.world.goal.y) {
               clearInterval(interval);
               episode.endTime = Date.now();
               resolve(episode);
            } else {
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
    * @returns The elapsed time in milliseconds.
    */
   async train(episodes: number, decisionInterval: number, spawnPointGenerator: () => Position): Promise<number> {
      return new Promise(async resolve => {
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
         }

         // Resolve the promise with the elapsed time
         resolve(Date.now() - startTime);
      });
   }

   /**
    * Returns a unique key representing the current state.
    * @returns The state key.
    */
   private getQStateKey(): string {
      return `${this.position.x},${this.position.y}`;
   }

   /**
    * Returns the Q-value for a given state-action pair.
    * @param stateKey - The state key.
    * @param action - The action.
    * @returns The Q-value.
    */
   private getQValue(stateKey: string, action: string): number {
      return (this.qTable[stateKey]?.[action] ?? 0);
   }

   /**
    * Updates the Q-value for a state-action pair based on the reward received.
    * @param oldState - The previous state.
    * @param action - The action taken.
    * @param reward - The reward received.
    */
   private updateQValue(oldState: Position, action: string, reward: number) {
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

ai.train(1000, 1, staticSpawnGenerator({ x: 0, y: 0 }));

function staticSpawnGenerator(position: Position) {
   return () => position;
}

function randomSpawnGenerator() {
   return () => ({
      x: Math.floor(Math.random() * world.width),
      y: Math.floor(Math.random() * world.height)
   });
}

// ========== UI =================================

// Get the stats elements
const stats = document.getElementById('stats')!;
const episodes = document.getElementById('stat-episodes')!;
const totalDecisions = document.getElementById('stat-total-decisions')!;
const averageDecisions = document.getElementById('stat-average-decisions')!;
const lastDecisions = document.getElementById('stat-last-decisions')!;

// Get the training controls
const startButton = document.getElementById('start-button')!;
const cancelButton = document.getElementById('cancel-button')!;
const episodesInput = document.getElementById('episodes-input') as HTMLInputElement;

function startTraining() {
   console.log('Training started.');
   const episodes = parseInt((document.getElementById('episodes-input') as HTMLInputElement).value);
   const interval = parseInt((document.getElementById('interval-input') as HTMLInputElement).value);
   ai.train(episodes, interval, randomSpawnGenerator());
}

function cancelTraining() {
   console.log('Training canceled.');
}

function resetTraining() {
   console.log('Training reset.');
}

// ========== Rendering =========================

// Get the canvas and rendering context
const canvas = document.getElementsByTagName('canvas')[0];
const ctx = canvas.getContext('2d')!;

const render = () => {
   // Render the world
   world.render(ctx, 0, 0, canvas.width, canvas.height);

   // Update the stats
   episodes.textContent = ai.episodes.length.toString();
   totalDecisions.textContent = ai.episodes.reduce((sum, e) => sum + e.decisions.length, 0).toString();
   averageDecisions.textContent = ai.episodes.length > 0
      ? (ai.episodes.reduce((sum, e) => sum + e.decisions.length, 0) / ai.episodes.length).toFixed(2)
      : 'N/A';
   lastDecisions.textContent = ai.episodes.length > 0 ? ai.episodes[ai.episodes.length - 1].decisions.length.toString() : 'N/A';

   // Request the next frame
   requestAnimationFrame(render);
};

requestAnimationFrame(render);

// ========== Utils ==============================

function buildCancellableTask<T>(asyncFn: () => Promise<T>) {
   let rejected = false;
   const { promise, resolve, reject } = Promise.withResolvers<T>()

   return {
      run: () => {
         if (!rejected) {
            asyncFn().then(resolve, reject);
         }
         return promise;
      },
      cancel: () => {
         rejected = true;
         reject(new Error('CanceledError'));
      },
   };
};