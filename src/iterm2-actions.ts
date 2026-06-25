export const ITERM2_SHORTCUT_ACTION_KEY = 'openInNewWindow.iTerm2ShortcutActionId';

export interface ITerm2Action {
	id: string;
	label: string;
	description: string;
	followUpCommands: readonly string[];
}

export const ITERM2_DEFAULT_ACTION_ID = 'cd-only';

export const ITERM2_ACTIONS: readonly ITerm2Action[] = [
	{
		id: ITERM2_DEFAULT_ACTION_ID,
		label: 'Open iTerm2',
		description: 'Open iTerm2 and cd to the workspace, reusing an existing window when possible',
		followUpCommands: [],
	},
	{
		id: 'grok',
		label: 'Open iTerm2: Grok',
		description: 'cd to the workspace, then run grok',
		followUpCommands: ['grok'],
	},
];

export function getITerm2Action(actionId: string): ITerm2Action | undefined {
	return ITERM2_ACTIONS.find((action) => action.id === actionId);
}

export function getDefaultITerm2Action(): ITerm2Action {
	return ITERM2_ACTIONS[0];
}

export function resolveITerm2ShortcutAction(actionId: string | undefined): ITerm2Action {
	return getITerm2Action(actionId ?? ITERM2_DEFAULT_ACTION_ID) ?? getDefaultITerm2Action();
}

export function describeITerm2ShortcutAction(action: ITerm2Action): string {
	return `Cmd+; will run: ${action.label}.`;
}