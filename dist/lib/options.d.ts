export default class TreeOptions {
    seed: number;
    type: string;
    bark: {
        type: string;
        maps: {
            color: any;
            ao: any;
            normal: any;
            roughness: any;
        };
        tint: number;
        flatShading: boolean;
        textured: boolean;
        textureScale: {
            x: number;
            y: number;
        };
    };
    branch: {
        levels: number;
        angle: {
            1: number;
            2: number;
            3: number;
        };
        children: {
            0: number;
            1: number;
            2: number;
        };
        force: {
            direction: {
                x: number;
                y: number;
                z: number;
            };
            strength: number;
        };
        gnarliness: {
            0: number;
            1: number;
            2: number;
            3: number;
        };
        length: {
            0: number;
            1: number;
            2: number;
            3: number;
        };
        radius: {
            0: number;
            1: number;
            2: number;
            3: number;
        };
        sections: {
            0: number;
            1: number;
            2: number;
            3: number;
        };
        segments: {
            0: number;
            1: number;
            2: number;
            3: number;
        };
        start: {
            1: number;
            2: number;
            3: number;
        };
        taper: {
            0: number;
            1: number;
            2: number;
            3: number;
        };
        twist: {
            0: number;
            1: number;
            2: number;
            3: number;
        };
    };
    leaves: {
        type: string;
        map: any;
        billboard: string;
        angle: number;
        count: number;
        start: number;
        size: number;
        sizeVariance: number;
        tint: number;
        alphaTest: number;
        roundedNormals: boolean;
    };
    trellis: {
        enabled: boolean;
        position: {
            x: number;
            y: number;
            z: number;
        };
        width: number;
        height: number;
        spacing: number;
        force: {
            strength: number;
            maxDistance: number;
            falloff: number;
        };
        cylinderRadius: number;
        visible: boolean;
        color: number;
    };
    /**
     * Copies the values from source into this object
     * @param {TreeOptions} source
     */
    copy(source: TreeOptions, target?: this): void;
}
