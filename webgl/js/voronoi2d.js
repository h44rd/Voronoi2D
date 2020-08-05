// import { Scene, OrthographicCamera, WebGLRenderer, Object3D, PlaneGeometry, MeshBasicMaterial, Mesh, Vector2, Color, ConeGeometry, Vector3, LineBasicMaterial, BufferGeometry, Line, Shape, ExtrudeGeometry, OBJLoader } from '../node_modules/three/build/three.module';

var LIBRARY_URL = 'https://unpkg.com/three@0.119.1/'

import * as THREE from 'https://unpkg.com/three@0.119.1/build/three.module.js';
import { OBJLoader } from 'https://unpkg.com/three@0.119.1/examples/jsm/loaders/OBJLoader.js';


import { EffectComposer } from 'https://unpkg.com/three@0.119.1/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://unpkg.com/three@0.119.1/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'https://unpkg.com/three@0.119.1/examples/jsm/postprocessing/ShaderPass.js';

import { LuminosityShader } from 'https://unpkg.com/three@0.119.1/examples/jsm/shaders/LuminosityShader.js';
import { SobelOperatorShader } from 'https://unpkg.com/three@0.119.1/examples/jsm/shaders/SobelOperatorShader.js';

// import * as dat from 'https://cdnjs.cloudflare.com/ajax/libs/dat-gui/0.5/dat.gui.min.js';

var VoroGUI = function () {
    this.planeMode = false;
    this.treeMode = true;
    this.shape = 'normalCone';
    this.planeZ = 0.5;
    this.BoundariesEnabled = true;
}

var Vgui = new VoroGUI();
var gui = new dat.GUI();
var controller = gui.add(Vgui, 'planeMode', false);
var controller2 = gui.add(Vgui, 'treeMode', false);
var controller3 = gui.add(Vgui, 'shape', ['normalCone', 'starCone', 'plusCone', 'sixStarCone']);
var controller4 = gui.add(Vgui, 'planeZ', -1.0, 1.0);
var controller5 = gui.add(Vgui, 'BoundariesEnabled', true);
controller.listen();
controller2.listen();

class Vornoi2D {
    
    constructor() {
        this.scene = new THREE.Scene();

        this.frustumSize = 1;
        this.aspect = window.innerWidth / window.innerHeight;
        
        this.camera = new THREE.OrthographicCamera(this.frustumSize * this.aspect / -2, this.frustumSize * this.aspect / 2, this.frustumSize / 2, this.frustumSize / -2);
        this.camera.position.z = 1000;
        this.camera.lookAt(this.scene.position);

        this.colorHue = 2;
        this.colorPrime = 73;

        this.coneRadius = 0.3;
        this.coneHeight = 1;
        this.coneSegments = 64;

        this.pointRadius = 0.003;
        this.pointSegments = 8;

        this.snap_distance = 0.1;

        this.factor = 1.0;
        this.screenWidth = window.innerWidth * this.factor;
        this.screenHeight = window.innerHeight * this.factor;

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(this.screenWidth, this.screenHeight);

        this.composer = new EffectComposer(this.renderer);
        var renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        var effectGrayScale = new ShaderPass(LuminosityShader);
        this.composer.addPass(effectGrayScale);

        var effectSobel = new ShaderPass(SobelOperatorShader);
        effectSobel.uniforms['resolution'].value.x = window.innerWidth * window.devicePixelRatio;
        effectSobel.uniforms['resolution'].value.y = window.innerHeight * window.devicePixelRatio;
        this.composer.addPass(effectSobel);
        this.boundariesEnabled = true;


        this.voroSegments = 0;
        this.cones = [];
        this.prisms = [];
        // this.circles = [];
        this.lineSegments = [];
        this.lineVertices = new Map(); // Maps vertices to colors

        this.pointsIndices = []; // Points members in this.cones and this.circles
        this.lineIndices = [];  // Line members in this.cones and this.circles

        this.curveProgressFlag = false;
        this.currentCurveColor = this.getHSLColor(70);

        this.lineFirstPoint = null;
        this.lineSecondPoint = null;
        this.lineProgressFlag = false;
        this.lineLevels = 5;

        this.lineSegmentWidth = 5;

        this.planeMode = false;
        this.treeMode = false;

        this.latestMouseCoords = null;

        this.planeMouseCoords = null;

        this.coneShape = 'normalCone';
        this.customConeLoaded = false;
        this.customCone = new THREE.Object3D();
        this.customCones = {
            'normalCone' : {
                isLoaded : false,
                coneObject : null
            },
            'starCone' : {
                isLoaded : false,
                coneObject : null
            },
            'plusCone' : {
                isLoaded : false,
                coneObject : null
            },
            'sixStarCone' : {
                isLoaded : false,
                coneObject : null
            }
        };

        this.prismGeometry = {};
        this.createPrismGeometry();

        // var geometry = new THREE.CircleGeometry(this.pointRadius, this.pointSegments);
        // var material = new THREE.MeshBasicMaterial({ color: this.getHSLColor(70)[0] });
        // this.circleInProgress = new THREE.Mesh(geometry, material);

        var geometry = new THREE.PlaneGeometry(10, 10);
        var material = new THREE.MeshBasicMaterial({ color: this.getHSLColor(70)[0] });
        this.plane = new THREE.Mesh(geometry, material);
        this.plane.position.z = 0.5;
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
        this.latestMouseCoords = new THREE.Vector2(coords[0], coords[1]);

        if(this.planeMode)
            this.movePlane(this.latestMouseCoords);
        else
            this.lineSecondPoint = this.latestMouseCoords;
    }

    keyboardEventCallback(event) {
        if(event.keyCode == 27){ // Esc
            this.stopCurveCallBack();
        }

        if(event.keyCode == 80){ // P
            this.planekeyCallBack();
        }

        if(event.keyCode == 84){ // T
            this.treekeyCallBack();
        }

        if(event.keyCode == 67) { // C
            loadCustomShape('normalCone');
        }
        
        if(event.keyCode == 88) { // X
            loadCustomShape('starCone');
        } 
        if(event.keyCode == 90) {  // Z
            loadCustomShape('plusCone');
        }
        if(event.keyCode == 86) {  // Z
            loadCustomShape('sixStarCone');
        }
    }

    stopCurveCallBack() {
        if(this.curveProgressFlag == true) {
            this.deleteLine(this.voroSegments - 1);
            this.curveProgressFlag = false;
            this.lineProgressFlag = false;
            // this.currentCurveColor = this.getHSLColor(70);
        }
    }

    planekeyCallBack() {
        this.planeMouseCoords = this.latestMouseCoords;

        this.planeMode = !this.planeMode;

        Vgui.planeMode = this.planeMode;
    }

    treekeyCallBack() {
        this.treeMode = !this.treeMode;
        Vgui.treeMode = this.treeMode;
    }

    deleteLine(lineIndex) {
        this.scene.remove(this.lineSegments[lineIndex]);
        this.lineSegments.splice(lineIndex);
        this.scene.remove(this.prisms[lineIndex]);
        for(var i = 0; i < this.cones[lineIndex].length; i++) {
            this.scene.remove(this.cones[lineIndex][i]);
            // this.scene.remove(this.circles[lineIndex][i]);
        }
    }

    movePlane(coords) {
        this.plane.rotation.y =  coords.x;
        this.plane.rotation.x = -1 * (coords.y);
    }

    addPointClickCallback(event) {
        var coords = this.getCoordsFromEvent(event);
        var x = coords[0];
        var y = coords[1];
        var point = new THREE.Vector2(x, y);


        // this.circleInProgress.position.x = x;
        // this.circleInProgress.position.y = y;
        // this.circleInProgress.position.z = 5;
        
        if(this.lineProgressFlag == false) {
            this.lineFirstPoint = point;
            this.lineProgressFlag = true;
            this.curveProgressFlag = true;

            if(this.treeMode) {
                // this.treeMode = false;
                // Vgui.treeMode = false;

                // TODO: Replace following code with `getClosestExistingVertex`

                if(this.lineVertices.size > 0) {
                    var minDistance = Infinity;
                    var firstPoint;
                    var color;


                    for(let [key, value] of this.lineVertices) {
                        console.log(key);
                        console.log("Distance: " + point.distanceTo(key));
                        if(point.distanceTo(key) < minDistance) {
                            
                            minDistance = point.distanceTo(key);

                            firstPoint = key;
                            color = value;
                            console.log(key);
                        }
                    }
                
                    console.log("Firstpoint :" + minDistance);
                    this.lineFirstPoint = firstPoint;
                    this.currentCurveColor = color;
                    this.lineSecondPoint = point;

                    this.addLine(this.lineFirstPoint, this.lineSecondPoint, this.lineLevels, this.currentCurveColor);
                }
                
            } else {
                // this.currentCurveColor = new THREE.Color(this.getHSLColor(70));
                console.log("First point!");
                this.currentCurveColor = this.getHSLColor(70);
                this.addLine(this.lineFirstPoint, this.lineFirstPoint + 0.25, this.lineLevels, this.currentCurveColor);

                // this.scene.add(this.circleInProgress)
            }

        }
        else {
            this.lineSecondPoint = point;
            // this.scene.remove(this.circleInProgress);
            console.log("First point: ");
            console.log(this.lineVertices);
            this.lineVertices.set(this.lineFirstPoint, this.currentCurveColor);
            this.lineVertices.set(this.lineSecondPoint, this.currentCurveColor);

            if(this.curveProgressFlag == true) {
                this.lineFirstPoint = this.lineSecondPoint;
                this.addLine(this.lineFirstPoint, this.lineFirstPoint + 0.25, this.lineLevels, this.currentCurveColor);
            }

            // this.lineProgressFlag = false;
            // this.lineFirstPoint = null;
            // this.lineSecondPoint = null;
        }
        // this.addPoint(point, this.getRandomColor());
    }

    render() {
        if(this.lineProgressFlag == true) {
            this.modifyLine(this.voroSegments - 1, this.lineFirstPoint, this.lineSecondPoint, this.lineLevels);
        }
        if(this.boundariesEnabled == true) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }

    getHSLColor(S) {
        this.colorHue = (this.colorHue + this.colorPrime) % 360;
        console.log(this.colorHue);

        var color1 = new THREE.Color("hsl(" + this.colorHue.toString(10) + ", " + S.toString(10) + "%, 70%)");
        var color2 = new THREE.Color("hsl(" + this.colorHue.toString(10) + ", " + (S - 40).toString(10) + "%, 60%)");

        return [color1, color2];
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
        // var geometry = new THREE.CircleGeometry( this.pointRadius, this.pointSegments );
        // var material = new THREE.MeshBasicMaterial( { color: 0x000000 } );
        // this.circle = new THREE.Mesh( geometry, material );
        // this.circle.position.x = point.x;
        // this.circle.position.y = point.y;
        // this.circle.position.z = 5;


        var geometry = new THREE.ConeGeometry(this.coneRadius, this.coneHeight, this.coneSegments);
        var material = new THREE.MeshBasicMaterial({
            color: color,
            polygonOffset: true,
            polygonOffsetFactor: 1, // positive value pushes polygon further away
            polygonOffsetUnits: 1
        });
        this.cone = new THREE.Mesh(geometry, material);
        
        if(this.coneShape != 'normalCone' && this.customCones[this.coneShape].isLoaded == true) {
            this.cone = new THREE.Object3D().copy(this.customCones[this.coneShape].coneObject);
            // console.log(this.cone);
            this.cone.children[0].material = material;
            this.cone.children[0].scale.y = this.aspect;

            this.cone.children[0].scale.y *= 0.3;
            this.cone.children[0].scale.x *= 0.3;
            this.cone.children[0].scale.z *= 0.3;

            // this.cone.scale.z = 0.5;
            // this.cone.scale = 0.5 * this.cone.scale;
        }
        this.cone.position.x = point.x;
        this.cone.position.y = point.y;
        this.cone.position.z = this.coneHeight / 2;
        this.cone.rotation.x = Math.PI/2;

        // return {cone: this.cone, circle: this.circle };
        return {cone: this.cone};
    }

    addPoint(point, color) {
        var seed = this.makeSeed(point, color);
        // var circle = seed.circle;
        var cone = seed.cone;
        
        this.cones[this.voroSegments] = [];
        // this.circles[this.voroSegments] = [];
        this.cones[this.voroSegments].push(cone);
        // this.circles[this.voroSegments].push(circle);

        this.pointsIndices.push(this.voroSegments);
        this.voroSegments += 1;

        console.log(this.cones);

        this.scene.add(cone);
        // this.scene.add(circle);
    }

    modifyLine(lineIndex, point1, point2, levels) {
        // var line = this.makeLine(point1, point2, levels, [point1, point2]);

        // this.lineSegments[lineIndex].v1 = point1;
        // this.lineSegments[lineIndex].v2 = point2;
        var snap_information = this.getClosestExistingVertex(point2);

        if(snap_information.snap_possible) {
            if(point2.distanceTo(snap_information.snap_point) <= this.snap_distance) {
                point2 = snap_information.snap_point;
            }
        }
        
        var points = [];
        points.push( new THREE.Vector3( point1.x, point1.y, 5 ) );
        points.push( new THREE.Vector3( point2.x, point2.y, 5 ) );
        
        this.lineSegments[lineIndex].geometry.setFromPoints(points);

        this.cones[lineIndex][0].position.x = point1.x;
        this.cones[lineIndex][0].position.y = point1.y;
        this.cones[lineIndex][1].position.x = point2.x;
        this.cones[lineIndex][1].position.y = point2.y;

        var negative_point_v2 = new THREE.Vector2(point2.x, point2.y);
        negative_point_v2.negate();
        var vec1_2 = new THREE.Vector2();
        vec1_2.addVectors(point1, negative_point_v2);
        this.prisms[lineIndex].rotation.y = Math.atan(vec1_2.y / vec1_2.x) + Math.PI / 2;
        if(vec1_2.x >= 0) {
            this.prisms[lineIndex].rotation.y += Math.PI;
        }
        this.prisms[lineIndex].scale.z = point1.distanceTo(point2);
        this.prisms[lineIndex].position.set(point1.x, point1.y, 0);


        // for(var i = 0; i < this.cones[lineIndex].length; i++) {
        //     this.cones[lineIndex][i].position.x = line[i].x;
        //     // this.circles[lineIndex][i].position.x = line[i].x;

        //     this.cones[lineIndex][i].position.y = line[i].y;
        //     // this.circles[lineIndex][i].position.y = line[i].y;
        // }
    }

    addLine(point1, point2, levels, color) {
        var line = this.makeLine(point1, point2, levels, [point1, point2]);
        console.log(color);

        this.cones[this.voroSegments] = [];
        // this.circles[this.voroSegments] = [];
        

        var material = new THREE.LineBasicMaterial( { color: color[1],
                                                      linewidth: this.lineSegmentWidth } );
        var points = [];
        points.push( new THREE.Vector3( point1.x, point1.y, 5 ) );
        points.push( new THREE.Vector3( point2.x, point2.y, 5 ) );
        var geometry = new THREE.BufferGeometry().setFromPoints( points );

        var lineSegment = new THREE.Line( geometry, material );

        if(this.boundariesEnabled == false) {
            this.scene.add(lineSegment);
        }
        
        this.lineSegments[this.voroSegments] = lineSegment;


        // var color = this.getRandomColor();
        // var color = new THREE.Color(this.getHSLColor(70));

        var seed, cone;

        seed = this.makeSeed(point1, color[0]);
        cone = seed.cone;
        this.cones[this.voroSegments].push(cone);
        this.scene.add(cone);

        seed = this.makeSeed(point2, color[0]);
        cone = seed.cone;
        this.cones[this.voroSegments].push(cone);
        this.scene.add(cone);

        var prism = this.makePrism(point1, point2, color[0]);
        this.prisms[this.voroSegments] = prism;
        this.scene.add(prism);

        
        // for(var i = 0; i < line.length; i++) {
        //     seed = this.makeSeed(line[i], color[0]);
        //     // circle = seed.circle;
        //     cone = seed.cone;
            
        //     this.cones[this.voroSegments].push(cone);
        //     // this.circles[this.voroSegments].push(circle);

        //     this.scene.add(cone);
        //     // this.scene.add(circle);
        // }

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

    removeLineSegments() {
        for(var i = 0; i < this.lineSegments.length; i++) {
            this.scene.remove(this.lineSegments[i]);
        }
    }

    displayLineSegments() {
        for(var i = 0; i < this.lineSegments.length; i++) {
            this.scene.add(this.lineSegments[i]);
        }
    }

    createPrismGeometry() {
        var shape = new THREE.Shape();
        shape.moveTo(-1 * this.coneRadius, 0);
        shape.lineTo(0, this.coneHeight);
        shape.lineTo(this.coneRadius, 0);
        shape.lineTo(-1 * this.coneRadius, 0);

        this.prismGeometry = new THREE.ExtrudeGeometry(shape, {amount: 1, bevelEnabled: false});
    }

    makePrism(point_v1, point_v2, prism_color) {
        var material = new THREE.MeshBasicMaterial({
            color: prism_color,
            polygonOffset: true,
            polygonOffsetFactor: 1, // positive value pushes polygon further away
            polygonOffsetUnits: 1
        });

        var prism = new THREE.Mesh(this.prismGeometry, material);
        prism.position.set(point_v1.x, point_v1.y, 0.0);
        prism.scale.z = point_v1.distanceTo(point_v2);
        prism.rotateX(Math.PI / 2);

        return prism;
    }

    getClosestExistingVertex(point) {
        if(this.lineVertices.size <= 0) {
            return {
                snap_possible: false,
                snap_point : null,
                snap_color : null
            };
        }
        var minDistance = Infinity;
        var firstPoint;
        var color;

        for(let [key, value] of this.lineVertices) {
            console.log(key);
            console.log("Distance: " + point.distanceTo(key));
            if(point.distanceTo(key) < minDistance) {
                
                minDistance = point.distanceTo(key);

                firstPoint = key;
                color = value;
                console.log(key);
            }
        }
        return {
            snap_possible: true,
            snap_point : firstPoint,
            snap_color : color
        };
    }

}

var V = new Vornoi2D();

// var firstSeed = V.makeSeed(new THREE.THREE.Vector2(0,0) , V.getRandomColor());
// V.scene.add(firstSeed.cone);

// a = new THREE.THREE.Vector2(-0.25, 0.5)
// b = new THREE.THREE.Vector2(0.5, 0.5);

// V.addLine(a, b, 5);

// a = new THREE.THREE.Vector2(0, 0.4)
// b = new THREE.THREE.Vector2(0, -0.4);

// V.addLine(a, b, 5);


// a = new THREE.THREE.Vector2(-0.5, -0.5)
// b = new THREE.THREE.Vector2(0.25, -0.5);

// V.addLine(a, b, 5);

var angle = 0;
var animate = function () {
    requestAnimationFrame(animate);
    // firstSeed.cone.rotateZ(0.01);
    V.render();
    // V.camera.position.y = 5 * Math.sin(angle);
    // V.camera.position.z = 5 * Math.cos(angle);
    // V.camera.lookAt(new THREE.THREE.Vector3(0,0,0));
    // angle += 0.01;
};

document.addEventListener("click", mouseClick);
document.addEventListener("mousemove", mouseMove);
document.body.onkeyup = function(e){
    V.keyboardEventCallback(e);
}

animate();

window.oncontextmenu = function () // Right mouse button callback
{
    V.stopCurveCallBack();
    return false;
}

function mouseClick(event) {
    if(!V.planeMode) {
        console.log(V.planeMode)
        V.addPointClickCallback(event);
    }
}

function mouseMove(event) {
    V.mouseMoveCallback(event);
}

controller.onChange(function(value) {
    V.planeMode = value;
});

controller2.onChange(function(value) {
    V.treeMode = value;
});

controller3.onChange(function(value) {
    loadCustomShape(value);
});

controller4.onChange(function(value) {
    V.plane.position.z = value;
});

// Boundaries controller
controller5.onChange(function(value) {
    V.boundariesEnabled = value;
    if(value == true) {
        V.removeLineSegments();
    } else {
        V.displayLineSegments();
    }
});



function loadCustomShape(objectType) {
    V.coneShape = objectType;
    // V.customConeLoaded = false;

    if(!V.customCones[objectType] == null) {
        V.customCones[objectType].isLoaded = false;
        V.customCones[objectType].coneObject = null;
    }

    if(objectType != 'normalCone') {

        if(V.customCones[objectType].isLoaded != true) {
            
            var loader = new OBJLoader();

            var shapeFile;

            if(objectType == 'starCone') {
                shapeFile = 'https://raw.githubusercontent.com/h44rd/Voronoi2D/gh-pages/webgl/models/star.obj';
            }
            if(objectType == 'plusCone') {
                shapeFile = 'https://raw.githubusercontent.com/h44rd/Voronoi2D/gh-pages/webgl/models/plus.obj';
            }
            if(objectType == 'sixStarCone') {
                shapeFile = 'https://raw.githubusercontent.com/h44rd/Voronoi2D/gh-pages/webgl/models/sixStar.obj';
            }

            loader.load(
                shapeFile,
                function(object) {
                    V.customCones[objectType].isLoaded = true;
                    V.customCones[objectType].coneObject = object;
                    
                    // V.coneShape = objectType;
                    // V.scene.remove(firstSeed.cone);
                    // firstSeed = V.makeSeed(new THREE.THREE.Vector2(0,0) , V.getRandomColor());
                    // V.scene.add(firstSeed.cone);
                },
                function (xhr){
                    console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
                },
                function ( error ) {
                    console.log( 'An error happened' );
                }
            );    
        }
        
    }
}