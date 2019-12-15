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
        this.addPoint(x, y, this.getRandomColor());
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

    addPoint(x, y, color) {
        this.pointRadius = 0.003;
        this.pointSegments = 32;

        var geometry = new THREE.CircleGeometry( this.pointRadius, this.pointSegments );
        var material = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
        this.circle = new THREE.Mesh( geometry, material );
        this.circle.position.x = x;
        this.circle.position.y = y;
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

        this.scene.add(this.cone);
        this.scene.add(this.circle);
    }

}

class PointVoronoi {
    constructor(x, y, color) {
        this.pointRadius = 0.003;
        this.pointSegments = 32;

        var geometry = new THREE.CircleGeometry( this.pointRadius, this.pointSegments );
        var material = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
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

var animate = function () {
    requestAnimationFrame(animate);
    V.render();
};

document.addEventListener("click", mouseClick);
animate();

function mouseClick(event) {
    V.addPointClickCallback(event);
}



