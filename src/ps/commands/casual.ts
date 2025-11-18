import { isGlobalBot } from '@/config/ps';
import { toId } from '@/utils/toId';

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
		name: 'mish',
		help: 'Mishes a person.',
		syntax: 'CMD [user?]',
		perms: 'voice',
		rooms: ['indonesia'],
		categories: ['casual'],
		async run({ message, arg }) {
			const targetId = toId(arg);
			if (!targetId) {
				message.reply('mish mish' as NoTranslate);
			} else if (!message.target.users.some(user => toId(user) === targetId)) {
				message.reply('MISH YOU! (Target not in room)' as NoTranslate);
			} else if (targetId === message.author.id || targetId === message.parent.status.userid) {
				message.reply('MISH YOU!' as NoTranslate);
			} else {
				message.reply(`!dt dewgong\nget MISHED ${arg}` as NoTranslate);
				const target = message.parent.addUser(arg);

				const imgUrl = `${process.env.WEB_URL}/static/other/mish.png`;
				if (isGlobalBot) target.send(`!show ${imgUrl}` as NoTranslate);
				else target.send(imgUrl as NoTranslate);
				target.send(`/pm ${arg},with love from ${message.author.name}` as NoTranslate);
			}
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
