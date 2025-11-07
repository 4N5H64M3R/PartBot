import type { NoTranslate } from '@/i18n/types';
import type { PSCommand } from '@/types/chat';

export const command: PSCommand[] = [
	{
		name: 'boop',
		help: 'Boops',
		syntax: 'CMD',
		perms: ['room', 'mod'],
		categories: ['casual'],
		async run({ message, $T }) {
			return message.reply($T('COMMANDS.BOOP'));
		},
	},
	{
		name: 'pat',
		help: 'Pats a person.',
		syntax: 'CMD [user?]',
		perms: 'voice',
		aliases: ['pet'],
		categories: ['casual'],
		async run({ message, arg }) {
			return message.reply(`/me pats ${message.author.id === 'hydrostatics' ? 'Hydro' : arg}` as NoTranslate);
		},
	},
	{
		name: 'ping',
		help: "You're asking help on... how to use ping?",
		syntax: 'CMD',
		flags: { allowPMs: true },
		perms: ['room', 'voice'],
		categories: [],
		async run({ message, $T }) {
			return message.reply($T('COMMANDS.PONG'));
		},
	},
	{
		name: 'ii',
		help: 'Bullies Ruka.',
		syntax: 'CMD',
		flags: { allowPMs: true },
		rooms: ['boardgames'],
		perms: 'voice',
		categories: ['casual'],
		async run({ message }) {
			return message.reply("You don't have to tell me, I Audiino." as NoTranslate);
		},
	},
];
