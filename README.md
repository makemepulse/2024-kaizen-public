# gl_starter

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).



### Features


#### Dev / Debug mode

Dev tools and debug code can be enabled by setting the `VUE_APP_DEBUG` environment flag to `true`. Ifdef-loader is used to ensure no debug code remain in production. To add debug code make sure to wrap it inside a `/// #if DEBUG` ... `/// #endif` block.

Note : You can use `Gui` and `DebugDraw` features outside DEBUG block. They are removed from production but but replaced by dummy/noop implementation 

#### GUI (tweakpane)

The module `gui` provide a way to add DatGui like controls (using Tweakpane). It's available even when DEBUG is disabled, but replaced by noop dummy. Decorators are also provided for convenience.
Some examples are available [here](src/webgl/samples/devtools/GuiTestObject.ts)

#### Debug Camera

The renderer have initilly 2 cameras, a main camera and a debug one. You can switch camera in the Gui. The Debug camera provide 2 different control scheme (3DSMax and Blender) you can change the scheme in the .env  files by editing `VUE_APP_DEV_CAMERA_SCHEME` var.
   
#### Shaders and programs live reload

Glsl can be imported as modules, and provide HMR fonctionnalities. 

The [Minimal drawcall](src/webgl/samples/lowlevel/MinimalDrawcallSample.ts) sample create a program which recompile when the glsl file are edited.
The [Disolve FX](src/webgl/samples/custom_material/disolve_fx/DisolveFX.ts) show how to implement shader HMR when using shader Chunk on materials

#### Assets loading

Textures and Gltfs can be loaded as Resource objects. ( See the resources API `src/resources`). 

  - A `Resource` manage it's loading lifecycle. It can be loaded, cancelled and unloaded. See a basic loading the [Minimal Sample](src/webgl/samples/resources/MinimalResourceSample.ts), anf more advanced cancellation managment in [Cancelation Sample](src/webgl/samples/resources/CancellationSample.ts)
  - Resources can be grouped in ResourceGroup to simplify loading of multiple resources
  - TextureResources implement the source-set concept. Various formats of a texture can be provided. The first one available will be used. This is managed automatically for textures in the `src/assets` folder, loaded with `AssetDatabase.getTexture()`. 
  - Currently supported texture formats are jpg, png, webp, basis, etc1(ktx), dxt5/bc3(ktx), pvrtc(ktx)
  - `TextureResources` created using `AssetDatabase.getTexture()` provide HMR functionality. They can be edited and hot reloaded. See the [Minimal Sample](src/webgl/samples/resources/MinimalResourceSample.ts). Note that only jpg/png version is reloaded.


#### Image based lighting (Ibls)

The project is setup to support 2 formats of Ibl textures. 
  - A PMREM format: 256x256, RGBM16, 5 mip levels. Loaded as 30 webp or png files. Only supported on Webgl2
  - A 2:1 ration octahedral format (OCTA): 8levels of 512x256 RGBM16, assembled in a single 512x2048 texture (webp/png). Used as fallback

Additionaly, Irradiance data is provided as a 3 bands Spherical Harmonics in a txt file.

API:
  `Ibl`: represent an IBL in a `LightSetup`, can be added like other Punctual Lights. A `LightSetup` suport only one Ibl.
  `IblResource`: a `Resource<Ibl>` to help you load Ibls. It handle octa/pmrem and png/webp switch based on capabilities. 

Examples: 
  [PmremIblSample](src/webgl/samples/ibl/PmremIblSample.ts) and [OctaIblSample](src/webgl/samples/ibl/OctaIblSample.ts)

#### Samples


 