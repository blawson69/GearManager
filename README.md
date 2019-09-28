# GearManager

This [Roll20](http://roll20.net/) script fixes a drawback to the [5e Shaped Sheet](http://github.com/mlenser/roll20-character-sheets/tree/master/5eShaped) where the items in the Equipment section are only accessible by opening the character sheet. GearManager adds select Adventuring Gear and Wondrous Items to the Utility or Offense section of the character sheet instead of the Equipment section,  allowing easy access to them using the sheet's built-in macros `%{shaped_utility}` and `%{shaped_offense}`. You can also add them to the Attributes & Abilities tab if you like.

My [PotionManager](https://github.com/blawson69/PotionManager) script manages all of the potions in a similar way and is a great companion to this one.

Use of the [Shaped Script](https://github.com/mlenser/roll20-api-scripts/tree/master/5eShapedScript) can automatically decrement the number of uses remaining for you and is highly recommended.

## How to Use

To see a list of all available gear, type `!gm --list` into chat. This list shows the name of each item as a link which will add the item to each selected token's character in the appropriate section. Most items belong to the Utility section, but a few will be added to the Offense section since they are primarily used in that manner. If the character already has the item in the proper section, the script will increment the uses on Adventuring Gear or ignore the attempt to add it for Wondrous Items.

When items are added to the Offense section, the script will try to determine if the character has a feat that gives proficiency with Improvised Weapons. If it does, it will turn on proficiency for the item.

Some items have a die roll for the number of "uses" they have. Those items will have a Uses query on their "add" link with a pre-rolled number based on the item's description. If you have already determined the number of uses, you may enter your own. Otherwise simply keep the pre-rolled number.

The list also contains a "view" link that shows the item's description in chat. The "view" link will *not* add the item to any characters.

To view a succinct version of this information in chat, sent `!gm --help`.
