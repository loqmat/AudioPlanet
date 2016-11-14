//-------------------------------------------
// Computer Graphics Final Project
//-------------------------------------------
//  -- Will Brennan
//  -- Tahsin Loqman

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
var bufferBump = new Float32Array(1024);
var blurSize = 16;

var bumpBuffer = new Float32Array(3072);
var bumpRotation = [];

function getMusicFile() {
    
}
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
        var newBump = scaled_h * 0.25 + bufferBump[i] * (1.0-responseValue);
        
        bufferWave[i*2+1] = newWave;
        bufferBump[i]     = newBump;
    }
    
    for ( var i=0;i<1024;i++ ) {
        var xa = bumpRotation[i][0];
        var ya = bumpRotation[i][1];
        var za = bumpRotation[i][2];
        var theta = bumpRotation[i][3];
        
        var xp = bumpBuffer[i*3+0];
        var yp = bumpBuffer[i*3+1];
        var zp = bumpBuffer[i*3+2];
        
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
        
        bumpBuffer[i*3+0] = xf / wf;
        bumpBuffer[i*3+1] = yf / wf;
        bumpBuffer[i*3+2] = zf / wf;
    }
    
    gl.uniform1fv(sp_audio_data, bufferBump);
    gl.uniform3fv(sp_audio_bumps, bumpBuffer);
}
function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport( 0, 0, window.innerWidth, window.innerHeight );
}
function initWindow() {
    for (var i=0;i<1024;i++) {
        bufferWave[i*2+0] = i / 1024.0 * 1.8 - 0.9;
        bufferWave[i*2+1] = -0.9;
    }
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
    var audio = new Audio("./audio/Haunting.m4a");
    var ctx = new AudioContext();
    var audioSrc = ctx.createMediaElementSource(audio);
    var analyser = ctx.createAnalyser();
    audioSrc.connect(analyser);
    audioSrc.connect(ctx.destination);  
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
    vertices = flatten([
        -0.5, -0.5, 0,
        -0.5,  0.5, 1,
         0.5,  0.5, 2,
         0.5, -0.5, 3,
    ]);

    //  Configure WebGL
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);
    
    gl.enable(gl.BLEND);
    gl.blendEquation(gl.FUNC_SUBTRACT);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    
    ElementIndexUint = gl.getExtension("OES_element_index_uint");
    VertexArrayObjects = gl.getExtension("OES_vertex_array_object");

    //  Load shaders and initialize attribute buffers
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
	u_color = gl.getUniformLocation(program, "uColor");
    
    // Load the data into the GPU
    waveBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, waveBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, bufferWave, gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer  
    vPosition = gl.getAttribLocation( program, "vPosition" );
    
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
    sp_audio_bumps = gl.getUniformLocation( sphereProgram, "audioBumps" );
    
    for ( var i=0;i<1024;i++ ) {
        var bum = randomVector();
        var rot = randomVector();
            
        bumpBuffer[i*3+0] = bum[0];
        bumpBuffer[i*3+1] = bum[1];
        bumpBuffer[i*3+2] = bum[2];
        
        bumpRotation.push( [rot[0], rot[1], rot[2], randomValue() / 10.0] );
    }
    
    gl.uniform3fv(sp_audio_bumps, bumpBuffer);
    
    function runProgram() {
        gl.clear( gl.COLOR_BUFFER_BIT );
        
        drawWave();
        drawSphere();
        
        window.requestAnimationFrame(runProgram);
    }
    
    window.requestAnimationFrame(runProgram);
}

function drawWave() {
    gl.useProgram( program );
    
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, null );
    gl.bindBuffer( gl.ARRAY_BUFFER, waveBuffer );
    
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    gl.uniform4f(u_color, 1.0, 0.65, 0.8, 1);
    gl.bufferSubData( gl.ARRAY_BUFFER, 0, bufferWave );
    gl.drawArrays( gl.POINTS, 0, bufferWave.length / 2 );
    
    gl.disableVertexAttribArray( vPosition );
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