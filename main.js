//-------------------------------------------
// Computer Graphics Final Project
//-------------------------------------------
//  -- Will Brennan
//  -- Tahsin Loqman

var gl;
var canvas;
var buffer = new Float32Array(2048);
var blurSize = 8;

var getFiles;

function getMusicFile() {
    
}
function processAudio(unif, data) {
    var ang = 0.0;
    var dif = 2.0 * Math.PI / 1024.0;
    for (var i=0;i<Math.min(data.length, 1024);i++) {
        var counted = 0;
        var unscaled = 0;
        for ( var j=-blurSize;j<=blurSize;j++ ) {
            var ij = (i + j + 1024) % 1024;
            unscaled += data[ij] / 255.0;
            counted += 1;
        }
        var radius = unscaled / counted;
        
        buffer[i*2+0] = Math.cos(ang) * radius;
        buffer[i*2+1] = Math.sin(ang) * radius;
        ang += dif;
    }
}
function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport( 0, 0, window.innerWidth, window.innerHeight );
}
function initWindow() {
    getFiles = document.getElementById( "loadFile" );
    canvas = document.getElementById( "GLCanvas" );
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) {
        alert( "WebGL isn't available" );
    }
    resizeCanvas();
    initAudio(initGL());
}
function initAudio(GLData) {
    var audio = new Audio("./audio/Primadonna.m4a");
    var ctx = new AudioContext();
    var audioSrc = ctx.createMediaElementSource(audio);
    var analyser = ctx.createAnalyser();
    audioSrc.connect(analyser);
    audioSrc.connect(ctx.destination);  
    var frequencyData = new Uint8Array(analyser.frequencyBinCount);
    function renderFrame(data) {
        window.requestAnimationFrame(function(){
            renderFrame(data);
        });
        analyser.getByteFrequencyData(frequencyData);
        processAudio(data, frequencyData);
    }
    renderFrame(GLData);
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

    //  Load shaders and initialize attribute buffers
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
	u_color = gl.getUniformLocation(program, "uColor");
	u_image = gl.getUniformLocation(program, "uImage");

    // Load the data into the GPU
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, buffer, gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    
    function runProgram() {
        window.requestAnimationFrame(runProgram);
        
        gl.clear( gl.COLOR_BUFFER_BIT );
        
        gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
        gl.bufferSubData( gl.ARRAY_BUFFER, 0, buffer );
        gl.drawArrays( gl.LINE_STRIP, 0, buffer.length / 2 );
    }
    
    window.requestAnimationFrame(runProgram);
    return gl.getUniformLocation( program, "audioData" );
}

window.onload = initWindow;
window.onresize = resizeCanvas;























