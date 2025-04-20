(async () => {
    global.fs = require('fs')

    process.on('uncaughtException', (error) => {
        if (error.name.startsWith("M_")) {
            console.log(error.name + ": " + error.message);
        } else {
            throw error;
        }
    })

    global.ready = false;
    let user = "topics"
    let pass = "6AFcqNhQ7JdJEAretnggsr3vmrAGzVLq4mZzjGqh5FvB2LtL";
    let exec = require('child_process').execSync;

    let raw = exec(`curl -s -X POST -H "Content-Type: application/json" -d '{"type":"m.login.password","identifier":{"type":"m.id.user","user":"${user}"},"password":"${pass}"}' https://conduit.minteck.org/_matrix/client/r0/login`);
    let data = JSON.parse(raw);

    if (data.error) {
        console.log("Failed");
        process.exit();
    }

    let uid = "@" + user + ":minteck.org";
    let token;
    if (data.access_token) {
        token = data.access_token;
    } else {
        console.log("Failed");
        process.exit();
    }

    const sdk = require('matrix-js-sdk');

    const client = sdk.createClient({
        baseUrl: "https://conduit.minteck.org",
        accessToken: token,
        userId: "@" + user + ":minteck.org"
    });

    await client.startClient({initialSyncLimit: 10});

    client.once('sync', function(state) {
        if (state === 'PREPARED') {
            global.data = JSON.parse(fs.readFileSync("./dataset.json").toString());
            global.topics = JSON.parse(fs.readFileSync("./topics.json").toString());
            console.log("Client is ready");
            global.ready = true;
        } else {
            console.log(state);
            process.exit(1);
        }
    });

    client.on("RoomMember.membership", function(event, member) {
        if (!ready) return;
        if (member.membership === "invite" && member.userId === uid) {
            client.joinRoom(member.roomId).then(function() {
                console.log("Joined room %s", member.roomId);
            });
        }
    });

    client.on("Room.timeline", function(event, room, toStartOfTimeline) {
        if (!ready) return;
        if (toStartOfTimeline || event.getType() !== "m.room.message") {
            return;
        }
        console.log(
            "%s", event.getContent().body.replace(/> <(.*)> (.*)(\n> (.*)|())\n\n(.*)/gm, "$6")
        );
        require('./message')(event.getContent().body.replace(/> <(.*)> (.*)(\n> (.*)|())\n\n(.*)/gm));
    });

})();