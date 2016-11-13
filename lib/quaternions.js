var Quaternion = function( i,j,k,w ) {
    var length = Math.sqrt( i*i+j*j+k*k+w*w );
    if ( length == 0 ) {
        this.i = 0;
        this.j = 0;
        this.k = 0;
        this.w = 1;	
    } else {
        this.i = i / length;
        this.j = j / length;
        this.k = k / length;
        this.w = w / length;
    }
};

Quaternion.AxisAngle = function( axis, angle ) {
    if ( angle == 0 )
        return new Quaternion(0,0,0,1);
    else {
        var s = Math.sin(angle / 2.0);
        return new Quaternion(axis[2]*s,
                              axis[1]*s,
                              axis[0]*s,
                              Math.cos(angle/2.0));
    }
};

Quaternion.prototype = {
    toMatrix: function() {
        var q0q1 = 2*this.i*this.j;
        var q0q2 = 2*this.i*this.k;
        var q0q3 = 2*this.i*this.w;
        var q1q1 = 2*this.j*this.j;
        var q1q2 = 2*this.j*this.k;
        var q1q3 = 2*this.j*this.w;
        var q2q2 = 2*this.k*this.k;
        var q2q3 = 2*this.k*this.w;
        var q3q3 = 2*this.w*this.w;
        var m = [ vec4( 1 - q2q2 - q3q3, q1q2 + q0q3, q1q3 - q0q2, 0 ),
                  vec4( q1q2 - q0q3, 1 - q1q1 - q3q3, q2q3 + q0q1, 0 ),
                  vec4( q1q3 + q0q2, q2q3 - q0q1, 1 - q1q1 - q2q2, 0 ),
                  vec4( 0,           0,           0,               1 ) ];
        m.matrix = true;
        return m;
    },
    mult: function( q ) {
        return new Quaternion( this.j*q.i + this.i*q.j + this.k*q.w - this.w*q.k,
                               this.k*q.i + this.i*q.k + this.w*q.j - this.j*q.w,
                               this.w*q.i + this.i*q.w + this.j*q.k - this.k*q.j,
                               this.i*q.i - this.j*q.j - this.k*q.k - this.w*q.w );
    }
};