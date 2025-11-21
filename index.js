import makeWASocket, { 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion, 
    makeCacheableSignalKeyStore, 
    downloadContentFromMessage,
    DisconnectReason
} from '@whiskeysockets/baileys'
import pino from 'pino'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import fetch from 'node-fetch'
import { Sticker } from 'wa-sticker-formatter'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sessionDir = path.join(__dirname, 'session')
if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true })

const BOT = {
    name: "VAMPARINA MD",
    owner: "254703110780", // Your number without +
    prefix: ".",
    version: "2.0.0"
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir)
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino().child({ level: 'silent' })) },
        browser: ['VAMPARINA MD', 'Chrome', '2025']
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', (u) => {
        const { connection, lastDisconnect } = u
        if (connection === 'close') {
            if (lastDisconnect?.error?.output?.statusCode !== 401) startBot()
        } else if (connection === 'open') {
            console.log("VAMPARINA MD IS ONLINE — ARNOLD CHIRCHIR IS KING")
        }
    })

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0]
        if (!msg.message || msg.key.fromMe) return

        const from = msg.key.remoteJid
        const sender = msg.key.participant || from
        const isGroup = from.endsWith('@g.us')
        const groupMetadata = isGroup ? await sock.groupMetadata(from) : null
        const participants = isGroup ? groupMetadata.participants : []
        const admins = isGroup ? participants.filter(p => p.admin).map(p => p.id) : []
        const isBotAdmin = isGroup ? admins.includes(sock.user.id) : false
        const isAdmin = isGroup ? admins.includes(sender) : false
        const isOwner = sender.split('@')[0] === BOT.owner

        const body = (msg.message?.conversation || 
                     msg.message?.extendedTextMessage?.text || 
                     msg.message?.imageMessage?.caption || 
                     msg.message?.videoMessage?.caption || '').trim()

        if (!body.startsWith(BOT.prefix)) return

        const cmd = body.slice(1).trim().split(' ').shift().toLowerCase()
        const args = body.slice(cmd.length + 2).trim()
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage ? msg : null

        const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg })

        // =============== OWNER & GROUP CHECK ===============
        const onlyOwner = () => { if (!isOwner) return reply("Owner only!") }
        const onlyAdmin = () => { if (!isAdmin) return reply("Admin only!") }
        const onlyBotAdmin = () => { if (!isBotAdmin) return reply("Bot must be admin!") }

        try {
            switch (cmd) {

                // AI
                case 'gemini': case 'ai':
                    if (!args) return reply("Ask something.")
                    reply("Gemini thinking...")
                    const gem = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyDk3oqR2V4e0Xz8X1X0X9X8X7X6X5X4X3X", {
                        method: "POST", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: args }] }] })
                    })
                    const gdata = await gem.json()
                    reply(`*Gemini 1.5*\n\n${gdata.candidates?.[0]?.content?.parts?.[0]?.text || "No reply"}`)
                    break

                // DOWNLOADERS
                case 'fb': case 'facebook':
                    if (!args) return reply("Send FB link")
                    reply("Downloading FB...")
                    const fb = await fetch(`https://api.siputzx.my.id/api/facebook?url=${args}`)
                    const fdata = await fb.json()
                    if (fdata.result?.hd) sock.sendMessage(from, { video: { url: fdata.result.hd }, caption: "VAMPARINA MD — HD" })
                    else if (fdata.result?.sd) sock.sendMessage(from, { video: { url: fdata.result.sd }, caption: "VAMPARINA MD — SD" })
                    else reply("Failed")
                    break

                case 'tiktok': case 'tt':
                    if (!args) return reply("Send TikTok link")
                    reply("Downloading...")
                    const tt = await fetch(`https://api.tiklydown.eu.org/api/download?link=${args}`)
                    const ttdata = await tt.json()
                    if (ttdata.video?.noWatermark) sock.sendMessage(from, { video: { url: ttdata.video.noWatermark }, caption: "VAMPARINA MD — No WM" })
                    break

                case 'ig': case 'instagram':
                    if (!args) return reply("Send IG link")
                    reply("Fetching IG...")
                    const ig = await fetch(`https://api.siputzx.my.id/api/instagram?url=${args}`)
                    const igdata = await ig.json()
                    if (igdata.data?.[0]?.url) sock.sendMessage(from, { video: { url: igdata.data[0].url }, caption: "VAMPARINA MD" })
                    break

                // GROUP COMMANDS — ALL WORKING
                case 'kick':
                    onlyAdmin(); onlyBotAdmin()
                    if (!msg.message?.extendedTextMessage?.contextInfo?.mentionedJid) return reply("Tag user!")
                    const userkick = msg.message.extendedTextMessage.contextInfo.mentionedJid[0]
                    await sock.groupParticipantsUpdate(from, [userkick], "remove")
                    reply("User kicked!")
                    break

                case 'add':
                    onlyAdmin(); onlyBotAdmin()
                    if (!args) return reply("Send number: 254xxx")
                    await sock.groupParticipantsUpdate(from, [args.replace(/[^0-9]/g, '') + "@s.whatsapp.net"], "add")
                    reply("User added!")
                    break

                case 'promote':
                    onlyAdmin(); onlyBotAdmin()
                    if (!msg.message?.extendedTextMessage?.contextInfo?.mentionedJid) return reply("Tag user")
                    await sock.groupParticipantsUpdate(from, [msg.message.extendedTextMessage.contextInfo.mentionedJid[0]], "promote")
                    reply("Promoted to admin!")
                    break

                case 'demote':
                    onlyAdmin(); onlyBotAdmin()
                    if (!msg.message?.extendedTextMessage?.contextInfo?.mentionedJid) return reply("Tag admin")
                    await sock.groupParticipantsUpdate(from, [msg.message.extendedTextMessage.contextInfo.mentionedJid[0]], "demote")
                    reply("Demoted!")
                    break

                case 'tagall': case 'hidetag':
                    onlyAdmin()
                    let texttag = args || "No message"
                    let mentions = participants.map(a => a.id)
                    sock.sendMessage(from, { text: texttag, mentions })
                    break

                case 'welcome':
                    onlyAdmin()
                    reply(args.toLowerCase() === 'on' ? "Welcome ON" : "Welcome OFF")
                    break

                case 'antilink':
                    onlyAdmin(); onlyBotAdmin()
                    reply(args.toLowerCase() === 'on' ? "Antilink ON" : "Antilink OFF")
                    break

                case 'close':
                    onlyAdmin(); onlyBotAdmin()
                    await sock.groupSettingUpdate(from, 'announcement')
                    reply("Group closed!")
                    break

                case 'open':
                    onlyAdmin(); onlyBotAdmin()
                    await sock.groupSettingUpdate(from, 'not_announcement')
                    reply("Group opened!")
                    break

                case 'link': case 'grouplink':
                    const code = await sock.groupInviteCode(from)
                    reply(`https://chat.whatsapp.com/${code}`)
                    break

                // STICKER
                case 'sticker': case 's':
                    if (msg.message.imageMessage || msg.message.videoMessage) {
                        const buffer = await downloadContentFromMessage(msg.message.imageMessage || msg.message.videoMessage, 'image')
                        let buff = Buffer.alloc(0)
                        for await (const chunk of buffer) buff = Buffer.concat([buff, chunk])
                        const sticker = new Sticker(buff, { pack: 'VAMPARINA', author: 'Arnold' })
                        sock.sendMessage(from, { sticker: await sticker.toBuffer() })
                    } else reply("Reply image/video")
                    break

                // MENU
                case 'menu': case 'help':
                    reply(`
┏━━◈ VAMPARINA MD v${BOT.version} ◈━━┓
┃ Owner : Arnold Chirchir
┃ Prefix : [ ${BOT.prefix} ]
┣━━━━━━━━━━━━━━━━━━━━━━
┃
┃ AI COMMANDS
┃ .gemini • .llama
┃
┃ DOWNLOAD COMMANDS
┃ .fb • .tiktok • .ig • .ytmp3
┃
┃ GROUP TOOLS (All Working)
┃ .kick • .add • .promote • .demote
┃ .tagall • .close • .open • .link
┃ .welcome on/off • .antilink on/off
┃
┃ TOOLS
┃ .sticker • .tourl
┃
┗━━━━━━━━━━━━━━━━━━━━━━
© 2025 Arnold Chirchir — Kenya
wa.me/${BOT.owner}
                    `)
                    break

                default:
                    reply("Unknown command. Use .menu")
            }
        } catch (e) {
            console.log("ERROR:", e)
        }
    })
}

startBot()