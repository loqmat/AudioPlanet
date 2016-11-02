var gl;
var points;

// shaders
var program;

// vertex buffers
var will_brennan;
var tahsin_loqman;

// uniform variables
var u_color;
var u_image;

window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }


    // Four Vertices

    vertices = flatten([
        -0.5, -0.5, 
        -0.5,  0.5,
        0.5, 0.5,
        0.5, -0.5
    ]);
	tahsin_loqman = flatten([
		-0.3, -0.3,
		-0.3, 0.9,
		-0.9, 0.9,
		-0.9, -0.9,
		 0.9, -0.9,
		 0.9, -0.3
	]);

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );

    //  Load shaders and initialize attribute buffers

    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
	u_color = gl.getUniformLocation(program, "uColor");
	u_image = gl.getUniformLocation(program, "uImage");

    // Load the data into the GPU

    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, tahsin_loqman, gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    renderL();
};

function renderL() {
    gl.clear( gl.COLOR_BUFFER_BIT );
	
	gl.uniform3f(u_color, 1,0.7137,0.7568);
	gl.drawArrays( gl.TRIANGLE_FAN, 0, tahsin_loqman.length / 2 );
	
	gl.uniform3f(u_color, 0.5,0.5,1);
	gl.drawArrays( gl.LINE_LOOP, 0, tahsin_loqman.length / 2 );
}
function renderB {
	
}


function render() {
    var u_Rotation = gl.getUniformLocation(program, "uRotation");
    gl.uniform1f(u_Rotation, rotation);
    rotation += 0.1;
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.LINES, 0, tahsin_loqman.length / 2 );
    window.setTimeout(render, 60);
}
