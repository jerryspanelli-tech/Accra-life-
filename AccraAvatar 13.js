// AccraAvatar.js (v2) - Stylized animated character built from code
// Black beanie, sunglasses, earring, baggy light-blue tee with fold lines and collar,
// baggy black pants with cuffs, gold chain + pendant + watch, white laced sneakers.
// Feet are at y = 0 of avatar.root.
import * as BABYLON from '@babylonjs/core';

const HIP = 0.98;

const ZERO_POSE = {
    bodyY: 0, pitch: 0,
    upperX: 0, upperY: 0,
    headX: 0, headY: 0,
    armL: 0, armR: 0, armLz: 0, armRz: 0,
    elbL: 0, elbR: 0,
    thL: 0, thR: 0, kL: 0, kR: 0,
};

export class AccraAvatar {
    // scale: 1 = about 2 units tall
    // faceMovement: turn toward the movement direction
    // beard: start with a beard (toggle later with setBeard)
    constructor(scene, { scale = 1, faceMovement = false, beard = false } = {}) {
        this.scene = scene;
        this.faceMovement = faceMovement;
        this.phase = 0;
        this.time = 0;
        this.speed = 0;
        this.state = 'IDLE';
        this.pose = { ...ZERO_POSE };
        this._last = null;
        this.useBlob = true;
        this._build();
        this.setBeard(beard);
        this.root.scaling.setAll(scale);
    }

    _mat(name, r, g, b, { emissive = 0, spec = 0.05 } = {}) {
        const m = new BABYLON.StandardMaterial(name, this.scene);
        m.diffuseColor = new BABYLON.Color3(r, g, b);
        m.specularColor = new BABYLON.Color3(spec, spec, spec);
        if (emissive) m.emissiveColor = new BABYLON.Color3(r * emissive, g * emissive, b * emissive);
        return m;
    }

    _node(name, parent, x = 0, y = 0, z = 0) {
        const n = new BABYLON.TransformNode(name, this.scene);
        n.parent = parent;
        n.position.set(x, y, z);
        return n;
    }

    _mesh(mesh, parent, x, y, z, mat) {
        mesh.parent = parent;
        mesh.position.set(x, y, z);
        mesh.material = mat;
        mesh.isPickable = false;
        return mesh;
    }

    _build() {
        const s = this.scene;
        const M = BABYLON.MeshBuilder;

        const skin = this._mat("avSkin", 0.72, 0.50, 0.34);
        const shirt = this._mat("avShirt", 0.62, 0.72, 0.88);
        const shirtDark = this._mat("avShirtDark", 0.50, 0.60, 0.76);
        const pants = this._mat("avPants", 0.06, 0.06, 0.08);
        const pantsDark = this._mat("avPantsDark", 0.12, 0.12, 0.15);
        const black = this._mat("avBlack", 0.04, 0.04, 0.05);
        black.backFaceCulling = false;
        const glass = this._mat("avGlass", 0.02, 0.02, 0.03, { spec: 0.7 });
        const gold = this._mat("avGold", 0.95, 0.75, 0.2, { emissive: 0.25, spec: 0.8 });
        const white = this._mat("avWhite", 0.95, 0.95, 0.95);
        const lace = this._mat("avLace", 0.78, 0.78, 0.82);
        const navy = this._mat("avNavy", 0.1, 0.2, 0.6);
        const earMat = this._mat("avEar", 1, 1, 1, { emissive: 0.8 });
        const lipMat = this._mat("avLip", 0.40, 0.18, 0.16);
        const browMat = this._mat("avBrow", 0.05, 0.04, 0.04);
        const beardMat = this._mat("avBeard", 0.05, 0.04, 0.04);
        beardMat.backFaceCulling = false;

        // Hierarchy: root > yaw > body (hips) > upper / legs
        this.root = M.CreateBox("avatarRoot", { size: 0.1 }, s);
        this.root.isVisible = false;
        this.root.isPickable = false;

        this.yaw = this._node("avYaw", this.root);
        this.body = this._node("avBody", this.yaw, 0, HIP, 0);
        this.upper = this._node("avUpper", this.body);

        // Blob shadow under the feet (works everywhere, even on weak phones)
        const blobMat = new BABYLON.StandardMaterial("avBlobMat", s);
        blobMat.diffuseColor = BABYLON.Color3.Black();
        blobMat.specularColor = BABYLON.Color3.Black();
        blobMat.disableLighting = true;
        blobMat.emissiveColor = BABYLON.Color3.Black();
        blobMat.alpha = 0.35;
        blobMat.backFaceCulling = false;
        this.blob = M.CreateDisc("avBlob", { radius: 0.5, tessellation: 24 }, s);
        this.blob.rotation.x = Math.PI / 2;
        this._mesh(this.blob, this.root, 0, 0.03, 0, blobMat);

        // Baggy torso + fold lines + collar
        const torso = M.CreateCapsule("avTorso", { height: 0.74, radius: 0.21 }, s);
        torso.scaling.z = 0.7;
        this._mesh(torso, this.upper, 0, 0.35, 0, shirt);

        const folds = [
            [-0.08, 0.24, 0.3], [0.07, 0.19, -0.3],
            [0.0, 0.11, 0.0], [-0.06, 0.31, -0.2], [0.08, 0.30, 0.25],
        ];
        folds.forEach(([x, y, rz], i) => {
            const f = M.CreateBox("avFold" + i, { width: 0.1, height: 0.012, depth: 0.012 }, s);
            this._mesh(f, this.upper, x, y, 0.143, shirtDark);
            f.rotation.z = rz;
        });

        this._mesh(M.CreateCylinder("avNeck", { diameter: 0.1, height: 0.1 }, s), this.upper, 0, 0.74, 0, skin);
        const collar = M.CreateTorus("avCollar", { diameter: 0.25, thickness: 0.035, tessellation: 24 }, s);
        this._mesh(collar, this.upper, 0, 0.68, 0.0, shirtDark);
        collar.rotation.x = 0.3;

        // Gold chain + pendant
        const chain = M.CreateTorus("avChain", { diameter: 0.36, thickness: 0.018, tessellation: 28 }, s);
        this._mesh(chain, this.upper, 0, 0.62, 0.0, gold);
        chain.rotation.x = 0.5;
        this._mesh(M.CreateSphere("avPendant", { diameter: 0.05 }, s), this.upper, 0, 0.51, 0.16, gold);

        // Head + face
        this.head = this._node("avHead", this.upper, 0, 0.87, 0);
        const face = M.CreateSphere("avFace", { diameter: 0.3 }, s);
        face.scaling.y = 1.12;
        this._mesh(face, this.head, 0, 0, 0, skin);
        this._mesh(M.CreateSphere("avNose", { diameter: 0.045 }, s), this.head, 0, -0.025, 0.145, skin);
        this._mesh(M.CreateBox("avMouth", { width: 0.07, height: 0.012, depth: 0.012 }, s), this.head, 0, -0.078, 0.136, lipMat);
        for (const side of [-1, 1]) {
            this._mesh(M.CreateBox("avBrow" + side, { width: 0.07, height: 0.014, depth: 0.015 }, s), this.head, side * 0.05, 0.052, 0.14, browMat);
            this._mesh(M.CreateSphere("avEar" + side, { diameter: 0.05 }, s), this.head, side * 0.15, -0.005, 0, skin);
            this._mesh(M.CreateBox("avTemple" + side, { width: 0.01, height: 0.012, depth: 0.12 }, s), this.head, side * 0.138, 0.0, 0.075, glass);
        }
        this._mesh(M.CreateBox("avShades", { width: 0.27, height: 0.05, depth: 0.04 }, s), this.head, 0, 0.0, 0.135, glass);
        this._mesh(M.CreateSphere("avEarring", { diameter: 0.035 }, s), this.head, 0.155, -0.045, 0.01, earMat);

        // Beard (optional, toggle with setBeard)
        this.beardMesh = M.CreateSphere("avBeardMesh", { diameter: 0.312, slice: 0.25 }, s);
        this.beardMesh.scaling.y = 1.12;
        this._mesh(this.beardMesh, this.head, 0, 0, 0, beardMat);
        this.beardMesh.rotation.x = Math.PI;

        // Beanie
        this._mesh(M.CreateSphere("avBeanie", { diameter: 0.33, slice: 0.5 }, s), this.head, 0, 0.1, 0, black);
        this._mesh(M.CreateCylinder("avBeanieCuff", { diameter: 0.335, height: 0.06 }, s), this.head, 0, 0.095, 0, black);

        // Arms: side -1 = left, +1 = right
        this.arms = {};
        for (const side of [-1, 1]) {
            const k = side < 0 ? "L" : "R";
            const shoulder = this._node("avShoulder" + k, this.upper, side * 0.29, 0.57, 0);
            this._mesh(M.CreateCapsule("avUpperArm" + k, { height: 0.38, radius: 0.085 }, s), shoulder, 0, -0.16, 0, shirt);
            this._mesh(M.CreateCylinder("avSleeveCuff" + k, { diameter: 0.2, height: 0.035 }, s), shoulder, 0, -0.33, 0, shirtDark);

            const elbow = this._node("avElbow" + k, shoulder, 0, -0.32, 0);
            this._mesh(M.CreateCapsule("avForearm" + k, { height: 0.36, radius: 0.058 }, s), elbow, 0, -0.15, 0, skin);
            this._mesh(M.CreateSphere("avHand" + k, { diameter: 0.11 }, s), elbow, 0, -0.34, 0, skin);
            if (side < 0) {
                this._mesh(M.CreateCylinder("avWatch", { diameter: 0.13, height: 0.05 }, s), elbow, 0, -0.27, 0, gold);
            }
            this.arms[k] = { shoulder, elbow };
        }

        // Legs: baggy pants with cuffs, laced sneakers
        this.legs = {};
        for (const side of [-1, 1]) {
            const k = side < 0 ? "L" : "R";
            const thigh = this._node("avThigh" + k, this.body, side * 0.11, 0, 0);
            this._mesh(M.CreateCapsule("avThighMesh" + k, { height: 0.5, radius: 0.13 }, s), thigh, 0, -0.23, 0, pants);

            const knee = this._node("avKnee" + k, thigh, 0, -0.45, 0);
            this._mesh(M.CreateCapsule("avShin" + k, { height: 0.5, radius: 0.115 }, s), knee, 0, -0.22, 0, pants);
            this._mesh(M.CreateCylinder("avCuff" + k, { diameter: 0.27, height: 0.07 }, s), knee, 0, -0.42, 0, pantsDark);

            this._mesh(M.CreateBox("avShoe" + k, { width: 0.15, height: 0.1, depth: 0.3 }, s), knee, 0, -0.47, 0.06, white);
            this._mesh(M.CreateBox("avStripe" + k, { width: 0.158, height: 0.03, depth: 0.12 }, s), knee, 0, -0.47, 0.04, navy);
            this._mesh(M.CreateBox("avSole" + k, { width: 0.155, height: 0.03, depth: 0.31 }, s), knee, 0, -0.515, 0.06, navy);
            for (let i = 0; i < 3; i++) {
                this._mesh(M.CreateBox("avLace" + k + i, { width: 0.08, height: 0.012, depth: 0.018 }, s), knee, 0, -0.418, 0.14 + i * 0.035, lace);
            }

            this.legs[k] = { thigh, knee };
        }
    }

    setBeard(on) {
        this.beardMesh.setEnabled(!!on);
    }

    // Real-time shadows from a DirectionalLight (e.g. your sun).
    // Also set ground.receiveShadows = true on your ground meshes.
    enableShadows(light, size = 1024) {
        const gen = new BABYLON.ShadowGenerator(size, light);
        gen.useBlurExponentialShadowMap = true;
        gen.blurKernel = 16;
        gen.setDarkness(0.4);
        this.root.getChildMeshes().forEach(m => {
            if (m.name !== "avBlob") gen.addShadowCaster(m);
        });
        this.shadowGenerator = gen;
        this.useBlob = false; // real shadow replaces the blob
        return gen;
    }

    // Call once per frame. forcedState: 'SWIM' / 'SWIMMING' / 'DANCE' override;
    // anything else = automatic idle / walk / run from movement speed.
    update(dt, forcedState = null) {
        dt = Math.min(Math.max(dt, 0.0001), 0.05);
        this.time += dt;

        const p = this.root.getAbsolutePosition();
        if (this._last) {
            const dx = p.x - this._last.x;
            const dz = p.z - this._last.z;
            const v = Math.hypot(dx, dz) / dt;
            this.speed += (v - this.speed) * Math.min(1, dt * 10);

            if (this.faceMovement && v > 0.5) {
                const target = Math.atan2(dx, dz);
                let d = target - this.yaw.rotation.y;
                d = Math.atan2(Math.sin(d), Math.cos(d));
                this.yaw.rotation.y += d * Math.min(1, dt * 10);
            }
        }
        this._last = p.clone();

        let state;
        if (forcedState === 'SWIM' || forcedState === 'SWIMMING') state = 'SWIM';
        else if (forcedState === 'DANCE') state = 'DANCE';
        else if (this.speed < 0.3) state = 'IDLE';
        else if (this.speed < 6) state = 'WALK';
        else state = 'RUN';
        this.state = state;

        this.blob.setEnabled(this.useBlob && state !== 'SWIM');

        if (state === 'WALK' || state === 'RUN') this.phase += dt * (3 + this.speed * 0.9);
        else if (state === 'SWIM') this.phase += dt * (3 + Math.min(this.speed, 4) * 0.8);
        else if (state === 'DANCE') this.phase += dt * 5;

        const ph = this.phase;
        const sn = Math.sin(ph);
        const cs = Math.cos(ph);
        const T = { ...ZERO_POSE };

        if (state === 'IDLE') {
            const breath = Math.sin(this.time * 2);
            T.upperX = 0.02 + breath * 0.015;
            T.headY = Math.sin(this.time * 0.6) * 0.15;
            T.armL = 0.05 + breath * 0.02;
            T.armR = -0.05 - breath * 0.02;
            T.armLz = -0.08; T.armRz = 0.08;
            T.elbL = -0.15; T.elbR = -0.15;
        } else if (state === 'WALK' || state === 'RUN') {
            const run = state === 'RUN';
            const a = run ? 1.0 : 0.55;
            T.thL = sn * a;
            T.thR = -sn * a;
            T.kL = 0.1 + Math.max(0, -cs) * (run ? 1.4 : 0.8);
            T.kR = 0.1 + Math.max(0, cs) * (run ? 1.4 : 0.8);
            T.armL = -sn * a * 0.8;
            T.armR = sn * a * 0.8;
            T.armLz = -0.06; T.armRz = 0.06;
            T.elbL = T.elbR = run ? -1.2 : -0.25;
            T.upperX = run ? 0.25 : 0.06;
            T.upperY = sn * (run ? 0.25 : 0.1);
            T.bodyY = Math.abs(cs) * (run ? 0.07 : 0.035);
        } else if (state === 'SWIM') {
            T.pitch = 1.35;
            T.bodyY = -0.25;
            T.headX = -1.2;
            T.armL = -1.6 + sn * 1.7;
            T.armR = -1.6 - sn * 1.7;
            T.elbL = T.elbR = -0.4;
            const f = Math.sin(ph * 2) * 0.35;
            T.thL = f; T.thR = -f;
            T.kL = 0.2 + Math.max(0, f); T.kR = 0.2 + Math.max(0, -f);
        } else if (state === 'DANCE') {
            T.bodyY = Math.abs(sn) * 0.06;
            T.upperX = 0.1;
            T.upperY = sn * 0.35;
            T.headY = sn * 0.2;
            T.armL = -2.4 + Math.sin(ph * 2) * 0.35;
            T.armR = -2.0 + Math.cos(ph * 2) * 0.35;
            T.armLz = -0.5; T.armRz = 0.5;
            T.elbL = T.elbR = -1.0;
            T.thL = sn * 0.3; T.thR = -sn * 0.3;
            T.kL = 0.2 + Math.max(0, sn) * 0.4;
            T.kR = 0.2 + Math.max(0, -sn) * 0.4;
        }

        const k = 1 - Math.exp(-dt * 12);
        const P = this.pose;
        for (const key in T) P[key] += (T[key] - P[key]) * k;

        this.body.position.y = HIP + P.bodyY;
        this.body.rotation.x = P.pitch;
        this.upper.rotation.set(P.upperX, P.upperY, 0);
        this.head.rotation.set(P.headX, P.headY, 0);
        this.arms.L.shoulder.rotation.set(P.armL, 0, P.armLz);
        this.arms.R.shoulder.rotation.set(P.armR, 0, P.armRz);
        this.arms.L.elbow.rotation.x = P.elbL;
        this.arms.R.elbow.rotation.x = P.elbR;
        this.legs.L.thigh.rotation.x = P.thL;
        this.legs.R.thigh.rotation.x = P.thR;
        this.legs.L.knee.rotation.x = P.kL;
        this.legs.R.knee.rotation.x = P.kR;
    }

    dispose() {
        this.root.dispose(false, true);
    }
}
