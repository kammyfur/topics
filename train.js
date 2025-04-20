// noinspection JSUnresolvedVariable

const Fuse = require('fuse.js');
const fs = require('fs');
const prompts = require('prompts');

console.log("Welcome to the TopicsBot training interface!");
console.log("");
global.data = JSON.parse(fs.readFileSync("./dataset.json").toString());
global.topics = JSON.parse(fs.readFileSync("./topics.json").toString());

async function changePrecise(index) {
    let entry = data[index];
    let response;

    response = await prompts([
        {
            type: 'text',
            name: 'specific',
            message: 'Enter the specific topic',
        }
    ]);
    if (!response.specific) process.exit(2);
    let selected = response.specific.toLowerCase();
    if (!topics.specific.includes(selected)) {
        let fuse = new Fuse(topics.specific);

        let best;
        try {
             best = fuse.search(selected)[0].item;
        } catch (e) {
            best = null;
        }

        if (best === null || typeof best === "undefined") {
            response = await prompts([
                {
                    type: "confirm",
                    name: "create",
                    message: "Create topic \"" + selected + "\"?",
                    initial: true
                }
            ])
            if (response.create) {
                topics.specific.push(selected);
                entry.topic.precise = selected;
            } else {
                await changePrecise(index);
            }
        } else {
            response = await prompts([
                {
                    type: "confirm",
                    name: "use",
                    message: "Use topic \"" + best + "\"?",
                    initial: true
                }
            ])
            if (response.use) {
                topics.specific.push(best);
                entry.topic.precise = best;
            } else {
                response = await prompts([
                    {
                        type: "confirm",
                        name: "create",
                        message: "Create topic \"" + selected + "\"?",
                        initial: true
                    }
                ])
                if (response.create) {
                    topics.specific.push(selected);
                    entry.topic.precise = selected;
                } else {
                    await changePrecise(index);
                }
            }
        }
    }
}

async function changeGeneric(index) {
    let entry = data[index];
    let response;

    response = await prompts([
        {
            type: 'select',
            name: 'generic',
            message: 'Select the general topic',
            choices: topics.generic.map((i) => { return { title: i, value: i }; }),
        }
    ]);
    if (!response.generic) process.exit(2);
    entry.topic.generic = response.generic;
}

async function display(index) {
    let entry = data[index];

    console.log("-----------------------------------------")
    console.log("Message Collection:");
    console.log("    " + entry.trigger[0])
    console.log("    " + entry.trigger[1])
    console.log("    " + entry.trigger[2])
    console.log();
    console.log("General Topic: " + entry.topic.generic);
    console.log("Specific Topic: " + entry.topic.precise);
    console.log("-----------------------------------------")

    let response;

    response = await prompts([
        {
            type: "confirm",
            name: "valid",
            message: "Mark this as usable data?",
            initial: true
        }
    ])
    if (!response.valid) {
        delete data[index];
    } else {
        if (entry.topic.generic === null) {
            await changeGeneric(index);
        } else {
            response = await prompts([
                {
                    type: "confirm",
                    name: "change",
                    message: "Change the general topic?",
                    initial: false
                }
            ])
            if (response.change) {
                await changeGeneric(index);
            }
        }

        if (entry.topic.precise === null) {
            await changePrecise(index);
        } else {
            response = await prompts([
                {
                    type: "confirm",
                    name: "change",
                    message: "Change the specific topic?",
                    initial: false
                }
            ])
            if (response.change) {
                await changePrecise(index);
            }
        }

        response = await prompts([
            {
                type: "confirm",
                name: "continue",
                message: "Save dataset and proceed to next item?",
                initial: true
            }
        ])
        if (!response.continue) {
            await display(index);
        } else {
            entry.topic.reviewed = true;
            fs.writeFileSync("./dataset.json", JSON.stringify(Array.from(new Set(data)), null, 4));
        }
    }
}

(async () => {
    let index = 0;
    for (let entry of data) {
        if (!entry.topic.reviewed || entry.topic.generic === null || entry.topic.precise === null) {
            await display(index);
        }

        index++;
    }
})()