/**
 * The one copy block the AI Career Radar owns: the question, the two words a first-time reader has
 * to learn, and the three things to do with the answer.
 *
 * WHY THIS IS ITS OWN FILE
 * Three surfaces need these strings and only these: `plainLanguage.ts` (the shared panel every other
 * calculator renders), the hub page (which hands them to the React island), and the embed build. When
 * this lived only in `plainLanguage.ts`, the island could not import it without pulling all sixteen
 * calculators' copy into a browser bundle for a tool that needs one.
 *
 * Read by `scripts/vibe/vibe-lint.mjs` as reader-facing copy, so the lexicon rules apply here.
 */

export interface CareerAiWord {
	/** The term as the page prints it. */
	term: string;
	/** One sentence. What it means here, not the textbook definition. */
	plain: string;
}

export const CAREER_AI_QUESTION = 'How much of your job can AI already do, task by task?';

export const CAREER_AI_WORDS: CareerAiWord[] = [
	{
		term: 'Task exposure',
		plain: 'The share of your weekly tasks a current model can do at your quality bar. Not the share of your job title.'
	},
	{
		term: 'Automation risk',
		plain: 'How much of the work can be done without you, weighted by how much of your pay depends on it.'
	},
	{
		term: 'Simulated week',
		plain: 'Your 40 hours with the tasks you hand to AI taken out. The score is the weighted average over the hours that remain.'
	}
];

export const CAREER_AI_NEXT: string[] = [
	'Start with the tasks you would hand over tomorrow, not the ones you fear losing.',
	'Pick one exposed task and automate it this month. The skill compounds faster than the risk does.',
	'Move toward the parts of the job that need judgement, relationships, or accountability for a decision.'
];
