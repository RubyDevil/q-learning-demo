type Position = {
    x: number;
    y: number;
};
type Decision = {
    action: string;
    reward: number;
    distanceToGoal: number;
    position: Position;
};
type Episode = {
    startTime: number;
    endTime: number;
    decisions: Decision[];
};
declare class World {
    /** The width of the world. */
    width: number;
    /** The height of the world. */
    height: number;
    /** The goal position. */
    goal: Position;
    /** The AIs in the world. */
    ais: AI[];
    /**
     * Creates a new world with the given dimensions and goal.
     * @param options - The world options.
     */
    constructor(options: {
        width: number;
        height: number;
        goal: Position;
    });
    /**
     * Renders the world responsively within the given bounds.
     * The world is rendered as a grid with the goal highlighted in green.
     * The AIs are rendered as colored circles on the grid.
     * @param ctx The canvas rendering context.
     */
    render(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void;
    /**
     * Adds an AI to the world.
     * @param ai - The AI to add.
     */
    addAI(ai: AI): void;
}
declare abstract class AI {
    /** The possible actions for the AI. */
    abstract actions: Readonly<string[]>;
    /** The world in which the AI operates. */
    world: World;
    /** The position of the AI. */
    position: Position;
    /** The last spawn point. */
    spawn: Position;
    /** The episodes completed by the AI. */
    episodes: Episode[];
    /**
     * Creates a new AI in the given world.
     * @param world - The world in which the AI operates.
     * @param options - The AI options.
     */
    constructor(world: World);
    /**
     * Calculates the Manhattan distance from the AI to the goal.
     * @returns The Manhattan distance.
     */
    protected manhattanDistanceToGoal(): number;
    /**
     * Calculates the Euclidean distance from the AI to the goal.
     * @param fast - Whether to use the fast (squared) distance calculation.
     * @returns The Euclidean distance.
     */
    protected euclideanDistanceToGoal(fast?: boolean): number;
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
    protected abstract learn(): {
        action: string;
        reward: number;
    };
    /**
     * Trains the AI by running multiple episodes of learning.
     * @param episodes - The number of episodes to run.
     * @param decisionInterval - The interval between decisions in milliseconds.
     */
    abstract train(episodes: number, decisionInterval: number, spawnPointGenerator: () => Position, episodeCompletionCallback: (episode: Episode) => any): Promise<number>;
}
/**
 * An AI that uses Q-learning to learn the optimal path to the goal.
 */
declare class QLearningAI extends AI {
    actions: readonly ["UP", "DOWN", "LEFT", "RIGHT"];
    /** The Q-table mapping state-action pairs to Q-values. */
    qTable: Record<string, Record<typeof this.actions[number], number>>;
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
    });
    chooseAction(): string;
    commitAction(action: string): Position;
    /**
     * Learns from taking an action and receiving a reward.
     */
    learn(): Decision;
    private runEpisode;
    /**
     * Trains the AI by running multiple episodes of learning.
     * @param episodes - The number of episodes to run.
     * @param decisionInterval - The interval between decisions in milliseconds.
     * @param spawnPointGenerator - A function that generates a spawn point for each episode.
     * @returns
     */
    train(episodes: number, decisionInterval: number, spawnPointGenerator: () => Position, episodeCompletionCallback: (episode: Episode) => any): Promise<number>;
    /**
     * Returns a unique key representing the current state.
     * @returns The state key.
     */
    private getQStateKey;
    /**
     * Returns the Q-value for a given state-action pair.
     * @param stateKey - The state key.
     * @param action - The action.
     * @returns The Q-value.
     */
    private getQValue;
    /**
     * Updates the Q-value for a state-action pair based on the reward received.
     * @param oldState - The previous state.
     * @param action - The action taken.
     * @param reward - The reward received.
     */
    private updateQValue;
}
declare const world: World;
declare const ai: QLearningAI;
declare function staticSpawnGenerator(position: Position): () => Position;
declare function randomSpawnGenerator(): () => {
    x: number;
    y: number;
};
declare const stats: HTMLElement;
declare const episodes: HTMLElement;
declare const totalDecisions: HTMLElement;
declare const averageDecisions: HTMLElement;
declare const lastDecisions: HTMLElement;
declare const episodesInput: HTMLInputElement;
declare const decisionIntervalInput: HTMLInputElement;
declare const explorationRateInput: HTMLInputElement;
declare const learningRateInput: HTMLInputElement;
declare const discountFactorInput: HTMLInputElement;
declare const startButton: HTMLButtonElement;
declare const resetButton: HTMLButtonElement;
declare const loadButton: HTMLButtonElement;
declare const downloadButton: HTMLButtonElement;
declare let training: boolean;
declare let task: {
    run: () => Promise<any>;
    cancel: () => void;
} | null;
declare function startTraining(): void;
declare function resetTraining(): void;
declare function updateUI(): void;
declare const canvas: HTMLCanvasElement;
declare const ctx: CanvasRenderingContext2D;
declare const render: () => void;
