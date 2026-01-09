// THE WORD AND THE BRANCH - Days 1-2 Complete Playable Demo
// Full corruption system, timer, command parser, dog encounter

// ============ GAME STATE ============
const game = {
    currentLocation: 'intro',
    day: 0,
    timeRemaining: 180, // 3 minutes per day
    timerInterval: null,
    inventory: [],
    maxInventory: 3,
    corruption: 0,
    flags: {
        rule1Known: false,
        rule2Known: false,
        rule3Known: false,
        wordKnown: false,
        dogAlive: true,
        dogPetted: false,
        dogKilled: false,
        dogIgnored: false,
        phoneFound: false,
        batteriesInstalled: false,
        phoneOn: false,
        lanternLit: false,
        nightsSurvived: 0,
        monsterProximity: 0,
        plaque1Read: false,
        crowbarUsed: false,
        deskOpened: false
    },
    visitedRooms: new Set()
};

const THE_WORD = 'emmanuel'; // Must discover and type before touching

// ============ CANVAS SETUP ============
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

const locationImages = {
    entrance: 'entrance.png',
    garden: 'garden.png',
    greenhouse: 'greenhouse.png',
    sideyard: 'sideyard.png',
    shed: 'shed.png'
};

const loadedImages = {};
for (const [key, src] of Object.entries(locationImages)) {
    const img = new Image();
    img.src = src;
    loadedImages[key] = img;
}

const colors = {
    black: '#000000',
    white: '#ffffff',
    gray: '#cccccc',
    skin: '#e0ac91',
    hair: '#282323',
    cropTop: '#1e1e1e',
    skirt: '#191919'
};

// ============ REBECCA SPRITE ============
function drawRebecca(x, y, scale = 4) {
    const s = scale;
    ctx.fillStyle = colors.skin;
    ctx.fillRect(x + 6*s, y + 2*s, 4*s, 5*s);
    ctx.fillStyle = colors.hair;
    ctx.fillRect(x + 5*s, y + s, 6*s, 2*s);
    ctx.fillRect(x + 5*s, y + 3*s, s, 3*s);
    ctx.fillRect(x + 10*s, y + 3*s, s, 3*s);
    ctx.fillRect(x + 4*s, y + 5*s, 2*s, 6*s);
    ctx.fillRect(x + 10*s, y + 5*s, 2*s, 6*s);
    ctx.fillStyle = '#503020';
    ctx.fillRect(x + 7*s, y + 4*s, s, s);
    ctx.fillRect(x + 9*s, y + 4*s, s, s);
    ctx.fillStyle = colors.skin;
    ctx.fillRect(x + 7*s, y + 7*s, 2*s, s);
    ctx.fillStyle = colors.cropTop;
    ctx.fillRect(x + 6*s, y + 8*s, 4*s, 2*s);
    ctx.fillRect(x + 5*s, y + 8*s, s, 2*s);
    ctx.fillRect(x + 10*s, y + 8*s, s, 2*s);
    ctx.fillStyle = colors.skin;
    ctx.fillRect(x + 5*s, y + 10*s, s, 3*s);
    ctx.fillRect(x + 10*s, y + 10*s, s, 3*s);
    ctx.fillRect(x + 6*s, y + 10*s, 4*s, 2*s);
    ctx.fillStyle = colors.skirt;
    ctx.fillRect(x + 5*s, y + 12*s, 6*s, 4*s);
    ctx.fillStyle = colors.skin;
    ctx.fillRect(x + 6*s, y + 16*s, s, 5*s);
    ctx.fillRect(x + 8*s, y + 16*s, s, 5*s);
    ctx.fillStyle = colors.hair;
    ctx.fillRect(x + 5*s, y + 21*s, 2*s, s);
    ctx.fillRect(x + 8*s, y + 21*s, 2*s, s);
}

// ============ CORRUPTION SYSTEM ============
function getCorruptionLevel() {
    if (game.corruption >= 80) return 'possession';
    if (game.corruption >= 60) return 'contamination';
    if (game.corruption >= 35) return 'distortion';
    if (game.corruption >= 15) return 'unease';
    return 'clean';
}

function addCorruption(amount, reason) {
    game.corruption = Math.min(100, game.corruption + amount);
    console.log(`Corruption +${amount}: ${game.corruption} (${getCorruptionLevel()}) - ${reason}`);
}

// ============ TIMER SYSTEM ============
function startDayTimer() {
    game.timeRemaining = 180;
    updateTimer();
    
    if (game.timerInterval) clearInterval(game.timerInterval);
    
    game.timerInterval = setInterval(() => {
        game.timeRemaining--;
        updateTimer();
        
        if (game.timeRemaining <= 0) {
            endDay();
        }
    }, 1000);
}

function updateTimer() {
    const mins = Math.floor(game.timeRemaining / 60);
    const secs = game.timeRemaining % 60;
    document.getElementById('timer').textContent = 
        `${mins}:${secs.toString().padStart(2, '0')}`;
    
    if (game.timeRemaining <= 30) {
        document.getElementById('timer').style.color = '#f44';
    } else {
        document.getElementById('timer').style.color = '#f44';
    }
}

function endDay() {
    clearInterval(game.timerInterval);
    game.flags.nightsSurvived++;
    game.flags.monsterProximity++;
    
    addText('\n═══════════════════════════════', 'warning');
    addText('⚠ TIME EXPIRED - FORCED SLEEP ⚠', 'warning');
    addText('═══════════════════════════════\n', 'warning');
    
    triggerNightEvent();
}

// ============ NIGHT EVENTS ============
function triggerNightEvent() {
    const night = game.flags.nightsSurvived;
    const level = getCorruptionLevel();
    
    setTimeout(() => {
        addText(`\n━━━━━━━━━━ NIGHT ${night} ━━━━━━━━━━\n`, 'horror');
        
        if (night === 1) {
            nightOne(level);
        } else if (night === 2) {
            nightTwo(level);
        }
        
        setTimeout(() => {
            game.day++;
            game.currentLocation = 'guesthouse';
            drawLocation();
            startDayTimer();
            addText(`\n═══════════ DAY ${game.day} ═══════════\n`, 'important');
            addText(getLocationDesc('guesthouse'));
            addText('\nType HELP for commands.\n', 'help-text');
            updateStatus();
        }, 4000);
    }, 1000);
}

function nightOne(level) {
    if (level === 'clean' || level === 'unease') {
        addText('The guest house smells of dust and old soap.');
        addText('You try to sleep.');
        addText('\nA sound.');
        addText('Breathing that is not yours.', 'horror');
        addText('\nYou look at the window.');
        addText('Lightning flash:', 'horror');
        addText('A FACE WITHOUT EYES SMILES TOO WIDE.', 'horror');
        addText('\nYou close your eyes. Scream. Open them—');
        addText('Gone.');
        addText('\nYou spend the rest of the night awake.');
        addText('You eventually drift off...');
    } else if (level === 'distortion') {
        addText('You sleep peacefully.');
        addText('Something watches.');
        addText('It approves of your choices.');
        addCorruption(5, 'Restful corrupted sleep');
    } else {
        addText('You are home.');
        addText('You are safe.');
        addText('You belong here.');
        addCorruption(10, 'Deep corrupted sleep');
    }
}

function nightTwo(level) {
    if (level === 'clean' || level === 'unease') {
        addText('You hear something slide under your door.');
        addText('A note.');
        addText('\nYou pick it up:');
        
        if (game.flags.dogPetted) {
            addText('"You already touched us."', 'horror');
            addText('\nYour hands feel cold.');
            addCorruption(15, 'Realized the dog was possessed');
        } else if (game.flags.dogKilled) {
            addText('"Flesh opens doors."', 'clue');
            addText('"You chose correctly."');
        } else if (game.flags.dogIgnored) {
            addText('"Flesh opens doors."', 'clue');
            addText('"But you still don\'t understand."');
        }
    } else if (level === 'distortion') {
        addText('You hear lullabies from empty rooms.');
        addText('They sing you to sleep.');
    } else {
        addText('The family welcomes you.');
        addText('You are one of them now.');
    }
}

// ============ LOCATIONS ============
const locations = {
    intro: {
        name: 'Introduction',
        items: [],
        exits: {},
        draw: () => {
            ctx.fillStyle = colors.black;
            ctx.fillRect(0, 0, 800, 600);
            drawRebecca(340, 200, 5);
            ctx.fillStyle = colors.white;
            ctx.font = '24px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText('Rebecca dos-Santos', 400, 460);
            ctx.font = '16px Courier New';
            ctx.fillStyle = colors.gray;
            ctx.fillText('Investigative Journalist', 400, 490);
            ctx.fillText('Press ENTER to begin investigation', 400, 530);
        }
    },
    
    guesthouse: {
        name: 'Guest House',
        items: ['old phone'],
        exits: { outside: 'grounds', out: 'grounds' },
        desc: {
            clean: 'The guest house is small and plain. A narrow bed against the wall. A wooden desk with a locked drawer. The air smells faintly of dust and old soap.',
            unease: 'The room feels smaller than yesterday. The bed is neatly made, though you don\'t remember doing it. The desk drawer is still locked.',
            distortion: 'The room welcomes you. The bed looks comfortable. You are tired. The desk waits patiently.',
            contamination: 'The room feels safe. You don\'t need to check the window tonight. The desk belongs to you.',
            possession: 'You are home. There is no reason to leave. This has always been your room.'
        },
        draw: () => {
            ctx.fillStyle = '#0f0f0f';
            ctx.fillRect(0, 0, 800, 600);
            // Simple room
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(100, 200, 600, 300);
            drawRebecca(360, 420);
        }
    },
    
    grounds: {
        name: 'Manor Grounds',
        items: [],
        exits: { house: 'guesthouse', inside: 'guesthouse', gate: 'frontgate', north: 'frontgate', garden: 'garden', west: 'garden', shed: 'toolshed', east: 'toolshed' },
        desc: {
            clean: 'Overgrown grass reaches your knees. The mansion looms uphill, dark and silent. A rusted gate stands to the north. A garden lies west. A tool shed to the east.',
            unease: 'The grass whispers as you walk. The mansion watches. The gate feels like a threshold you shouldn\'t cross.',
            distortion: 'The path ahead is clear. The mansion wants you inside. Everything is as it should be.',
            contamination: 'Your estate. Your grounds. The mansion waits for its master.',
            possession: 'You built this place. Every stone knows your name.'
        },
        draw: () => {
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(0, 0, 800, 600);
            if (loadedImages['garden'] && loadedImages['garden'].complete) {
                ctx.globalAlpha = 0.7;
                ctx.drawImage(loadedImages['garden'], 0, 0, 800, 600);
                ctx.globalAlpha = 1.0;
            }
            drawRebecca(350, 480);
        }
    },
    
    frontgate: {
        name: 'Front Gate',
        items: ['plaque shard 1'],
        exits: { back: 'grounds', south: 'grounds' },
        desc: {
            clean: 'The rusted iron gates hang open, groaning in the wind. A broken plaque lies on the ground, shattered into pieces. The mansion looms beyond.',
            unease: 'The gates feel like a threshold. Once you pass through, something changes. The plaque fragments seem to spell something.',
            distortion: 'The gates welcome you. The plaque doesn\'t matter. Just go inside.',
            contamination: 'Your gates. Your manor. The plaque was broken by your own hands.',
            possession: 'You never left. You\'ve always been inside.'
        },
        draw: () => {
            if (loadedImages['entrance'] && loadedImages['entrance'].complete) {
                ctx.drawImage(loadedImages['entrance'], 0, 0, 800, 600);
            } else {
                ctx.fillStyle = '#050505';
                ctx.fillRect(0, 0, 800, 600);
            }
            drawRebecca(360, 480);
        }
    },
    
    garden: {
        name: 'Overgrown Garden',
        items: ['plaque shard 2'],
        exits: { back: 'grounds', east: 'grounds' },
        desc: {
            clean: 'Wild roses choke the pathways, their thorns gleaming. A dry fountain sits in the center, cracked and covered in moss.',
            unease: 'The roses seem to reach toward you. The fountain gurgles though no water flows.',
            distortion: 'Beautiful roses. They love you. The fountain wants to show you something.',
            contamination: 'Your garden. You planted every rose. The fountain knows your secrets.',
            possession: 'You died here once. It was peaceful.'
        },
        draw: () => {
            if (loadedImages['garden'] && loadedImages['garden'].complete) {
                ctx.drawImage(loadedImages['garden'], 0, 0, 800, 600);
            } else {
                ctx.fillStyle = '#0a0a0a';
                ctx.fillRect(0, 0, 800, 600);
            }
            drawRebecca(320, 480);
        }
    },
    
    toolshed: {
        name: 'Tool Shed',
        items: ['crowbar', 'batteries'],
        exits: { back: 'grounds', west: 'grounds' },
        desc: {
            clean: 'Cobwebs thick as curtains fill the cramped shed. Rusted tools line the walls. A heavy crowbar leans in the corner.',
            unease: 'The tools are arranged in a pattern. A symbol you can\'t quite identify. The crowbar gleams despite the rust.',
            distortion: 'Your tools. For your work. The crowbar will be useful.',
            contamination: 'You built this shed. You know every tool by name.',
            possession: 'The blood on the crowbar is yours. From before.'
        },
        draw: () => {
            if (loadedImages['shed'] && loadedImages['shed'].complete) {
                ctx.drawImage(loadedImages['shed'], 0, 0, 800, 600);
            } else {
                ctx.fillStyle = '#1a1010';
                ctx.fillRect(0, 0, 800, 600);
            }
            drawRebecca(360, 480);
        }
    }
};

// ============ TEXT OUTPUT ============
function addText(text, className = '') {
    const textArea = document.getElementById('textArea');
    const p = document.createElement('div');
    p.className = 'game-text ' + className;
    p.textContent = text;
    textArea.appendChild(p);
    textArea.scrollTop = textArea.scrollHeight;
}

function clearText() {
    document.getElementById('textArea').innerHTML = '';
}

function getLocationDesc(location) {
    const loc = locations[location];
    if (!loc.desc) return '';
    const level = getCorruptionLevel();
    return loc.desc[level] || loc.desc.clean;
}

// ============ STATUS UPDATE ============
function updateStatus() {
    document.getElementById('dayNumber').textContent = game.day || '-';
    document.getElementById('locationName').textContent = 
        game.currentLocation === 'intro' ? 'Start' : locations[game.currentLocation].name;
    document.getElementById('itemCount').textContent = 
        `${game.inventory.length}/${game.maxInventory}`;
    
    const rulesKnown = [game.flags.rule1Known, game.flags.rule2Known, game.flags.rule3Known]
        .filter(Boolean).length;
    document.getElementById('rulesKnown').textContent = `${rulesKnown}/3`;
}

function drawLocation() {
    if (locations[game.currentLocation] && locations[game.currentLocation].draw) {
        locations[game.currentLocation].draw();
    }
}

// ============ COMMAND PROCESSING ============
function processCommand(input) {
    if (!input || !input.trim()) return;
    
    const cmd = input.toLowerCase().trim();
    game.lastCommand = cmd;
    
    // Introduction
    if (game.currentLocation === 'intro') {
        startGame();
        return;
    }
    
    addText(`> ${input}`, 'command');
    
    const words = cmd.split(' ');
    const verb = words[0];
    const noun = words.slice(1).join(' ');
    
    // MOVEMENT
    const directions = {
        'north': 'north', 'n': 'north',
        'south': 'south', 's': 'south',
        'east': 'east', 'e': 'east',
        'west': 'west', 'w': 'west',
        'up': 'up', 'u': 'up',
        'down': 'down', 'd': 'down',
        'in': 'inside', 'inside': 'inside',
        'out': 'outside', 'outside': 'outside'
    };
    
    if (directions[verb]) {
        movePlayer(directions[verb]);
        return;
    }
    
    // GO [direction]
    if (verb === 'go' && directions[noun]) {
        movePlayer(directions[noun]);
        return;
    }
    
    // LOOK
    if (verb === 'look' || verb === 'l') {
        lookAround();
        return;
    }
    
    // EXAMINE / LOOK AT
    if ((verb === 'examine' || verb === 'x' || (verb === 'look' && words[1] === 'at')) && noun) {
        const target = verb === 'look' ? words.slice(2).join(' ') : noun;
        examineObject(target);
        return;
    }
    
    // TAKE / GET / PICK UP
    if ((verb === 'take' || verb === 'get' || verb === 'pick') && noun) {
        takeItem(noun.replace('up ', ''));
        return;
    }
    
    // USE
    if (verb === 'use' && noun) {
        useItem(noun);
        return;
    }
    
    // SAY
    if (verb === 'say' && noun) {
        sayWord(noun);
        return;
    }
    
    // TOUCH / PET
    if ((verb === 'touch' || verb === 'pet') && noun) {
        touchObject(noun);
        return;
    }
    
    // KILL
    if (verb === 'kill' && noun) {
        killTarget(noun);
        return;
    }
    
    // INVENTORY
    if (verb === 'inventory' || verb === 'i' || verb === 'inv') {
        showInventory();
        return;
    }
    
    // READ
    if (verb === 'read' && noun) {
        readItem(noun);
        return;
    }
    
    // WAIT
    if (verb === 'wait' || verb === 'z') {
        addText('Time passes...');
        return;
    }
    
    // HELP
    if (verb === 'help' || verb === 'h' || verb === '?') {
        showHelp();
        return;
    }
    
    // Unknown command
    addText('I don\'t understand that command. Type HELP for available commands.', 'error');
}

function startGame() {
    clearText();
    game.currentLocation = 'guesthouse';
    game.day = 1;
    drawLocation();
    
    addText('═══════════════════════════════════════', 'important');
    addText('THE WORD AND THE BRANCH', 'horror');
    addText('═══════════════════════════════════════', 'important');
    addText('\nYou are Rebecca dos-Santos, investigative journalist.');
    addText('\nThree months ago, the Ashwood family vanished.');
    addText('Five people. No bodies. No evidence.');
    addText('Elite family. Owns world banks. Secret parties.');
    addText('\nThe case went cold... until you received a letter:');
    addText('\n"The truth is in the cellar. Come alone. Bring light."', 'clue');
    addText('\nNow you stand in their guest house.');
    addText('\nYou have 3 MINUTES per day to investigate.');
    addText('When time expires, you SLEEP.');
    addText('You have 8 days to solve this.', 'warning');
    addText('\n═══════════════════════════════════════\n');
    
    startDayTimer();
    addText('═══════════ DAY 1 ═══════════\n', 'important');
    addText(getLocationDesc('guesthouse'));
    addText('\nType HELP for commands.\n', 'help-text');
    updateStatus();
}

function movePlayer(direction) {
    const loc = locations[game.currentLocation];
    
    if (loc.exits[direction]) {
        game.currentLocation = loc.exits[direction];
        game.visitedRooms.add(game.currentLocation);
        drawLocation();
        addText(getLocationDesc(game.currentLocation));
        updateStatus();
    } else {
        addText('You can\'t go that way.', 'error');
    }
}

function lookAround() {
    const loc = locations[game.currentLocation];
    addText(getLocationDesc(game.currentLocation));
    
    if (loc.items && loc.items.length > 0) {
        addText(`\nYou see: ${loc.items.join(', ')}`, 'clue');
    }
    
    if (loc.exits) {
        const exits = Object.keys(loc.exits).join(', ');
        addText(`\nExits: ${exits}`, 'help-text');
    }
}

function examineObject(target) {
    const loc = locations[game.currentLocation];
    
    // PLAQUE SHARDS
    if (target.includes('plaque') && game.currentLocation === 'frontgate') {
        if (!game.flags.plaque1Read) {
            addText('A broken plaque. Three pieces scattered.', 'clue');
            addText('One piece lies here. It reads:');
            addText('\n"The Cursed Spirits can only interact with"', 'important');
            addText('"the physical world through physical means."');
            addText('"They must POSSESS those of the flesh."', 'important');
            addText('\nThis is Rule I.');
            game.flags.rule1Known = true;
            game.flags.plaque1Read = true;
            updateStatus();
        } else {
            addText('The first rule: Spirits possess flesh.');
        }
    }
    else if (target.includes('plaque') && game.currentLocation === 'garden') {
        addText('Another piece of the plaque:');
        addText('\n"Carry around the WORD at all times."', 'important');
        addText('\nThis is Rule II.');
        addText('But what is the Word?', 'clue');
        game.flags.rule2Known = true;
        updateStatus();
    }
    // DESK
    else if (target.includes('desk') && game.currentLocation === 'guesthouse') {
        if (!game.flags.deskOpened) {
            addText('A wooden desk with a locked drawer.');
            addText('Scratched from the inside.', 'horror');
            addText('You need something to pry it open.');
        } else {
            addText('The desk drawer hangs open.');
            if (loc.items.includes('old phone')) {
                addText('An old phone sits inside.');
            }
        }
    }
    // PHONE
    else if (target.includes('phone') && game.inventory.includes('old phone')) {
        if (!game.flags.phoneOn) {
            addText('An old Nokia phone. Dead battery.');
            if (game.inventory.includes('batteries')) {
                addText('But you have batteries...');
            }
        } else {
            addText('The phone is on. No signal.');
            addText('One message in the inbox:', 'clue');
            addText('"They use the children. The Sign marks them."');
        }
    }
    // DOG (Day 2)
    else if (target.includes('dog') && game.currentLocation === 'grounds' && game.day === 2 && game.flags.dogAlive) {
        addText('A dog sits perfectly still.', 'horror');
        addText('Staring at you.');
        addText('Its eyes don\'t blink.');
        addText('Its collar has something engraved on it.');
        addText('You can\'t quite read it from here.');
        
        const level = getCorruptionLevel();
        if (level === 'distortion' || level === 'contamination' || level === 'possession') {
            addText('\nIt looks friendly. You should pet it.', 'corruption-high');
        } else {
            addText('\nSomething feels wrong.', 'clue');
        }
    }
    // CROWBAR
    else if (target.includes('crowbar') && game.inventory.includes('crowbar')) {
        addText('A heavy iron crowbar. Useful for prying things open.');
        addText('Or as a weapon.');
    }
    // BATTERIES
    else if (target.includes('batteries') && game.inventory.includes('batteries')) {
        addText('AA batteries. Still have charge.');
    }
    else {
        addText('You don\'t see anything special about that.');
    }
}

function takeItem(itemName) {
    const loc = locations[game.currentLocation];
    
    if (game.inventory.length >= game.maxInventory) {
        addText('You can only carry 3 items. DROP something first.', 'error');
        return;
    }
    
    const item = loc.items?.find(i => i.toLowerCase().includes(itemName));
    
    if (item) {
        loc.items = loc.items.filter(i => i !== item);
        game.inventory.push(item);
        addText(`You take the ${item}.`, 'success');
        updateStatus();
        drawLocation();
    } else {
        addText(`There is no ${itemName} here.`, 'error');
    }
}

function useItem(itemName) {
    if (!game.inventory.some(i => i.toLowerCase().includes(itemName))) {
        addText('You don\'t have that.', 'error');
        return;
    }
    
    // USE CROWBAR ON DESK
    if (itemName.includes('crowbar') && game.currentLocation === 'guesthouse' && !game.flags.deskOpened) {
        addText('You force the desk drawer open with the crowbar.');
        addText('Inside: an old phone.');
        locations.guesthouse.items.push('old phone');
        game.flags.deskOpened = true;
    }
    // USE BATTERIES ON PHONE
    else if (itemName.includes('batteries') && game.inventory.includes('old phone')) {
        addText('You install the batteries in the phone.');
        addText('It powers on.', 'success');
        game.flags.batteriesInstalled = true;
        game.flags.phoneOn = true;
        game.inventory = game.inventory.filter(i => i !== 'batteries');
        addText('\nOne message:', 'clue');
        addText('"They use the children. The Sign marks them."');
    }
    // USE CROWBAR ON DOG (Day 2)
    else if (itemName.includes('crowbar') && game.day === 2 && game.currentLocation === 'grounds' && game.flags.dogAlive) {
        addText('You raise the crowbar.', 'horror');
        addText('The dog doesn\'t move.');
        addText('\nYou bring it down.');
        addText('\nThe sound is wet.');
        addText('The fur was cold. Too cold.', 'horror');
        addText('\nThe collar remains.');
        addText('Engraved: A symbol. THE SIGN.');
        addText('The same symbol will appear again.', 'clue');
        game.flags.dogKilled = true;
        game.flags.dogAlive = false;
        addText('\nYou feel sick. But you understand now:', 'success');
        addText('The dog was possessed. Rule I confirmed.');
    }
    else {
        addText('You can\'t use that here.');
    }
}

function sayWord(word) {
    word = word.toLowerCase().trim();
    
    if (word === THE_WORD) {
        addText('You speak the Word.', 'success');
        addText('The air tightens.');
        addText('Something recoils.', 'important');
        game.flags.wordSpokenBefore = true;
    } else {
        addText('Nothing happens.');
    }
}

function touchObject(target) {
    // TOUCH DOG (Critical decision)
    if (target.includes('dog') && game.day === 2 && game.currentLocation === 'grounds' && game.flags.dogAlive) {
        if (game.flags.wordSpokenBefore && game.lastCommand.includes(THE_WORD)) {
            addText('You spoke the Word first.');
            addText('The dog SNARLS and backs away.', 'success');
            addText('Its form wavers. You see through it.');
            addText('A possessed vessel. You were protected.');
            game.flags.dogIgnored = true;
            game.flags.dogAlive = false;
        } else {
            addText('You reach out to pet the dog.', 'horror');
            addText('Its fur is COLD.');
            addText('Too cold.');
            addText('\nSomething enters you.', 'horror');
            addText('Through your hand.');
            addText('Up your arm.');
            addText('Into your chest.');
            addText('\nYou\'ve been POSSESSED.', 'horror');
            addCorruption(40, 'Touched possessed dog without Word');
            game.flags.dogPetted = true;
            game.flags.dogAlive = false;
        }
    } else {
        addText('Better not touch that without protection.');
    }
}

function killTarget(target) {
    if (target.includes('dog') && game.day === 2 && game.currentLocation === 'grounds' && game.flags.dogAlive) {
        if (game.inventory.includes('crowbar')) {
            useItem('crowbar');
        } else {
            addText('You need a weapon.', 'error');
        }
    } else {
        addText('Violence isn\'t the answer here.');
    }
}

function showInventory() {
    if (game.inventory.length === 0) {
        addText('You aren\'t carrying anything.');
    } else {
        addText(`Carrying (${game.inventory.length}/3):`, 'important');
        game.inventory.forEach(item => addText(`  - ${item}`));
    }
}

function readItem(itemName) {
    examineObject(itemName);
}

function showHelp() {
    addText('\n═══ COMMANDS ═══', 'important');
    addText('Movement: GO [direction], NORTH/N, SOUTH/S, EAST/E, WEST/W');
    addText('Actions: LOOK/L, EXAMINE [thing], TAKE [item], USE [item]');
    addText('Special: SAY [word], TOUCH [thing], KILL [target]');
    addText('Other: INVENTORY/I, READ [item], WAIT, HELP');
    addText('\n═══ OBJECTIVE ═══', 'important');
    addText('Investigate the Ashwood estate.');
    addText('Discover the 3 Rules.');
    addText('Find the Word.');
    addText('Survive 8 days.');
    addText('Uncover what happened to the children.', 'clue');
}

// ============ DAY 2 DOG ENCOUNTER ============
function triggerDogEncounter() {
    if (game.day === 2 && game.currentLocation === 'grounds' && game.flags.dogAlive && !game.flags.dogEncounterTriggered) {
        game.flags.dogEncounterTriggered = true;
        
        setTimeout(() => {
            addText('\n━━━━━━━━━━━━━━━━━━━━━━━━━━', 'warning');
            addText('You hear something behind you.', 'horror');
            addText('━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'warning');
            addText('You turn around.');
            addText('\nA dog.');
            addText('Sitting. Staring.');
            addText('Perfectly still.', 'horror');
            addText('\nType EXAMINE DOG to investigate.');
            addText('Type TOUCH DOG or PET DOG to interact.');
            addText('Type KILL DOG or USE CROWBAR if you have it.');
            addText('\nChoose carefully. This is a test.', 'clue');
        }, 2000);
    }
}

// Check for dog encounter when entering grounds on Day 2
const originalMove = movePlayer;
movePlayer = function(direction) {
    originalMove(direction);
    if (game.day === 2 && game.currentLocation === 'grounds') {
        triggerDogEncounter();
    }
};

// ============ INPUT HANDLER ============
document.getElementById('commandInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const input = e.target.value;
        if (input.trim()) {
            processCommand(input);
            e.target.value = '';
        }
    }
});

// ============ INITIALIZE ============
function initGame() {
    drawLocation();
    addText('Press ENTER to begin investigation...', 'help-text');
    updateStatus();
}

initGame();
