# Spine add-on for Construct 3

Add-on based on **Mikal's** sample from this thread: 

[https://www.construct.net/en/forum/construct-3/general-discussion-7/spine-animation-js-template-145940 ](https://www.construct.net/en/forum/construct-3/general-discussion-7/spine-animation-js-template-145940) 

For now it uses **additional canvases** for each spine skeleton, which are used as textures in C3 rendering process. I found this method not really fast on mobile browsers. But I haven't succeed in direct drawing into c3 WebGL context yet.

## Warning

To use this add-on you must uncheck "Project/Advanced/Use worker" option:

![warn](docs/images/warn.jpg "Uncheck use worker")


## Download

[Add-on](https://github.com/gritsenko/c3_spine_plugin/releases/download/v1/Spine-v1.3.0.c3addon)

[Sample project](https://github.com/gritsenko/c3_spine_plugin/releases/download/v1/SpinePluginTest.c3p)

## LIVE DEMO
[https://gritsenko.github.io/c3_spine_plugin/docs/LiveDemo/index.html](https://gritsenko.github.io/c3_spine_plugin/docs/LiveDemo/index.html)
