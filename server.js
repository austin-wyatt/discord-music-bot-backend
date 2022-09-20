var express = require('express'), 
app = express(),
port = process.env.PORT || 54001

var discord = require('./discord-init')


app.listen(port)

app.get('/initializeDiscord', (req, res) => {
    discord.initialize.then(() => {
        res.end('10')
    })
    .catch(() => {
        res.end('5')
    })
})

app.put('/playYoutubeLink:link', (req, res) => {
    console.log(req.params)
    if(req.params.link.length > 0){
        discord.playYoutubeLink(req.params.link.substr(1))
        .then((reason) => {
            res.end('10')
        }).catch(() => {
            res.end('5')
        })
    }
    else{
        res.end('5')
    }
})

app.put('/playMedia:link', (req, res) => {
    if(req.params.link.length > 0){
        let decodedLink = decodeURI(req.params.link)
        discord.playMedia(decodedLink.substr(1))
        .then((reason) => {
            res.end(reason)
        }).catch(() => {
            res.end('10')
        })
    }
    else{
        res.end('5')
    }
})

app.get('/play', (req, res) => {
    discord.play().then(() => {
        res.end('10')
    }).catch(() => {
        res.end('5')
    })
})

app.get('/pause', (req, res) => {
    discord.pause().then(() => {
        res.end('10')
    }).catch(() => {
        res.end('5')
    })
})

app.put('/setVolume:volume', (req, res) => {
    let volume = Number(req.params.volume.substr(1))
    if(volume >= 0){
        discord.setVolume(volume)
        .then(() => {
            res.end('10')
        }).catch(() => {
            res.end('5')
        })
    }
    else{
        res.end('5')
    }
})

// app.get('/getServers', (req, res) => {
//     discord.getServers().then((result) => {
//         res.end(result)
//     }).catch(() => {
//         res.end('5')
//     })
// })

app.get('/getServersFromIDs:ids', (req, res) => {
    let ids = JSON.parse(req.params.ids.substr(1))
    if(ids.length > 0){
        discord.getServers(ids).then((result) => {
            res.end(result)
        }).catch(() => {
            res.end('5')
        })
    }
    else{
        res.end('5')
    }
})

app.put('/joinChannel:guildid&:channelid', (req, res) => {
    let channelID = req.params.channelid
    let guildID = req.params.guildid.substr(1)
    if(channelID.length > 0){
        discord.joinChannel(guildID, channelID)
        .then(() => {
            res.end('10')
        }).catch(() => {
            res.end('5')
        })
    }
    else{
        res.end('5')
    }
})