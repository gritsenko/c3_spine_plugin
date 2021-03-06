// @ts-check
"use strict";
{
    // @ts-ignore
    const C3 = self.C3;
    const spineBatcher = globalThis.spineBatcher;
    
    C3.Plugins.Gritsenko_Spine.Instance = class SpineInstance extends C3.SDKWorldInstanceBase {

        constructor(inst, properties) {
            super(inst);

            this.paletteNumber = 64;
            this.indexSize = 32;
            this.palette = null;
            this.data = {};
            this.currentKey = "";
            this.currentValue = 0;
            this.canvas = null;
            this.bgColor = null;
            this.isPlaying = true;
            this.instance = inst;

            this.skeletonInfo = null;
            this.renderer = null;
            this.gl = null;
            // @ts-ignore
            this.uid = this.GetInstance().GetUID();
            this.customSkins = {};
            this.slotColors = {};
            this.slotDarkColors = {};
            this.isLoaded = false;
            this.animateOnce = 0;
            this.trackAnimations = {};
            this.skinNames = [];
            this.delayedTrackListeners = [];
            // @ts-ignore
            this.sdkType = this.GetSdkType();

            this.atlasPath = "";
            // @ts-ignore
            this.objectName = this.GetInstance().GetObjectClass().GetName();

            if (properties) {
                this.jsonPath = properties[0];
                this.atlasPath = properties[1];
                this.pngPath = properties[2];
                this.skinName = properties[3];
                this.animationName = properties[4];
                this.skeletonName = properties[5];
                this.skeletonScale = properties[6];
                this.premultipliedAlpha = properties[7];
                this.collisionsEnabled = properties[8];
                this.defaultMix = properties[9];
                this.skeletonRenderQuality = properties[10];
                this.keepAspectRatio = properties[11];
                this.debug = properties[12];
            }

            this.isMirrored = false;

            this._elementTexture = null


            this.pngURI = ""
            this.atlasURI = "*init-atlas-uri*"
            this.jsonURI = ""
            this.c3renderer = null
            this.runtime = inst.GetRuntime();
            this.c3wgl = this.runtime.GetCanvasManager().GetWebGLRenderer();
            this.canvas = this.c3wgl._gl.canvas; // C3 canvas 
            this.spineFB = null
            this.initSpineInProgress = false;
            this.completeAnimationName = ""
            this.spineError = null
            this.animationSpeed = 1.0
            this.completeEventName = ""
            this.textureWidth = 0;
            this.textureHeight = 0;

            // @ts-ignore
            const wi = this.GetWorldInfo();
            // Enable collisions based on property, add ACEs if needed
            wi.SetCollisionEnabled(this.collisionsEnabled);

            // @ts-ignore
            this._StartTicking();

            // Context loss/restore
            // @ts-ignore
            this.HandleWebGLContextLoss();
            // @ts-ignore
            this.OnWebGLContextRestored = function()
            {
                if (this.debug) console.warn('[Spine] Context restored.')
            }

            // @ts-ignore
            this.OnWebGLContextLost = function()
            {
                console.warn('[Spine] Context lost.')
                globalThis.spineBatcher.debugVariables.animationDisable = 'enable';
                globalThis.spineBatcher.debugVariables.renderDisable = 'enable';
                // @ts-ignore
                this.Trigger(C3.Plugins.Gritsenko_Spine.Cnds.OnWebGLContextLost);
            }

            // @ts-ignore
            this.OnWebGLContextRestored = function()
            {
                console.warn('[Spine] Context Restored.')
                globalThis.spineBatcher.debugVariables.animationDisable = 'enable';
                globalThis.spineBatcher.debugVariables.renderDisable = 'enable';
                // @ts-ignore
                this.Trigger(C3.Plugins.Gritsenko_Spine.Cnds.OnWebGLContextRestored);
            }

        }

        // spineDemos.log = true
        // Initialize project files URIs

        initInstance()
        {
            this.initSpineInProgress = true;
            // Init Spine elements
            // @ts-ignore
            this.mvp = new spine.webgl.Matrix4();
            this.mvp.ortho2d(0, 0, 0, 0); // Texture size unknown at this point
            this.gl = this.runtime.GetWebGLRenderer()._gl;
            this.canvas = this.gl._canvas;
            // this.initTexturesBatcher();
        }

        async initTexturesBatcher() {
            this.sdkType._texturesBatcherInitializing = true;
            // Init spineBatcher (only initializes once)
            spineBatcher.init(this.canvas, this.runtime);
            if (this.runtime.IsPreview() || this.runtime._assetManager._isCordova)
            {
                await this.loadSkeletonTextures();
            } else
            {
                this.loadSkeletonTextures();
            }
        }

        resize() {
            var bounds = this.skeletonInfo.bounds;

            // magic
            var centerX = bounds.offset.x + (bounds.size.x) / 2;
            var centerY = bounds.offset.y + (bounds.size.y) / 2;
            var scaleX = bounds.size.x / (bounds.size.x);
            var scaleY = bounds.size.y / (bounds.size.y);
            var scale = Math.max(scaleX, scaleY) * (1/this.skeletonScale);
            if (scale < 1) scale = 1;
            var width = (bounds.size.x) * scale;
            var height = (bounds.size.y) * scale;

            this.mvp.ortho2d(centerX - width / 2, centerY - height / 2, width, height);
        }

        async loadSkeletonTextures()
        {
            // @ts-ignore
            this.sdkType._assetManager = new spine.SharedAssetManager();
            this.sdkType._assetTag = this.uid;
            const assetManager = this.sdkType._assetManager;
            const assetTag = this.sdkType._assetTag;
            const gl = this.gl;
            
            // @ts-ignore
            if (this.debug) console.info(this.GetInstance().GetUID(),'[Spine] Loading skeleton, textures, json, atlas');
            // Only load textures once for creation of skeletonData, not for each instance
            // Disable PMA when loading Spine textures
            // @ts-ignore
            spine.webgl.GLTexture.DISABLE_UNPACK_PREMULTIPLIED_ALPHA_WEBGL = true;
            
            // Path translation for json and atlast (1:1)
            if (this.runtime.IsPreview() || this.runtime._assetManager._isCordova)
            {
                this.atlasURI = '*await-atlas-path*'
                this.atlasURI = await this.runtime._assetManager.GetProjectFileUrl(this.atlasPath);
                this.jsonURI = await this.runtime._assetManager.GetProjectFileUrl(this.jsonPath);
            } else
            {
                this.atlasURI = this.atlasPath;
                this.jsonURI = this.jsonPath;
                if (this.debug) console.info('[Spine] loadSkeletonTextures, atlasURI, not preview', this.atlasURI, this.atlasPath, this.uid, this.objectName, this.runtime.GetTickCount());
            }

            this.sdkType._assetPaths[this.atlasURI] = this.atlasURI;
            this.sdkType._assetPaths[this.atlasPath] = this.atlasURI;
            this.sdkType._assetPaths[this.jsonURI] = this.jsonURI;
            this.sdkType._assetPaths[this.jsonPath] = this.jsonURI;

            assetManager.loadJson(assetTag, this.jsonURI);
            // @ts-ignore
            let textureLoader = function(img) { return new spine.webgl.GLTexture(gl, img); };

            // Load multiple textures and set up path translation (for C3 preview with 'blob' URIs)
            let assetPaths = this.pngPath.split(",");
            for(let i=0;i<assetPaths.length;i++)
            {
                if (this.runtime.IsPreview() || this.runtime._assetManager._isCordova)
                {    
                    this.pngURI = await this.runtime._assetManager.GetProjectFileUrl(assetPaths[i]);
                } else
                {
                    this.pngURI = assetPaths[i];
                }
                this.sdkType._assetPaths[assetPaths[i]] = this.pngURI;
                assetManager.loadTexture(assetTag, textureLoader, this.pngURI);
            }

            assetManager.loadText(assetTag, this.atlasURI);

            this.sdkType._texturesBatcherInitialized = true;
            this.sdkType._texturesBatcherInitializing = false;
            if (this.debug) console.info('[Spine] loadSkeletonTextures, atlasURI', this.atlasURI, this.atlasPath, this.uid, this.objectName, this.runtime.GetTickCount());
        }

        loadSkeletonData()
        {
            if (this.debug) console.info('[Spine] loadSkeletonData, atlasURI', this.atlasURI, this.atlasPath, this.uid, this.objectName, this.sdkType._texturesBatcherInitialized, this.runtime.GetTickCount());

            const assetManager = this.sdkType._assetManager;;
            const assetTag = this.sdkType._assetTag;
            const self = this;

            const atlasURI = assetManager.get(assetTag, this.atlasURI);

            // Sentry error reported
            if (atlasURI === undefined || atlasURI === null)
            {
                console.warn('[Spine] loadSkeletonData, atlasURI not set', atlasURI, assetTag, this.uid, this.atlasURI, assetManager.isLoadingComplete(assetTag), this.atlasPath, this.runtime.GetTickCount());
                console.warn('[Spine] objectclass',this.objectName, this.sdkType, this.uid, this.runtime.GetTickCount());
                if (globalThis.Sentry)
                {
                    globalThis.Sentry.captureException('[Spine] loadSkeletonData, atlasURI not set, object:'+this.objectName);
                }
                this.sdkType._initFailed = true;
                return;
            }

            // @ts-ignore
            this.sdkType._atlas = new spine.TextureAtlas(atlasURI, function(path) {
                return assetManager.get(self.sdkType._assetTag, self.sdkType._assetPaths[path]);
            });
            // @ts-ignore
            this.sdkType._atlasLoader = new spine.AtlasAttachmentLoader(this.sdkType._atlas);

            // @ts-ignore
            this.sdkType._skeletonJson = new spine.SkeletonJson(this.sdkType._atlasLoader);
            this.sdkType._skeletonJson.scale = this.skeletonRenderQuality;
            // JSON file with one skeleton, no name
            this.sdkType._jsonURI = this.jsonURI;
            if (this.skeletonName == "")
            {
                this.sdkType._skeletonData = this.sdkType._skeletonJson.readSkeletonData(assetManager.get(assetTag, this.jsonURI));
            } else
            {
                this.sdkType._skeletonData = this.sdkType._skeletonJson.readSkeletonData(assetManager.get(assetTag, this.jsonURI) [this.skeletonName] );
            }
            this.sdkType._skeletonDataInitialized = true;
            this.sdkType._skeletonDataInitializing = false;
        }

        loadSkeletons() {

            this.skeletonInfo = this.loadSkeleton(this.skeletonName, this.animationName);
            this.skeletonInfo.premultipliedAlpha = this.premultipliedAlpha;

            const skins = this.skeletonInfo.skeleton.data.skins;
            this.skinNames = skins.map(x => x.name);

            const animations = this.skeletonInfo.skeleton.data.animations;
            this.animationNames = animations.map(x => x.name);

            this.resize();

            // @ts-ignore
            spineBatcher.addInstance(this.skeletonInfo, this.skeletonScale, this.GetInstance().GetUID());
            // @ts-ignore
            this.spineBoneControl = new SpineBoneControl(this.debug);
        }

        loadSkeleton(name, animationName, sequenceSlots) {
            if (this.debug) console.info("[Spine] Reading skeleton data:", this.uid, this.sdkType.GetObjectClass().GetName(), animationName);
            // If skeletonData not initialized, create it and stop other instances from creating it
            // @ts-ignore
            let skeleton = new spine.Skeleton(this.sdkType._skeletonData);
            let subskin = skeleton.data.findSkin(this.skinName);
            if (subskin === undefined) {
                subskin = skeleton.data.skins[0];
            }

            skeleton.setSkin(subskin);

            // @ts-ignore
            let stateData = new spine.AnimationStateData(this.sdkType._skeletonData);
            stateData.defaultMix = this.defaultMix;
            // @ts-ignore
            var state = new spine.AnimationState(stateData);
            state.setAnimation(0, animationName, true);
            // Record animation assigned for listener
            this.trackAnimations[0] = this.animationName;
            state.tracks[0].listener = {
                complete: (trackEntry, count) => {
                    this.completeAnimationName = this.trackAnimations[0];
                    this.completeTrackIndex = trackEntry.trackIndex;
                    // @ts-ignore
                    this.Trigger(C3.Plugins.Gritsenko_Spine.Cnds.OnAnimationFinished);
                    // @ts-ignore
                    this.Trigger(C3.Plugins.Gritsenko_Spine.Cnds.OnAnyAnimationFinished);
                },
                event: (trackEntry, event) => {
                    this.completeEventName = event.data.name;
                    this.completeEventTrackIndex = trackEntry.trackIndex;
                    // @ts-ignore
                    this.Trigger(C3.Plugins.Gritsenko_Spine.Cnds.OnEvent);
                }
            };

            state.apply(skeleton);
            skeleton.updateWorldTransform();
            // @ts-ignore
            var offset = new spine.Vector2();
            // @ts-ignore
            var size = new spine.Vector2();
            skeleton.getBounds(offset, size, []);
            // @ts-ignore
            var skeletonBounds = new spine.SkeletonBounds();

            if(this.keepAspectRatio){
                // @ts-ignore
                var wi = this.GetWorldInfo();
                offset = {x : offset.x - wi._w/2, y: offset.y};
                size = {x : wi._w, y: wi._h};
            }

            return {
                atlas: this.sdkType._atlas,
                skeleton: skeleton,
                state: state,
                playTime: 0,
                bounds: {
                    offset: offset,
                    size: size
                },
                atlasLoader : this.sdkType._atlasLoader,
                skeletonBounds: skeletonBounds,
                stateData: stateData,
                palette: this.palette
            };
        }

        createInstanceTexture()
        {
            const renderer = this.runtime.GetWebGLRenderer();
            const  gl  =  this.gl;

            this.c3renderer = renderer

            let bounds = this.skeletonInfo.bounds;
            this.textureWidth = bounds.size.x;
            this.textureHeight = bounds.size.y;
            let sampling = this.runtime.GetSampling();
            let options =  { mipMap: false, sampling: sampling }
            if (this.debug) console.info('[Spine] CreateDynamicTexture x,y:', Math.round(this.textureWidth), Math.round(this.textureHeight), this.uid, this.runtime.GetTickCount());
            this._elementTexture = renderer.CreateDynamicTexture(this.textureWidth, this.textureHeight, options);

            let oldFrameBuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
            // Create FB and bind texture to spineFB
            this.spineFB = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.spineFB);
            // attach the texture as the first color attachment
            const attachmentPoint = gl.COLOR_ATTACHMENT0;
            gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, this._elementTexture._texture, 0);
            // Restore render to the canvas
            gl.bindFramebuffer(gl.FRAMEBUFFER, oldFrameBuffer);
            // @ts-ignore
            spineBatcher.setInstanceFB(this.spineFB, this.GetInstance().GetUID())
        }

        updateCurrentSkin() {

            const state = this.skeletonInfo.state;
            const skeleton = this.skeletonInfo.skeleton;
            let skins = [];
            if (this.skinName.indexOf(",") > -1) {
                skins = this.skinName.split(",");
                // @ts-ignore
                const newSkin = new spine.Skin("compound-skin")
                skins.forEach(element => {
                    const subskin = skeleton.data.findSkin(element);
                    newSkin.addSkin(subskin);
                });

                skeleton.setSkin(newSkin);

            } else {
                skins.push(this.skinName);
                skeleton.setSkinByName(this.skinName);
            }
            skeleton.setSlotsToSetupPose();
        }

        updateBounds() {
            const state = this.skeletonInfo.state;
            const skeleton = this.skeletonInfo.skeleton;
            state.apply(skeleton);
            skeleton.updateWorldTransform();
            // @ts-ignore
            var offset = new spine.Vector2();
            // @ts-ignore
            var size = new spine.Vector2();
            skeleton.getBounds(offset, size, []);

            this.skeletonInfo.bounds = {
                offset: offset,
                size: size
            };
        }

        updateCurrentAnimation(loop,start,trackIndex, animationName) {
            
            if (!this.skeletonInfo) return;
            if (!this.skeletonInfo.skeleton) return;
            if (!this.animationNames) return;
            if (!(this.animationNames.includes(animationName)))
            {
                if (this.debug) console.warn('[Spine] updateCurrentAnimation, animation does not exist.', animationName, this.uid);
                return;                
            }

            try {
                const state = this.skeletonInfo.state;
                const skeleton = this.skeletonInfo.skeleton;
                const track = state.tracks[trackIndex];

                let currentTime = 0;
                let currentRatio = 0;
                if (track) {
                    // calculate ratio and time
                    currentTime = track.trackTime;
                    if (track.animationEnd != track.animationStart && track.animationEnd > track.animationStart)
                    {
                        currentRatio = (track.animationLast+track.trackTime-track.trackLast)/(track.animationEnd-track.animationStart);
                    }
                }

                state.setAnimation(trackIndex, animationName, loop);
                
                switch (start)
                {
                    case 0: break; // Start from beginning
                    case 1: state.tracks[trackIndex].trackTime = currentTime; break;
                    case 2: state.tracks[trackIndex].trackTime = currentRatio * (state.tracks[trackIndex].animationEnd-state.tracks[trackIndex].animationStart); break;
                    default: break; 
                }

                // Record animation assigned for listener
                this.trackAnimations[trackIndex] = this.animationName;

                if (start == 0 || (start == 2 && currentRatio == 0))
                // If starting from beginning or 0 ratio add listners so they'll trigger at 0
                {
                    this.setTrackListeners(state, trackIndex);
                } else
                // If starting later, apply time, then enable listeners so they do not trigger on past events
                {
                    // state.apply(skeleton);
                    // skeleton.updateWorldTransform();
                    this.delayedTrackListeners.push(trackIndex);
                    // this.setTrackListeners(state, trackIndex);
                }
            } catch (ex) {
                if (this.debug)
                {
                    console.error('[Spine] setAnimation error', ex, trackIndex, animationName);
                }
                this.spineError = 'setAnimation error '+ex;
                // @ts-ignore
                this.Trigger(C3.Plugins.Gritsenko_Spine.Cnds.OnError);
            }
        }

        setTrackListeners(state, trackIndex)
        {
            if (!state || !state.tracks || !state.tracks[trackIndex]) {if(this.debug) {console.warn('[Spine] setTrackListners invalid', state, trackIndex)};return};

            state.tracks[trackIndex].listener = {
                complete: (trackEntry, count) => {
                    this.completeAnimationName = this.trackAnimations[trackEntry.trackIndex];
                    this.completeTrackIndex = trackEntry.trackIndex;
                    // @ts-ignore
                    this.Trigger(C3.Plugins.Gritsenko_Spine.Cnds.OnAnimationFinished);
                    // @ts-ignore
                    this.Trigger(C3.Plugins.Gritsenko_Spine.Cnds.OnAnyAnimationFinished);
                },
                event: (trackEntry, event) => {
                    this.completeEventName = event.data.name;
                    this.completeEventTrackIndex = trackEntry.trackIndex;
                    // @ts-ignore
                    this.Trigger(C3.Plugins.Gritsenko_Spine.Cnds.OnEvent);
                }
            };   
        }

        playAnimation() {
            this.isPlaying = true;
        }

        stopAnimation() {
            this.isPlaying = false;
        }

        async IsSpineReady() {
            if (this.sdkType._initFailed) return false;

            // Guard for case where sdkType does not exist (deleted on release)
            if (this.sdkType === null || this.sdkType === undefined)
            {
                if (this.debug) console.warn('[Spine] IsSpineReady, sdkType not defined', this.sdkType);
                if (globalThis.Sentry)
                {
                    globalThis.Sentry.captureException('[Spine] IsSpineReady, sdkType not defined:'+this.sdkType);
                }
                this.sdkType._initFailed = true;
                return false;
            }

            if (this.isLoaded) {
                return true;
            }

            // Init instance configuration
            // @ts-ignore
            if (!this.initInstanceInitialized)
            {
                this.initInstance();
            }

            // First instance to initialize becomes init owner
            if(this.sdkType._initOwner == -1)
            {
                this.sdkType._initOwner = this.uid;
                if (this.debug) console.info('[Spine] IsSpineReady, initOwner', this.uid, this.objectName, this.runtime.GetTickCount());
            }

            // Once per object, load texture assets, init spinebatcher
            if (!this.sdkType._texturesBatcherInitialized)
            {
                if(!this.sdkType._texturesBatcherInitializing && this.sdkType._initOwner == this.uid)
                {
                    this.sdkType._texturesBatcherInitializing = true;
                    if (this.runtime.IsPreview() || this.runtime._assetManager._isCordova)
                    {
                        await this.initTexturesBatcher();
                    } else
                    {
                        this.initTexturesBatcher();
                    }
                }
                return false;
            }

            const assetManager = this.sdkType._assetManager;
            const assetTag = this.sdkType._assetTag;

            // Once per object, wait for assets to complete loading
            if (!assetManager.isLoadingComplete(assetTag) && this.sdkType._initOwner == this.uid)
            {
                return false;
            }

            // Once per object, load skeletonData, load assets
            if (!this.sdkType._skeletonDataInitialized)
            {
                if(!this.sdkType._skeletonDataInitializing && this.sdkType._initOwner == this.uid)
                {
                    this.sdkType._skeletonDataInitializing = true;
                    this.loadSkeletonData();
                }
                return false;
            }

            // skeletonData ready to instantiate skelton instance
            this.loadSkeletons();

            // Create texture for Spine render and palette w/ texture
            this.createInstanceTexture();
            // @ts-ignore
            this.palette = new globalThis.SpinePalette(this.indexSize, this.paletteNumber);
            this.palette.createPaletteTexture(this.c3renderer);
            for(let i=0;i<this.paletteNumber;i++)
            {
                // Set default colors in each slot, scaling color shade down in each palette
                this.palette.setDefaultColors(i, (this.paletteNumber-i)/this.paletteNumber, 1.0);
            }
            spineBatcher.setInstancePalette(this.palette, this.uid);
            
            this.palette.uploadNeeded = true;
            console.log('[Spine] palette', this.palette, this.c3renderer);

            // Skeleton instance loading complete
            // @ts-ignore
            spineBatcher.setInstanceInitialized(this.GetInstance().GetUID());
            this.isLoaded = true;
            // @ts-ignore
            this.Trigger(C3.Plugins.Gritsenko_Spine.Cnds.OnSkeletonLoaded);
        }

        Release() {
            this.currentKey = null;
            this.currentValue = null;
            this.data = null;
            // @ts-ignore
            spineBatcher.removeInstance(this.GetInstance().GetUID());
            super.Release();
            if (this.c3renderer && this._elementTexture) this.c3renderer.DeleteTexture(this._elementTexture);
            this.canvas = null;
            this.bgColor = null;
            this.isPlaying = null;
            this.skeletonInfo = null;
            this.renderer = null;
            this.gl = null;
            this.atlasPath = null;
            this.jsonPath = null;
            this.atlasPath = null;
            this.pngPath = null;
            this.skinName = null;
            this.animationName = null;
            this.skeletonName = null;
            this.skeletonScale = null;
            this.premultipliedAlpha = null;
            this.collisionsEnabled = null;
            this.defaultMix = null;
            this.isMirrored = null;
            this._elementTexture = null
            this.pngURI = null;
            this.atlasURI = null;
            this.jsonURI = null;
            this.c3renderer = null;
            this.c3wgl = null;
            this.canvas = null;
            this.spineFB = null
            this.initSpineInProgress = null;
            this.completeAnimationName = null;
            this.spineError = null
            this.animationSpeed = null;
            this.completeEventName = null;
            this.skeletonRenderQuality = null;
            this.textureWidth = null;
            this.textureHeight = null;
            this.uid = null;
            this.customSkins = null;
            this.slotColors = null;
            this.slotDarkColors = null;
            this.spineBoneControl = null;
            this.paletteNumber = null;
            this.indexSize = null;
            this.palette = null;
            this.sdkType = null;
        }

        Tick() {
            // Async function, set this.isLoaded on completion
            this.IsSpineReady();

            if (!this.isLoaded) {
                return;
            }

            const delta = this.runtime.GetDt() * this.animationSpeed;
            var active = this.skeletonInfo;
            const state = this.skeletonInfo.state;

            // Check if onscreen
            // @ts-ignore
            let wi = this.GetWorldInfo();
            let layerRect = wi.GetLayer().GetViewport();
            let instanceRect = wi.GetBoundingBox();
            let onScreen = instanceRect.intersectsRect(layerRect);
            spineBatcher.setInstanceOnScreen(onScreen, this.uid);

            
            let tracksComplete = true;
            state.tracks.forEach((track) => {
                if (track) {
                    if (track.loop || !track.isComplete()) tracksComplete = false;
                }
            });
            tracksComplete = tracksComplete || !this.isPlaying;
            spineBatcher.setInstanceTracksComplete(tracksComplete, this.uid);

            let animationReduce = spineBatcher.debugVariables.animationReduce === "enable";
            let fullAnimation = this.isPlaying || this.animateOnce > 0;
            let reducededAnimation = this.animateOnce > 0 || (!tracksComplete && this.isPlaying);
            let animateFrame = animationReduce ? reducededAnimation : fullAnimation;
            // Debug feature, disable all animation
            animateFrame = animateFrame && !(spineBatcher.debugVariables.animationDisable === 'enable');

            if (animateFrame) {
                var animationDuration = state.getCurrent(0).animation.duration;
                active.playTime += delta;
                if (animationDuration > 0)
                {
                    while (active.playTime >= animationDuration)
                        active.playTime -= animationDuration;
                }
                state.update(delta);
                state.apply(active.skeleton);

                // Set track listeners if needed for set animation done w/ current time or current ratio
                // Set after update/apply so earlier events do not trigger
                if (this.delayedTrackListeners.length > 0)
                {
                    for (const trackIndex of this.delayedTrackListeners)
                    {
                        this.setTrackListeners(state, trackIndex);
                    }
                    // Remove elements
                    this.delayedTrackListeners.splice(0, this.setTrackListeners.length)
                }

                // Override bones under bone control
                this.spineBoneControl.applyBoneControl(active.skeleton);
                active.skeleton.updateWorldTransform();
                
                this.runtime.UpdateRender();
                if (this.animateOnce > 0)
                {
                    this.animateOnce -= delta;
                    if (this.animateOnce <= 0)
                    {
                        this.SetRenderOnce(0.0, false, this.uid);
                    }
                }
            }
        }

        SetRenderOnce(delay, enable, uid)
        {
            // Set maximum delay between ongoing and new
            if (delay > this.animateOnce) this.animateOnce = delay;

            spineBatcher.setInstanceRenderOnce(enable, uid);
        }

        Draw(renderer) {

            var  gl  =  renderer._gl

            if (!this.isLoaded) return; // Spine instance not loaded, can't draw

            var myCanvas = this.canvas;
            // @ts-ignore
            const wi = this.GetWorldInfo();
            const quad = wi.GetBoundingQuad();

            // Only call render once per tick for all instances
            if (spineBatcher.tickCount != this.runtime.GetTickCount())
            {
                spineBatcher.tickCount = this.runtime.GetTickCount()
                spineBatcher.drawBatch();
            }

            let x0 = 0;
            let x1 = 1;
            if (this.isMirrored) {
                x0 = 1;
                x1 = 0;
            }

            // Flip Y due to render to texture vs fb, Y is flipped
            const rcTex = new C3.Rect(x0, 1, x1, 0); // Possible to get from this._texture instead? Not needed, not spritesheeted?

            renderer.SetTexture(this._elementTexture);
    
            if (this.runtime.IsPixelRoundingEnabled()) {
                let tempQuad = new C3.Quad();
                const ox = Math.round(wi.GetX()) - wi.GetX();
                const oy = Math.round(wi.GetY()) - wi.GetY();
                tempQuad.copy(quad);
                tempQuad.offset(ox, oy);
                renderer.Quad3(tempQuad, rcTex);
            } else {
                renderer.Quad3(quad, rcTex);
            }

        }

        SaveToJson() {
            return {
                // data to be saved for savegames
            };
        }

        LoadFromJson(o) {
            // load state for savegames
        }

        GetDebuggerProperties() {
            return [{
                title: "Spine",
                properties: [
                    //{name: ".current-animation",	value: this._currentAnimation.GetName(),	onedit: v => this.CallAction(Acts.SetAnim, v, 0) },
                ]
            }];
        }

        GetValuePath(path, createPath)
		{
			let result = this.data;
			for (const p of path)
			{
				if(typeof result === 'object' && result !== null)
				{
					if(result.hasOwnProperty(p))
					{
						result = result[p];
					} else if (createPath)
					{
						let obj = {};
						result[p] = obj;
                        // @ts-ignore                        
						result = obj;
					} else
					{
						result = null;
						break;
					}
				}
			}
			return result;
		}

		SetValuePath(value, path)
		{
			let key = path.pop();
			if (key === '' || key === null) return false;
			let result = this.GetValuePath(path, true);
			if (typeof result === 'object' && result !== null)
			{
				result[key] = value;
				return true;
			}
			return false;
		}


        GetScriptInterfaceClass()
		{
            // @ts-ignore
			return self.ISpineInstance;
		}

        _getData()
        {
            return this.data;
        }

    };

	// Script interface. Use a WeakMap to safely hide the internal implementation details from the
	// caller using the script interface.
	const map = new WeakMap();
    // @ts-ignore
    self.ISpineInstance = class ISpineInstance extends self.IWorldInstance {
		constructor()
		{
			super();
            // Map by SDK instance
            // @ts-ignore
			map.set(this, self.IInstance._GetInitInst().GetSdkInstance());
            // @ts-ignore
		}

        get data()
		{
            return map.get(this)._getData();
		}
	};
}