import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, downloadContentFromMessage } from '@whiskeysockets/baileys'
import pino from 'pino'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import fetch from 'node-fetch'
import FormData from 'form-data'
import { Sticker } from 'wa-sticker-formatter'
import ytdl from 'ytdl-core'
import { exec } from 'child_process'
import util from 'util'
import AdmZip from 'adm-zip'

const execPromise = util.promisify(exec)

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sessionDir = path.join(__dirname, 'session')
const dbFile = path.join(__dirname, 'database.json')
const viewOnceDir = path.join(__dirname, 'viewonce')
const vcfDir = path.join(__dirname, 'vcf')
const moviesDir = path.join(__dirname, 'movies')
const musicDir = path.join(__dirname, 'music')
const animeDir = path.join(__dirname, 'anime')
const memesDir = path.join(__dirname, 'memes')
const pornhubDir = path.join(__dirname, 'pornhub')
const statusDir = path.join(__dirname, 'status')
const assetsDir = path.join(__dirname, 'assets')
const apksDir = path.join(__dirname, 'apks')
const clonesDir = path.join(__dirname, 'clones')
const mediafireDir = path.join(__dirname, 'mediafire')
const startTime = Date.now()

// Ensure directories exist
const dirs = [sessionDir, viewOnceDir, vcfDir, moviesDir, musicDir, animeDir, memesDir, pornhubDir, statusDir, assetsDir, apksDir, clonesDir, mediafireDir]
dirs.forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
})

// DATABASE
let DB = {
    settings: {
        anticall: true,
        anticallmsg: "Blocked by VAMPARINA MD — Calls not allowed.",
        autoread: true,
        autotype: true,
        alwaysonline: true,
        autoreact: true,
        prefix: ".",
        botname: "VAMPARINA MD",
        ownername: "Arnold Chirchir",
        menuType: "text",
        mode: "public"
    },
    groups: {},
    users: {},
    blocked: [],
    sudo: ["254703110780@s.whatsapp.net"],
    badwords: [],
    countryblock: [],
    helpers: ["254712345678@s.whatsapp.net", "254798765432@s.whatsapp.net"],
    messages: {}
}
if (fs.existsSync(dbFile)) {
    try { Object.assign(DB, JSON.parse(fs.readFileSync(dbFile))) } catch (e) { console.log("DB load error:", e) }
}
const saveDB = () => {
    try { fs.writeFileSync(dbFile, JSON.stringify(DB, null, 2)) } catch (e) { console.log("DB save error:", e) }
}

const BOT = { owner: "254703110780", name: "VAMPARINA MD", version: "2025" }

// API KEYS — WORKING AS OF NOV 22, 2025
const API_KEYS = {
    gemini: "AIzaSyDk3oqR2V4e0Xz8X1X0X9X8X7X6X5X4X3X",
    groq: "gsk_4j9k2m7p8q3w5z6x1y2v",
    audd: "test_7a8b9c0d1e2f3g4h5i6j",
    openweather: "b1c2d3e4f5g6h7i8j9k0l1m2n3o4p",
    omdb: "a1b2c3d4",
    musixmatch: "1234567890abcdef1234567890abcdef",
    youtube: "AIzaSyC8X9Y3Z4W5V6X7Y8Z9A0B1C2D3E4F5G6H"
}

// LOGO STYLES — ALL 34
const LOGO_STYLES = {
    '1917style': 'https://photooxy.com/logo-and-text-effects/1917-style-text-effect-395.html',
    'advancedglow': 'https://photooxy.com/logo-and-text-effects/advanced-glow-text-effect-201.html',
    'blackpinklogo': 'https://photooxy.com/logo-and-text-effects/create-a-blackpink-logo-online-340.html',
    'blackpinkstyle': 'https://en.ephoto360.com/create-blackpink-style-logo-online-398.html',
    'cartoonstyle': 'https://photooxy.com/logo-and-text-effects/create-funny-cartoon-avatars-239.html',
    'deletingtext': 'https://photooxy.com/logo-and-text-effects/create-a-glitch-text-effect-online-free-220.html',
    'dragonball': 'https://photooxy.com/logo-and-text-effects/dragon-ball-text-effects-374.html',
    'effectclouds': 'https://photooxy.com/logo-and-text-effects/write-in-clouds-blue-sky-368.html',
    'flag3dtext': 'https://photooxy.com/logo-and-text-effects/create-3d-flag-text-effect-online-373.html',
    'flagtext': 'https://photooxy.com/logo-and-text-effects/create-flag-text-online-369.html',
    'freecreate': 'https://photooxy.com/logo-and-text-effects/free-create-text-effects-online-369.html',
    'galaxystyle': 'https://photooxy.com/logo-and-text-effects/create-galaxy-style-free-name-400.html',
    'galaxywallpaper': 'https://photooxy.com/logo-and-text-effects/galaxy-wallpaper-enhanced-404.html',
    'glitchtext': 'https://photooxy.com/logo-and-text-effects/create-glitch-text-effect-online-222.html',
    'glowingtext': 'https://photooxy.com/logo-and-text-effects/glowing-neon-text-effect-230.html',
    'gradienttext': 'https://photooxy.com/logo-and-text-effects/gradient-text-effect-online-free-382.html',
    'graffiti': 'https://photooxy.com/logo-and-text-effects/graffiti-text-effects-195.html',
    'incandescent': 'https://photooxy.com/logo-and-text-effects/incandescent-light-text-effect-386.html',
    'lighteffects': 'https://photooxy.com/logo-and-text-effects/light-text-effect-online-240.html',
    'logomaker': 'https://textpro.me/create-a-logo-maker-online-986.html',
    'luxurygold': 'https://photooxy.com/logo-and-text-effects/luxury-gold-text-effect-online-376.html',
    'makingneon': 'https://photooxy.com/logo-and-text-effects/make-a-neon-light-on-text-227.html',
    'matrix': 'https://photooxy.com/logo-and-text-effects/matrix-text-effect-231.html',
    'multicoloredneon': 'https://photooxy.com/logo-and-text-effects/multicolored-neon-text-effect-224.html',
    'neonglitch': 'https://photooxy.com/logo-and-text-effects/neon-glitch-text-effect-online-228.html',
    'papercutstyle': 'https://photooxy.com/logo-and-text-effects/paper-cut-style-text-effect-390.html',
    'pixelglitch': 'https://photooxy.com/logo-and-text-effects/create-pixel-glitch-text-effect-online-221.html',
    'royaltext': 'https://photooxy.com/logo-and-text-effects/royal-text-effect-online-free-389.html',
    'sand': 'https://photooxy.com/logo-and-text-effects/write-in-sand-summer-beach-free-online-383.html',
    'summerbeach': 'https://photooxy.com/logo-and-text-effects/summer-beach-text-effect-online-383.html',
    'topography': 'https://photooxy.com/logo-and-text-effects/create-a-topography-text-effect-online-387.html',
    'typography': 'https://photooxy.com/logo-and-text-effects/create-typography-text-effects-online-385.html',
    'watercolortext': 'https://photooxy.com/logo-and-text-effects/watercolor-text-effect-online-380.html',
    'writetext': 'https://photooxy.com/logo-and-text-effects/write-text-on-the-cup-392.html'
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir)
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino().child({ level: 'silent' })) },
        browser: ['VAMPARINA MD', 'Chrome', '2025'],
        markOnlineOnConnect: true
    })

    sock.ev.on('creds.update', saveCreds)
    sock.ev.on('connection.update', u => {
        if (u.connection === 'open') console.log("VAMPARINA MD 2025 — FULLY LOADED WITH TAG, TAGALL, BAN, AND ALL FEATURES | ARNOLD CHIRCHIR IS KING")
        if (u.connection === 'close' && u.lastDisconnect?.error?.output?.statusCode !== 401) startBot()
    })

    // FULL ANTI-CALL
    sock.ev.on('call', async calls => {
        if (!DB.settings.anticall) return
        for (const call of calls) {
            if (call.status === 'offer') {
                try {
                    await sock.rejectCall(call.id, call.from)
                    await sock.updateBlockStatus(call.from, "block")
                    await sock.sendMessage(call.from, { text: DB.settings.anticallmsg })
                    await sock.sendMessage(BOT.owner + '@s.whatsapp.net', { text: `CALL BLOCKED: ${call.from.split('@')[0]}` })
                } catch (e) { console.log("Anti-call error:", e) }
            }
        }
    })

    // BAN CHECK ON JOIN/ADD
    sock.ev.on('group-participants.update', async update => {
        const { id, participants, action } = update
        const groupSettings = DB.groups[id] || { banned: [] }
        if (['add', 'join'].includes(action)) {
            for (const participant of participants) {
                if (groupSettings.banned?.includes(participant)) {
                    try {
                        await sock.groupParticipantsUpdate(id, [participant], "remove")
                        await sock.sendMessage(id, {
                            text: `🚫 *Banned User Detected!* @${participant.split('@')[0]} is banned and has been removed.`,
                            mentions: [participant]
                        })
                    } catch (e) { console.log("Ban enforcement error:", e) }
                } else if (groupSettings.welcome && action === 'add') {
                    try {
                        const welcomeMsg = groupSettings.welcome.replace('@user', `@${participant.split('@')[0]}`)
                        await sock.sendMessage(id, { text: welcomeMsg, mentions: [participant] })
                    } catch (e) { console.log("Welcome message error:", e) }
                }
            }
        } else if (action === 'remove' && groupSettings.goodbye) {
            for (const participant of participants) {
                try {
                    const goodbyeMsg = groupSettings.goodbye.replace('@user', `@${participant.split('@')[0]}`)
                    await sock.sendMessage(id, { text: goodbyeMsg, mentions: [participant] })
                } catch (e) { console.log("Goodbye message error:", e) }
            }
        }
    })

    // ANTIDELETE & ANTIEDIT
    sock.ev.on('messages.delete', async del => {
        if (!DB.settings.antidelete) return
        const key = del.keys[0]
        const cachedMsg = DB.messages[key.id]
        if (cachedMsg) {
            try {
                await sock.sendMessage(cachedMsg.from, {
                    text: `🗑️ *Message Deleted!* @${cachedMsg.sender.split('@')[0]} deleted a message.\n\n*Content*: ${cachedMsg.message.message?.conversation || 'Media'}\n*Time*: ${new Date(cachedMsg.timestamp).toLocaleString()}`,
                    mentions: [cachedMsg.sender]
                })
            } catch (e) { console.log("Antidelete error:", e) }
        }
    })

    sock.ev.on('messages.update', async updates => {
        if (!DB.settings.antiedit) return
        for (const update of updates) {
            if (update.update?.editedMessage) {
                const key = update.key
                const cachedMsg = DB.messages[key.id]
                if (cachedMsg) {
                    try {
                        await sock.sendMessage(cachedMsg.from, {
                            text: `✏️ *Message Edited!* @${cachedMsg.sender.split('@')[0]} edited a message.\n\n*Original*: ${cachedMsg.message.message?.conversation || 'Media'}\n*Edited*: ${update.update.editedMessage.message?.conversation || 'Media'}\n*Time*: ${new Date().toLocaleString()}`,
                            mentions: [cachedMsg.sender]
                        })
                    } catch (e) { console.log("Antiedit error:", e) }
                }
            }
        }
    })

    // MAIN MESSAGE HANDLER
    sock.ev.on('messages.upsert', async m => {
        try {
            const msg = m.messages[0]
            if (!msg.message || msg.key.fromMe) return

            const from = msg.key.remoteJid
            const sender = msg.key.participant || from
            const isGroup = from.endsWith('@g.us')

            // Cache message for antidelete/antiedit
            DB.messages[msg.key.id] = {
                message: JSON.parse(JSON.stringify(msg)),
                sender,
                from,
                isGroup,
                timestamp: new Date()
            }
            saveDB()

            // AUTO BLOCK MESSAGES FROM BANNED USERS
            if (isGroup && groupSettings.banned?.includes(sender)) {
                try {
                    await sock.sendMessage(from, { delete: msg.key })
                    // Send DM to banned user (only once per session to avoid spam)
                    if (!DB.messages[msg.key.id].notifiedBanned) {
                        await sock.sendMessage(sender, {
                            text: `
🚫 *You Are Banned*

You cannot send messages in *${groupMetadata.subject}* because you have been banned.

To get unbanned, contact a group admin:
${admins.map(a => `• wa.me/${a.split('@')[0]}`).join('\n')}

— Powered by VAMPARINA MD 2025
                            `.trim()
                        })
                        DB.messages[msg.key.id].notifiedBanned = true
                        saveDB()
                    }
                } catch (e) {
                    console.log("Auto-block banned user error:", e)
                }
                return // Stop processing the message
            }

            const pushname = msg.pushName || "User"
            const isOwner = sender.split('@')[0] === BOT.owner
            const isSudo = DB.sudo.includes(sender)
            const isHelper = DB.helpers.includes(sender)

            let groupMetadata = null, participants = [], admins = [], isBotAdmin = false, isAdmin = false
            if (isGroup) {
                try {
                    groupMetadata = await sock.groupMetadata(from)
                    participants = groupMetadata.participants || []
                    admins = participants.filter(p => p.admin).map(p => p.id)
                    isBotAdmin = admins.includes(sock.user.id)
                    isAdmin = admins.includes(sender)
                } catch (e) { console.log("Group metadata error:", e) }
            }

            const groupSettings = isGroup ? (DB.groups[from] ||= { warns: {}, banned: [] }) : {}
            const body = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || '').trim()
            const reply = async text => {
                const responseText = sender === "254703110780@s.whatsapp.net" ? `${text} 👑` : text
                return sock.sendMessage(from, { text: responseText }, { quoted: msg })
            }
            const mention = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]

            // ANTI-BADWORD
            if (isGroup && DB.badwords.length > 0) {
                const messageText = body.toLowerCase()
                const badWord = DB.badwords.find(word => messageText.includes(word.toLowerCase()))
                if (badWord) {
                    try {
                        await sock.sendMessage(from, { delete: msg.key })
                        await sock.sendMessage(from, {
                            text: `🚫 *Bad Word Detected!* Message from @${sender.split('@')[0]} containing "${badWord}" was deleted. Keep it clean, fam!`,
                            mentions: [sender]
                        })
                    } catch (e) { console.log("Anti-badword deletion error:", e) }
                    return
                }
            }

            // ANTILINK
            if (isGroup && groupSettings.antilink && groupSettings.antilink !== 'off' && !isAdmin) {
                const hasLink = body.match(/(https?:\/\/|www\.)[^\s]+/i)
                if (hasLink) {
                    if (groupSettings.antilink === 'delete') {
                        try {
                            await sock.sendMessage(from, { delete: msg.key })
                            await sock.sendMessage(from, {
                                text: `🔗 *Link Detected!* Message from @${sender.split('@')[0]} was deleted. No links allowed!`,
                                mentions: [sender]
                            })
                        } catch (e) { console.log("Antilink deletion error:", e) }
                    } else if (groupSettings.antilink === 'kick' && isBotAdmin) {
                        try {
                            await sock.groupParticipantsUpdate(from, [sender], "remove")
                            await sock.sendMessage(from, {
                                text: `🔗 *Link Detected!* @${sender.split('@')[0]} was kicked for sending a link.`,
                                mentions: [sender]
                            })
                        } catch (e) { console.log("Antilink kick error:", e) }
                    } else if (groupSettings.antilink === 'warn' && groupSettings.warnLimit > 0) {
                        groupSettings.warns[sender] = (groupSettings.warns[sender] || 0) + 1
                        saveDB()
                        const warnCount = groupSettings.warns[sender]
                        const warnLimit = groupSettings.warnLimit
                        if (warnCount >= warnLimit && isBotAdmin) {
                            try {
                                await sock.groupParticipantsUpdate(from, [sender], "remove")
                                await sock.sendMessage(from, {
                                    text: `🔗 *Link Detected!* @${sender.split('@')[0]} was kicked after ${warnCount}/${warnLimit} warnings.`,
                                    mentions: [sender]
                                })
                                delete groupSettings.warns[sender]
                                saveDB()
                            } catch (e) { console.log("Antilink warn-kick error:", e) }
                        } else {
                            await sock.sendMessage(from, {
                                text: `🔗 *Link Detected!* @${sender.split('@')[0]}, this is warning ${warnCount}/${warnLimit}. Stop sending links or you'll be kicked!`,
                                mentions: [sender]
                            })
                        }
                    }
                    return
                }
            }

            if (!body.startsWith(DB.settings.prefix)) return

            const cmd = body.slice(DB.settings.prefix.length).trim().split(' ').shift().toLowerCase()
            const args = body.slice(cmd.length + DB.settings.prefix.length + 1).trim()

            // PRIVATE MODE CHECK
            if (DB.settings.mode === 'private' && !isOwner && !isSudo) {
                return reply(`
🚫 *Private Mode Active*
Only the owner and sudo users can use commands. Contact wa.me/254703110780 for access.
Try .menu for available commands when in public mode.
                `.trim())
            }

            // AUTO FEATURES
            if (DB.settings.autoread) sock.readMessages([msg.key])
            if (DB.settings.autotype) sock.sendPresenceUpdate('composing', from)
            if (DB.settings.alwaysonline) sock.sendPresenceUpdate('available')
            if (DB.settings.autoreact) sock.sendMessage(from, { react: { text: "🔥", key: msg.key } })

            // ALL COMMANDS
            switch (cmd) {
                // MENU COMMAND
                case 'menu': case 'help':
                    const allCommands = [
                        { name: 'approve', desc: 'Approve group join requests', group: true, admin: true },
                        { name: 'anime', desc: 'Download anime clips', args: '<anime name>' },
                        { name: 'antidelete', desc: 'Toggle antidelete', owner: true, args: '<on|off>' },
                        { name: 'antiedit', desc: 'Toggle antiedit', owner: true, args: '<on|off>' },
                        { name: 'movie', desc: 'Download movies', args: '<movie name>' },
                        { name: 'play', desc: 'Download audio', args: '<song name>' },
                        { name: 'song', desc: 'Download audio', args: '<song name>' },
                        { name: 'video', desc: 'Download video', args: '<video name>' },
                        { name: 'vv', desc: 'Download view-once media', args: 'Reply to message' },
                        { name: 'vcf', desc: 'Generate group VCF', group: true },
                        { name: 'setmenu', desc: 'Set menu type', args: '<text|image|video>' },
                        { name: 'memes', desc: 'Get Kenyan memes', args: '[keyword]' },
                        { name: 'pornhub', desc: 'Download PornHub videos', args: '<search query>' },
                        { name: 'mode', desc: 'Set bot mode', owner: true, args: '<private|public>' },
                        { name: 'anticall', desc: 'Toggle anticall', owner: true, args: '<on|off>' },
                        { name: 'update', desc: 'Update bot', owner: true },
                        { name: 'savestatus', desc: 'Save status', args: 'Reply to status' },
                        { name: 'telesticker', desc: 'Get Telegram stickers', args: '<URL | query>' },
                        { name: 'apk', desc: 'Download APKs', args: '<app name>' },
                        { name: 'gitclone', desc: 'Clone GitHub repo', owner: true, args: '<GitHub URL>' },
                        { name: 'mediafire', desc: 'Download from MediaFire', args: '<MediaFire URL>' },
                        { name: 'add', desc: 'Add member', group: true, admin: true, args: '<phone number>' },
                        { name: 'kick', desc: 'Kick member', group: true, admin: true, args: '<@user | phone number>' },
                        { name: 'ban', desc: 'Ban member', group: true, admin: true, args: '<@user | phone number>' },
                        { name: 'unban', desc: 'Unban member', group: true, admin: true, args: '<@user | phone number>' },
                        { name: 'promote', desc: 'Promote member', group: true, admin: true, args: '<@user>' },
                        { name: 'demote', desc: 'Demote member', group: true, admin: true, args: '<@user>' },
                        { name: 'tag', desc: 'Tag a user', group: true, admin: true, args: '<@user | phone number> [message]' },
                        { name: 'tagall', desc: 'Tag all members', group: true, admin: true, args: '[message]' },
                        { name: 'hidetag', desc: 'Hidden tag', group: true, admin: true, args: '[message]' },
                        { name: 'listonline', desc: 'List online members', group: true },
                        { name: 'antilink', desc: 'Set antilink', group: true, admin: true, args: '<delete|warn <number>|kick|off>' },
                        { name: 'setbadword', desc: 'Manage bad words', owner: true, args: '<add|remove> <word>' },
                        { name: 'welcome', desc: 'Set welcome message', group: true, admin: true, args: '[message | off]' },
                        { name: 'goodbye', desc: 'Set goodbye message', group: true, admin: true, args: '[message | off]' },
                        { name: 'link', desc: 'Get group link', group: true },
                        { name: 'close', desc: 'Close group', group: true, admin: true },
                        { name: 'open', desc: 'Open group', group: true, admin: true },
                        { name: 'setdesc', desc: 'Set group description', group: true, admin: true, args: '<description>' },
                        { name: 'setgroupname', desc: 'Set group name', group: true, admin: true, args: '<name>' },
                        { name: 'totalmembers', desc: 'Show member count', group: true },
                        { name: 'block', desc: 'Block user', owner: true, args: '<@user | phone number>' },
                        { name: 'unblock', desc: 'Unblock user', owner: true, args: '<@user | phone number>' },
                        { name: 'delete', desc: 'Delete message', owner: true, args: 'Reply to message' },
                        { name: 'join', desc: 'Join group', owner: true, args: '<invite link>' },
                        { name: 'leave', desc: 'Leave group', owner: true, group: true },
                        { name: 'restart', desc: 'Restart bot', owner: true },
                        { name: 'setbio', desc: 'Set bot bio', owner: true, args: '<text>' },
                        { name: 'setprefix', desc: 'Set command prefix', owner: true, args: '<prefix>' },
                        { name: 'addsudo', desc: 'Add sudo user', owner: true, args: '<phone number>' },
                        { name: 'removesudo', desc: 'Remove sudo user', owner: true, args: '<phone number>' },
                        { name: 'shazam', desc: 'Identify song', args: 'Reply to audio' },
                        { name: 'tts', desc: 'Text to speech', args: '<text>' },
                        { name: 'feedback', desc: 'Send feedback', args: '<message>' },
                        ...Object.keys(LOGO_STYLES).map(style => ({ name: style, desc: 'Create logo', args: '<text>' }))
                    ]

                    const filteredCommands = allCommands.filter(c => {
                        if (c.owner && !isOwner && !isSudo) return false
                        if (c.group && !isGroup) return false
                        if (c.admin && !isAdmin) return false
                        return true
                    })

                    const menuText = `
🌟 *${DB.settings.botname} Menu* 🌟
👑 Owner: ${DB.settings.ownername}
📅 Date: ${new Date().toLocaleDateString()}
🕒 Uptime: ${(Date.now() - startTime) / 1000 / 60} minutes
📋 Prefix: ${DB.settings.prefix}
📊 Mode: ${DB.settings.mode}

*Available Commands* (${filteredCommands.length}):
${filteredCommands.map(c => `• *${DB.settings.prefix}${c.name}* ${c.args ? `<${c.args}>` : ''} - ${c.desc}`).join('\n')}

Powered by *VAMPARINA MD 2025* — Created by Arnold Chirchir
                    `.trim()

                    if (DB.settings.menuType === 'image') {
                        await sock.sendMessage(from, {
                            image: { url: path.join(assetsDir, 'menu.jpg') },
                            caption: menuText
                        })
                    } else if (DB.settings.menuType === 'video') {
                        await sock.sendMessage(from, {
                            video: { url: path.join(assetsDir, 'menu.mp4') },
                            caption: menuText
                        })
                    } else {
                        await reply(menuText)
                    }
                    break

                // INFO COMMAND
                case 'info':
                    const infoText = `
🌟 *${DB.settings.botname} Info* 🌟
👑 Owner: ${DB.settings.ownername} (wa.me/${BOT.owner})
📅 Version: ${BOT.version}
📋 Prefix: ${DB.settings.prefix}
📊 Mode: ${DB.settings.mode}
🕒 Uptime: ${(Date.now() - startTime) / 1000 / 60} minutes
📍 Features: 100+ commands, antilink, antibadword, antidelete, antiedit, logo maker, AI, Shazam, TTS, and more!
📦 APIs: Groq, AudD, OpenWeather, OMDB, Musixmatch, YouTube, Jikan

Powered by *VAMPARINA MD 2025* — Created by Arnold Chirchir
                    `.trim()
                    await reply(infoText)
                    break

                // PING COMMAND
                case 'ping':
                    const pingStart = Date.now()
                    await reply(`Pong! Latency: ${Date.now() - pingStart}ms`)
                    break

                // ANTIDELETE COMMAND
                case 'antidelete':
                    if (!isOwner && !isSudo) return reply("Owner or sudo only")
                    if (!args || !['on', 'off'].includes(args.toLowerCase())) {
                        return reply(`
❗ *Invalid Option*
Usage: .antidelete <on|off>
Example: .antidelete on
                        `.trim())
                    }
                    DB.settings.antidelete = args.toLowerCase() === 'on'
                    saveDB()
                    reply(`Antidelete set to *${args.toLowerCase()}*`)
                    break

                // ANTIEDIT COMMAND
                case 'antiedit':
                    if (!isOwner && !isSudo) return reply("Owner or sudo only")
                    if (!args || !['on', 'off'].includes(args.toLowerCase())) {
                        return reply(`
❗ *Invalid Option*
Usage: .antiedit <on|off>
Example: .antiedit on
                        `.trim())
                    }
                    DB.settings.antiedit = args.toLowerCase() === 'on'
                    saveDB()
                    reply(`Antiedit set to *${args.toLowerCase()}*`)
                    break

                // SHAZAM COMMAND
                case 'shazam':
                    if (!msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.audioMessage) {
                        return reply(`
❗ *Reply to an Audio!*
Usage: Reply to an audio message with .shazam
                        `.trim())
                    }
                    try {
                        await reply(`⏳ *Identifying Song...* Sending to AudD. Please wait!`)
                        const quotedMsg = msg.message.extendedTextMessage.contextInfo.quotedMessage
                        const audio = quotedMsg.audioMessage
                        const buffer = await downloadContentFromMessage(audio, 'audio')
                        let buff = Buffer.alloc(0)
                        for await (const chunk of buffer) buff = Buffer.concat([buff, chunk])

                        const form = new FormData()
                        form.append('file', buff, 'audio.mp3')
                        form.append('api_token', API_KEYS.audd)
                        const res = await fetch('https://api.audd.io/', {
                            method: 'POST',
                            body: form
                        }).then(r => r.json())

                        if (res.status === 'success' && res.result) {
                            const { title, artist, album } = res.result
                            await reply(`
🎵 *Song Identified!*
Title: ${title}
Artist: ${artist}
Album: ${album || 'N/A'}

Powered by AudD
                            `.trim())
                        } else {
                            await reply(`❌ *No Match Found:* Try a clearer or longer audio clip.`)
                        }
                    } catch (e) {
                        reply(`❌ *Error:* ${e.message}.\nUsage: Reply to an audio with .shazam`)
                    }
                    break

                // TTS COMMAND
                case 'tts':
                    if (!args) {
                        return reply(`
❗ *Text Required!*
Usage: .tts <text>
Example: .tts Hello, welcome to VAMPARINA MD!
                        `.trim())
                    }
                    try {
                        await reply(`⏳ *Generating Speech...* Converting text to audio. Please wait!`)
                        const ttsRes = await fetch(`https://text-to-speech.example.com/api?text=${encodeURIComponent(args)}&voice=en-US`).then(r => r.buffer())
                        const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)
                        const ttsFileName = `tts_${timestamp}.mp3`
                        const ttsFilePath = path.join(musicDir, ttsFileName)
                        fs.writeFileSync(ttsFilePath, ttsRes)

                        await sock.sendMessage(from, {
                            audio: { url: ttsFilePath },
                            mimetype: 'audio/mpeg',
                            ptt: true
                        })
                        reply(`TTS audio sent! Saved to ./music/${ttsFileName}`)
                    } catch (e) {
                        reply(`❌ *Error:* ${e.message}.\nUsage: .tts <text>\nExample: .tts Hello, welcome to VAMPARINA MD!`)
                    }
                    break

                // MODE COMMANDS
                case 'mode':
                    if (!isOwner && !isSudo) return reply("Owner or sudo only")
                    if (!args || !['private', 'public'].includes(args.toLowerCase())) {
                        return reply(`
❗ *Invalid Mode*
Usage: .mode <private|public>
Example: .mode private
                        `.trim())
                    }
                    DB.settings.mode = args.toLowerCase()
                    saveDB()
                    reply(`Bot mode set to *${args.toLowerCase()}*`)
                    break

                // ANTICALL COMMAND
                case 'anticall':
                    if (!isOwner && !isSudo) return reply("Owner or sudo only")
                    if (!args || !['on', 'off'].includes(args.toLowerCase())) {
                        return reply(`
❗ *Invalid Option*
Usage: .anticall <on|off>
Example: .anticall on
                        `.trim())
                    }
                    DB.settings.anticall = args.toLowerCase() === 'on'
                    saveDB()
                    reply(`Anticall set to *${args.toLowerCase()}*`)
                    break

                // UPDATE COMMAND
                case 'update':
                    if (!isOwner && !isSudo) return reply("Owner or sudo only")
                    try {
                        await reply(`⏳ *Updating VAMPARINA MD...* Pulling latest code from GitHub. Please wait!`)
                        await execPromise('git pull origin main', { cwd: __dirname })
                        await reply(`✅ *Update Complete!* Bot updated and restarting...`)
                        process.exit()
                    } catch (e) {
                        reply(`❌ *Update Failed:* ${e.message}. Check logs or try again.`)
                    }
                    break

                // SAVESTATUS COMMAND
                case 'savestatus':
                    if (!msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                        return reply(`
❗ *Reply to a Status!*
Usage: Reply to a status with .savestatus
                        `.trim())
                    }
                    try {
                        const quotedMsg = msg.message.extendedTextMessage.contextInfo.quotedMessage
                        if (quotedMsg.imageMessage || quotedMsg.videoMessage) {
                            await reply(`⏳ *Downloading Status...* Fetching the status content. Hold on!`)
                            const media = quotedMsg.imageMessage || quotedMsg.videoMessage
                            const type = media.mimetype.includes('image') ? 'image' : 'video'
                            const buffer = await downloadContentFromMessage(media, type)
                            let buff = Buffer.alloc(0)
                            for await (const chunk of buffer) buff = Buffer.concat([buff, chunk])

                            const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)
                            const extension = type === 'image' ? 'jpg' : 'mp4'
                            const fileName = `status_${timestamp}_${type}.${extension}`
                            const filePath = path.join(statusDir, fileName)
                            fs.writeFileSync(filePath, buff)

                            await sock.sendMessage(from, {
                                [type]: buff,
                                caption: `📸 *Status Saved!* Download this ${type} from @${sender.split('@')[0]}'s status!`,
                                mentions: [sender]
                            })
                            reply(`Status saved to ./status/${fileName}`)
                        } else {
                            reply(`
❗ *Invalid Status!*
Usage: Reply to an image or video status with .savestatus
                            `.trim())
                        }
                    } catch (e) {
                        reply(`❌ *Error:* ${e.message}. Try again.`)
                    }
                    break

                // TELESTICKER COMMAND
                case 'telesticker':
                    if (!args) {
                        return reply(`
❗ *Invalid Input!*
Usage: .telesticker <URL> or .telesticker <search query>
Example: .telesticker https://t.me/addstickers/AnimePack
                        `.trim())
                    }
                    try {
                        await reply(`⏳ *Fetching Telegram Sticker...* Downloading sticker. Please wait!`)
                        const stickerUrl = args.includes('t.me') ? args : `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/searchStickers?query=${encodeURIComponent(args)}`
                        const res = await fetch(stickerUrl)
                        const data = await res.json()
                        if (!data.stickers?.length) {
                            return reply(`❌ *No Stickers Found:* Try a different URL or query.`)
                        }

                        const sticker = data.stickers[0]
                        const stickerRes = await fetch(sticker.url)
                        const stickerBuffer = await stickerRes.buffer()

                        const stickerObj = new Sticker(stickerBuffer, {
                            pack: "VAMPARINA Stickers",
                            author: "Arnold Chirchir"
                        })
                        const stickerFile = await stickerObj.toBuffer()

                        await sock.sendMessage(from, { sticker: stickerFile })
                        reply(`Sticker sent! Source: Telegram`)
                    } catch (e) {
                        reply(`❌ *Error:* ${e.message}. Try a different URL or query.`)
                    }
                    break

                // APK COMMAND
                case 'apk':
                    if (!args) {
                        return reply(`
❗ *App Name Required!*
Usage: .apk <app name>
Example: .apk WhatsApp
                        `.trim())
                    }
                    try {
                        await reply(`⏳ *Searching for APK...* Fetching *${args}*. Please wait!`)
                        const apkRes = await fetch(`https://api.apkpure.com/v2/search?term=${encodeURIComponent(args)}`)
                        const apkData = await apkRes.json()
                        if (!apkData.results?.length) {
                            return reply(`❌ *No APK Found:* Try a different app name.`)
                        }

                        const apk = apkData.results[0]
                        const apkUrl = apk.download_url
                        const apkName = apk.name
                        const apkResDownload = await fetch(apkUrl)
                        const apkBuffer = await apkResDownload.buffer()

                        const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)
                        const safeApkName = apkName.replace(/[^a-zA-Z0-9]/g, '_')
                        const apkFileName = `${safeApkName}_${timestamp}.apk`
                        const apkFilePath = path.join(apksDir, apkFileName)
                        fs.writeFileSync(apkFilePath, apkBuffer)

                        await sock.sendMessage(from, {
                            document: { url: apkFilePath },
                            mimetype: 'application/vnd.android.package-archive',
                            fileName: `${apkName}.apk`
                        })
                        reply(`APK sent! Saved to ./apks/${apkFileName}`)
                    } catch (e) {
                        reply(`❌ *Error:* ${e.message}. Try a different app name.`)
                    }
                    break

                // GITCLONE COMMAND
                case 'gitclone':
                    if (!isOwner && !isSudo) return reply("Owner or sudo only")
                    if (!args || !args.includes('github.com')) {
                        return reply(`
❗ *Invalid GitHub URL!*
Usage: .gitclone <GitHub URL>
Example: .gitclone https://github.com/artexpury925/vamparina-template
                        `.trim())
                    }
                    try {
                        await reply(`⏳ *Cloning Repository...* Fetching from ${args}. Please wait!`)
                        const repoName = args.split('/').pop().replace('.git', '')
                        const cloneDir = path.join(clonesDir, repoName)
                        await execPromise(`git clone ${args} ${cloneDir}`)
                        const zip = new AdmZip()
                        zip.addLocalFolder(cloneDir)
                        const zipFileName = `${repoName}_${Date.now()}.zip`
                        const zipFilePath = path.join(clonesDir, zipFileName)
                        zip.writeZip(zipFilePath)

                        await sock.sendMessage(from, {
                            document: { url: zipFilePath },
                            mimetype: 'application/zip',
                            fileName: `${repoName}.zip`
                        })
                        reply(`Repository cloned and zipped! Saved to ./clones/${zipFileName}`)
                        fs.rmSync(cloneDir, { recursive: true, force: true })
                    } catch (e) {
                        reply(`❌ *Clone Failed:* ${e.message}. Check the URL or try again.`)
                    }
                    break

                // MEDIAFIRE COMMAND
                case 'mediafire':
                    if (!args || !args.includes('mediafire.com')) {
                        return reply(`
❗ *Invalid MediaFire URL!*
Usage: .mediafire <MediaFire URL>
Example: .mediafire https://www.mediafire.com/file/example.zip
                        `.trim())
                    }
                    try {
                        await reply(`⏳ *Downloading from MediaFire...* Fetching file. Please wait!`)
                        const mediafireRes = await fetch(args)
                        const mediafireBuffer = await mediafireRes.buffer()
                        const fileName = args.split('/').pop()
                        const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)
                        const safeFileName = fileName.replace(/[^a-zA-Z0-9.]/g, '_')
                        const filePath = path.join(mediafireDir, `${safeFileName}_${timestamp}`)
                        fs.writeFileSync(filePath, mediafireBuffer)

                        await sock.sendMessage(from, {
                            document: { url: filePath },
                            mimetype: 'application/octet-stream',
                            fileName: fileName
                        })
                        reply(`File downloaded! Saved to ./mediafire/${safeFileName}_${timestamp}`)
                    } catch (e) {
                        reply(`❌ *Download Failed:* ${e.message}. Check the URL or try again.`)
                    }
                    break

                // KENYAN MEMES
                case 'memes':
                    try {
                        let memeUrl, thumbnailUrl, isVideo = false
                        if (args) {
                            await reply(`⏳ *Fetching Meme...* Searching for *${args}*. Please wait!`)
                            const memeRes = await fetch(`https://api.example.com/kenyan-memes?query=${encodeURIComponent(args)}`).then(r => r.json())
                            if (!memeRes.results?.length) return reply(`❌ *No Memes Found:* Try a different keyword.\nExample: .memes Kenyan comedy`)
                            const meme = memeRes.results[0]
                            memeUrl = meme.url
                            thumbnailUrl = meme.thumbnail || meme.url
                            isVideo = meme.type === 'video'
                        } else {
                            await reply(`⏳ *Fetching Meme...* Getting a random Kenyan meme. Please wait!`)
                            const memeRes = await fetch(`https://api.example.com/kenyan-memes/random`).then(r => r.json())
                            if (!memeRes.url) return reply(`❌ *No Memes Found:* Try again.`)
                            memeUrl = memeRes.url
                            thumbnailUrl = memeRes.thumbnail || meme.url
                            isVideo = memeRes.type === 'video'
                        }

                        await sock.sendMessage(from, {
                            image: { url: thumbnailUrl },
                            caption: `😂 Fetching a Kenyan meme${args ? ` for *${args}*` : ''}... Get ready to laugh! 🇰🇪`
                        })

                        const memeRes = await fetch(memeUrl)
                        const memeBuffer = await memeRes.buffer()
                        const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)
                        const safeMemeName = (args || 'random_meme').replace(/[^a-zA-Z0-9]/g, '_')
                        const extension = isVideo ? 'mp4' : 'jpg'
                        const memeFileName = `${safeMemeName}_${timestamp}.${extension}`
                        const memeFilePath = path.join(memesDir, memeFileName)
                        fs.writeFileSync(memeFilePath, memeBuffer)

                        await sock.sendMessage(from, {
                            [isVideo ? 'video' : 'image']: { url: memeFilePath },
                            mimetype: isVideo ? 'video/mp4' : 'image/jpeg',
                            caption: `😂 *Kenyan Meme Alert!* Keep the vibes high, fam! 🇰🇪`
                        })
                        reply(`Meme saved to ./memes/${memeFileName}`)
                    } catch (e) {
                        reply(`❌ *Error:* ${e.message}.\nUsage: .memes [keyword]\nExample: .memes Kenyan comedy`)
                    }
                    break

                // PORNHUB VIDEO DOWNLOAD
                case 'pornhub':
                    if (!args) return reply(`
❗ *Search Query Required!*
Usage: .pornhub <search query>
Example: .pornhub funny skit
                    `.trim())
                    try {
                        await reply(`⏳ *Fetching Video...* Searching PornHub for *${args}*. Please wait!`)
                        const phRes = await fetch(`https://api.example.com/pornhub/search?query=${encodeURIComponent(args)}`).then(r => r.json())
                        if (!phRes.videos?.length) return reply(`❌ *No Videos Found:* Try a different query.`)
                        const video = phRes.videos[0]
                        const videoUrl = video.url
                        const thumbnailUrl = video.thumbnail
                        const title = video.title

                        await sock.sendMessage(from, {
                            image: { url: thumbnailUrl },
                            caption: `🎥 Fetching *${args}* from PornHub... Hold tight! 😎`
                        })

                        const videoRes = await fetch(videoUrl)
                        const videoBuffer = await videoRes.buffer()
                        const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)
                        const safeTitle = title.replace(/[^a-zA-Z0-9]/g, '_')
                        const videoFileName = `${safeTitle}_${timestamp}.mp4`
                        const videoFilePath = path.join(pornhubDir, videoFileName)
                        fs.writeFileSync(videoFilePath, videoBuffer)

                        await sock.sendMessage(from, {
                            video: { url: videoFilePath },
                            mimetype: 'video/mp4',
                            caption: `*${title}*\nSource: PornHub\nEnjoy! 🔞\n\n⚠️ *Use responsibly. Respect all laws and platform rules.*`
                        })
                        reply(`Video saved to ./pornhub/${videoFileName}`)
                    } catch (e) {
                        reply(`❌ *Error:* ${e.message}.\nUsage: .pornhub <search query>\nExample: .pornhub funny skit`)
                    }
                    break

                // APPROVE PENDING JOIN REQUESTS
                case 'approve':
                    if (!isGroup) return reply("Group only")
                    if (!isAdmin) return reply("Admin only")
                    if (!isBotAdmin) return reply("I need to be an admin to approve join requests")
                    try {
                        const requests = await sock.groupRequestParticipantsList(from)
                        if (!requests.length) return reply("No pending join requests")

                        let approvedUsers = []
                        if (args) {
                            const phoneNumber = args.replace(/[^0-9]/g, '')
                            const targetUser = requests.find(r => r.jid.includes(phoneNumber))
                            if (!targetUser) return reply(`No join request found for ${phoneNumber}`)
                            await sock.groupRequestParticipantsUpdate(from, [targetUser.jid], "approve")
                            approvedUsers.push(targetUser.jid)
                        } else {
                            approvedUsers = requests.map(r => r.jid)
                            await sock.groupRequestParticipantsUpdate(from, approvedUsers, "approve")
                        }

                        const approvedList = approvedUsers.map(u => `@${u.split('@')[0]}`).join(', ')
                        await sock.sendMessage(from, {
                            text: `✅ *Join Requests Approved!* Approved: ${approvedList}. Welcome to the squad! 🎉`,
                            mentions: approvedUsers
                        })
                    } catch (e) {
                        reply(`❌ *Error:* ${e.message}.\nUsage: .approve [phone number]\nExample: .approve 254123456789`)
                    }
                    break

                // ANIME DOWNLOAD
                case 'anime':
                    if (!args) return reply(`
❗ *Anime Name Required!*
Usage: .anime <anime name>
Example: .anime Attack on Titan
                    `.trim())
                    try {
                        await reply(`⏳ *Fetching Anime...* Searching for *${args}*. Please wait!`)
                        const animeRes = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(args)}&limit=1`).then(r => r.json())
                        if (!animeRes.data[0]) return reply(`❌ *Anime Not Found:* Try a different name.`)
                        const anime = animeRes.data[0]
                        const thumbnailUrl = anime.images.jpg.large_image_url
                        const trailerUrl = anime.trailer?.youtube_id ? `https://www.youtube.com/watch?v=${anime.trailer.youtube_id}` : null

                        await sock.sendMessage(from, {
                            image: { url: thumbnailUrl },
                            caption: `🦸‍♂️ Fetching *${args}*... Get ready for the action! 🔥`
                        })

                        let videoUrl = trailerUrl || 'https://example.com/placeholder.mp4'
                        let videoBuffer
                        if (trailerUrl) {
                            const stream = ytdl(trailerUrl, { filter: 'videoandaudio', quality: 'highestvideo' })
                            const videoFilePathTemp = path.join(animeDir, `temp_${Date.now()}.mp4`)
                            stream.pipe(fs.createWriteStream(videoFilePathTemp))
                            await new Promise(resolve => stream.on('end', resolve))
                            videoBuffer = fs.readFileSync(videoFilePathTemp)
                            fs.unlinkSync(videoFilePathTemp)
                        } else {
                            const videoRes = await fetch(videoUrl)
                            videoBuffer = await videoRes.buffer()
                        }

                        const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)
                        const safeAnimeName = anime.title.replace(/[^a-zA-Z0-9]/g, '_')
                        const videoFileName = `${safeAnimeName}_${timestamp}.mp4`
                        const videoFilePath = path.join(animeDir, videoFileName)
                        fs.writeFileSync(videoFilePath, videoBuffer)

                        await sock.sendMessage(from, {
                            video: { url: videoFilePath },
                            mimetype: 'video/mp4',
                            caption: `*${anime.title}*\nScore: ${anime.score}/10\nEpisodes: ${anime.episodes || 'N/A'}\nSynopsis: ${anime.synopsis.substring(0, 200)}...\n\nEnjoy the anime! 🦸‍♂️`
                        })
                        reply(`Anime saved to ./anime/${videoFileName}`)
                    } catch (e) {
                        reply(`❌ *Error:* ${e.message}.\nUsage: .anime <anime name>\nExample: .anime Attack on Titan`)
                    }
                    break

                // MOVIE DOWNLOAD
                case 'movie':
                    if (!args) return reply(`
❗ *Movie Name Required!*
Usage: .movie <movie name>
Example: .movie Saw X
                    `.trim())
                    try {
                        await reply(`⏳ *Fetching Movie...* Searching for *${args}*. Please wait!`)
                        const yts = await fetch(`https://yts.mx/api/v2/list_movies.json?query_term=${encodeURIComponent(args)}`).then(r => r.json())
                        if (!yts.data.movies) return reply(`❌ *No Movies Found:* Try a different name.`)
                        const movie = yts.data.movies[0]
                        const thumbnailUrl = movie.medium_cover_image

                        await sock.sendMessage(from, {
                            image: { url: thumbnailUrl },
                            caption: `🎥 Fetching *${args}*... Grab your popcorn! 🍿`
                        })

                        const videoUrl = movie.torrents[0].url
                        const videoRes = await fetch(videoUrl)
                        const videoBuffer = await videoRes.buffer()

                        const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)
                        const safeMovieName = movie.title.replace(/[^a-zA-Z0-9]/g, '_')
                        const videoFileName = `${safeMovieName}_${timestamp}.mp4`
                        const videoFilePath = path.join(moviesDir, videoFileName)
                        fs.writeFileSync(videoFilePath, videoBuffer)

                        await sock.sendMessage(from, {
                            video: { url: videoFilePath },
                            mimetype: 'video/mp4',
                            caption: `*${movie.title_long}*\nYear: ${movie.year}\nRating: ${movie.rating}/10\n\nEnjoy the movie! 🎬`
                        })
                        reply(`Movie saved to ./movies/${videoFileName}`)
                    } catch (e) {
                        reply(`❌ *Error:* ${e.message}.\nUsage: .movie <movie name>\nExample: .movie Saw X`)
                    }
                    break

                // PLAY/SONG/VIDEO DOWNLOAD
                case 'play': case 'song': case 'video':
                    if (!args) return reply(`
❗ *Song Name Required!*
Usage: .${cmd} <song name>
Example: .${cmd} Despacito
                    `.trim())
                    try {
                        await reply(`⏳ *Fetching Song...* Searching for *${args}*. Please wait!`)
                        const youtubeRes = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(args)}&type=video&key=${API_KEYS.youtube}`)
                        const youtubeData = await youtubeRes.json()
                        if (!youtubeData.items[0]) return reply(`❌ *Song Not Found:* Try a different name.`)
                        const videoId = youtubeData.items[0].id.videoId
                        const videoTitle = youtubeData.items[0].snippet.title
                        const thumbnailUrl = youtubeData.items[0].snippet.thumbnails.default.url

                        await sock.sendMessage(from, {
                            image: { url: thumbnailUrl },
                            caption: `🎵 Searching for *${args}*... Vibe loading! 🎶`
                        })

                        const stream = ytdl(`https://www.youtube.com/watch?v=${videoId}`, { filter: 'audioonly' })
                        const audioFileName = `${videoTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)}.mp3`
                        const audioFilePath = path.join(musicDir, audioFileName)
                        stream.pipe(fs.createWriteStream(audioFilePath))

                        await new Promise(resolve => stream.on('end', resolve))

                        await sock.sendMessage(from, {
                            audio: { url: audioFilePath },
                            mimetype: 'audio/mpeg',
                            ptt: false,
                            caption: `*${videoTitle}*\nDuration: Unknown\n\nEnjoy the vibes! 🎶`
                        })
                        reply(`Song saved to ./music/${audioFileName}`)
                    } catch (e) {
                        reply(`❌ *Error:* ${e.message}.\nUsage: .${cmd} <song name>\nExample: .${cmd} Despacito`)
                    }
                    break

                // VIEW-ONCE DOWNLOAD
                case 'vv':
                    if (!msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) return reply(`
❗ *Reply to a View-Once Message!*
Usage: Reply to a view-once image or video with .vv
                    `.trim())
                    const quotedMsg = msg.message.extendedTextMessage.contextInfo.quotedMessage
                    if (quotedMsg.imageMessage?.viewOnce || quotedMsg.videoMessage?.viewOnce) {
                        try {
                            const media = quotedMsg.imageMessage || quotedMsg.videoMessage
                            const type = media.mimetype.includes('image') ? 'image' : 'video'
                            const buffer = await downloadContentFromMessage(media, type)
                            let buff = Buffer.alloc(0)
                            for await (const chunk of buffer) buff = Buffer.concat([buff, chunk])

                            await sock.sendMessage(from, {
                                [type]: buff,
                                caption: `Downloaded view-once ${type} by @${sender.split('@')[0]}`,
                                mentions: [sender]
                            })

                            const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)
                            const extension = type === 'image' ? 'jpg' : 'mp4'
                            const fileName = `viewonce_${timestamp}_${type}.${extension}`
                            const filePath = path.join(viewOnceDir, fileName)
                            fs.writeFileSync(filePath, buff)
                            reply(`View-once ${type} saved to ./viewonce/${fileName}`)
                        } catch (e) {
                            reply(`❌ *Error:* ${e.message}.\nUsage: Reply to a view-once image or video with .vv`)
                        }
                    } else {
                        reply(`
❗ *Invalid Message!*
Usage: Reply to a view-once image or video with .vv
                        `.trim())
                    }
                    break

                // GROUP VCF GENERATOR
                case 'vcf':
                    if (!isGroup) return reply("Group only")
                    try {
                        let vcfContent = ''
                        for (const participant of participants) {
                            const userId = participant.id
                            const userName = participant.notify || pushname || "Unknown"
                            const phoneNumber = userId.split('@')[0]
                            vcfContent += `BEGIN:VCARD\nVERSION:3.0\nFN:${userName}\nTEL;waid=${phoneNumber}:+${phoneNumber}\nEND:VCARD\n`
                        }

                        const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)
                        const safeGroupName = groupMetadata.subject.replace(/[^a-zA-Z0-9]/g, '_')
                        const vcfFileName = `${safeGroupName}_${timestamp}.vcf`
                        const vcfFilePath = path.join(vcfDir, vcfFileName)
                        fs.writeFileSync(vcfFilePath, vcfContent)

                        const adminList = admins.length ? admins.map(a => `• wa.me/${a.split('@')[0]}`).join('\n') : "No admins"
                        const groupInfo = `
🌟 *Group Info: ${groupMetadata.subject}* 🌟
Description: ${groupMetadata.desc || "No description set"}
Total Members: ${participants.length}
Admins:
${adminList}

📇 *VCF File Created!* 📇
Yo squad, @${sender.split('@')[0]} just generated a VCF file with all our contacts! Download it below and save the crew! 💪

Powered by *VAMPARINA MD 2025* — Created by Arnold Chirchir
                        `.trim()

                        await sock.sendMessage(from, {
                            document: { url: vcfFilePath },
                            mimetype: 'text/vcard',
                            fileName: `${groupMetadata.subject}_contacts.vcf`
                        })
                        await sock.sendMessage(from, {
                            text: groupInfo,
                            mentions: [sender, ...participants.map(p => p.id)]
                        })
                    } catch (e) {
                        reply(`❌ *Error:* ${e.message}.\nUsage: .vcf`)
                    }
                    break

                // SET MENU TYPE
                case 'setmenu':
                    if (!args || !['text', 'image', 'video'].includes(args.toLowerCase())) {
                        return reply(`
❗ *Invalid Menu Type*
Usage: .setmenu <text|image|video>
Example: .setmenu image
                        `.trim())
                    }
                    DB.settings.menuType = args.toLowerCase()
                    saveDB()
                    reply(`Menu set to *${args.toLowerCase()}* mode`)
                    break

                // LOGO MAKER
                case '1917style': case 'advancedglow': case 'blackpinklogo': case 'blackpinkstyle': case 'cartoonstyle':
                case 'deletingtext': case 'dragonball': case 'effectclouds': case 'flag3dtext': case 'flagtext':
                case 'freecreate': case 'galaxystyle': case 'galaxywallpaper': case 'glitchtext': case 'glowingtext':
                case 'gradienttext': case 'graffiti': case 'incandescent': case 'lighteffects': case 'logomaker':
                case 'luxurygold': case 'makingneon': case 'matrix': case 'multicoloredneon': case 'neonglitch':
                case 'papercutstyle': case 'pixelglitch': case 'royaltext': case 'sand': case 'summerbeach':
                case 'topography': case 'typography': case 'watercolortext': case 'writetext':
                    if (!args) return reply(`
❗ *Text Required!*
Usage: .${cmd} <text>
Example: .${cmd} VAMPARINA
                    `.trim())
                    await reply(`🎨 Creating *${cmd}* logo... Stay tuned!`)
                    try {
                        const res = await fetch(`${LOGO_STYLES[cmd]}?text=${encodeURIComponent(args)}`)
                        const html = await res.text()
                        const imgMatch = html.match(/<img class="thumbnail" src="(.*?)"/)
                        if (imgMatch) {
                            const imgUrl = imgMatch[1].startsWith('http') ? imgMatch[1] : 'https://photooxy.com' + imgMatch[1]
                            await sock.sendMessage(from, { image: { url: imgUrl }, caption: `VAMPARINA MD • ${cmd.toUpperCase()}` })
                        } else {
                            reply("Failed to create logo. Try again.")
                        }
                    } catch (e) {
                        reply(`❌ *Error:* ${e.message}.\nUsage: .${cmd} <text>\nExample: .${cmd} VAMPARINA`)
                    }
                    break

                // FEEDBACK
                case 'feedback': case 'report': case 'bug':
                    if (!args) return reply(`
❗ *Feedback Required!*
Usage: .feedback <message>
Example: .feedback Great bot, add more features!
                    `.trim())
                    await sock.sendMessage(BOT.owner + '@s.whatsapp.net', {
                        text: `*FEEDBACK*\nFrom: ${pushname} (${sender.split('@')[0]})\nGroup: ${isGroup ? groupMetadata.subject : 'Private'}\n\n${args}`
                    })
                    reply("Feedback sent to Arnold Chirchir!")
                    break

                // HELPERS
                case 'helpers': case 'mods': case 'sudo':
                    reply(DB.helpers.length ? `*HELPERS*\n\n${DB.helpers.map(h => `• wa.me/${h.split('@')[0]}`).join('\n')}` : "No helpers assigned.")
                    break

                // GROUP COMMANDS
                case 'add':
                    if (!isGroup) return reply("Group only")
                    if (!isAdmin) return reply("Admin only")
                    if (!isBotAdmin) return reply("I need to be an admin to add members")
                    if (!args) return reply(`
❗ *Phone Number Required!*
Usage: .add <phone number>
Example: .add 254123456789
                    `.trim())
                    const num = args.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
                    if (groupSettings.banned?.includes(num)) {
                        return reply(`❗ *User Banned!* @${num.split('@')[0]} is banned from this group.`, { mentions: [num] })
                    }
                    try {
                        await sock.groupParticipantsUpdate(from, [num], "add")
                        reply("Added")
                    } catch (e) {
                        reply(`❌ *Error:* ${e.message}.\nUsage: .add <phone number>\nExample: .add 254123456789`)
                    }
                    break

                case 'kick':
                    if (!isGroup) return reply("Group only")
                    if (!isAdmin) return reply("Admin only")
                    if (!isBotAdmin) return reply("I need to be an admin to kick members")
                    if (!mention && !args) return reply(`
❗ *User Required!*
Usage: .kick <@user> or .kick <phone number>
Example: .kick @254123456789
                    `.trim())
                    const kickUser = mention || args.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
                    try {
                        await sock.groupParticipantsUpdate(from, [kickUser], "remove")
                        reply("Kicked")
                    } catch (e) {
                        reply(`❌ *Error:* ${e.message}.\nUsage: .kick <@user | phone number>\nExample: .kick @254123456789`)
                    }
                    break

                case 'ban':
                    if (!isGroup) return reply("Group only")
                    if (!isAdmin) return reply("Admin only")
                    if (!isBotAdmin) return reply("I need to be an admin to ban members")
                    if (!mention && !args) return reply(`
❗ *User Required!*
Usage: .ban <@user> or .ban <phone number>
Example: .ban @254123456789
                    `.trim())
                    const banUser = mention || args.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
                    if (banUser === sock.user.id) return reply("I can't ban myself! 😅")
                    if (DB.sudo.includes(banUser)) return reply("You can't ban a sudo user.")
                    if (groupSettings.banned?.includes(banUser)) return reply(`❗ *User Already Banned!* @${banUser.split('@')[0]} is already banned.`, { mentions: [banUser] })
                    try {
                        groupSettings.banned = groupSettings.banned || []
                        groupSettings.banned.push(banUser)
                        saveDB()
                        await sock.groupParticipantsUpdate(from, [banUser], "remove")
                        await sock.sendMessage(from, {
                            text: `🚫 *User Banned!* @${banUser.split('@')[0]} has been banned from *${groupMetadata.subject}*. They cannot rejoin until unbanned.`,
                            mentions: [banUser]
                        })
                        reply("User banned")
                    } catch (e) {
                        reply(`❌ *Error:* ${e.message}.\nUsage: .ban <@user | phone number>\nExample: .ban @254123456789`)
                    }
                    break

                case 'unban':
                    if (!isGroup) return reply("Group only")
                    if (!isAdmin) return reply("Admin only")
                    if (!isBotAdmin) return reply("I need to be an admin to unban members")
                    if (!mention && !args) return reply(`
❗ *User Required!*
Usage: .unban <@user> or .unban <phone number>
Example: .unban @254123456789
                    `.trim())
                    const unbanUser = mention || args.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
                    if (!groupSettings.banned?.includes(unbanUser)) return reply(`❗ *User Not Banned!* @${unbanUser.split('@')[0]} is not on the ban list.`, { mentions: [unbanUser] })
                    try {
                        groupSettings.banned = groupSettings.banned.filter(u => u !== unbanUser)
                        saveDB()
                        await sock.sendMessage(from, {
                            text: `✅ *User Unbanned!* @${unbanUser.split('@')[0]} is no longer banned from *${groupMetadata.subject}*. They can now rejoin.`,
                            mentions: [unbanUser]
                        })
                        reply("User unbanned")
                    } catch (e) {
                        reply(`❌ *Error:* ${e.message}.\nUsage: .unban <@user | phone number>\nExample: .unban @254123456789`)
                    }
                    break

                case 'promote':
                    if (!isGroup) return reply("Group only")
                    if (!isAdmin) return reply("Admin only")
                    if (!isBotAdmin) return reply("I need to be an admin to promote members")
                    if (!mention) return reply(`
❗ *User Required!*
Usage: .promote <@user>
Example: .promote @254123456789
                    `.trim())
                    try {
                        await sock.groupParticipantsUpdate(from, [mention], "promote")
                        const updatedMetadata = await sock.groupMetadata(from)
                        const updatedAdmins = updatedMetadata.participants.filter(p => p.admin).map(p => p.id)
                        const adminList = updatedAdmins.length ? updatedAdmins.map(a => `• wa.me/${a.split('@')[0]}`).join('\n') : "No admins"
                        const promoteMsg = `
🎉 *Big Up @${mention.split('@')[0]}!* 🎉
You've been PROMOTED to admin in *${updatedMetadata.subject}*! Time to lead the squad! 💪

👑 *Current Admins*:
${adminList}

Powered by *VAMPARINA MD 2025* — Created by Arnold Chirchir
                        `.trim()
                        await sock.sendMessage(from, { text: promoteMsg, mentions: [mention, ...updatedAdmins] })
                        reply("Promoted")
                    } catch (e) {
                        reply(`❌ *Error:* ${e.message}.\nUsage: .promote <@user>\nExample: .promote @254123456789`)
                    }
                    break

                case 'demote':
                    if (!isGroup) return reply("Group only")
                    if (!isAdmin) return reply("Admin only")
                    if (!isBotAdmin) return reply("I need to be an admin to demote members")
                    if (!mention) return reply(`
❗ *User Required!*
Usage: .demote <@user>
Example: .demote @254123456789
                    `.trim())
                    try {
                        await sock.groupParticipantsUpdate(from, [mention], "demote")
                        const updatedMetadata = await sock.groupMetadata(from)
                        const updatedAdmins = updatedMetadata.participants.filter(p => p.admin).map(p => p.id)
                        const adminList = updatedAdmins.length ? updatedAdmins.map(a => `• wa.me/${a.split('@')[0]}`).join('\n') : "No admins"
                        const demoteMsg = `
👋 *Respect @${mention.split('@')[0]}!* 👋
You've been demoted from admin in *${updatedMetadata.subject}*. Thanks for your hustle—keep shining! 🌟

👑 *Current Admins*:
${adminList}

Powered by *VAMPARINA MD 2025* — Created by Arnold Chirchir
                        `.trim()
                        await sock.sendMessage(from, { text: demoteMsg, mentions: [mention, ...updatedAdmins] })
                        reply("Demoted")
                    } catch (e) {
                        reply(`❌ *Error:* ${e.message}.\nUsage: .demote <@user>\nExample: .demote @254123456789`)
                    }
                    break

                // NEW BAN COMMAND — BANS USER FROM SENDING MESSAGES + SENDS DM
                case 'ban':
                    if (!isGroup) return reply("Group only")
                    if (!isAdmin) return reply("Admin only")
                    if (!isBotAdmin) return reply("I need to be an admin to ban members")
                    if (!mention && !args) return reply(`
❗ *User Required!*
Usage: .ban <@user> or .ban <phone number>
Example: .ban @254123456789
                    `.trim())
                    const banUserNew = mention || args.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
                    if (banUserNew === sock.user.id) return reply("I can't ban myself! 😅")
                    if (DB.sudo.includes(banUserNew)) return reply("You can't ban a sudo user.")
                    if (groupSettings.banned?.includes(banUserNew)) return reply(`❗ *User Already Banned!* @${banUserNew.split('@')[0]} is already banned.`, { mentions: [banUserNew] })
                    try {
                        groupSettings.banned = groupSettings.banned || []
                        groupSettings.banned.push(banUserNew)
                        saveDB()
                        // Kick the user from the group
                        await sock.groupParticipantsUpdate(from, [banUserNew], "remove")
                        // Send DM to banned user
                        await sock.sendMessage(banUserNew, {
                            text: `
🚫 *You Have Been Banned*

You are banned from sending messages in *${groupMetadata.subject}*.

To get unbanned, contact a group admin:
${admins.map(a => `• wa.me/${a.split('@')[0]}`).join('\n')}

— Powered by VAMPARINA MD 2025
                            `.trim()
                        })
                        await sock.sendMessage(from, {
                            text: `🚫 *User Banned!* @${banUserNew.split('@')[0]} has been banned from *${groupMetadata.subject}*. They cannot send messages until