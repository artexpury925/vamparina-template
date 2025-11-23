
// VAMPARINA MD - WhatsApp Bot by Arnold Chirchir
// Powered by Baileys, Node.js, and a whole lotta vibe
import makeWASocket, { DisconnectReason, makeCacheableSignalKeyStore, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import P from 'pino';
import NodeCache from 'node-cache';
import chalk from 'chalk';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { Sticker, StickerTypes } from 'wa-sticker-formatter';
import ytdl from 'ytdl-core';
import { exec } from 'child_process';
import { promisify } from 'util';
import AdmZip from 'adm-zip';
import { existsSync, readFileSync, writeFileSync, mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

// Constants and Configurations
const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');
const msgRetryCounterCache = new NodeCache();
const BOT = { owner: '254114614092' };
const API_KEYS = { grok: 'YOUR_GROK_API_KEY', audd: 'YOUR_AUDD_API_KEY', youtube: 'YOUR_YOUTUBE_API_KEY' };
const DB = { settings: { prefix: '.', botname: 'VAMPARINA MD', mode: 'public' }, blocked: [], badwords: [], sudo: [] };
const execAsync = promisify(exec);

// Database Management
const saveDB = () => writeFileSync(join(__dirname, 'db.json'), JSON.stringify(DB, null, 2));
if (!existsSync(join(__dirname, 'db.json'))) writeFileSync(join(__dirname, 'db.json'), JSON.stringify(DB));
if (!existsSync(join(__dirname, 'session'))) mkdirSync(join(__dirname, 'session'));
if (!existsSync(join(__dirname, 'viewonce'))) mkdirSync(join(__dirname, 'viewonce'));
if (!existsSync(join(__dirname, 'movies'))) mkdirSync(join(__dirname, 'movies'));

// Start Bot
async function startBot() {
    let { version } = await fetchLatestBaileysVersion();
    console.log(chalk.cyanBright(`[${DB.settings.botname}] Baileys v${version.join('.')}`));
    
    const sock = makeWASocket.default({
        version,
        logger: P({ level: 'silent' }),
        printQRInTerminal: true,
        auth: {
            creds: JSON.parse(readFileSync(join(__dirname, 'session', 'creds.json'), 'utf8')),
            keys: makeCacheableSignalKeyStore({}, P({ level: 'silent' }))
        },
        msgRetryCounterCache,
        generateHighQualityLinkPreview: true
    });

    sock.ev.process(async(events) => {
        if (events['connection.update']) {
            const { connection, lastDisconnect } = events['connection.update'];
            if (connection === 'close') {
                if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                    console.log(chalk.yellowBright('Reconnecting…'));
                    startBot();
                } else {
                    console.log(chalk.redBright('Logged out. Scan QR again.'));
                    unlinkSync(join(__dirname, 'session', 'creds.json'));
                    startBot();
                }
            } else if (connection === 'open') {
                console.log(chalk.greenBright(`[${DB.settings.botname} 2025] — FULLY LOADED`));
            }
        }

        if (events['creds.update']) {
            writeFileSync(join(__dirname, 'session', 'creds.json'), JSON.stringify(events['creds.update'], null, 2));
        }

        if (events['messages.upsert']) {
            const { messages } = events['messages.upsert'];
            for (let msg of messages) {
                if (!msg.message) return;
                const from = msg.key.remoteJid;
                const sender = msg.key.participant || from;
                const isGroup = from.endsWith('@g.us');
                let text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
                const isOwner = BOT.owner === sender.split('@')[0];
                const isSudo = DB.sudo.includes(sender);
                const groupMetadata = isGroup ? await sock.groupMetadata(from) : null;
                const participants = isGroup ? groupMetadata.participants : [];
                const isAdmin = isGroup ? participants.find(p => p.id === sender)?.admin : false;
                const isBotAdmin = isGroup ? participants.find(p => p.id === sock.user.id)?.admin : false;
                const mention = text.match(/@(\d+)/)?.[1] ? `${text.match(/@(\d+)/)[1]}@s.whatsapp.net` : null;
                const args = text.split(' ').slice(1).join(' ').trim();
                const cmd = text.split(' ')[0].toLowerCase().slice(DB.settings.prefix.length);
                const groupSettings = DB[from] || (DB[from] = { antilink: 'off', welcome: null, goodbye: null, chatbot: false });

                const reply = async (txt, opts = {}) => {
                    await sock.sendMessage(from, { text: txt, ...opts }, { quoted: msg });
                };

                if (!text.startsWith(DB.settings.prefix)) {
                    if (isGroup && groupSettings.chatbot && !DB.blocked.includes(sender)) {
                        try {
                            const response = await fetch(`https://api.grok.ai/v1/chat`, {
                                method: 'POST',
                                headers: { 'Authorization': `Bearer ${API_KEYS.grok}`, 'Content-Type': 'application/json' },
                                body: JSON.stringify({ prompt: text, model: 'grok-3b' })
                            }).then(r => r.json());
                            if (response.text) reply(response.text);
                        } catch (e) {
                            reply(`Chatbot error: ${e.message}`);
                        }
                    }
                    return;
                }

                try {
                    switch (cmd) {
                        case 'menu':
                            reply(`
*VAMPARINA MD 2025* — Yo, what's good? 🚀
*Prefix*: ${DB.settings.prefix}
*Mode*: ${DB.settings.mode}
*Owner*: @${BOT.owner}
*Commands*:
- .ping — Check if I'm alive
- .info — Bot details
- .mode <public|private> — Set bot mode
- .antidelete <on|off> — Toggle anti-delete
- .shazam — Identify song (reply to audio)
- .tts <text> — Text to speech
- .play <song> — Play YouTube audio
- .song <query> — Download song
- .video <query> — Download video
- .gitclone <url> — Clone GitHub repo
- .telesticker <url> — Make Telegram sticker
- .movie <name> — Search movie
- *Group Commands*:
  - .add <number> — Add member
  - .remove <@user> — Kick member
  - .ban <@user> — Ban from group
  - .unban <@user> — Unban from group
  - .promote <@user> — Make admin
  - .demote <@user> — Remove admin
  - .tag <@user> [msg] — Tag with message
  - .tagall [msg] — Tag everyone
  - .hidetag [msg] — Hidden tag
  - .listonline — Show online members
  - .antilink <delete|warn <num>|kick|off> — Antilink settings
  - .welcome <msg|off> — Set welcome message
  - .goodbye <msg|off> — Set goodbye message
  - .link — Get group link
  - .close — Close group
  - .open — Open group
  - .setdesc <text> — Set group description
  - .setgroupname <name> — Set group name
  - .totalmembers — Count members
- *Owner/Sudo Commands*:
  - .setbadword <add|remove> <word> — Manage bad words
  - .block <@user> — Block user
  - .unblock <@user> — Unblock user
  - .delete — Delete quoted message
  - .join <group link> — Join group
  - .leave — Leave group
  - .restart — Restart bot
  - .setbio <text> — Set bot bio
  - .setprefix <prefix> — Change prefix
  - .addsudo <number> — Add sudo user
  - .removesudo <number> — Remove sudo user
  - .juid <channel link> — Get channel JID
  - .chatbot <on|off> — Toggle group chatbot
  - .lid <@user> — Get user JID
  - .permanentban <@user> — Ban user for 24h
Powered by *Arnold Chirchir*
                            `.trim(), { mentions: [BOT.owner + '@s.whatsapp.net'] });
                            break;

                        case 'ping':
                            reply('Pong! 🏓');
                            break;

                        case 'info':
                            reply(`
*VAMPARINA MD 2025*
- *Bot Name*: ${DB.settings.botname}
- *Prefix*: ${DB.settings.prefix}
- *Mode*: ${DB.settings.mode}
- *Owner*: @${BOT.owner}
- *Version*: 2025.0.0
- *Platform*: Baileys v${version.join('.')}
- *Runtime*: Node.js ${process.version}
- *Commands*: Type .menu for full list
*About*: Yo, I'm VAMPARINA MD, built by Arnold Chirchir to keep your chats lit! From music to group management, I got you. 😎
                            `.trim(), { mentions: [BOT.owner + '@s.whatsapp.net'] });
                            break;

                        case 'mode':
                            if (!isOwner && !isSudo) return reply('Owner or sudo only');
                            if (!['public', 'private'].includes(args.toLowerCase())) return reply(`
❗ *Invalid Mode!*
Usage: .mode <public|private>
Example: .mode public
                            `.trim());
                            DB.settings.mode = args.toLowerCase();
                            saveDB();
                            reply(`Mode set to *${DB.settings.mode}*`);
                            break;

                        case 'antidelete':
                            if (!isOwner && !isSudo) return reply('Owner or sudo only');
                            if (!['on', 'off'].includes(args.toLowerCase())) return reply(`
❗ *Invalid Option!*
Usage: .antidelete <on|off>
Example: .antidelete on
                            `.trim());
                            DB.settings.antidelete = args.toLowerCase() === 'on';
                            saveDB();
                            reply(`Anti-delete set to *${args.toLowerCase()}*`);
                            break;

                        case 'shazam':
                            if (!msg.message?.audioMessage && !msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.audioMessage) return reply(`
❗ *Reply to an Audio!*
Usage: Reply to an audio message with .shazam
                            `.trim());
                            try {
                                const audio = msg.message.audioMessage || msg.message.extendedTextMessage.contextInfo.quotedMessage.audioMessage;
                                const audioBuffer = await sock.downloadMediaMessage({ key: msg.key, message: { audioMessage: audio } });
                                const form = new FormData();
                                form.append('api_token', API_KEYS.audd);
                                form.append('file', audioBuffer, 'audio.mp3');
                                const response = await fetch('https://api.audd.io/', {
                                    method: 'POST',
                                    body: form
                                }).then(r => r.json());
                                if (response.status === 'success' && response.result) {
                                    reply(`
🎵 *Song Identified!*
- *Title*: ${response.result.title}
- *Artist*: ${response.result.artist}
- *Album*: ${response.result.album || 'Unknown'}
- *Release*: ${response.result.release_date || 'Unknown'}
                                    `.trim());
                                } else {
                                    reply('❌ Couldn’t identify the song. Try a clearer audio.');
                                }
                            } catch (e) {
                                reply(`❌ *Error:* ${e.message}.\nUsage: Reply to an audio with .shazam`);
                            }
                            break;

                        case 'tts':
                            if (!args) return reply(`
❗ *Text Required!*
Usage: .tts <text>
Example: .tts Yo, what's good?
                            `.trim());
                            try {
                                const response = await fetch(`https://text-to-speech.api.io/tts?text=${encodeURIComponent(args)}`);
                                const audio = await response.arrayBuffer();
                                await sock.sendMessage(from, {
                                    audio: Buffer.from(audio),
                                    mimetype: 'audio/mp3'
                                }, { quoted: msg });
                            } catch (e) {
                                reply(`❌ *Error:* ${e.message}.\nUsage: .tts <text>\nExample: .tts Yo, what's good?`);
                            }
                            break;

                        case 'play':
                            if (!args) return reply(`
❗ *Song Name Required!*
Usage: .play <song name>
Example: .play Despacito
                            `.trim());
                            try {
                                const search = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(args)}&key=${API_KEYS.youtube}&type=video`).then(r => r.json());
                                if (!search.items.length) return reply('No results found.');
                                const videoId = search.items[0].id.videoId;
                                const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`);
                                const audio = ytdl(videoId, { filter: 'audioonly', quality: 'highestaudio' });
                                await sock.sendMessage(from, {
                                    audio: audio,
                                    mimetype: 'audio/mp3',
                                    caption: `🎵 *${info.videoDetails.title}*\n- *Channel*: ${info.videoDetails.author.name}\n- *Duration*: ${Math.floor(info.videoDetails.lengthSeconds / 60)}:${info.videoDetails.lengthSeconds % 60}`
                                }, { quoted: msg });
                            } catch (e) {
                                reply(`❌ *Error:* ${e.message}.\nUsage: .play <song name>\nExample: .play Despacito`);
                            }
                            break;

                        case 'song':
                            if (!args) return reply(`
❗ *Song Name Required!*
Usage: .song <song name>
Example: .song Despacito
                            `.trim());
                            try {
                                const search = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(args)}&key=${API_KEYS.youtube}&type=video`).then(r => r.json());
                                if (!search.items.length) return reply('No results found.');
                                const videoId = search.items[0].id.videoId;
                                const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`);
                                const audio = ytdl(videoId, { filter: 'audioonly', quality: 'highestaudio' });
                                const filePath = join(__dirname, 'movies', `${videoId}.mp3`);
                                audio.pipe(fs.createWriteStream(filePath));
                                audio.on('end', async () => {
                                    await sock.sendMessage(from, {
                                        document: { url: filePath },
                                        mimetype: 'audio/mp3',
                                        fileName: `${info.videoDetails.title}.mp3`,
                                        caption: `🎵 *${info.videoDetails.title}*\n- *Channel*: ${info.videoDetails.author.name}`
                                    }, { quoted: msg });
                                    unlinkSync(filePath);
                                });
                            } catch (e) {
                                reply(`❌ *Error:* ${e.message}.\nUsage: .song <song name>\nExample: .song Despacito`);
                            }
                            break;

                        case 'video':
                            if (!args) return reply(`
❗ *Video Name Required!*
Usage: .video <video name>
Example: .video Despacito
                            `.trim());
                            try {
                                const search = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(args)}&key=${API_KEYS.youtube}&type=video`).then(r => r.json());
                                if (!search.items.length) return reply('No results found.');
                                const videoId = search.items[0].id.videoId;
                                const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`);
                                const video = ytdl(videoId, { quality: 'highestvideo' });
                                const filePath = join(__dirname, 'movies', `${videoId}.mp4`);
                                video.pipe(fs.createWriteStream(filePath));
                                video.on('end', async () => {
                                    await sock.sendMessage(from, {
                                        document: { url: filePath },
                                        mimetype: 'video/mp4',
                                        fileName: `${info.videoDetails.title}.mp4`,
                                        caption: `📹 *${info.videoDetails.title}*\n- *Channel*: ${info.videoDetails.author.name}`
                                    }, { quoted: msg });
                                    unlinkSync(filePath);
                                });
                            } catch (e) {
                                reply(`❌ *Error:* ${e.message}.\nUsage: .video <video name>\nExample: .video Despacito`);
                            }
                            break;

                        case 'gitclone':
                            if (!args || !args.includes('github.com')) return reply(`
❗ *GitHub URL Required!*
Usage: .gitclone <github url>
Example: .gitclone https://github.com/artexpury925/vamparina-md
                            `.trim());
                            try {
                                const repoUrl = args.split(' ')[0];
                                const repoName = repoUrl.split('/').pop().replace('.git', '');
                                const zipPath = join(__dirname, `${repoName}.zip`);
                                await execAsync(`git clone ${repoUrl} ${repoName}`);
                                const zip = new AdmZip();
                                zip.addLocalFolder(repoName);
                                zip.writeZip(zipPath);
                                await sock.sendMessage(from, {
                                    document: { url: zipPath },
                                    mimetype: 'application/zip',
                                    fileName: `${repoName}.zip`
                                }, { quoted: msg });
                                unlinkSync(zipPath);
                                await execAsync(`rm -rf ${repoName}`);
                            } catch (e) {
                                reply(`❌ *Error:* ${e.message}.\nUsage: .gitclone <github url>\nExample: .gitclone https://github.com/artexpury925/vamparina-md`);
                            }
                            break;

                        case 'telesticker':
                            if (!args || !args.includes('t.me')) return reply(`
❗ *Telegram Sticker URL Required!*
Usage: .telesticker <telegram sticker url>
Example: .telesticker https://t.me/addstickers/YourStickerPack
                            `.trim());
                            try {
                                const packName = args.split('/').pop();
                                const response = await fetch(`https://api.telegram.org/bot${API_KEYS.telegram}/getStickerSet?name=${packName}`).then(r => r.json());
                                if (!response.ok) throw new Error('Sticker pack not found');
                                for (let sticker of response.result.stickers) {
                                    const file = await fetch(`https://api.telegram.org/bot${API_KEYS.telegram}/getFile?file_id=${sticker.file_id}`).then(r => r.json());
                                    const filePath = `https://api.telegram.org/file/bot${API_KEYS.telegram}/${file.result.file_path}`;
                                    const stickerBuffer = await fetch(filePath).then(r => r.buffer());
                                    const ws = new Sticker(stickerBuffer, {
                                        pack: packName,
                                        author: 'VAMPARINA MD',
                                        type: StickerTypes.FULL,
                                        quality: 70
                                    });
                                    const stickerMessage = await ws.toMessage();
                                    await sock.sendMessage(from, stickerMessage, { quoted: msg });
                                }
                            } catch (e) {
                                reply(`❌ *Error:* ${e.message}.\nUsage: .telesticker <telegram sticker url>\nExample: .telesticker https://t.me/addstickers/YourStickerPack`);
                            }
                            break;

                        case 'movie':
                            if (!args) return reply(`
❗ *Movie Name Required!*
Usage: .movie <movie name>
Example: .movie Inception
                            `.trim());
                            try {
                                const response = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${API_KEYS.tmdb}&query=${encodeURIComponent(args)}`).then(r => r.json());
                                if (!response.results.length) return reply('No movies found.');
                                const movie = response.results[0];
                                reply(`
🎬 *${movie.title}*
- *Release*: ${movie.release_date}
- *Rating*: ${movie.vote_average}/10
- *Overview*: ${movie.overview}
- *Poster*: https://image.tmdb.org/t/p/w500${movie.poster_path}
                                `.trim());
                            } catch (e) {
                                reply(`❌ *Error:* ${e.message}.\nUsage: .movie <movie name>\nExample: .movie Inception`);
                            }
                            break;

                        case 'add':
                            if (!isGroup) return reply('Group only');
                            if (!isAdmin) return reply('Admin only');
                            if (!isBotAdmin) return reply('I need to be an admin to add members');
                            if (!args) return reply(`
❗ *Phone Number Required!*
Usage: .add <phone number>
Example: .add 254123456789
                            `.trim());
                            try {
                                const number = args.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                                await sock.groupParticipantsUpdate(from, [number], 'add');
                                reply(`Added @${number.split('@')[0]}`, { mentions: [number] });
                            } catch (e) {
                                reply(`❌ *Error:* ${e.message}.\nUsage: .add <phone number>\nExample: .add 254123456789`);
                            }
                            break;

                        case 'remove':
                            if (!isGroup) return reply('Group only');
                            if (!isAdmin) return reply('Admin only');
                            if (!isBotAdmin) return reply('I need to be an admin to remove members');
                            if (!mention) return reply(`
❗ *User Required!*
Usage: .remove <@user>
Example: .remove @254123456789
                            `.trim());
                            try {
                                await sock.groupParticipantsUpdate(from, [mention], 'remove');
                                reply(`Removed @${mention.split('@')[0]}`, { mentions: [mention] });
                            } catch (e) {
                                reply(`❌ *Error:* ${e.message}.\nUsage: .remove <@user>\nExample: .remove @254123456789`);
                            }
                            break;

                        case 'ban':
                            if (!isGroup) return reply('Group only');
                            if (!isAdmin) return reply('Admin only');
                            if (!isBotAdmin) return reply('I need to be an admin to ban members');
                            if (!mention) return reply(`
❗ *User Required!*
Usage: .ban <@user>
Example: .ban @254123456789
                            `.trim());
                            try {
                                await sock.groupParticipantsUpdate(from, [mention], 'remove');
                                DB.blocked.push(mention);
                                saveDB();
                                reply(`Banned @${mention.split('@')[0]} from *${groupMetadata.subject}*`, { mentions: [mention] });
                            } catch (e) {
                                reply(`❌ *Error:* ${e.message}.\nUsage: .ban <@user>\nExample: .ban @254123456789`);
                            }
                            break;

                        case 'unban':
                            if (!isGroup) return reply('Group only');
                            if (!isAdmin) return reply('Admin only');
                            if (!mention && !args) return reply(`
❗ *User Required!*
Usage: .unban <@user | phone number>
Example: .unban @254123456789
                            `.trim());
                            try {
                                const unbanUser = mention || args.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                                DB.blocked = DB.blocked.filter(u => u !== unbanUser);
                                saveDB();
                                await sock.sendMessage(from, {
                                    text: `✅ *User Unbanned!* @${unbanUser.split('@')[0]} is no longer banned from *${groupMetadata.subject}*. They can now rejoin the group.`,
                                    mentions: [unbanUser]
                                });
                                reply('User unbanned');
                            } catch (e) {
                                reply(`❌ *Error:* ${e.message}.\nUsage: .unban <@user | phone number>\nExample: .unban @254123456789`);
                            }
                            break;

                        case 'promote':
                            if (!isGroup) return reply('Group only');
                            if (!isAdmin) return reply('Admin only');
                            if (!isBotAdmin) return reply('I need to be an admin to promote members');
                            if (!mention) return reply(`
❗ *User Required!*
Usage: .promote <@user>
Example: .promote @254123456789
                            `.trim());
                            try {
                                await sock.groupParticipantsUpdate(from, [mention], 'promote');
                                reply(`Promoted @${mention.split('@')[0]} to admin`, { mentions: [mention] });
                            } catch (e) {
                                reply(`❌ *Error:* ${e.message}.\nUsage: .promote <@user>\nExample: .promote @254123456789`);
                            }
                            break;

                        case 'demote':
                            if (!isGroup) return reply('Group only');
                            if (!isAdmin) return reply('Admin only');
                            if (!isBotAdmin) return reply('I need to be an admin to demote members');
                            if (!mention) return reply(`
❗ *User Required!*
Usage: .demote <@user>
Example: .demote @254123456789
                            `.trim());
                            try {
                                await sock.groupParticipantsUpdate(from, [mention], 'demote');
                                reply(`Demoted @${mention.split('@')[0]} from admin`, { mentions: [mention] });
                            } catch (e) {
                                reply(`❌ *Error:* ${e.message}.\nUsage: .demote <@user>\nExample: .demote @254123456789`);
                            }
                            break;

                        case 'tag':
                            if (!isGroup) return reply('Group only');
                            if (!isAdmin) return reply('Admin only');
                            if (!mention && !args) return reply(`
❗ *User Required!*
Usage: .tag <@user | phone number> [message]
Example: .tag @254123456789 Yo, what's good?
                            `.trim());
                            const tagUser = mention || args.split(' ')[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                            const tagMessage = args.split(' ').slice(1).join(' ') || 'Yo, you’re tagged!';
                            try {
                                await sock.sendMessage(from, {
                                    text: `@${tagUser.split('@')[0]} ${tagMessage}`,
                                    mentions: [tagUser]
                                });
                            } catch (e) {
                                reply(`❌ *Error:* ${e.message}.\nUsage: .tag <@user | phone number> [message]\nExample: .tag @254123456789 Yo, what's good?`);
                            }
                            break;

                        case 'tagall':
                            if (!isGroup) return reply('Group only');
                            if (!isAdmin) return reply('Admin only');
                            try {
                                const tagAllMessage = args || 'Everyone, gather up! 📢';
                                await sock.sendMessage(from, {
                                    text: `${tagAllMessage}\n\n${participants.map(p => `@${p.id.split('@')[0]}`).join(' ')}`,
                                    mentions: participants.map(p => p.id)
                                });
                            } catch (e) {
                                reply(`❌ *Error:* ${e.message}.\nUsage: .tagall [message]\nExample: .tagall Meeting now!`);
                            }
                            break;

                        case 'hidetag':
                            if (!isGroup) return reply('Group only');
                            if (!isAdmin) return reply('Admin only');
                            try {
                                const hideTagMessage = args || 'Hidden tag activated! 👻';
                                await sock.sendMessage(from, {
                                    text: hideTagMessage,
                                    mentions: participants.map(p => p.id)
                                });
                            } catch (e) {
                                reply(`❌ *Error:* ${e.message}.\nUsage: .hidetag [message]\nExample: .hidetag Surprise!`);
                            }
                            break;

                        case 'listonline':
                            if (!isGroup) return reply('Group only');
                            try {
                                const online = participants.filter(p => p.presence === 'available').map(p => `@${p.id.split('@')[0]}`);
                                reply(online.length ? `🟢 *Online Members* (${online.length}):\n${online.join('\n')}` : 'No members online.', { mentions: online.map(id => id + '@s.whatsapp.net') });
                            } catch (e) {
                                reply(`❌ *Error:* ${e.message}.\nUsage: .listonline`);
                            }
                            break;

                        case 'antilink':
                            if (!isGroup) return reply('Group only');
                            if (!isAdmin) return reply('Admin only');
                            if (!isBotAdmin) return reply('I need to be an admin to manage antilink');
                            if (!args) return reply(`
❗ *Option Required!*
Usage: .antilink <delete|warn <number>|kick|off>
Examples:
- .antilink delete
- .antilink warn 3
- .antilink kick
- .antilink off
                            `.trim());
                            const [mode, warnLimit] = args.split(' ');
                            if (!['delete', 'warn', 'kick', 'off'].includes(mode.toLowerCase()) || (mode.toLowerCase() === 'warn' && !warnLimit)) {
                                return reply(`
❗ *Invalid Option!*
Usage: .antilink <delete|warn <number>|kick|off>
Examples:
- .antilink delete
- .antilink warn 3
- .antilink kick
- .antilink off
                                `.trim());
                            }
                            if (mode.toLowerCase() === 'warn' && (isNaN(warnLimit) || warnLimit < 1)) {
                                return reply('Warn limit must be a number greater than 0.\nExample: .antilink warn 3');
                            }
                            groupSettings.antilink = mode.toLowerCase() === 'warn' ? mode.toLowerCase() : mode.toLowerCase();
                            if (mode.toLowerCase() === 'warn') groupSettings.warnLimit = parseInt(warnLimit);
                            saveDB();
                            reply(`Antilink set to *${mode.toLowerCase()}${mode.toLowerCase() === 'warn' ? ` with ${warnLimit} warnings` : ''}*`);
                            break;

                        case 'setbadword':
                            if (!isOwner && !isSudo) return reply('Owner or sudo only');
                            if (!args) return reply(`
❗ *Invalid Input!*
Usage: .setbadword <add|remove> <word>
Example: .setbadword add idiot
                            `.trim());
                            const [action, word] = args.split(' ');
                            if (!['add', 'remove'].includes(action.toLowerCase()) || !word) {
                                return reply(`
❗ *Invalid Input!*
Usage: .setbadword <add|remove> <word>
Example: .setbadword add idiot
                                `.trim());
                            }
                            if (action.toLowerCase() === 'add') {
                                if (DB.badwords.includes(word.toLowerCase())) {
                                    return reply(`Word "${word}" is already in the bad words list.`);
                                }
                                DB.badwords.push(word.toLowerCase());
                                saveDB();
                                reply(`Added "${word}" to bad words list`);
                            } else {
                                if (!DB.badwords.includes(word.toLowerCase())) {
                                    return reply(`Word "${word}" is not in the bad words list.`);
                                }
                                DB.badwords = DB.badwords.filter(w => w !== word.toLowerCase());
                                saveDB();
                                reply(`Removed "${word}" from bad words list`);
                            }
                            break;

                        case 'welcome':
                            if (!isGroup) return reply('Group only');
                            if (!isAdmin) return reply('Admin only');
                            if (!args && args !== 'off') return reply(`
❗ *Message Required!*
Usage: .welcome <message> or .welcome off
Example: .welcome Welcome @user to our squad!
                            `.trim());
                            if (args === 'off') {
                                delete groupSettings.welcome;
                                saveDB();
                                reply('Welcome message turned off');
                            } else {
                                groupSettings.welcome = args;
                                saveDB();
                                reply(`Welcome message set to: ${args}`);
                            }
                            break;

                        case 'goodbye':
                            if (!isGroup) return reply('Group only');
                            if (!isAdmin) return reply('Admin only');
                            if (!args && args !== 'off') return reply(`
❗ *Message Required!*
Usage: .goodbye <message> or .goodbye off
Example: .goodbye Goodbye @user, we'll miss you!
                            `.trim());
                            if (args === 'off') {
                                delete groupSettings.goodbye;
                                saveDB();
                                reply('Goodbye message turned off');
                            } else {
                                groupSettings.goodbye = args;
                                saveDB();
                                reply(`Goodbye message set to: ${args}`);
                            }
                            break;

                        case 'link':
                            if (!isGroup) return reply('Group only');
                            if (!isBotAdmin) return reply('I need to be an admin to generate a group link');
                            try {
                                const inviteCode = await sock.groupInviteCode(from);
                                reply(`Group link: https://chat.whatsapp.com/${inviteCode}`);
                            } catch (e) {
                                reply(`❌ *Error:* ${e.message}.\nUsage: .link`);
                            }
                            break;

                        case 'close':
                            if (!isGroup) return reply('Group only');
                            if (!isAdmin) return reply('Admin only');
                            if (!isBotAdmin) return reply('I need to be an admin to close the group');
                            try {
                                await sock.groupSettingUpdate(from, 'announcement');
                                reply('Group closed to non-admins');
                            } catch (e) {
                                reply(`❌ *Error:* ${e.message}.\nUsage: .close`);
                            }
                            break;

                        case 'open':
                            if (!isGroup) return reply('Group only');
                            if (!isAdmin) return reply('Admin only');
                            if (!isBotAdmin) return reply('I need to be an admin to open the group');
                            try {
                                await sock.groupSettingUpdate(from, 'not_announcement');
                                reply('Group opened to all members');
                            } catch (e) {
                                reply(`❌ *Error:* ${e.message}.\nUsage: .open`);
                            }
                            break;

                        case 'setdesc':
                            if (!isGroup) return reply('Group only');
                            if (!isAdmin) return reply('Admin only');
                            if (!isBotAdmin) return reply('I need to be an admin to set the description');
                            if (!args) return reply(`
❗ *Description Required!*
Usage: .setdesc <description>
Example: .setdesc Welcome to our awesome group!
                            `.trim());
                            try {
                                await sock.groupUpdateDescription(from, args);
                                reply('Group description updated');
                            } catch (e) {
                                reply(`❌ *Error:* ${e.message}.\nUsage: .setdesc <description>\nExample: .setdesc Welcome to our awesome group!`);
                            }
                            break;

                        case 'setgroupname':
                            if (!isGroup) return reply('Group only');
                            if (!isAdmin) return reply('Admin only');
                            if (!isBotAdmin) return reply('I need to be an admin to set the group name');
                            if (!args) return reply(`
❗ *Name Required!*
Usage: .setgroupname <name>
Example: .setgroupname VAMPARINA Squad
                            `.trim());
                            try {
                                await sock.groupUpdateSubject(from, args);
                                reply('Group name updated');
                            } catch (e) {
                                reply(`❌ *Error:* ${e.message}.\nUsage: .setgroupname <name>\nExample: .setgroupname VAMPARINA Squad`);
                            }
                            break;

                        case 'totalmembers':
                            if (!isGroup) return reply('Group only');
                            try {
                                reply(`Total members: ${participants.length}`);
                            } catch (e) {
                                reply(`❌ *Error:* ${e.message}.\nUsage: .totalmembers`);
                            }
                            break;

                        case 'block':
                            if (!isOwner && !isSudo) return reply('Owner or sudo only');
                            if (!mention && !args) return reply(`
❗ *User Required!*
Usage: .block <@user | phone number>
Example: .block @254123456789
                            `.trim());
                            const blockUser = mention || args.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                            try {
                                await sock.updateBlockStatus(blockUser, 'block');
                                DB.blocked.push(blockUser);
                                saveDB();
                                reply(`Blocked @${blockUser.split('@')[0]}`, { mentions: [blockUser] });
                            } catch (e) {
                                reply(`❌ *Error:* ${e.message}.\nUsage: .block <@user | phone number>\nExample: .block @254123456789`);
                            }
                            break;

                        case 'unblock':
                            if (!isOwner && !isSudo) return reply('Owner or sudo only');
                            if (!mention && !args) return reply(`
❗ *User Required!*
Usage: .unblock <@user | phone number>
Example: .unblock @254123456789
                            `.trim());
                            const unblockUser = mention || args.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                            try {
                                await sock.updateBlockStatus(unblockUser, 'unblock');
                                DB.blocked = DB.blocked.filter(u => u !== unblockUser);
                                saveDB();
                                reply(`Unblocked @${unblockUser.split('@')[0]}`, { mentions: [unblockUser] });
                            } catch (e) {
                                reply(`❌ *Error:* ${e.message}.\nUsage: .unblock <@user | phone number>\nExample: .unblock @254123456789`);
                            }
                            break;

                        case 'delete':
                            if (!isOwner && !isSudo) return reply('Owner or sudo only');
                            if (!msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) return reply(`
❗ *Reply to a Message!*
Usage: Reply to a message with .delete
                            `.trim());
                            try {
                                const quotedKey = msg.message.extendedTextMessage.contextInfo.quotedMessageId;
                                await sock.sendMessage(from, { delete: { id: quotedKey, remoteJid: from, fromMe: false } });
                                reply('Message deleted');
                            } catch (e) {
                                reply(`❌ *Error:* ${e.message}.\nUsage: Reply to a message with .delete`);
                            }
                            break;

                        case 'join':
                            if (!isOwner && !isSudo) return reply('Owner or sudo only');
                            if (!args || !args.includes('chat.whatsapp.com')) return reply(`
❗ *Group Link Required!*
Usage: .join <group link>
Example: .join https://chat.whatsapp.com/INVITE_CODE
                            `.trim());
                            try {
                                const inviteCode = args.split('chat.whatsapp.com/')[1]?.split(' ')[0];
                                if (!inviteCode) throw new Error('Invalid group link');
                                await reply(`⏳ *Joining Group...* Attempting to join via invite code: ${inviteCode}`);
                                const groupJid = await sock.groupAcceptInvite(inviteCode);
                                if (groupJid) {
                                    await sock.sendMessage(groupJid, {
                                        text: `✅ *Joined Group Successfully!* Yo, ${DB.settings.botname} is here to spice things up! Type .menu for commands. Powered by Arnold Chirchir!`
                                    });
                                    reply(`Successfully joined group: ${groupJid}`);
                                } else {
                                    throw new Error('Failed to join group');
                                }
                            } catch (e) {
                                reply(`❌ *Error:* ${e.message}.\nUsage: .join <group link>\nExample: .join https://chat.whatsapp.com/INVITE_CODE`);
                            }
                            break;

                        case 'leave':
                            if (!isGroup) return reply('Group only');
                            if (!isOwner && !isSudo) return reply('Owner or sudo only');
                            try {
                                await sock.sendMessage(from, { text: '✌️ Peace out! VAMPARINA MD is leaving the chat. Catch y’all later!' });
                                await sock.groupLeave(from);
                            } catch (e) {
                                reply(`❌ *Error:* ${e.message}.\nUsage: .leave`);
                            }
                            break;

                        case 'restart':
                            if (!isOwner && !isSudo) return reply('Owner or sudo only');
                            try {
                                await reply('🔄 *Restarting VAMPARINA MD...* I’ll be back in a sec!');
                                process.exit();
                            } catch (e) {
                                reply(`❌ *Error:* ${e.message}.\nUsage: .restart`);
                            }
                            break;

                        case 'setbio':
                            if (!isOwner && !isSudo) return reply('Owner or sudo only');
                            if (!args) return reply(`
❗ *Bio Text Required!*
Usage: .setbio <text>
Example: .setbio VAMPARINA MD - Powered by Arnold Chirchir
                            `.trim());
                            try {
                                await sock.updateProfileStatus(args);
                                reply('Bio updated');
                            } catch (e) {
                                reply(`❌ *Error:* ${e.message}.\nUsage: .setbio <text>\nExample: .setbio VAMPARINA MD - Powered by Arnold Chirchir`);
                            }
                            break;

                        case 'setprefix':
                            if (!isOwner && !isSudo) return reply('Owner or sudo only');
                            if (!args) return reply(`
❗ *Prefix Required!*
Usage: .setprefix <prefix>
Example: .setprefix !
                            `.trim());
                            try {
                                DB.settings.prefix = args;
                                saveDB();
                                reply(`Prefix updated to *${args}*`);
                            } catch (e) {
                                reply(`❌ *Error:* ${e.message}.\nUsage: .setprefix <prefix>\nExample: .setprefix !`);
                            }
                            break;

                        case 'addsudo':
                            if (!isOwner) return reply('Owner only');
                            if (!args) return reply(`
❗ *Phone Number Required!*
Usage: .addsudo <phone number>
Example: .addsudo 254123456789
                            `.trim());
                            const sudoUser = args.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                            if (DB.sudo.includes(sudoUser)) return reply('User is already a sudo');
                            try {
                                DB.sudo.push(sudoUser);
                                saveDB();
                                reply(`Added @${sudoUser.split('@')[0]} as sudo`, { mentions: [sudoUser] });
                            } catch (e) {
                                reply(`❌ *Error:* ${e.message}.\nUsage: .addsudo <phone number>\nExample: .addsudo 254123456789`);
                            }
                            break;

                        case 'removesudo':
                            if (!isOwner) return reply('Owner only');
                            if (!args) return reply(`
❗ *Phone Number Required!*
Usage: .removesudo <phone number>
Example: .removesudo 254123456789
                            `.trim());
                            const removeSudoUser = args.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                            if (!DB.sudo.includes(removeSudoUser)) return reply('User is not a sudo');
                            try {
                                DB.sudo = DB.sudo.filter(u => u !== removeSudoUser);
                                saveDB();
                                reply(`Removed @${removeSudoUser.split('@')[0]} from sudo`, { mentions: [removeSudoUser] });
                            } catch (e) {
                                reply(`❌ *Error:* ${e.message}.\nUsage: .removesudo <phone number>\nExample: .removesudo 254123456789`);
                            }
                            break;

                        case 'juid':
                            if (!args || !args.includes('whatsapp.com')) return reply(`
❗ *Channel Link Required!*
Usage: .juid <channel link>
Example: .juid https://whatsapp.com/channel/INVITE_CODE
                            `.trim());
                            try {
                                const channelCode = args.split('whatsapp.com/channel/')[1]?.split(' ')[0];
                                if (!channelCode) throw new Error('Invalid channel link');
                                const channelJid = `120363${channelCode}@newsletter`;
                                reply(`Channel JID: ${channelJid}`);
                            } catch (e) {
                                reply(`❌ *Error:* ${e.message}.\nUsage: .juid <channel link>\nExample: .juid https://whatsapp.com/channel/INVITE_CODE`);
                            }
                            break;

                        case 'chatbot':
                            if (!isGroup) return reply('Group only');
                            if (!isAdmin) return reply('Admin only');
                            if (!args || !['on', 'off'].includes(args.toLowerCase())) return reply(`
❗ *Invalid Option!*
Usage: .chatbot <on|off>
Example: .chatbot on
                            `.trim());
                            try {
                                groupSettings.chatbot = args.toLowerCase() === 'on';
                                saveDB();
                                reply(`Chatbot set to *${args.toLowerCase()}* for this group`);
                            } catch (e) {
                                reply(`❌ *Error:* ${e.message}.\nUsage: .chatbot <on|off>\nExample: .chatbot on`);
                            }
                            break;

                        case 'lid':
                        case 'rawid':
                            if (!mention && !args) return reply(`
❗ *User Required!*
Usage: .${cmd} <@user | phone number>
Example: .${cmd} @254123456789
                            `.trim());
                            const lidUser = mention || args.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                            try {
                                reply(`JID: ${lidUser}`);
                            } catch (e) {
                                reply(`❌ *Error:* ${e.message}.\nUsage: .${cmd} <@user | phone number>\nExample: .${cmd} @254123456789`);
                            }
                            break;

                        case 'permanentban':
                            if (!isOwner && !isSudo) return reply('Owner or sudo only');
                            if (!mention && !args) return reply(`
❗ *User Required!*
Usage: .permanentban <@user | phone number>
Examples:
- .permanentban @254123456789
- .permanentban 254123456789
                            `.trim());
                            const banTarget = mention || args.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                            if (banTarget === sock.user.id) return reply('I can’t ban myself! 😅');
                            if (DB.sudo.includes(banTarget)) return reply('You can’t ban a sudo user.');
                            try {
                                await reply(`⏳ *Initiating Permanent Ban...* Banning @${banTarget.split('@')[0]} for 24 hours.`, { mentions: [banTarget] });
                                const banResponse = await fetch('https://api.whatsapp.com/v1/moderation/ban', {
                                    method: 'POST',
                                    headers: {
                                        'Authorization': `Bearer ${API_KEYS.whatsapp}`,
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({
                                        userJid: banTarget,
                                        duration: 24 * 60 * 60,
                                        reason: 'Violation of group rules'
                                    })
                                }).then(r => r.json());
                                if (banResponse.success) {
                                    DB.blocked.push(banTarget);
                                    saveDB();
                                    await sock.sendMessage(from, {
                                        text: `🚫 *User Banned!* @${banTarget.split('@')[0]} has been banned from WhatsApp for 24 hours.`,
                                        mentions: [banTarget]
                                    });
                                    await sock.sendMessage(BOT.owner + '@s.whatsapp.net', {
                                        text: `Permanent Ban Executed\nUser: @${banTarget.split('@')[0]}\nBy: @${sender.split('@')[0]}\nDuration: 24 hours`,
                                        mentions: [banTarget, sender]
                                    });
                                } else {
                                    throw new Error(banResponse.error || 'Ban request failed');
                                }
                            } catch (e) {
                                reply(`❌ *Error:* ${e.message}.\nUsage: .permanentban <@user | phone number>\nExamples:\n- .permanentban @254123456789\n- .permanentban 254123456789`);
                            }
                            break;

                        default:
                            reply(`
❗ *Unknown Command*
Type .menu to see all available commands.
Example: .menu
                            `.trim());
                    }
                } catch (e) {
                    console.log(chalk.redBright(`Message Handler Error: ${e.message}`));
                    await sock.sendMessage(from, { text: `❌ *Error:* ${e.message}\nTry again or type .menu for help.` });
                }
            }
        }
    });

    process.on('uncaughtException', async (err) => {
        console.log(chalk.redBright('Uncaught Exception:', err.message));
        await sock.sendMessage(BOT.owner + '@s.whatsapp.net', {
            text: `🚨 *Bot Error*\n\nError: ${err.message}\nStack: ${err.stack}\n\nPlease check the logs!`
        });
    });
}

startBot();
EOF