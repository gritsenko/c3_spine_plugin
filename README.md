# Spine add-on for Construct 3

## Important notes for Spine export files:
- Requires Spine version 3.8+ JSON files. See Spine Formatter below to upgrade older JSON files.
- In the Spine export dialogue box, under Runtime, set both 'Filter min' and 'Filter mag' to Linear.
- Max texture size, limited to one sheet of 4096x4096. Multiple texture sheets not supported.
## Additional Spine project guidelines:
- Do not use minify on export of C3 project.
- Do not use worker mode for C3 (see below for details.)
- For jumping or large movments, animate Spine character 'in place', don't do large translations in the Spine project.
- Use C3 events and movement to do the large translations in the C3 project instead (e.g. a long jump.)
- If animation is clipping against the bounds of the C3 object, you can use the scale property to make the Spine render smaller
- Alternatively create a large transparent image in the Spine project behind your Spine character, this will can be used to set the bounding box size fot the C3 spine render.
## Multiple instances of a C3 Spine Object
- Each C3 Spine Object (not instance), should load only one skeleton and only one atlas.
- Other instances of the Spine Object must use the same skeleton and atlas, but can use different skins.
- This new change reduces the size of the texture memory required for multiple instances of the same skeleton.
## Set region action
- This action changes the current region texture on the skeleton/slot/placeholder of the current skin of the skeleton to a new region in the loaded atlas. All other instances of the same skeleton/skin will also change. This can be useful for customizing skins.
## Render quality
- This sets the resolution of the texture to render to. Lower quality requres less texture memory and GPU performance.
## Share your C3 and Spine plugin work!
- Tweet your work @kindeyegames , @pix2d and #construct3, we'd be happy to see your work!

![warn](docs/images/SpineExportSettings.png "Use Runtime Filter* as Linear")

Add-on based on **Mikal's** sample from this thread: 

[https://www.construct.net/en/forum/construct-3/general-discussion-7/spine-animation-js-template-145940 ](https://www.construct.net/en/forum/construct-3/general-discussion-7/spine-animation-js-template-145940) 

## Warning

To use this add-on you must uncheck "Project/Advanced/Use worker" option. If this is a big concern, leave a comment in the github issues (in general C3 worker mode currently changes to non-worker mode for C3 mobile projects.)

![warn](docs/images/warn.jpg "Uncheck use worker")

## Downloads

[Add-on](https://github.com/gritsenko/c3_spine_plugin/releases/download/1.11.2/Spine-v1.11.2.c3addon)

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
- Render Quality property (upsample, downsample rendered image, improve quality vs save on GPU performance and texture memory.)
- Add expressions TextureWidth, TextureHeight (texture size used to display Spine), based on original Spine bounds and RenderQuality setting.
- Multiple skeleton instances (w/ variable skin) per Spine object (save on atlas texture memory usage and faster to spawn new instances.)
- Batch render for improved performance with multiple Spine instances and objects.

## Wishlist
- Preview Spine render in editor.
## Release notes
- 1.11.2 Move spineBatcher.init() to prevent race condition (seen on iOS)
- 1.11.1 Remove spine instance from batcher when C3 Spine instance calls Release() (e.g. C3 object destroyed.)
- 1.11.0 Implement batch render for improved performance with multiple Spine objects and instances.
- 1.10.0: Add Keep Aspect Ratio checkbox
- 1.9.0: Change spine-webgl.js to external script rather than including in C3 DOM script on export.
- 1.8.0: Instances of a spine object will use the original objects skelton info, reducing texture requirements and faster creation of an instance. Add render quality property. Add TextureHeight and TextureWidth ACEs.
- 1.7.0: Add event trigger ACE (trigger when animation event occurs.)
- 1.6.0: Add Set region action (change region(texture) of an attachment in a slot on the current skin. Useful for character customization.
