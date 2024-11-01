// ========== Type Definitions ===================

type Position = { x: number, y: number };

// ========== World =============================

class World {

   /** The width of the world. */
   width: number;

   /** The height of the world. */
   height: number;

   /** The goal position. */
   goal: Position;

   /** The spawn position. */
   spawn: Position;

   /**
    * Creates a new world with the given dimensions, goal, and spawn point.
    * @param options - The world options.
    */
   constructor(options: {
      width: number;
      height: number;
      goal: Position;
      spawn: Position
   }) {
      this.width = options.width;
      this.height = options.height;
      this.goal = options.goal;
      this.spawn = options.spawn;
   }
}

// ========== AI ================================

abstract class AI {

   /** The possible actions for the AI. */
   abstract actions: Readonly<string[]>;

   /** The world in which the AI operates. */
   world: World;

   /** The position of the AI. */
   position: Position;

   constructor(world: World, options: {
      explorationRate: number;
      learningRate: number;
      discountFactor: number;
   }) {
      this.world = world;
      this.position = { ...world.spawn };
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
   euclideanDistanceToGoal(fast: boolean = false) {
      const dx = this.position.x - this.world.goal.x;
      const dy = this.position.y - this.world.goal.y;
      return fast ? dx * dx + dy * dy : Math.sqrt(dx * dx + dy * dy);
   }

   /**
    * Chooses an action based on the current state.
    * @returns The chosen action.
    */
   abstract chooseAction(): string;

   /**
    * Updates the AI's data based on the chosen action.
    * @param action - The action to take.
    * @returns The new position.
    */
   abstract commitAction(action: string): Position;

   /**
    * Learns from taking an action and receiving a reward.
    */
   abstract learn(): { action: string, reward: number };
}

/**
 * An AI that uses Q-learning to learn the optimal path to the goal.
 */
class QLearningAI extends AI {

   actions = ['UP', 'DOWN', 'LEFT', 'RIGHT'] as const;

   /** The Q-table mapping state-action pairs to Q-values. */
   qTable: { [key: string]: number } = {};

   /** The exploration rate. */
   explorationRate: number;

   /** The learning rate. */
   learningRate: number;

   /** The discount factor. */
   discountFactor: number;

   /**
    * Creates a new Q-learning AI with the given options.
    * @param world - The world in which the AI operates.
    * @param options - The AI options.
    */
   constructor(world: World, options: {
      explorationRate: number;
      learningRate: number;
      discountFactor: number;
   }) {
      super(world, options);
      this.explorationRate = options.explorationRate;
      this.learningRate = options.learningRate;
      this.discountFactor = options.discountFactor;
   }

   // ...
}

// ========== Main ==============================

// ...

// ========== Rendering =========================

// ...