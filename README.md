# GearManager

This [Roll20](http://roll20.net/) script fixes a drawback to the [5e Shaped Sheet](http://github.com/mlenser/roll20-character-sheets/tree/master/5eShaped) where the items in the Equipment section are only accessible by opening the character sheet. GearManager adds select Adventuring Gear and Wondrous Items to the Utility or Offense section of the character sheet instead of the Equipment section,  allowing easy access to them using the sheet's built-in macros `%{shaped_utility}` and `%{shaped_offense}`. You can also add them individually to the Attributes & Abilities tab if you like.

You can now add your own Adventuring Gear and Wondrous Items using the import function (below).

My [PotionManager](https://github.com/blawson69/PotionManager) script manages all of the potions in a similar way and is a great companion to this one.

Use of the [Shaped Script](https://github.com/mlenser/roll20-api-scripts/tree/master/5eShapedScript) can automatically decrement the number of uses remaining for you and is highly recommended.

## How to Use

To see a list of all available gear, type `!gm --list` into chat. This list shows the name of each item as a link which will add the item to each selected token's character in the appropriate section. Most items belong to the Utility section, but a few will be added to the Offense section since they are primarily used in that manner. If the character already has the item in the proper section, the script will increment the uses on Adventuring Gear or ignore the attempt to add it for Wondrous Items.

When items are added to the Offense section, the script will try to determine if the character has a feat that gives proficiency with Improvised Weapons. If it does, it will turn on proficiency for the item.

Some items have a die roll for the number of "uses" they have. Those items will have a Uses query on their "add" link with a pre-rolled number based on the item's description. If you have already determined the number of uses, you may enter your own. Otherwise simply keep the pre-rolled number.

The list also contains a "view" link that shows the item's description in chat. The "view" link will *not* add the item to any characters.

To view a succinct version of this information in chat, sent `!gm --help`.

## Import

To maintain a logical separation, import items are created in three handouts. One for all offensive items (to be added to the offense section of the character sheet), one for Adventuring Gear that does not belong in offense (to be added to the utility section), and one for Wondrous Items (all of which are added to the utility section). Each has its own specific formatting as outlined below. To create items for import, simply create a handout with the title "GearManager: " plus either "Offense", "Utility", or "Wondrous" and add each item in a separate paragraph with the correct format.

To include a die roll expression that should be executed when the item is used, enclose it in double square brackets, i.e. [[]]. Note: When viewing from the list, GearManager will not display the square brackets but will display the die roll expression in red to differentiate it from a static expression.

Note: To remove an item, simply delete it from the handout and re-import. To delete all items from a handout, delete them but *do not delete the handout* until after you have re-imported.

### Offense

Offense items are non-weapons that are used nevertheless to directly inflict damage. They are considered ranged weapons, typically a liquid of some kind which is thrown a short distance. All such offensive items are considered Improvised Weapons.

As a weapon, your custom offense item must contain the following properties in addition to the name and description: The number of dice to roll, the type of dice (d4, d6, etc.) to roll, the type of damage inflicted, the range in feet it can be thrown, and the average amount of damage inflicted. All properties should be separated by a pipe character (|) in this order:

`Name|Description|# of Dice|Die|Damage Type|Range|Average`

Example:

> Liquid Nitrogen|This super-frozen liquid sticks to the skin and causes 2d4 cold damage for [[1d4-1]] rounds.|2|d4|cold|20/60 ft.|5

### Utility

Adventuring Gear that does not count as an Improvised Weapon belongs in the utility section. These items either inflict passive damage or create other effects or provide utility in non-combative ways. These kinds of items are generally anything that has a finite number of uses that you can collect in your travels.

Utility items must contain the following properties in addition to the name and description: number of uses and weight. Some items may require a saving throw, so there are 2 additional properties for these items: the DC of the save, and the ability to use for the save. It is not necessary to add the saving throw parameters if the cause for a save is passive (waiting for creatures to enter an area of effect for instance), but these 2 properties must both exist if you want to include saving throw when the item is activated. All properties should be separated by a pipe character (|) in this order:

`Name|Description|Uses|Weight`

`Name|Description|Uses|Weight|DC|Ability`

Examples:

> Baby Oil|As an action, you can apply this oil to your skin, granting a +3 to your opposing grapple check for [[1d4+1]] minutes.|1|1

> Legos|As an action, you can spread this bag of pointy plastic terrors over a 10 ft. square area. Any creature that enters the area has its speed reduced to 5 and must succeed on a DC 15 Dexterity saving throw or take 1d4 piercing damage.|1|1|15|DEXTERITY

### Wondrous

Wondrous Items are all magical items that are not weapons but have a utility of some sort. Items that have a number of charges to use are typically a good candidate for the utility section and thus for adding to your custom GearManager: Wondrous list. You may use the core Wondrous Items as examples of which of your custom items you may want to include in your import.

Wondrous Items must contain the following properties in addition to the name and description: number of uses, when the current number of uses recharges, and weight. The uses (or charges) may be a static number or a die roll expression depending on how your item works. For the recharge time, indicate what should trigger the recharging of the item. You have can use any of the available options for the 5e Shaped Sheet, but the common ones for magic items are "long rest" (suggested for items that recharge at dawn), "short or long rest" and "manual". Use "manual" when the item does not automatically recharge at a certain time.

Some items may require a saving throw, and they will follow the same guidelines as the utility items [above](#utility). Your Wondrous Item may also provide healing, so there are 3 additional properties for these items: the number of dice to roll, the type of dice (d4, d6, etc.) to roll, and the number of bonus points to add to the roll. All three of these must all exist for any item to provide healing.

All properties should be separated by a pipe character (|) in this order:

`Name|Description|Uses|Weight|Recharge`

`Name|Description|Uses|Weight|Recharge|DC|Ability`

`Name|Description|Uses|Weight|Recharge|# of Dice|Die|Bonus`

`Name|Description|Uses|Weight|Recharge|DC|Ability|# of Dice|Die|Bonus`

Examples:

> Sunglasses of Truth|These sunglasses have 3 Charges. As an action, you can speak the sunglasses' Command Word and expend 1 charge. For the next 10 minutes, you have Truesight out to 120 feet when you wear the sunglasses. The sunglasses regain 1d3 expended Charges daily at dawn.|3|1|long rest

> Glitter Dust|Found in a small container, this powder looks like crushed gems. There is enough of it for one use. When you use an action to throw a handful into the air, you and each creature within 15 feet of you will be covered in glitter. Unwilling creatures must succeed on a DC 15 Dexterity saving throw to avoid the glitter.|1|0|Manual|15|DEXTERITY

> Lotion of Healing|This glass jar, 3 inches in diameter, contains 1d4 + 1 doses of a milky substance that smells faintly of roses. As an action, one dose of the lotion can be applied to the skin. The creature that receives it regains 2d6+2 Hit Points, ceases to be Poisoned, and is cured of any disease.|1d4+1|0.5|Manual|2|d6|2
