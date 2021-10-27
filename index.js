// Packages & values
const { Client, Intents, Message, MessageEmbed } = require("discord.js")
const { whitelisted_roles } = require("./config")
const config = require("./config")
require("dotenv").config()
const { TOKEN } = process.env

// Client
const client = new Client({
    intents: Object.keys(Intents.FLAGS).filter(f => f.startsWith("GUILD")),
    partials: ['CHANNEL','GUILD_MEMBER','MESSAGE','REACTION','USER']
})

client.on("ready", () => {
    if (!TOKEN) {
        throw new TypeError("Please add a token into the .env file!")
    }
    if (config.action?.includes("ban") && config.action?.includes("kick")) {
        throw new TypeError("You can not ban and kick a member! Please only choose one or the other.")
    }
    client.user.setActivity("Watching scummy scammers")
    client.user.setStatus("dnd")
    console.log(client.user.tag + " is now online!")
})

// Message Event
client.on("messageCreate", (message) => {
    let returnValue = false;
    if (message.author.bot || !message.guild) return;
    if (config.blacklisted_users.includes(message.author.id)) return;
    config.blacklisted_roles.forEach((role) => { if (message.member.roles.cache.has(role)) { returnValue = true } })
    if (returnValue) return;
    if (!config.whitelisted_users.length && !config.whitelisted_roles.length) {
        antiLink(message);
    }
    if (config.whitelisted_roles.length > 0) {
      config.whitelisted_roles.forEach((role) => {
        if (message.member.roles.cache.has(role)) {
          antiLink(message);
        } else {
          return;
        }
      });
    }
    if (config.whitelisted_users.length > 0) {
        if (config.whitelisted_users.includes(message.author.id)) {
            antiLink(message);
        } else {
            return
        }
    }
})

/**
 * 
 * @param {Message} message 
 */
const antiLink = (message) => {
    if (config.owners.includes(message.author.id)) return;
    let action = config.action 
    if (!config.action.length || config.action[0] === "") { action = ["delete"] }
    config.links.forEach((link) => {
        const regex = new RegExp(`(https?:\/\/)?(www.\.)?(${link})\/.+[a-z]`, "gim");
        const args = message.content.split(/ +/)
        args.forEach((arg) => {
            if (regex.test(arg)) {
                const reportChannel = message.guild.channels.cache.find(c => c.id === config.report_channel)
                if (action.includes("delete")) { message.delete().catch((err) => { if (reportChannel) { reportChannel.send({ content: `\`🚨\` Error deleteing message from <@${message.author.id}>! Please recheck my permissions, message: ${message.content}` }); } }) }
                if (action.includes("ban")) {
                    if (!message.guild.me.permissions.has("BAN_MEMBERS")) {
                        if (reportChannel) {
                            reportChannel.send({ content: `\`🚨\` **Error!**\nCan't ban member ( <@${message.author.id}> )! I'm missing the ban members permission` });
                        }
                    } else {
                        message.member.ban({ reason: "Scam links [AUTO]", days: 7 }).catch((err) => {
                            if (reportChannel) {
                              reportChannel.send({
                                content: `\`🚨\` **Error!**\nFailed to ban member <@${message.author.id}>! Please recheck my permissions and make sure my role is higher than <@${message.author.id}>'s highest`,
                              });
                            }
                        })
                    }
                }
                if (action.includes("kick")) {
                    if (!message.guild.me.permissions.has("KICK_MEMBERS")) {
                        if (reportChannel) {
                            reportChannel.send({
                              content: `\`🚨\` **Error!**\nCan't kick member ( <@${message.author.id}> )! I'm missing the kick members permission`,
                            });
                        }
                    } else {
                        message.member.kick({ reason: "Scam links [AUTO]" }).catch((err) => {
                            if (reportChannel) {
                              reportChannel.send({
                                content: `\`🚨\` **Error!**\nFailed to kick member <@${message.author.id}>! Please recheck my permissions and make sure my role is higher than <@${message.author.id}>'s highest`,
                              });
                            }
                        })
                    }
                }
                if (action.includes("report")) {
                    if (reportChannel) {
                        const embed = new MessageEmbed()
                            .setTitle("Link found!")
                            .setTimestamp()
                            .setDescription(`Member: ${message.author}\nChannel: ${message.channel}\nMessage: \n \`\`\` ${message.content} \`\`\``)
                        reportChannel.send({embeds: [embed]})
                    }
                }
            }
        })
    })
    
}

client.login(TOKEN)