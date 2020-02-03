class Vornoi2D {
    
    constructor() {
        this.scene = new THREE.Scene();

        this.frustumSize = 1;
        this.aspect = window.innerWidth / window.innerHeight;
        
        this.camera = new THREE.OrthographicCamera(this.frustumSize * this.aspect / -2, this.frustumSize * this.aspect / 2, this.frustumSize / 2, this.frustumSize / -2);
        this.camera.position.z = 1000;
        this.camera.lookAt(this.scene.position);

        this.colorHue = 2;
        this.colorPrime = 53;

        this.coneRadius = 0.3;
        this.coneHeight = 1;
        this.coneSegments = 64;

        this.pointRadius = 0.003;
        this.pointSegments = 8;

        this.factor = 1.0;
        this.screenWidth = window.innerWidth * this.factor;
        this.screenHeight = window.innerHeight * this.factor;

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(this.screenWidth, this.screenHeight);

        this.voroSegments = 0;
        this.cones = [];
        this.circles = [];

        this.pointsIndices = []; // Points members in this.cones and this.circles
        this.lineIndices = [];  // Line members in this.cones and this.circles

        this.lineFirstPoint = null;
        this.lineSecondPoint = null;
        this.lineProgressFlag = false;
        this.lineLevels = 5;
        var geometry = new THREE.CircleGeometry(this.pointRadius, this.pointSegments);
        var material = new THREE.MeshBasicMaterial({ color: new THREE.Color(this.getHSLColor(70)) });
        this.circleInProgress = new THREE.Mesh(geometry, material);

        geometry = new THREE.PlaneGeometry(10, 10);
        material = new THREE.MeshBasicMaterial({ color: new THREE.Color(this.getHSLColor(70)) });
        this.plane = new THREE.Mesh(geometry, material);
        this.scene.add(this.plane);

        document.body.appendChild(this.renderer.domElement);

    }

    getCoordsFromEvent(event) {
        var x = -1 * (this.screenWidth/2 - event.clientX) * this.frustumSize * this.aspect / this.screenWidth;
        var y = (this.screenHeight/2 - event.clientY) * this.frustumSize / this.screenHeight;
        return [x, y];
    }

    mouseMoveCallback(event) {
        var coords = this.getCoordsFromEvent(event);
        this.lineSecondPoint = new THREE.Vector2(coords[0], coords[1]);
    }

    addPointClickCallback(event) {
        var coords = this.getCoordsFromEvent(event);
        var x = coords[0];
        var y = coords[1];
        var point = new THREE.Vector2(x, y);

        if(this.lineProgressFlag == false) {
            this.lineFirstPoint = point;
            this.lineProgressFlag = true;

            this.circleInProgress.position.x = x;
            this.circleInProgress.position.y = y;
            this.circleInProgress.position.z = 5;

            this.addLine(this.lineFirstPoint, this.lineFirstPoint + 0.25, this.lineLevels);

            // this.scene.add(this.circleInProgress)
        }
        else {
            this.lineSecondPoint = point;
            // this.scene.remove(this.circleInProgress);

            this.lineProgressFlag = false;
            this.lineFirstPoint = null;
            this.lineSecondPoint = null;
        }
        // this.addPoint(point, this.getRandomColor());
    }

    render() {
        if(this.lineProgressFlag == true) {
            this.modifyLine(this.voroSegments - 1, this.lineFirstPoint, this.lineSecondPoint, this.lineLevels);
        }
        this.renderer.render(this.scene, this.camera);
    }

    getHSLColor(S) {
        this.colorHue = (this.colorHue + this.colorPrime) % 360;
        return "hsl(" + this.colorHue.toString(10) + ", " + S.toString(10) + "%, 70%)"; 
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
        var geometry = new THREE.CircleGeometry( this.pointRadius, this.pointSegments );
        var material = new THREE.MeshBasicMaterial( { color: 0x000000 } );
        this.circle = new THREE.Mesh( geometry, material );
        this.circle.position.x = point.x;
        this.circle.position.y = point.y;
        this.circle.position.z = 5;

        
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

        this.pointsIndices.push(this.voroSegments);
        this.voroSegments += 1;

        console.log(this.cones);

        this.scene.add(cone);
        this.scene.add(circle);
    }

    modifyLine(lineIndex, point1, point2, levels) {
        var line = this.makeLine(point1, point2, levels, [point1, point2]);

        for(var i = 0; i < this.cones[lineIndex].length; i++) {
            this.cones[lineIndex][i].position.x = line[i].x;
            this.circles[lineIndex][i].position.x = line[i].x;

            this.cones[lineIndex][i].position.y = line[i].y;
            this.circles[lineIndex][i].position.y = line[i].y;
        }
    }

    addLine(point1, point2, levels) {
        var line = this.makeLine(point1, point2, levels, [point1, point2]);
        console.log(line);

        this.cones[this.voroSegments] = [];
        this.circles[this.voroSegments] = [];

        // var color = this.getRandomColor();
        var color = new THREE.Color(this.getHSLColor(70));

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

        this.lineIndices.push(this.voroSegments);
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

// a = new THREE.Vector2(-0.25, 0.5)
// b = new THREE.Vector2(0.5, 0.5);

// V.addLine(a, b, 5);

// a = new THREE.Vector2(0, 0.4)
// b = new THREE.Vector2(0, -0.4);

// V.addLine(a, b, 5);


// a = new THREE.Vector2(-0.5, -0.5)
// b = new THREE.Vector2(0.25, -0.5);

// V.addLine(a, b, 5);

var animate = function () {
    requestAnimationFrame(animate);
    V.render();
};

document.addEventListener("click", mouseClick);
document.addEventListener("mousemove", mouseMove);

animate();

function mouseClick(event) {
    V.addPointClickCallback(event);
}

function mouseMove(event) {
    V.mouseMoveCallback(event);
}


