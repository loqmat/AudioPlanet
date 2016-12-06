//+-------------------------------------------+
//| Computer Graphics Final Project           |
//|     Will Brennan                          |
//|     Tahsin Loqman                         |
//|                                           |
//| setup.js                                  |
//|     * generate resources for various      |
//|       components of the program           |
//+-------------------------------------------+

function setupGLParams() {
    gl.enable(gl.DEPTH_TEST);
    
    gl.enable(gl.BLEND);
    
    //gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    
    ElementIndexUint = gl.getExtension("OES_element_index_uint");
    VertexArrayObjects = gl.getExtension("OES_vertex_array_object");
}

function setupPostprocess() {
    var createNewTexture = function() {
        var tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        return tex;
    }
    
    // Blur Kernel
    var kernel = [];
    for ( var i=-4;i<=4;i++ )
        kernel.push(gaussian(i, 4.0));
    
    // Blur X Shader
    ppBlurXProgram = initShaders( gl, "pp-vshader", "ppblurx-fshader" );
    
    gl.useProgram( ppBlurXProgram );
    pp_blurx_image = gl.getUniformLocation(ppBlurXProgram, "uImage");
    pp_blurx_image_size = gl.getUniformLocation(ppBlurXProgram, "uImageSize");
    pp_blurx_kernel = gl.getUniformLocation(ppBlurXProgram, "uKernel");
	pp_blurx_color = gl.getUniformLocation(ppBlurXProgram, "uColor");
    
    pp_blurx_position = gl.getAttribLocation(ppBlurXProgram, "vPosition");
    
    gl.uniform4f(pp_blurx_color, 1.0, 1.0, 1.0, 1.0);
    gl.uniform1i(pp_blurx_image, 0);
    gl.uniform1fv(pp_blurx_kernel, kernel);
    
    // Blur Y Shader
    ppBlurYProgram = initShaders( gl, "pp-vshader", "ppblury-fshader" );
    
    gl.useProgram( ppBlurYProgram );
    pp_blury_image = gl.getUniformLocation(ppBlurYProgram, "uImage");
    pp_blury_image_size = gl.getUniformLocation(ppBlurYProgram, "uImageSize");
    pp_blury_kernel = gl.getUniformLocation(ppBlurYProgram, "uKernel");
	pp_blury_color = gl.getUniformLocation(ppBlurYProgram, "uColor");
    
    pp_blury_position = gl.getAttribLocation(ppBlurYProgram, "vPosition");
    
    gl.uniform4f(pp_blury_color, 1.0, 1.0, 1.0, 1.0);
    gl.uniform1i(pp_blury_image, 0);
    gl.uniform1fv(pp_blury_kernel, kernel);
    
    // Final shader
    ppFinalProgram = initShaders( gl, "pp-vshader", "ppfinal-fshader" );
    
    gl.useProgram( ppFinalProgram );
    pp_final_image_post = gl.getUniformLocation(ppFinalProgram, "uPost");
    pp_final_image_orig = gl.getUniformLocation(ppFinalProgram, "uOriginal");
	pp_final_color = gl.getUniformLocation(ppFinalProgram, "uColor");
    pp_final_exposure = gl.getUniformLocation(ppFinalProgram, "uExposure");
    pp_final_position = gl.getAttribLocation(ppFinalProgram, "vPosition");
    
    gl.uniform4f(pp_final_color, 1.0, 1.0, 1.0, 1.0);
    gl.uniform1i(pp_final_image_orig, 0);
    gl.uniform1i(pp_final_image_post, 1);
    gl.uniform1f(pp_final_exposure, 1.5);
    
    // Primary color buffer
    pp_fbo_main = gl.createFramebuffer();
    pp_color_texture = createNewTexture();
    pp_depth_buffer = gl.createRenderbuffer();
    
    // First pass blur glow
    pp_fbo_blur_x = gl.createFramebuffer();
    pp_blur_x_texture = createNewTexture();
    
    // Second pass blur glow
    pp_fbo_blur_y = gl.createFramebuffer();
    pp_blur_y_texture = createNewTexture();
}

function setupBoxBuffer() {
    var box = [
        vec2( 0.25, 0 ),
        vec2( 0, 0.5 ),
        vec2( 0.25, 1 ),
        vec2(  0.75,  1 ),
        vec2(  1, 0.5 ),
        vec2( 0.75, 0)
    ];
    
    var drawbox = [
        vec2(0,0),
        vec2(0,1),
        vec2(1,1),
        vec2(1,0)
    ];
    var drawindices = new Uint32Array(6);
        drawindices[0] = 0;
        drawindices[1] = 3;
        drawindices[2] = 2;
        drawindices[3] = 2;
        drawindices[4] = 1;
        drawindices[5] = 0;

    var moo = [
        vec2( 0, 0 ),
        vec2( 0, 0 ),
        vec2( 0, 0 ),
        vec2( 0, 0 ),
        vec2( 0, 0 ),
        vec2( 0, 0 ),
        vec2( 0, 0 )
    ];

    progressBarBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, progressBarBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(moo), gl.STATIC_DRAW );
    
    // Load the data into the GPU
    boxBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, boxBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(box), gl.STATIC_DRAW );
    
    drawboxBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, drawboxBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(drawbox), gl.STATIC_DRAW );
    
    drawboxIndices = gl.createBuffer();
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, drawboxIndices );
    gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, drawindices, gl.STATIC_DRAW );
}

function setupBoxProgram() {
    // Load shaders and initialize attribute buffers
    boxProgram = initShaders ( gl, "box-vshader", "box-fshader" );
    gl.useProgram( boxProgram );

    // Associate out shader variables with our data buffer  
    bp_position = gl.getAttribLocation( boxProgram, "vPosition" );
    bp_color = gl.getUniformLocation( boxProgram, "uColor");
    bp_projection = gl.getUniformLocation( boxProgram, "uProjection");
    bp_model_view = gl.getUniformLocation( boxProgram, "uModelView");
}

function setupWaveProgram(sphereDef) {
    //  Load shaders and initialize attribute buffers
    waveProgram = initShaders( gl, "wave-vshader", "wave-fshader" );
    gl.useProgram( waveProgram );
	wp_color = gl.getUniformLocation(waveProgram, "uColor");
    
    // Load the data into the GPU
    waveBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, waveBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(audioConstElements), gl.DYNAMIC_DRAW );

    // Associate out shader variables with our data buffer  
    wp_position = gl.getAttribLocation( waveProgram, "vPosition" );
    
    gl.uniform4f(wp_color, 1.0, 0.65, 0.8, 1);
}

function setupSphere(sphereDef, program, size, h, spd) {
    var obj = new Object();
    
    gl.useProgram(program);
    obj.light_dir = gl.getUniformLocation(program, "uLightDirection");
    
    obj.model_view = gl.getUniformLocation( program, "modelViewMatrix" );
    obj.projection = gl.getUniformLocation( program, "projectionMatrix" );
    obj.normal_projection = gl.getUniformLocation( program, "normalMatrix" );
    
    var sphereData = generatePTSphere(0.1,sphereDef.latBands,sphereDef.lonBands);
    
    sphereDef.vertex = gl.createBuffer();
    sphereDef.indices = gl.createBuffer();
    
    gl.bindBuffer( gl.ARRAY_BUFFER, sphereDef.vertex );
    gl.bufferData( gl.ARRAY_BUFFER, sphereData[0], gl.STATIC_DRAW );
    
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, sphereDef.indices );
    gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, sphereData[1], gl.STATIC_DRAW );
    
    obj.pos = gl.getAttribLocation( program, "vPosition" );
    obj.uv = gl.getAttribLocation( program, "vUV" );
    obj.audio_elements = gl.getUniformLocation( program, "audioElements" );
    obj.audio_data = gl.getUniformLocation( program, "audioData" );
    obj.audio_impulse = gl.getUniformLocation( program, "audioImpulse" );
    obj.audio_bumps = gl.getUniformLocation( program, "audioBumps" );
    obj.base_height = gl.getUniformLocation( program, "baseHeight" );
    obj.base_point_size = gl.getUniformLocation( program, "basePointSize" );
    obj.height0 = gl.getUniformLocation( program, "heightScale0" );
    obj.height1 = gl.getUniformLocation( program, "heightScale1" );
    
    obj.imp_gradient_colors = gl.getUniformLocation( program, "impulseGradientColors" );
    obj.nrm_gradient_colors = gl.getUniformLocation( program, "normalGradientColors" );
    
    gl.uniform1f(obj.audio_elements, sphereDef.audioElements);
    gl.uniform1f(obj.base_height, size);
    gl.uniform1f(obj.base_point_size, 12.0);
    gl.uniform1f(obj.height0, h*h);
    gl.uniform1f(obj.height1, h);
    
    for ( var i=0;i<sphereDef.audioElements;i++ ) {
        var bum = randomVector();
        var rot = randomVector();
        
        sphereDef.bufferWave[i*2+0] = i / sphereDef.audioElements * 1.8 - 0.9;
        sphereDef.bufferWave[i*2+1] = 0.0;
        sphereDef.bufferImpulse[i] = 0.0;
        
        sphereDef.bufferBump[i*3+0] = bum[0];
        sphereDef.bufferBump[i*3+1] = bum[1];
        sphereDef.bufferBump[i*3+2] = bum[2];
        
        sphereDef.bufferBumpRotation.push( [rot[0], rot[1], rot[2], randomValue() / spd] );
    }
    
    gl.uniform3fv(obj.audio_bumps, sphereDef.bufferBump);
    gl.uniform3fv(obj.nrm_gradient_colors, flatten(normalColors[0]));
    gl.uniform3fv(obj.imp_gradient_colors, flatten(impulseColors[0]));
    
    return obj;
}

function setupSphereProgram() {
    sphereInnerProgram = modifySphereVertexShader("sphere-vshader", innerSphere.audioElements);
    sphereOuterProgram = modifySphereVertexShader("sphere-vshader", outerSphere.audioElements);
    
    sip = setupSphere(innerSphere, sphereInnerProgram, 0.25, 2.0,  100.0);
    sop = setupSphere(outerSphere, sphereOuterProgram, 1.0, 10.0, 10.0);
}

function setupMirror() {
    mirrorProgram = initShaders( gl, "mirror-vshader", "mirror-fshader" );
    gl.useProgram(mirrorProgram);
    
    var mirrorbuffer = [
        vec3(-1, 0,-1),
        vec3( 1, 0,-1),
        vec3( 1, 0, 1),
        vec3(-1, 0, 1)
    ];
    var mirrorindices = new Uint32Array(6);
        mirrorindices[0] = 0;
        mirrorindices[1] = 3;
        mirrorindices[2] = 2;
        mirrorindices[3] = 2;
        mirrorindices[4] = 1;
        mirrorindices[5] = 0;
    
    mirrorBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, mirrorBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(mirrorbuffer), gl.STATIC_DRAW );
    
    mirrorIndices = gl.createBuffer();
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, mirrorIndices );
    gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, mirrorindices, gl.STATIC_DRAW );
    
    mp_color = gl.getUniformLocation(mirrorProgram, "uColor");
    mp_model_view = gl.getUniformLocation(mirrorProgram, "modelViewMatrix");
    mp_projection = gl.getUniformLocation(mirrorProgram, "projectionMatrix");
    
    mp_position = gl.getAttribLocation(mirrorProgram, "vPosition");
}

function setupCube() {
    
    var cubebuffer = [
        -1.0, -1.0,  1.0,
        1.0, -1.0,  1.0,
        -1.0,  1.0,  1.0,
        1.0,  1.0,  1.0,
        -1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        -1.0,  1.0, -1.0,
        1.0,  1.0, -1.0,
    ];

    var cubeindices = [
        0, 1, 2, 3, 7, 1, 5, 4, 7, 6, 2, 4, 0, 1
    ];    
    
    cubeBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cubeBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(cubebuffer), gl.STATIC_DRAW );
    
    cubeIndices = gl.createBuffer();
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, cubeIndices );
    gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, Uint32Array.from(cubeindices), gl.STATIC_DRAW );
}