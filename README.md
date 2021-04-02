# Spine add-on for Construct 3

### Please support development of the C3 Spine plugin (thanks to all those kind folks who have donated so far!)

[![paypal](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=T8VV6CJVP3X3S)

- Commisions for specific new features are also accepted, contact Mikal via Twitter @kindeyegames or the Construct Community Discord server (Mikal).

## Important notes for Spine export files:
- Requires Spine version 3.8+ JSON files. See Spine Formatter below to upgrade older JSON files.
- In the Spine export dialogue box, under Runtime, set both 'Filter min' and 'Filter mag' to Linear or Nearest.
- In the Packing settings, set Region Padding to 2 or higher (if you see lines around your images, it may be because padding is set to 0).
- Max texture size, 4096x4096. multiple texture sheets supported (use comma separated list on C3 spine object's png path property).

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
- This action changes the current region texture on the skeleton/slot/placeholder of the current skin of the skeleton to a new region in the loaded atlas. All other instances of the same skeleton/skin will also change. This can be useful for customizing skins. Using skins is the typical way to do this.

## Custom skins
- Runtime skins can be created, using *Create custom skin*, *Add custom skin* and *Set custom skin*.

## Slot color/dark color
- Slot color can be set through *Set slot color* and *Set slot dark color*. The colors are applied using *Apply slot colors*. The slot colors will be reverted if a new skin is applied or if the Spine animation changes the slot colors. To reset the slot colors to the original colors, use *Reset slot colors*. Dark color will only be applied if 'Tint Black' is enabled for the slot in the Spine project.

## Render quality
- This sets the resolution of the texture to render to. Lower quality requres less texture memory and GPU performance.

## Bounding Box Attachment
- SpineBBoxCenterX, SpineBBoxCenterY espressions give the average of the named slot/bbox polygon points. Useful for attaching C3 Sprite object / collision box to the center of the Bounding Box.
- The UpdateBBoxes updates the bounding box to the current point in the animation. It should be done just once per tick per instance, before the SpineBBoxCenterX/Y expressions are used.
- SpineBBoxGetPoly expression returns poly points in JSON format array of named slot/bounding box attachment. Use C3 JSON object to parse and use points. The points are returned in top level JSON array [x0,y0, x1, y1,...]
- [Spine Bounding Box Attachment Documentation](http://en.esotericsoftware.com/spine-bounding-boxes)

## Bone control ACEs
- ACEs to override properties of bones (x,y,rotation, scale x, scale y), these are applied prior to IK transformation, but are useful for controlling 'endpoints' of IK, for example with an aim / crosshair bone.

## Render quality ACE
- Controls Spine render resolution
- Only apply to one Spine instance per Spine object (e.g. use pick top instance).
- Wait 0.1S after applying (caution for race condition, reviewing need.)
- After done, destroy all Spine instance and then recreate as needed with the new render quality.

## Share your C3 and Spine plugin work!
- Tweet your work @kindeyegames , @pix2d and #construct3, we'd be happy to see your work!

## Known issues / workarounds
- Clipping on rendering, see above for one solution  (add transparent image of size of area to render.)
- Animation finished with animation mix causing another finished trigger see [issue](https://github.com/gritsenko/c3_spine_plugin/issues/44) for workaround.
- No render of default skin w/ no bones assigned, instead assign default skin bones.

### Example export settings
[](docs/images/SpineExportSettings.png)

Add-on based on **Mikal's** sample from this [thread](https://www.construct.net/en/forum/construct-3/general-discussion-7/spine-animation-js-template-145940) 

## Downloads
[Current Add-on, Release 1.36.1](https://github.com/gritsenko/c3_spine_plugin/releases/download/1.36.1/Spine-v1.36.1.c3addon)

[Previous Add-on Releases](https://github.com/gritsenko/c3_spine_plugin/releases)

[Sample project](https://github.com/gritsenko/c3_spine_plugin/releases/download/1.5.0/SpinePluginTest.c3p)

[MixAndMatch project](https://github.com/gritsenko/c3_spine_plugin/releases/download/1.13.0/SpineMixandMatch.c3p)

[BoundingBox project](https://github.com/gritsenko/c3_spine_plugin/releases/download/1.17.0/SpineBBox.c3p)

[BoundingBoxMesh project](https://github.com/gritsenko/c3_spine_plugin/releases/download/1.18.0/SpineBBoxMesh.c3p)

[AimBoneControl project](https://github.com/gritsenko/c3_spine_plugin/releases/download/1.36.1/SpineboyAimBoneControl.c3p)

## LIVE DEMO
[Live Demo](https://gritsenko.github.io/c3_spine_plugin/docs/LiveDemo/index.html)

## Spine Formatter (3.3+ to 3.8 JSON Format)
Useful for Dragon Bones Spine JSON export and earlier Spine versions.

[Spine Formatter](https://gritsenko.github.io/c3_spine_plugin/formatter/index.html)

## Current supported features
- Load Spine json, atlas and pngs.
- Select starting skin, skeleton, animation
- Dynamically set existing skin defined in JSON
- Mesh Deformations
- Animation set, play, pause, trigger on animation complete.
- Animation set time, play from beginning, current time, current ratio.
- Animation finished, animation playing conditions.
- Default mix interval for blending animations.
- Per animation pair mix duration control.
- Dynamic animation speed control.
- Dynamic region changing for current skin attachments.
- Events to trigger C3 triggers.
- Render Quality property (upsample, downsample rendered image, improve quality vs save on GPU performance and texture memory.)
- Add expressions TextureWidth, TextureHeight (texture size used to display Spine), based on original Spine bounds and RenderQuality setting.
- Multiple skeleton instances (w/ variable skin) per Spine object (save on atlas texture memory usage and faster to spawn new instances.)
- Batch render for improved performance with multiple Spine instances and objects.
- Multiple atlas pages (multiple pngs).
- Mix and Match skins, custom runtime skins.
- C3 worker mode support.
- Color/Dark Color for Slot at runtime.
- BoundingBoxAttachment center expressions.
- Set Object Render Rate, controls number of ticks per render of the Spine object, distributed amongst the number of instances of the object. This can reduce the CPU performance and GPU performance vs the frame rate of the render.
- C3 Module mode support.
- Animation track support.
- Disable render to texture when offscreen or animation is complete/stopped (perf optimization)
- Bone control.

## Wishlist
- Preview Spine render in editor (dependent on C3 editor SDK updates)

## Release notes
- 1.44.0 Palette loading optimization (if only a few palette entries need update, just update those areas of the palette texture, otherwise update entire palette texture.)
- 1.36.1 setTracksListner guard clause (do not crash if skeleton is not initialized or removed.)
- 1.36.0 Init refactor (internal clean up)
- 1.35.0 Fix current time event regression, no apply() in setAnimation (save some CPU)
- 1.34.2 Fix bbox ACEs w/ flipped animation
- 1.34.1 bone control optimization, repeated init bug fix.
- 1.34.0 Add ACE for render quality control 
- 1.33.1 Add render once for Bone control actions
- 1.33.0 Bone control Conditions and Expressions
- 1.32.0 Bone control Actions
- 1.31.0 Add gl parameter cache for future optimization to not get gl state parameters every tick.
- 1.30.1 Disable idle animation updates (via debug variable control, set 'reduceAnimation' to 'enable'.
- 1.27.3 Correct idle and offscreen detection
- 1.27.2 Advance animation/slot render while off screen.
- 1.27.1 Add updateCurrentAnimation check if animatioName exists and warn if not.
- 1.27.0 Add parameters and UID to Action console warnings for debug.
- 1.26.1 Return w/o JS error from Expression/Conditions if skeleton not loaded.
- 1.26.0 Add per instance debug enable ACE, return w/o JS error from Actions if skeleton not loaded.
- 1.25.3 Bug fix: animation complete hang, export module fix
- 1.25.1 Advance animation 1s after applying set animation, apply color, set skin, so they will take effect when an animation mix value is present.
- 1.25.0 Advance animation one tick after applying set animation, apply color, set skin, so they will take effect, fix Set and Apply color C3 module mode bugs.
- 1.24.0 Disable render when animation is complete (end of animation) or animation is stopped (perf optimization).
- 1.23.0 Disable render to texture when offscreen (perf optimization), animation continues for events, etc.
- 1.22.2 Add animation track support. Default to track 0 for set, play, stop animation for backward compatability, add isSekeltonLoaded ACE. Add track alpha control to blend animation between tracks. (Feature commisioned by Adrian - thank you!)
- 1.20.0 Add support for R266 module mode, add Set Object Render Rate ACE. 
- 1.19.0 Add Set animation mix {fromName} to {toName} with duration {seconds}.
- 1.18.0 Add SpineBBoxGetPoly expression returns poly points in JSON format of named slot/bounding box attachment. 
- 1.17.0 Add debug property, SpineBBoxCenterX,Y expressions. UpdateBBoxes action.
- 1.16.3 Add updateWorldTransform on animation set.
- 1.16.2 Change behavior of *Set Animation w/ starting time* to not trigger events if the events were before the starting time.
- 1.16.1 Bug fix for slot color (handle reset and new skin properly, only apply dark color if Tint Black is set in Spine project for slot).
- 1.16.0 Add Set slot dark color, Apply Slot color, Reset Slot color. Add Set animation time and starting point of Set animation (beginning, current time, current ratio). Deprecated set color attachment (did not support dark color).  (Feature commisioned by Adrian - thank you!)
- 1.15.2 Add project sampling support to Spine C3 texture.
- 1.15.1 Fix pixel rounding bug.
- 1.15.0 Set Slot Color (temporary until new skin set), [*deprecated* Set Custom Color Attachment] Fix one frame animation bug.
- 1.14.1 Fix PMA bug regression (introduced in 1.11.0)
- 1.14.0 Add C3 worker mode support.
- 1.13.0 Add runtime create skin and add skin ACEs and MixandMatch example project.
- 1.12.1 Change path separator to comma instead of space to match existing skin paths separator.
- 1.12.0 Add support for Atlas pages (multiple png, space separated), finish implmention of Set Attachment action, fix webgl1 support (revealed on iOS w/o weblg2 enabled.)
- 1.11.2 Move spineBatcher.init() to prevent race condition (seen on iOS)
- 1.11.1 Remove spine instance from batcher when C3 Spine instance calls Release() (e.g. C3 object destroyed.)
- 1.11.0 Implement batch render for improved performance with multiple Spine objects and instances.
- 1.10.0: Add Keep Aspect Ratio checkbox
- 1.9.0: Change spine-webgl.js to external script rather than including in C3 DOM script on export.
- 1.8.0: Instances of a spine object will use the original objects skelton info, reducing texture requirements and faster creation of an instance. Add render quality property. Add TextureHeight and TextureWidth ACEs.
- 1.7.0: Add event trigger ACE (trigger when animation event occurs.)
- 1.6.0: Add Set region action (change region(texture) of an attachment in a slot on the current skin. Useful for character customization.

## Scripting interface

### setAnimation(animationName, loop, start, trackIndex)
- animationName: string (animation name)
- loop: boolean (loop animation)
- start: number (0: beginning, 1: current-time, 2: current-ratio)
- trackIndex: number (track index)