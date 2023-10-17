/* jshint esversion: 9 */
/* global THREE, AFRAME */



AFRAME.registerComponent("origin-on-ar-start", {
  init: function() {
    var self = this.el;

    this.el.sceneEl.addEventListener("enter-vr", function() {
      if (this.is("ar-mode")) {
        self.setAttribute('position', {x:0,y:0,z:0});
        self.setAttribute('rotation', {x:0,y:0,z:0});
      }
    });
  }
});


AFRAME.registerComponent("match-position-by-id", {
  schema: {
    default: ''
  },
  tick() {
    let obj;
    
    if (this.data === 'xr-camera') {
      const xrCamera = this.el.sceneEl.renderer.xr.getCameraPose();
      if (xrCamera) {
        this.el.object3D.position.copy(xrCamera.transform.position);
        this.el.object3D.quaternion.copy(xrCamera.transform.orientation);
        return;
      }
      obj = this.el.sceneEl.camera;
    } else {
      obj = document.getElementById(this.data).object3D;
    }
    if (obj) {
      this.el.object3D.position.copy(obj.position);
      this.el.object3D.quaternion.copy(obj.quaternion);
    }

  }
});





window.addEventListener("DOMContentLoaded", function() {
  const sceneEl = document.querySelector("a-scene");
  const message = document.getElementById("dom-overlay-message");
  const arContainerEl = document.getElementById("my-ar-objects");
  const cameraRig = document.getElementById("cameraRig");
  const building = document.getElementById("building");

  // Once the building has loaded update the relfections
  building.addEventListener('object3dset', function () {
    if (this.components && this.components.reflection) this.components.reflection.needsVREnvironmentUpdate = true;
  }, {once: true});
  
  const labels = Array.from(document.querySelectorAll('.pose-label'));
  for (const el of labels) {
    el.parentNode.addEventListener('pose', function (event) {
      el.setAttribute('text', 'value', event.detail.pose);
    });
    el.parentNode.addEventListener('gamepad', function (event) {
      el.setAttribute('text', 'value', event.detail.event);
    });
  }
  


  // If the user taps on any buttons or interactive elements we may add then prevent
  // Any WebXR select events from firing
  message.addEventListener("beforexrselect", e => {
    e.preventDefault();
  });




});

// Make the cheap windows look okay 
AFRAME.registerComponent('window-replace', {
  schema: {
    default: ''
  },
  init() {
    this.el.addEventListener('object3dset', this.update.bind(this));
    this.materials = new Map();
  },
  update() {
    const filters = this.data.trim().split(',');
    this.el.object3D.traverse(function (o) {
      if (o.material) {
        if (filters.some(filter => o.material.name.includes(filter))) {
          o.renderOrder = 1;
          const m = o.material;
          const sceneEl = this.el.sceneEl;
          o.material = this.materials.has(m) ?
            this.materials.get(m) :
            new THREE.MeshPhongMaterial({
              name: 'window_' + m.name,
              lightMap: m.lightmap || null,
              lightMapIntensity: m.lightMapIntensity,
              shininess: 90,
              color: '#ffffff',
              emissive: '#999999',
              emissiveMap: m.map,
              transparent: true,
              depthWrite: false,
              map: m.map,
              transparent: true,
              side: THREE.DoubleSide,
              get envMap() {return sceneEl.object3D.environment},
              combine: THREE.MixOperation,
              reflectivity: 0.6,
              blending: THREE.CustomBlending,
              blendEquation: THREE.MaxEquation,
              toneMapped: m.toneMapped
            });
          ;
          window.mat = o.material;
          this.materials.set(m, o.material);
        }
      }
    }.bind(this));
  }
});