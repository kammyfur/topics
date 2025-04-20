module.exports = (group) => {
    if (data.length < 300) {
        console.log("    Dataset is too short, only saving data");
        data.push({
            trigger: group,
            topic: {
                generic: null,
                precise: null,
                reviewed: false
            }
        })
    }

    fs.writeFileSync("./dataset.json", JSON.stringify(data, null, 4));
}