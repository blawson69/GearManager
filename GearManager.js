/*
GearManager
Enables easy adding of select Adventuring Gear and Wondrous Items to the 5e Shaped sheet to more appropriate sections for easier use and access.

On Github:	https://github.com/blawson69
Contact me: https://app.roll20.net/users/1781274/ben-l

Like this script? Buy me a coffee:
    https://venmo.com/theRealBenLawson
    https://paypal.me/theRealBenLawson
*/

var GearManager = GearManager || (function () {
    'use strict';

    //---- INFO ----//

    var version = '0.5',
        debugMode = false,
        styles = {
            button: 'background-color: #000; border-width: 0px; border-radius: 5px; padding: 5px 8px; color: #fff; text-align: center;',
            buttonWrapper: 'text-align: center; margin: 14px 0 12px 0; clear: both;',
            textButton: 'background-color: transparent; border: none; padding: 0; color: #591209; text-decoration: underline;',
            title: 'padding: 0 0 10px 0; color: ##591209; font-size: 1.5em; font-weight: bold; font-variant: small-caps; font-family: "Times New Roman",Times,serif;',
            subtitle: 'margin-top: -4px; padding-bottom: 4px; color: #666; font-size: 1.125em; font-variant: small-caps;',
            code: 'font-family: "Courier New", Courier, monospace; background-color: #ddd; color: #000; padding: 2px 4px;',
            infoLink: 'text-decoration: none; font-family: Webdings;',
            popup: 'cursor: help; font-size: 0.75em;'
        },

    checkInstall = function () {
        if (!_.has(state, 'GearManager')) state['GearManager'] = state['GearManager'] || {};
        if (typeof state['GearManager'].core_items == 'undefined') state['GearManager'].core_items = setCoreItems();
        if (typeof state['GearManager'].custom_items == 'undefined') state['GearManager'].custom_items = [];
        log('--> GearManager v' + version + ' <-- Initialized');
        if (debugMode) {
            var d = new Date();
            showDialog('Debug Mode', 'GearManager v' + version + ' loaded at ' + d.toLocaleTimeString());
            state['GearManager'].core_items = setCoreItems();
        }
    },

    //----- INPUT HANDLER -----//

    handleInput = function (msg) {
        if (msg.type == 'api' && msg.content.startsWith('!gm')) {
			var parms = msg.content.split(/\s+/i);
			if (parms[1] && playerIsGM(msg.playerid)) {
				switch (parms[1]) {
					case '--add':
						commandAdd(msg);
						break;
                    case '--list':
                        commandList();
                        break;
                    case '--view':
						commandView(msg);
						break;
                    case '--import':
						commandImport(msg);
						break;
                    case '--help':
                    default:
                        commandHelp();
                        break;
				}
			} else commandHelp();
		}
    },

    commandHelp = function() {
        var message = '';
        message += 'Use the button to list all gear. Click the name of an item to add it to all selected character(s). '
        + '<br><br>Click the <span style="font-family: Webdings;">i</span> see a description of the item. This will <i>not</i> add the item to any characters.'
        + '<div style="' + styles.buttonWrapper + '"><a style="' + styles.button + '" href="!gm --list">Show Gear</a></div>';
        message += '<hr>Import your custom items from GearManager handouts. These will be added to the core items.'
        + '<div style="' + styles.buttonWrapper + '"><a style="' + styles.button + '" href="!gm --import">Import</a></div>';
        message += '<br>See the <a style="' + styles.textButton + '" href="https://github.com/blawson69/GearManager">documentation</a> for complete instructions.<br>';
        showDialog('Help', message);
    },

    commandList = function() {
        // List all gear with "add" and "view" links
        var uses, list = '';
        var ag_items = getGear('Adventuring Gear');
        var wi_items = getGear('Wondrous Items');

        list += '<div style=\'' + styles.title + '\'>Adventuring Gear</div><table>';
        _.each(ag_items, function(item) {
            uses = (item.uses && typeof item.uses === 'string') ? ' &#63;&#123;Uses (' + item.uses + ')&#124;[[' + item.uses + ']]&#125;' : '';
            list += '<tr><td style="width: 100%"><a href="!gm --add ' + item.name + uses + '" title="Add to Selected Character(s)">' + item.name + '</a>';
            if (item.section == 'offense') list += ' <span style="' + styles.popup + '" title="Added to Offense">⚔️</span>';
            list += '</td><td><a style=\'' + styles.infoLink + '\' href="!gm --view ' + item.name + '" title="View ' + item.name + '">i</a></td></tr>';
        });
        list += '</table><hr>';

        list += '<div style=\'' + styles.title + '\'>Wondrous Items</div><table>';
        _.each(wi_items, function(item) {
            uses = (item.uses && typeof item.uses === 'string') ? ' &#124;&#63;&#123;Uses (' + item.uses + ')&#124;' + rollDice(item.uses) + '&#125;' : '';
            list += '<tr><td style="width: 100%"><a href="!gm --add ' + item.name + uses + '" title="Add to Selected Character(s)">' + item.name + '</a>';
            list += '</td><td><a style=\'' + styles.infoLink + '\' href="!gm --view ' + item.name + '" title="View ' + item.name + '">i</a></td></tr>';
        });
        list += '</table>';

        showDialog('', list);
    },

    commandView = function(msg) {
        // Displays the item's name and description in chat
        var name = msg.content.substr(10).trim();
        var item = _.findWhere(getGear(), {name: name});
        if (item) {
            var category = '<div style="' + styles.subtitle + '">' + ((item.category == "Adventuring Gear") ? item.category : "Wondrous Item") + '</div>';
            var button = '<div style="' + styles.buttonWrapper + '"><a style="' + styles.button + '" href="!gm --list">&#9668; Back to List</a></div>';
            showDialog(item.name, category + item.content.replace(/\n/g, '<br>').replace(/\[{2}([^\]]*)\]{2}/g, '<span style=\'color: #c00;\'>$1</span>') + button);
        } else {
            showDialog('Error', name + ' is not a valid item.');
        }
    },

    commandAdd = function(msg) {
        // Add a item to selected character(s)
		if (!msg.selected || !msg.selected.length) {
			showDialog('Error', 'No tokens are selected!');
			return;
		}

        // Verify that a valid item name was given
        var button = '<div style="' + styles.buttonWrapper + '"><a style="' + styles.button + '" href="!gm --list">&#9668; Back to List</a></div>';
        var tmpName = msg.content.substr(9).trim().split('|')[0].trim();
        var item = _.find(getGear(), function (x) { return x.name == tmpName; });
        if (item) {
            var newItem, rolled_use, charNames = [], joiner = ' ', roll_formula = '';
            var categories = {"Adventuring Gear": "ADVENTURING_GEAR", "Wondrous Items": "WONDROUS"};
            if (item.section == 'utility') {
                newItem = {
                    name: item.name,
                    type: categories[item.category],
                    recharge: (item.recharge) ? item.recharge : 'MANUAL',
                    content: item.content,
                    content_toggle: '1',
                    roll_formula: '{{uses=@{uses}}} {{per_use=@{per_use}}} {{repeating_item=repeating_utility_ROW_ID}} {{recharge=@{recharge}}} {{content=@{content}}}',
                    toggle_details: 0,
                    weight_system: 'POUNDS',
                    weight: (item.weight) ? item.weight : 1,
                    weight_total: (item.weight) ? item.weight : 1,
                    weight_per_use: '1',
                    uses: (item.uses) ? item.uses : 1,
                    per_use: 1
                };

                if (item.saving_throw_dc) {
                    newItem.saving_throw_toggle = '1';
                    newItem.saving_throw_dc = item.saving_throw_dc;
                    newItem.saving_throw_vs_ability = item.saving_throw_vs_ability;
                    newItem.roll_formula += ' {{saving_throw_vs_ability=' + item.saving_throw_vs_ability + '}} {{saving_throw_dc=' + item.saving_throw_dc + '}}';
                }

                if (item.heal_dice) {
                    newItem.heal_toggle = '1',
                    newItem.heal_die = item.heal_die,
                    newItem.heal_dice = item.heal_dice,
                    newItem.heal_bonus = item.heal_bonus,
                    newItem.roll_formula += ' {{heal=[[' + item.heal_dice + item.heal_die + '[heal] + ' + item.heal_bonus + '[bonus]]]}}';
                }
            } else {
                // item.section = 'offense'
                newItem = {
                    name: item.name,
                    content: item.content,
                    content_toggle: '1',
                    type: 'RANGED_WEAPON',
                    attack_toggle: 1,
                    attack_type: 'RANGED_WEAPON_ATTACK',
                    attack_ability: 'DEX',
                    proficiency: 0,
                    attack_damage_ability: 0,
                    crit_range: 21,
                    attack_damage_dice: item.attack_damage_dice,
                    attack_damage_die: item.attack_damage_die,
                    attack_damage_type: item.attack_damage_type,
                    range: item.range,
                    toggle_details: 0,
                    roll_formula: '{{uses=@{uses}}} {{per_use=@{per_use}}} {{repeating_item=repeating_offense_ROW_ID}} {{recharge=@{recharge}}} {{attack_type_macro=[Ranged Weapon Attack:](~repeating_offense_attack)}} {{has_attack_damage=1}} {{attack_damage_crit=[[' + item.attack_damage_dice + item.attack_damage_die + ']]}} {{attack_damage=[[' + item.attack_damage_dice + item.attack_damage_die + '[damage]]]}} {{attack_damage_type=' + item.attack_damage_type + '}} {{has_attack_damage=1}} {{attack_damage_macro=[Hit:](~repeating_offense_attack_damage)}} {{attack_damage_crit_macro=[Crit:](~repeating_offense_attack_damage_crit)}} {{attack1=[[@{shaped_d20}@{d20_mod}cs>@{crit_range}]]}} {{range=' + item.range + '}}',

                    attack_damage_formula: '{{has_attack_damage=1}} {{attack_damage_crit=[[' + item.attack_damage_dice + item.attack_damage_die + ']]}} {{attack_damage=[[' + item.attack_damage_dice + item.attack_damage_die + '[damage]]]}} {{attack_damage_type=' + item.attack_damage_type + '}}',

                    attack_formula: '{{attack1=[[@{shaped_d20}@{d20_mod}cs>@{crit_range} + ]]}} {{range=' + item.range + '}}',

                    attack_string: '@{dexterity_check_mod_with_sign} to hit, range ' + item.range + ', one target.',
                    attack_damage_average: item.attack_damage_average,
                    attack_damage_string: item.attack_damage_average + ' (' + item.attack_damage_dice + item.attack_damage_die + ') ' + item.attack_damage_type + ' damage.',
                    weight_system: 'POUNDS',
                    weight: (item.weight) ? item.weight : 1,
                    weight_total: (item.weight) ? item.weight : 1,
                    weight_per_use: '1',
                    recharge: 'MANUAL',
                    uses: (item.uses) ? item.uses : 1,
                    per_use: 1
                };
            }

            rolled_use =  msg.content.replace('!gm --add ' + item.name, '').replace(' |', '').trim();
            if (rolled_use.length > 0) newItem.uses = parseInt(rolled_use);

            _.each(msg.selected, function(obj) {
                var token = getObj(obj._type, obj._id);
                if (token && token.get('represents') !== '') {
                    var char_id = token.get('represents');
                    var character = getObj('character', char_id);
                    if (character) {
                        var currItemID = findItem(char_id, item.name, item.section);
                        if (currItemID && item.category == "Adventuring Gear") {
                            var tmp_uses = findObjs({ type: 'attribute', characterid: char_id, name: 'repeating_' + item.section + '_' + currItemID + '_uses' })[0];
                            var tmp_total = findObjs({ type: 'attribute', characterid: char_id, name: 'repeating_' + item.section + '_' + currItemID + '_weight_total' })[0];
                            var uses_count = (tmp_uses) ? parseInt(tmp_uses.get('current')) + 1 : 1;
                            var weight = (tmp_total.get('current') == '' || tmp_total.get('current') == '0') ? uses_count * item.weight : item.weight;
                            if (tmp_uses) tmp_uses.setWithWorker('current', uses_count);
                            if (tmp_total) tmp_total.setWithWorker('current', weight);
                            charNames.push(character.get('name'));
                        }
                        if (!currItemID) {
                            if (typeof newItem.proficiency != 'undefined') newItem.proficiency = checkProficiency(char_id) ? 'on' : 0;
                            const data = {};
                            var RowID = generateRowID();
                            var repString = 'repeating_' + item.section + '_' + RowID;
                            var tmpItem = newItem;
                            tmpItem.roll_formula = tmpItem.roll_formula.replace('ROW_ID', RowID);
                            Object.keys(tmpItem).forEach(function (field) {
                                data[repString + '_' + field] = tmpItem[field];
                            });
                            setAttrs(char_id, data);
                            charNames.push(character.get('name'));
                        }

                    }
                }
            });

            if (charNames.length > 0) {
                if (charNames.length > 1) charNames[charNames.length-1] = 'and ' + charNames[charNames.length-1];
                if (charNames.length > 2) joiner = ', ';
                showDialog('Gear Added', item.name + ' was given to ' + charNames.join(joiner) + '.' + button);
            } else {
                showDialog('Gear Not Added', 'The selected characters already possess "' + item.name + '." Nothing was added.' + button);
            }
        } else {
            showDialog('Gear Not Added', 'The item "' + tmpName + '" does not exist! Try adding from the list this time.' + button);
        }
    },

    commandImport = function () {
        var err = {probs: [], handouts: [], count: 0}, good = {handouts: [], count: 0},
        abilities = ['STRENGTH', 'DEXTERITY', 'CONSTITUTION', 'INTELLIGENCE', 'WISDOM', 'CHARISMA'];

        showDialog('Import', 'Beginning import. Please wait...');

        var oHandout = findObjs({name: 'GearManager: Offense', type: 'handout'})[0];
        if (oHandout) {
            oHandout.get('notes', function (notes) {
                // Name|Description|# of Dice|Die|Damage Type|Range|Average
                var tmpItems = [], items = processNotes(notes);
                _.each(items, function (item) {
                    var item = item.trim().split(/\s*\|\s*/);
                    if (_.size(item) == 7) {
                        var newitem = {name: item[0], content: item[1], section: 'offense', category: "Adventuring Gear"};
                        if (!isNaN(item[2]) && item[2] != '') newitem.attack_damage_dice = parseInt(item[2]);
                        if (item[3] != '') newitem.attack_damage_die = item[3];
                        if (item[4] != '') newitem.attack_damage_type = item[4];
                        if (item[5] != '') newitem.range = item[5];
                        if (!isNaN(item[6]) && item[6] != '') newitem.attack_damage_average = parseInt(item[6]);
                        if (_.size(newitem) == 9) {
                            tmpItems.push(newitem);
                            good.handouts.push('GearManager: Offense');
                            good.count++;
                        } else {
                            err.probs.push('One or more item properties were empty or incorrectly formatted.');
                            err.handouts.push('GearManager: Offense');
                            err.count++;
                        }
                    } else {
                        err.probs.push('One or more items did not contain all required properties.');
                        err.handouts.push('GearManager: Offense');
                        err.count++;
                    }
                });

                state['GearManager'].custom_items = _.reject(state['GearManager'].custom_items, function (x) { return x.section == 'offense' && x.category == 'Adventuring Gear'; });
                _.each(tmpItems, function (item) { state['GearManager'].custom_items.push(item); });
            });
        }

        var uHandout = findObjs({name: 'GearManager: Utility', type: 'handout'})[0];
        if (uHandout) {
            uHandout.get('notes', function (notes) {
                var tmpItems = [], items = processNotes(notes);
                _.each(items, function (item) {
                    var item = item.trim().split(/\s*\|\s*/);
                    if (_.size(item) == 4 || _.size(item) == 6) {
                        var newitem = {name: item[0], content: item[1], section: 'utility', category: "Adventuring Gear"};
                        if (!isNaN(item[2]) && item[2] != '') newitem.uses = parseInt(item[2]);
                        if (!isNaN(item[3]) && item[3] != '') newitem.weight = parseInt(item[3]);
                        if (_.size(item) == 6) {
                            if (!isNaN(item[4]) && item[4] != '') newitem.saving_throw_dc = parseInt(item[4]);
                            if (_.find(abilities, function (x) { return item[5].toUpperCase() == x; })) newitem.saving_throw_vs_ability = item[5].toUpperCase();
                        }

                        if (_.size(newitem) == 6 || _.size(newitem) == 8) {
                            tmpItems.push(newitem);
                            good.handouts.push('GearManager: Utility');
                            good.count++;
                        } else {
                            err.probs.push('One or more item properties were empty or incorrectly formatted.');
                            err.handouts.push('GearManager: Utility');
                            err.count++;
                        }
                    } else {
                        err.probs.push('One or more items did not contain the correct number of properties.');
                        err.handouts.push('GearManager: Utility');
                        err.count++;
                    }
                });

                state['GearManager'].custom_items = _.reject(state['GearManager'].custom_items, function (x) { return x.section == 'utility' && x.category == 'Adventuring Gear'; });
                _.each(tmpItems, function (item) { state['GearManager'].custom_items.push(item); });
            });
        }

        var wHandout = findObjs({name: 'GearManager: Wondrous', type: 'handout'})[0];
        if (wHandout) {
            wHandout.get('notes', function (notes) {
                var tmpItems = [], items = processNotes(notes);
                _.each(items, function (item) {
                    var item = item.trim().split(/\s*\|\s*/);
                    if (_.size(item) == 5 || _.size(item) == 7 || _.size(item) == 8 || _.size(item) == 10) {
                        var newitem = {name: item[0], content: item[1], section: 'utility', category: "Wondrous Items", recharge: 'MANUAL'};
                        if (!isNaN(item[2]) && item[2] != '') newitem.uses = (item[2].search(/d/i) == -1) ? parseInt(item[2]) : item[2];
                        if (!isNaN(item[3]) && item[3] != '') newitem.weight = parseInt(item[3]);
                        if (item[4].search(/turn/i) != -1) newitem.recharge = 'TURN';
                        if (item[4].search(/short/i) == -1 && item[4].search(/long/i) != -1) newitem.recharge = 'LONG_REST';
                        if (item[4].search(/short/i) != -1 && item[4].search(/long/i) != -1) newitem.recharge = 'SHORT_OR_LONG_REST';
                        if (item[4].search(/[\D]*[2-5]{1}[\-\_]{1}6$/i) != -1) newitem.recharge = item[4].replace(/[\D]*([2-5]{1})[\-\_]{1}6$/i, 'RECHARGE_$1_6');
                        if (item[4].search(/^[\D]*6$/i) != -1) newitem.recharge = 'RECHARGE_6';
                        if (_.size(item) == 7) {
                            if (!isNaN(item[5]) && item[5] != '') newitem.saving_throw_dc = parseInt(item[5]);
                            if (_.find(abilities, function (x) { return item[6].toUpperCase() == x; })) newitem.saving_throw_vs_ability = item[6].toUpperCase();
                        }
                        if (_.size(item) == 8) {
                            if (!isNaN(item[5]) && item[5] != '') newitem.heal_die = parseInt(item[5]);
                            if (item[6] != '') newitem.heal_dice = item[6];
                            if (!isNaN(item[7]) && item[7] != '') newitem.heal_bonus = parseInt(item[7]);
                        }
                        if (_.size(item) == 10) {
                            if (!isNaN(item[5]) && item[5] != '') newitem.saving_throw_dc = parseInt(item[5]);
                            if (_.find(abilities, function (x) { return item[6].toUpperCase() == x; })) newitem.saving_throw_vs_ability = item[6].toUpperCase();
                            if (!isNaN(item[7]) && item[7] != '') newitem.heal_die = parseInt(item[7]);
                            if (item[8] != '') newitem.heal_dice = item[8];
                            if (!isNaN(item[9]) && item[9] != '') newitem.heal_bonus = parseInt(item[9]);
                        }

                        if (_.size(newitem) == 7 || _.size(newitem) == 9 || _.size(newitem) == 10 || _.size(newitem) == 12) {
                            tmpItems.push(newitem);
                            good.handouts.push('GearManager: Wondrous');
                            good.count++;
                        } else {
                            err.probs.push('One or more item properties were empty or incorrectly formatted.');
                            err.handouts.push('GearManager: Wondrous');
                            err.count++;
                        }
                    } else {
                        err.probs.push('One or more items did not contain the correct number of properties.');
                        err.handouts.push('GearManager: Wondrous');
                        err.count++;
                    }
                });

                state['GearManager'].custom_items = _.reject(state['GearManager'].custom_items, function (x) { return x.section == 'utility' && x.category == 'Wondrous Items'; });
                _.each(tmpItems, function (item) { state['GearManager'].custom_items.push(item); });
            });
        }

        _.delay(function () {
            var title = 'Import Results', message = '';
            if (err.count > 0) {
                err.probs = _.unique(err.probs);
                err.handouts = _.unique(err.handouts);
                message += '<span style="color: #c00;">' + err.count + ' errors</span> were encountered during import:<ul><li>' + err.probs.join('</li><li>') + '</li></ul>';
                message += 'These errors occured for the following handouts:<ul><li>' + err.handouts.join('</li><li>') + '</li></ul>';
                message += 'See the <a style="' + styles.textButton + '" href="https://github.com/blawson69/GearManager">documentation</a> for proper formatting.';
            }
            if (good.count > 0) {
                good.handouts = _.unique(good.handouts);
                if (err.count > 0) message += '<hr>';
                message += '<span style="color: #0a0;">' + good.count + ' items</span> have been <i>successfully imported</i> from the following handouts:<ul><li>' + good.handouts.join('</li><li>') + '</li></ul>';
            }
            message += '<div style="' + styles.buttonWrapper + '"><a style="' + styles.button + '" href="!gm --list">View List</a></div>';
            showDialog(title, message);
        }, 1000);
    },

    processNotes = function (notes) {
        var retval, text = notes.trim();
        text = text.replace(/<p[^>]*>/gi, '<p>').replace(/<br>/gi, '\n').replace(/<\/?(span|div|pre|img|code|b|i)[^>]*>/gi, '');
        if (text != '' && /<p>[^<]*<\/p>/g.test(text)) retval = text.match(/<p>[^<]*<\/p>/g).map( l => l.replace(/^<p>([^<]*)<\/p>$/,'$1'));
        return retval;
    },

    findItem = function(char_id, item_name, section) {
        var row_id, re = new RegExp('^.*_' + section + '_.*_name$', 'i');
        var items = _.filter(findObjs({type: 'attribute', characterid: char_id}, {caseInsensitive: true}), function (x) { return x.get('name').match(re) !== null; });
        var item = _.find(items, function (i) { return (i.get('current').replace(/\W/, '') == item_name.replace(/\W/, '')); });
        if (item) row_id = item.get('name').split('_')[2];
        return row_id;
    },

    checkProficiency = function (char_id) {
        var prof = false, re = new RegExp('^repeating_feat_.*_content$', 'i');
        var feats = _.filter(findObjs({type: 'attribute', characterid: char_id}, {caseInsensitive: true}), function (x) { return x.get('name').match(re) !== null; });
        var feat = _.find(feats, function (i) { return (i.get('current').search(/Improvised\sWeapons/i) > -1); });
        if (feat) prof = true;
        return prof;
    },

    rollDice = function (expr) {
        expr = expr.replace(/\s+/, '');
        var dice = parseInt(expr.split('d')[0]);
        var die = parseInt(expr.split('d')[1].split('+')[0]);
        var bonus = (expr.match(/\+/g) !== null) ? parseInt(expr.split('+')[1]) : 0;
        var result = bonus;
        for (var x = 0; x < dice; x++) {
            result += randomInteger(die);
        }
        return result;
    },

    getGear = function (type = '') {
        var gear;
        switch (type.toLowerCase()) {
            case 'adventuring gear':
                gear = _.filter(state['GearManager'].core_items, function (x) { return x.category == 'Adventuring Gear'; });
                _.each(state['GearManager'].custom_items, function (x) { if (x.category == 'Adventuring Gear') gear.push(x); });
                break;
            case 'wondrous items':
                gear = _.filter(state['GearManager'].core_items, function (x) { return x.category == 'Wondrous Items'; });
                _.each(state['GearManager'].custom_items, function (x) { if (x.category == 'Wondrous Items') gear.push(x); });
                break;
            case 'utility':
                gear = _.filter(state['GearManager'].core_items, function (x) { return x.section == 'utility'; });
                _.each(state['GearManager'].custom_items, function (x) { if (x.section == 'utility') gear.push(x); });
                break;
            case 'offense':
                gear = _.filter(state['GearManager'].core_items, function (x) { return x.section == 'offense'; });
                _.each(state['GearManager'].custom_items, function (x) { if (x.section == 'offense') gear.push(x); });
                break;
            case 'core':
                gear = state['GearManager'].core_items;
                break;
            case 'custom':
                gear = state['GearManager'].custom_items;
                break;
            default:
                gear = _.clone(state['GearManager'].core_items);
                _.each(state['GearManager'].custom_items, function (x) { gear.push(x); });
        }
        gear = _.sortBy(gear, 'name');
        return gear;
    },

    setCoreItems = function () {
        return [
            {name: "Acid", section: "offense", category: "Adventuring Gear", content: "As an action, you can splash the contents of this vial onto a creature within 5 feet of you or throw the vial up to 20 feet, shattering it on impact. In either case, make a ranged Attack against a creature or object, treating the acid as an Improvised Weapon. On a hit, the target takes 2d6 acid damage.", attack_damage_dice: 2, attack_damage_die: "d6", attack_damage_type: "acid", range: "20/60 ft.", attack_damage_average: 7},
            {name: "Alchemist's Fire", section: "offense", category: "Adventuring Gear", content: "This sticky, adhesive fluid ignites when exposed to air. As an action, you can throw this flask up to 20 feet, shattering it on impact. Make a ranged Attack against a creature or object, treating the alchemist's fire as an Improvised Weapon. On a hit, the target takes 1d4 fire damage at the start of each of its turns. A creature can end this damage by using its action to make a DC 10 Dexterity check to extinguish the flames.", attack_damage_dice: 1, attack_damage_die: "d4", attack_damage_type: "fire", range: "20/60 ft.", attack_damage_average: 2},
            {name: "Antitoxin", section: "utility", category: "Adventuring Gear", content: "A creature that drinks this vial of liquid gains advantage on Saving Throws against poison for 1 hour. It confers no benefit to Undead or constructs.", weight: 0},
            {name: "Ball Bearings", section: "utility", category: "Adventuring Gear", content: "As an action, you can spill these tiny metal balls from their pouch to cover a level, square area that is 10 feet on a side. A creature moving across the covered area must succeed on a DC 10 Dexterity saving throw or fall prone. A creature moving through the area at half speed doesn’t need to make the save.", weight: 2},
            {name: "Poison", section: "utility", category: "Adventuring Gear", content: "You can use the poison in this vial to coat one slashing or piercing weapon or up to three pieces of Ammunition. Applying the poison takes an action. A creature hit by the Poisoned weapon or Ammunition must make a DC 10 Constitution saving throw or take 1d4 poison damage. Once applied, the poison retains potency for 1 minute before drying.", weight: 0},
            {name: "Caltrops", section: "utility", category: "Adventuring Gear", content: "As an action, you can spread a single bag of caltrops to cover a 5-foot-square area. Any creature that enters the area must succeed on a DC 15 Dexterity saving throw or stop moving and take 1 piercing damage. Until the creature regains at least 1 hit point, its walking speed is reduced by 10 feet. A creature moving through the area at half speed doesn't need to make the saving throw.", weight: 2},
            {name: "Healer's Kit", section: "utility", category: "Adventuring Gear", content: "This kit is a leather pouch containing bandages, salves, and splints. The kit has ten uses. As an action, you can expend one use of the kit to stabilize a creature that has 0 Hit Points, without needing to make a Wisdom (Medicine) check.", uses: 10, weight: 3},
            {name: "Holy Water", section: "offense", category: "Adventuring Gear", content: "As an action, you can splash the contents of this flask onto a creature within 5 feet of you or throw it up to 20 feet, shattering it on impact. In either case, make a ranged Attack against a target creature, treating the holy water as an Improvised Weapon. If the target is a fiend or Undead, it takes 2d6 radiant damage. A Cleric or Paladin may create holy water by performing a Special ritual. The ritual takes 1 hour to perform, uses 25 gp worth of powdered silver, and requires the caster to expend a 1st-level spell slot.", attack_damage_dice: 2, attack_damage_die: "d6", attack_damage_type: "radiant", range: "20/60 ft.", attack_damage_average: 7},
            {name: "Oil", section: "offense", category: "Adventuring Gear", content: "Oil usually comes in a clay flask that holds 1 pint. As an action, you can splash the oil in this flask onto a creature within 5 feet of you or throw it up to 20 feet, shattering it on impact. Make a ranged Attack against a target creature or object, treating the oil as an Improvised Weapon. On a hit, the target is covered in oil. If the target takes any fire damage before the oil dries (after 1 minute), the target takes an additional 5 fire damage from the burning oil. You can also pour a flask of oil on the ground to cover a 5-foot-square area, provided that the surface is level. If lit, the oil burns for 2 rounds and deals 5 fire damage to any creature that enters the area or ends its turn in the area. A creature can take this damage only once per turn.", attack_damage_dice: 5, attack_damage_die: "d1", attack_damage_type: "fire", range: "20/60 ft.", attack_damage_average: 5},
            {name: "Philter of Love", section: "utility", category: "Adventuring Gear", content: "The next time you see a creature within 10 minutes after drinking this philter, you become Charmed by that creature for 1 hour. If the creature is of a species and gender you are normally attracted to, you regard it as your true love while you are Charmed. This potion's rose-hued, effervescent liquid contains one easy-to-miss bubble shaped like a heart."},
            {name: "Torch", section: "utility", category: "Adventuring Gear", content: "A torch burns for 1 hour, providing bright light in a 20-foot radius and dim light for an additional 20 feet. If you make a melee Attack with a burning torch and hit, it deals 1 fire damage."},
            {name: "Dust of Disappearance", section: "utility", category: "Wondrous Items", content: "Found in a small packet, this powder resembles very fine sand. There is enough of it for one use. When you use an action to throw the dust into the air, you and each creature and object within 10 feet of you become Invisible for [[2d4]] minutes. The Duration is the same for all subjects, and the dust is consumed when its magic takes effect. If a creature affected by the dust attacks or casts a spell, the Invisibility ends for that creature.", weight: 0},
            {name: "Dust of Dryness", section: "utility", category: "Wondrous Items", content: "This small packet contains 1d6 + 4 pinches of dust. You can use an action to sprinkle a pinch of it over water. The dust turns a cube of water 15 feet on a side into one marble-sized pellet, which floats or rests near where the dust was sprinkled. The pellet's weight is negligible.\n\nSomeone can use an action to smash the pellet against a hard surface, causing the pellet to Shatter and release the water the dust absorbed. Doing so ends that pellet's magic.\n\nAn elemental composed mostly of water that is exposed to a pinch of the dust must make a DC 13 Constitution saving throw, taking 10d6 necrotic damage on a failed save, or half as much damage on a successful one.", uses: "1d6+4", weight: 0},
            {name: "Eyes of Charming", section: "utility", category: "Wondrous Items", content: "These Crystal lenses fit over the eyes. They have 3 Charges. While wearing them, you can expend 1 charge as an action to cast the Charm Person spell (save DC 13) on a humanoid within 30 feet of you, provided that you and the target can see each other. The lenses regain all expended Charges daily at dawn.", recharge: 'LONG_REST', uses: 3},
            {name: "Gem of Seeing", section: "utility", category: "Wondrous Items", content: "This gem has 3 Charges. As an action, you can speak the gem's Command Word and expend 1 charge. For the next 10 minutes, you have Truesight out to 120 feet when you peer through the gem.\n\nThe gem regains 1d3 expended Charges daily at dawn.", recharge: 'LONG_REST', uses: 3, weight: 0},
            {name: "Helm of Teleportation", section: "utility", category: "Wondrous Items", content: "This helm has 3 Charges. While wearing it, you can use an action and expend 1 charge to cast the Teleport spell from it. The Helm regains 1d3 expended Charges daily at dawn.", recharge: 'LONG_REST', uses: 3, weight: 3},
            {name: "Marvelous Pigments", section: "utility", category: "Wondrous Items", content: "Typically found in 1d4 pots inside a fine wooden box with a brush (weighing 1 pound in total), these pigments allow you to create three-dimensional Objects by painting them in two dimensions. The paint flows from the brush to form the desired object as you concentrate on its image.\n\nEach pot of paint is sufficient to cover 1,000 square feet of a surface, which lets you create inanimate Objects or terrain features—such as a door, a pit, flowers, trees, cells, rooms, or weapons— that are up to 10,000 cubic feet. It takes 10 minutes to cover 100 square feet.\n\nWhen you complete the painting, the object or terrain feature depicted becomes a real, nonmagical object. Thus, painting a door on a wall creates an actual door that can be opened to whatever is beyond. Painting a pit on a floor creates a real pit, and its depth counts against the total area of Objects you create.\n\nNothing created by the pigments can have a value greater than 25 gp. If you paint an object of greater value (such as a diamond or a pile of gold), the object looks authentic, but close inspection reveals it is made from paste, bone, or some other worthless material.\n\nIf you paint a form of energy such as fire or lightning, the energy appears but dissipates as soon as you complete the painting, doing no harm to anything.", uses: "1d4"},
            {name: "Oil of Etherealness", section: "utility", category: "Wondrous Items", content: "Beads of this cloudy gray oil form on the outside of its container and quickly evaporate. The oil can cover a Medium or smaller creature, along with the Equipment it's wearing and carrying (one additional vial is required for each size category above Medium). Applying the oil takes 10 minutes. The affected creature then gains the effect of the Etherealness spell for 1 hour."},
            {name: "Oil of Sharpness", section: "utility", category: "Wondrous Items", content: "This clear, gelatinous oil sparkles with tiny, ultrathin silver shards. The oil can coat one slashing or piercing weapon or up to 5 pieces of slashing or piercing Ammunition. Applying the oil takes 1 minute. For 1 hour, the coated item is magical and has a +3 bonus to Attack and Damage Rolls."},
            {name: "Oil of Slipperiness", section: "utility", category: "Wondrous Items", content: "This sticky black unguent is thick and heavy in the container, but it flows quickly when poured. The oil can cover a Medium or smaller creature, along with the Equipment it's wearing and carrying (one additional vial is required for each size category above Medium). Applying the oil takes 10 minutes. The affected creature then gains the effect of a Freedom of Movement spell for 8 hours.\n\nAlternatively, the oil can be poured on the ground as an action, where it covers a 10-foot square, duplicating the effect of the Grease spell in that area for 8 hours."},
            {name: "Pipes of Haunting", section: "utility", category: "Wondrous Items", content: "You must be proficient with wind instruments to use these pipes. They have 3 Charges. You can use an action to play them and expend 1 charge to create an eerie, spellbinding tune. Each creature within 30 feet of you that hears you play must succeed on a DC 15 Wisdom saving throw or become Frightened of you for 1 minute. If you wish, all creatures in the area that aren't hostile toward you automatically succeed on the saving throw. A creature that fails the saving throw can repeat it at the end of each of its turns, ending the effect on itself on a success. A creature that succeeds on its saving throw is immune to the effect of these pipes for 24 hours. The pipes regain 1d3 expended Charges daily at dawn.", saving_throw_vs_ability: "WISDOM", saving_throw_dc: 15, recharge: 'LONG_REST', uses: 3, weight: 2},
            {name: "Pipes of the Sewers", section: "utility", category: "Wondrous Items", content: "You must be proficient with wind instruments to use these pipes. While you are attuned to the pipes, ordinary rats and giant rats are indifferent toward you and will not Attack you unless you threaten or harm them.\n\nThe pipes have 3 Charges. If you play the pipes as an action, you can use a Bonus Action to expend 1 to 3 Charges, calling forth one Swarm of Rats (see the Monster Manual for statistics) with each expended charge, provided that enough rats are within half a mile of you to be called in this fashion (as determined by the DM). If there aren't enough rats to form a swarm, the charge is wasted. Called swarms move toward the music by the shortest available route but aren't under your control otherwise. The pipes regain 1d3 expended Charges daily at dawn.\n\nWhenever a Swarm of Rats that isn't under another creature's control comes within 30 feet of you while you are playing the pipes, you can make a Charisma check contested by the swarm's Wisdom check. If you lose the contest, the swarm behaves as it normally would and can't be swayed by the pipes' music for the next 24 hours. If you win the contest, the swarm is swayed by the pipes' music and becomes friendly to you and your companions for as long as you continue to play the pipes each round as an action. A friendly swarm obeys your commands. If you issue no commands to a friendly swarm, it defends itself but otherwise takes no Actions. If a friendly swarm starts its turn and can't hear the pipes' music, your control over that swarm ends, and the swarm behaves as it normally would and can't be swayed by the pipes' music for the next 24 hours.", recharge: 'LONG_REST', uses: 3, weight: 2},
            {name: "Restorative Ointment", section: "utility", category: "Wondrous Items", content: "This glass jar, 3 inches in diameter, contains 1d4 + 1 doses of a thick mixture that smells faintly of aloe. The jar and its contents weigh 1/2 pound.\n\nAs an action, one dose of the ointment can be swallowed or applied to the skin. The creature that receives it regains 2d8+2 Hit Points, ceases to be Poisoned, and is cured of any disease.", uses: "1d4+1", heal_dice: 2, heal_die: "d8", heal_bonus: 2, weight: 0.5},
            {name: "Robe of Scintillating Colors", section: "utility", category: "Wondrous Items", content: "This robe has 3 Charges, and it regains 1d3 expended Charges daily at dawn. While you wear it, you can use an action and expend 1 charge to cause the garment to display a shifting pattern of dazzling hues until the end of your next turn. During this time, the robe sheds bright light in a 30-foot radius and dim light for an additional 30 feet. Creatures that can see you have disadvantage on Attack rolls against you. In addition, any creature in the bright light that can see you when the robe's power is activated must succeed on a DC 15 Wisdom saving throw or become Stunned until the effect ends.", saving_throw_vs_ability: "WISDOM", saving_throw_dc: 15, recharge: 'LONG_REST', uses: 3, weight: 2},
            {name: "Sovereign Glue", section: "utility", category: "Wondrous Items", content: "This viscous, milky-white substance can form a permanent adhesive bond between any two Objects. It must be stored in a jar or flask that has been coated inside with Oil of Slipperiness. When found, a container contains 1d6 + 1 ounces.\n\nOne ounce of the glue can cover a 1-foot square surface. The glue takes 1 minute to set. Once it has done so, the bond it creates can be broken only by the application of Universal Solvent or Oil of Etherealness, or with a wish spell.", uses: "1d6+1"},
            {name: "Universal Solvent", section: "utility", category: "Wondrous Items", content: "This tube holds milky liquid with a strong alcohol smell. You can use an action to pour the contents of the tube onto a surface within reach. The liquid instantly dissolves up to 1 square foot of adhesive it touches, including Sovereign Glue."}
        ]
    },

    showDialog = function (title, content) {
		// Outputs a 5e Shaped dialog box strictly for GM
        var message = '/w GM &{template:5e-shaped} {{title=' + title + '}} {{text_big=' + content + '}}';
        sendChat('GearManager', message, null, {noarchive:true});
	},

    generateUUID = (function () {
        "use strict";
        var a = 0, b = [];
        return function() {
            var c = (new Date()).getTime() + 0, d = c === a;
            a = c;
            for (var e = new Array(8), f = 7; 0 <= f; f--) {
                e[f] = "-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz".charAt(c % 64);
                c = Math.floor(c / 64);
            }
            c = e.join("");
            if (d) {
                for (f = 11; 0 <= f && 63 === b[f]; f--) {
                    b[f] = 0;
                }
                b[f]++;
            } else {
                for (f = 0; 12 > f; f++) {
                    b[f] = Math.floor(64 * Math.random());
                }
            }
            for (f = 0; 12 > f; f++){
                c += "-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz".charAt(b[f]);
            }
            return c;
        };
    }()),

    generateRowID = function () {
        "use strict";
        return generateUUID().replace(/_/g, "Z");
    },

    //---- PUBLIC FUNCTIONS ----//

    registerEventHandlers = function () {
		on('chat:message', handleInput);
	};

    return {
		checkInstall: checkInstall,
		registerEventHandlers: registerEventHandlers,
        getGear: getGear,
        version: version
	};
}());

on("ready", function () {
    GearManager.checkInstall();
    GearManager.registerEventHandlers();
});
