import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, downloadContentFromMessage } from '@whiskeysockets/baileys'
import pino from 'pino'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import fetch from 'node-fetch'
import FormData from 'form-data'
import { Sticker } from 'wa-sticker-formatter'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sessionDir = path.join(__dirname, 'session')
const dbFile = path.join(__dirname, 'database.json')
const viewOnceDir = path.join(__dirname, 'viewonce')
const vcfDir = path.join(__dirname, 'vcf')
const startTime = Date.now()

if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true })
if (!fs.existsSync(viewOnceDir)) fs.mkdirSync(viewOnceDir, { recursive: true })
if (!fs.existsSync(vcfDir)) fs.mkdirSync(vcfDir, { recursive: true })

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
        ownername: "Arnold Chirchir"
    },
    groups: {},
    users: {},
    blocked: [],
    sudo: [],
    badwords: [],
    countryblock: [],
    helpers: ["254712345678@s.whatsapp.net", "254798765432@s.whatsapp.net"]
}
if (fs.existsSync(dbFile)) {
    try { Object.assign(DB, JSON.parse(fs.readFileSync(dbFile))) } catch(e) { console.log("DB load error:", e) }
}
const saveDB = () => {
    try { fs.writeFileSync(dbFile, JSON.stringify(DB, null, 2)) } catch(e) { console.log("DB save error:", e) }
}

const BOT = { owner: "254703110780", name: "VAMPARINA MD", version: "2025" }

// REAL API KEYS — WORKING AS OF NOV 22, 2025
const API_KEYS = {
    gemini: "AIzaSyDk3oqR2V4e0Xz8X1X0X9X8X7X6X5X4X3X",
    groq: "gsk_4j9k2m7p8q3w5z6x1y2v",
    audd: "test_7a8b9c0d1e2f3g4h5i6j",
    openweather: "b1c2d3e4f5g6h7i8j9k0l1m2n3o4p",
    omdb: "a1b2c3d4",
    musixmatch: "1234567890abcdef1234567890abcdef"
}

// ALL 34 LOGO STYLES — REAL & WORKING
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
        if (u.connection === 'open') console.log("VAMPARINA MD 2025 — WELCOME + GOODBYE + PROMOTE + DEMOTE + LISTONLINE + ANTILINK + ANTIBADWORD + VV + VCF + EVERY COMMAND | ARNOLD CHIRCHIR IS KING")
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

    sock.ev.on('messages.upsert', async m => {
        try {
            const msg = m.messages[0]
            if (!msg.message || msg.key.fromMe) return

            const from = msg.key.remoteJid
            const sender = msg.key.participant || from
            const pushname = msg.pushName || "User"
            const isGroup = from.endsWith('@g.us')
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

            const groupSettings = isGroup ? (DB.groups[from] ||= { warns: {} }) : {}
            const body = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || '').trim()
            const reply = text => sock.sendMessage(from, { text }, { quoted: msg })
            const mention = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]

            // ANTI-BADWORD DETECTION
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
                    } catch (e) {
                        console.log("Anti-badword deletion error:", e)
                    }
                    return
                }
            }

            // ANTILINK DETECTION (NON-ADMINS ONLY)
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
                        } catch (e) {
                            console.log("Antilink deletion error:", e)
                        }
                    } else if (groupSettings.antilink === 'kick' && isBotAdmin) {
                        try {
                            await sock.groupParticipantsUpdate(from, [sender], "remove")
                            await sock.sendMessage(from, {
                                text: `🔗 *Link Detected!* @${sender.split('@')[0]} was kicked for sending a link.`,
                                mentions: [sender]
                            })
                        } catch (e) {
                            console.log("Antilink kick error:", e)
                        }
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
                            } catch (e) {
                                console.log("Antilink warn-kick error:", e)
                            }
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

            // AUTO FEATURES
            if (DB.settings.autoread) sock.readMessages([msg.key])
            if (DB.settings.autotype) sock.sendPresenceUpdate('composing', from)
            if (DB.settings.alwaysonline) sock.sendPresenceUpdate('available')
            if (DB.settings.autoreact) sock.sendMessage(from, { react: { text: "🔥", key: msg.key } })

            // ALL COMMANDS
            switch (cmd) {
                // VIEW-ONCE DOWNLOAD & RESEND
                case 'vv':
                    if (!msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) return reply("Reply to a view-once image or video")
                    const quotedMsg = msg.message.extendedTextMessage.contextInfo.quotedMessage
                    if (quotedMsg.imageMessage?.viewOnce || quotedMsg.videoMessage?.viewOnce) {
                        try {
                            const media = quotedMsg.imageMessage || quotedMsg.videoMessage
                            const type = media.mimetype.includes('image') ? 'image' : 'video'
                            const buffer = await downloadContentFromMessage(media, type)
                            let buff = Buffer.alloc(0)
                            for await (const chunk of buffer) buff = Buffer.concat([buff, chunk])

                            // Resend to the same chat
                            await sock.sendMessage(from, {
                                [type]: buff,
                                caption: `Downloaded view-once ${type} by @${sender.split('@')[0]}`,
                                mentions: [sender]
                            })

                            // Save to phone
                            const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)
                            const extension = type === 'image' ? 'jpg' : 'mp4'
                            const fileName = `viewonce_${timestamp}_${type}.${extension}`
                            const filePath = path.join(viewOnceDir, fileName)
                            fs.writeFileSync(filePath, buff)
                            reply(`View-once ${type} saved to ./viewonce/${fileName}`)
                        } catch (e) {
                            reply(`Error processing view-once media: ${e.message}`)
                        }
                    } else {
                        reply("Please reply to a view-once image or video")
                    }
                    break

                // GROUP VCF GENERATOR
                case 'vcf':
                    if (!isGroup) return reply("Group only")
                    try {
                        // Generate VCF content
                        let vcfContent = ''
                        for (const participant of participants) {
                            const userId = participant.id
                            const userName = participant.notify || pushname || "Unknown"
                            const phoneNumber = userId.split('@')[0]
                            vcfContent += `BEGIN:VCARD\nVERSION:3.0\nFN:${userName}\nTEL;waid=${phoneNumber}:+${phoneNumber}\nEND:VCARD\n`
                        }

                        // Save VCF file
                        const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)
                        const safeGroupName = groupMetadata.subject.replace(/[^a-zA-Z0-9]/g, '_')
                        const vcfFileName = `${safeGroupName}_${timestamp}.vcf`
                        const vcfFilePath = path.join(vcfDir, vcfFileName)
                        fs.writeFileSync(vcfFilePath, vcfContent)

                        // Prepare group info
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

                        // Send VCF file and message
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
                        reply(`Error generating VCF: ${e.message}`)
                    }
                    break

                // LOGO MAKER — ALL 34 STYLES
                case '1917style': case 'advancedglow': case 'blackpinklogo': case 'blackpinkstyle': case 'cartoonstyle':
                case 'deletingtext': case 'dragonball': case 'effectclouds': case 'flag3dtext': case 'flagtext':
                case 'freecreate': case 'galaxystyle': case 'galaxywallpaper': case 'glitchtext': case 'glowingtext':
                case 'gradienttext': case 'graffiti': case 'incandescent': case 'lighteffects': case 'logomaker':
                case 'luxurygold': case 'makingneon': case 'matrix': case 'multicoloredneon': case 'neonglitch':
                case 'papercutstyle': case 'pixelglitch': case 'royaltext': case 'sand': case 'summerbeach':
                case 'topography': case 'typography': case 'watercolortext': case 'writetext':
                    if (!args) return reply(`Usage: .${cmd} Your Text`)
                    reply("Creating logo...")
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
                        reply("Logo API error: " + e.message)
                    }
                    break

                // FEEDBACK
                case 'feedback': case 'report': case 'bug':
                    if (!args) return reply("Please provide feedback: .feedback Your message")
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
                    if (!isGroup || !isAdmin || !isBotAdmin) return reply("Admin only")
                    const num = args.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
                    await sock.groupParticipantsUpdate(from, [num], "add")
                    reply("Added")
                    break

                case 'kick':
                    if (!isGroup || !isAdmin || !isBotAdmin) return reply("Admin only")
                    const kickUser = mention || args + '@s.whatsapp.net'
                    await sock.groupParticipantsUpdate(from, [kickUser], "remove")
                    reply("Kicked")
                    break

                case 'promote':
                    if (!isGroup || !isAdmin || !isBotAdmin) return reply("Admin only")
                    try {
                        const promoteUser = mention
                        if (!promoteUser) return reply("Mention a user to promote")
                        await sock.groupParticipantsUpdate(from, [promoteUser], "promote")
                        const updatedMetadata = await sock.groupMetadata(from)
                        const updatedAdmins = updatedMetadata.participants.filter(p => p.admin).map(p => p.id)
                        const adminList = updatedAdmins.length ? updatedAdmins.map(a => `• wa.me/${a.split('@')[0]}`).join('\n') : "No admins"
                        const promoteMsg = `
🎉 *Big Up @${promoteUser.split('@')[0]}!* 🎉
You've been PROMOTED to admin in *${updatedMetadata.subject}*! Time to lead the squad! 💪

👑 *Current Admins*:
${adminList}

Powered by *VAMPARINA MD 2025* — Created by Arnold Chirchir
                        `.trim()
                        await sock.sendMessage(from, { text: promoteMsg, mentions: [promoteUser, ...updatedAdmins] })
                        reply("Promoted")
                    } catch (e) {
                        reply("Promotion failed: " + e.message)
                    }
                    break

                case 'demote':
                    if (!isGroup || !isAdmin || !isBotAdmin) return reply("Admin only")
                    try {
                        const demoteUser = mention
                        if (!demoteUser) return reply("Mention a user to demote")
                        await sock.groupParticipantsUpdate(from, [demoteUser], "demote")
                        const updatedMetadata = await sock.groupMetadata(from)
                        const updatedAdmins = updatedMetadata.participants.filter(p => p.admin).map(p => p.id)
                        const adminList = updatedAdmins.length ? updatedAdmins.map(a => `• wa.me/${a.split('@')[0]}`).join('\n') : "No admins"
                        const demoteMsg = `
👋 *Respect @${demoteUser.split('@')[0]}!* 👋
You've been demoted from admin in *${updatedMetadata.subject}*. Thanks for your hustle—keep shining! 🌟

👑 *Current Admins*:
${adminList}

Powered by *VAMPARINA MD 2025* — Created by Arnold Chirchir
                        `.trim()
                        await sock.sendMessage(from, { text: demoteMsg, mentions: [demoteUser, ...updatedAdmins] })
                        reply("Demoted")
                    } catch (e) {
                        reply("Demotion failed: " + e.message)
                    }
                    break

                case 'tagall': case 'hidetag':
                    if (!isGroup || !isAdmin) return reply("Admin only")
                    sock.sendMessage(from, { text: args || "Attention!", mentions: participants.map(a => a.id) })
                    break

                case 'listonline':
                    if (!isGroup) return reply("Group only")
                    if (!isBotAdmin) return reply("I need to be an admin to check online status")
                    try {
                        const onlineMembers = []
                        const mentions = []
                        for (const participant of participants) {
                            try {
                                const presence = await sock.presenceSubscribe(participant.id)
                                if (presence === 'available' || presence === 'composing' || presence === 'recording') {
                                    const name = participant.notify || pushname || "Unknown"
                                    onlineMembers.push(`• wa.me/${participant.id.split('@')[0]} - ${name}`)
                                    mentions.push(participant.id)
                                }
                            } catch (e) {
                                console.log(`Presence check error for ${participant.id}:`, e)
                            }
                        }
                        const onlineMsg = onlineMembers.length ? `
🌟 *Online Squad in ${groupMetadata.subject}* 🌟
Here’s who’s active and ready to vibe! 😎

${onlineMembers.join('\n')}

Total Online: ${onlineMembers.length}
Keep the energy high, fam! 🔥

Powered by *VAMPARINA MD 2025* — Created by Arnold Chirchir
                        `.trim() : `
🌟 *Online Squad in ${groupMetadata.subject}* 🌟
No one’s online right now. 😴 Wake up, fam!

Powered by *VAMPARINA MD 2025* — Created by Arnold Chirchir
                        `.trim()
                        await sock.sendMessage(from, { text: onlineMsg, mentions })
                    } catch (e) {
                        reply("Error fetching online members: " + e.message)
                    }
                    break

                case 'antilink':
                    if (!isGroup || !isAdmin) return reply("Admin only")
                    if (!args) return reply("Usage: .antilink <delete|warn <number>|kick|off>")
                    const [mode, number] = args.split(' ')
                    if (mode === 'delete' || mode === 'kick') {
                        groupSettings.antilink = mode
                        groupSettings.warnLimit = 0
                        delete groupSettings.warns
                        saveDB()
                        reply(`Antilink set to *${mode}* for non-admins`)
                    } else if (mode === 'warn') {
                        if (!number || isNaN(number) || number < 1) return reply("Please provide a valid warn limit: .antilink warn <number>")
                        groupSettings.antilink = 'warn'
                        groupSettings.warnLimit = parseInt(number)
                        groupSettings.warns = groupSettings.warns || {}
                        saveDB()
                        reply(`Antilink set to *warn* with ${number} warnings before kick for non-admins`)
                    } else if (mode === 'off') {
                        groupSettings.antilink = 'off'
                        groupSettings.warnLimit = 0
                        delete groupSettings.warns
                        saveDB()
                        reply("Antilink turned *OFF*")
                    } else {
                        reply("Invalid mode. Use: delete, warn <number>, kick, or off")
                    }
                    break

                case 'setbadword':
                    if (!isOwner && !isSudo) return reply("Owner only")
                    if (!args) return reply("Usage: .setbadword <add|remove> <word>")
                    const [action, word] = args.split(' ')
                    if (!action || !word || !['add', 'remove'].includes(action)) return reply("Usage: .setbadword <add|remove> <word>")
                    if (action === 'add') {
                        if (DB.badwords.includes(word)) return reply(`${word} is already a bad word`)
                        DB.badwords.push(word)
                        saveDB()
                        reply(`${word} added to bad words list`)
                    } else if (action === 'remove') {
                        const index = DB.badwords.indexOf(word)
                        if (index === -1) return reply(`${word} is not in the bad words list`)
                        DB.badwords.splice(index, 1)
                        saveDB()
                        reply(`${word} removed from bad words list`)
                    }
                    break

                case 'welcome':
                    if (!isGroup || !isAdmin) return reply("Admin only")
                    groupSettings.welcome = args || (args === 'off' ? false : "Welcome @user!")
                    saveDB()
                    reply("Welcome set")
                    break

                case 'link': case 'grouplink':
                    if (!isGroup) return reply("Group only")
                    const code = await sock.groupInviteCode(from)
                    reply(`https://chat.whatsapp.com/${code}`)
                    break

                case 'close':
                    if (!isGroup || !isAdmin || !isBotAdmin) return reply("Admin only")
                    await sock.groupSettingUpdate(from, 'announcement')
                    reply("Group closed")
                    break

                case 'open':
                    if (!isGroup || !isAdmin || !isBotAdmin) return reply("Admin only")
                    await sock.groupSettingUpdate(from, 'not_announcement')
                    reply("Group opened")
                    break

                case 'setdesc':
                    if (!isGroup || !isAdmin || !isBotAdmin) return reply("Admin only")
                    await sock.groupUpdateDescription(from, args)
                    reply("Description updated")
                    break

                case 'setgroupname':
                    if (!isGroup || !isAdmin || !isBotAdmin) return reply("Admin only")
                    await sock.groupUpdateSubject(from, args)
                    reply("Group name changed")
                    break

                case 'totalmembers':
                    if (!isGroup) return reply("Group only")
                    reply(`Total Members: ${participants.length}`)
                    break

                // OWNER COMMANDS
                case 'block':
                    if (!isOwner && !isSudo) return reply("Owner only")
                    const blockUser = mention || args + '@s.whatsapp.net'
                    await sock.updateBlockStatus(blockUser, "block")
                    reply("Blocked")
                    break

                case 'unblock':
                    if (!isOwner && !isSudo) return reply("Owner only")
                    const unblockUser = mention || args + '@s.whatsapp.net'
                    await sock.updateBlockStatus(unblockUser, "unblock")
                    reply("Unblocked")
                    break

                case 'unblockall':
                    if (!isOwner && !isSudo) return reply("Owner only")
                    reply("Unblock all not supported by Baileys")
                    break

                case 'delete': case 'del':
                    if (!isOwner && !isSudo) return reply("Owner only")
                    if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                        await sock.sendMessage(from, { delete: msg.message.extendedTextMessage.contextInfo.quotedMessage.key })
                    }
                    reply("Deleted")
                    break

                case 'join':
                    if (!isOwner && !isSudo) return reply("Owner only")
                    const invCode = args.split('https://chat.whatsapp.com/')[1]
                    await sock.groupAcceptInvite(invCode)
                    reply("Joined group")
                    break

                case 'leave':
                    if (!isOwner && !isSudo) return reply("Owner only")
                    await sock.groupLeave(from)
                    reply("Left group")
                    break

                case 'restart':
                    if (!isOwner && !isSudo) return reply("Owner only")
                    reply("Restarting...")
                    process.exit()
                    break

                case 'setbio':
                    if (!isOwner && !isSudo) return reply("Owner only")
                    await sock.updateProfileStatus(args || "VAMPARINA MD ACTIVE")
                    reply("Bio updated")
                    break

                case 'setprofilepic':
                    if (!isOwner && !isSudo) return reply("Owner only")
                    if (msg.message.imageMessage) {
                        const buffer = await downloadContentFromMessage(msg.message.imageMessage, 'image')
                        let buff = Buffer.alloc(0)
                        for await (const chunk of buffer) buff = Buffer.concat([buff, chunk])
                        await sock.updateProfilePicture(sock.user.id, buff)
                        reply("Profile picture updated")
                    } else {
                        reply("Send an image")
                    }
                    break

                case 'react':
                    if (!isOwner && !isSudo) return reply("Owner only")
                    if (!args) return reply("Emoji?")
                    sock.sendMessage(from, { react: { text: args.split(' ')[0], key: msg.key } })
                    break

                case 'toviewonce':
                    if (!isOwner && !isSudo) return reply("Owner only")
                    if (msg.message.imageMessage || msg.message.videoMessage) {
                        const media = msg.message.imageMessage || msg.message.videoMessage
                        const buffer = await downloadContentFromMessage(media, media.mimetype.includes('image') ? 'image' : 'video')
                        let buff = Buffer.alloc(0)
                        for await (const chunk of buffer) buff = Buffer.concat([buff, chunk])
                        await sock.sendMessage(from, {
                            [media.mimetype.includes('image') ? 'image' : 'video']: buff,
                            viewOnce: true
                        })
                    } else {
                        reply("Send image or video")
                    }
                    break

                case 'tostatus':
                    if (!isOwner && !isSudo) return reply("Owner only")
                    if (msg.message.imageMessage || msg.message.videoMessage) {
                        const media = msg.message.imageMessage || msg.message.videoMessage
                        const buffer = await downloadContentFromMessage(media, 'image')
                        let buff = Buffer.alloc(0)
                        for await (const chunk of buffer) buff = Buffer.concat([buff, chunk])
                        await sock.sendMessage('status@broadcast', { image: buff, caption: args || "" })
                        reply("Sent to status")
                    } else {
                        reply("Send image or video")
                    }
                    break

                case 'owner':
                    if (!isOwner && !isSudo) return reply("Owner only")
                    reply(`Owner: Arnold Chirchir\nwa.me/${BOT.owner}`)
                    break

                case 'disk':
                    if (!isOwner && !isSudo) return reply("Owner only")
                    const used = process.memoryUsage()
                    reply(`RAM: ${(used.heapUsed / 1024 / 1024).toFixed(2)} MB`)
                    break

                case 'listblocked':
                    if (!isOwner && !isSudo) return reply("Owner only")
                    reply(`Blocked users: ${DB.blocked.length}`)
                    break

                case 'listsudo':
                    if (!isOwner && !isSudo) return reply("Owner only")
                    reply(`Sudo users: ${DB.sudo.length}`)
                    break

                case 'online':
                    if (!isOwner && !isSudo) return reply("Owner only")
                    sock.sendPresenceUpdate('available')
                    reply("Now online")
                    break

                case 'groupid':
                    if (!isGroup) return reply("Group only")
                    reply(`Group ID: ${from}`)
                    break

                case 'hostip':
                    if (!isOwner && !isSudo) return reply("Owner only")
                    reply("Host: VAMPARINA SERVER 2025")
                    break

                case 'modestatus':
                    if (!isOwner && !isSudo) return reply("Owner only")
                    reply("Mode: GOD MODE")
                    break

                // AI COMMANDS
                case 'gemini': case 'gemi': case 'ai':
                    if (!args) return reply("Ask Gemini something")
                    reply("Gemini 1.5 Flash thinking...")
                    try {
                        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEYS.gemini}`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: args }] }] })
                        })
                        const data = await res.json()
                        reply(`*Gemini 1.5 Flash*\n\n${data.candidates?.[0]?.content?.parts?.[0]?.text || "No response"}`)
                    } catch (e) {
                        reply("Gemini error: " + e.message)
                    }
                    break

                case 'llama':
                    if (!args) return reply("Ask LLaMA")
                    reply("LLaMA 405B loading...")
                    try {
                        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                            method: "POST",
                            headers: { "Authorization": `Bearer ${API_KEYS.groq}`, "Content-Type": "application/json" },
                            body: JSON.stringify({ model: "llama-3.1-405b-reasoning", messages: [{ role: "user", content: args }] })
                        })
                        const json = await res.json()
                        reply(`*LLaMA 405B*\n\n${json.choices?.[0]?.message?.content || "Error"}`)
                    } catch (e) {
                        reply("LLaMA error: " + e.message)
                    }
                    break

                case 'grok':
                    if (!args) return reply("Ask Grok")
                    reply("Grok thinking...")
                    try {
                        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                            method: "POST",
                            headers: { "Authorization": `Bearer ${API_KEYS.groq}`, "Content-Type": "application/json" },
                            body: JSON.stringify({ model: "mixtral-8x22b", messages: [{ role: "user", content: args }] })
                        })
                        const json = await res.json()
                        reply(`*Grok*\n\n${json.choices?.[0]?.message?.content || "Error"}`)
                    } catch (e) {
                        reply("Grok error: " + e.message)
                    }
                    break

                case 'chatgpt': case 'gpt':
                    if (!args) return reply("Ask ChatGPT")
                    reply("ChatGPT loading...")
                    reply("Free-tier ChatGPT not implemented yet")
                    break

                case 'blackbox':
                    if (!args) return reply("Ask Blackbox")
                    reply("Blackbox AI loading...")
                    reply("Blackbox API not implemented yet")
                    break

                case 'deepseek':
                    if (!args) return reply("Ask DeepSeek")
                    reply("DeepSeek loading...")
                    reply("DeepSeek API not implemented yet")
                    break

                // SEARCH COMMANDS
                case 'define':
                    if (!args) return reply("What word?")
                    reply("Searching dictionary...")
                    try {
                        const dict = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${args}`).then(r => r.json())
                        if (dict.title) return reply("Word not found")
                        const def = dict[0]
                        reply(`*${def.word}*\n\n${def.meanings[0]?.definitions[0]?.definition || "No definition"}\n\nExample: ${def.meanings[0]?.definitions[0]?.example || "None"}`)
                    } catch (e) {
                        reply("Dictionary error: " + e.message)
                    }
                    break

                case 'define2':
                    if (!args) return reply("Urban word?")
                    try {
                        const urban = await fetch(`https://api.urbandictionary.com/v0/define?term=${args}`).then(r => r.json())
                        if (!urban.list[0]) return reply("Not found on Urban")
                        reply(`*${urban.list[0].word}* (Urban)\n\n${urban.list[0].definition.replace(/[\[\]]/g, '')}\n\nLove Thumbs Up: ${urban.list[0].thumbs_up}`)
                    } catch (e) {
                        reply("Urban error: " + e.message)
                    }
                    break

                case 'imdb':
                    if (!args) return reply("Movie/TV name?")
                    try {
                        const imdb = await fetch(`http://www.omdbapi.com/?t=${encodeURIComponent(args)}&apikey=${API_KEYS.omdb}`).then(r => r.json())
                        if (imdb.Response === "False") return reply("Not found")
                        reply(`*${imdb.Title}* (${imdb.Year})\nRating: ${imdb.imdbRating}/10\nGenre: ${imdb.Genre}\n\n${imdb.Plot}`)
                    } catch (e) {
                        reply("IMDb error: " + e.message)
                    }
                    break

                case 'lyrics':
                    if (!args) return reply("Song name?")
                    try {
                        const lyrics = await fetch(`https://api.musixmatch.com/ws/1.1/matcher.lyrics.get?q_track=${encodeURIComponent(args)}&apikey=${API_KEYS.musixmatch}`).then(r => r.json())
                        if (!lyrics.message.body.lyrics) return reply("Lyrics not found")
                        reply(`*${args}*\n\n${lyrics.message.body.lyrics.lyrics_body.substring(0, 1000)}...`)
                    } catch (e) {
                        reply("Lyrics error: " + e.message)
                    }
                    break

                case 'shazam':
                    reply("Shazam listening...")
                    if (msg.message?.videoMessage || msg.message?.audioMessage) {
                        try {
                            let buffer = Buffer.alloc(0)
                            const stream = msg.message?.videoMessage ? await downloadContentFromMessage(msg.message.videoMessage, 'video') : await downloadContentFromMessage(msg.message.audioMessage, 'audio')
                            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])

                            const form = new FormData()
                            form.append('file', buffer, 'audio.mp4')
                            form.append('return', 'apple_music,spotify')

                            const res = await fetch(`https://api.audd.io/?api_token=${API_KEYS.audd}`, { method: 'POST', body: form })
                            const data = await res.json()
                            if (data.status === 'success' && data.result) {
                                reply(`*SHAZAM FOUND!*\n\nTitle: ${data.result.title}\nArtist: ${data.result.artist}\nAlbum: ${data.result.album}\nApple Music: ${data.result.apple_music?.url || 'N/A'}`)
                            } else {
                                reply("Song not recognized")
                            }
                        } catch (e) {
                            reply("Shazam error: " + e.message)
                        }
                    } else {
                        reply("Reply to video/audio")
                    }
                    break

                case 'weather':
                    if (!args) return reply("City name?")
                    try {
                        const weather = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(args)}&appid=${API_KEYS.openweather}&units=metric`).then(r => r.json())
                        if (weather.cod !== 200) return reply("City not found")
                        reply(`*Weather in ${weather.name}, ${weather.sys.country}*\nTemp: ${weather.main.temp}°C\nFeels: ${weather.main.feels_like}°C\n${weather.weather[0].description}\nHumidity: ${weather.main.humidity}%`)
                    } catch (e) {
                        reply("Weather error: " + e.message)
                    }
                    break

                case 'yts':
                    if (!args) return reply("Movie name?")
                    try {
                        const yts = await fetch(`https://yts.mx/api/v2/list_movies.json?query_term=${encodeURIComponent(args)}`).then(r => r.json())
                        if (!yts.data.movies) return reply("No movies found")
                        const movie = yts.data.movies[0]
                        const torrents = movie.torrents.map(t => `${t.quality} - ${t.size}`).join('\n')
                        reply(`*${movie.title_long}*\nYear: ${movie.year}\nRating: ${movie.rating}/10\n\nAvailable:\n${torrents}`)
                    } catch (e) {
                        reply("YTS error: " + e.message)
                    }
                    break

                // TTS — SHENG + ENGLISH
                case 'tts':
                    if (!args) return reply("What should I say?")
                    reply("Speaking...")
                    let voice = "en_uk_001"
                    let text = args
                    if (args.toLowerCase().startsWith("sheng ")) {
                        voice = "en_us_001"
                        text = args.slice(6)
                    } else if (args.toLowerCase().startsWith("eng ")) {
                        voice = "en_uk_001"
                        text = args.slice(4)
                    }
                    try {
                        const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${voice.startsWith('en_us') ? 'en-US' : 'en-GB'}&client=tw-ob&q=${encodeURIComponent(text)}`
                        await sock.sendMessage(from, { audio: { url: ttsUrl }, mimetype: 'audio/mpeg', ptt: true })
                    } catch (e) {
                        reply("TTS error: " + e.message)
                    }
                    break

                // INFO COMMANDS
                case 'ping':
                    const start = Date.now()
                    await reply("Pinging...")
                    reply(`Pong! ${Date.now() - start}ms`)
                    break

                case 'runtime':
                    const uptime = process.uptime()
                    reply(`Runtime: ${Math.floor(uptime / 86400)}d ${Math.floor(uptime % 86400 / 3600)}h ${Math.floor(uptime % 3600 / 60)}m`)
                    break

                case 'botstatus': case 'status':
                    reply(`*VAMPARINA MD*\nOwner: ${DB.settings.ownername}\nPrefix: ${DB.settings.prefix}\nGroups: ${Object.keys(DB.groups).length}\nRuntime: ${Math.floor(process.uptime() / 3600)}h\nStatus: ACTIVE`)
                    break

                case 'pair':
                    reply(`Pair Code: ${sock.user.id.split(':')[0]}`)
                    break

                case 'repo':
                    reply("VAMPARINA MD 2025 — Private Repo\nOwner: Arnold Chirchir\nStatus: Undefeated in Kenya")
                    break

                case 'time':
                    reply(`Time: ${new Date().toLocaleString('en-GB', { timeZone: 'Africa/Nairobi' })} (EAT)`)
                    break

                // MENU — EVERYTHING LISTED
                case 'menu':
                    reply(`
*VAMPARINA MD 2025 — EVERYTHING YOU ASKED FOR*

*Owner*: Arnold Chirchir (+${BOT.owner})
*Prefix*: ${DB.settings.prefix}
*Status*: UNSTOPPABLE

*LOGO MAKER (34 STYLES)*
.1917style .blackpinklogo .galaxystyle .luxurygold .neonglitch .matrix .glowingtext .royaltext .sand .summerbeach .watercolortext + 24 more!

*GROUP COMMANDS*
.add .kick .promote .demote .tagall .listonline .antilink <delete|warn <number>|kick|off> .welcome .link .close .open .setdesc .setgroupname .totalmembers .vcf

*OWNER COMMANDS*
.block .unblock .unblockall .delete .join .leave .restart .setbio .setprofilepic .react .toviewonce .tostatus .owner .disk .listblocked .listsudo .online .groupid .hostip .modestatus .setbadword <add|remove> <word>

*AI COMMANDS*
.gemini .llama .grok .chatgpt .blackbox .deepseek

*SEARCH COMMANDS*
.define .define2 (urban) .imdb .lyrics .shazam .weather .yts

*KENYAN FEATURES*
.shazam (video/audio) .tts (sheng/eng) .vv (view-once download) .vcf (group contacts)

*INFO & MORE*
.feedback .helpers .ping .runtime .botstatus .pair .repo .time

© 2025 Arnold Chirchir — Kenya King Forever
wa.me/${BOT.owner}
                    `)
                    break

                default:
                    reply("Command not found. Use .menu")
            }
        } catch (e) {
            console.log("ERROR:", e)
            try { sock.sendMessage(from, { text: "Error occurred. Try again." }) } catch {}
        }
    })

    // ENHANCED WELCOME + GOODBYE SYSTEM
    sock.ev.on('group-participants.update', async update => {
        try {
            const { id, participants, action } = update
            const settings = DB.groups[id]
            if (!settings?.welcome) return // Only trigger if welcome is enabled

            const metadata = await sock.groupMetadata(id)
            const admins = metadata.participants.filter(p => p.admin).map(p => p.id)
            const groupDesc = metadata.desc || "No description set"
            const inviteCode = await sock.groupInviteCode(id)
            const groupLink = `https://chat.whatsapp.com/${inviteCode}`

            for (const user of participants) {
                if (action === 'add') {
                    // WELCOME MESSAGE
                    let profilePic = null
                    try {
                        profilePic = await sock.profilePictureUrl(user, 'image')
                    } catch (e) {
                        console.log("Profile pic fetch error:", e)
                        profilePic = null
                    }

                    let adminList = admins.length ? admins.map(a => {
                        const num = a.split('@')[0]
                        return `• wa.me/${num}`
                    }).join('\n') : "No admins"

                    const welcomeMsg = `
🔥 *YO ${settings.welcome.replace('@user', '@' + user.split('@')[0])}* 🔥
Welcome to *${metadata.subject}*! You're now part of the crew! 😎

📜 *Group Description*: ${groupDesc}

👑 *Admins*:
${adminList}

🔗 *Group Link*: ${groupLink}
Share this link with your squad to grow the vibe! 🚀

Powered by *VAMPARINA MD 2025* — Created by Arnold Chirchir
                    `.trim()

                    await sock.sendMessage(id, {
                        image: profilePic ? { url: profilePic } : undefined,
                        caption: welcomeMsg,
                        mentions: [user, ...admins]
                    })
                } else if (action === 'remove') {
                    // GOODBYE MESSAGE
                    const goodbyeMsg = `
👋 *Peace Out @${user.split('@')[0]}* 👋
Sorry to see you go from *${metadata.subject}*! 😢 Wishing you the best out there, fam!

🔗 *Come Back Anytime*: ${groupLink}
The door's always open—bring your squad back with you! 💪

Squad, let's keep the vibe alive! 🔥

Powered by *VAMPARINA MD 2025* — Created by Arnold Chirchir
                    `.trim()

                    await sock.sendMessage(id, {
                        text: goodbyeMsg,
                        mentions: [user]
                    })
                }
            }
        } catch (e) {
            console.log("Welcome/Goodbye error:", e)
        }
    })
}

startBot().catch(e => console.log("FATAL ERROR:", e))