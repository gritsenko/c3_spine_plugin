"use strict"; {
    // const DOM_COMPONENT_ID = "gritsenko-spine";
    C3.Plugins.Gritsenko_Spine.Instance = class SpineInstance extends C3.SDKWorldInstanceBase {
        //C3.Plugins.Gritsenko_Spine.Instance = class SpineInstance extends C3.SDKDOMInstanceBase {

        constructor(inst, properties) {
            super(inst);


            this.DEMO_NAME = "Hero";
            this.canvas = null;
            this.bgColor = null;
            this.isPlaying = true;
            this.instance = inst;

            this.assetManager = null;
            this.isSkeletonLoaded = false;
            this.isSkeletonLoading = false;
            this.isSpineInitialized = false;
            this.skeletonInfo = null;
            this.renderer = null;
            this.gl = null;
            this.uid = this.GetInstance().GetUID();
            this.customSkins = {};
            this.slotColors = {};
            this.slotDarkColors = {};
            this.isLoaded = false;

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
            this._newElementId = false


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
        async initSpine() {
            this.initSpineInProgress = true;
            var uid = this.GetInstance().GetUID()
            this._elementId = uid;
            this.DEMO_NAME = this._elementId;

            // Get C3 canvas gl context
            // Context already exists and we want to use (for render to texture)
            this.canvas = this.c3wgl._gl.canvas;
            let config = {}
            this.gl = this.canvas.getContext("webgl2", config) || this.canvas.getContext("webgl", config) || canvas.getContext("experimental-webgl", config);
            let gl = this.gl

            // Init spineBatcher (only initializes once), add here after canvas, etc. are ready, adding inside type.js OnCreate() was too early for iOS (canvas not ready)
            spineBatcher.init(this.canvas, this.runtime);

            // Init Spine elements
            this.mvp = new spine.webgl.Matrix4();
            // this.shader = spine.webgl.Shader.newTwoColoredTextured(gl);
            // this.batcher = new spine.webgl.PolygonBatcher(gl);
            this.mvp.ortho2d(0, 0, 0, 0); // XXX Render to texture size unknown until skeleton loaded.
            // this.renderer = new spine.webgl.SkeletonRenderer(gl);
            // this.shapes = new spine.webgl.ShapeRenderer(gl);
            this.assetManager = new spine.SharedAssetManager();
            // this.bgColor = new spine.Color(0.0, 0.0, 0.0, 0.0);

            if (this._sdkType._skeletonData.notInitialized)
            {
                if (this.debug) console.log(this.GetInstance().GetUID(),'[Spine] Loading skeleton, textures, json, atlas');
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

                this.assetManager.loadJson(this.DEMO_NAME, this.jsonURI);

                let textureLoader = function(img) { return new spine.webgl.GLTexture(gl, img); };

                // Load multiple textures and set up path translation (for C3 preview with 'blob' URIs)
                let assetPaths = this.pngPath.split(",");
                for(let i=0;i<assetPaths.length;i++)
                {
                    this.pngURI = await this.runtime._assetManager.GetProjectFileUrl(assetPaths[i]);
                    this._sdkType._assetPaths[assetPaths[i]] = this.pngURI;
                    this.assetManager.loadTexture(this.DEMO_NAME, textureLoader, this.pngURI);
                }

                this.assetManager.loadText(this.DEMO_NAME, this.atlasURI);
            }
            this.isSpineInitialized = true; 
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

        loadSkeletons() {

            this.skeletonInfo = this.loadSkeleton(this.skeletonName, this.animationName);
            this.skeletonInfo.premultipliedAlpha = this.premultipliedAlpha;

            const skins = this.skeletonInfo.skeleton.data.skins;
            this.skinNames = skins.map(x => x.name);

            const animations = this.skeletonInfo.skeleton.data.animations;
            this.animationNames = animations.map(x => x.name);

            this.isSkeletonLoaded = true;
            this.isSkeletonLoading = false;

            this.resize();

            spineBatcher.addInstance(this.skeletonInfo, this.skeletonScale, this.GetInstance().GetUID())
        }

        loadSkeleton(name, animationName, sequenceSlots) {
            const assetManager = this.assetManager;
            const self = this;

            if (this.debug) console.log("[Spine] Reading skeleton data:", name, animationName);
            // If skeletonData not initialized, create it and stop other instances from creating it
            if (this._sdkType._skeletonData.notInitialized)
            {
                this._sdkType._skeletonData.notInitialized = false;
                const atlasURI = assetManager.get(this.DEMO_NAME, this.atlasURI);
                this._sdkType._atlas = new spine.TextureAtlas(atlasURI, function(path) {
                    return assetManager.get(self.DEMO_NAME, self._sdkType._assetPaths[path]);
                });
                this._sdkType._atlasLoader = new spine.AtlasAttachmentLoader(this._sdkType._atlas);
                let skeletonJson = new spine.SkeletonJson(this._sdkType._atlasLoader);
                skeletonJson.scale = this.skeletonRenderQuality;
                // JSON file with one skeleton, no name
                if (this.skeletonName == "")
                {
                    this._sdkType._skeletonData = skeletonJson.readSkeletonData(assetManager.get(this.DEMO_NAME, this.jsonURI));
                } else
                {
                    this._sdkType._skeletonData = skeletonJson.readSkeletonData(assetManager.get(this.DEMO_NAME, this.jsonURI) [name] );
                }
            }

            var skeleton = new spine.Skeleton(this._sdkType._skeletonData);
            let subskin = skeleton.data.findSkin(this.skinName);
            if (subskin === undefined) {
                subskin = skeleton.data.skins[0];
            }

            skeleton.setSkin(subskin);

            let stateData = new spine.AnimationStateData(this._sdkType._skeletonData);
            stateData.defaultMix = this.defaultMix;

            var state = new spine.AnimationState(stateData);
            state.setAnimation(0, animationName, true);
            state.tracks[0].listener = {
                complete: (trackEntry, count) => {
                    this.completeAnimationName = trackEntry.animation.name;
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

            if (this.debug) console.log('[Spine] track:', state.tracks[0]);

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

                if (start == 0 || (start == 2 && currentRatio == 0))
                // If starting from beginning or 0 ratio add listners so they'll trigger at 0
                {
                    state.tracks[trackIndex].listener = {
                        complete: (trackEntry, count) => {
                            this.completeAnimationName = trackEntry.animation.name;
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

                } else
                // If starting later, apply time, then enable listeners so they do not trigger on past events
                {
                    state.apply(skeleton);
                    skeleton.updateWorldTransform();
                    state.tracks[trackIndex].listener = {
                        complete: (trackEntry, count) => {
                            this.completeAnimationName = this.animationName;
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
            } catch (ex) {
                if (this.debug)
                {
                    console.error('[Spine] setAnimation error', ex, trackIndex, animationName);
                }
                this.spineError = 'setAnimation error '+ex;
                this.Trigger(C3.Plugins.Gritsenko_Spine.Cnds.OnError);
            }
        }

        playAnimation() {
            this.isPlaying = true;
        }

        stopAnimation() {
            this.isPlaying = false;
        }

        IsSpineReady() {
            if (this.isSkeletonLoaded) {
                return true;
            }

            if (this.isSkeletonLoading) {
                return false;
            }

            if (!this.isSpineInitialized) {
                if (!this.initSpineInProgress)
                    {
                        this.initSpine();
                    }
                return false;
            }

            if (!this.isSkeletonLoading && this.assetManager !== undefined && this.assetManager.isLoadingComplete(this._elementId)) {

                this.isSkeletonLoading = true;
                // Init and start render
                this.loadSkeletons();
            }
            return false;
        }

        Release() {
            spineBatcher.removeInstance(this.GetInstance().GetUID());
            super.Release();
            if (this.c3renderer && this._elementTexture) this.c3renderer.DeleteTexture(this._elementTexture);
            this.DEMO_NAME = null;
            this.canvas = null;
            this.bgColor = null;
            this.isPlaying = null;
            this.assetManager = null;
            this.isSkeletonLoaded = null;
            this.isSkeletonLoading = null;
            this.isSpineInitialized = null;
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
            this._newElementId = null;
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
            // console.log('[Spine] onscreen, rects', onScreen, layerRect, instanceRect);
            spineBatcher.setInstanceOnScreen(onScreen, this.uid);

            if (this.isPlaying) {

                var animationDuration = state.getCurrent(0).animation.duration;
                active.playTime += delta;
                if (animationDuration > 0)
                {
                    while (active.playTime >= animationDuration)
                        active.playTime -= animationDuration;
                }
                state.update(delta);
                state.apply(active.skeleton);
                active.skeleton.updateWorldTransform();
                this.runtime.UpdateRender();
            }
        }

        Draw(renderer) {

            var  gl  =  renderer._gl

            if (this._elementId == "" || !this.isSkeletonLoaded) return; // elementID not set, can't draw the element

            var myCanvas = this.canvas;

            const wi = this.GetWorldInfo();
            const quad = wi.GetBoundingQuad();

            // Create texture if it does not exist (could this be done in constructor?)
            if (this._elementTexture === null || this._newElementId) {

                if (this._elementTexture !== null) {
                    renderer.DeleteTexture(this._elementTexture);
                }
                this.c3renderer = renderer
                this._newElementId = false;

                var bounds = this.skeletonInfo.bounds;
                this.textureWidth = bounds.size.x;
                this.textureHeight = bounds.size.y;
                let sampling = this.runtime.GetSampling();
                let options =  { mipMap: false, sampling: sampling }
                if (this.debug)
                {
                    console.log('[Spine] CreateDynamicTexture x,y:', this.textureWidth, this.textureHeight);
                }
                this._elementTexture = renderer.CreateDynamicTexture(this.textureWidth, this.textureHeight, options);

                var oldFrameBuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
                // Create FB and bind texture to spineFB
                this.spineFB = gl.createFramebuffer();
                gl.bindFramebuffer(gl.FRAMEBUFFER, this.spineFB);
                // attach the texture as the first color attachment
                const attachmentPoint = gl.COLOR_ATTACHMENT0;
                gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, this._elementTexture._texture, 0);
                // Restore render to the canvas
                gl.bindFramebuffer(gl.FRAMEBUFFER, oldFrameBuffer);
                spineBatcher.setInstanceFB(this.spineFB, this.GetInstance().GetUID())
                spineBatcher.setInstanceInitialized(this.GetInstance().GetUID());
                this.isLoaded = true;
                this.Trigger(C3.Plugins.Gritsenko_Spine.Cnds.OnSkeletonLoaded);
            }

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