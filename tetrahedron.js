Tetrahedron = {
    model:{
        points:[],
        normals:[],
        index:0
    },
    triangle:function(a, b, c) {
         this.model.points.push(a);
         this.model.points.push(b);
         this.model.points.push(c);
         this.model.normals.push(a[0],a[1], a[2], 0.0);
         this.model.normals.push(b[0],b[1], b[2], 0.0);
         this.model.normals.push(c[0],c[1], c[2], 0.0);
         this.model.index += 3;
    },
    divideTriangle:function(a, b, c, count) {
        if ( count > 0 ) {

            var ab = mix( a, b, 0.5);
            var ac = mix( a, c, 0.5);
            var bc = mix( b, c, 0.5);

            ab = normalize(ab, true);
            ac = normalize(ac, true);
            bc = normalize(bc, true);

            this.divideTriangle( a, ab, ac, count - 1 );
            this.divideTriangle( ab, b, bc, count - 1 );
            this.divideTriangle( bc, c, ac, count - 1 );
            this.divideTriangle( ab, bc, ac, count - 1 );
        }
        else {
            this.triangle( a, b, c );
        }
    },
    create:function(a, b, c, d, n) {
        this.divideTriangle(a, b, c, n);
        this.divideTriangle(d, c, b, n);
        this.divideTriangle(a, d, b, n);
        this.divideTriangle(a, c, d, n);
    }
}