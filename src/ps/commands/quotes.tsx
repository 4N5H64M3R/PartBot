import { PSQuoteRoomPrefs } from '@/cache';
import { addQuote, getAllQuotes } from '@/database/quotes';
import { MAX_CHAT_HTML_LENGTH, MAX_PAGE_HTML_LENGTH } from '@/ps/constants';
import { ChatError } from '@/utils/chatError';
import { Username as UsernameCustom } from '@/utils/components';
import { Username as UsernamePS } from '@/utils/components/ps';
import { fromHumanTime } from '@/utils/humanTime';
import { jsxToHTML } from '@/utils/jsxToHTML';
import { escapeRegEx } from '@/utils/regexEscape';
import { toId } from '@/utils/toId';

import type { TranslationFn } from '@/i18n/types';
import type { PSCommand } from '@/types/chat';
import type { PSMessage } from '@/types/ps';
import type { CSSProperties, ReactElement, ReactNode } from 'react';

type QuoteCollection = [index: number, quote: string][];

const ranks = ['★', '☆', '^', '⛵', 'ᗢ', '+', '%', '§', '@', '*', '#', '&', '~', '$', '-'].join('');
const chatRegEx = new RegExp(`^(\\[(?:\\d{2}:){1,2}\\d{2}] )?([${ranks}]?)([a-zA-Z0-9][^:]{0,25}?): (.*)$`);
const meRegEx = new RegExp(`^(\\[(?:\\d{2}:){1,2}\\d{2}] )?• ([${ranks}]?)(\\[[a-zA-Z0-9][^\\]]{0,25}]) (.*)$`);
const rawMeRegEx = new RegExp(`^((?:\\[(?:\\d{2}:){1,2}\\d{2}] )?• [${ranks}]?)([a-zA-Z0-9]\\S{0,25})( .*)$`);
const jnlRegEx = /^(?:.*? (?:joined|left)(?:; )?){1,2}$/;
const rawRegEx = /^(\[(?:\d{2}:){1,2}\d{2}] )?(.*)$/;

async function getRoom(message: PSMessage, $T: TranslationFn): Promise<string> {
	if (message.type === 'chat') return message.target.roomid;
	const prefs = PSQuoteRoomPrefs[message.author.userid];
	if (prefs && message.time - prefs.at.getTime() < fromHumanTime('1 hour')) return prefs.room;
	message.reply(`Which room are you looking for a quote in?`);
	const answer = await message.target
		.waitFor(msg => {
			return msg.content.length > 0;
		})
		.catch(() => {
			throw new ChatError($T('COMMANDS.ROOM_NOT_GIVEN'));
		});
	const _room = toId(answer.content);
	PSQuoteRoomPrefs[message.author.userid] = { room: _room, at: new Date() };
	return _room;
}

function parseQuote(quote: string): string {
	const lines = quote.trim().split(/ {3}|\\n|\n/);
	const foundNames = lines
		.map(line => line.match(chatRegEx)?.[3])
		.filter((name): name is string => !!name)
		.unique();
	const reformatRegExes = foundNames.map(name => {
		return new RegExp(`^((?:\\[(?:\\d{2}:){1,2}\\d{2}] )?• [${ranks}]?)(${escapeRegEx(name)})( .*)$`, 'i');
	});
	return lines
		.map(line => {
			// Wrap unspecified /me syntax with a [] if the same username is found elsewhere
			return reformatRegExes.reduce((acc, regEx) => acc.replace(regEx, `$1[$2]$3`), line).replace(rawMeRegEx, '$1[$2]$3');
		})
		.join('\n');
}

function FormatQuoteLine({ line, style, psUsernameTag }: { line: string; style?: CSSProperties; psUsernameTag?: boolean }): ReactNode {
	const chatMatch = line.match(chatRegEx);
	if (chatMatch)
		return (
			<div className="chat chatmessage-a" style={style ?? { padding: '3px 0' }}>
				<small>{chatMatch[1] + chatMatch[2]}</small>
				<span className="username">
					{psUsernameTag ? <UsernamePS name={`${chatMatch[3]}:`} /> : <UsernameCustom name={`${chatMatch[3]}:`} />}
				</span>
				<em> {chatMatch[4]}</em>
			</div>
		);

	const meMatch = line.match(meRegEx);
	if (meMatch)
		return (
			<div className={`chat chatmessage-${toId(meMatch[3])}`} style={style ?? { padding: '3px 0' }}>
				<small>{meMatch[1]}</small>
				<UsernameCustom name={meMatch[3]}>• </UsernameCustom>
				<em>
					<small>{meMatch[2]}</small>
					<span className="username">{meMatch[3].slice(1, -1)}</span>
					<i> {meMatch[4]}</i>
				</em>
			</div>
		);

	const jnlMatch = line.match(jnlRegEx);
	if (jnlMatch)
		return (
			<div className="message" style={style ?? { padding: '3px 0' }}>
				<small style={{ color: '#555555' }}>
					{jnlMatch[0]}
					<br />
				</small>
			</div>
		);

	const rawMatch = line.match(rawRegEx);
	if (rawMatch)
		return (
			<div className="chat chatmessage-partbot" style={style ?? { padding: '3px 0' }}>
				<small>{rawMatch[1]}</small>
				{rawMatch[2]}
			</div>
		);

	return undefined;
}

function FormatQuote({
	quote,
	psUsernameTag = true,
	header,
}: {
	quote: string;
	psUsernameTag?: boolean;
	header?: ReactNode;
	children?: ReactElement[];
}): ReactElement {
	const quoteLines = quote.split('\n');
	return (
		<>
			{header}
			{quoteLines.length > 5 ? (
				<details className="readmore">
					<summary>
						{quoteLines.slice(0, 2).map(line => (
							<FormatQuoteLine line={line} psUsernameTag={psUsernameTag} />
						))}
						<FormatQuoteLine
							line={quoteLines[2]}
							psUsernameTag={psUsernameTag}
							style={{
								padding: '3px 0',
								display: 'inline-block',
							}}
						/>
					</summary>
					{quoteLines.slice(3).map(line => (
						<FormatQuoteLine line={line} psUsernameTag={psUsernameTag} />
					))}
				</details>
			) : (
				quoteLines.map(line => <FormatQuoteLine line={line} psUsernameTag={psUsernameTag} />)
			)}
		</>
	);
}

function _FormatSmogQuote(quote: string): string {
	return quote
		.split('\n')
		.map(line => {
			switch (true) {
				case chatRegEx.test(line): {
					//
				}
			}
		})
		.join('\n');
}

function _MultiQuotes({ list, paginate, buffer }: { list: QuoteCollection; paginate?: boolean; buffer?: number }): {
	component: string;
	remaining: QuoteCollection;
} {
	const quoteList = list.slice();
	const cap = (paginate ? MAX_PAGE_HTML_LENGTH : MAX_CHAT_HTML_LENGTH) - (buffer ?? 10);

	const renderedQuotes: QuoteCollection = [];
	let component = '';

	while (quoteList.length) {
		const next = quoteList.shift()!;
		const newComponent = jsxToHTML(
			<>
				<hr />
				{[...renderedQuotes, next].map(([header, quote]) => (
					<>
						<FormatQuote quote={quote} header={`#${header}`} />
						<hr />
					</>
				))}
			</>
		);
		if (newComponent.length > cap) break;
		component = newComponent;
		renderedQuotes.push(next);
	}
	return { component, remaining: quoteList };
}

export const command: PSCommand = {
	name: 'quotes',
	aliases: ['q', 'quote'],
	help: 'Quotes module!',
	syntax: 'CMD',
	categories: ['utility'],
	extendedAliases: {
		addquote: ['quotes', 'add'],
	},
	children: {
		help: {
			name: 'help',
			aliases: ['h'],
			help: null,
			flags: { noDisplay: true },
			syntax: 'CMD',
			async run({ run }) {
				return run('help quotes');
			},
		},
		random: {
			name: 'random',
			aliases: ['rand', 'r'],
			help: 'Displays a random quote',
			syntax: 'CMD',
			async run({ message, broadcast, broadcastHTML, room: _room, $T }) {
				const room: string = (_room as string) ?? (await getRoom(message, $T));
				const quotes = await getAllQuotes(room);
				const [index, randQuote] = Object.entries(quotes).random() ?? [0, null];
				if (!randQuote) return broadcast($T('COMMANDS.QUOTES.NO_QUOTES_FOUND'));
				broadcastHTML(
					<>
						<hr />
						<FormatQuote quote={randQuote.quote} header={`#${~~index + 1}`} />
						<hr />
					</>,
					{ name: 'viewquote-partbot' }
				);
			},
		},
		add: {
			name: 'add',
			aliases: ['new', 'a', 'n'],
			perms: 'driver',
			help:
				'Adds the given quote. ``\\n`` works as a newline, and ``/me`` syntax can be formatted via ' +
				'wrapping the username in ``[]`` (eg: ``[14:20:21] • #PartMan hugs Hydro`` would be formatted ' +
				'as ``[14:20:21] • #[PartMan] hugs Hydro``)',
			syntax: 'CMD [new quote]',
			// TODO: Support DMs
			async run({ message, arg, broadcastHTML }) {
				const parsedQuote = parseQuote(arg);
				await addQuote(parsedQuote, message.target.id, message.author.name);
				const { length } = await getAllQuotes(message.target.id);
				broadcastHTML(
					<>
						<hr />
						<FormatQuote quote={parsedQuote} header={`#${length}`} />
						<hr />
					</>,
					{ name: 'viewquote-partbot' }
				);
			},
		},
		preview: {
			name: 'preview',
			aliases: ['p'],
			perms: 'driver',
			help: 'Previews the given quote. Syntax is the same as add.',
			syntax: 'CMD [new quote]',
			async run({ message, arg, broadcastHTML }) {
				const parsedQuote = parseQuote(arg);
				const { length } = await getAllQuotes(message.target.id);
				broadcastHTML(
					<>
						<hr />
						<FormatQuote quote={parsedQuote} header={`#${length} [preview]`} />
						<hr />
					</>,
					{ name: 'previewquote-partbot' }
				);
			},
		},
	},
	async run({ run }) {
		return run('quote random');
	},
};
