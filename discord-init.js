const Discord = require('discord.js')
const ytdl = require('ytdl-core')
var WebSocketServer = require('websocket').server;
var http = require('http');

const client = new Discord.Client();
let connection = null;
let globalDispatcher = null;

let apiKey = "<your api key here>";

exports.initialize = new Promise((resolve, reject) => {
    client.on('ready', () => {
        console.log('Hello')
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

exports.playYoutubeLink = (link) => new Promise((resolve, reject) => {
    if(initialized && connection){
        try{
            const stream = ytdl('https://www.youtube.com/watch?v=' + link, { filter: 'audioonly',  quality: 'highestaudio' });

            const dispatcher = connection.play(stream)
            globalDispatcher = dispatcher
            globalDispatcher.setVolumeDecibels(0.5)

            let loop = true

            let finishedPlaying = false;
            dispatcher.on('finish', () => {
                finishedPlaying = true;
                console.log('Finished playing!');
                dispatcher.destroy()
            });

            dispatcher.on('close', () => {
                console.log('Stream closed');
                dispatcher.destroy()
                if(finishedPlaying){
                    sendDataToClient('playback_ended')
                }
            });

            dispatcher.on('error', () => {
                console.log('Stream error encountered');
                dispatcher.destroy()
                sendDataToClient('playback_ended')
            });

            console.log("Event names: " + stream.readableLength)

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
            const dispatcher = connection.play(link)
            globalDispatcher = dispatcher
            globalDispatcher.setVolumeDecibels(0.5)

            let finishedPlaying = false;
            dispatcher.on('finish', () => {
                finishedPlaying = true;
                console.log('Finished playing!');
                dispatcher.destroy()
            });

            dispatcher.on('close', () => {
                console.log('Stream closed');
                dispatcher.destroy()
                if(finishedPlaying){
                    sendDataToClient('playback_ended')
                }
            });

            dispatcher.on('error', () => {
                console.log('Stream error encountered');
                dispatcher.destroy()
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
    if(!!globalDispatcher){
        globalDispatcher.pause();
        resolve()
    }
    else{
        reject()
    }
})

exports.play = () => new Promise((resolve, reject) => {
    if(!!globalDispatcher){
        globalDispatcher.resume();
        resolve()
    }
    else{
        reject()
    }
})

exports.setVolume = (volume) => new Promise((resolve, reject) => {
    if(!!globalDispatcher){
        globalDispatcher.setVolume(volume);
        console.log('Setting volume')
        resolve()
    }
    else{
        reject()
    }
})


exports.getVolume = () => new Promise((resolve, reject) => {
    if(!!globalDispatcher){
        resolve(globalDispatcher.volume)
    }
    else{
        reject()
    }
})

exports.getServers = (ids) => new Promise((resolve, reject) => {
    if(!!client && initialized){
        let returnValue = []
        let i = 0

        client.guilds.cache.map((g) => {
            returnValue.push({id: g.id, name: g.name, channels: []})

            g.channels.cache.map((c) => {
                if(c.type == 'voice'){
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
        const req = client.guilds.cache.get(guildID).channels.cache.get(channelID).join()
        req.then(res => {
            console.log('CONNECTION SUCCESFUL')
            connection = res
            resolve()
        })
        req.catch(err => {
            console.log('CONNECTION UNSUCCESFUL')
            reject()
        })
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