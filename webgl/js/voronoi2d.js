class Vornoi2D {
    
    constructor() {
        this.scene = new THREE.Scene();

        this.frustumSize = 1;
        this.aspect = window.innerWidth / window.innerHeight;
        
        this.camera = new THREE.OrthographicCamera(this.frustumSize * this.aspect / -2, this.frustumSize * this.aspect / 2, this.frustumSize / 2, this.frustumSize / -2);
        this.camera.position.z = 1000;
        this.camera.lookAt(this.scene.position);

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        this.voroSegments = 0;
        this.cones = [];
        this.circles = [];

        document.body.appendChild(this.renderer.domElement);

    }

    getCoordsFromEvent(event) {
        var x = -1 * (window.innerWidth/2 - event.clientX) * this.frustumSize * this.aspect / window.innerWidth;
        var y = (window.innerHeight/2 - event.clientY) * this.frustumSize / window.innerHeight;
        return [x, y];
    }

    addPointClickCallback(event) {
        var coords = this.getCoordsFromEvent(event);
        var x = coords[0];
        var y = coords[1];
        var point = new THREE.Vector2(x, y);
        this.addPoint(point, this.getRandomColor());
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    getRandomColor() {
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
          color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    makeSeed(point, color) {
        this.pointRadius = 0.003;
        this.pointSegments = 8;

        var geometry = new THREE.CircleGeometry( this.pointRadius, this.pointSegments );
        var material = new THREE.MeshBasicMaterial( { color: 0x000000 } );
        this.circle = new THREE.Mesh( geometry, material );
        this.circle.position.x = point.x;
        this.circle.position.y = point.y;
        this.circle.position.z = 5;

        this.coneRadius = 3;
        this.coneHeight = 1;
        this.coneSegments = 64;
        geometry = new THREE.ConeGeometry(this.coneRadius, this.coneHeight, this.coneSegments);
        material = new THREE.MeshBasicMaterial({
            color: color
        });
        this.cone = new THREE.Mesh(geometry, material);
        this.cone.position.x = point.x;
        this.cone.position.y = point.y;
        this.cone.rotation.x = Math.PI/2;

        return {cone: this.cone, circle: this.circle };
    }

    addPoint(point, color) {
        var seed = this.makeSeed(point, color);
        var circle = seed.circle;
        var cone = seed.cone;
        
        this.cones[this.voroSegments] = [];
        this.circles[this.voroSegments] = [];
        this.cones[this.voroSegments].push(cone);
        this.circles[this.voroSegments].push(circle);

        this.voroSegments += 1;

        console.log(this.cones);

        this.scene.add(cone);
        this.scene.add(circle);
    }

    addLine(point1, point2, levels) {
        var line = this.makeLine(point1, point2, levels, [point1, point2]);
        console.log(line);

        this.cones[this.voroSegments] = [];
        this.circles[this.voroSegments] = [];

        var color = this.getRandomColor();

        var seed, circle, cone;
        
        for(var i = 0; i < line.length; i++) {
            seed = this.makeSeed(line[i], color);
            circle = seed.circle;
            cone = seed.cone;
            
            this.cones[this.voroSegments].push(cone);
            this.circles[this.voroSegments].push(circle);

            this.scene.add(cone);
            this.scene.add(circle);
        }

        this.voroSegments += 1;
    }

    makeLine(point1, point2, levels, points) {
        if(levels < 0) {
            return -1;
        }
        var midpoint = new THREE.Vector2((point1.x + point2.x)/2, (point1.y + point2.y)/2)
        points.push(midpoint);
        this.makeLine(point1, midpoint, levels - 1, points);
        this.makeLine(midpoint, point2, levels - 1, points);
        return points;
    }

}

class PointVoronoi {
    constructor(x, y, color) {
        this.pointRadius = 0.003;
        this.pointSegments = 32;

        var geometry = new THREE.CircleGeometry( this.pointRadius, this.pointSegments );
        var material = new THREE.MeshBasicMaterial( { color: 0x000000 } );
        this.circle = new THREE.Mesh( geometry, material );
        this.circle.position.x = point.x;
        this.circle.position.y = point.y;
        this.circle.position.z = 5;

        this.coneRadius = 3;
        this.coneHeight = 1;
        this.coneSegments = 64;
        geometry = new THREE.ConeGeometry(this.coneRadius, this.coneHeight, this.coneSegments);
        material = new THREE.MeshBasicMaterial({
            color: color
        });
        this.cone = new THREE.Mesh(geometry, material);
        this.cone.position.x = x;
        this.cone.position.y = y;
        this.cone.rotation.x = Math.PI/2;
    }
}

V = new Vornoi2D();

a = new THREE.Vector2(0, 0)
b = new THREE.Vector2(1, 1);

V.addLine(a, b, 5);

var animate = function () {
    requestAnimationFrame(animate);
    V.render();
};

document.addEventListener("click", mouseClick);
animate();

function mouseClick(event) {
    V.addPointClickCallback(event);
}



