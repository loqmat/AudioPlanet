//-------------------------------------------
// Computer Graphics Final Project
//-------------------------------------------
//  -- Will Brennan
//  -- Tahsin Loqman

// Global Variables

var gl;
var canvas;

var displayPoints = false;

var distance = 4;
var rotation = translate(0,0,0);

var getFiles;

var responseValue = 0.25;

var latBands = 128;
var lonBands = 128;

var bufferWave = new Float32Array(2048);
var bufferData = new Float32Array(1024);
var bufferImpulse = new Float32Array(1024);
var bufferBump = new Float32Array(3072);
var bufferBumpRotation = [];

var blurSize = 16;

var boxes = [];

// Global Functions

function processAudio(data) {
    for (var i=0;i<Math.min(data.length, 1024);i++) {
        var counted = 0;
        var unscaled = 0;
        for ( var j=-blurSize;j<=blurSize;j++ ) {
            var ij = i + j;
            if ( ij < 0 || ij >= 1024 )
                continue;
            unscaled += data[ij];
            counted += 1;
        }
        var height = unscaled / counted;
        var scaled_h = responseValue * height / 255.0;
        
        var newWave = scaled_h + bufferWave[i*2+1] * (1.0-responseValue);
        var newData = scaled_h * 0.25 + bufferData[i] * (1.0-responseValue);
        
        if ( newData > bufferData[i] )
            bufferImpulse[i] = Math.min(1.1 * bufferImpulse[i] + 0.1, 1.0 );
        else
            bufferImpulse[i] = 0.9 * bufferImpulse[i];
        
        bufferWave[i*2+1] = newWave;
        bufferData[i]     = newData;
    }
    
    console.log(bufferImpulse[0]);
    
    for ( var i=0;i<1024;i++ ) {
        var xa = bufferBumpRotation[i][0];
        var ya = bufferBumpRotation[i][1];
        var za = bufferBumpRotation[i][2];
        var theta = bufferBumpRotation[i][3];
        
        var xp = bufferBump[i*3+0];
        var yp = bufferBump[i*3+1];
        var zp = bufferBump[i*3+2];
        
        var a = vec3(xa,ya,za);
        var p = vec3(xp,yp,zp);
        
        var cos = Math.cos(theta);
        var inv_cos = 1.0 - cos;
        var sin = Math.sin(theta);
        
        var vdot = dot(a, p);
        var vcross = cross(a, p);
        
        var xf = xp * cos + vdot * xa * inv_cos + vcross[0] * sin;
        var yf = yp * cos + vdot * ya * inv_cos + vcross[1] * sin;
        var zf = zp * cos + vdot * za * inv_cos + vcross[2] * sin;
        var wf = Math.sqrt(xf*xf+yf*yf+zf*zf);
        
        bufferBump[i*3+0] = xf / wf;
        bufferBump[i*3+1] = yf / wf;
        bufferBump[i*3+2] = zf / wf;
    }
    gl.useProgram(sphereProgram);
    gl.uniform1fv(sp_audio_data, bufferData);
    gl.uniform1fv(sp_audio_impulse, bufferImpulse);
    gl.uniform3fv(sp_audio_bumps, bufferBump);
}
function initWindow() {
    getFiles = document.getElementById( "loadFile" );
    canvas = document.getElementById( "GLCanvas" );
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) {
        alert( "WebGL isn't available" );
    }
    resizeCanvas();
    
    var mouseDown = false;
    window.onmousedown = function(e) {
        if ( e.which == 1 )
            mouseDown = true;
    }
    window.onmouseup = function(e) {
        if ( e.which == 1 )
            mouseDown = false;
    }
    window.onmousemove = function(e) {
        if ( mouseDown ) {
            var dx = scaleValue(e.movementX, 18.0, 18.0);
            var dy = scaleValue(e.movementY, 18.0, 18.0);
            
            var qx = rotate(rad2deg(dx), vec3(0.0, 1.0, 0.0));
            var qy = rotate(rad2deg(dy), vec3(1.0, 0.0, 0.0));
            var qr = mult( qx, qy );
            
            rotation = mult( rotation, qr );
        }
    }
    canvas.onwheel = function(e) {
        var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
        distance = Math.max( 1.5, Math.min(10, distance - delta));
    }
    
    initGL();
    initAudio();

    document.addEventListener('mousedown', function(event) {
        console.log(event);
    })
    
    document.addEventListener('keydown', function(event) {
        if(event.keyCode == 37) {
            alert('Left was pressed');
        }
        else if(event.keyCode == 39) {
            alert('Right was pressed');
        } else if ( event.keyCode == 32 ) {
            displayPoints = !displayPoints;
        }
    });
}

function initAudio() {
    var audio = new Audio("./audio/Carousel.mp3");
    var ctx = new AudioContext();
    var audioSrc = ctx.createMediaElementSource(audio);
    var analyser = ctx.createAnalyser();
    audioSrc.connect(analyser);
    audioSrc.connect(ctx.destination);  
    console.log(analyser.frequencyBinCount);
    var frequencyData = new Uint8Array(analyser.frequencyBinCount);
    function renderFrame() {
        window.requestAnimationFrame(function(){ renderFrame(); });
        analyser.getByteFrequencyData(frequencyData);
        processAudio(frequencyData);
    }
    renderFrame();
    audio.play();
}

function initGL() {
    //  Configure WebGL
    setupGLParams();
    setupBoxProgram();
    setupWaveProgram();
    setupSphereProgram();
    
    boxes.push( [canvas.width - 158, (canvas.height - 58)/2, 150, 50] );

    function runProgram() {
        gl.clear( gl.COLOR_BUFFER_BIT );
        
        drawWave();
        drawSphere();
        drawBox();
        
        window.requestAnimationFrame(runProgram);
    }
    
    runProgram();
}
function setupGLParams() {
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);
    
    gl.enable(gl.BLEND);
    gl.blendEquation(gl.FUNC_SUBTRACT);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    
    ElementIndexUint = gl.getExtension("OES_element_index_uint");
    VertexArrayObjects = gl.getExtension("OES_vertex_array_object");
}
function setupBoxProgram() {
    // Load shaders and initialize attribute buffers
    boxProgram = initShaders ( gl, "box-vshader", "box-fshader" );
    gl.useProgram( boxProgram );
    var box = [
        vec2( 0, 0 ),
        vec2(  0,  1 ),
        vec2(  1, 1 ),
        vec2( 1, 0)
    ];
    
    // Load the data into the GPU
    boxBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, boxBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(box), gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer  
    bp_position = gl.getAttribLocation( boxProgram, "vPosition" );
    bp_color = gl.getUniformLocation( boxProgram, "uColor");
    bp_projection = gl.getUniformLocation( boxProgram, "uProjection");
    bp_model_view = gl.getUniformLocation( boxProgram, "uModelView");
    gl.uniform4f( bp_color,1,1,1,1 );
}

function setupWaveProgram() {
    //  Load shaders and initialize attribute buffers
    waveProgram = initShaders( gl, "wave-vshader", "wave-fshader" );
    gl.useProgram( waveProgram );
	u_color = gl.getUniformLocation(waveProgram, "uColor");
    
    // Load the data into the GPU
    waveBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, waveBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, bufferWave, gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer  
    vPosition = gl.getAttribLocation( waveProgram, "vPosition" );
}
function setupSphereProgram() {
    sphereProgram = initShaders( gl, "sphere-vshader", "sphere-fshader" );
    gl.useProgram(sphereProgram);
    sp_light_dir = gl.getUniformLocation(sphereProgram, "uLightDirection");
    
    modelViewMatrixLoc = gl.getUniformLocation( sphereProgram, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( sphereProgram, "projectionMatrix" );
    nMatrixLoc = gl.getUniformLocation( sphereProgram, "normalMatrix" );
    
    var sphereData = generatePTSphere(0.1,latBands,lonBands);
    
    sphereVertex = gl.createBuffer();
    sphereIndex = gl.createBuffer();
    
    gl.bindBuffer( gl.ARRAY_BUFFER, sphereVertex );
    gl.bufferData( gl.ARRAY_BUFFER, sphereData[0], gl.STATIC_DRAW );
    
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, sphereIndex );
    gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, sphereData[1], gl.STATIC_DRAW );
    
    sp_pos = gl.getAttribLocation( sphereProgram, "vPosition" );
    sp_uv = gl.getAttribLocation( sphereProgram, "vUV" );
    sp_audio_data = gl.getUniformLocation( sphereProgram, "audioData" );
    sp_audio_impulse = gl.getUniformLocation( sphereProgram, "audioImpulse" );
    sp_audio_bumps = gl.getUniformLocation( sphereProgram, "audioBumps" );
    sp_imp_gradient_colors = gl.getUniformLocation( sphereProgram, "impulseGradientColors" );
    sp_nrm_gradient_colors = gl.getUniformLocation( sphereProgram, "normalGradientColors" );
    
    for ( var i=0;i<1024;i++ ) {
        var bum = randomVector();
        var rot = randomVector();
        
        bufferWave[i*2+0] = i / 1024.0 * 1.8 - 0.9;
        bufferWave[i*2+1] = -0.9;
        bufferImpulse[i] = 0.0;
        
        bufferBump[i*3+0] = bum[0];
        bufferBump[i*3+1] = bum[1];
        bufferBump[i*3+2] = bum[2];
        
        bufferBumpRotation.push( [rot[0], rot[1], rot[2], randomValue() / 10.0] );
    }
    
    gl.uniform3fv(sp_audio_bumps, bufferBump);
    
    var normalColors = [vec3(0.0, 0.0, 1.0),
                        vec3(1.0, 0.0, 1.0),
                        vec3(1.0, 0.5, 0.8),
                        vec3(1.0, 1.0, 1.0)];
                        
    var impulseColors = [vec3(0.0, 1.0, 0.0),
                         vec3(0.4, 1.0, 0.4),
                         vec3(0.8, 1.0, 0.8),
                         vec3(1.0, 1.0, 1.0)];
                  
    gl.uniform3fv(sp_nrm_gradient_colors, flatten(normalColors));
    gl.uniform3fv(sp_imp_gradient_colors, flatten(impulseColors));
}

function drawBox() {
    gl.depthMask(false);
    gl.useProgram( boxProgram );
    gl.bindBuffer( gl.ARRAY_BUFFER, boxBuffer );

    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    for (var i=0; i<boxes.length; i++) {
        var x = boxes[i][0]
        var y = boxes[i][1]
        var w = boxes[i][2]
        var h = boxes[i][3]

        var boxProjection = ortho (0, canvas.width, 0, canvas.height, 0, 1);
        gl.uniformMatrix4fv ( bp_projection, false, flatten(boxProjection) ); 
        var boxModelView = mult( translate( x,y,0 ), scalem(w,h,1) );
        gl.uniformMatrix4fv ( bp_model_view, false, flatten(boxModelView) ); 

        gl.drawArrays( gl.LINE_LOOP, 0, 4 );
    }

    gl.disableVertexAttribArray( vPosition );
    gl.depthMask(true);
}

function drawWave() {
    gl.depthMask(false);
    gl.useProgram( waveProgram );
    
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, null );
    gl.bindBuffer( gl.ARRAY_BUFFER, waveBuffer );
    
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    gl.uniform4f(u_color, 1.0, 0.65, 0.8, 1);
    gl.bufferSubData( gl.ARRAY_BUFFER, 0, bufferWave );
    gl.drawArrays( gl.POINTS, 0, bufferWave.length / 2 );
    
    gl.disableVertexAttribArray( vPosition );
    gl.depthMask(true);
}

function drawSphere() {
    modelViewMatrix = mult( translate(0,0,-distance), rotation );
    projectionMatrix = perspective(70, window.innerWidth / window.innerHeight, 0.1, 100.0);
    normalViewMatrix = normalMatrix(modelViewMatrix);
    
    gl.useProgram(sphereProgram);
    
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(normalViewMatrix) );
        
    gl.uniform3f(sp_light_dir, 0.0, 0.7071, 0.7071);
    
    gl.bindBuffer( gl.ARRAY_BUFFER, sphereVertex );
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, sphereIndex );
    
    gl.vertexAttribPointer( sp_pos, 2, gl.FLOAT, false, 16, 0 );
    gl.enableVertexAttribArray( sp_pos );
    
    gl.vertexAttribPointer( sp_uv, 2, gl.FLOAT, false, 16, 8 );
    gl.enableVertexAttribArray( sp_uv );
    
    if ( displayPoints ) {
        gl.drawArrays( gl.POINTS, 0, 2 + latBands * lonBands );
    } else {
        gl.drawElements( gl.TRIANGLES, 6 * latBands * lonBands, gl.UNSIGNED_INT, 0 );
    }
    
    gl.disableVertexAttribArray( sp_pos );
    gl.disableVertexAttribArray( sp_uv );
}

window.onload = initWindow;
window.onresize = resizeCanvas;

// Utility Functions

function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport( 0, 0, window.innerWidth, window.innerHeight );
}

function scaleValue(x, div0, div1) {
    if ( x == 0 )
        return 0;
    else
        return Math.abs(x)/x * Math.sqrt(Math.abs(x) / div0) / div1;
}
function randomValue() {
    var w = 0;
    while ( w == 0 ) {
        w = Math.random() * Math.random();
    }
    return w;
}
function randomVector() {
    var w = 0;
    while ( w == 0 ) {
        var x = Math.random() * 2.0 - 1.0;
        var y = Math.random() * 2.0 - 1.0;
        var z = Math.random() * 2.0 - 1.0;
        
        w = Math.sqrt(x*x + y*y + z*z);
        
        if ( w != 0 )
            return [x/w,y/w,z/w];
    }
    return [1,0,0];
}