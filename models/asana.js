const fs = require('fs');
const asana = require('asana');
const asanaPersonalToken = process.env.ASANA_PERSONAL_TOKEN;
const asanaProjectId = process.env.ASANA_PROJECT_ID;
const asanaCustomIdEffort = process.env.ASANA_CUSTOM_ID_EFFORT;
const asanaCustomIdImpact = process.env.ASANA_CUSTOM_ID_IMPACT;
const asanaCustomIdSprint = process.env.ASANA_CUSTOM_ID_SPRINT;
const asanaCustomIdStack = process.env.ASANA_CUSTOM_ID_STACK;

const cacheInMillis = (process.env.CACHE_MINUTES || 5) * 60 * 1000;
const cacheFile = process.env.CACHE_FILE;

const client = asana.Client.create({defaultHeaders: {'Asana-Enable': 'string_ids'}}).useAccessToken(asanaPersonalToken);


function processData(data) {
    /**
     *
     * @type {{
     *     sprints: {
     *       sprint: {
     *          confirmed: 0,
     *          estimated: 0,
     *          people: {
     *              person: {
     *                  confirmed: 0,
     *                  estimated: 0
     *                  stacks: {
     *                      stack: {
     *                          confirmed: 0,
     *                          estimated: 0
     *                      }
     *                  }
     *              }
     *          },
     *          stacks: {
     *              stack: {
     *                  confirmed: 0,
     *                  estimated: 0
     *              }
     *          },
     *          impacts: {
     *              impact: {
     *                  confirmed: 0,
     *                  estimated: 0
     *              }
     *          },
     *          total: {
     *              confirmed: 0,
     *              estimated: 0
     *          }
     *      }
     *     },
     *     sections: {
     *         section: {
     *             stacks: {
     *                 stack: {
     *                     confirmed: 0,
     *                     estimated: 0
     *                 }
     *             },
     *             total: {
     *                 confirmed: 0,
     *                 estimated: 0
     *             }
     *         }
     *     }
     * }}
     */
    const points = {
        sprints: {

        },
        sections: {

        }
    };
    data.taskData.forEach(task => {
        const {completed, effort, impact, sprint, stack = 'Unknown', assignee, section: sectionObj} = task;
        const {gid: user_id = false} = assignee || {};
        const {name: section} = sectionObj;
        const {estimate = false, value = 0} = effort || {};
        const confirmed = !estimate ? value : 0;
        const estimated = estimate ? value : 0;


        if (!points.sprints.hasOwnProperty(sprint)) {
            points.sprints[sprint] = {
                people: {},
                stacks: {},
                impacts: {},
                total: {
                    confirmed: 0,
                    estimated: 0
                }
            }
        }

        if (!points.sections.hasOwnProperty(section)) {
            points.sections[section] = {
                stacks: {

                },
                total: {
                    confirmed: 0,
                    estimated: 0
                }
            }
        }
        //Just use a reference to clean up the code
        const dataSprint = points.sprints[sprint];
        dataSprint.total.confirmed += confirmed;
        dataSprint.total.estimated += estimated;

        /** Add per user and per user per stack points */
        if (user_id) {

            if (!dataSprint.people.hasOwnProperty(user_id)) {
                dataSprint.people[user_id] = {
                    confirmed: 0,
                    estimated: 0,
                    stacks: {

                    }
                }
            }

            const dataPerson = dataSprint.people[user_id];
            if (!dataPerson.stacks.hasOwnProperty(stack)) {
                dataPerson.stacks[stack] = {
                    confirmed: 0,
                    estimated: 0
                }
            }

            dataPerson.confirmed += confirmed;
            dataPerson.estimated += estimated;
            dataPerson.stacks[stack].confirmed += confirmed;
            dataPerson.stacks[stack].estimated += estimated;
        }

        /** Stack points */
        if (!dataSprint.stacks.hasOwnProperty(stack)) {
            dataSprint.stacks[stack] = {
                confirmed: 0,
                estimated: 0
            }
        }
        dataSprint.stacks[stack].confirmed += confirmed;
        dataSprint.stacks[stack].estimated += estimated;

        /** Impact points */
        if (!dataSprint.impacts.hasOwnProperty(impact)) {
            dataSprint.impacts[impact] = {
                confirmed: 0,
                estimated: 0
            }
        }
        dataSprint.impacts[impact].confirmed += confirmed;
        dataSprint.impacts[impact].estimated += estimated;

        /** Sections */
        const dataSection = points.sections[section];
        dataSection.total.confirmed += confirmed;
        dataSection.total.estimated += estimated;

        /** Section stacks */
        if (!dataSection.stacks.hasOwnProperty(stack)) {
            dataSection.stacks[stack] = {
                confirmed: 0,
                estimated: 0
            }
        }
        dataSection.stacks[stack].confirmed += confirmed;
        dataSection.stacks[stack].estimated += estimated;
    });
    return points;
}

function loadCache() {
    //Hack to make sure the file exists
    fs.closeSync(fs.openSync(cacheFile, 'a'));
    const contents = fs.readFileSync(cacheFile, 'utf8');
    let cache = {};
    try {
        if (contents) {
            cache = JSON.parse(contents);
        }
    } catch (e) {
        console.error('Failed to load cache');
    }
    return cache;
}

function writeCache(data) {
    fs.writeFileSync(cacheFile, JSON.stringify(data, null, 2));
}

function arrayToObj(arr, keyField) {
    const obj = {};
    arr.forEach(i => {
        obj[i[keyField]] = i;
    });
    return obj;
}

function extractEnumValue(enumData, defaultValue) {
    const data = enumData || {};
    const value = data[`${data.type}_value`];
    if (value && typeof value === 'object') {
        return value.name || defaultValue;
    }
    return value || defaultValue;
}

function processEffortValue(effort) {
    const [_, value, isEstimate] = (effort || '').match(/^([0-9.]+)(E$)?/) || [];
    const result = {
        estimate: false,
        value: 0
    };
    if (!isNaN(value)) {
        if (isEstimate) {
            result.value = +value;
            result.estimate = true;
        } else {
            result.value = +value;
        }
    }
    return result;
}

function processTask(task) {
    const {assignee, completed, custom_fields = [], memberships} = task;

    const customObj = arrayToObj(custom_fields, 'gid');

    const effort = processEffortValue(extractEnumValue(customObj[asanaCustomIdEffort], 0));
    const impact = extractEnumValue(customObj[asanaCustomIdImpact], '');
    const sprint = extractEnumValue(customObj[asanaCustomIdSprint], 0);
    const stack = extractEnumValue(customObj[asanaCustomIdStack], 'Unknown');
    const section = memberships.find(i => i.project.gid === asanaProjectId).section;

    return {
        completed,
        effort,
        impact,
        sprint,
        stack,
        assignee,
        section
    };
}

async function fetchTask(id) {
    return await client.tasks.findById(id);
}

async function fetchUsers(userIds) {
    const users = {};
    for (let i in userIds) {
        let id = userIds[i];
        let user = await client.users.findById(id);
        users[user.gid] = user;
    }
    return users;
}

async function fetchData() {
    const taskData = [];
    const collection = await client.projects.tasks(asanaProjectId);
    const tasks = await collection.fetch(10000);
    for (let i in tasks) {
        let task = tasks[i];
        let rawTaskData = await fetchTask(task.gid);
        taskData.push(processTask(rawTaskData));
    }
    const userData = await fetchUsers([...new Set(taskData.map(i => i.assignee ? i.assignee.gid : null))].filter(i => !!i));
    const data = {
        createdAt: (new Date()).getTime(),
        taskData,
        userData
    };
    writeCache(data);
    return data;
}

const getAsanaPoints = async (forceRefresh) => {
    const cache = loadCache();
    let data = null;
    const now = (new Date()).getTime();
    if (forceRefresh || !cache.createdAt || now - cache.createdAt > cacheInMillis) {
        data = await fetchData();
    } else {
        data = cache;
    }
    return processData(data);
};


module.exports = {
    getAsanaPoints
};
