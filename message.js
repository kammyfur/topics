let group = [
    null,
    null,
    null
]

module.exports = (msg) => {
    if (group[0] === null) {
        console.log("    Message 1/3");
        group[0] = msg
    } else if (group[1] === null) {
        console.log("    Message 2/3");
        group[1] = msg
    } else if (group[2] === null) {
        console.log("    Message 3/3");
        group[2] = msg
        require('./process')(group);
        group = [
            null,
            null,
            null
        ]
    }
}