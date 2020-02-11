require('dotenv').config()
// console.log(process.env.ASANA_PERSONAL_TOKEN);
const asana = require('asana');
const client = asana.Client.create({defaultHeaders: {'Asana-Enable': 'string_ids'}}).useAccessToken(process.env.ASANA_PERSONAL_TOKEN);
client.users.me().then(function(me) {
    // console.log(me);
    // console.log( me.workspaces[0].id);
    // console.log( me.workspaces);
});

// client.projects.findById(process.env.ASANA_PROJECT_ID).then(project => {
//     // console.log(project);
//     project.tasks.then(tasks => {
//         console.log(tasks);
//     })
// })
async function getTask(id) {
    return await client.tasks.findById(id);
}

function arrayToObj(arr, keyField) {
    const obj = {};
    arr.forEach(i => {
        obj[i[keyField]] = i;
    });
    return obj;
}

function extractEnumValue(enumData, defaultValue) {
    console.log(enumData);
    const {enum_value = {}} = enumData;
    const {name} = enum_value || {};
    return name || defaultValue;
}

function processTask(task) {
    const {assignee: {name: assignee}, completed, custom_fields = [] } = task;
    const customObj = arrayToObj(custom_fields, 'gid');
    let effort = extractEnumValue(customObj[process.env.ASANA_CUSTOM_ID_EFFORT] || {}, 0);
    console.log(effort);

}
client.projects.tasks(process.env.ASANA_PROJECT_ID).then(async collection => {
    const tasks = await collection.fetch(1000);
    for (let i in tasks) {
        let task = tasks[i];
        let taskData = await getTask(task.gid);
        processTask(taskData);
    }

})
