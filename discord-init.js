const yt_dl = require('youtube-dl-exec')
var WebSocketServer = require('websocket').server;
var http = require('http');
const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const assert = require('assert');

const client = new Client({intents: [GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]});
let connection = null;

const audioPlayer = createAudioPlayer();

let apiKey = "<your api key here>";

try{
    assert(apiKey != "<your api key here>")    
}
catch{
    console.error("Replace the value of apiKey with your Discord bot's API key")
    process.exit(1)
}
exports.initialize = new Promise((resolve, reject) => {
    client.on('ready', () => {
        console.log('Discord connection successful')
    })

    client.on('message', (msg) => {
        // console.log(msg)
        // if(msg.content == '!help'){
        //     msg.reply('!jc')
        // }
        // else if(msg.content == '!jc'){
        //     if(connection){
        //         connection.disconnect()
        //         connection = null;
        //     }
        //     if(msg.member.voice.channel) {
        //         const req = msg.member.voice.channel.join();
        //         req.then(res => {
        //             console.log('CONNECTION SUCCESFUL')
        //             connection = res
        //         })
        //         req.catch(err => {
        //             console.log('CONNECTION UNSUCCESFUL')
        //             connection = null
        //         })
        //     }
        // }
    })

    client.login(apiKey)
    .then((res) => {
        initialized = true
        resolve()
    }).catch((err) => {
        console.log(err)
        reject()
    })
})

exports.playYoutubeLink = (link) => new Promise(async (resolve, reject) => {
    if(initialized && connection){
        try{
            // const stream = ytdl('https://www.youtube.com/watch?v=' + link, { filter: 'audioonly',  quality: 'highestaudio' });
            const stream = yt_dl.exec('https://www.youtube.com/watch?v=' + link, {
                output: '-',
                format: 'bestaudio',
                }
                , { stdio: ['ignore', 'pipe', 'ignore'] })

            const resource = createAudioResource(stream.stdout);
            audioPlayer.play(resource);

            audioPlayer.on(AudioPlayerStatus.Idle, () => {
                console.log('Finished playing!');
                sendDataToClient('playback_ended')
            });

            audioPlayer.on('error', (e) => {
                console.log('Stream error encountered');
                sendDataToClient('playback_ended')
            });

            console.log("Event names: " + stream.stdout.readableLength)

            resolve()
        }
        catch(error){
            console.log(error)
        }
    }
    else{
        reject()
    }
})

exports.playMedia = (link) => new Promise((resolve, reject) => {
    if(initialized && connection){
        try{
            const resource = createAudioResource(link);
            audioPlayer.play(resource)

            let finishedPlaying = false;
            audioPlayer.on(AudioPlayerStatus.Idle, () => {
                finishedPlaying = true;
                console.log('Finished playing!');
                if(finishedPlaying){
                    sendDataToClient('playback_ended')
                }
            });

            // dispatcher.on('close', () => {
            //     console.log('Stream closed');
            //     dispatcher.destroy()
            //     if(finishedPlaying){
            //         sendDataToClient('playback_ended')
            //     }
            // });

            audioPlayer.on('error', () => {
                console.log('Stream error encountered');
                sendDataToClient('playback_ended')
            });

            resolve()
        }
        catch(error){
            console.log(error)
        }
    }
    else{
        reject()
    }
})

exports.pause = () => new Promise((resolve, reject) => {
    if(audioPlayer){
        audioPlayer.pause();
        resolve()
    }
    else{
        reject()
    }
})

exports.play = () => new Promise((resolve, reject) => {
    if(audioPlayer){
        audioPlayer.unpause();
        resolve()
    }
    else{
        reject()
    }
})

exports.setVolume = (volume) => new Promise((resolve, reject) => {
    resolve()
})


exports.getVolume = () => new Promise((resolve, reject) => {
    resolve(1)
})

exports.getServers = (ids) => new Promise((resolve, reject) => {
    if(!!client && initialized){
        let returnValue = []
        let i = 0

        client.guilds.cache.map((g) => {
            returnValue.push({id: g.id, name: g.name, channels: []})

            g.channels.cache.map((c) => {
                if(c.type == 2){ //voice channel
                    returnValue[i].channels.push({id: c.id, name: c.name})
                }
            })
            i++;
        })

        if(ids != undefined){
            returnValue = returnValue.filter(r => !!ids.find(id => id == r.id))
        }

        resolve(JSON.stringify(returnValue))
    }
    else{
        reject()
    }
})

exports.joinChannel = (guildID, channelID) => new Promise((resolve, reject) => {
    if(client && initialized){
        if(connection){
            connection.disconnect()
        }

        const channel = client.guilds.cache.get(guildID).channels.cache.get(channelID);
        
        connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
            selfDeaf: false,
            selfMute: false
        })

        if(connection)
        {
            connection.subscribe(audioPlayer);
            console.log('CHANNEL CONNECTION SUCCESSFUL')
            resolve();
        }
        else
        {
            console.log('CHANNEL CONNECTION UNSUCCESSFUL')
            reject();
        }
    }
    else{
        reject()
    }
})



//Websocket needs to be in here to get access data from these functions

var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});

server.listen(54002, function() {
    console.log((new Date()) + ' Server is listening on port 54002');
});

wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});

let globalWebSocketConnection = null

wsServer.on('request', function(request) {
    var connection = request.accept('echo-protocol', request.origin);
    globalWebSocketConnection = connection;
    console.log((new Date()) + ' Connection accepted.');
    connection.on('message', function(message) {
        if(message.utf8Data == 'get_volume'){
            if(globalDispatcher){
                let volume = globalDispatcher.volume
                sendDataToClient('volume&' + volume)
            }
        }
    });
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});

const sendDataToClient = (data) => {
    if(globalWebSocketConnection && globalWebSocketConnection.connected){
        globalWebSocketConnection.sendUTF(data)
    }
}