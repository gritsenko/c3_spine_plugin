# Spine add-on for Construct 3

## Important notes for Spine export files:
- Requires Spine version 3.8+ JSON files. See Spine Formatter below to upgrade older JSON files.
- In the Spine export dialogue box, under Runtime, set both 'Filter min' and 'Filter mag' to Linear.
- Max texture size, limited to one sheet of 4096x4096. Multiple texture sheets not supported.
## Additional Spine project guidelines:
- For jumping or large movments, animate Spine character 'in place', don't do large translations in the Spine project.
- Use C3 events and movement to do the large translations in the C3 project instead (e.g. a long jump.)
- If animation is clipping against the bounds of the C3 object, you can use the scale property to make the Spine render smaller
- Alternatively create a large transparent image in the Spine project behind your Spine character, this will can be used to set the bounding box size fot the C3 spine render.
## Share your C3 and Spine plugin work!
- Tweet your work @kindeyegames , @pix2d and #construct3, we'd be happy to see your work!

![warn](docs/images/SpineExportSettings.png "Use Runtime Filter* as Linear")

Add-on based on **Mikal's** sample from this thread: 

[https://www.construct.net/en/forum/construct-3/general-discussion-7/spine-animation-js-template-145940 ](https://www.construct.net/en/forum/construct-3/general-discussion-7/spine-animation-js-template-145940) 

## Warning

To use this add-on you must uncheck "Project/Advanced/Use worker" option. If this is a big concern, leave a comment in the github issues (in general C3 worker mode currently changes to non-worker mode for C3 mobile projects.)

![warn](docs/images/warn.jpg "Uncheck use worker")

## Downloads

[Add-on](https://github.com/gritsenko/c3_spine_plugin/releases/download/1.7.0/Spine-v1.7.0.c3addon)

[Sample project](https://github.com/gritsenko/c3_spine_plugin/releases/download/1.5.0/SpinePluginTest.c3p)

## LIVE DEMO
[https://gritsenko.github.io/c3_spine_plugin/docs/LiveDemo/index.html](https://gritsenko.github.io/c3_spine_plugin/docs/LiveDemo/index.html)

## Spine Formatter (3.3+ to 3.8 JSON Format)
Useful for Dragon Bones Spine JSON export and earlier Spine versions.
[https://gritsenko.github.io/c3_spine_plugin/formatter/index.html](https://gritsenko.github.io/c3_spine_plugin/formatter/index.html)

## Current supported features
- Load Spine json, atlas and pngs.
- Select starting skin, skeleton, animation
- Dynamically set existing skin defined in JSON
- Mesh Deformations
- Animation set, play, pause, trigger on animation complete.
- Animation finished, animation playing conditions.
- Default mix interval for blending animations.
- Dynamic animation speed control.
- Dynamic region changing for current skin attachments.
- Events to trigger C3 triggers.

## Wishlist
- SkeletonData single type instance and multiple skeleton instances per Spine object / instances (save texture memory for mutiple instances of one skeleton.)

## Release notes
- 1.7.0: Add event trigger ACE (trigger when animation event occurs.)
- 1.6.0: Add Set region action (change region(texture) of an attachment in a slot on the current skin. Useful for character customization.
