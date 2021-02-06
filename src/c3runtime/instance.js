"use strict";
{
    const C3 = self.C3;
    const spineBatcher = globalThis.spineBatcher;
    
    C3.Plugins.Gritsenko_Spine.Instance = class SpineInstance extends C3.SDKWorldInstanceBase {

        constructor(inst, properties) {
            super(inst);


            this.canvas = null;
            this.bgColor = null;
            this.isPlaying = true;
            this.instance = inst;

            this.isSkeletonLoaded = false;
            this.skeletonInfo = null;
            this.renderer = null;
            this.gl = null;
            this.uid = this.GetInstance().GetUID();
            this.customSkins = {};
            this.slotColors = {};
            this.slotDarkColors = {};
            this.isLoaded = false;
            this.animateOnce = 0;
            this.trackAnimations = {};
            this.skinNames = [];
            this.delayedTrackListeners = [];

            this.atlasPath = "";

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
            this._elementId = "";

            this._elementTexture = null


            this.pngURI = ""
            this.atlasURI = ""
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

            const wi = this.GetWorldInfo();
            // Enable collisions based on property, add ACEs if needed
            wi.SetCollisionEnabled(this.collisionsEnabled);

            this._StartTicking();

        }

        // spineDemos.log = true
        // Initialize project files URIs

        initInstance()
        {
            this.initSpineInProgress = true;
            this._elementId = 1; // XXX remove when possible
            // Init Spine elements
            this.mvp = new spine.webgl.Matrix4();
            this.mvp.ortho2d(0, 0, 0, 0); // Texture size unknown at this point
            this.gl = this.runtime.GetWebGLRenderer()._gl;
            this.canvas = this.gl._canvas;
            // this.initTexturesBatcher();
        }

        async initTexturesBatcher() {
            this._sdkType._texturesBatcherInitializing = true;
            // Init spineBatcher (only initializes once)
            spineBatcher.init(this.canvas, this.runtime);
            await this.loadSkeletonTextures();
            this._sdkType._texturesBatcherInitialized = true;
            this._sdkType._texturesBatcherInitializing = false;
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
            this._sdkType._assetManager = new spine.SharedAssetManager();
            this._sdkType._assetTag = this.uid;
            const assetManager = this._sdkType._assetManager;
            const assetTag = this._sdkType._assetTag;
            const gl = this.gl;
            
            if (this.debug) console.info(this.GetInstance().GetUID(),'[Spine] Loading skeleton, textures, json, atlas');
            // Only load textures once for creation of skeletonData, not for each instance
            // Disable PMA when loading Spine textures
            spine.webgl.GLTexture.DISABLE_UNPACK_PREMULTIPLIED_ALPHA_WEBGL = true;
            
            // Path translation for json and atlast (1:1)
            this.atlasURI = await this.runtime._assetManager.GetProjectFileUrl(this.atlasPath);
            this._sdkType._assetPaths[this.atlasURI] = this.atlasURI;
            this._sdkType._assetPaths[this.atlasPath] = this.atlasURI;
            this.jsonURI = await this.runtime._assetManager.GetProjectFileUrl(this.jsonPath);
            this._sdkType._assetPaths[this.jsonURI] = this.jsonURI;
            this._sdkType._assetPaths[this.jsonPath] = this.jsonURI;

            assetManager.loadJson(assetTag, this.jsonURI);

            let textureLoader = function(img) { return new spine.webgl.GLTexture(gl, img); };

            // Load multiple textures and set up path translation (for C3 preview with 'blob' URIs)
            let assetPaths = this.pngPath.split(",");
            for(let i=0;i<assetPaths.length;i++)
            {
                this.pngURI = await this.runtime._assetManager.GetProjectFileUrl(assetPaths[i]);
                this._sdkType._assetPaths[assetPaths[i]] = this.pngURI;
                assetManager.loadTexture(assetTag, textureLoader, this.pngURI);
            }

            assetManager.loadText(assetTag, this.atlasURI);
        }

        loadSkeletonData()
        {
            const assetManager = this._sdkType._assetManager;;
            const assetTag = this._sdkType._assetTag;
            const self = this;

            const atlasURI = assetManager.get(assetTag, this.atlasURI);
            this._sdkType._atlas = new spine.TextureAtlas(atlasURI, function(path) {
                return assetManager.get(self._sdkType._assetTag, self._sdkType._assetPaths[path]);
            });
            this._sdkType._atlasLoader = new spine.AtlasAttachmentLoader(this._sdkType._atlas);

            this._sdkType._skeletonJson = new spine.SkeletonJson(this._sdkType._atlasLoader);
            this._sdkType._skeletonJson.scale = this.skeletonRenderQuality;
            // JSON file with one skeleton, no name
            this._sdkType._jsonURI = this.jsonURI;
            if (this.skeletonName == "")
            {
                this._sdkType._skeletonData = this._sdkType._skeletonJson.readSkeletonData(assetManager.get(assetTag, this.jsonURI));
            } else
            {
                this._sdkType._skeletonData = this._sdkType._skeletonJson.readSkeletonData(assetManager.get(assetTag, this.jsonURI) [this.skeletonName] );
            }
            this._sdkType._skeletonDataInitialized = true;
            this._sdkType._skeletonDataInitializing = false;
        }

        loadSkeletons() {

            this.skeletonInfo = this.loadSkeleton(this.skeletonName, this.animationName);
            this.skeletonInfo.premultipliedAlpha = this.premultipliedAlpha;

            const skins = this.skeletonInfo.skeleton.data.skins;
            this.skinNames = skins.map(x => x.name);

            const animations = this.skeletonInfo.skeleton.data.animations;
            this.animationNames = animations.map(x => x.name);

            this.isSkeletonLoaded = true;

            this.resize();

            spineBatcher.addInstance(this.skeletonInfo, this.skeletonScale, this.GetInstance().GetUID());
            this.spineBoneControl = new SpineBoneControl(this.debug);
        }

        loadSkeleton(name, animationName, sequenceSlots) {
            if (this.debug) console.info("[Spine] Reading skeleton data:", this.uid, name, animationName);
            // If skeletonData not initialized, create it and stop other instances from creating it

            let skeleton = new spine.Skeleton(this._sdkType._skeletonData);
            let subskin = skeleton.data.findSkin(this.skinName);
            if (subskin === undefined) {
                subskin = skeleton.data.skins[0];
            }

            skeleton.setSkin(subskin);

            let stateData = new spine.AnimationStateData(this._sdkType._skeletonData);
            stateData.defaultMix = this.defaultMix;

            var state = new spine.AnimationState(stateData);
            state.setAnimation(0, animationName, true);
            // Record animation assigned for listener
            this.trackAnimations[0] = this.animationName;
            state.tracks[0].listener = {
                complete: (trackEntry, count) => {
                    this.completeAnimationName = this.trackAnimations[0];
                    this.completeTrackIndex = trackEntry.trackIndex;
                    this.Trigger(C3.Plugins.Gritsenko_Spine.Cnds.OnAnimationFinished);
                    this.Trigger(C3.Plugins.Gritsenko_Spine.Cnds.OnAnyAnimationFinished);
                },
                event: (trackEntry, event) => {
                    this.completeEventName = event.data.name;
                    this.completeEventTrackIndex = trackEntry.trackIndex;
                    this.Trigger(C3.Plugins.Gritsenko_Spine.Cnds.OnEvent);
                }
            };

            state.apply(skeleton);
            skeleton.updateWorldTransform();
            var offset = new spine.Vector2();
            var size = new spine.Vector2();
            skeleton.getBounds(offset, size, []);

            var skeletonBounds = new spine.SkeletonBounds();

            if(this.keepAspectRatio){
                var wi = this.GetWorldInfo();
                offset = {x : offset.x - wi._w/2, y: offset.y};
                size = {x : wi._w, y: wi._h};
            }

            return {
                atlas: this._sdkType._atlas,
                skeleton: skeleton,
                state: state,
                playTime: 0,
                bounds: {
                    offset: offset,
                    size: size
                },
                atlasLoader : this._sdkType._atlasLoader,
                skeletonBounds: skeletonBounds,
                stateData: stateData
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
            if (this.debug)
            {
                console.info('[Spine] CreateDynamicTexture x,y:', Math.round(this.textureWidth), Math.round(this.textureHeight), this.uid, this.runtime.GetTickCount());
            }
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
            spineBatcher.setInstanceFB(this.spineFB, this.GetInstance().GetUID())
        }

        updateCurrentSkin() {

            const state = this.skeletonInfo.state;
            const skeleton = this.skeletonInfo.skeleton;
            let skins = [];
            if (this.skinName.indexOf(",") > -1) {
                skins = this.skinName.split(",");
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
            var offset = new spine.Vector2();
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
                this.Trigger(C3.Plugins.Gritsenko_Spine.Cnds.OnError);
            }
        }

        setTrackListeners(state, trackIndex)
        {
            state.tracks[trackIndex].listener = {
                complete: (trackEntry, count) => {
                    this.completeAnimationName = this.trackAnimations[trackEntry.trackIndex];
                    this.completeTrackIndex = trackEntry.trackIndex;
                    this.Trigger(C3.Plugins.Gritsenko_Spine.Cnds.OnAnimationFinished);
                    this.Trigger(C3.Plugins.Gritsenko_Spine.Cnds.OnAnyAnimationFinished);
                },
                event: (trackEntry, event) => {
                    this.completeEventName = event.data.name;
                    this.completeEventTrackIndex = trackEntry.trackIndex;
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

        IsSpineReady() {
            const assetManager = this._sdkType._assetManager;
            const assetTag = this._sdkType._assetTag;

            if (this.isSkeletonLoaded) {
                return true;
            }

            // Init instance configuration
            if (!this.initInstanceInitialized)
            {
                this.initInstance();
            }

            // Once per object, load texture assets, init spinebatcher
            if (!this._sdkType._texturesBatcherInitialized)
            {
                if(!this._sdkType._texturesBatcherInitializing)
                {
                    this._sdkType._texturesBatcherInitializing = true;
                    this.initTexturesBatcher();
                }
                return false;
            }

            // Once per object, wait for assets to complete loading
            if (!assetManager.isLoadingComplete(assetTag))
            {
                return false;
            }

            // Once per object, load skeletonData, load assets
            if (!this._sdkType._skeletonDataInitialized)
            {
                if(!this._sdkType._skeletonDataInitializing)
                {
                    this._sdkType._skeletonDataInitializing = true;
                    this.loadSkeletonData();
                }
                return false;
            }

            // skeletonData ready to instantiate skelton instance
            this.loadSkeletons();

            // Create texture for Spine render
            this.createInstanceTexture();

            // Skeleton instance loading complete
            spineBatcher.setInstanceInitialized(this.GetInstance().GetUID());
            this.isLoaded = true;
            this.Trigger(C3.Plugins.Gritsenko_Spine.Cnds.OnSkeletonLoaded);
        }

        Release() {
            spineBatcher.removeInstance(this.GetInstance().GetUID());
            super.Release();
            if (this.c3renderer && this._elementTexture) this.c3renderer.DeleteTexture(this._elementTexture);
            this.canvas = null;
            this.bgColor = null;
            this.isPlaying = null;
            this.isSkeletonLoaded = null;
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
            this._elementId = null;
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
        }

        Tick() {
            if (!this.IsSpineReady()) {
                return;
            }

            const delta = this.runtime.GetDt() * this.animationSpeed;
            var active = this.skeletonInfo;
            const state = this.skeletonInfo.state;

            // Check if onscreen
            let wi = this.GetWorldInfo();
            let layerRect = wi.GetLayer().GetViewport();
            let instanceRect = wi.GetBoundingBox();
            let onScreen = instanceRect.intersectsRect(layerRect);
            // console.info('[Spine] onscreen, rects', onScreen, layerRect, instanceRect);
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

            if (this._elementId == "" || !this.isSkeletonLoaded) return; // elementID not set, can't draw the element

            var myCanvas = this.canvas;

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

    };
}